import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  MarineAnimatedWeatherChart,
  MiniWeatherSparkline,
  WeatherMetricType,
} from '@/components/weather/marine-animated-weather-chart';
import { TideChart } from '@/components/weather/tide-chart';
import { useLanguage } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';
import { useMarineWeather } from '@/hooks/use-marine-weather';

export function WeatherSheetContent() {
  const { colors, isLight } = useAppTheme();
  const { t } = useLanguage();
  const {
    conditions,
    hourly,
    tides,
    syncStatus,
    isOffline,
    isRefreshing,
    lastSyncedText,
    syncHarborData,
  } = useMarineWeather();

  const [activeChartMetric, setActiveChartMetric] = useState<WeatherMetricType>('wind');
  const mainScrollRef = useRef<ScrollView>(null);
  const chartSectionY = useRef<number>(0);

  const isWarning = conditions.safetyAdvisory.status === 'WARNING';
  const isCaution = conditions.safetyAdvisory.status === 'CAUTION';

  const localizedAdvisoryTitle = useMemo(() => {
    if (isWarning) return t('weather.advisory_warning', conditions.safetyAdvisory.title);
    if (isCaution) return t('weather.advisory_caution', conditions.safetyAdvisory.title);
    return t('weather.advisory_good', conditions.safetyAdvisory.title);
  }, [isWarning, isCaution, conditions.safetyAdvisory.title, t]);

  const localizedAdvisorySub = useMemo(() => {
    if (isWarning) {
      if (conditions.safetyAdvisory.dangerType === 'SQUALL') return t('weather.danger_squall', conditions.safetyAdvisory.subText);
      if (conditions.safetyAdvisory.dangerType === 'RAIN') return t('weather.danger_rain', conditions.safetyAdvisory.subText);
      if (conditions.safetyAdvisory.dangerType === 'SWELL') return t('weather.danger_swell', conditions.safetyAdvisory.subText);
      if (conditions.safetyAdvisory.dangerType === 'WIND') return t('weather.danger_wind', conditions.safetyAdvisory.subText);
      return t('weather.danger_squall', conditions.safetyAdvisory.subText);
    }
    if (isCaution) {
      return t('weather.caution_sub', conditions.safetyAdvisory.subText);
    }
    return t('weather.normal_sub', conditions.safetyAdvisory.subText);
  }, [isWarning, isCaution, conditions.safetyAdvisory.dangerType, conditions.safetyAdvisory.subText, t]);

  const getLocalizedWeatherDesc = (code: number, fallback: string) => {
    if (code === 0) return t('weather.desc_clear', fallback);
    if (code >= 1 && code <= 3) return t('weather.desc_partly_cloudy', fallback);
    if (code >= 45 && code <= 48) return t('weather.desc_foggy', fallback);
    if (code >= 51 && code <= 55) return t('weather.desc_drizzle', fallback);
    if (code >= 61 && code <= 63) return t('weather.desc_rain', fallback);
    if (code >= 65 && code <= 67) return t('weather.desc_heavy_rain', fallback);
    if (code >= 80 && code <= 82) return t('weather.desc_rain', fallback);
    if (code >= 95) return t('weather.desc_thunderstorm', fallback);
    return fallback;
  };

  const waveSeries = useMemo(
    () => hourly.map((h) => h.waveNum ?? parseFloat(h.wave?.replace('m', '') || '1.2')),
    [hourly]
  );
  const windSeries = useMemo(
    () => hourly.map((h) => h.windNum ?? parseFloat(h.wind?.replace(' kts', '') || '14')),
    [hourly]
  );
  const rainSeries = useMemo(
    () => hourly.map((h) => h.rainNum ?? parseFloat(h.rain?.replace('mm', '') || '0')),
    [hourly]
  );
  const tempSeries = useMemo(
    () => hourly.map((h) => h.tempNum ?? parseFloat(h.temp?.replace('°', '') || '28')),
    [hourly]
  );
  const pressureSeries = useMemo(
    () => hourly.map((h) => h.pressureNum ?? 1012),
    [hourly]
  );
  const visibilitySeries = useMemo(
    () => hourly.map((h) => h.visibilityNum ?? conditions.visibilityNm ?? 9.5),
    [hourly, conditions.visibilityNm]
  );
  const currentSeries = useMemo(
    () => hourly.map((h) => h.currentNum ?? conditions.tidalCurrentKnots ?? 0.8),
    [hourly, conditions.tidalCurrentKnots]
  );
  const periodSeries = useMemo(
    () => hourly.map((h) => h.periodNum ?? conditions.wavePeriodS ?? 7.0),
    [hourly, conditions.wavePeriodS]
  );
  const humiditySeries = useMemo(
    () => hourly.map((h) => h.humidityNum ?? conditions.relativeHumidity ?? 74),
    [hourly, conditions.relativeHumidity]
  );

  const handleCardPress = (metric: WeatherMetricType) => {
    setActiveChartMetric(metric);
    if (chartSectionY.current > 0) {
      mainScrollRef.current?.scrollTo({ y: chartSectionY.current - 15, animated: true });
    }
  };

  return (
    <ScrollView
      ref={mainScrollRef}
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: 110 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Nearest Port & Harbor Information Card */}
      <View
        style={[
          styles.portCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <View style={styles.portLeft}>
          <View
            style={[
              styles.portIconWrap,
              { backgroundColor: isLight ? '#E0F2FE' : 'rgba(0, 240, 255, 0.12)' },
            ]}
          >
            <MaterialCommunityIcons
              name="anchor"
              size={20}
              color={isLight ? '#0284C7' : '#00F0FF'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.portName, { color: colors.text }]} numberOfLines={1}>
                {conditions.nearestPort.port.name}
              </Text>
              <View
                style={[
                  styles.portTag,
                  {
                    backgroundColor: conditions.nearestPort.isAtPort
                      ? isLight
                        ? '#DCFCE7'
                        : 'rgba(34, 197, 94, 0.15)'
                      : isLight
                      ? '#E2E8F0'
                      : 'rgba(255, 255, 255, 0.08)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.portTagText,
                    {
                      color: conditions.nearestPort.isAtPort
                        ? isLight
                          ? '#16A34A'
                          : '#22C55E'
                        : colors.textSecondary,
                    },
                  ]}
                >
                  {conditions.nearestPort.isAtPort
                    ? t('weather.at_harbor', '⚓ AT HARBOR')
                    : `${conditions.nearestPort.distanceNm} NM ${t('weather.offshore', 'OFFSHORE')}`}
                </Text>
              </View>
            </View>
            <Text style={[styles.portSub, { color: colors.textSecondary }]}>
              {conditions.nearestPort.port.nameGujarati} • {conditions.nearestPort.port.district} (
              {conditions.nearestPort.bearingText} {conditions.nearestPort.bearingDeg}°)
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Sync Status Banner & Manual Refresh */}
      <View
        style={[
          styles.syncBanner,
          {
            backgroundColor: isOffline
              ? isLight
                ? '#FEF3C7'
                : 'rgba(245, 158, 11, 0.1)'
              : isLight
              ? '#F1F5F9'
              : 'rgba(255, 255, 255, 0.04)',
            borderColor: isOffline
              ? isLight
                ? '#FDE68A'
                : 'rgba(245, 158, 11, 0.25)'
              : colors.cardBorder,
          },
        ]}
      >
        <View style={styles.syncLeft}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isOffline
                  ? '#F59E0B'
                  : syncStatus === 'syncing'
                  ? '#38BDF8'
                  : '#22C55E',
              },
            ]}
          />
          <View>
            <Text
              style={[
                styles.syncTitle,
                {
                  color: isOffline
                    ? isLight
                      ? '#B45309'
                      : '#FBBF24'
                    : colors.text,
                },
              ]}
            >
              {syncStatus === 'syncing'
                ? t('weather.syncing', 'SYNCING HARBOR WEATHER...')
                : isOffline
                ? t('weather.offline_cached', 'OFFLINE • CACHED AT HARBOR')
                : t('weather.online_live', 'ONLINE • HARBOR LIVE (AUTO-SYNCED)')}
            </Text>
            <Text style={[styles.syncSub, { color: colors.textSecondary }]}>
              {isOffline
                ? `${lastSyncedText} • ${t('weather.cached_48h', 'Valid for next 48h deep sea')}`
                : t('weather.live_cached', 'Open-Meteo marine models live • Next 48h pre-cached')}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => syncHarborData()}
          disabled={isRefreshing}
          style={[
            styles.syncBtn,
            {
              backgroundColor: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.08)',
              borderColor: isLight ? '#E2E8F0' : colors.divider,
            },
          ]}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Feather name="refresh-cw" size={13} color={colors.text} />
          )}
        </TouchableOpacity>
      </View>

      {/* 3. Coastal Safety Advisory (Severe Weather & Rain Warning) */}
      <View
        style={[
          styles.advisoryBanner,
          {
            backgroundColor: isWarning
              ? isLight
                ? '#FEE2E2'
                : 'rgba(239, 68, 68, 0.15)'
              : isCaution
              ? isLight
                ? '#FEF3C7'
                : 'rgba(245, 158, 11, 0.15)'
              : isLight
              ? '#DCFCE7'
              : 'rgba(34, 197, 94, 0.15)',
            borderColor: isWarning
              ? '#EF4444'
              : isCaution
              ? '#F59E0B'
              : '#22C55E',
          },
        ]}
      >
        <Ionicons
          name={
            isWarning
              ? 'alert-circle'
              : isCaution
              ? 'alert-triangle'
              : 'shield-checkmark'
          }
          size={24}
          color={isWarning ? '#EF4444' : isCaution ? '#F59E0B' : '#22C55E'}
        />
        <View style={styles.advisoryInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
            <Text
              style={[
                styles.advisoryTitle,
                {
                  color: isWarning
                    ? isLight
                      ? '#991B1B'
                      : '#FCA5A5'
                    : isCaution
                    ? isLight
                      ? '#92400E'
                      : '#FCD34D'
                    : isLight
                    ? '#166534'
                    : '#86EFAC',
                },
              ]}
              numberOfLines={1}
            >
              {localizedAdvisoryTitle}
            </Text>
            <View
              style={[
                styles.safetyBadge,
                {
                  backgroundColor: conditions.safetyAdvisory.isFishingSafe
                    ? '#16A34A'
                    : '#DC2626',
                },
              ]}
            >
              <Text style={styles.safetyBadgeText}>
                {conditions.safetyAdvisory.isFishingSafe ? t('weather.fishing_safe', 'FISHING: SAFE') : t('weather.fishing_unsafe', 'FISHING: UNSAFE')}
              </Text>
            </View>
          </View>
          <Text
            style={[
              styles.advisorySub,
              {
                color: isWarning
                  ? isLight
                    ? '#7F1D1D'
                    : '#F87171'
                  : isCaution
                  ? isLight
                    ? '#78350F'
                    : '#FBBF24'
                  : isLight
                  ? '#14532D'
                  : '#4ADE80',
              },
            ]}
          >
            {localizedAdvisorySub}
          </Text>
          {isWarning && (
            <Text style={[styles.gujaratiNotice, { color: isLight ? '#991B1B' : '#FECACA' }]}>
              {t('weather.warning_notice', '⚠️ Warning: Heavy rain and strong winds make fishing at sea dangerous. Return to harbor immediately.')}
            </Text>
          )}
        </View>
      </View>

      {/* 4. Ocean & Sea Conditions Grid (All States with Animated Charts) */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('weather.title', 'OCEAN & SEA CONDITIONS')}</Text>
      <View style={styles.grid}>
        {/* 1. Wave Height */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleCardPress('wave')}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: activeChartMetric === 'wave' ? (isLight ? '#0284C7' : '#00F0FF') : colors.cardBorder,
              borderWidth: activeChartMetric === 'wave' ? 1.5 : 1,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>{t('weather.waves', 'WAVE & SWELL')}</Text>
            {activeChartMetric === 'wave' && (
              <View style={[styles.activeChartBadge, { backgroundColor: isLight ? '#E0F2FE' : 'rgba(0, 240, 255, 0.15)' }]}>
                <Text style={[styles.activeChartBadgeText, { color: isLight ? '#0284C7' : '#00F0FF' }]}>{t('weather.active', 'ACTIVE')}</Text>
              </View>
            )}
          </View>
          <View style={styles.cardContentRow}>
            <View>
              <Text style={[styles.cardValue, { color: colors.text }]}>
                {conditions.waveHeightM}
                <Text style={[styles.cardUnit, { color: colors.textSecondary }]}>m</Text>
              </Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={1}>
                {conditions.wavePeriodS}s • {conditions.waveDirectionText}
              </Text>
            </View>
            <MiniWeatherSparkline
              data={waveSeries}
              color={isLight ? '#0284C7' : '#00F0FF'}
              isActive={activeChartMetric === 'wave'}
              width={72}
              height={28}
            />
          </View>
        </TouchableOpacity>

        {/* 2. Wind Speed */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleCardPress('wind')}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: activeChartMetric === 'wind' ? (isLight ? '#D97706' : '#F59E0B') : colors.cardBorder,
              borderWidth: activeChartMetric === 'wind' ? 1.5 : 1,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>{t('weather.wind', 'WIND & GUSTS')}</Text>
            {activeChartMetric === 'wind' && (
              <View style={[styles.activeChartBadge, { backgroundColor: isLight ? '#FEF3C7' : 'rgba(245, 158, 11, 0.15)' }]}>
                <Text style={[styles.activeChartBadgeText, { color: isLight ? '#D97706' : '#F59E0B' }]}>{t('weather.active', 'ACTIVE')}</Text>
              </View>
            )}
          </View>
          <View style={styles.cardContentRow}>
            <View>
              <Text style={[styles.cardValue, { color: colors.text }]}>
                {conditions.windSpeedKnots}
                <Text style={[styles.cardUnit, { color: colors.textSecondary }]}>kts</Text>
              </Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={1}>
                Gusts {conditions.windGustsKnots}k • {conditions.windBeaufort}
              </Text>
            </View>
            <MiniWeatherSparkline
              data={windSeries}
              color={isLight ? '#D97706' : '#F59E0B'}
              isActive={activeChartMetric === 'wind'}
              width={72}
              height={28}
            />
          </View>
        </TouchableOpacity>

        {/* 3. Rain & Precipitation */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleCardPress('rain')}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: activeChartMetric === 'rain' ? (isLight ? '#2563EB' : '#38BDF8') : colors.cardBorder,
              borderWidth: activeChartMetric === 'rain' ? 1.5 : 1,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>{t('weather.rain', 'PRECIPITATION')}</Text>
            {activeChartMetric === 'rain' && (
              <View style={[styles.activeChartBadge, { backgroundColor: isLight ? '#DBEAFE' : 'rgba(56, 189, 248, 0.15)' }]}>
                <Text style={[styles.activeChartBadgeText, { color: isLight ? '#2563EB' : '#38BDF8' }]}>{t('weather.active', 'ACTIVE')}</Text>
              </View>
            )}
          </View>
          <View style={styles.cardContentRow}>
            <View>
              <Text
                style={[
                  styles.cardValue,
                  { color: conditions.precipitationMm > 2 ? '#EF4444' : colors.text },
                ]}
              >
                {conditions.precipitationMm}
                <Text style={[styles.cardUnit, { color: colors.textSecondary }]}>mm/h</Text>
              </Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={1}>
                {getLocalizedWeatherDesc(conditions.weatherCode, conditions.weatherDesc)}
              </Text>
            </View>
            <MiniWeatherSparkline
              data={rainSeries}
              color={isLight ? '#2563EB' : '#38BDF8'}
              isActive={activeChartMetric === 'rain'}
              width={72}
              height={28}
            />
          </View>
        </TouchableOpacity>

        {/* 4. Water Temperature */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleCardPress('temp')}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: activeChartMetric === 'temp' ? (isLight ? '#EA580C' : '#FB923C') : colors.cardBorder,
              borderWidth: activeChartMetric === 'temp' ? 1.5 : 1,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>{t('weather.temp', 'WATER TEMP')}</Text>
            {activeChartMetric === 'temp' && (
              <View style={[styles.activeChartBadge, { backgroundColor: isLight ? '#FFEDD5' : 'rgba(251, 146, 60, 0.15)' }]}>
                <Text style={[styles.activeChartBadgeText, { color: isLight ? '#EA580C' : '#FB923C' }]}>{t('weather.active', 'ACTIVE')}</Text>
              </View>
            )}
          </View>
          <View style={styles.cardContentRow}>
            <View>
              <Text style={[styles.cardValue, { color: colors.text }]}>
                {conditions.seaTempC}
                <Text style={[styles.cardUnit, { color: colors.textSecondary }]}>°C</Text>
              </Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={1}>
                {t('weather.surface_water', 'Marine Surface Water')}
              </Text>
            </View>
            <MiniWeatherSparkline
              data={tempSeries}
              color={isLight ? '#EA580C' : '#FB923C'}
              isActive={activeChartMetric === 'temp'}
              width={72}
              height={28}
            />
          </View>
        </TouchableOpacity>

        {/* 5. Barometric Pressure */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleCardPress('pressure')}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: activeChartMetric === 'pressure' ? (isLight ? '#7C3AED' : '#A855F7') : colors.cardBorder,
              borderWidth: activeChartMetric === 'pressure' ? 1.5 : 1,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>{t('weather.pressure', 'BAROMETER')}</Text>
            {activeChartMetric === 'pressure' && (
              <View style={[styles.activeChartBadge, { backgroundColor: isLight ? '#F3E8FF' : 'rgba(168, 85, 247, 0.15)' }]}>
                <Text style={[styles.activeChartBadgeText, { color: isLight ? '#7C3AED' : '#A855F7' }]}>{t('weather.active', 'ACTIVE')}</Text>
              </View>
            )}
          </View>
          <View style={styles.cardContentRow}>
            <View>
              <Text style={[styles.cardValue, { color: colors.text }]}>
                {conditions.surfacePressureHpa}
                <Text style={[styles.cardUnit, { color: colors.textSecondary }]}>hPa</Text>
              </Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={1}>
                {conditions.surfacePressureHpa < 1005 ? t('weather.low_pressure', '⚠️ Low (Squall)') : t('weather.surface_pressure', 'Surface Pressure')}
              </Text>
            </View>
            <MiniWeatherSparkline
              data={pressureSeries}
              color={isLight ? '#7C3AED' : '#A855F7'}
              isActive={activeChartMetric === 'pressure'}
              width={72}
              height={28}
            />
          </View>
        </TouchableOpacity>

        {/* 6. Visibility */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleCardPress('visibility')}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: activeChartMetric === 'visibility' ? (isLight ? '#059669' : '#10B981') : colors.cardBorder,
              borderWidth: activeChartMetric === 'visibility' ? 1.5 : 1,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>{t('weather.visibility', 'VISIBILITY')}</Text>
            {activeChartMetric === 'visibility' && (
              <View style={[styles.activeChartBadge, { backgroundColor: isLight ? '#D1FAE5' : 'rgba(16, 185, 129, 0.15)' }]}>
                <Text style={[styles.activeChartBadgeText, { color: isLight ? '#059669' : '#10B981' }]}>{t('weather.active', 'ACTIVE')}</Text>
              </View>
            )}
          </View>
          <View style={styles.cardContentRow}>
            <View>
              <Text style={[styles.cardValue, { color: colors.text }]}>
                {conditions.visibilityNm}
                <Text style={[styles.cardUnit, { color: colors.textSecondary }]}>NM</Text>
              </Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={1}>
                {conditions.visibilityNm >= 8 ? t('weather.clear_horizon', 'Clear Horizon') : t('weather.fog_mist', 'Marine Mist / Fog')}
              </Text>
            </View>
            <MiniWeatherSparkline
              data={visibilitySeries}
              color={isLight ? '#059669' : '#10B981'}
              isActive={activeChartMetric === 'visibility'}
              width={72}
              height={28}
            />
          </View>
        </TouchableOpacity>

        {/* 7. Tidal Current */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleCardPress('current')}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: activeChartMetric === 'current' ? (isLight ? '#4F46E5' : '#818CF8') : colors.cardBorder,
              borderWidth: activeChartMetric === 'current' ? 1.5 : 1,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>{t('weather.tides', 'TIDAL CURRENT')}</Text>
            {activeChartMetric === 'current' && (
              <View style={[styles.activeChartBadge, { backgroundColor: isLight ? '#E0E7FF' : 'rgba(129, 140, 248, 0.15)' }]}>
                <Text style={[styles.activeChartBadgeText, { color: isLight ? '#4F46E5' : '#818CF8' }]}>{t('weather.active', 'ACTIVE')}</Text>
              </View>
            )}
          </View>
          <View style={styles.cardContentRow}>
            <View>
              <Text style={[styles.cardValue, { color: colors.text }]}>
                {conditions.tidalCurrentKnots}
                <Text style={[styles.cardUnit, { color: colors.textSecondary }]}>kts</Text>
              </Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={1}>
                {t('weather.tidal_drift', 'Astronomical Drift')}
              </Text>
            </View>
            <MiniWeatherSparkline
              data={currentSeries}
              color={isLight ? '#4F46E5' : '#818CF8'}
              isActive={activeChartMetric === 'current'}
              width={72}
              height={28}
            />
          </View>
        </TouchableOpacity>

        {/* 8. Swell Period */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleCardPress('period')}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: activeChartMetric === 'period' ? (isLight ? '#E11D48' : '#FB7185') : colors.cardBorder,
              borderWidth: activeChartMetric === 'period' ? 1.5 : 1,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>{t('weather.swell_period', 'SWELL PERIOD').toUpperCase()}</Text>
            {activeChartMetric === 'period' && (
              <View style={[styles.activeChartBadge, { backgroundColor: isLight ? '#FFE4E6' : 'rgba(251, 113, 133, 0.15)' }]}>
                <Text style={[styles.activeChartBadgeText, { color: isLight ? '#E11D48' : '#FB7185' }]}>{t('weather.active', 'ACTIVE')}</Text>
              </View>
            )}
          </View>
          <View style={styles.cardContentRow}>
            <View>
              <Text style={[styles.cardValue, { color: colors.text }]}>
                {conditions.wavePeriodS}
                <Text style={[styles.cardUnit, { color: colors.textSecondary }]}>s</Text>
              </Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={1}>
                {t('weather.wave_roll', 'Wave Interval / Roll')}
              </Text>
            </View>
            <MiniWeatherSparkline
              data={periodSeries}
              color={isLight ? '#E11D48' : '#FB7185'}
              isActive={activeChartMetric === 'period'}
              width={72}
              height={28}
            />
          </View>
        </TouchableOpacity>

        {/* 9. Relative Air Humidity */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleCardPress('humidity')}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: activeChartMetric === 'humidity' ? (isLight ? '#0891B2' : '#06B6D4') : colors.cardBorder,
              borderWidth: activeChartMetric === 'humidity' ? 1.5 : 1,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>{t('weather.air_humidity', 'AIR HUMIDITY').toUpperCase()}</Text>
            {activeChartMetric === 'humidity' && (
              <View style={[styles.activeChartBadge, { backgroundColor: isLight ? '#CFFAFE' : 'rgba(6, 182, 212, 0.15)' }]}>
                <Text style={[styles.activeChartBadgeText, { color: isLight ? '#0891B2' : '#06B6D4' }]}>{t('weather.active', 'ACTIVE')}</Text>
              </View>
            )}
          </View>
          <View style={styles.cardContentRow}>
            <View>
              <Text style={[styles.cardValue, { color: colors.text }]}>
                {conditions.relativeHumidity ?? 74}
                <Text style={[styles.cardUnit, { color: colors.textSecondary }]}>%</Text>
              </Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={1}>
                {t('weather.dew_moisture', 'Dew Point & Moisture')}
              </Text>
            </View>
            <MiniWeatherSparkline
              data={humiditySeries}
              color={isLight ? '#0891B2' : '#06B6D4'}
              isActive={activeChartMetric === 'humidity'}
              width={72}
              height={28}
            />
          </View>
        </TouchableOpacity>

        {/* 10. Nearest Port */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>{t('weather.nearest_port', 'NEAREST PORT').toUpperCase()}</Text>
          </View>
          <Text style={[styles.cardValueSmall, { color: colors.text }]} numberOfLines={1}>
            {conditions.nearestPort.port.name.replace(' Fishing Harbor', '').replace(' Harbor', '')}
          </Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            {conditions.nearestPort.displayBadge}
          </Text>
        </View>
      </View>

      {/* 5. Interactive 36-Hour Animated Telemetry Chart */}
      <View
        onLayout={(e) => {
          chartSectionY.current = e.nativeEvent.layout.y;
        }}
      >
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 4 }]}>
          {t('weather.anim_charts_title', 'ANIMATED PREDICTIVE CHARTS (36H)').toUpperCase()}
        </Text>
        <MarineAnimatedWeatherChart
          hourly={hourly}
          conditions={conditions}
          activeMetric={activeChartMetric}
          onMetricChange={setActiveChartMetric}
        />
      </View>

      {/* 6. 48-Hour Scrollable Astronomical Tide Chart */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 4 }]}>
        {t('weather.tides_title', 'ASTRONOMICAL HARMONIC TIDES (48H)').toUpperCase()}
      </Text>
      <TideChart tideData={tides} isOffline={isOffline} />

      {/* 7. Hourly Marine Forecast (Next 36h) */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('weather.hourly_title', 'HOURLY MARINE FORECAST').toUpperCase()}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyScroll}>
        {hourly.map((item, idx) => (
          <View
            key={idx}
            style={[
              styles.hourlyCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Text style={[styles.hourlyHour, { color: colors.textSecondary }]}>{item.time}</Text>
            <MaterialCommunityIcons
              name={(item.icon || 'weather-partly-cloudy') as any}
              size={22}
              color={colors.accent}
              style={{ marginVertical: 4 }}
            />
            <Text style={[styles.hourlyTemp, { color: colors.text }]}>{item.temp}</Text>
            <Text style={[styles.hourlyMetricText, { color: colors.textSecondary }]}>{item.wind}</Text>
            <Text style={[styles.hourlyMetricText, { color: colors.accent }]}>{item.wave}</Text>
            {parseFloat(item.rain) > 0 && (
              <Text style={[styles.hourlyRainText, { color: '#38BDF8' }]}>🌧️ {item.rain}</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  portCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  portLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  portIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portName: {
    fontSize: 15,
    fontWeight: '700',
  },
  portTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  portTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  portSub: {
    fontSize: 11,
    marginTop: 2,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  syncLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  syncTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  syncSub: {
    fontSize: 10,
    marginTop: 1,
  },
  syncBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  advisoryBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  advisoryInfo: {
    flex: 1,
  },
  advisoryTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
    flex: 1,
  },
  safetyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  safetyBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  advisorySub: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  gujaratiNotice: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: -4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '48%',
    flexGrow: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  activeChartBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  activeChartBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  cardValueSmall: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
    marginTop: 4,
  },
  cardUnit: {
    fontSize: 11,
    fontWeight: '500',
  },
  cardSub: {
    fontSize: 10,
    marginTop: 2,
  },
  hourlyScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  hourlyCard: {
    width: 68,
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 8,
  },
  hourlyHour: {
    fontSize: 10,
    fontWeight: '600',
  },
  hourlyTemp: {
    fontSize: 13,
    fontWeight: '700',
  },
  hourlyMetricText: {
    fontSize: 10,
    marginTop: 2,
  },
  hourlyRainText: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 3,
  },
});
