import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const LEAFLET_DIR_NAME = 'fishnav_leaflet_cache';
const LEAFLET_JS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';

let cachedJsContent: string | null = null;
let cachedCssContent: string | null = null;
let isInitializing = false;

function getLeafletDirectory(): string | null {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
    return null;
  }
  return `${FileSystem.documentDirectory}${LEAFLET_DIR_NAME}/`;
}

async function ensureDirectory(): Promise<string | null> {
  const dir = getLeafletDirectory();
  if (!dir) return null;
  try {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
    return dir;
  } catch (err) {
    console.warn('[LeafletCache] Directory creation error:', err);
    return null;
  }
}

export const leafletCacheService = {
  /**
   * Check if Leaflet is already cached on the device
   */
  async isCached(): Promise<boolean> {
    if (cachedJsContent && cachedCssContent) return true;
    const dir = getLeafletDirectory();
    if (!dir) return false;

    try {
      const jsInfo = await FileSystem.getInfoAsync(`${dir}leaflet.js`);
      const cssInfo = await FileSystem.getInfoAsync(`${dir}leaflet.css`);
      return Boolean(jsInfo.exists && cssInfo.exists);
    } catch {
      return false;
    }
  },

  /**
   * Retrieve cached Leaflet JS and CSS content for direct inlining into WebView HTML.
   * Returns null if not yet cached.
   */
  async getCachedAssets(): Promise<{ js: string | null; css: string | null }> {
    if (cachedJsContent && cachedCssContent) {
      return { js: cachedJsContent, css: cachedCssContent };
    }

    const dir = getLeafletDirectory();
    if (!dir) return { js: null, css: null };

    try {
      const jsPath = `${dir}leaflet.js`;
      const cssPath = `${dir}leaflet.css`;

      const [jsInfo, cssInfo] = await Promise.all([
        FileSystem.getInfoAsync(jsPath),
        FileSystem.getInfoAsync(cssPath),
      ]);

      if (jsInfo.exists && cssInfo.exists) {
        const [js, css] = await Promise.all([
          FileSystem.readAsStringAsync(jsPath, { encoding: FileSystem.EncodingType.UTF8 }),
          FileSystem.readAsStringAsync(cssPath, { encoding: FileSystem.EncodingType.UTF8 }),
        ]);
        cachedJsContent = js;
        cachedCssContent = css;
        return { js, css };
      }
    } catch (err) {
      console.warn('[LeafletCache] Failed reading cached Leaflet assets:', err);
    }

    return { js: null, css: null };
  },

  /**
   * Pre-cache Leaflet JS and CSS from CDN to local device filesystem.
   * Called on app boot or dockside connection.
   */
  async preCacheAssets(): Promise<boolean> {
    if (isInitializing) return false;
    isInitializing = true;

    try {
      const dir = await ensureDirectory();
      if (!dir) {
        isInitializing = false;
        return false;
      }

      const jsPath = `${dir}leaflet.js`;
      const cssPath = `${dir}leaflet.css`;

      // Check if already on disk
      const jsInfo = await FileSystem.getInfoAsync(jsPath);
      const cssInfo = await FileSystem.getInfoAsync(cssPath);

      if (!jsInfo.exists) {
        console.log('[LeafletCache] Downloading Leaflet JS to offline storage...');
        const jsRes = await FileSystem.downloadAsync(LEAFLET_JS_URL, jsPath);
        if (jsRes.status && jsRes.status !== 200) {
          await FileSystem.deleteAsync(jsPath, { idempotent: true });
          isInitializing = false;
          return false;
        }
      }

      if (!cssInfo.exists) {
        console.log('[LeafletCache] Downloading Leaflet CSS to offline storage...');
        const cssRes = await FileSystem.downloadAsync(LEAFLET_CSS_URL, cssPath);
        if (cssRes.status && cssRes.status !== 200) {
          await FileSystem.deleteAsync(cssPath, { idempotent: true });
          isInitializing = false;
          return false;
        }
      }

      // Populate memory cache
      const [js, css] = await Promise.all([
        FileSystem.readAsStringAsync(jsPath, { encoding: FileSystem.EncodingType.UTF8 }),
        FileSystem.readAsStringAsync(cssPath, { encoding: FileSystem.EncodingType.UTF8 }),
      ]);

      cachedJsContent = js;
      cachedCssContent = css;
      console.log('[LeafletCache] Leaflet successfully cached offline on device.');
      isInitializing = false;
      return true;
    } catch (err) {
      console.warn('[LeafletCache] Failed to pre-cache Leaflet:', err);
      isInitializing = false;
      return false;
    }
  },
};
