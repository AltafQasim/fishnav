import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  offlineTileManager,
  type DownloadedRegionMeta,
  type DownloadProgress,
  type OfflineRegion,
} from '@/services/offline-tile-manager';

export type OfflineMapContextType = {
  downloadProgress: DownloadProgress | null;
  isDownloading: boolean;
  activeRegionId: string | null;
  downloadedRegions: DownloadedRegionMeta[];
  storageUsageMb: number;
  startDownload: (region: OfflineRegion) => Promise<boolean>;
  cancelDownload: () => void;
  refreshOfflineStatus: () => Promise<void>;
  clearAllTiles: () => Promise<boolean>;
};

const OfflineMapContext = createContext<OfflineMapContextType | undefined>(undefined);

export function OfflineMapProvider({ children }: { children: React.ReactNode }) {
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(() =>
    offlineTileManager.getCurrentProgress(),
  );
  const [downloadedRegions, setDownloadedRegions] = useState<DownloadedRegionMeta[]>([]);
  const [storageUsageMb, setStorageUsageMb] = useState<number>(0);

  const refreshOfflineStatus = useCallback(async () => {
    try {
      const [regions, mb] = await Promise.all([
        offlineTileManager.getDownloadedRegions(),
        offlineTileManager.getOfflineStorageUsageMb(),
      ]);
      setDownloadedRegions(regions);
      setStorageUsageMb(mb);
    } catch (err) {
      console.warn('[OfflineMapContext] Error refreshing offline status:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshOfflineStatus();
  }, [refreshOfflineStatus]);

  // Subscribe to singleton download manager progress (persists even when Settings sheet unmounts)
  useEffect(() => {
    const unsubscribe = offlineTileManager.subscribeToProgress((progress) => {
      setDownloadProgress(progress);
      // When a download finishes, automatically refresh downloaded regions and cache size
      if (progress && !progress.isDownloading) {
        refreshOfflineStatus();
      }
    });

    return unsubscribe;
  }, [refreshOfflineStatus]);

  const startDownload = useCallback(
    async (region: OfflineRegion): Promise<boolean> => {
      const success = await offlineTileManager.startDownload(region);
      await refreshOfflineStatus();
      return success;
    },
    [refreshOfflineStatus],
  );

  const cancelDownload = useCallback(() => {
    offlineTileManager.cancelDownload();
  }, []);

  const clearAllTiles = useCallback(async (): Promise<boolean> => {
    const success = await offlineTileManager.clearAllOfflineTiles();
    await refreshOfflineStatus();
    return success;
  }, [refreshOfflineStatus]);

  return (
    <OfflineMapContext.Provider
      value={{
        downloadProgress,
        isDownloading: Boolean(downloadProgress?.isDownloading),
        activeRegionId: downloadProgress?.isDownloading ? downloadProgress.regionId : null,
        downloadedRegions,
        storageUsageMb,
        startDownload,
        cancelDownload,
        refreshOfflineStatus,
        clearAllTiles,
      }}
    >
      {children}
    </OfflineMapContext.Provider>
  );
}

export function useOfflineDownload() {
  const context = useContext(OfflineMapContext);
  if (!context) {
    throw new Error('useOfflineDownload must be used within an OfflineMapProvider');
  }
  return context;
}
