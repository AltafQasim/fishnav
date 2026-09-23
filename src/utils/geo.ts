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

export type DistanceUnit = 'NM' | 'KM' | 'MI';
export type SpeedUnit = 'KTS' | 'KMH';
export type DepthUnit = 'M' | 'FT';

export function formatDistanceWithUnit(nm: number, unit: DistanceUnit = 'NM'): string {
  const safeNm = typeof nm === 'number' && Number.isFinite(nm) ? nm : 0;
  if (unit === 'KM') {
    const km = safeNm * 1.852;
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  }
  if (unit === 'MI') {
    const mi = safeNm * 1.15078;
    if (mi < 0.2) {
      return `${Math.round(mi * 5280)} ft`;
    }
    return `${mi.toFixed(1)} mi`;
  }
  // NM default
  if (safeNm < 1) {
    const cables = Math.round(safeNm * 10);
    return `${cables} cbl`;
  }
  return `${safeNm.toFixed(1)} NM`;
}

export function formatSpeedWithUnit(speedKnots: number, unit: SpeedUnit = 'KTS'): { value: string; unit: string; full: string } {
  const safeSpeed = typeof speedKnots === 'number' && Number.isFinite(speedKnots) ? speedKnots : 0;
  if (unit === 'KMH') {
    const kmh = safeSpeed * 1.852;
    const value = kmh.toFixed(1);
    return { value, unit: 'km/h', full: `${value} km/h` };
  }
  const value = safeSpeed.toFixed(1);
  return { value, unit: 'kts', full: `${value} kts` };
}

export function formatDepthWithUnit(depthM: number, unit: DepthUnit = 'M'): { value: string; unit: string; full: string } {
  const safeDepth = typeof depthM === 'number' && Number.isFinite(depthM) ? depthM : 0;
  if (unit === 'FT') {
    const ft = safeDepth * 3.28084;
    const value = ft.toFixed(1);
    return { value, unit: 'ft', full: `${value} ft` };
  }
  const value = safeDepth.toFixed(1);
  return { value, unit: 'm', full: `${value}m` };
}

export function formatNm(nm: number, unit: DistanceUnit = 'NM'): string {
  return formatDistanceWithUnit(nm, unit);
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

export function toDms(value: number, positive: string, negative: string): string {
  const abs = Math.abs(value);
  const degrees = Math.floor(abs);
  const minutesFloat = (abs - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = Math.round((minutesFloat - minutes) * 60);
  const hemi = value >= 0 ? positive : negative;
  return `${degrees}° ${minutes}' ${seconds}" ${hemi}`;
}

export const formatCoordinateDMS = toDms;

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
