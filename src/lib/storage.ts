import { get, set } from 'idb-keyval';

export async function loadFromDB<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const val = await get<T>(key);
    return val !== undefined ? val : defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function saveToDB<T>(key: string, value: T): Promise<void> {
  try {
    await set(key, value);
  } catch {
    // Fallback to localStorage
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch { /* ignore */ }
  }
}
