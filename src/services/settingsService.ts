import { db } from '../utils/db';

export const getSetting = async (key: string): Promise<string | null> => {
  try {
    const setting = await db.settings.where('key').equals(key).first();
    return setting ? setting.value : null;
  } catch (err) {
    console.error(`Failed to get setting ${key}:`, err);
    return null;
  }
};

export const getAllSettings = async (): Promise<Record<string, string>> => {
  try {
    const settings = await db.settings.toArray();
    return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
  } catch (err) {
    console.error('Failed to get all settings:', err);
    return {};
  }
};

export const setSetting = async (key: string, value: string): Promise<boolean> => {
  try {
    const existing = await db.settings.where('key').equals(key).first();
    if (existing && existing.id) {
      await db.settings.update(existing.id, { value });
    } else {
      await db.settings.add({ key, value });
    }
    return true;
  } catch (err) {
    console.error(`Failed to set setting ${key}:`, err);
    return false;
  }
};
