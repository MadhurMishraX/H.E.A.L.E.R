const getApiBase = () => {
  // Use relative paths by default.
  // If running locally with separate Vite (5173) and Express servers, point to Express (3000).
  if (typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && 
      window.location.port !== '3000') {
    return 'http://localhost:3000/api';
  }
  return '/api';
};

const API_BASE = getApiBase();

export const getSetting = async (key: string): Promise<string | null> => {
  try {
    const url = `${API_BASE}/settings?t=${Date.now()}`;
    const response = await fetch(url, { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
    if (!response.ok) {
      const text = await response.text();
      console.error(`Failed to get setting ${key}. Status: ${response.status}, URL: ${url}, Body: ${text.substring(0, 100)}`);
      return null;
    }
    const settings = await response.json();
    return settings[key] || null;
  } catch (err) {
    console.error(`Failed to get setting ${key}:`, err);
    return null;
  }
};

export const getAllSettings = async (): Promise<Record<string, string>> => {
  try {
    const url = `${API_BASE}/settings?t=${Date.now()}`;
    const response = await fetch(url, { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
    if (!response.ok) {
      const text = await response.text();
      console.error(`Failed to get all settings. Status: ${response.status}, URL: ${url}, Body: ${text.substring(0, 100)}`);
      return {};
    }
    const data = await response.json();
    // Ensure we are actually getting an object and not HTML
    if (typeof data !== 'object' || data === null) {
      console.error('Data received from /api/settings is not an object:', data);
      return {};
    }
    return data;
  } catch (err) {
    console.error('Failed to get all settings:', err);
    return {};
  }
};

export const setSetting = async (key: string, value: string): Promise<boolean> => {
  try {
    const url = `${API_BASE}/settings`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      body: JSON.stringify({ key, value })
    });
    if (!response.ok) {
      const text = await response.text();
      console.error(`Failed to set setting ${key}. Status: ${response.status}, URL: ${url}, Body: ${text.substring(0, 100)}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Failed to set setting ${key}:`, err);
    return false;
  }
};
