import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NavigationCompassRose } from '@/components/compass/navigation-compass-rose';
import { useAppTheme } from '@/context/theme-context';
import { useTripTracking } from '@/context/trip-context';
import { etaFromNm, formatNm } from '@/utils/geo';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type GoogleNavHudProps = {
  onRecenter: () => void;
  onToggleHeadingUp?: () => void;
  headingUp?: boolean;
};

// Cardinal heading helper
const getCardinal = (deg: number) => {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const idx = Math.round(((deg % 360) + 360) % 360 / 22.5) % 16;
  return dirs[idx];
};

/**
 * 🗺️ Google Maps Marine Navigation Cockpit & Full Compass Steering HUD
 * 1. Live 360° Marine Compass Dial with real-time Destination Bearing Arrow
 * 2. Tap to expand into a Full-Screen Marine Compass Instrument
 * 3. Optional trip recording toggle button
 * 4. Distance remaining, boat speed, and dynamic ETA to waypoint
 */
export function GoogleNavHud({
  onRecenter,
  onToggleHeadingUp,
  headingUp = false,
}: GoogleNavHudProps) {
  const insets = useSafeAreaInsets();
  const { colors, isLight } = useAppTheme();
  const [showFullCompass, setShowFullCompass] = useState(false);

  const {
    isTracking,
    isPaused,
    elapsedSeconds,
    distanceNm,
    distanceToTargetNm,
    currentSpeedKnots,
    targetSpot,
    targetBearing,
    userCompassHeading,
    relativeSteerAngle,
    steeringInstruction,
    startTripRecording,
    toggleTripRecording,
    pauseTracking,
    resumeTracking,
    exitNavigation,
  } = useTripTracking();

  // Format elapsed time as HH:MM:SS
  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Dynamic ETA calculation
  const remainingDist = distanceToTargetNm ?? distanceNm;
  const etaText =
    distanceToTargetNm && currentSpeedKnots > 0.4
      ? etaFromNm(distanceToTargetNm, currentSpeedKnots)
      : '—';

  const isOnCourse = relativeSteerAngle != null && Math.abs(relativeSteerAngle) <= 6;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* 🧭 1. FULL-SCREEN EXPANDED MARINE COMPASS INSTRUMENT VIEW */}
      {showFullCompass && (
        <View
          style={[
            styles.fullCompassModal,
            {
              backgroundColor: isLight ? '#F8FAFC' : 'rgba(3, 15, 29, 0.96)',
              paddingTop: insets.top + 12,
              paddingBottom: Math.max(insets.bottom, 16) + 6,
            },
          ]}
          pointerEvents="auto"
        >
          {/* Full Compass Header */}
          <View style={[styles.fullCompassHeader, { borderBottomColor: colors.divider }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fullCompassPreTitle, { color: colors.accent }]}>MARINE STEERING COCKPIT</Text>
              <Text style={[styles.fullCompassTitle, { color: colors.text }]} numberOfLines={1}>
                {targetSpot ? `🎯 ${targetSpot.name}` : 'Free Navigation'}
              </Text>
            </View>
            <Pressable
              style={[
                styles.closeFullCompassBtn,
                {
                  backgroundColor: colors.chipBg,
                  borderColor: colors.accent,
                },
              ]}
              onPress={() => setShowFullCompass(false)}
              hitSlop={8}
            >
              <Ionicons name="map" size={16} color={colors.accent} />
              <Text style={[styles.closeFullCompassText, { color: colors.accent }]}>VIEW MAP</Text>
            </Pressable>
          </View>

          {/* Massive 260px Compass Instrument with Real Destination Arrow */}
          <View style={styles.fullCompassBody}>
            <NavigationCompassRose
              size={Math.min(SCREEN_WIDTH - 64, 270)}
              heading={userCompassHeading}
              targetBearing={targetBearing}
              relativeSteerAngle={relativeSteerAngle}
              showDegreeNumbers={true}
              showRoseStar={true}
              themeMode={isLight ? 'light' : 'dark'}
            />

            {/* Big Digital Heading & Steer Instruction */}
            <View style={styles.fullSteerBlock}>
              <Text style={[styles.fullHeadingReadout, { color: colors.text }]}>
                {String(userCompassHeading).padStart(3, '0')}°{' '}
                <Text style={[styles.fullHeadingCardinal, { color: colors.accent }]}>
                  {getCardinal(userCompassHeading)}
                </Text>
              </Text>
              <View
                style={[
                  styles.fullSteerBadge,
                  isOnCourse ? styles.fullSteerBadgeGreen : styles.fullSteerBadgeCyan,
                  isLight && !isOnCourse && { backgroundColor: colors.chipBg, borderColor: colors.accent },
                ]}
              >
                <Text style={[styles.fullSteerBadgeText, isLight && !isOnCourse && { color: colors.accent }]}>
                  {steeringInstruction.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* 4-Grid Telemetry Cards */}
          <View style={styles.fullTelemGrid}>
            <View
              style={[
                styles.fullTelemCard,
                {
                  backgroundColor: isLight ? '#FFFFFF' : 'rgba(15, 39, 66, 0.65)',
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.fullTelemLabel, { color: colors.textSecondary }]}>TARGET BEARING</Text>
              <Text style={[styles.fullTelemVal, { color: colors.text }]}>
                {targetBearing != null
                  ? `${Math.round(targetBearing)}° ${getCardinal(targetBearing)}`
                  : '—'}
              </Text>
            </View>
            <View
              style={[
                styles.fullTelemCard,
                {
                  backgroundColor: isLight ? '#FFFFFF' : 'rgba(15, 39, 66, 0.65)',
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.fullTelemLabel, { color: colors.textSecondary }]}>DISTANCE</Text>
              <Text style={[styles.fullTelemVal, { color: colors.text }]}>{formatNm(remainingDist)}</Text>
            </View>
            <View
              style={[
                styles.fullTelemCard,
                {
                  backgroundColor: isLight ? '#FFFFFF' : 'rgba(15, 39, 66, 0.65)',
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.fullTelemLabel, { color: colors.textSecondary }]}>BOAT SPEED</Text>
              <Text style={[styles.fullTelemVal, { color: colors.text }]}>
                {currentSpeedKnots.toFixed(1)} <Text style={[styles.unitSmall, { color: colors.accent }]}>kts</Text>
              </Text>
            </View>
            <View
              style={[
                styles.fullTelemCard,
                {
                  backgroundColor: isLight ? '#FFFFFF' : 'rgba(15, 39, 66, 0.65)',
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.fullTelemLabel, { color: colors.textSecondary }]}>EST. ARRIVAL</Text>
              <Text style={[styles.fullTelemVal, { color: colors.text }]}>{etaText}</Text>
            </View>
          </View>

          {/* Bottom Action Controls */}
          <View style={styles.fullBottomRow}>
            {/* Optional Trip Recording Button */}
            {isTracking ? (
              <Pressable
                style={[styles.recIndicator, isPaused && styles.recIndicatorPaused]}
                onPress={toggleTripRecording}
              >
                <View style={[styles.recDot, isPaused && styles.recDotPaused]} />
                <Text style={styles.recText}>
                  {isPaused ? 'REC PAUSED • RESUME' : `REC ${formatTime(elapsedSeconds)} • STOP`}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                style={[
                  styles.startRecordBtn,
                  {
                    backgroundColor: isLight ? '#FFFFFF' : 'rgba(15, 39, 66, 0.9)',
                    borderColor: colors.accent,
                  },
                ]}
                onPress={startTripRecording}
              >
                <Ionicons name="radio-button-on" size={14} color={colors.accent} />
                <Text style={[styles.startRecordText, { color: colors.accent }]}>RECORD TRIP</Text>
              </Pressable>
            )}

            {/* Red End Navigation Button */}
            <Pressable style={styles.fullExitBtn} onPress={exitNavigation}>
              <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
              <Text style={styles.fullExitText}>END NAVIGATION</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* 🟢 2. TOP GOOGLE MAPS STYLE COMPASS STEERING BANNER (MAP MODE) */}
      <View style={[styles.topBannerWrap, { top: insets.top + 8 }]} pointerEvents="auto">
        <View
          style={[
            styles.topGreenCard,
            isLight && {
              backgroundColor: '#059669',
              borderColor: '#047857',
            },
          ]}
        >
          {/* Real Circular Marine Compass Rose with Destination Arrow! */}
          <Pressable
            style={styles.compassDialWrap}
            onPress={() => setShowFullCompass(true)}
            hitSlop={6}
          >
            <NavigationCompassRose
              size={74}
              heading={userCompassHeading}
              targetBearing={targetBearing}
              relativeSteerAngle={relativeSteerAngle}
            />
          </Pressable>

          {/* Steering Guidance & Target Info */}
          <Pressable
            style={styles.guidanceTextGroup}
            onPress={() => setShowFullCompass(true)}
          >
            <View style={styles.steerHeaderRow}>
              <Text style={styles.primaryInstruction} numberOfLines={1}>
                {steeringInstruction}
              </Text>
              <View style={styles.expandCompassIcon}>
                <Ionicons name="expand-outline" size={14} color="#00F0FF" />
              </View>
            </View>
            <Text style={styles.secondarySub} numberOfLines={1}>
              {targetSpot
                ? `Destination: ${targetSpot.name} ${targetSpot.depthM ? `(${targetSpot.depthM}m)` : ''}`
                : `Navigating Course • Live Heading ${userCompassHeading}°`}
            </Text>
          </Pressable>

          {/* Recenter / Heading Button */}
          <Pressable
            style={[styles.miniHeaderBtn, headingUp && styles.miniHeaderBtnActive]}
            onPress={onToggleHeadingUp || onRecenter}
            hitSlop={8}
          >
            <Ionicons
              name={headingUp ? 'navigate' : 'compass-outline'}
              size={22}
              color={headingUp ? '#00F0FF' : '#FFFFFF'}
            />
          </Pressable>
        </View>

        {/* Action / Compass Info Row below card */}
        <View style={styles.statusPillRow}>
          {/* Optional Trip Recording Button */}
          {isTracking ? (
            <Pressable
              style={[styles.recIndicator, isPaused && styles.recIndicatorPaused]}
              onPress={toggleTripRecording}
              hitSlop={8}
            >
              <View style={[styles.recDot, isPaused && styles.recDotPaused]} />
              <Text style={styles.recText}>
                {isPaused ? 'REC PAUSED • RESUME' : `REC ${formatTime(elapsedSeconds)} • STOP`}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={[
                styles.startRecordBtn,
                {
                  backgroundColor: isLight ? '#FFFFFF' : 'rgba(15, 39, 66, 0.9)',
                  borderColor: colors.accent,
                },
              ]}
              onPress={startTripRecording}
              hitSlop={8}
            >
              <Ionicons name="radio-button-on" size={13} color={colors.accent} />
              <Text style={[styles.startRecordText, { color: colors.accent }]}>RECORD TRIP</Text>
            </Pressable>
          )}

          {/* Compass Heading vs Bearing Comparison Pill (Tap to open full compass) */}
          <Pressable
            style={[
              styles.compassCardPill,
              {
                backgroundColor: isLight ? '#FFFFFF' : 'rgba(15, 23, 42, 0.92)',
                borderColor: colors.cardBorder,
              },
            ]}
            onPress={() => setShowFullCompass(true)}
            hitSlop={8}
          >
            <Ionicons name="compass" size={13} color={colors.accent} />
            <Text style={[styles.compassCardText, { color: colors.textSecondary }]}>
              HDG{' '}
              <Text style={[styles.compassCardVal, { color: colors.text }]}>
                {userCompassHeading}° {getCardinal(userCompassHeading)}
              </Text>
              {targetBearing != null && (
                <>
                  <Text style={[styles.compassArrow, { color: colors.accent }]}> ➔ </Text>
                  BRG{' '}
                  <Text style={[styles.compassTargetVal, { color: colors.accent }]}>
                    {Math.round(targetBearing)}° {getCardinal(targetBearing)}
                  </Text>
                </>
              )}
            </Text>
            <Ionicons name="chevron-forward" size={12} color={colors.accent} style={{ marginLeft: 2 }} />
          </Pressable>
        </View>
      </View>

      {/* 🔴 3. BOTTOM GOOGLE MAPS NAVIGATION COCKPIT BAR */}
      <View
        style={[styles.bottomCockpitWrap, { paddingBottom: Math.max(insets.bottom, 12) + 6 }]}
        pointerEvents="auto"
      >
        <View
          style={[
            styles.bottomCockpitCard,
            {
              backgroundColor: isLight ? '#FFFFFF' : colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          {/* Left: Distance Remaining to Waypoint */}
          <View style={styles.statCol}>
            <Text style={styles.statMainGreen}>{formatNm(remainingDist)}</Text>
            <Text style={[styles.statSubLabel, { color: colors.textMuted }]}>
              {targetSpot ? 'DISTANCE' : 'LOGGED'}
            </Text>
          </View>

          <View style={[styles.vertDivider, { backgroundColor: colors.divider }]} />

          {/* Middle: Speed Over Ground */}
          <View style={styles.statCol}>
            <Text style={[styles.statMainWhite, { color: colors.text }]}>
              {currentSpeedKnots.toFixed(1)}{' '}
              <Text style={[styles.unitText, { color: colors.accent }]}>kts</Text>
            </Text>
            <Text style={[styles.statSubLabel, { color: colors.textMuted }]}>BOAT SPEED</Text>
          </View>

          <View style={[styles.vertDivider, { backgroundColor: colors.divider }]} />

          {/* Middle 2: ETA / Time */}
          <View style={styles.statCol}>
            <Text style={[styles.statMainWhite, { color: colors.text }]}>
              {targetSpot && distanceToTargetNm != null ? etaText : formatTime(elapsedSeconds)}
            </Text>
            <Text style={[styles.statSubLabel, { color: colors.textMuted }]}>
              {targetSpot && distanceToTargetNm != null ? 'EST. ARRIVAL' : 'VOYAGE TIME'}
            </Text>
          </View>

          {/* Right Action Buttons */}
          <View style={styles.actionButtonsCol}>
            {/* Pause / Resume Button (Only visible while recording) */}
            {isTracking && (
              <Pressable
                style={[
                  styles.pauseCircleBtn,
                  {
                    backgroundColor: isLight ? '#F1F5F9' : '#1E293B',
                    borderColor: colors.divider,
                  },
                ]}
                onPress={isPaused ? resumeTracking : pauseTracking}
                hitSlop={6}
              >
                <Ionicons name={isPaused ? 'play' : 'pause'} size={18} color={colors.text} />
              </Pressable>
            )}

            {/* Google Maps Red Circular Exit Navigation Button */}
            <Pressable style={styles.redEndTripBtn} onPress={exitNavigation} hitSlop={6}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 25,
    justifyContent: 'space-between',
  },
  topBannerWrap: {
    marginHorizontal: 12,
  },
  topGreenCard: {
    backgroundColor: '#043427', // Google Maps dark green navigation bar
    borderRadius: 20,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#10B981',
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
    gap: 10,
  },
  compassDialWrap: {
    borderRadius: 37,
    overflow: 'hidden',
    shadowColor: '#00F0FF',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  guidanceTextGroup: {
    flex: 1,
  },
  steerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  primaryInstruction: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    flex: 1,
  },
  expandCompassIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondarySub: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  miniHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniHeaderBtnActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  statusPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  startRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 39, 66, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00F0FF',
    gap: 5,
  },
  startRecordText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  recIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    gap: 6,
  },
  recIndicatorPaused: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  recDotPaused: {
    backgroundColor: '#F59E0B',
  },
  recText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  compassCardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    gap: 5,
  },
  compassCardText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  compassCardVal: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  compassArrow: {
    color: '#38BDF8',
    fontWeight: '900',
  },
  compassTargetVal: {
    color: '#00F0FF',
    fontWeight: '800',
  },

  // Full-Screen Marine Compass Instrument Modal
  fullCompassModal: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(3, 15, 29, 0.95)',
    zIndex: 50,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  fullCompassHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.2)',
  },
  fullCompassPreTitle: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  fullCompassTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  closeFullCompassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#00F0FF',
    gap: 6,
  },
  closeFullCompassText: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '800',
  },
  fullCompassBody: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  fullSteerBlock: {
    alignItems: 'center',
    marginTop: 14,
  },
  fullHeadingReadout: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  fullHeadingCardinal: {
    color: '#38BDF8',
    fontSize: 22,
    fontWeight: '800',
  },
  fullSteerBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
  },
  fullSteerBadgeGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  fullSteerBadgeCyan: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderColor: '#00F0FF',
  },
  fullSteerBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  fullTelemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fullTelemCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: 'rgba(15, 39, 66, 0.65)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    alignItems: 'center',
  },
  fullTelemLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  fullTelemVal: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 2,
  },
  unitSmall: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '600',
  },
  fullBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    gap: 12,
  },
  fullExitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    gap: 6,
  },
  fullExitText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },

  // Bottom Google Maps Style Bar
  bottomCockpitWrap: {
    marginHorizontal: 12,
  },
  bottomCockpitCard: {
    backgroundColor: '#0B1C2D',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 14,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statMainGreen: {
    color: '#10B981',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  statMainWhite: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  unitText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#93C5FD',
  },
  statSubLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 3,
    letterSpacing: 0.4,
  },
  vertDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 4,
  },
  actionButtonsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 6,
  },
  pauseCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  redEndTripBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DC2626', // Google Maps vibrant red stop circle
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
});

