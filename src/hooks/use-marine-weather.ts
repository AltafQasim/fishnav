import { useCallback, useEffect, useRef, useState } from 'react';

import { useUserLocation } from '@/hooks/use-user-location';
import {
  CachedMarinePayload,
  calculateAstronomicalTides,
  fetchLiveMarineForecast,
  getBaselineMarineData,
  loadFromStorage,
} from '@/services/marine-weather-service';

export type WeatherSyncStatus = 'online' | 'offline-cached' | 'syncing';

export function useMarineWeather() {
  const { location } = useUserLocation();
  const [data, setData] = useState<CachedMarinePayload>(() => getBaselineMarineData());
  const [syncStatus, setSyncStatus] = useState<WeatherSyncStatus>('offline-cached');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastCoordsRef = useRef<{ lat: number; lon: number } | null>(null);

  // Format relative sync time e.g. "Synced 15m ago at Harbor"
  const getRelativeSyncTime = (timestamp: number): string => {
    const diffMin = Math.round((Date.now() - timestamp) / (1000 * 60));
    if (diffMin < 2) return 'Synced just now at Harbor';
    if (diffMin < 60) return `Synced ${diffMin}m ago at Harbor`;
    const diffHours = Math.floor(diffMin / 60);
    return `Synced ${diffHours}h ago at Harbor`;
  };

  const syncHarborData = useCallback(async (forcedLat?: number, forcedLon?: number) => {
    const lat = forcedLat ?? location?.latitude ?? 20.902;
    const lon = forcedLon ?? location?.longitude ?? 70.366;

    setSyncStatus('syncing');
    setIsRefreshing(true);

    try {
      const freshData = await fetchLiveMarineForecast(lat, lon);
      setData(freshData);
      setSyncStatus('online');
      lastCoordsRef.current = { lat, lon };
    } catch (err) {
      console.warn('[useMarineWeather] Live fetch failed, using offline cached data:', err);
      // Fallback gracefully to offline cache or baseline
      const cached = await loadFromStorage();
      if (cached) {
        setData(cached);
      } else {
        // Recalculate astronomical tides for current clock
        setData((prev) => ({
          ...prev,
          tides: calculateAstronomicalTides(),
        }));
      }
      setSyncStatus('offline-cached');
    } finally {
      setIsRefreshing(false);
    }
  }, [location?.latitude, location?.longitude]);

  // Initial load: try storage first, then attempt live sync
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const cached = await loadFromStorage();
      if (cached && isMounted) {
        setData(cached);
      }
      // Attempt background live fetch
      if (isMounted) {
        void syncHarborData();
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update astronomical tides every minute based on device clock (100% offline)
  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => ({
        ...prev,
        tides: calculateAstronomicalTides(),
      }));
    }, 60000); // every minute
    return () => clearInterval(interval);
  }, []);

  // Re-sync if location shifted significantly (> 15 NM / ~0.25 deg)
  useEffect(() => {
    if (!location) return;
    if (!lastCoordsRef.current) return;

    const latDiff = Math.abs(location.latitude - lastCoordsRef.current.lat);
    const lonDiff = Math.abs(location.longitude - lastCoordsRef.current.lon);
    if (latDiff > 0.25 || lonDiff > 0.25) {
      void syncHarborData(location.latitude, location.longitude);
    }
  }, [location?.latitude, location?.longitude, syncHarborData]);

  return {
    conditions: data.conditions,
    hourly: data.hourly,
    tides: data.tides,
    syncStatus,
    isOffline: syncStatus === 'offline-cached',
    isRefreshing,
    lastSyncedText: getRelativeSyncTime(data.syncedAt),
    syncHarborData,
  };
}
