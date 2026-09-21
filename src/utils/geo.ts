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
  const dLat = toRad(toLat - fromLat);
  const dLng = toRad(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Initial bearing from A to B in degrees (0–360). */
export function bearingDegrees(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): number {
  const φ1 = toRad(fromLat);
  const φ2 = toRad(toLat);
  const Δλ = toRad(toLng - fromLng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function formatNm(nm: number) {
  if (!Number.isFinite(nm)) return '—';
  return `${nm.toFixed(1)} NM`;
}

export function formatBearing(deg: number) {
  if (!Number.isFinite(deg)) return '—';
  return `${Math.round(deg)}°`;
}

export function etaFromNm(nm: number, speedKnots: number) {
  if (!Number.isFinite(nm) || !Number.isFinite(speedKnots) || speedKnots <= 0) {
    return '—';
  }
  const hoursTotal = nm / speedKnots;
  const hours = Math.floor(hoursTotal);
  const minutes = Math.round((hoursTotal - hours) * 60);
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

/** Converts decimal degrees to a clean DMS string (e.g. 20° 23' 15" N). */
export function toDms(value: number, positive: 'N' | 'E', negative: 'S' | 'W'): string {
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
  const cleaned = raw.trim();

  // Pattern 1: Decimal pair separated by comma or space: e.g. "20.3875, 70.8783" or "20.3875 70.8783"
  const decRegex = /^(-?\d{1,2}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)$/;
  const decMatch = cleaned.match(decRegex);
  if (decMatch && decMatch[1] && decMatch[2]) {
    const lat = parseFloat(decMatch[1]);
    const lng = parseFloat(decMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { latitude: lat, longitude: lng };
    }
  }

  // Pattern 2: Degrees with hemisphere e.g. 20.38N, 70.87E or 20.38 N 70.87 E
  const hemiRegex = /(\d{1,2}(?:\.\d+)?)\s*([NSns])[,\s]+(\d{1,3}(?:\.\d+)?)\s*([EWew])/;
  const hemiMatch = cleaned.match(hemiRegex);
  if (hemiMatch && hemiMatch[1] && hemiMatch[2] && hemiMatch[3] && hemiMatch[4]) {
    let lat = parseFloat(hemiMatch[1]);
    if (hemiMatch[2].toUpperCase() === 'S') lat = -lat;
    let lng = parseFloat(hemiMatch[3]);
    if (hemiMatch[4].toUpperCase() === 'W') lng = -lng;
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { latitude: lat, longitude: lng };
    }
  }

  // Pattern 3: Full DMS e.g. 20° 23' 15" N, 70° 52' 30" E or 20 23 15 N, 70 52 30 E
  const dmsRegex = /(\d{1,2})[°\s]+(\d{1,2})['\s]*(?:(\d{1,2}(?:\.\d+)?)["\s]*)?([NSns])[,\s]+(\d{1,3})[°\s]+(\d{1,2})['\s]*(?:(\d{1,2}(?:\.\d+)?)["\s]*)?([EWew])/i;
  const dmsMatch = cleaned.match(dmsRegex);
  if (dmsMatch) {
    const latDeg = parseFloat(dmsMatch[1]);
    const latMin = parseFloat(dmsMatch[2]) || 0;
    const latSec = parseFloat(dmsMatch[3]) || 0;
    const latDir = dmsMatch[4].toUpperCase();

    const lngDeg = parseFloat(dmsMatch[5]);
    const lngMin = parseFloat(dmsMatch[6]) || 0;
    const lngSec = parseFloat(dmsMatch[7]) || 0;
    const lngDir = dmsMatch[8].toUpperCase();

    let lat = latDeg + latMin / 60 + latSec / 3600;
    if (latDir === 'S') lat = -lat;
    let lng = lngDeg + lngMin / 60 + lngSec / 3600;
    if (lngDir === 'W') lng = -lng;

    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { latitude: lat, longitude: lng };
    }
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
