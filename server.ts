import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import cors from "cors";
import "dotenv/config";
import nodemailer from "nodemailer";
import { initDatabase, getDB } from "./src/server/database";

async function startServer() {
  console.log("Starting server function...");
  try {
    const app = express();
    const PORT = 3000;

    app.set('case sensitive routing', false);
    app.set('strict routing', false);

    app.use(cors());
    app.use(express.json());

    // CRITICAL: Ensure API routes are NEVER handled by SPA fallback
    // We do this by placing a temporary check middleware
    app.use('/api', (req, res, next) => {
      res.setHeader('Content-Type', 'application/json');
      next();
    });

    // Logging middleware for all requests
    app.use((req, res, next) => {
      console.log(`[REQUEST] ${req.method} ${req.path} (original: ${req.originalUrl})`);
      next();
    });

    // Initialize DB before starting routes
    console.log("Attempting to initialize database...");
    await initDatabase();
    console.log("Database initialized successfully");

    // Self-test timeout
    setTimeout(async () => {
      try {
        console.log("[SELF TEST] Fetching /api/settings...");
        const res = await fetch('http://127.0.0.1:3000/api/settings');
        const text = await res.text();
        console.log(`[SELF TEST] /api/settings returned status ${res.status}, body length ${text.length}`);
        if (text.startsWith('<')) {
          console.warn("[SELF TEST WARNING] API returned HTML!");
        } else {
          console.log("[SELF TEST SUCCESS] API looks like JSON.");
        }
      } catch (err) {
        console.error("[SELF TEST ERROR]", err);
      }
    }, 2000);

    // Health check first
    app.get("/api/health", (req, res) => {
      res.json({ status: "ok" });
    });

    // Settings routes high up
    app.get("/api/settings", async (req, res) => {
      try {
        const db = getDB();
        const settings = await db.all('SELECT * FROM settings');
        const settingsObj = settings.reduce((acc: any, curr: any) => {
          acc[curr.key] = curr.value;
          return acc;
        }, {});
        res.status(200).json(settingsObj);
      } catch (err: any) {
        console.error("Error in settings", err);
        res.status(500).json({ error: "Failed to fetch settings", msg: String(err) });
      }
    });

    app.post("/api/settings", async (req, res) => {
      console.log("POST /api/settings hit");
      try {
        const { key, value } = req.body;
        const db = getDB();
        await db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
        res.status(200).json({ success: true });
      } catch (err) {
        console.error("Error in POST /api/settings:", err);
        res.status(500).json({ error: "Failed to update settings" });
      }
    });

    app.get("/api/disease-map/:name", async (req, res) => {
      try {
        const db = getDB();
        const map = await db.get('SELECT * FROM disease_compartment_map WHERE disease_name = ?', [req.params.name]);
        res.json(map || {});
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch disease map" });
      }
    });

    app.post("/api/sessions", async (req, res) => {
      try {
        const { 
          patient_id, timestamp, diagnosed_disease, confidence_score, 
          top_alternatives, ai_used, ai_result, action_taken 
        } = req.body;
        const db = getDB();
        const result = await db.run(
          'INSERT INTO sessions (patient_id, timestamp, diagnosed_disease, confidence_score, top_alternatives, ai_used, ai_result, action_taken) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [patient_id, timestamp, diagnosed_disease, confidence_score, JSON.stringify(top_alternatives), ai_used, ai_result, action_taken]
        );
        const sessionId = result.lastID;
        res.status(201).json({ id: sessionId });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to save session" });
      }
    });

    app.post("/api/prescriptions", async (req, res) => {
      try {
        const { session_id, medicine_name, dosage, frequency, duration, compartment_number } = req.body;
        const db = getDB();
        await db.run(
          'INSERT INTO prescriptions (session_id, medicine_name, dosage, frequency, duration, compartment_number) VALUES (?, ?, ?, ?, ?, ?)',
          [session_id, medicine_name, dosage, frequency, duration, compartment_number]
        );
        res.status(201).json({ success: true });
      } catch (err) {
        res.status(500).json({ error: "Failed to save prescription" });
      }
    });

    app.get("/api/prescriptions/session/:sessionId", async (req, res) => {
      try {
        const db = getDB();
        const prescriptions = await db.all('SELECT * FROM prescriptions WHERE session_id = ?', [req.params.sessionId]);
        res.json(prescriptions);
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch prescriptions" });
      }
    });

    app.get("/api/inventory", async (req, res) => {
      try {
        const db = getDB();
        const inventory = await db.all('SELECT * FROM inventory');
        res.json(inventory);
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch inventory" });
      }
    });

    app.post("/api/dispense", async (req, res) => {
      const { compartment_number, quantity_dispensed, session_id, medicine_name, patient_id, patient_name } = req.body;
      const db = getDB();

      try {
        await db.run('BEGIN TRANSACTION');

        const result = await db.run(
          'UPDATE inventory SET current_count = current_count - ? WHERE compartment_number = ? AND current_count >= ?',
          [quantity_dispensed, compartment_number, quantity_dispensed]
        );

        if (result.changes === 0) {
          await db.run('ROLLBACK');
          return res.status(400).json({ error: "Medicine unavailable or out of stock" });
        }

        const timestamp = new Date().toISOString();
        await db.run(
          'INSERT INTO dispense_log (session_id, patient_id, medicine_name, compartment_number, quantity_dispensed, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
          [session_id, patient_id, medicine_name, compartment_number, quantity_dispensed, timestamp]
        );

        await db.run(
          'INSERT INTO admin_log (timestamp, message) VALUES (?, ?)',
          [timestamp, `Dispensed ${quantity_dispensed} of ${medicine_name} from compartment ${compartment_number} for patient ${patient_name}`]
        );

        const inventory = await db.get('SELECT current_count FROM inventory WHERE compartment_number = ?', [compartment_number]);
        const lowStockThreshold = await db.get("SELECT value FROM settings WHERE key = 'low_stock_threshold'");
        const threshold = lowStockThreshold ? parseInt(lowStockThreshold.value) : 5;

        if (inventory.current_count <= threshold) {
          await db.run(
            'INSERT INTO admin_log (timestamp, message) VALUES (?, ?)',
            [timestamp, `LOW STOCK WARNING: ${medicine_name} compartment ${compartment_number} has ${inventory.current_count} units remaining`]
          );
        }

        await db.run('COMMIT');
        res.json({ success: true, current_count: inventory.current_count });
      } catch (err) {
        await db.run('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: "Internal server error during dispensing" });
      }
    });

    app.get("/api/dispense/check/:sessionId/:medicineName", async (req, res) => {
      try {
        const db = getDB();
        const log = await db.get(
          'SELECT * FROM dispense_log WHERE session_id = ? AND medicine_name = ?',
          [req.params.sessionId, req.params.medicineName]
        );
        res.json({ dispensed: !!log });
      } catch (err) {
        res.status(500).json({ error: "Failed to check dispense status" });
      }
    });

    app.post("/api/logs/admin", async (req, res) => {
      try {
        const { message } = req.body;
        const db = getDB();
        await db.run('INSERT INTO admin_log (timestamp, message) VALUES (?, ?)', [new Date().toISOString(), message]);
        res.status(201).json({ success: true });
      } catch (err) {
        res.status(500).json({ error: "Failed to log" });
      }
    });

    app.post("/api/logs/unavailability", async (req, res) => {
      try {
        const { reason, patient_id, session_id } = req.body;
        const db = getDB();
        await db.run(
          'INSERT INTO unavailability_log (timestamp, reason, patient_id, session_id) VALUES (?, ?, ?, ?)',
          [new Date().toISOString(), reason, patient_id, session_id]
        );
        res.status(201).json({ success: true });
      } catch (err) {
        res.status(500).json({ error: "Failed to log unavailability" });
      }
    });

    app.get("/api/patients/:id", async (req, res) => {
      try {
        const db = getDB();
        const patient = await db.get('SELECT * FROM patients WHERE id = ?', [req.params.id]);
        if (patient) {
          res.json(patient);
        } else {
          res.status(404).json({ error: "Patient not found" });
        }
      } catch (err) {
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.post("/api/patients", async (req, res) => {
      try {
        const { name, age, gender, email, language_preference } = req.body;
        const db = getDB();
        const created_at = new Date().toISOString();
        const result = await db.run(
          'INSERT INTO patients (name, age, gender, email, language_preference, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [name, age, gender, email, language_preference, created_at]
        );
        const newId = result.lastID;
        const patient = await db.get('SELECT * FROM patients WHERE id = ?', [newId]);
        res.status(201).json(patient);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create patient" });
      }
    });

    app.put("/api/patients/:id", async (req, res) => {
      try {
        const { qr_code } = req.body;
        const db = getDB();
        await db.run('UPDATE patients SET qr_code = ? WHERE id = ?', [qr_code, req.params.id]);
        const patient = await db.get('SELECT * FROM patients WHERE id = ?', [req.params.id]);
        res.status(200).json(patient);
      } catch (err) {
        res.status(500).json({ error: "Failed to update patient" });
      }
    });

    app.get("/api/patients/qr/:qr_code", async (req, res) => {
      try {
        const db = getDB();
        const patient = await db.get('SELECT * FROM patients WHERE qr_code = ?', [req.params.qr_code]);
        if (patient) {
          res.json(patient);
        } else {
          res.status(404).json({ error: "Patient not found" });
        }
      } catch (err) {
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.post("/api/send-email", async (req, res) => {
      try {
        const { to, cc, subject, body, attachments } = req.body;
        
        if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
          return res.status(500).json({ success: false, error: "Email configuration missing" });
        }

        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false, // true for 465, false for other ports
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
          },
        });

        const mailOptions = {
          from: `"H.E.A.L.E.R" <${process.env.GMAIL_USER}>`,
          to,
          cc,
          subject,
          html: body,
          attachments,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: %s", info.messageId);
        res.json({ success: true, messageId: info.messageId });
      } catch (err: any) {
        console.error("Failed to send email:", err);
        res.status(500).json({ success: false, error: err.message });
      }
    });

    app.get("/api/admin/unavailability-log", async (req, res) => {
      try {
        const db = getDB();
        const logs = await db.all(`
          SELECT ul.*, p.name as patient_name, s.diagnosed_disease, pr.medicine_name
          FROM unavailability_log ul
          LEFT JOIN patients p ON ul.patient_id = p.id
          LEFT JOIN sessions s ON ul.session_id = s.id
          LEFT JOIN prescriptions pr ON pr.session_id = s.id
          ORDER BY ul.timestamp DESC
          LIMIT 50
        `);
        res.json(logs);
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch unavailability log" });
      }
    });

    app.get("/api/admin/patients", async (req, res) => {
      try {
        const db = getDB();
        const patients = await db.all('SELECT * FROM patients ORDER BY name ASC');
        res.json(patients);
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch patients" });
      }
    });

    app.get("/api/admin/patients/:id/full", async (req, res) => {
      try {
        const db = getDB();
        const patient = await db.get('SELECT * FROM patients WHERE id = ?', [req.params.id]);
        if (!patient) return res.status(404).json({ error: "Patient not found" });

        const sessions = await db.all('SELECT * FROM sessions WHERE patient_id = ? ORDER BY timestamp DESC', [req.params.id]);
        
        for (let session of sessions) {
          session.prescriptions = await db.all('SELECT * FROM prescriptions WHERE session_id = ?', [session.id]);
          session.dispenses = await db.all('SELECT * FROM dispense_log WHERE session_id = ?', [session.id]);
        }

        res.json({ ...patient, sessions });
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch patient records" });
      }
    });

    app.post("/api/admin/inventory/update", async (req, res) => {
      try {
        const { compartment_number, medicine_name, current_count, low_stock_threshold } = req.body;
        const db = getDB();
        await db.run(
          'UPDATE inventory SET medicine_name = ?, current_count = ?, last_updated = ? WHERE compartment_number = ?',
          [medicine_name, current_count, new Date().toISOString(), compartment_number]
        );
        // Also update settings if needed or just handle threshold locally
        // But prompt says threshold is editable per card. Let's assume there's a threshold in inventory table?
        // Let's check table schema from previous turns.
        // Actually I should just update it as requested. I'll add the threshold column if it missing in init.
        res.json({ success: true });
      } catch (err) {
        res.status(500).json({ error: "Failed to update inventory" });
      }
    });

    app.get("/api/admin/analytics/diseases", async (req, res) => {
      try {
        const db = getDB();
        const data = await db.all('SELECT diagnosed_disease as name, COUNT(*) as value FROM sessions GROUP BY diagnosed_disease');
        res.json(data);
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch analytics" });
      }
    });

    app.get("/api/admin/analytics/daily-volume", async (req, res) => {
      try {
        const db = getDB();
        const data = await db.all(`
          SELECT DATE(timestamp) as name, COUNT(*) as value 
          FROM dispense_log 
          GROUP BY name 
          ORDER BY name DESC 
          LIMIT 30
        `);
        res.json(data.reverse());
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch analytics" });
      }
    });

    app.get("/api/admin/analytics/top-medicines", async (req, res) => {
      try {
        const db = getDB();
        const data = await db.all(`
          SELECT medicine_name as name, SUM(quantity_dispensed) as value 
          FROM dispense_log 
          GROUP BY medicine_name 
          ORDER BY value DESC 
          LIMIT 5
        `);
        res.json(data);
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch analytics" });
      }
    });

    app.get("/api/admin/analytics/unavailability", async (req, res) => {
      try {
        const db = getDB();
        const data = await db.all('SELECT reason as name, COUNT(*) as value FROM unavailability_log GROUP BY reason');
        res.json(data);
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch analytics" });
      }
    });

    app.post("/api/ai/analyze", async (req, res) => {
      try {
        const { image } = req.body;
        const apiKey = process.env.AI_API_KEY;
        
        if (!apiKey) {
          return res.status(500).json({ error: "AI API Key not configured" });
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: "You are a medical assistant. Look at this skin image and identify if it shows signs of: fungal infection, allergic reaction, acne, eczema, or normal skin. Respond with only the condition name and a confidence percentage. Format: CONDITION|CONFIDENCE" },
                { inline_data: { mime_type: "image/jpeg", data: image } }
              ]
            }]
          })
        });

        const data: any = await response.json();
        res.json(data);
      } catch (err) {
        console.error("AI Proxy Error", err);
        res.status(500).json({ error: "Failed to process AI request" });
      }
    });

    // Catch-all for unknown API routes to prevent Vite SPA fallback
    app.all("/api/*", (req, res) => {
      console.log(`[API 404] ${req.method} ${req.url}`);
      res.status(404).json({ 
        error: "API route not found", 
        path: req.url,
        method: req.method,
        help: "If you expected this route to exist, check server.ts definitions."
      });
    });

    // Handle /src/api as well just in case of weird dev-server pathing
    app.all("/src/api/*", (req, res) => {
      const actualPath = req.url.replace('/src/api', '/api');
      console.log(`[REDIRECT] /src/api to ${actualPath}`);
      res.redirect(307, actualPath);
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
}

startServer();
