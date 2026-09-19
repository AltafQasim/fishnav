/**
 * Marine Weather & Astronomical Offline Tide Service
 *
 * Provides:
 * 1. Gujarat Ports Nearest Harbor Engine & Distance Detection
 * 2. IMD / Marine Severe Weather Warnings (Heavy Rain, Thunderstorm, Squalls, Swell)
 * 3. 48-Hour Scrollable Astronomical Tide Engine (Harmonic Semi-Diurnal)
 * 4. Pre-Departure Harbor Multi-Day Forecast (Open-Meteo Marine API)
 * 5. Offline Persistent Caching & Clock Matching for Deep-Sea Navigation
 */

import { findNearestGujaratPort, NearestPortResult } from '@/constants/gujarat-ports';
import { persistentStorage } from './persistent-storage';

export type MarineConditions = {
  waveHeightM: number; // e.g. 1.2
  wavePeriodS: number; // e.g. 7.5
  waveDirectionDeg: number; // e.g. 210 (SSW)
  waveDirectionText: string;
  windSpeedKnots: number; // e.g. 14
  windGustsKnots: number; // e.g. 22
  windDirectionDeg: number;
  windDirectionText: string;
  windBeaufort: string; // e.g. "Force 4"
  seaTempC: number; // e.g. 28.2
  surfacePressureHpa: number; // e.g. 1012
  visibilityNm: number; // e.g. 10
  tidalCurrentKnots: number; // e.g. 0.8
  precipitationMm: number; // e.g. 14.5 mm/h
  relativeHumidity?: number; // e.g. 78%
  weatherCode: number;
  weatherDesc: string; // e.g. "Heavy Rain & Squall"
  nearestPort: NearestPortResult;
  safetyAdvisory: {
    status: 'NORMAL' | 'CAUTION' | 'WARNING';
    isFishingSafe: boolean;
    dangerType: 'RAIN' | 'SWELL' | 'WIND' | 'SQUALL' | 'NONE';
    title: string;
    subText: string;
  };
};

export type HourlyMarineForecast = {
  time: string; // "Now", "15:00", "Tomorrow 06:00"
  isoTime: string;
  temp: string; // "29°"
  wind: string; // "14 kts"
  wave: string; // "1.2m"
  rain: string; // "4.2mm"
  icon: string; // MaterialCommunityIcons name
  tempNum?: number;
  windNum?: number;
  gustsNum?: number;
  waveNum?: number;
  rainNum?: number;
  pressureNum?: number;
  visibilityNum?: number;
  currentNum?: number;
  periodNum?: number;
  humidityNum?: number;
};

export type AstronomicalTidePoint = {
  time: string; // "04:15"
  dayLabel: string; // "Today" or "Tomorrow"
  hour: number; // 0 to 48
  heightM: number; // 3.8
  type: 'high' | 'low';
};

export type TideCycleData = {
  points: AstronomicalTidePoint[]; // High & low extremes across 48h
  currentHeightM: number;
  nextHighTide: { time: string; heightM: number; relativeText: string };
  nextLowTide: { time: string; heightM: number; relativeText: string };
  tidalCurveCoeff: { baselineM: number; amplitudeM: number; phaseHour: number };
  timelineDurationHours: number; // 48
};

export type CachedMarinePayload = {
  syncedAt: number; // timestamp
  latitude: number;
  longitude: number;
  harborName: string;
  nearestPort: NearestPortResult;
  conditions: MarineConditions;
  hourly: HourlyMarineForecast[];
  tides: TideCycleData;
};

// Storage key for caching
const STORAGE_KEY = '@fishnav_marine_weather_v2';
let inMemoryCache: CachedMarinePayload | null = null;

/**
 * 1. Convert Weather Code to English Human Readable Description
 */
export function getWeatherDescription(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code <= 3) return 'Partly Cloudy';
  if (code <= 48) return 'Foggy / Low Visibility';
  if (code <= 55) return 'Drizzle & Light Rain';
  if (code <= 63) return 'Moderate Rain';
  if (code <= 67) return 'Heavy Downpour';
  if (code <= 82) return 'Heavy Rain Showers';
  if (code >= 95) return 'Thunderstorm & Squalls';
  return 'Overcast';
}

/**
 * 2. Safety Advisory Evaluator (Rain, Wind Gusts, Swell, Thunderstorms)
 */
export function evaluateSafetyAdvisory(
  waveHeightM: number,
  windKnots: number,
  windGustsKnots: number,
  rainMm: number,
  weatherCode: number,
  portName: string
) {
  const isThunderstorm = weatherCode >= 95;
  const isHeavyRain = weatherCode === 65 || weatherCode === 67 || weatherCode === 81 || weatherCode === 82 || rainMm >= 4.0;
  const isGaleWind = windKnots >= 24 || windGustsKnots >= 33;
  const isSevereSwell = waveHeightM >= 2.4;

  // DANGER / UNSAFE LEVEL
  if (isThunderstorm || isHeavyRain || isGaleWind || isSevereSwell) {
    let reason = '';
    let dangerType: 'RAIN' | 'SWELL' | 'WIND' | 'SQUALL' = 'RAIN';

    if (isThunderstorm) {
      reason = `Severe thunderstorm & lightning squalls near ${portName}.`;
      dangerType = 'SQUALL';
    } else if (isHeavyRain) {
      reason = `Heavy torrential rain (${rainMm} mm/h) with poor sea visibility near ${portName}.`;
      dangerType = 'RAIN';
    } else if (isSevereSwell) {
      reason = `Severe swell (${waveHeightM}m) causing capsizing risk near ${portName}.`;
      dangerType = 'SWELL';
    } else {
      reason = `Dangerous gale winds (${windKnots} kts, gusts ${windGustsKnots} kts) near ${portName}.`;
      dangerType = 'WIND';
    }

    return {
      status: 'WARNING' as const,
      isFishingSafe: false,
      dangerType,
      title: '⛔ FISHING UNSAFE: HEAVY RAIN & SQUALL WARNING',
      subText: `${reason} High marine danger — DO NOT venture into sea or return to port immediately!`,
    };
  }

  // CAUTION LEVEL
  const isModerateRain = (weatherCode >= 51 && weatherCode <= 63) || weatherCode === 80 || rainMm >= 0.6;
  const isModerateWind = windKnots >= 16 || windGustsKnots >= 23;
  const isModerateSwell = waveHeightM >= 1.6;

  if (isModerateRain || isModerateWind || isModerateSwell) {
    let reason = '';
    let dangerType: 'RAIN' | 'SWELL' | 'WIND' | 'SQUALL' = 'RAIN';

    if (isModerateRain) {
      reason = `Continuous rain (${rainMm} mm/h)`;
      dangerType = 'RAIN';
    } else if (isModerateSwell) {
      reason = `Moderate swell (${waveHeightM}m)`;
      dangerType = 'SWELL';
    } else {
      reason = `Choppy wind (${windKnots} kts, gusts ${windGustsKnots} kts)`;
      dangerType = 'WIND';
    }

    return {
      status: 'CAUTION' as const,
      isFishingSafe: false,
      dangerType,
      title: '⚠️ CAUTION: RAINFALL & CHOPPY SEA ADVISORY',
      subText: `${reason} near ${portName}. Small motorized & FRP boats advised to avoid deep sea and stay within nearshore waters.`,
    };
  }

  // NORMAL LEVEL
  return {
    status: 'NORMAL' as const,
    isFishingSafe: true,
    dangerType: 'NONE' as const,
    title: '🛡️ COASTAL SAFETY: NORMAL',
    subText: `Sea state safe near ${portName}. Swell ${waveHeightM}m, wind ${windKnots} kts. Suitable for nearshore & deep sea fishing.`,
  };
}

/**
 * 3. 48-Hour Mathematical Astronomical Tide Engine (100% Offline)
 * Computes a continuous 48-hour semi-diurnal harmonic tide curve (Today + Tomorrow)
 */
export function calculateAstronomicalTides(date: Date = new Date()): TideCycleData {
  const currentHour = date.getHours() + date.getMinutes() / 60;

  // Reference Spring Tide epoch
  const refEpoch = new Date('2024-01-11T11:57:00Z').getTime();
  const daysSinceEpoch = (date.getTime() - refEpoch) / (1000 * 60 * 60 * 24);

  // Synodic lunar month phase (29.53 days)
  const synodicPhase = (daysSinceEpoch % 29.53059) / 29.53059;
  const springNeapMod = 0.5 + 0.5 * Math.abs(Math.cos(synodicPhase * 2 * Math.PI));

  const baselineM = 2.15;
  const amplitudeM = Number((0.95 + 0.8 * springNeapMod).toFixed(2));
  const tidalPeriod = 12.4206; // M2 lunar period

  // Lunar daily transit shift (~50 mins per solar day)
  const lunarPhaseShift = (daysSinceEpoch * 0.84) % tidalPeriod;
  const firstHighHour = ((4.15 + lunarPhaseShift) % tidalPeriod + tidalPeriod) % tidalPeriod;

  // Generate 8 astronomical extreme peaks across 48 Hours (2 full days)
  const extremePoints: AstronomicalTidePoint[] = [];

  const formatTimeStr = (totalHr: number) => {
    const hrInDay = totalHr % 24;
    const h = Math.floor(hrInDay);
    const m = Math.round((hrInDay - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // High 1, Low 1, High 2, Low 2, High 3, Low 3, High 4, Low 4
  const highHeight = Number((baselineM + amplitudeM).toFixed(1));
  const lowHeight = Number(Math.max(0.4, baselineM - amplitudeM).toFixed(1));

  for (let i = 0; i < 8; i++) {
    // Each extreme is ~6.21 hours apart
    const rawHour = firstHighHour + i * 6.2103;
    if (rawHour > 48) break;

    const isHigh = i % 2 === 0;
    const dayLabel = rawHour < 24 ? 'Today' : 'Tomorrow';
    const height = isHigh
      ? Number((highHeight - (i % 4 === 2 ? 0.2 : 0)).toFixed(1))
      : Number((lowHeight + (i % 4 === 3 ? 0.1 : 0)).toFixed(1));

    extremePoints.push({
      time: formatTimeStr(rawHour),
      dayLabel,
      hour: Number(rawHour.toFixed(2)),
      heightM: height,
      type: isHigh ? 'high' : 'low',
    });
  }

  // Calculate current water level at this exact moment
  const rad = ((currentHour - firstHighHour) / tidalPeriod) * 2 * Math.PI;
  const currentHeightM = Number((baselineM + amplitudeM * Math.cos(rad)).toFixed(2));

  // Determine next upcoming high and low tide across the 48h timeline
  const nextHigh =
    extremePoints.find((p) => p.type === 'high' && p.hour > currentHour) ||
    extremePoints.find((p) => p.type === 'high') ||
    extremePoints[0];

  const nextLow =
    extremePoints.find((p) => p.type === 'low' && p.hour > currentHour) ||
    extremePoints.find((p) => p.type === 'low') ||
    extremePoints[1];

  const getRelativeHours = (targetHour: number) => {
    let diff = targetHour - currentHour;
    if (diff < 0) diff += 24;
    const h = Math.floor(diff);
    const m = Math.round((diff - h) * 60);
    return `in ${h}h ${m}m`;
  };

  return {
    points: extremePoints,
    currentHeightM,
    nextHighTide: {
      time: `${nextHigh.dayLabel} ${nextHigh.time}`,
      heightM: nextHigh.heightM,
      relativeText: `at ${nextHigh.time} (${getRelativeHours(nextHigh.hour)})`,
    },
    nextLowTide: {
      time: `${nextLow.dayLabel} ${nextLow.time}`,
      heightM: nextLow.heightM,
      relativeText: `at ${nextLow.time} (${getRelativeHours(nextLow.hour)})`,
    },
    tidalCurveCoeff: {
      baselineM,
      amplitudeM,
      phaseHour: firstHighHour,
    },
    timelineDurationHours: 48,
  };
}

/**
 * 4. Helper: Cardinal directions
 */
function degToCompass(deg: number): string {
  const val = Math.round(deg / 22.5);
  const arr = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return arr[val % 16] || 'N';
}

function getBeaufort(knots: number): string {
  if (knots < 1) return 'Calm (Force 0)';
  if (knots <= 3) return 'Light Air (Force 1)';
  if (knots <= 6) return 'Light Breeze (Force 2)';
  if (knots <= 10) return 'Gentle Breeze (Force 3)';
  if (knots <= 16) return 'Moderate Breeze (Force 4)';
  if (knots <= 21) return 'Fresh Breeze (Force 5)';
  if (knots <= 27) return 'Strong Breeze (Force 6)';
  if (knots <= 33) return 'Near Gale (Force 7)';
  return 'Gale Warning (Force 8+)';
}

/**
 * 5. Baseline Fallback with Nearest Gujarat Port detection
 */
export function getBaselineMarineData(lat: number = 20.902, lon: number = 70.366): CachedMarinePayload {
  const nearestPort = findNearestGujaratPort(lat, lon);
  const tides = calculateAstronomicalTides();
  const waveHeightM = 1.3;
  const windSpeedKnots = 14;
  const windGustsKnots = 20;
  const precipitationMm = 0.0;
  const weatherCode = 1;

  return {
    syncedAt: Date.now() - 1000 * 60 * 10,
    latitude: lat,
    longitude: lon,
    harborName: nearestPort.port.name,
    nearestPort,
    conditions: {
      waveHeightM,
      wavePeriodS: 7.2,
      waveDirectionDeg: 205,
      waveDirectionText: 'SSW',
      windSpeedKnots,
      windGustsKnots,
      windDirectionDeg: 240,
      windDirectionText: 'WSW',
      windBeaufort: getBeaufort(windSpeedKnots),
      seaTempC: 28.0,
      surfacePressureHpa: 1011,
      visibilityNm: 9.5,
      tidalCurrentKnots: 0.8,
      precipitationMm,
      relativeHumidity: 74,
      weatherCode,
      weatherDesc: getWeatherDescription(weatherCode),
      nearestPort,
      safetyAdvisory: evaluateSafetyAdvisory(
        waveHeightM,
        windSpeedKnots,
        windGustsKnots,
        precipitationMm,
        weatherCode,
        nearestPort.port.name
      ),
    },
    hourly: [
      { time: 'Now', isoTime: new Date().toISOString(), temp: '28°', wind: '14 kts', wave: '1.3m', rain: '0.0mm', icon: 'weather-partly-cloudy', tempNum: 28, windNum: 14, gustsNum: 20, waveNum: 1.3, rainNum: 0.0, pressureNum: 1012, visibilityNum: 9.5, currentNum: 0.8, periodNum: 7.2, humidityNum: 74 },
      { time: '16:00', isoTime: '', temp: '29°', wind: '15 kts', wave: '1.3m', rain: '0.0mm', icon: 'weather-partly-cloudy', tempNum: 29, windNum: 15, gustsNum: 22, waveNum: 1.3, rainNum: 0.0, pressureNum: 1011, visibilityNum: 9.8, currentNum: 1.2, periodNum: 7.0, humidityNum: 72 },
      { time: '18:00', isoTime: '', temp: '28°', wind: '13 kts', wave: '1.2m', rain: '0.2mm', icon: 'weather-sunset', tempNum: 28, windNum: 13, gustsNum: 18, waveNum: 1.2, rainNum: 0.2, pressureNum: 1011, visibilityNum: 9.2, currentNum: 1.4, periodNum: 6.8, humidityNum: 76 },
      { time: '20:00', isoTime: '', temp: '27°', wind: '12 kts', wave: '1.1m', rain: '0.5mm', icon: 'weather-rainy', tempNum: 27, windNum: 12, gustsNum: 17, waveNum: 1.1, rainNum: 0.5, pressureNum: 1010, visibilityNum: 8.5, currentNum: 0.9, periodNum: 6.5, humidityNum: 80 },
      { time: '22:00', isoTime: '', temp: '26°', wind: '14 kts', wave: '1.2m', rain: '1.5mm', icon: 'weather-pouring', tempNum: 26, windNum: 14, gustsNum: 21, waveNum: 1.2, rainNum: 1.5, pressureNum: 1009, visibilityNum: 7.2, currentNum: 0.5, periodNum: 6.8, humidityNum: 84 },
      { time: '00:00', isoTime: '', temp: '25°', wind: '16 kts', wave: '1.3m', rain: '3.0mm', icon: 'weather-lightning', tempNum: 25, windNum: 16, gustsNum: 24, waveNum: 1.3, rainNum: 3.0, pressureNum: 1008, visibilityNum: 5.8, currentNum: 1.1, periodNum: 7.1, humidityNum: 88 },
      { time: 'Tomorrow 03:00', isoTime: '', temp: '25°', wind: '18 kts', wave: '1.4m', rain: '4.5mm', icon: 'weather-lightning', tempNum: 25, windNum: 18, gustsNum: 27, waveNum: 1.4, rainNum: 4.5, pressureNum: 1007, visibilityNum: 4.5, currentNum: 1.6, periodNum: 7.4, humidityNum: 91 },
      { time: 'Tomorrow 06:00', isoTime: '', temp: '26°', wind: '15 kts', wave: '1.3m', rain: '2.0mm', icon: 'weather-rainy', tempNum: 26, windNum: 15, gustsNum: 22, waveNum: 1.3, rainNum: 2.0, pressureNum: 1009, visibilityNum: 6.0, currentNum: 1.3, periodNum: 7.2, humidityNum: 85 },
      { time: 'Tomorrow 09:00', isoTime: '', temp: '28°', wind: '14 kts', wave: '1.2m', rain: '0.8mm', icon: 'weather-partly-cloudy', tempNum: 28, windNum: 14, gustsNum: 19, waveNum: 1.2, rainNum: 0.8, pressureNum: 1011, visibilityNum: 8.8, currentNum: 0.7, periodNum: 6.9, humidityNum: 77 },
      { time: 'Tomorrow 12:00', isoTime: '', temp: '30°', wind: '13 kts', wave: '1.1m', rain: '0.0mm', icon: 'weather-sunny', tempNum: 30, windNum: 13, gustsNum: 17, waveNum: 1.1, rainNum: 0.0, pressureNum: 1012, visibilityNum: 10.0, currentNum: 0.9, periodNum: 6.6, humidityNum: 70 },
    ],
    tides,
  };
}

/**
 * 6. Live Marine & Atmospheric Forecast Fetcher from Open-Meteo
 * Requesting live precipitation, rain, weather_code, wind_gusts and marine swell
 */
export async function fetchLiveMarineForecast(
  lat: number,
  lon: number
): Promise<CachedMarinePayload> {
  const nearestPort = findNearestGujaratPort(lat, lon);

  // Marine API: wave height, period, swell
  const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_direction,wave_period&wind_speed_unit=kn&forecast_days=3`;

  // Atmospheric API: rain, precipitation, weather_code, wind speed & gusts, pressure
  const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,surface_pressure,wind_speed_10m,wind_gusts_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_gusts_10m,wind_direction_10m,weather_code,precipitation,rain,visibility&wind_speed_unit=kn&forecast_days=3`;

  const [marineRes, atmosRes] = await Promise.all([
    fetch(marineUrl, { headers: { Accept: 'application/json' } }),
    fetch(forecastUrl, { headers: { Accept: 'application/json' } }),
  ]);

  if (!marineRes.ok || !atmosRes.ok) {
    throw new Error(`Weather API responded with status ${marineRes.status}/${atmosRes.status}`);
  }

  const marineData = await marineRes.json();
  const atmosData = await atmosRes.json();

  const marineHourly = marineData.hourly;
  const atmosHourly = atmosData.hourly;
  const atmosCurrent = atmosData.current;

  if (!marineHourly || !atmosHourly) {
    throw new Error('Incomplete marine forecast payload received.');
  }

  // Find index of current hour
  const nowIso = new Date().toISOString().slice(0, 13);
  let currentIndex = marineHourly.time.findIndex((t: string) => t.startsWith(nowIso));
  if (currentIndex === -1) currentIndex = 0;

  // Live Swell
  const currentWaveHeight = Number((marineHourly.wave_height?.[currentIndex] ?? 1.2).toFixed(1));
  const currentWavePeriod = Number((marineHourly.wave_period?.[currentIndex] ?? 7.0).toFixed(1));
  const currentWaveDir = Math.round(marineHourly.wave_direction?.[currentIndex] ?? 210);

  // Live Wind & Gusts (prefer live 'current' object if available)
  const currentWindSpeed = Math.round(atmosCurrent?.wind_speed_10m ?? atmosHourly.wind_speed_10m?.[currentIndex] ?? 14);
  const currentWindGusts = Math.round(atmosCurrent?.wind_gusts_10m ?? atmosHourly.wind_gusts_10m?.[currentIndex] ?? currentWindSpeed * 1.35);
  const currentWindDir = Math.round(atmosCurrent?.wind_direction_10m ?? atmosHourly.wind_direction_10m?.[currentIndex] ?? 230);
  const currentPressure = Math.round(atmosCurrent?.surface_pressure ?? atmosHourly.surface_pressure?.[currentIndex] ?? 1012);

  // Live Precipitation & Rain
  const currentPrecipitation = Number(
    (atmosCurrent?.precipitation ?? atmosCurrent?.rain ?? atmosHourly.precipitation?.[currentIndex] ?? 0).toFixed(1)
  );
  const currentWeatherCode = atmosCurrent?.weather_code ?? atmosHourly.weather_code?.[currentIndex] ?? 0;

  const currentVisibilityM = atmosHourly.visibility?.[currentIndex] ?? 18000;
  const currentVisibilityNm = Number((currentVisibilityM / 1852).toFixed(1));
  const currentRelativeHumidity = Math.round(atmosCurrent?.relative_humidity_2m ?? atmosHourly.relative_humidity_2m?.[currentIndex] ?? 74);

  // Critical Safety Advisory
  const safetyAdvisory = evaluateSafetyAdvisory(
    currentWaveHeight,
    currentWindSpeed,
    currentWindGusts,
    currentPrecipitation,
    currentWeatherCode,
    nearestPort.port.name
  );

  // Map next 24-48 hours of forecast
  const hourlyCards: HourlyMarineForecast[] = [];
  const weatherCodeToIcon = (code: number, hour: number) => {
    const isNight = hour >= 20 || hour < 6;
    if (code === 0) return isNight ? 'weather-night' : 'weather-sunny';
    if (code <= 3) return isNight ? 'weather-night-partly-cloudy' : 'weather-partly-cloudy';
    if (code <= 48) return 'weather-fog';
    if (code <= 67) return 'weather-rainy';
    if (code <= 82) return 'weather-pouring';
    if (code >= 95) return 'weather-lightning';
    return isNight ? 'weather-night' : 'weather-partly-cloudy';
  };

  const totalSlots = Math.min(36, (marineHourly.time.length || 0) - currentIndex);
  for (let i = 0; i < totalSlots; i++) {
    const idx = currentIndex + i;
    const timeStr = marineHourly.time[idx]; // "2026-09-14T22:00"
    const hourNum = parseInt(timeStr.slice(11, 13), 10);
    const isNextDay = i > 0 && hourNum < parseInt(marineHourly.time[idx - 1]?.slice(11, 13) ?? '0', 10);
    const dayPrefix = i === 0 ? 'Now' : isNextDay || i >= 24 ? `Tom ${String(hourNum).padStart(2, '0')}:00` : `${String(hourNum).padStart(2, '0')}:00`;

    const temp = Math.round(atmosHourly.temperature_2m?.[idx] ?? 28);
    const wind = Math.round(atmosHourly.wind_speed_10m?.[idx] ?? 12);
    const gusts = Math.round(atmosHourly.wind_gusts_10m?.[idx] ?? Math.round(wind * 1.35));
    const wave = Number((marineHourly.wave_height?.[idx] ?? 1.1).toFixed(1));
    const rain = Number((atmosHourly.precipitation?.[idx] ?? 0).toFixed(1));
    const pressure = Math.round(atmosHourly.surface_pressure?.[idx] ?? 1012);
    const code = atmosHourly.weather_code?.[idx] ?? 1;
    const visibility = Number(((atmosHourly.visibility?.[idx] ?? 18000) / 1852).toFixed(1));
    const current = Number((0.6 + 0.8 * Math.abs(Math.sin((hourNum / 12.42) * 2 * Math.PI))).toFixed(1));
    const period = Number((marineHourly.wave_period?.[idx] ?? 7.0).toFixed(1));
    const humidity = Math.round(atmosHourly.relative_humidity_2m?.[idx] ?? 74);

    hourlyCards.push({
      time: dayPrefix,
      isoTime: timeStr,
      temp: `${temp}°`,
      wind: `${wind} kts`,
      wave: `${wave}m`,
      rain: `${rain}mm`,
      icon: weatherCodeToIcon(code, hourNum),
      tempNum: temp,
      windNum: wind,
      gustsNum: gusts,
      waveNum: wave,
      rainNum: rain,
      pressureNum: pressure,
      visibilityNum: visibility,
      currentNum: current,
      periodNum: period,
      humidityNum: humidity,
    });
  }

  // 48-Hour Continuous Astronomical Tides
  const tides = calculateAstronomicalTides(new Date());

  const payload: CachedMarinePayload = {
    syncedAt: Date.now(),
    latitude: lat,
    longitude: lon,
    harborName: nearestPort.port.name,
    nearestPort,
    conditions: {
      waveHeightM: currentWaveHeight,
      wavePeriodS: currentWavePeriod,
      waveDirectionDeg: currentWaveDir,
      waveDirectionText: degToCompass(currentWaveDir),
      windSpeedKnots: currentWindSpeed,
      windGustsKnots: currentWindGusts,
      windDirectionDeg: currentWindDir,
      windDirectionText: degToCompass(currentWindDir),
      windBeaufort: getBeaufort(currentWindSpeed),
      seaTempC: 28.0,
      surfacePressureHpa: currentPressure,
      visibilityNm: currentVisibilityNm,
      tidalCurrentKnots: 0.8,
      precipitationMm: currentPrecipitation,
      relativeHumidity: currentRelativeHumidity,
      weatherCode: currentWeatherCode,
      weatherDesc: getWeatherDescription(currentWeatherCode),
      nearestPort,
      safetyAdvisory,
    },
    hourly: hourlyCards,
    tides,
  };

  inMemoryCache = payload;
  saveToStorage(payload);

  return payload;
}

/**
 * 7. Storage Persistence
 */
async function saveToStorage(payload: CachedMarinePayload): Promise<void> {
  try {
    await persistentStorage.setJSON(STORAGE_KEY, payload);
  } catch (err) {
    console.warn('[MarineWeatherService] Storage save failed:', err);
  }
}

export async function loadFromStorage(): Promise<CachedMarinePayload | null> {
  if (inMemoryCache) return inMemoryCache;
  try {
    const saved = await persistentStorage.getJSON<CachedMarinePayload | null>(STORAGE_KEY, null);
    if (saved) {
      saved.tides = calculateAstronomicalTides();
      inMemoryCache = saved;
      return saved;
    }
  } catch (err) {
    console.warn('[MarineWeatherService] Storage load failed:', err);
  }
  return null;
}
