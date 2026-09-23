import * as Location from 'expo-location';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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

export function formatCoordinatesShort(lat: number, lng: number): string {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '—';
  const latHemi = lat >= 0 ? 'N' : 'S';
  const lngHemi = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latHemi}, ${Math.abs(lng).toFixed(4)}° ${lngHemi}`;
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

  // Marine compass stabilization refs (eliminates table jitter while maintaining instant turning response)
  const smoothedHeadingRef = useRef<number | null>(null);
  const lastPublishedHeadingRef = useRef<number | null>(null);

  const stopWatching = useCallback(() => {
    try {
      watchSub.current?.remove();
    } catch {}
    watchSub.current = null;

    try {
      headingSub.current?.remove();
    } catch {}
    headingSub.current = null;

    smoothedHeadingRef.current = null;
    lastPublishedHeadingRef.current = null;

    isWatchingRef.current = false;
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
      const coordsStr = formatCoordinatesShort(next.latitude, next.longitude);
      setPlace({
        city: coordsStr,
        region: null,
        name: coordsStr,
      });
    },
    [],
  );

  const startWatching = useCallback(async () => {
    if (isWatchingRef.current && watchSub.current) {
      return;
    }

    // Tear down any orphaned watchers before recreating
    stopWatching();
    isWatchingRef.current = true;

    try {
      // First attempt with Balanced accuracy for instant fix indoors & outdoors
      watchSub.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 1000,
          distanceInterval: 1,
          mayShowUserSettingsDialog: true,
        },
        (pos) => {
          applyPosition(pos);
        },
      );
    } catch (err) {
      console.warn('Location watchPositionAsync error, retrying with High:', err);
      try {
        watchSub.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 1000,
          },
          (pos) => {
            applyPosition(pos);
          },
        );
      } catch (fallbackErr) {
        console.warn('Location fallback watchPositionAsync error:', fallbackErr);
      }
    }

    // Heading sensor (magnetometer) is only available on native devices (not on web browsers)
    if (Platform.OS !== 'web') {
      try {
        headingSub.current = await Location.watchHeadingAsync((data) => {
          const rawMag = Number.isFinite(data.magHeading) ? data.magHeading : null;
          const rawTru = data.trueHeading >= 0 && Number.isFinite(data.trueHeading) ? data.trueHeading : null;
          const rawPrimary = rawTru ?? rawMag;

          if (rawPrimary != null) {
            if (smoothedHeadingRef.current === null) {
              smoothedHeadingRef.current = rawPrimary;
              const rounded = Math.round(rawPrimary);
              lastPublishedHeadingRef.current = rounded;
              setHeading(rounded);
              if (rawMag != null) setMagHeading(Math.round(rawMag));
              if (rawTru != null) setTrueHeading(Math.round(rawTru));
            } else {
              // Calculate shortest angular delta (-180 to 180)
              let delta = (rawPrimary - smoothedHeadingRef.current) % 360;
              if (delta > 180) delta -= 360;
              if (delta < -180) delta += 360;

              // Deadband noise gate:
              // Phone magnetometer on a resting table has ~0.8° to 1.2° electrical noise.
              // Ignore micro-fluctuations under 1.2° to prevent resting jitter!
              if (Math.abs(delta) >= 1.2) {
                // Adaptive Exponential Moving Average (EMA):
                // For small intentional turns (1.2° - 6°): smooth alpha = 0.35
                // For faster turns (> 6°): responsive alpha = 0.75
                const alpha = Math.abs(delta) > 6 ? 0.75 : 0.35;
                smoothedHeadingRef.current = (smoothedHeadingRef.current + delta * alpha + 360) % 360;

                const roundedHeading = Math.round(smoothedHeadingRef.current);
                if (roundedHeading !== lastPublishedHeadingRef.current) {
                  lastPublishedHeadingRef.current = roundedHeading;
                  setHeading(roundedHeading);
                  if (rawMag != null) setMagHeading(Math.round(rawMag));
                  if (rawTru != null) setTrueHeading(Math.round(rawTru));
                }
              }
            }
          }
          if (data.accuracy != null) {
            setHeadingAccuracy(data.accuracy);
          }
        });
      } catch (err) {
        console.warn('Location watchHeadingAsync error:', err);
      }
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
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
        .then((current) => {
          if (current) applyPosition(current);
        })
        .catch(() => {
          // If Balanced fails (e.g. initial GPS sync delay), try Lowest for immediate coordinate lock
          return Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Lowest,
          })
            .then((lowCurrent) => {
              if (lowCurrent) applyPosition(lowCurrent);
            })
            .catch(() => {});
        });

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
    location ? formatCoordinatesShort(location.latitude, location.longitude) : (place?.city ?? null);

  const value = useMemo<LocationContextType>(
    () => ({
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
    }),
    [
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
    ]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useUserLocation(): LocationContextType {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useUserLocation must be used within a LocationProvider');
  }
  return context;
}
