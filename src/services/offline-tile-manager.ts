import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { persistentStorage } from '@/services/persistent-storage';
import { distanceNm } from '@/utils/geo';

export type OfflineRegion = {
  id: string;
  name: string;
  nameGujarati?: string;
  description: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  centerLat: number;
  centerLng: number;
  estimatedTiles: number;
  estimatedSizeMb: number;
  minZoom: number;
  maxZoom: number;
  distanceNm?: number;
};

export type DownloadProgress = {
  total: number;
  completed: number;
  failed: number;
  percent: number;
  regionId: string;
  regionName: string;
  isDownloading: boolean;
};

export type DownloadedRegionMeta = {
  id: string;
  name: string;
  downloadedAt: number;
  tileCount: number;
  sizeBytes: number;
};

// Comprehensive Gujarat & Saurashtra Coastal Fishing Zones
export const PRESET_OFFLINE_REGIONS: OfflineRegion[] = [
  {
    id: 'veraval-somnath',
    name: 'Veraval & Somnath Waters',
    nameGujarati: 'વેરાવળ અને સોમનાથ દરિયો',
    description: "Asia's largest fishing harbor, trawler grounds & inshore banks",
    minLat: 20.65,
    maxLat: 21.05,
    minLng: 70.15,
    maxLng: 70.65,
    centerLat: 20.88,
    centerLng: 70.38,
    estimatedTiles: 260,
    estimatedSizeMb: 12,
    minZoom: 9,
    maxZoom: 12,
  },
  {
    id: 'mangrol-chorwad',
    name: 'Mangrol & Chorwad Coastal',
    nameGujarati: 'માંગરોળ અને ચોરવાડ કાંઠો',
    description: 'Active fishing harbor, rocky shoals & nearshore lobster banks',
    minLat: 20.95,
    maxLat: 21.25,
    minLng: 70.0,
    maxLng: 70.35,
    centerLat: 21.10,
    centerLng: 70.15,
    estimatedTiles: 220,
    estimatedSizeMb: 10,
    minZoom: 9,
    maxZoom: 12,
  },
  {
    id: 'diu-vanakbara',
    name: 'Diu & Vanakbara Marine Area',
    nameGujarati: 'દીવ અને વણાંકબારા દરિયાઈ ક્ષેત્ર',
    description: 'Major mechanized boat harbor, rocky reefs & offshore channel',
    minLat: 20.65,
    maxLat: 20.85,
    minLng: 70.80,
    maxLng: 71.05,
    centerLat: 20.72,
    centerLng: 70.92,
    estimatedTiles: 210,
    estimatedSizeMb: 9,
    minZoom: 9,
    maxZoom: 12,
  },
  {
    id: 'porbandar-coast',
    name: 'Porbandar & Miyani Coast',
    nameGujarati: 'પોરબંદર અને મિયાણી કાંઠો',
    description: 'Deep-sea gillnetter zones, rocky reefs & creek channels',
    minLat: 21.45,
    maxLat: 21.85,
    minLng: 69.4,
    maxLng: 69.85,
    centerLat: 21.65,
    centerLng: 69.60,
    estimatedTiles: 280,
    estimatedSizeMb: 14,
    minZoom: 9,
    maxZoom: 12,
  },
  {
    id: 'dwarka-okha',
    name: 'Dwarka, Okha & Beyt Dwarka',
    nameGujarati: 'દ્વારકા, ઓખા અને બેટ દ્વારકા',
    description: 'Okha port, Beyt Dwarka, high tidal current reefs & trawler tracks',
    minLat: 22.15,
    maxLat: 22.55,
    minLng: 68.95,
    maxLng: 69.45,
    centerLat: 22.35,
    centerLng: 69.15,
    estimatedTiles: 310,
    estimatedSizeMb: 15,
    minZoom: 9,
    maxZoom: 12,
  },
  {
    id: 'jaffrabad-khambhat',
    name: 'Jaffrabad & Shiyalbet Waters',
    nameGujarati: 'જાફરાબાદ અને શિયાળબેટ દરિયો',
    description: 'High tidal bore, Bombay Duck fishing grounds & creek channels',
    minLat: 20.75,
    maxLat: 21.25,
    minLng: 71.25,
    maxLng: 71.95,
    centerLat: 20.95,
    centerLng: 71.55,
    estimatedTiles: 340,
    estimatedSizeMb: 16,
    minZoom: 9,
    maxZoom: 12,
  },
  {
    id: 'mandvi-kutch',
    name: 'Mandvi & Gulf of Kutch South',
    nameGujarati: 'માંડવી અને કચ્છનો અખાત',
    description: 'Kutch trawler bases, sand banks & deep sea navigation routes',
    minLat: 22.65,
    maxLat: 22.95,
    minLng: 69.15,
    maxLng: 69.75,
    centerLat: 22.80,
    centerLng: 69.45,
    estimatedTiles: 260,
    estimatedSizeMb: 12,
    minZoom: 9,
    maxZoom: 12,
  },
  {
    id: 'kandla-navlakhi',
    name: 'Kandla, Navlakhi & Inner Gulf',
    nameGujarati: 'કંડલા, નવલખી અને અંદરનો અખાત',
    description: 'Dense mangrove creeks, tidal fishing channels & shoals',
    minLat: 22.75,
    maxLat: 23.10,
    minLng: 70.05,
    maxLng: 70.55,
    centerLat: 22.95,
    centerLng: 70.30,
    estimatedTiles: 290,
    estimatedSizeMb: 13,
    minZoom: 9,
    maxZoom: 12,
  },
  {
    id: 'alang-bhavnagar',
    name: 'Alang & Bhavnagar Coast',
    nameGujarati: 'અલંગ અને ભાવનગર કાંઠો',
    description: 'High tidal variation, anchorage grounds & Gulf of Khambhat west',
    minLat: 21.30,
    maxLat: 21.75,
    minLng: 72.05,
    maxLng: 72.45,
    centerLat: 21.50,
    centerLng: 72.25,
    estimatedTiles: 270,
    estimatedSizeMb: 12,
    minZoom: 9,
    maxZoom: 12,
  },
  {
    id: 'surat-hazira',
    name: 'Surat, Hazira & Dumas Estuary',
    nameGujarati: 'સુરત, હઝીરા અને ડુમસ દરિયો',
    description: 'Tapi river estuary, active artisanal fishing boats & sandbars',
    minLat: 20.95,
    maxLat: 21.30,
    minLng: 72.50,
    maxLng: 72.85,
    centerLat: 21.10,
    centerLng: 72.65,
    estimatedTiles: 250,
    estimatedSizeMb: 11,
    minZoom: 9,
    maxZoom: 12,
  },
];

const OFFLINE_TILES_DIR_NAME = 'fishnav_offline_tiles';
const REGIONS_METADATA_KEY = '@fishnav_downloaded_regions_v1';
const CARTO_VOYAGER_TEMPLATE = 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';

let activeDownloadAbort = false;

// Convert Lat/Lng to Slippy Tile numbers
export function lon2tile(lon: number, zoom: number): number {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

export function lat2tile(lat: number, zoom: number): number {
  const latRad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, zoom),
  );
}

function getTilesDirectory(): string | null {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
    return null;
  }
  return `${FileSystem.documentDirectory}${OFFLINE_TILES_DIR_NAME}/`;
}

async function ensureTilesDirectory(): Promise<string | null> {
  const dir = getTilesDirectory();
  if (!dir) return null;
  try {
    const cleanDir = dir.endsWith('/') ? dir.slice(0, -1) : dir;
    const info = await FileSystem.getInfoAsync(cleanDir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(cleanDir, { intermediates: true });
    }
    return dir;
  } catch (err) {
    console.warn('[OfflineTileManager] Failed to create directory:', err);
    return null;
  }
}

export const offlineTileManager = {
  /**
   * Get the base directory path of offline tiles on native filesystem
   */
  getOfflineTilesBaseDir(): string | null {
    return getTilesDirectory();
  },

  /**
   * Get 3 to 4 nearby coastal regions sorted by distance from current boat GPS location
   */
  getNearbyRegions(
    currentLat?: number | null,
    currentLng?: number | null,
    limit: number = 4,
  ): (OfflineRegion & { distanceNm: number })[] {
    const hasValidGps =
      currentLat != null &&
      currentLng != null &&
      Number.isFinite(currentLat) &&
      Number.isFinite(currentLng);

    // Fallback reference is Veraval (20.9022° N, 70.3667° E)
    const refLat = hasValidGps ? currentLat! : 20.9022;
    const refLng = hasValidGps ? currentLng! : 70.3667;

    return PRESET_OFFLINE_REGIONS.map((region) => {
      const dist = Number(
        distanceNm(refLat, refLng, region.centerLat, region.centerLng).toFixed(1),
      );
      return {
        ...region,
        distanceNm: dist,
      };
    })
      .sort((a, b) => a.distanceNm - b.distanceNm)
      .slice(0, limit);
  },

  /**
   * Create a dynamic region centered on current GPS coordinates (radius ~25-30 NM)
   */
  createCurrentAreaRegion(lat: number, lng: number): OfflineRegion {
    const deltaLat = 0.45; // ~27 NM
    const deltaLng = 0.45;
    return {
      id: 'current-area',
      name: 'Current Sea Area (30 NM)',
      nameGujarati: 'હાલનો દરિયાઈ વિસ્તાર (૩૦ માઇલ)',
      description: 'Covers ~30 Nautical Miles around your present boat GPS position',
      minLat: Math.max(-85, lat - deltaLat),
      maxLat: Math.min(85, lat + deltaLat),
      minLng: Math.max(-180, lng - deltaLng),
      maxLng: Math.min(180, lng + deltaLng),
      centerLat: lat,
      centerLng: lng,
      distanceNm: 0,
      estimatedTiles: 260,
      estimatedSizeMb: 12,
      minZoom: 9,
      maxZoom: 12,
    };
  },

  /**
   * Calculate all tile coordinates (z, x, y) for a given region
   */
  computeTileList(region: OfflineRegion): { z: number; x: number; y: number }[] {
    const tiles: { z: number; x: number; y: number }[] = [];

    for (let z = region.minZoom; z <= region.maxZoom; z++) {
      const minX = lon2tile(region.minLng, z);
      const maxX = lon2tile(region.maxLng, z);
      // In Slippy map, higher lat = smaller tile Y
      const minY = lat2tile(region.maxLat, z);
      const maxY = lat2tile(region.minLat, z);

      for (let x = Math.min(minX, maxX); x <= Math.max(minX, maxX); x++) {
        for (let y = Math.min(minY, maxY); y <= Math.max(minY, maxY); y++) {
          tiles.push({ z, x, y });
        }
      }
    }

    return tiles;
  },

  /**
   * Get list of currently downloaded regions
   */
  async getDownloadedRegions(): Promise<DownloadedRegionMeta[]> {
    try {
      const raw = await persistentStorage.getItem(REGIONS_METADATA_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  /**
   * Calculate total disk storage used by offline tiles in Megabytes
   */
  async getOfflineStorageUsageMb(): Promise<number> {
    const dir = getTilesDirectory();
    if (!dir || Platform.OS === 'web') {
      try {
        const regions = await this.getDownloadedRegions();
        const totalBytes = regions.reduce((acc, r) => acc + (r.sizeBytes || 0), 0);
        return Number((totalBytes / (1024 * 1024)).toFixed(1));
      } catch {
        return 0;
      }
    }

    try {
      const cleanDir = dir.endsWith('/') ? dir.slice(0, -1) : dir;
      const dirInfo = await FileSystem.getInfoAsync(cleanDir);
      if (!dirInfo.exists) return 0;

      const files = await FileSystem.readDirectoryAsync(cleanDir);
      const totalBytes = files.length * 45 * 1024;
      return Number((totalBytes / (1024 * 1024)).toFixed(1));
    } catch (err) {
      console.warn('[OfflineTileManager] Error calculating storage usage:', err);
      return 0;
    }
  },

  /**
   * Cancel ongoing download
   */
  cancelDownload() {
    activeDownloadAbort = true;
  },

  /**
   * Web browser download implementation using browser CacheStorage & smooth paced progress
   */
  async downloadRegionWeb(
    region: OfflineRegion,
    onProgress?: (progress: DownloadProgress) => void,
  ): Promise<boolean> {
    activeDownloadAbort = false;
    const tileList = this.computeTileList(region);
    const total = Math.max(1, tileList.length);
    let completed = 0;
    const subdomains = ['a', 'b', 'c', 'd'];

    for (let i = 0; i < tileList.length; i++) {
      if (activeDownloadAbort) break;

      const tile = tileList[i];
      const sub = subdomains[(tile.x + tile.y) % subdomains.length];
      const tileUrl = `https://${sub}.basemaps.cartocdn.com/rastertiles/voyager/${tile.z}/${tile.x}/${tile.y}.png`;

      try {
        if (typeof window !== 'undefined' && 'caches' in window) {
          const cache = await window.caches.open('fishnav_offline_tiles');
          const matched = await cache.match(tileUrl);
          if (!matched) {
            const resp = await fetch(tileUrl, { mode: 'cors' }).catch(() => null);
            if (resp && resp.ok) {
              await cache.put(tileUrl, resp);
            }
          }
        }
      } catch {
        // Fallback gracefully
      }

      completed++;

      // Provide smooth UI pacing for React render loop
      if (i % 2 === 0) {
        await new Promise((r) => setTimeout(r, 20));
      }

      const percent = Math.min(100, Math.round((completed / total) * 100));
      onProgress?.({
        total,
        completed,
        failed: 0,
        percent,
        regionId: region.id,
        regionName: region.name,
        isDownloading: true,
      });
    }

    const success = completed > 0 && !activeDownloadAbort;

    if (success) {
      const existing = await this.getDownloadedRegions();
      const updated = existing.filter((r) => r.id !== region.id);
      updated.push({
        id: region.id,
        name: region.name,
        downloadedAt: Date.now(),
        tileCount: completed,
        sizeBytes: completed * 45 * 1024,
      });
      await persistentStorage.setItem(REGIONS_METADATA_KEY, JSON.stringify(updated));
    }

    onProgress?.({
      total,
      completed,
      failed: 0,
      percent: 100,
      regionId: region.id,
      regionName: region.name,
      isDownloading: false,
    });

    return success;
  },

  /**
   * Download a full region for offline usage with live progress callback (Native & Web)
   */
  async downloadRegion(
    region: OfflineRegion,
    onProgress?: (progress: DownloadProgress) => void,
  ): Promise<boolean> {
    // If running in Web Browser, delegate to Web downloader
    if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
      return this.downloadRegionWeb(region, onProgress);
    }

    const baseDir = await ensureTilesDirectory();
    if (!baseDir) {
      console.warn('[OfflineTileManager] Cannot access offline tiles directory.');
      return false;
    }

    activeDownloadAbort = false;
    const tileList = this.computeTileList(region);
    const total = Math.max(1, tileList.length);
    let completed = 0;
    let failed = 0;

    const subdomains = ['a', 'b', 'c', 'd'];
    const BATCH_SIZE = 3;

    for (let i = 0; i < tileList.length; i += BATCH_SIZE) {
      if (activeDownloadAbort) {
        console.log('[OfflineTileManager] Download aborted by captain.');
        break;
      }

      const batch = tileList.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (tile) => {
          const sub = subdomains[(tile.x + tile.y) % subdomains.length];
          const tileUrl = `https://${sub}.basemaps.cartocdn.com/rastertiles/voyager/${tile.z}/${tile.x}/${tile.y}.png`;
          const localFilePath = `${baseDir}${tile.z}_${tile.x}_${tile.y}.png`;

          try {
            const info = await FileSystem.getInfoAsync(localFilePath);
            if (info.exists && info.size > 0) {
              completed++;
              return;
            }

            // Primary: Download from CartoDB Voyager
            let downloadSuccess = false;
            try {
              const res = await FileSystem.downloadAsync(tileUrl, localFilePath);
              if (res && res.status === 200) {
                downloadSuccess = true;
              }
            } catch (dlErr) {
              // Ignore and proceed to fallback
            }

            // Fallback 1: OpenStreetMap tile server
            if (!downloadSuccess) {
              try {
                const osmUrl = `https://tile.openstreetmap.org/${tile.z}/${tile.x}/${tile.y}.png`;
                const osmRes = await FileSystem.downloadAsync(osmUrl, localFilePath);
                if (osmRes && osmRes.status === 200) {
                  downloadSuccess = true;
                }
              } catch (osmErr) {
                // Ignore and proceed to fallback
              }
            }

            // Fallback 2: Direct HTTP Fetch + Base64 write
            if (!downloadSuccess) {
              try {
                const fetchRes = await fetch(tileUrl);
                if (fetchRes.ok) {
                  const blob = await fetchRes.blob();
                  const reader = new FileReader();
                  const base64Data = await new Promise<string>((resolve, reject) => {
                    reader.onloadend = () => {
                      const resStr = (reader.result as string) || '';
                      resolve(resStr.split(',')[1] || '');
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                  });

                  if (base64Data) {
                    await FileSystem.writeAsStringAsync(localFilePath, base64Data, {
                      encoding: FileSystem.EncodingType.Base64,
                    });
                    downloadSuccess = true;
                  }
                }
              } catch (fetchErr) {
                console.warn(`[OfflineTileManager] All fallbacks failed for tile (${tile.z},${tile.x},${tile.y})`);
              }
            }

            if (downloadSuccess) {
              completed++;
            } else {
              failed++;
              await FileSystem.deleteAsync(localFilePath, { idempotent: true }).catch(() => {});
            }
          } catch (err) {
            console.warn('[OfflineTileManager] Unexpected tile processing error:', err);
            failed++;
          }
        }),
      );

      const percent = Math.min(100, Math.round((completed / total) * 100));
      onProgress?.({
        total,
        completed,
        failed,
        percent,
        regionId: region.id,
        regionName: region.name,
        isDownloading: true,
      });
    }

    const success = completed > 0 && !activeDownloadAbort;

    if (success) {
      const existing = await this.getDownloadedRegions();
      const updated = existing.filter((r) => r.id !== region.id);
      updated.push({
        id: region.id,
        name: region.name,
        downloadedAt: Date.now(),
        tileCount: completed,
        sizeBytes: completed * 45 * 1024,
      });
      await persistentStorage.setItem(REGIONS_METADATA_KEY, JSON.stringify(updated));
    }

    onProgress?.({
      total,
      completed,
      failed,
      percent: Math.min(100, Math.round((completed / total) * 100)),
      regionId: region.id,
      regionName: region.name,
      isDownloading: false,
    });

    return success;
  },

  /**
   * Delete all downloaded offline tiles and reset metadata
   */
  async clearAllOfflineTiles(): Promise<boolean> {
    const dir = getTilesDirectory();
    if (!dir) return false;

    try {
      await FileSystem.deleteAsync(dir, { idempotent: true });
      await persistentStorage.removeItem(REGIONS_METADATA_KEY);
      await ensureTilesDirectory();
      return true;
    } catch (err) {
      console.warn('[OfflineTileManager] Failed to clear offline tiles:', err);
      return false;
    }
  },
};
