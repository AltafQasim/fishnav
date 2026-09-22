import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Component, type ErrorInfo, type ReactNode, useMemo, useRef, useState } from 'react';
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
  WeatherMetricType,
} from '@/components/weather/marine-animated-weather-chart';
import { TideChart } from '@/components/weather/tide-chart';
import { useLanguage } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';
import { useMarineWeather } from '@/hooks/use-marine-weather';
import { getBaselineMarineData } from '@/services/marine-weather-service';

function WeatherSheetContentInner() {
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

  const baseline = useMemo(() => getBaselineMarineData(), []);
  const safeConditions = conditions || baseline.conditions;
  const safeHourly = Array.isArray(hourly) && hourly.length > 0 ? hourly : baseline.hourly;
  const safeTides = tides || baseline.tides;

  const safetyAdvisory = safeConditions?.safetyAdvisory || baseline.conditions.safetyAdvisory;

  const isWarning = safetyAdvisory?.status === 'WARNING';
  const isCaution = safetyAdvisory?.status === 'CAUTION';

  const localizedAdvisoryTitle = useMemo(() => {
    if (isWarning) return t('weather.advisory_warning', safetyAdvisory?.title || 'WARNING');
    if (isCaution) return t('weather.advisory_caution', safetyAdvisory?.title || 'CAUTION');
    return t('weather.advisory_good', safetyAdvisory?.title || 'NORMAL');
  }, [isWarning, isCaution, safetyAdvisory?.title, t]);

  const localizedAdvisorySub = useMemo(() => {
    if (isWarning) {
      if (safetyAdvisory?.dangerType === 'SQUALL') return t('weather.danger_squall', safetyAdvisory?.subText || '');
      if (safetyAdvisory?.dangerType === 'RAIN') return t('weather.danger_rain', safetyAdvisory?.subText || '');
      if (safetyAdvisory?.dangerType === 'SWELL') return t('weather.danger_swell', safetyAdvisory?.subText || '');
      if (safetyAdvisory?.dangerType === 'WIND') return t('weather.danger_wind', safetyAdvisory?.subText || '');
      return t('weather.danger_squall', safetyAdvisory?.subText || '');
    }
    if (isCaution) {
      return t('weather.caution_sub', safetyAdvisory?.subText || '');
    }
    return t('weather.normal_sub', safetyAdvisory?.subText || '');
  }, [isWarning, isCaution, safetyAdvisory?.dangerType, safetyAdvisory?.subText, t]);

  const getLocalizedWeatherDesc = (code: number, fallbackText: string) => {
    if (code === 0) return t('weather.desc_clear', fallbackText);
    if (code >= 1 && code <= 3) return t('weather.desc_partly_cloudy', fallbackText);
    if (code >= 45 && code <= 48) return t('weather.desc_foggy', fallbackText);
    if (code >= 51 && code <= 55) return t('weather.desc_drizzle', fallbackText);
    if (code >= 61 && code <= 63) return t('weather.desc_rain', fallbackText);
    if (code >= 65 && code <= 67) return t('weather.desc_heavy_rain', fallbackText);
    if (code >= 80 && code <= 82) return t('weather.desc_rain', fallbackText);
    if (code >= 95) return t('weather.desc_thunderstorm', fallbackText);
    return fallbackText;
  };



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
                ? t('weather.syncing', 'SYNCING LIVE WEATHER...')
                : isOffline
                  ? t('weather.offline_cached', 'OFFLINE • CACHED FORECAST')
                  : t('weather.online_live', 'ONLINE • LIVE SATELLITE (AUTO-SYNCED)')}
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
                ? 'warning'
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
                  backgroundColor: (safetyAdvisory?.isFishingSafe ?? true)
                    ? '#16A34A'
                    : '#DC2626',
                },
              ]}
            >
              <Text style={styles.safetyBadgeText}>
                {(safetyAdvisory?.isFishingSafe ?? true) ? t('weather.fishing_safe', 'FISHING: SAFE') : t('weather.fishing_unsafe', 'FISHING: UNSAFE')}
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

      {/* 4. Ocean & Sea Conditions Grid (All States without sparklines) */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {t('weather.title', 'OCEAN & SEA CONDITIONS')}
      </Text>
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
          <View style={styles.cardContent}>
            <Text style={[styles.cardValue, { color: colors.text }]}>
              {safeConditions.waveHeightM}
              <Text style={[styles.cardUnit, { color: colors.textSecondary }]}>m</Text>
            </Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={1}>
              {safeConditions.wavePeriodS}s • {safeConditions.waveDirectionText}
            </Text>
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
          <View style={styles.cardContent}>
            <Text style={[styles.cardValue, { color: colors.text }]}>
              {safeConditions.windSpeedKnots}
              <Text style={[styles.cardUnit, { color: colors.textSecondary }]}>kts</Text>
            </Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={1}>
              Gusts {safeConditions.windGustsKnots}k • {safeConditions.windBeaufort}
            </Text>
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
          <View style={styles.cardContent}>
            <Text
              style={[
                styles.cardValue,
                { color: (safeConditions.precipitationMm ?? 0) > 2 ? '#EF4444' : colors.text },
              ]}
            >
              {safeConditions.precipitationMm ?? 0}
              <Text style={[styles.cardUnit, { color: colors.textSecondary }]}>mm/h</Text>
            </Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={1}>
              {getLocalizedWeatherDesc(safeConditions.weatherCode ?? 0, safeConditions.weatherDesc ?? 'Clear')}
            </Text>
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
          <View style={styles.cardContent}>
            <Text style={[styles.cardValue, { color: colors.text }]}>
              {safeConditions.seaTempC ?? 28}
              <Text style={[styles.cardUnit, { color: colors.textSecondary }]}>°C</Text>
            </Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={1}>
              {t('weather.surface_water', 'Marine Surface Water')}
            </Text>
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
          <View style={styles.cardContent}>
            <Text style={[styles.cardValue, { color: colors.text }]}>
              {safeConditions.surfacePressureHpa ?? 1012}
              <Text style={[styles.cardUnit, { color: colors.textSecondary }]}>hPa</Text>
            </Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={1}>
              {(safeConditions.surfacePressureHpa ?? 1012) < 1005 ? t('weather.low_pressure', '⚠️ Low (Squall)') : t('weather.surface_pressure', 'Surface Pressure')}
            </Text>
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
          <View style={styles.cardContent}>
            <Text style={[styles.cardValue, { color: colors.text }]}>
              {safeConditions.visibilityNm ?? 9.5}
              <Text style={[styles.cardUnit, { color: colors.textSecondary }]}>NM</Text>
            </Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={1}>
              {(safeConditions.visibilityNm ?? 9.5) >= 8 ? t('weather.clear_horizon', 'Clear Horizon') : t('weather.fog_mist', 'Marine Mist / Fog')}
            </Text>
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
          <View style={styles.cardContent}>
            <Text style={[styles.cardValue, { color: colors.text }]}>
              {safeConditions.tidalCurrentKnots ?? 0.8}
              <Text style={[styles.cardUnit, { color: colors.textSecondary }]}>kts</Text>
            </Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={1}>
              {t('weather.tidal_drift', 'Astronomical Drift')}
            </Text>
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
          <View style={styles.cardContent}>
            <Text style={[styles.cardValue, { color: colors.text }]}>
              {safeConditions.wavePeriodS ?? 7.0}
              <Text style={[styles.cardUnit, { color: colors.textSecondary }]}>s</Text>
            </Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={1}>
              {t('weather.wave_roll', 'Wave Interval / Roll')}
            </Text>
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
          <View style={styles.cardContent}>
            <Text style={[styles.cardValue, { color: colors.text }]}>
              {safeConditions.relativeHumidity ?? 74}
              <Text style={[styles.cardUnit, { color: colors.textSecondary }]}>%</Text>
            </Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={1}>
              {t('weather.dew_moisture', 'Dew Point & Moisture')}
            </Text>
          </View>
        </TouchableOpacity>
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
        <WeatherComponentBoundary name="MarineAnimatedWeatherChart">
          <MarineAnimatedWeatherChart
            hourly={safeHourly}
            conditions={safeConditions}
            activeMetric={activeChartMetric}
            onMetricChange={setActiveChartMetric}
          />
        </WeatherComponentBoundary>
      </View>

      {/* 6. 48-Hour Scrollable Astronomical Tide Chart */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 4 }]}>
        {t('weather.tides_title', 'ASTRONOMICAL HARMONIC TIDES (48H)').toUpperCase()}
      </Text>
      <WeatherComponentBoundary name="TideChart">
        <TideChart tideData={safeTides} isOffline={isOffline} />
      </WeatherComponentBoundary>

      {/* 7. Hourly Marine Forecast (Next 36h) */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('weather.hourly_title', 'HOURLY MARINE FORECAST').toUpperCase()}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyScroll}>
        {safeHourly.map((item, idx) => (
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
            {parseFloat(String(item?.rain || '0')) > 0 && (
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
    flexGrow: 0,
    flexShrink: 1,
  },
  content: {
    padding: 12,
    gap: 12,
  },

  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  syncLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  syncTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  syncSub: {
    fontSize: 9.5,
    marginTop: 1,
  },
  syncBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  advisoryBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  advisoryInfo: {
    flex: 1,
  },
  advisoryTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.2,
    flex: 1,
  },
  safetyBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  safetyBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  advisorySub: {
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 2,
  },
  gujaratiNotice: {
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 4,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: -4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    width: '48%',
    flexGrow: 1,
    padding: 9,
    borderRadius: 14,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  cardLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  cardContent: {
    marginTop: 2,
  },
  cardContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  activeChartBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activeChartBadgeText: {
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  cardValueSmall: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
    marginTop: 2,
  },
  cardUnit: {
    fontSize: 10,
    fontWeight: '500',
  },
  cardSub: {
    fontSize: 9.5,
    marginTop: 1,
    flexShrink: 1,
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

class WeatherComponentBoundary extends Component<{ children: ReactNode; name: string }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn(`[${this.props.name}] Render error caught:`, error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ padding: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', marginVertical: 6, alignItems: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>Chart telemetry temporarily unavailable</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

class WeatherErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[WeatherSheetContent] Render error caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ padding: 24, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="weather-partly-cloudy" size={48} color="#00F0FF" />
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginTop: 12 }}>
            Marine Weather
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center', marginTop: 6 }}>
            Tap below to reload live marine conditions
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false })}
            style={{ marginTop: 16, backgroundColor: '#0284C7', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Reload Weather</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export function WeatherSheetContent() {
  return (
    <WeatherErrorBoundary>
      <WeatherSheetContentInner />
    </WeatherErrorBoundary>
  );
}
