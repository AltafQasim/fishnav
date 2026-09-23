import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MarineCompassView } from '@/components/compass/marine-compass-view';
import { TargetWaypointPickerModal } from '@/components/compass/target-waypoint-picker-modal';
import type { FishingSpot } from '@/constants/fishing-spots';
import { MapColors } from '@/constants/map-theme';
import { useLanguage } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';

export type CompassSheetContentProps = {
  onStartNavigation?: (spot: FishingSpot) => void;
};

export function CompassSheetContent({ onStartNavigation }: CompassSheetContentProps = {}) {
  const { colors, isLight } = useAppTheme();
  const { t } = useLanguage();
  const [northMode, setNorthMode] = useState<'magnetic' | 'true'>('magnetic');
  const [showTargetModal, setShowTargetModal] = useState(false);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Mode Selector & Calibrated Status */}
        <View style={styles.topBar}>
          <View style={styles.calibratedBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.calibratedText}>{t('compass.sensor_active', 'COMPASS SENSOR ACTIVE')}</Text>
          </View>

          <View style={styles.topRightActions}>
            <Pressable
              style={[
                styles.setTargetHeaderBtn,
                { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: colors.accent },
              ]}
              onPress={() => setShowTargetModal(true)}
              accessibilityRole="button"
              accessibilityLabel="Select Target Waypoint"
            >
              <Ionicons name="navigate" size={13} color={colors.accent} style={{ marginRight: 4 }} />
              <Text style={[styles.setTargetHeaderText, { color: colors.accent }]}>TARGET</Text>
            </Pressable>

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
        </View>

        {/* Full Live Compass Dial with Navigation Arrow & Unified Marine Telemetry Cards */}
        <MarineCompassView
          northMode={northMode}
          onOpenTargetPicker={() => setShowTargetModal(true)}
        />

        {/* Marine Steering Guidelines */}
        <View style={[styles.guideCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.guideHeader}>
            <Ionicons name="compass" size={16} color={colors.accent} />
            <Text style={[styles.guideTitle, { color: colors.accent }]}>
              {t('compass.guidance_title', 'MARINE STEERING GUIDANCE')}
            </Text>
          </View>
          <Text style={[styles.guideText, { color: colors.textSecondary }]}>
            {t(
              'compass.guidance_desc',
              "The red Lubber Line marks your boat's bow orientation. When you set a target waypoint, the navigation arrow points directly to your destination. Turn the boat to align the navigation arrow with the red lubber line — the arrow turns green when on course!"
            )}
          </Text>
        </View>
      </ScrollView>

      {/* Target Waypoint Selector Modal */}
      <TargetWaypointPickerModal
        visible={showTargetModal}
        onClose={() => setShowTargetModal(false)}
        onStartNavigation={(spot) => {
          setShowTargetModal(false);
          onStartNavigation?.(spot);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    width: '100%',
  },
  content: {
    paddingHorizontal: 12,
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
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setTargetHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  setTargetHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
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
