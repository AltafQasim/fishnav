/**
 * 🧭 Marine Coordinate Conversion Engine
 *
 * Supports all standard Marine GPS & Nautical Navigation Formats:
 * 1. DDMM.MM (Degrees / Decimal Minutes - Garmin / Marine GPS standard e.g. 17301.04 = 173° 1.04', 2044.570 = 20° 44.570' N)
 * 2. DDMM.SS (Degrees / Minutes / Seconds - DMS e.g. 5703.12 = 57° 3' 12")
 * 3. D.D (Decimal Degrees e.g. 57.9234 = 57.9234°)
 * 4. UTM (Universal Transverse Mercator: Zone, Easting, Northing e.g. 42N 508316 2293481)
 * 5. MGRS (Military Grid Reference System e.g. 42QVK0831693481)
 */

export type CoordinateFormatId = 'AUTO' | 'DDMM.MM' | 'DDMM.SS' | 'D.D' | 'UTM' | 'MGRS';
export type CoordinateFormatType = CoordinateFormatId;

export type CoordinateFormatMeta = {
  id: CoordinateFormatId;
  label: string;
  sublabel: string;
  description: string;
  example: string;
  placeholderLat: string;
  placeholderLng: string;
};

export const COORDINATE_FORMATS: CoordinateFormatMeta[] = [
  {
    id: 'AUTO',
    label: 'Auto Detect (Smart)',
    sublabel: 'Any Coordinate Format',
    description: 'Auto-detects GPS (DDMM.MM), Decimal (D.D), DMS or Links',
    example: "20° 44.570' N, 70° 52.340' E • 20.7428, 70.8723",
    placeholderLat: "e.g. 20° 44.570' N or 20.7428",
    placeholderLng: "e.g. 070° 52.340' E or 70.8723",
  },
  {
    id: 'DDMM.MM',
    label: 'DDMM.MM',
    sublabel: 'Degrees/Minutes/Fractions',
    description: 'Degrees/Minutes/Fractions',
    example: "17301.04 means 173°1.04' • 2044.570 means 20°44.570' N",
    placeholderLat: "e.g. 20° 44.570' N or 2044.570",
    placeholderLng: "e.g. 071° 04.811' E or 7104.811",
  },
  {
    id: 'DDMM.SS',
    label: 'DDMM.SS',
    sublabel: 'Degrees/Minutes/Seconds',
    description: 'Degrees/Minutes/Seconds',
    example: '5703.12 means 57°3\'12" • 204434 means 20°44\'34" N',
    placeholderLat: 'e.g. 20° 44\' 34" N or 204434',
    placeholderLng: 'e.g. 071° 04\' 48" E or 710448',
  },
  {
    id: 'D.D',
    label: 'D.D',
    sublabel: 'Decimal Degrees',
    description: 'Decimal Degrees',
    example: '57.9234 means 57.9234° • 20.7428 means 20.7428° N',
    placeholderLat: 'e.g. 20.7428',
    placeholderLng: 'e.g. 71.0802',
  },
  {
    id: 'UTM',
    label: 'UTM',
    sublabel: 'Zone/Northing/Easting',
    description: 'Zone/Northing/Easting',
    example: 'Zone 42N Easting: 508316 Northing: 2293481',
    placeholderLat: 'Northing e.g. 2293481',
    placeholderLng: 'Zone + Easting e.g. 42N 508316',
  },
  {
    id: 'MGRS',
    label: 'MGRS',
    sublabel: 'Grid Reference',
    description: 'Grid Reference',
    example: '42QVK0831693481',
    placeholderLat: 'Grid Reference e.g. 42QVK',
    placeholderLng: '0831693481',
  },
];

export type ParsedCoordResult = {
  latitude: number;
  longitude: number;
  formatDetected: CoordinateFormatId;
  formattedDDM: { lat: string; lng: string; full: string };
  formattedDMS: { lat: string; lng: string; full: string };
  formattedDD: { lat: string; lng: string; full: string };
  formattedUTM: string;
  formattedMGRS: string;
};

// ==========================================
// 1. DDMM.MM (Degrees and Decimal Minutes)
// ==========================================

/**
 * Converts decimal degrees to DDMM.MM e.g. 20.742833 -> { deg: 20, min: 44.570, hemi: 'N', compact: '2044.570' }
 */
export function toDDMM_MM(val: number, isLatitude: boolean): {
  degrees: number;
  minutes: number;
  hemisphere: string;
  displayStr: string;
  compactStr: string;
} {
  const abs = Math.abs(val);
  const degrees = Math.floor(abs);
  const minutes = Number(((abs - degrees) * 60).toFixed(3));
  const hemisphere = isLatitude ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');
  const padDeg = isLatitude ? String(degrees).padStart(2, '0') : String(degrees).padStart(3, '0');
  const padMin = minutes.toFixed(3).padStart(6, '0'); // e.g. 04.570

  const displayStr = `${degrees}° ${minutes.toFixed(3)}' ${hemisphere}`;
  const compactStr = `${padDeg}${padMin}`;

  return { degrees, minutes, hemisphere, displayStr, compactStr };
}

/**
 * Parses a single DDMM.MM string or compact representation into decimal degrees.
 * Handles:
 * - "17301.04" -> 173° 1.04' = 173.01733°
 * - "2044.570" -> 20° 44.570' = 20.742833°
 * - "20° 44.570' N"
 * - "20 44.570 N"
 */
export function parseDDMM_MM(raw: string, isLatitude: boolean): number | null {
  if (!raw) return null;
  const clean = raw.trim().toUpperCase();

  // Check hemisphere if present
  let sign = 1;
  if (clean.includes('S') || clean.includes('W') || clean.startsWith('-')) {
    sign = -1;
  }

  // Remove hemisphere and symbols
  const numOnly = clean.replace(/[°'NSEW+\-\s]/g, '');
  if (!numOnly) return null;

  // Case A: formatted with degree symbol or space between deg and min: e.g. "20 44.570" or "20° 44.570"
  const spacedMatch = clean.match(/^([+-]?\d{1,3})[°\s]+(\d{1,2}(?:\.\d+)?)\s*['\s]*([NSEW])?$/);
  if (spacedMatch) {
    const deg = parseFloat(spacedMatch[1]);
    const min = parseFloat(spacedMatch[2]);
    const hemi = spacedMatch[3];
    if (hemi === 'S' || hemi === 'W') sign = -1;
    if (hemi === 'N' || hemi === 'E') sign = 1;
    if (Number.isFinite(deg) && Number.isFinite(min) && min >= 0 && min < 60) {
      const dec = (Math.abs(deg) + min / 60) * sign;
      return clampCoord(dec, isLatitude);
    }
  }

  // Case B: compact notation: e.g. "2044.570" or "17301.04" or "7104.811"
  // For Latitude: degrees is 2 digits (or 1 digit if < 10)
  // For Longitude: degrees is 2 or 3 digits
  const numVal = parseFloat(numOnly);
  if (Number.isFinite(numVal)) {
    // If input has decimal point after MM: e.g. 2044.570 or 17301.04
    const dotIdx = numOnly.indexOf('.');
    const integerPart = dotIdx !== -1 ? numOnly.slice(0, dotIdx) : numOnly;
    const decimalPart = dotIdx !== -1 ? numOnly.slice(dotIdx) : '';

    if (integerPart.length >= 3) {
      // Last 2 digits of integerPart are integer minutes
      const minInt = integerPart.slice(-2);
      const degPart = integerPart.slice(0, -2);
      const deg = parseFloat(degPart);
      const min = parseFloat(minInt + decimalPart);

      if (Number.isFinite(deg) && Number.isFinite(min) && min < 60) {
        const dec = (deg + min / 60) * sign;
        return clampCoord(dec, isLatitude);
      }
    } else {
      // Pure degrees if 1-2 digits
      const dec = numVal * sign;
      return clampCoord(dec, isLatitude);
    }
  }

  return null;
}

// ==========================================
// 2. DDMM.SS (Degrees, Minutes, Seconds)
// ==========================================

export function toDDMM_SS(val: number, isLatitude: boolean): {
  degrees: number;
  minutes: number;
  seconds: number;
  displayStr: string;
  compactStr: string;
} {
  const abs = Math.abs(val);
  const degrees = Math.floor(abs);
  const minFloat = (abs - degrees) * 60;
  const minutes = Math.floor(minFloat);
  const seconds = Number(((minFloat - minutes) * 60).toFixed(1));
  const hemisphere = isLatitude ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');

  const padDeg = isLatitude ? String(degrees).padStart(2, '0') : String(degrees).padStart(3, '0');
  const padMin = String(minutes).padStart(2, '0');
  const padSec = String(Math.floor(seconds)).padStart(2, '0');

  const displayStr = `${degrees}° ${minutes}' ${seconds}" ${hemisphere}`;
  const compactStr = `${padDeg}${padMin}${padSec}`;

  return { degrees, minutes, seconds, displayStr, compactStr };
}

export function parseDDMM_SS(raw: string, isLatitude: boolean): number | null {
  if (!raw) return null;
  const clean = raw.trim().toUpperCase();

  let sign = 1;
  if (clean.includes('S') || clean.includes('W') || clean.startsWith('-')) {
    sign = -1;
  }

  // Spaced or symbol format: e.g. 20° 44' 34" N or 20 44 34 N
  const dmsMatch = clean.match(/^([+-]?\d{1,3})[°\s]+(\d{1,2})['\s]+(\d{1,2}(?:\.\d+)?)["]?\s*([NSEW])?$/);
  if (dmsMatch) {
    const deg = parseFloat(dmsMatch[1]);
    const min = parseFloat(dmsMatch[2]);
    const sec = parseFloat(dmsMatch[3]);
    const hemi = dmsMatch[4];
    if (hemi === 'S' || hemi === 'W') sign = -1;
    if (hemi === 'N' || hemi === 'E') sign = 1;

    if (Number.isFinite(deg) && Number.isFinite(min) && Number.isFinite(sec) && min < 60 && sec < 60) {
      const dec = (Math.abs(deg) + min / 60 + sec / 3600) * sign;
      return clampCoord(dec, isLatitude);
    }
  }

  // Compact format: e.g. "5703.12" (meaning 57° 3' 12" as in user screenshot) or "204434"
  const numOnly = clean.replace(/[°'"NSEW+\-\s]/g, '');
  if (numOnly) {
    // If dot represents seconds: e.g. 5703.12 -> deg 57, min 03, sec 12
    if (numOnly.includes('.')) {
      const parts = numOnly.split('.');
      const intP = parts[0];
      const fracP = parts[1];
      if (intP.length >= 3) {
        const min = parseFloat(intP.slice(-2));
        const deg = parseFloat(intP.slice(0, -2));
        const sec = parseFloat(fracP.padEnd(2, '0').slice(0, 2));
        if (Number.isFinite(deg) && min < 60 && sec < 60) {
          const dec = (deg + min / 60 + sec / 3600) * sign;
          return clampCoord(dec, isLatitude);
        }
      }
    } else if (numOnly.length >= 5) {
      // 6 digits: e.g. 204434 -> deg 20, min 44, sec 34
      const sec = parseFloat(numOnly.slice(-2));
      const min = parseFloat(numOnly.slice(-4, -2));
      const deg = parseFloat(numOnly.slice(0, -4));
      if (Number.isFinite(deg) && min < 60 && sec < 60) {
        const dec = (deg + min / 60 + sec / 3600) * sign;
        return clampCoord(dec, isLatitude);
      }
    }
  }

  return null;
}

// ==========================================
// 3. D.D (Decimal Degrees)
// ==========================================

export function parseDecimalDegrees(raw: string, isLatitude: boolean): number | null {
  if (!raw) return null;
  const clean = raw.trim().toUpperCase();

  let sign = 1;
  if (clean.includes('S') || clean.includes('W') || clean.startsWith('-')) {
    sign = -1;
  }

  const numOnly = clean.replace(/[NSEW°\s]/g, '');
  const val = parseFloat(numOnly);
  if (Number.isFinite(val)) {
    const dec = Math.abs(val) * sign;
    return clampCoord(dec, isLatitude);
  }
  return null;
}

// ==========================================
// 4. UTM (Universal Transverse Mercator)
// ==========================================

/**
 * Standard WGS84 Ellipsoid constants
 */
const WGS84_A = 6378137.0; // semi-major axis
const WGS84_F = 1 / 298.257223563; // flattening
const WGS84_E = Math.sqrt(2 * WGS84_F - WGS84_F * WGS84_F); // eccentricity
const WGS84_E2 = WGS84_E * WGS84_E;
const WGS84_E_PRIME2 = WGS84_E2 / (1 - WGS84_E2);
const UTM_K0 = 0.9996;

/**
 * Converts Latitude and Longitude (WGS84) to UTM (Zone, Hemisphere, Easting, Northing).
 */
export function latLngToUTM(lat: number, lng: number): {
  zoneNumber: number;
  zoneLetter: string;
  easting: number;
  northing: number;
  fullString: string;
} {
  const radLat = (lat * Math.PI) / 180;
  const radLng = (lng * Math.PI) / 180;

  let zoneNumber = Math.floor((lng + 180) / 6) + 1;
  if (zoneNumber < 1) zoneNumber = 1;
  if (zoneNumber > 60) zoneNumber = 60;

  // Central meridian
  const centralLng = ((zoneNumber - 1) * 6 - 180 + 3) * (Math.PI / 180);
  const deltaLng = radLng - centralLng;

  const sinLat = Math.sin(radLat);
  const cosLat = Math.cos(radLat);
  const tanLat = Math.tan(radLat);

  const N = WGS84_A / Math.sqrt(1 - WGS84_E2 * sinLat * sinLat);
  const T = tanLat * tanLat;
  const C = WGS84_E_PRIME2 * cosLat * cosLat;
  const A = deltaLng * cosLat;

  // Meridian distance
  const M =
    WGS84_A *
    ((1 - WGS84_E2 / 4 - (3 * WGS84_E2 * WGS84_E2) / 64 - (5 * WGS84_E2 * WGS84_E2 * WGS84_E2) / 256) * radLat -
      ((3 * WGS84_E2) / 8 + (3 * WGS84_E2 * WGS84_E2) / 32 + (45 * WGS84_E2 * WGS84_E2 * WGS84_E2) / 1024) *
      Math.sin(2 * radLat) +
      ((15 * WGS84_E2 * WGS84_E2) / 256 + (45 * WGS84_E2 * WGS84_E2 * WGS84_E2) / 1024) * Math.sin(4 * radLat) -
      ((35 * WGS84_E2 * WGS84_E2 * WGS84_E2) / 3072) * Math.sin(6 * radLat));

  const easting =
    UTM_K0 *
    N *
    (A +
      ((1 - T + C) * A * A * A) / 6 +
      ((5 - 18 * T + T * T + 72 * C - 58 * WGS84_E_PRIME2) * A * A * A * A * A) / 120) +
    500000;

  let northing =
    UTM_K0 *
    (M +
      N *
      tanLat *
      ((A * A) / 2 +
        ((5 - T + 9 * C + 4 * C * C) * A * A * A * A) / 24 +
        ((61 - 58 * T + T * T + 600 * C - 330 * WGS84_E_PRIME2) * A * A * A * A * A * A) / 720));

  if (lat < 0) {
    northing += 10000000; // False northing for southern hemisphere
  }

  // Zone letter (MGRS latitude band)
  const zoneLetters = 'CDEFGHJKLMNPQRSTUVWX';
  const bandIdx = Math.floor((lat + 80) / 8);
  const zoneLetter = lat >= -80 && lat <= 84 && bandIdx >= 0 && bandIdx < zoneLetters.length ? zoneLetters[bandIdx] : 'N';

  const roundEasting = Math.round(easting);
  const roundNorthing = Math.round(northing);
  const fullString = `${zoneNumber}${zoneLetter} ${roundEasting}mE ${roundNorthing}mN`;

  return {
    zoneNumber,
    zoneLetter,
    easting: roundEasting,
    northing: roundNorthing,
    fullString,
  };
}

/**
 * Converts UTM back to Latitude and Longitude (WGS84).
 */
export function utmToLatLng(
  zoneNumber: number,
  isNorthHemisphere: boolean,
  easting: number,
  northing: number
): { latitude: number; longitude: number } | null {
  if (zoneNumber < 1 || zoneNumber > 60 || easting < 100000 || easting > 900000 || northing < 0 || northing > 10000000) {
    return null;
  }

  const x = easting - 500000;
  let y = northing;
  if (!isNorthHemisphere) {
    y -= 10000000;
  }

  const m = y / UTM_K0;
  const mu =
    m /
    (WGS84_A *
      (1 -
        WGS84_E2 / 4 -
        (3 * WGS84_E2 * WGS84_E2) / 64 -
        (5 * WGS84_E2 * WGS84_E2 * WGS84_E2) / 256));

  const e1 = (1 - Math.sqrt(1 - WGS84_E2)) / (1 + Math.sqrt(1 - WGS84_E2));
  const phi1 =
    mu +
    ((3 * e1) / 2 - (27 * e1 * e1 * e1) / 32) * Math.sin(2 * mu) +
    ((21 * e1 * e1) / 16 - (55 * e1 * e1 * e1 * e1) / 32) * Math.sin(4 * mu) +
    ((151 * e1 * e1 * e1) / 96) * Math.sin(6 * mu);

  const sinPhi1 = Math.sin(phi1);
  const cosPhi1 = Math.cos(phi1);
  const tanPhi1 = Math.tan(phi1);

  const N1 = WGS84_A / Math.sqrt(1 - WGS84_E2 * sinPhi1 * sinPhi1);
  const T1 = tanPhi1 * tanPhi1;
  const C1 = WGS84_E_PRIME2 * cosPhi1 * cosPhi1;
  const R1 = (WGS84_A * (1 - WGS84_E2)) / Math.pow(1 - WGS84_E2 * sinPhi1 * sinPhi1, 1.5);
  const D = x / (N1 * UTM_K0);

  let lat =
    phi1 -
    ((N1 * tanPhi1) / R1) *
    ((D * D) / 2 -
      ((5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * WGS84_E_PRIME2) * D * D * D * D) / 24 +
      ((61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * WGS84_E_PRIME2 - 3 * C1 * C1) *
        D *
        D *
        D *
        D *
        D *
        D) /
      720);

  const centralLng = ((zoneNumber - 1) * 6 - 180 + 3) * (Math.PI / 180);
  let lng =
    centralLng +
    (D -
      ((1 + 2 * T1 + C1) * D * D * D) / 6 +
      ((5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * WGS84_E_PRIME2 + 24 * T1 * T1) * D * D * D * D * D) / 120) /
    cosPhi1;

  lat = (lat * 180) / Math.PI;
  lng = (lng * 180) / Math.PI;

  return { latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) };
}

/**
 * Parses freeform UTM string like "42N 508316 2293481" or "42 N 508316 2293481".
 */
export function parseUTMString(raw: string): { latitude: number; longitude: number } | null {
  if (!raw) return null;
  const match = raw.trim().toUpperCase().match(/^(\d{1,2})\s*([C-XNS])\s+(\d{5,7})\s+(\d{6,8})$/);
  if (!match) return null;

  const zone = parseInt(match[1], 10);
  const bandOrHemi = match[2];
  const isNorth = bandOrHemi === 'N' || bandOrHemi >= 'N';
  const easting = parseFloat(match[3]);
  const northing = parseFloat(match[4]);

  return utmToLatLng(zone, isNorth, easting, northing);
}

// ==========================================
// 5. MGRS (Military Grid Reference System)
// ==========================================

const MGRS_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const MGRS_COL_1_3_5 = 'ABCDEFGH';
const MGRS_COL_2_4_6 = 'JKLMNPQR';
const MGRS_ROW_EVEN = 'FGHJKLMNPQRSTUV';
const MGRS_ROW_ODD = 'ABCDEFGHJKLMNPQ';

export function latLngToMGRS(lat: number, lng: number): string {
  const utm = latLngToUTM(lat, lng);
  const zone = utm.zoneNumber;
  const band = utm.zoneLetter;

  // 100,000m square coordinates
  const colSet = (zone - 1) % 3;
  const colAlphabet = colSet === 0 ? MGRS_COL_1_3_5 : colSet === 1 ? MGRS_COL_2_4_6 : MGRS_COL_1_3_5;
  const colIdx = (Math.floor(utm.easting / 100000) - 1) % 8;
  const colLetter = colAlphabet[Math.max(0, colIdx)] || 'A';

  const rowSet = (zone - 1) % 2;
  const rowAlphabet = rowSet === 0 ? MGRS_ROW_EVEN : MGRS_ROW_ODD;
  const rowIdx = Math.floor(utm.northing / 100000) % 20;
  const rowLetter = rowAlphabet[Math.max(0, rowIdx % rowAlphabet.length)] || 'A';

  // 5-digit precision Easting and Northing (1m accuracy)
  const east5 = String(Math.floor(utm.easting % 100000)).padStart(5, '0');
  const north5 = String(Math.floor(utm.northing % 100000)).padStart(5, '0');

  return `${zone}${band}${colLetter}${rowLetter}${east5}${north5}`;
}

export function parseMGRSString(raw: string): { latitude: number; longitude: number } | null {
  if (!raw) return null;
  const clean = raw.trim().toUpperCase().replace(/\s/g, '');
  const match = clean.match(/^(\d{1,2})([C-X])([A-Z]{2})(\d{2,10})$/);
  if (!match) return null;

  const zone = parseInt(match[1], 10);
  const band = match[2];
  const digits = match[4];
  const halfLen = digits.length / 2;
  if (!Number.isInteger(halfLen)) return null;

  const eastSub = digits.slice(0, halfLen).padEnd(5, '0');
  const northSub = digits.slice(halfLen).padEnd(5, '0');

  const eastOffset = parseInt(eastSub, 10);
  const northOffset = parseInt(northSub, 10);

  // Approximate center of 100km square for given band
  const isNorth = band >= 'N';
  const approxNorthing = (band.charCodeAt(0) - 'C'.charCodeAt(0)) * 888000;
  const baseNorthing = Math.floor(approxNorthing / 100000) * 100000;

  return utmToLatLng(zone, isNorth, 500000 + eastOffset - 50000, baseNorthing + northOffset);
}

// ==========================================
// 6. Universal Auto-Detect & Standalone Parsers
// ==========================================

export function clampCoord(val: number, isLatitude: boolean): number | null {
  const limit = isLatitude ? 90 : 180;
  if (Number.isFinite(val) && val >= -limit && val <= limit) {
    return Number(val.toFixed(6));
  }
  return null;
}

/**
 * Parses ANY single coordinate component (Latitude OR Longitude).
 * Accepts:
 * - Decimal Degrees: "20.7428", "20.7428° N", "-20.7428", "20.7428 N"
 * - Degrees Decimal Minutes (DDM): "20° 44.570' N", "20 44.570 N", "20 44.570", "2044.570"
 * - Degrees Minutes Seconds (DMS): "20° 44' 34.2\" N", "20 44 34 N", "20 44 34"
 * - Handles smart quotes (’, ”, ′, ″), prefixed/suffixed cardinal directions (N, S, E, W).
 */
export function parseSingleCoordinate(raw: string, isLatitude: boolean): number | null {
  if (!raw) return null;

  // Normalize quotes and degree characters
  let clean = raw
    .trim()
    .toUpperCase()
    .replace(/[’′‘]/g, "'")
    .replace(/[”″“]/g, '"')
    .replace(/[ºdD]/g, '°')
    .replace(/\s+/g, ' ');

  if (!clean) return null;

  // Determine hemisphere / negative sign
  let sign = 1;
  if (clean.includes('S') || clean.includes('W') || clean.startsWith('-')) {
    sign = -1;
  } else if (clean.includes('N') || clean.includes('E') || clean.startsWith('+')) {
    sign = 1;
  }

  // Strip cardinal letters and leading +/- from the number string for pattern matching
  const stripped = clean
    .replace(/[NSEW+\-]/g, '')
    .trim();

  // Pattern 1: Degrees, Minutes, Seconds (DMS)
  // e.g. 20° 44' 34" or 20 44 34 or 20° 44' 34.5"
  const dmsMatch = stripped.match(/^(\d{1,3})[°\s]+(\d{1,2})['\s]+(\d{1,2}(?:\.\d+)?)["]?$/);
  if (dmsMatch) {
    const deg = parseFloat(dmsMatch[1]);
    const min = parseFloat(dmsMatch[2]);
    const sec = parseFloat(dmsMatch[3]);
    if (Number.isFinite(deg) && Number.isFinite(min) && Number.isFinite(sec) && min < 60 && sec < 60) {
      const dec = (Math.abs(deg) + min / 60 + sec / 3600) * sign;
      return clampCoord(dec, isLatitude);
    }
  }

  // Pattern 2: Degrees, Decimal Minutes (DDM - Marine GPS standard)
  // e.g. 20° 44.570' or 20 44.570 or 20° 44.570 or 070 52.340
  const ddmMatch = stripped.match(/^(\d{1,3})[°\s]+(\d{1,2}(?:\.\d+)?)['\s]*$/);
  if (ddmMatch) {
    const deg = parseFloat(ddmMatch[1]);
    const min = parseFloat(ddmMatch[2]);
    if (Number.isFinite(deg) && Number.isFinite(min) && min >= 0 && min < 60) {
      const dec = (Math.abs(deg) + min / 60) * sign;
      return clampCoord(dec, isLatitude);
    }
  }

  // Pattern 3: Standard Decimal Degrees
  // e.g. 20.7428 or 20.7428° or 70.8723
  const ddMatch = stripped.match(/^(\d{1,3}(?:\.\d+)?)[°\s]*$/);
  if (ddMatch) {
    const val = parseFloat(ddMatch[1]);
    if (Number.isFinite(val)) {
      // If the number is compact marine GPS notation (e.g. 2044.570 for Lat > 90 or 07052.340 for Lng):
      const dotIdx = stripped.indexOf('.');
      const intPart = dotIdx !== -1 ? stripped.slice(0, dotIdx) : stripped;
      const decPart = dotIdx !== -1 ? stripped.slice(dotIdx) : '';

      // If value exceeds limits for standard degrees (Lat > 90 or Lng > 180) and has 3+ digits,
      // it's compact DDMM.mmm notation e.g. 2044.570 or 7104.811
      if ((isLatitude && val > 90) || (!isLatitude && val > 180) || intPart.length >= 4) {
        if (intPart.length >= 3) {
          const minInt = intPart.slice(-2);
          const degPart = intPart.slice(0, -2);
          const deg = parseFloat(degPart);
          const min = parseFloat(minInt + decPart);
          if (Number.isFinite(deg) && Number.isFinite(min) && min < 60) {
            const dec = (deg + min / 60) * sign;
            const res = clampCoord(dec, isLatitude);
            if (res !== null) return res;
          }
        }
      }

      const dec = val * sign;
      return clampCoord(dec, isLatitude);
    }
  }

  return null;
}

/**
 * Universal Coordinate Parser that accepts ANY coordinate pair string
 * and auto-detects DDMM.MM, DDMM.SS, D.D, UTM, or MGRS without failing.
 */
export function parseAnyCoordinate(
  text: string,
  hintFormat?: CoordinateFormatId
): ParsedCoordResult | null {
  if (!text) return null;
  const clean = text.trim();
  if (!clean) return null;

  // 1. Try MGRS if hinted or matches format
  if (hintFormat === 'MGRS' || /^\d{1,2}[C-X][A-Z]{2}\d{4,10}$/i.test(clean.replace(/\s/g, ''))) {
    const res = parseMGRSString(clean);
    if (res) return buildResult(res.latitude, res.longitude, 'MGRS');
  }

  // 2. Try UTM if hinted or matches format
  if (hintFormat === 'UTM' || /^\d{1,2}\s*[C-XNS]\s+\d+\s+\d+$/i.test(clean)) {
    const res = parseUTMString(clean);
    if (res) return buildResult(res.latitude, res.longitude, 'UTM');
  }

  // 3. Check for Google Maps / Shared Web URL (e.g. https://maps.google.com/?q=20.7428,70.8723 or @20.7428,70.8723)
  const urlCoordMatch = clean.match(/(?:@|q=|ll=|loc:)([+-]?\d{1,2}(?:\.\d+)?)[,\s]+([+-]?\d{1,3}(?:\.\d+)?)/i);
  if (urlCoordMatch) {
    const urlLat = parseFloat(urlCoordMatch[1]);
    const urlLng = parseFloat(urlCoordMatch[2]);
    const clampedLat = clampCoord(urlLat, true);
    const clampedLng = clampCoord(urlLng, false);
    if (clampedLat !== null && clampedLng !== null) {
      return buildResult(clampedLat, clampedLng, 'D.D');
    }
  }

  let partA = '';
  let partB = '';

  // 4. Multi-strategy pair splitting:
  // Strategy A: Explicit Delimiters (Comma ',', Semicolon ';', Pipe '|', Slash '/')
  if (/[,;\/|]/.test(clean)) {
    const rawParts = clean.split(/[,;\/|]+/).map((s) => s.trim()).filter(Boolean);
    if (rawParts.length >= 2) {
      partA = rawParts[0];
      partB = rawParts[1];
    }
  }

  // Strategy B: Cardinal Direction Boundary (split after [NS] or [EW])
  // e.g. "20° 44.570' N 070° 52.340' E" or "20.7428N 70.8723E" or "20 44.570 N 70 52.340 E"
  if (!partA && /[NS]/i.test(clean) && /[EW]/i.test(clean)) {
    const cardSplit = clean.split(/(?<=[NSEW])[\s,]+(?=[+-]?\d|[NSEW])/i);
    if (cardSplit.length >= 2) {
      partA = cardSplit[0].trim();
      partB = cardSplit[1].trim();
    }
  }

  // Strategy C: Space-separated numerical blocks
  if (!partA) {
    const tokens = clean.split(/\s+/).filter(Boolean);
    // 2 numbers: e.g. "20.7428 70.8723"
    if (tokens.length === 2) {
      partA = tokens[0];
      partB = tokens[1];
    }
    // 4 tokens: e.g. "20 44.570 70 52.340"
    else if (tokens.length === 4) {
      partA = `${tokens[0]} ${tokens[1]}`;
      partB = `${tokens[2]} ${tokens[3]}`;
    }
    // 6 tokens: e.g. "20 44 34 70 52 20"
    else if (tokens.length === 6) {
      partA = `${tokens[0]} ${tokens[1]} ${tokens[2]}`;
      partB = `${tokens[3]} ${tokens[4]} ${tokens[5]}`;
    }
  }

  // If still not split, try fallback split on space
  if (!partA) {
    const rawParts = clean.split(/\s+/).filter(Boolean);
    if (rawParts.length >= 2) {
      partA = rawParts[0];
      partB = rawParts.slice(1).join(' ');
    }
  }

  if (partA && partB) {
    // Check if user entered Longitude first and Latitude second (e.g. "70.8723 E, 20.7428 N")
    const aHasLng = /[EW]/i.test(partA);
    const aHasLat = /[NS]/i.test(partA);
    const bHasLng = /[EW]/i.test(partB);
    const bHasLat = /[NS]/i.test(partB);

    if (aHasLng && bHasLat && !aHasLat && !bHasLng) {
      const temp = partA;
      partA = partB;
      partB = temp;
    }

    const lat = parseSingleCoordinate(partA, true);
    const lng = parseSingleCoordinate(partB, false);

    if (lat !== null && lng !== null) {
      // Detect format
      let detectedFormat: CoordinateFormatId = hintFormat && hintFormat !== 'AUTO' ? hintFormat : 'DDMM.MM';
      if (!hintFormat || hintFormat === 'AUTO') {
        if (clean.includes('"') || /\d+\s+\d+\s+\d+/.test(clean)) {
          detectedFormat = 'DDMM.SS';
        } else if (clean.includes("'") || clean.includes('°') || Math.abs(parseFloat(partA)) > 90) {
          detectedFormat = 'DDMM.MM';
        } else {
          detectedFormat = 'D.D';
        }
      }
      return buildResult(lat, lng, detectedFormat);
    }
  }

  return null;
}

function buildResult(lat: number, lng: number, formatDetected: CoordinateFormatId): ParsedCoordResult {
  const ddmLat = toDDMM_MM(lat, true);
  const ddmLng = toDDMM_MM(lng, false);

  const dmsLat = toDDMM_SS(lat, true);
  const dmsLng = toDDMM_SS(lng, false);

  const ddLat = `${Math.abs(lat).toFixed(5)}° ${lat >= 0 ? 'N' : 'S'}`;
  const ddLng = `${Math.abs(lng).toFixed(5)}° ${lng >= 0 ? 'E' : 'W'}`;

  const utm = latLngToUTM(lat, lng);
  const mgrs = latLngToMGRS(lat, lng);

  return {
    latitude: lat,
    longitude: lng,
    formatDetected,
    formattedDDM: {
      lat: ddmLat.displayStr,
      lng: ddmLng.displayStr,
      full: `${ddmLat.displayStr}, ${ddmLng.displayStr}`,
    },
    formattedDMS: {
      lat: dmsLat.displayStr,
      lng: dmsLng.displayStr,
      full: `${dmsLat.displayStr}, ${dmsLng.displayStr}`,
    },
    formattedDD: {
      lat: ddLat,
      lng: ddLng,
      full: `${lat.toFixed(5)}°, ${lng.toFixed(5)}°`,
    },
    formattedUTM: utm.fullString,
    formattedMGRS: mgrs,
  };
}
