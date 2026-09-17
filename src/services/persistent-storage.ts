import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * FishNavPro Unified Persistent Offline Storage Service
 *
 * Provides resilient, 100% offline data persistence across:
 * - Native Mobile (Android & iOS) via expo-file-system documentDirectory
 * - Web Browsers via window.localStorage
 * - Instant In-Memory Cache for zero-latency UI rendering
 */

const STORAGE_DIR_NAME = 'fishnav_storage';
const memoryCache = new Map<string, string>();
let isDirInitialized = false;

function sanitizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function getStorageDirectory(): string | null {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
    return null;
  }
  return `${FileSystem.documentDirectory}${STORAGE_DIR_NAME}/`;
}

async function ensureDirectoryExists(): Promise<string | null> {
  const dir = getStorageDirectory();
  if (!dir) return null;

  if (isDirInitialized) return dir;

  try {
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
    isDirInitialized = true;
    return dir;
  } catch (err) {
    console.warn('[PersistentStorage] Failed to create directory:', err);
    return null;
  }
}

export const persistentStorage = {
  /**
   * Read raw string value for key
   */
  async getItem(key: string): Promise<string | null> {
    // 1. Check in-memory fast cache first
    if (memoryCache.has(key)) {
      return memoryCache.get(key) ?? null;
    }

    // 2. Web fallback to localStorage
    if (Platform.OS === 'web' || typeof window !== 'undefined' && window.localStorage && !FileSystem.documentDirectory) {
      try {
        const val = window.localStorage.getItem(key);
        if (val !== null) {
          memoryCache.set(key, val);
        }
        return val;
      } catch {
        return null;
      }
    }

    // 3. Native mobile: read from device filesystem
    try {
      const dir = await ensureDirectoryExists();
      if (!dir) {
        // Fallback to web localStorage if available
        if (typeof localStorage !== 'undefined') {
          return localStorage.getItem(key);
        }
        return null;
      }

      const filePath = `${dir}${sanitizeKey(key)}.json`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        return null;
      }

      const content = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      memoryCache.set(key, content);
      return content;
    } catch (err) {
      console.warn(`[PersistentStorage] Failed to read key "${key}":`, err);
      return null;
    }
  },

  /**
   * Save raw string value for key
   */
  async setItem(key: string, value: string): Promise<void> {
    // Immediately update memory cache
    memoryCache.set(key, value);

    // Web fallback
    if (Platform.OS === 'web' || typeof window !== 'undefined' && window.localStorage && !FileSystem.documentDirectory) {
      try {
        window.localStorage.setItem(key, value);
      } catch (err) {
        console.warn(`[PersistentStorage] Web localStorage save failed for "${key}":`, err);
      }
      return;
    }

    // Native mobile: save to device filesystem
    try {
      const dir = await ensureDirectoryExists();
      if (!dir) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
        }
        return;
      }

      const filePath = `${dir}${sanitizeKey(key)}.json`;
      await FileSystem.writeAsStringAsync(filePath, value, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } catch (err) {
      console.warn(`[PersistentStorage] Failed to write key "${key}":`, err);
    }
  },

  /**
   * Remove key from storage
   */
  async removeItem(key: string): Promise<void> {
    memoryCache.delete(key);

    if (Platform.OS === 'web' || typeof window !== 'undefined' && window.localStorage && !FileSystem.documentDirectory) {
      try {
        window.localStorage.removeItem(key);
      } catch {}
      return;
    }

    try {
      const dir = await ensureDirectoryExists();
      if (dir) {
        const filePath = `${dir}${sanitizeKey(key)}.json`;
        await FileSystem.deleteAsync(filePath, { idempotent: true });
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (err) {
      console.warn(`[PersistentStorage] Failed to remove key "${key}":`, err);
    }
  },

  /**
   * Helper to parse stored JSON or return default fallback
   */
  async getJSON<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const raw = await this.getItem(key);
      if (raw === null || raw === undefined) {
        return defaultValue;
      }
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn(`[PersistentStorage] Failed to parse JSON for "${key}":`, err);
      return defaultValue;
    }
  },

  /**
   * Helper to store JSON-serializable object
   */
  async setJSON<T>(key: string, value: T): Promise<void> {
    try {
      const stringified = JSON.stringify(value);
      await this.setItem(key, stringified);
    } catch (err) {
      console.warn(`[PersistentStorage] Failed to serialize JSON for "${key}":`, err);
    }
  },
};
