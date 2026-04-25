import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

async function test() {
  const dbPath = path.resolve(process.cwd(), 'healer.sqlite');
  try {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    const settings = await db.all('SELECT * FROM settings');
    console.log("Settings:", settings);
  } catch (err) {
    console.error("DB Error:", err);
  }
}
test();
