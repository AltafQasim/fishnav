import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MarineCompassView } from '@/components/compass/marine-compass-view';
import { MapColors } from '@/constants/map-theme';
import { useLanguage } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';

import { formatLatitude, formatLongitude, useUserLocation } from '@/hooks/use-user-location';

export function CompassSheetContent() {
  const { colors, isLight } = useAppTheme();
  const { t } = useLanguage();
  const { location } = useUserLocation();
  const [northMode, setNorthMode] = useState<'magnetic' | 'true'>('magnetic');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: 110 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Mode Selector */}
      <View style={styles.topBar}>
        <View style={styles.calibratedBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.calibratedText}>{t('compass.sensor_active', 'COMPASS SENSOR ACTIVE')}</Text>
        </View>

        <Pressable
          style={[styles.modeBtn, { backgroundColor: colors.chipBg, borderColor: colors.chipBorder }]}
          onPress={() => setNorthMode((prev) => (prev === 'magnetic' ? 'true' : 'magnetic'))}
          accessibilityRole="button"
        >
          <Text style={[styles.modeBtnText, { color: colors.accent }]}>
            {northMode === 'magnetic' ? t('compass.mag_north', 'MAG NORTH') : t('compass.true_north', 'TRUE NORTH')}
          </Text>
        </Pressable>
      </View>

      {/* Full Live Compass Dial */}
      <MarineCompassView northMode={northMode} />

      {/* 📍 Current Vessel Coordinates Card */}
      <View
        style={[
          styles.coordsCard,
          {
            backgroundColor: isLight ? '#FFFFFF' : 'rgba(10, 31, 53, 0.85)',
            borderColor: isLight ? '#BAE6FD' : 'rgba(0, 240, 255, 0.3)',
          },
        ]}
      >
        <View style={styles.coordsHeader}>
          <View style={styles.coordsHeaderLeft}>
            <Ionicons name="location" size={15} color={colors.accent} />
            <Text style={[styles.coordsHeaderTitle, { color: colors.accent }]}>
              {t('overlay.gps_coords', 'CURRENT VESSEL COORDINATES')}
            </Text>
          </View>
          <View style={[styles.gpsPill, isLight && { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}>
            <View style={styles.gpsPillDot} />
            <Text style={[styles.gpsPillText, isLight && { color: '#16A34A' }]}>3D GPS FIX</Text>
          </View>
        </View>

        <View style={styles.coordsBody}>
          {/* Latitude Row */}
          <View style={styles.coordCol}>
            <Text style={[styles.coordLabel, { color: colors.textMuted }]}>LATITUDE</Text>
            <Text style={[styles.coordDms, { color: colors.text }]}>
              {location ? formatLatitude(location.latitude) : '20° 54\' 00" N'}
            </Text>
            <Text style={[styles.coordDec, { color: colors.accent }]}>
              {location ? `${location.latitude.toFixed(5)}° N` : '20.90000° N'}
            </Text>
          </View>

          <View style={[styles.coordDivider, { backgroundColor: isLight ? '#E2E8F0' : colors.divider }]} />

          {/* Longitude Row */}
          <View style={styles.coordCol}>
            <Text style={[styles.coordLabel, { color: colors.textMuted }]}>LONGITUDE</Text>
            <Text style={[styles.coordDms, { color: colors.text }]}>
              {location ? formatLongitude(location.longitude) : '70° 22\' 00" E'}
            </Text>
            <Text style={[styles.coordDec, { color: colors.accent }]}>
              {location ? `${location.longitude.toFixed(5)}° E` : '70.36670° E'}
            </Text>
          </View>
        </View>
      </View>

      {/* Marine Steering Guidelines */}
      <View style={[styles.guideCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.guideHeader}>
          <Ionicons name="compass" size={16} color={colors.accent} />
          <Text style={[styles.guideTitle, { color: colors.accent }]}>{t('compass.guidance_title', 'MARINE STEERING GUIDANCE')}</Text>
        </View>
        <Text style={[styles.guideText, { color: colors.textSecondary }]}>
          {t('compass.guidance_desc', "The red Lubber Line marks your boat's bow orientation. When you tap a waypoint and start navigation, a blue arrow will point directly to your target.")}
        </Text>
      </View>
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
    paddingTop: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  calibratedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  calibratedText: {
    color: '#22C55E',
    fontSize: 10,
    fontWeight: '800',
  },
  modeBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modeBtnText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  guideCard: {
    backgroundColor: MapColors.navyPanel,
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  guideTitle: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  guideText: {
    color: MapColors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  coordsCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    marginTop: 12,
  },
  coordsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  coordsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coordsHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  gpsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10B981',
    gap: 5,
  },
  gpsPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  gpsPillText: {
    color: '#10B981',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  coordsBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coordCol: {
    flex: 1,
  },
  coordLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  coordDms: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  coordDec: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  coordDivider: {
    width: 1,
    height: 38,
    marginHorizontal: 12,
  },
});
