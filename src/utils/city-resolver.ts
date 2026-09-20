import * as Location from 'expo-location';

type CoastalCity = {
  name: string;
  lat: number;
  lng: number;
};

// Comprehensive list of Indian & regional coastal cities and fishing hubs
const COASTAL_CITIES: CoastalCity[] = [
  { name: 'Veraval', lat: 20.9000, lng: 70.3667 },
  { name: 'Porbandar', lat: 21.6417, lng: 69.6083 },
  { name: 'Diu', lat: 20.7144, lng: 70.9874 },
  { name: 'Okha', lat: 22.4667, lng: 69.0667 },
  { name: 'Dwarka', lat: 22.2442, lng: 68.9685 },
  { name: 'Mangrol', lat: 21.1200, lng: 70.1167 },
  { name: 'Jafrabad', lat: 20.8667, lng: 71.3667 },
  { name: 'Mandvi', lat: 22.8333, lng: 69.3556 },
  { name: 'Kandla', lat: 23.0000, lng: 70.2167 },
  { name: 'Jamnagar', lat: 22.4707, lng: 70.0577 },
  { name: 'Bhavnagar', lat: 21.7645, lng: 72.1519 },
  { name: 'Surat', lat: 21.1702, lng: 72.8311 },
  { name: 'Valsad', lat: 20.6100, lng: 72.9260 },
  { name: 'Daman', lat: 20.4283, lng: 72.8397 },
  { name: 'Mumbai', lat: 18.9220, lng: 72.8347 },
  { name: 'Alibag', lat: 18.6414, lng: 72.8722 },
  { name: 'Ratnagiri', lat: 16.9902, lng: 73.3120 },
  { name: 'Malvan', lat: 16.0600, lng: 73.4700 },
  { name: 'Goa', lat: 15.4909, lng: 73.8278 },
  { name: 'Karwar', lat: 14.8185, lng: 74.1300 },
  { name: 'Honnavar', lat: 14.2800, lng: 74.4500 },
  { name: 'Udupi', lat: 13.3409, lng: 74.7421 },
  { name: 'Mangalore', lat: 12.9141, lng: 74.8560 },
  { name: 'Kasaragod', lat: 12.5102, lng: 74.9852 },
  { name: 'Kannur', lat: 11.8745, lng: 75.3704 },
  { name: 'Kozhikode', lat: 11.2588, lng: 75.7804 },
  { name: 'Kochi', lat: 9.9312, lng: 76.2673 },
  { name: 'Alappuzha', lat: 9.4981, lng: 76.3388 },
  { name: 'Kollam', lat: 8.8932, lng: 76.6141 },
  { name: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366 },
  { name: 'Kanyakumari', lat: 8.0883, lng: 77.5385 },
  { name: 'Thoothukudi', lat: 8.7642, lng: 78.1348 },
  { name: 'Rameswaram', lat: 9.2876, lng: 79.3129 },
  { name: 'Nagapattinam', lat: 10.7672, lng: 79.8449 },
  { name: 'Pondicherry', lat: 11.9416, lng: 79.8083 },
  { name: 'Cuddalore', lat: 11.7480, lng: 79.7714 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Nellore', lat: 14.4426, lng: 79.9865 },
  { name: 'Machilipatnam', lat: 16.1875, lng: 81.1389 },
  { name: 'Kakinada', lat: 16.9891, lng: 82.2475 },
  { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
  { name: 'Gopalpur', lat: 19.2600, lng: 84.9000 },
  { name: 'Puri', lat: 19.8135, lng: 85.8312 },
  { name: 'Paradip', lat: 20.3160, lng: 86.6111 },
  { name: 'Digha', lat: 21.6266, lng: 87.5075 },
  { name: 'Haldia', lat: 22.0620, lng: 88.0583 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Port Blair', lat: 11.6234, lng: 92.7265 },
  { name: 'Karachi', lat: 24.8607, lng: 67.0011 },
  { name: 'Colombo', lat: 6.9271, lng: 79.8612 },
];

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds closest coastal city or port by coordinates.
 * Always works instantly with 0ms network latency and 0 dependencies.
 */
export function getNearestCityFallback(lat: number, lng: number): string {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return 'Veraval';
  }

  let minDistance = Infinity;
  let nearest = COASTAL_CITIES[0];

  for (const city of COASTAL_CITIES) {
    const dist = distanceKm(lat, lng, city.lat, city.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = city;
    }
  }

  if (minDistance > 25) {
    return `${nearest.name} Coast`;
  }
  return nearest.name;
}

// In-memory geocode cache
const cityCache = new Map<string, string>();

/**
 * Multi-layer City Resolver:
 * 1. Expo Location Reverse Geocode
 * 2. BigDataCloud / OSM client API fallback
 * 3. Nearest coastal harbor/city geometric calculation (guaranteed non-empty result)
 */
export async function resolveCityName(lat: number, lng: number): Promise<string> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return 'Veraval';
  }

  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const cached = cityCache.get(cacheKey);
  if (cached) return cached;

  // 1. Try native Expo Location geocoding
  try {
    const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (results && results.length > 0) {
      const first = results[0];
      const candidate =
        first.city ||
        first.subregion ||
        first.district ||
        first.name ||
        first.region;

      if (candidate && candidate.trim().length > 0 && !candidate.toLowerCase().includes('unnamed')) {
        const clean = candidate.trim();
        cityCache.set(cacheKey, clean);
        return clean;
      }
    }
  } catch {
    // Native geocoder may fail on web or without Google Play Services
  }

  // 2. Try online reverse geocode service with short timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: controller.signal },
    );
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      const onlineCandidate =
        data.city ||
        data.locality ||
        data.principalSubdivision;

      if (onlineCandidate && onlineCandidate.trim().length > 0) {
        const clean = onlineCandidate.trim();
        cityCache.set(cacheKey, clean);
        return clean;
      }
    }
  } catch {
    // Network offline or fetch timed out
  }

  // 3. Fallback: Instant geometric nearest coastal city
  const fallback = getNearestCityFallback(lat, lng);
  cityCache.set(cacheKey, fallback);
  return fallback;
}
