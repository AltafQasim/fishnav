import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MarineCompassView } from '@/components/compass/marine-compass-view';
import { MapColors } from '@/constants/map-theme';
import { useLanguage } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';

export function CompassSheetContent() {
  const { colors, isLight } = useAppTheme();
  const { t } = useLanguage();
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
});
