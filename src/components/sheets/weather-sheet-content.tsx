import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { TideChart } from '@/components/weather/tide-chart';
import { useAppTheme } from '@/context/theme-context';
import { useMarineWeather } from '@/hooks/use-marine-weather';

export function WeatherSheetContent() {
  const { colors, isLight } = useAppTheme();
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

  const isWarning = conditions.safetyAdvisory.status === 'WARNING';
  const isCaution = conditions.safetyAdvisory.status === 'CAUTION';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: 110 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Nearest Gujarat Port Location Card */}
      <View
        style={[
          styles.portCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          },
        ]}>
        <View style={styles.portLeft}>
          <View
            style={[
              styles.portIconWrap,
              { backgroundColor: isLight ? '#E0F2FE' : 'rgba(56, 189, 248, 0.15)' },
            ]}>
            <MaterialCommunityIcons
              name="anchor"
              size={20}
              color={isLight ? '#0284C7' : '#38BDF8'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={[styles.portName, { color: colors.text }]}>
                {conditions.nearestPort.port.name}
              </Text>
              <View
                style={[
                  styles.portTag,
                  {
                    backgroundColor: conditions.nearestPort.isAtPort
                      ? isLight
                        ? '#DCFCE7'
                        : 'rgba(34, 197, 94, 0.2)'
                      : isLight
                      ? '#F1F5F9'
                      : 'rgba(255,255,255,0.08)',
                  },
                ]}>
                <Text
                  style={[
                    styles.portTagText,
                    {
                      color: conditions.nearestPort.isAtPort
                        ? isLight
                          ? '#166534'
                          : '#22C55E'
                        : colors.textSecondary,
                    },
                  ]}>
                  {conditions.nearestPort.isAtPort
                    ? '⚓ AT HARBOR'
                    : `${conditions.nearestPort.distanceNm} NM OFFSHORE`}
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

      {/* 2. Harbor Pre-Departure Sync & Offline Status Banner */}
      <View
        style={[
          styles.syncBanner,
          {
            backgroundColor: isOffline
              ? isLight
                ? '#FFFBEB'
                : 'rgba(245, 158, 11, 0.12)'
              : isLight
              ? '#F0FDF4'
              : 'rgba(34, 197, 94, 0.12)',
            borderColor: isOffline
              ? isLight
                ? '#FDE68A'
                : 'rgba(245, 158, 11, 0.35)'
              : isLight
              ? '#BBF7D0'
              : 'rgba(34, 197, 94, 0.35)',
          },
        ]}>
        <View style={styles.syncLeft}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOffline ? '#F59E0B' : '#22C55E' },
            ]}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.syncTitle,
                {
                  color: isOffline
                    ? isLight
                      ? '#B45309'
                      : '#F59E0B'
                    : isLight
                    ? '#166534'
                    : '#22C55E',
                },
              ]}>
              {syncStatus === 'syncing'
                ? 'SYNCING HARBOR WEATHER...'
                : isOffline
                ? 'OFFLINE • CACHED AT HARBOR'
                : 'ONLINE • HARBOR LIVE (AUTO-SYNCED)'}
            </Text>
            <Text
              style={[
                styles.syncSub,
                {
                  color: isOffline
                    ? isLight
                      ? '#92400E'
                      : '#FCD34D'
                    : isLight
                    ? '#15803D'
                    : colors.textSecondary,
                },
              ]}>
              {isOffline
                ? `${lastSyncedText} • Valid for next 48h deep sea`
                : 'Open-Meteo marine models live • Next 48h pre-cached'}
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
              backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
              borderColor: colors.cardBorder,
            },
          ]}>
          {isRefreshing ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Feather name="refresh-cw" size={14} color={isOffline ? '#F59E0B' : colors.accent} />
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
                ? '#FEF2F2'
                : 'rgba(239, 68, 68, 0.15)'
              : isCaution
              ? isLight
                ? '#FFFBEB'
                : 'rgba(245, 158, 11, 0.15)'
              : isLight
              ? '#F0FDF4'
              : 'rgba(34, 197, 94, 0.12)',
            borderColor: isWarning
              ? '#EF4444'
              : isCaution
              ? '#F59E0B'
              : isLight
              ? '#BBF7D0'
              : 'rgba(34, 197, 94, 0.35)',
            borderWidth: isWarning ? 2 : 1,
          },
        ]}>
        <Ionicons
          name={isWarning ? 'alert-circle' : isCaution ? 'warning' : 'shield-checkmark'}
          size={22}
          color={isWarning ? '#EF4444' : isCaution ? '#F59E0B' : '#22C55E'}
        />
        <View style={styles.advisoryInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text
              style={[
                styles.advisoryTitle,
                {
                  color: isWarning
                    ? isLight
                      ? '#B91C1C'
                      : '#EF4444'
                    : isCaution
                    ? isLight
                      ? '#B45309'
                      : '#F59E0B'
                    : isLight
                    ? '#166534'
                    : '#22C55E',
                },
              ]}>
              {conditions.safetyAdvisory.title}
            </Text>
            <View
              style={[
                styles.safetyBadge,
                {
                  backgroundColor: isWarning
                    ? '#DC2626'
                    : isCaution
                    ? '#D97706'
                    : '#16A34A',
                },
              ]}>
              <Text style={styles.safetyBadgeText}>
                {conditions.safetyAdvisory.isFishingSafe ? 'FISHING: SAFE' : 'FISHING: UNSAFE'}
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
                    : '#FCA5A5'
                  : isCaution
                  ? isLight
                    ? '#78350F'
                    : '#FDE68A'
                  : isLight
                  ? '#15803D'
                  : colors.textSecondary,
                fontWeight: isWarning ? '600' : 'normal',
              },
            ]}>
            {conditions.safetyAdvisory.subText}
          </Text>
          {isWarning && (
            <Text style={[styles.gujaratiNotice, { color: isLight ? '#991B1B' : '#FECACA' }]}>
              ⚠️ ચેતવણી: ભારે વરસાદ, પવન અને દરિયાઈ તોફાનને કારણે માછીમારી માટે જવું સખત જોખમી છે. તાત્કાલિક બંદરે પરત ફરો!
            </Text>
          )}
        </View>
      </View>

      {/* 4. Ocean & Sea Conditions Grid */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>OCEAN & SEA CONDITIONS</Text>
      <View style={styles.grid}>
        {/* Wave & Swell */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="wave" size={16} color="#38BDF8" />
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>WAVE & SWELL</Text>
          </View>
          <Text style={[styles.cardValue, { color: colors.text }]}>
            {conditions.waveHeightM}{' '}
            <Text style={[styles.cardUnit, { color: colors.textSecondary }]}>m</Text>
          </Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            Period: {conditions.wavePeriodS}s • Swell: {conditions.waveDirectionText}
          </Text>
        </View>

        {/* Wind & Gusts */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Feather name="wind" size={16} color="#F59E0B" />
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>WIND & GUSTS</Text>
          </View>
          <Text style={[styles.cardValue, { color: colors.text }]}>
            {conditions.windSpeedKnots}{' '}
            <Text style={[styles.cardUnit, { color: colors.textSecondary }]}>kts</Text>
          </Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            Gusts: {conditions.windGustsKnots} kts • {conditions.windDirectionText} ({conditions.windBeaufort})
          </Text>
        </View>

        {/* Rain / Precipitation */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="rainy" size={16} color="#0284C7" />
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>RAIN & PRECIPITATION</Text>
          </View>
          <Text
            style={[
              styles.cardValue,
              {
                color: conditions.precipitationMm > 3.0 ? '#EF4444' : colors.text,
              },
            ]}>
            {conditions.precipitationMm}{' '}
            <Text style={[styles.cardUnit, { color: colors.textSecondary }]}>mm/h</Text>
          </Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            Weather: {conditions.weatherDesc}
          </Text>
        </View>

        {/* Water Temp */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="coolant-temperature" size={16} color="#06B6D4" />
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>WATER TEMP</Text>
          </View>
          <Text style={[styles.cardValue, { color: colors.text }]}>
            {conditions.seaTempC}{' '}
            <Text style={[styles.cardUnit, { color: colors.textSecondary }]}>°C</Text>
          </Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Ideal for Pelagic Catch</Text>
        </View>

        {/* Barometer Pressure */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="gauge" size={16} color="#A855F7" />
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>BAROMETER</Text>
          </View>
          <Text style={[styles.cardValue, { color: colors.text }]}>
            {conditions.surfacePressureHpa}{' '}
            <Text style={[styles.cardUnit, { color: colors.textSecondary }]}>hPa</Text>
          </Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            {conditions.surfacePressureHpa < 1005 ? '⚠️ Low Pressure (Squall)' : 'Marine Surface Pressure'}
          </Text>
        </View>

        {/* Visibility */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="eye-outline" size={16} color="#10B981" />
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>VISIBILITY</Text>
          </View>
          <Text style={[styles.cardValue, { color: colors.text }]}>
            {conditions.visibilityNm}{' '}
            <Text style={[styles.cardUnit, { color: colors.textSecondary }]}>NM</Text>
          </Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            {conditions.precipitationMm > 2 ? 'Reduced by Rain / Squalls' : 'Clear Horizon • Oceanic'}
          </Text>
        </View>

        {/* Tidal Current */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="compass-rose" size={16} color="#EC4899" />
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>TIDAL CURRENT</Text>
          </View>
          <Text style={[styles.cardValue, { color: colors.text }]}>
            {conditions.tidalCurrentKnots}{' '}
            <Text style={[styles.cardUnit, { color: colors.textSecondary }]}>kts</Text>
          </Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Astronomical Drift</Text>
        </View>

        {/* Nearest Port */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="ship-wheel" size={16} color="#F59E0B" />
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>NEAREST PORT</Text>
          </View>
          <Text style={[styles.cardValueSmall, { color: colors.text }]} numberOfLines={1}>
            {conditions.nearestPort.port.name.replace(' Fishing Harbor', '').replace(' Harbor', '')}
          </Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            {conditions.nearestPort.displayBadge}
          </Text>
        </View>
      </View>

      {/* 5. 48-Hour Scrollable Tide Chart */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 4 }]}>
        48-HOUR TIDE CYCLE & PREDICTIONS
      </Text>
      <TideChart tideData={tides} isOffline={isOffline} />

      {/* 6. Hourly Marine Forecast (Next 36h with Rain, Wind, Wave) */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>HOURLY MARINE FORECAST</Text>
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
              name={item.icon as any}
              size={22}
              color={colors.accent}
              style={{ marginVertical: 6 }}
            />
            <Text style={[styles.hourlyTemp, { color: colors.text }]}>{item.temp}</Text>
            <Text style={[styles.hourlyMetricText, { color: colors.textSecondary }]}>{item.wind}</Text>
            <Text style={[styles.hourlyMetricText, { color: colors.accent }]}>{item.wave}</Text>
            {item.rain && item.rain !== '0.0mm' && (
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
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  portCard: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  portLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  portIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portName: {
    fontSize: 14,
    fontWeight: '800',
  },
  portTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  portTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  portSub: {
    fontSize: 11,
    marginTop: 2,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    marginBottom: 10,
  },
  syncLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  syncTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  syncSub: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  syncBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  advisoryBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  advisoryInfo: {
    flex: 1,
  },
  advisoryTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  safetyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  safetyBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  advisorySub: {
    fontSize: 11,
    marginTop: 3,
    lineHeight: 16,
  },
  gujaratiNotice: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  card: {
    flex: 1,
    minWidth: '46%',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  cardValueSmall: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  cardUnit: {
    fontSize: 12,
  },
  cardSub: {
    fontSize: 10,
    marginTop: 2,
  },
  hourlyScroll: {
    flexDirection: 'row',
    marginTop: 4,
  },
  hourlyCard: {
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
  },
  hourlyHour: {
    fontSize: 10,
    fontWeight: '600',
  },
  hourlyTemp: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  hourlyMetricText: {
    fontSize: 10,
  },
  hourlyRainText: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
});
