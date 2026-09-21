/**
 * Pure Coordinate Formatter & Direct Resolver
 * User Preference: Direct GPS coordinates display everywhere (no city names)
 */

/**
 * Format coordinates for display (clean, standard GPS navigation format: e.g. "20.8954° N, 70.3645° E")
 */
export function formatCoordinatesShort(lat: number, lng: number): string {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '—';
  const latHemi = lat >= 0 ? 'N' : 'S';
  const lngHemi = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latHemi}, ${Math.abs(lng).toFixed(4)}° ${lngHemi}`;
}

export function formatCoordinatesForSea(lat: number, lng: number): string {
  return formatCoordinatesShort(lat, lng);
}

/**
 * Resolves coordinate string directly (eliminates city naming delays & confusion)
 */
export async function resolveCityName(lat: number, lng: number): Promise<string> {
  return formatCoordinatesShort(lat, lng);
}

/**
 * Instant fallback returning exact GPS coordinates
 */
export function getNearestCityFallback(lat: number, lng: number): string {
  return formatCoordinatesShort(lat, lng);
}
