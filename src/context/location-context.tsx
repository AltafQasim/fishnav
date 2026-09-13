import * as Location from 'expo-location';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Linking, Platform } from 'react-native';

export type LocationStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'disabled'
  | 'error';

export type UserLocation = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  altitude: number | null;
  speed: number | null;
  timestamp: number;
};

export type PlaceLabel = {
  city: string | null;
  region: string | null;
  name: string | null;
};

export type LocationContextType = {
  status: LocationStatus;
  location: UserLocation | null;
  place: PlaceLabel | null;
  placeLabel: string | null;
  heading: number | null;
  magHeading: number | null;
  trueHeading: number | null;
  headingAccuracy: number | null;
  errorMessage: string | null;
  requestPermissionAndLocate: () => Promise<boolean>;
  openSettings: () => void;
  refresh: () => Promise<boolean>;
};

const LocationContext = createContext<LocationContextType | null>(null);

function toDms(value: number, positive: string, negative: string) {
  const abs = Math.abs(value);
  const degrees = Math.floor(abs);
  const minutesFloat = (abs - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = ((minutesFloat - minutes) * 60).toFixed(0);
  const hemi = value >= 0 ? positive : negative;
  return `${degrees}° ${minutes}' ${seconds}" ${hemi}`;
}

export function formatLatitude(lat: number) {
  return toDms(lat, 'N', 'S');
}

export function formatLongitude(lng: number) {
  return toDms(lng, 'E', 'W');
}

export function formatAccuracy(meters: number | null) {
  if (meters == null || !Number.isFinite(meters)) return '—';
  if (meters < 10) return `${meters.toFixed(1)} m`;
  return `${Math.round(meters)} m`;
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [place, setPlace] = useState<PlaceLabel | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dedicated sensor heading states
  const [heading, setHeading] = useState<number | null>(null);
  const [magHeading, setMagHeading] = useState<number | null>(null);
  const [trueHeading, setTrueHeading] = useState<number | null>(null);
  const [headingAccuracy, setHeadingAccuracy] = useState<number | null>(null);

  // Singletons subscriptions
  const watchSub = useRef<Location.LocationSubscription | null>(null);
  const headingSub = useRef<Location.LocationSubscription | null>(null);
  const isWatchingRef = useRef(false);

  const lastGeocodeAt = useRef(0);
  const lastGeocodeKey = useRef('');

  const stopWatching = useCallback(() => {
    try {
      watchSub.current?.remove();
    } catch {}
    watchSub.current = null;

    try {
      headingSub.current?.remove();
    } catch {}
    headingSub.current = null;

    isWatchingRef.current = false;
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
    const now = Date.now();
    if (key === lastGeocodeKey.current && now - lastGeocodeAt.current < 30_000) {
      return;
    }
    lastGeocodeKey.current = key;
    lastGeocodeAt.current = now;

    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const first = results[0];
      if (!first) {
        setPlace(null);
        return;
      }
      setPlace({
        city: first.city ?? first.subregion ?? first.district ?? null,
        region: first.region ?? first.country ?? null,
        name: first.name ?? first.street ?? null,
      });
    } catch {
      // Keep previous place label if geocode fails
    }
  }, []);

  const applyPosition = useCallback(
    (pos: Location.LocationObject) => {
      const next: UserLocation = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        heading: pos.coords.heading,
        altitude: pos.coords.altitude,
        speed: pos.coords.speed,
        timestamp: pos.timestamp,
      };
      setLocation(next);
      void reverseGeocode(next.latitude, next.longitude);
    },
    [reverseGeocode],
  );

  const startWatching = useCallback(async () => {
    if (isWatchingRef.current && watchSub.current && headingSub.current) {
      return;
    }

    // Tear down any orphaned watchers before recreating
    stopWatching();
    isWatchingRef.current = true;

    try {
      watchSub.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 1,
          mayShowUserSettingsDialog: true,
        },
        (pos) => {
          applyPosition(pos);
        },
      );
    } catch (err) {
      console.warn('Location watchPositionAsync error:', err);
    }

    try {
      headingSub.current = await Location.watchHeadingAsync((data) => {
        const mag = Number.isFinite(data.magHeading) ? Math.round(data.magHeading) : null;
        const tru = data.trueHeading >= 0 && Number.isFinite(data.trueHeading) ? Math.round(data.trueHeading) : null;
        const primary = tru ?? mag;

        if (primary != null) {
          setHeading(primary);
        }
        if (mag != null) {
          setMagHeading(mag);
        }
        if (tru != null) {
          setTrueHeading(tru);
        }
        if (data.accuracy != null) {
          setHeadingAccuracy(data.accuracy);
        }
      });
    } catch (err) {
      console.warn('Location watchHeadingAsync error:', err);
    }
  }, [applyPosition, stopWatching]);

  const requestPermissionAndLocate = useCallback(async () => {
    setStatus('requesting');
    setErrorMessage(null);

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setStatus('disabled');
        setErrorMessage('Location services are turned off.');
        return false;
      }

      const existing = await Location.getForegroundPermissionsAsync();
      let granted = existing.granted;

      if (!granted) {
        const asked = await Location.requestForegroundPermissionsAsync();
        granted = asked.granted;
      }

      if (!granted) {
        setStatus('denied');
        setErrorMessage('Location permission denied.');
        return false;
      }

      setStatus('granted');

      // 1. Immediately grab last known location for zero-latency start
      try {
        const last = await Location.getLastKnownPositionAsync();
        if (last) {
          applyPosition(last);
        }
      } catch {}

      // 2. Start single live watchers immediately (position + heading)
      await startWatching();

      // 3. Concurrently get fresh position fix in background without blocking
      void Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
        .then((current) => {
          if (current) applyPosition(current);
        })
        .catch(() => {});

      return true;
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unable to get location.');
      return false;
    }
  }, [applyPosition, startWatching]);

  const openSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      void Linking.openURL('app-settings:');
    } else {
      void Linking.openSettings();
    }
  }, []);

  // Initial startup
  useEffect(() => {
    void requestPermissionAndLocate();
    return () => {
      stopWatching();
    };
  }, [requestPermissionAndLocate, stopWatching]);

  // AppState recovery: when app comes to foreground, ensure watchers are alive
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active' && status === 'granted') {
        void startWatching();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [startWatching, status]);

  const placeLabel =
    place?.city ?? place?.name ?? (status === 'granted' ? 'Current Location' : null);

  const value: LocationContextType = {
    status,
    location,
    place,
    placeLabel,
    heading,
    magHeading,
    trueHeading,
    headingAccuracy,
    errorMessage,
    requestPermissionAndLocate,
    openSettings,
    refresh: requestPermissionAndLocate,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useUserLocation(): LocationContextType {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useUserLocation must be used within a LocationProvider');
  }
  return context;
}
