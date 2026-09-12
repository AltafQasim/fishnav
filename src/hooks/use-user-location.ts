import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Platform } from 'react-native';

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

export function useUserLocation() {
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [place, setPlace] = useState<PlaceLabel | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [heading, setHeading] = useState<number | null>(null);

  const watchSub = useRef<Location.LocationSubscription | null>(null);
  const headingSub = useRef<Location.LocationSubscription | null>(null);
  const lastGeocodeAt = useRef(0);
  const lastGeocodeKey = useRef('');

  const stopWatching = useCallback(() => {
    watchSub.current?.remove();
    watchSub.current = null;
    headingSub.current?.remove();
    headingSub.current = null;
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
      // Keep previous place label if reverse geocode fails.
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
    stopWatching();

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

    try {
      headingSub.current = await Location.watchHeadingAsync((data) => {
        const value = data.trueHeading >= 0 ? data.trueHeading : data.magHeading;
        if (Number.isFinite(value)) setHeading(value);
      });
    } catch {
      // Heading is optional on some platforms / simulators.
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

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      applyPosition(current);
      await startWatching();
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

  useEffect(() => {
    void requestPermissionAndLocate();
    return () => stopWatching();
    // Mount-only: avoid re-prompting when callback identities change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const placeLabel =
    place?.city ?? place?.name ?? (status === 'granted' ? 'Current Location' : null);

  return {
    status,
    location,
    place,
    placeLabel,
    heading,
    errorMessage,
    requestPermissionAndLocate,
    openSettings,
    refresh: requestPermissionAndLocate,
  };
}
