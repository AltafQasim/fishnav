import { parseAnyCoordinate } from './coordinate-converters';

const EARTH_RADIUS_NM = 3440.065;
const EARTH_RADIUS_M = 6371000;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

export function distanceNm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): number {
  const dLat = toRad(toLat - fromLat);
  const dLng = toRad(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_NM * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function distanceMeters(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): number {
  return distanceNm(fromLat, fromLng, toLat, toLng) * 1852;
}

export function bearingDegrees(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): number {
  const dLng = toRad(toLng - fromLng);
  const fromLatR = toRad(fromLat);
  const toLatR = toRad(toLat);
  const y = Math.sin(dLng) * Math.cos(toLatR);
  const x =
    Math.cos(fromLatR) * Math.sin(toLatR) -
    Math.sin(fromLatR) * Math.cos(toLatR) * Math.cos(dLng);
  const brg = toDeg(Math.atan2(y, x));
  return (brg + 360) % 360;
}

export function formatNm(nm: number): string {
  if (nm < 1) {
    const cables = Math.round(nm * 10);
    return `${cables} cbl`;
  }
  return `${nm.toFixed(1)} NM`;
}

export function formatBearing(deg: number): string {
  return `${Math.round(deg).toString().padStart(3, '0')}°`;
}

export function etaFromNm(nm: number, speedKnots: number = 8): string {
  if (speedKnots <= 0) return '--:--';
  const hours = nm / speedKnots;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function formatCoordinateDMS(value: number, positive: string, negative: string): string {
  const abs = Math.abs(value);
  const degrees = Math.floor(abs);
  const minutesFloat = (abs - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = Math.round((minutesFloat - minutes) * 60);
  const hemi = value >= 0 ? positive : negative;
  return `${degrees}° ${minutes}' ${seconds}" ${hemi}`;
}

/** Parses freeform coordinate string into { latitude, longitude } or null. */
export function parseCoordinates(raw: string): { latitude: number; longitude: number } | null {
  if (!raw) return null;
  const parsed = parseAnyCoordinate(raw);
  if (parsed) {
    return { latitude: parsed.latitude, longitude: parsed.longitude };
  }
  return null;
}

export function zoomToDeltas(zoom: number) {
  const clamped = Math.min(20, Math.max(3, zoom));
  const latitudeDelta = Math.exp(Math.log(360) - clamped * Math.LN2);
  return {
    latitudeDelta,
    longitudeDelta: latitudeDelta,
  };
}

export function deltasToZoom(latitudeDelta: number) {
  return Math.log(360 / Math.max(latitudeDelta, 0.0001)) / Math.LN2;
}
