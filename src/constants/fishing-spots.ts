import { MapColors } from '@/constants/map-theme';

export type FishingSpot = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  depthM: number;
  color: string;
  favorite?: boolean;
};

/** Demo spots around Gujarat coast (Nawabandar / Veraval area). */
export const FISHING_SPOTS: FishingSpot[] = [
  {
    id: 'ghol',
    name: 'Ghol Spot',
    latitude: 20.3875,
    longitude: 70.8783,
    depthM: 65,
    color: MapColors.yellow,
    favorite: true,
  },
  {
    id: 'tuna',
    name: 'Tuna Spot',
    latitude: 20.2912,
    longitude: 70.6521,
    depthM: 120,
    color: MapColors.pink,
  },
  {
    id: 'king',
    name: 'King Fish Spot',
    latitude: 20.2144,
    longitude: 70.9418,
    depthM: 85,
    color: MapColors.purple,
  },
];

export const DANGER_ZONE = {
  latitude: 20.332,
  longitude: 70.81,
  radiusM: 1800,
};

export const HARBOR = {
  name: 'Nawabandar',
  latitude: 20.761,
  longitude: 71.132,
};

/** Fallback camera when GPS is unavailable. */
export const DEFAULT_MAP_REGION = {
  latitude: 20.35,
  longitude: 70.82,
  latitudeDelta: 0.35,
  longitudeDelta: 0.35,
};

/** Assumed cruise speed for ETA (knots). */
export const CRUISE_SPEED_KNOTS = 12;
