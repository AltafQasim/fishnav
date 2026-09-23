import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { persistentStorage } from '@/services/persistent-storage';
import {
  DepthUnit,
  DistanceUnit,
  formatDepthWithUnit,
  formatDistanceWithUnit,
  formatSpeedWithUnit,
  SpeedUnit,
} from '@/utils/geo';

const STORAGE_SETTINGS_KEY = '@fishnav_app_settings_v1';

export type AppSettings = {
  // Measurement Units
  distanceUnit: DistanceUnit;
  speedUnit: SpeedUnit;
  depthUnit: DepthUnit;

  // Alarms & Sensors
  gpsPrecision: boolean;
  shallowAlarm: boolean;
  dangerZoneAlarm: boolean;
  keepAwake: boolean;

  // Map Display & Layers
  showContours: boolean;
  showSeamarks: boolean;
  showDangerZones: boolean;
  showGpsHud: boolean;
};

const DEFAULT_SETTINGS: AppSettings = {
  distanceUnit: 'NM',
  speedUnit: 'KTS',
  depthUnit: 'M',
  gpsPrecision: true,
  shallowAlarm: true,
  dangerZoneAlarm: true,
  keepAwake: true,
  showContours: true,
  showSeamarks: true,
  showDangerZones: true,
  showGpsHud: true,
};

export type SettingsContextType = AppSettings & {
  setDistanceUnit: (unit: DistanceUnit) => Promise<void>;
  setSpeedUnit: (unit: SpeedUnit) => Promise<void>;
  setDepthUnit: (unit: DepthUnit) => Promise<void>;
  setGpsPrecision: (val: boolean) => Promise<void>;
  setShallowAlarm: (val: boolean) => Promise<void>;
  setDangerZoneAlarm: (val: boolean) => Promise<void>;
  setKeepAwake: (val: boolean) => Promise<void>;
  setShowContours: (val: boolean) => Promise<void>;
  setShowSeamarks: (val: boolean) => Promise<void>;
  setShowDangerZones: (val: boolean) => Promise<void>;
  setShowGpsHud: (val: boolean) => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;

  // Formatter helpers bound to active units
  formatDistance: (nm: number) => string;
  formatSpeed: (knots: number) => { value: string; unit: string; full: string };
  formatDepth: (depthM: number) => { value: string; unit: string; full: string };
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Load saved settings from persistent offline storage on startup
  useEffect(() => {
    let isMounted = true;
    persistentStorage.getItem(STORAGE_SETTINGS_KEY).then((json) => {
      if (isMounted && json) {
        try {
          const parsed = JSON.parse(json);
          setSettings((prev) => ({
            ...prev,
            ...parsed,
          }));
        } catch (e) {
          console.warn('[SettingsContext] Failed to parse saved settings:', e);
        }
      }
      if (isMounted) setIsLoaded(true);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Save changes to persistent storage
  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    try {
      await persistentStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (err) {
      console.warn('[SettingsContext] Error persisting settings:', err);
    }
  }, []);

  const updateSettings = useCallback(
    async (partial: Partial<AppSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial };
        void saveSettings(next);
        return next;
      });
    },
    [saveSettings],
  );

  const setDistanceUnit = useCallback(
    async (distanceUnit: DistanceUnit) => {
      await updateSettings({ distanceUnit });
    },
    [updateSettings],
  );

  const setSpeedUnit = useCallback(
    async (speedUnit: SpeedUnit) => {
      await updateSettings({ speedUnit });
    },
    [updateSettings],
  );

  const setDepthUnit = useCallback(
    async (depthUnit: DepthUnit) => {
      await updateSettings({ depthUnit });
    },
    [updateSettings],
  );

  const setGpsPrecision = useCallback(
    async (gpsPrecision: boolean) => {
      await updateSettings({ gpsPrecision });
    },
    [updateSettings],
  );

  const setShallowAlarm = useCallback(
    async (shallowAlarm: boolean) => {
      await updateSettings({ shallowAlarm });
    },
    [updateSettings],
  );

  const setDangerZoneAlarm = useCallback(
    async (dangerZoneAlarm: boolean) => {
      await updateSettings({ dangerZoneAlarm, showDangerZones: dangerZoneAlarm });
    },
    [updateSettings],
  );

  const setKeepAwake = useCallback(
    async (keepAwake: boolean) => {
      await updateSettings({ keepAwake });
    },
    [updateSettings],
  );

  const setShowContours = useCallback(
    async (showContours: boolean) => {
      await updateSettings({ showContours });
    },
    [updateSettings],
  );

  const setShowSeamarks = useCallback(
    async (showSeamarks: boolean) => {
      await updateSettings({ showSeamarks });
    },
    [updateSettings],
  );

  const setShowDangerZones = useCallback(
    async (showDangerZones: boolean) => {
      await updateSettings({ showDangerZones });
    },
    [updateSettings],
  );

  const setShowGpsHud = useCallback(
    async (showGpsHud: boolean) => {
      await updateSettings({ showGpsHud });
    },
    [updateSettings],
  );

  // Dynamic formatters connected to currently selected units
  const formatDistance = useCallback(
    (nm: number) => {
      return formatDistanceWithUnit(nm, settings.distanceUnit);
    },
    [settings.distanceUnit],
  );

  const formatSpeed = useCallback(
    (knots: number) => {
      return formatSpeedWithUnit(knots, settings.speedUnit);
    },
    [settings.speedUnit],
  );

  const formatDepth = useCallback(
    (depthM: number) => {
      return formatDepthWithUnit(depthM, settings.depthUnit);
    },
    [settings.depthUnit],
  );

  const contextValue = useMemo<SettingsContextType>(() => {
    return {
      ...settings,
      setDistanceUnit,
      setSpeedUnit,
      setDepthUnit,
      setGpsPrecision,
      setShallowAlarm,
      setDangerZoneAlarm,
      setKeepAwake,
      setShowContours,
      setShowSeamarks,
      setShowDangerZones,
      setShowGpsHud,
      updateSettings,
      formatDistance,
      formatSpeed,
      formatDepth,
    };
  }, [
    settings,
    setDistanceUnit,
    setSpeedUnit,
    setDepthUnit,
    setGpsPrecision,
    setShallowAlarm,
    setDangerZoneAlarm,
    setKeepAwake,
    setShowContours,
    setShowSeamarks,
    setShowDangerZones,
    setShowGpsHud,
    updateSettings,
    formatDistance,
    formatSpeed,
    formatDepth,
  ]);

  return <SettingsContext.Provider value={contextValue}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
