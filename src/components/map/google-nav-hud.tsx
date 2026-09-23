import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NavigationCompassRose } from '@/components/compass/navigation-compass-rose';
import { TargetWaypointPickerModal } from '@/components/compass/target-waypoint-picker-modal';
import { useLanguage } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';
import { useTripTracking } from '@/context/trip-context';
import { useWaypoints } from '@/context/waypoints-context';
import { useMarineWeather } from '@/hooks/use-marine-weather';
import { formatLatitude, formatLongitude, useUserLocation } from '@/hooks/use-user-location';
import { getMoonPhaseDetails } from '@/utils/astronomy';
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

function getMoonIcon(phase: number): string {
  if (phase < 0.05 || phase > 0.95) return '🌑';
  if (phase < 0.20) return '🌒';
  if (phase < 0.30) return '🌓';
  if (phase < 0.45) return '🌔';
  if (phase < 0.55) return '🌕';
  if (phase < 0.70) return '🌖';
  if (phase < 0.80) return '🌗';
  return '🌘';
}

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
  const { t } = useLanguage();
  const { location } = useUserLocation();
  const [showFullCompass, setShowFullCompass] = useState(true);
  const [showTargetPicker, setShowTargetPicker] = useState(false);
  const { activeNavigationTarget, setActiveNavigationTarget } = useWaypoints();

  // Marine Weather, Tides & Astronomy Data
  const { data: weatherData } = useMarineWeather();
  const moonInfo = useMemo(() => getMoonPhaseDetails(new Date()), []);
  const tides = weatherData?.tides;
  const conditions = weatherData?.conditions;

  const isTideRising = useMemo(() => {
    if (!tides?.nextHighTide?.heightM || !tides?.currentHeightM) return true;
    return tides.nextHighTide.heightM >= tides.currentHeightM;
  }, [tides]);

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

  const effectiveTarget = targetSpot || activeNavigationTarget;

  const getLocalizedSteer = (instr: string) => {
    const upper = (instr || '').toUpperCase();
    if (upper.includes('HOLD COURSE') || upper.includes('ON COURSE')) {
      return t('hud.hold_course', 'HOLD COURSE');
    }
    if (upper.includes('PORT')) {
      return t('hud.steer_port', 'STEER PORT (LEFT)');
    }
    if (upper.includes('STARBOARD')) {
      return t('hud.steer_starboard', 'STEER STARBOARD (RIGHT)');
    }
    return instr;
  };

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

  // 🧭 Automatically open the compass steering screen when navigation starts or target changes
  const prevTargetIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (effectiveTarget) {
      if (effectiveTarget.id !== prevTargetIdRef.current) {
        prevTargetIdRef.current = effectiveTarget.id;
        setShowFullCompass(true);
      }
    }
  }, [effectiveTarget]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* 🧭 1. FULL-SCREEN EXPANDED MARINE COMPASS INSTRUMENT VIEW */}
      {showFullCompass && (
        <View
          style={[
            styles.fullCompassModal,
            {
              backgroundColor: isLight ? '#F8FAFC' : 'rgba(3, 15, 29, 0.98)',
              paddingTop: insets.top + 12,
              paddingBottom: Math.max(insets.bottom, 16) + 6,
            },
          ]}
          pointerEvents="auto"
        >
          {/* Full Compass Header */}
          <View style={[styles.fullCompassHeader, { borderBottomColor: colors.divider }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fullCompassPreTitle, { color: colors.accent }]}>{t('hud.steering_cockpit', 'MARINE STEERING COCKPIT')}</Text>
              <Text style={[styles.fullCompassTitle, { color: colors.text }]} numberOfLines={1}>
                {targetSpot ? `🎯 ${targetSpot.name}` : t('hud.free_nav', 'Free Navigation')}
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
              <Text style={[styles.closeFullCompassText, { color: colors.accent }]}>{t('btn.view', 'VIEW MAP')}</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.fullCompassScroll}
            contentContainerStyle={styles.fullCompassScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Massive 260px Compass Instrument with Real Destination Arrow */}
            <View style={styles.fullCompassBody}>
              <NavigationCompassRose
                size={Math.min(SCREEN_WIDTH - 64, 250)}
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
                    {getLocalizedSteer(steeringInstruction)}
                  </Text>
                </View>
              </View>
            </View>

            {/* 🧭 UNIFIED MARINE TELEMETRY INSTRUMENT GRID (Identical card design across all metrics) */}
            <View style={styles.fullTelemGrid}>
              {/* ROW 1: SPEED (SOG) & COURSE (COG) */}
              <View
                style={[
                  styles.fullTelemCard,
                  {
                    backgroundColor: isLight ? '#FFFFFF' : 'rgba(15, 39, 66, 0.65)',
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Text style={[styles.fullTelemLabel, { color: colors.textMuted }]}>SPEED (SOG)</Text>
                <Text style={[styles.fullTelemVal, { color: colors.text }]}>
                  {currentSpeedKnots.toFixed(1)}{' '}
                  <Text style={[styles.fullTelemUnit, { color: colors.accent }]}>kts</Text>
                </Text>
                <Text style={[styles.fullTelemSub, { color: colors.textMuted }]}>Speed Over Ground</Text>
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
                <Text style={[styles.fullTelemLabel, { color: colors.textMuted }]}>COURSE (COG)</Text>
                <Text style={[styles.fullTelemVal, { color: colors.text }]}>
                  {String(userCompassHeading).padStart(3, '0')}°
                </Text>
                <Text style={[styles.fullTelemSub, { color: colors.accent }]}>
                  {getCardinal(userCompassHeading)} • Heading
                </Text>
              </View>

              {/* ROW 2: TARGET BEARING & DISTANCE / ETA */}
              <View
                style={[
                  styles.fullTelemCard,
                  {
                    backgroundColor: isLight ? '#FFFFFF' : 'rgba(15, 39, 66, 0.65)',
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Text style={[styles.fullTelemLabel, { color: colors.textMuted }]}>{t('hud.bearing', 'TARGET BEARING')}</Text>
                <Text style={[styles.fullTelemVal, { color: colors.text }]}>
                  {targetBearing != null
                    ? `${Math.round(targetBearing)}° ${getCardinal(targetBearing)}`
                    : '—'}
                </Text>
                <Text style={[styles.fullTelemSub, { color: colors.textMuted }]} numberOfLines={1}>
                  {effectiveTarget ? effectiveTarget.name : 'No Target Set'}
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
                <Text style={[styles.fullTelemLabel, { color: colors.textMuted }]}>{t('cockpit.distance', 'DISTANCE & ETA')}</Text>
                <Text style={[styles.fullTelemVal, { color: colors.text }]}>
                  {formatNm(remainingDist)}
                </Text>
                <Text style={[styles.fullTelemSub, { color: colors.accent }]}>
                  ETA: {etaText}
                </Text>
              </View>

              {/* ROW 3: CURRENT POSITION & TARGET POSITION (Latitude & Longitude combined in one card) */}
              <View
                style={[
                  styles.fullTelemCard,
                  {
                    backgroundColor: isLight ? '#FFFFFF' : 'rgba(15, 39, 66, 0.65)',
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.fullTelemLabel, { color: colors.textMuted }]}>CURRENT POSITION</Text>
                  <View style={[styles.gpsMiniPill, isLight && { backgroundColor: '#DCFCE7' }]}>
                    <View style={styles.gpsMiniDot} />
                    <Text style={[styles.gpsMiniText, isLight && { color: '#16A34A' }]}>3D GPS</Text>
                  </View>
                </View>
                <Text style={[styles.fullTelemValCoord, { color: colors.text }]}>
                  {location ? formatLatitude(location.latitude) : '22° 26\' 40" N'}
                </Text>
                <Text style={[styles.fullTelemValCoord, { color: colors.text }]}>
                  {location ? formatLongitude(location.longitude) : '070° 52\' 41" E'}
                </Text>
                <Text style={[styles.fullTelemSub, { color: colors.accent }]}>
                  {location ? `${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°` : '22.4444°, 70.8780°'}
                </Text>
              </View>

              <Pressable
                onPress={() => setShowTargetPicker(true)}
                style={[
                  styles.fullTelemCard,
                  {
                    backgroundColor: isLight ? '#FFFFFF' : 'rgba(15, 39, 66, 0.65)',
                    borderColor: effectiveTarget ? colors.accent : colors.cardBorder,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Target Position"
              >
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.fullTelemLabel, { color: effectiveTarget ? colors.accent : colors.textMuted }]}>
                    TARGET POSITION
                  </Text>
                  {effectiveTarget ? (
                    <View style={styles.targetActiveMiniBadge}>
                      <Text style={styles.targetActiveMiniText}>LOCKED</Text>
                    </View>
                  ) : (
                    <View style={styles.targetSetMiniBadge}>
                      <Text style={styles.targetSetMiniText}>SET 🎯</Text>
                    </View>
                  )}
                </View>
                {effectiveTarget ? (
                  <>
                    <Text style={[styles.fullTelemValCoord, { color: colors.text }]}>
                      {formatLatitude(effectiveTarget.latitude)}
                    </Text>
                    <Text style={[styles.fullTelemValCoord, { color: colors.text }]}>
                      {formatLongitude(effectiveTarget.longitude)}
                    </Text>
                    <Text style={[styles.fullTelemSub, { color: colors.accent }]} numberOfLines={1}>
                      {effectiveTarget.name} {distanceToTargetNm != null ? `• ${formatNm(distanceToTargetNm)}` : ''}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.fullTelemValCoord, { color: colors.textMuted }]}>
                      --° --' --" N
                    </Text>
                    <Text style={[styles.fullTelemValCoord, { color: colors.textMuted }]}>
                      ---° --' --" E
                    </Text>
                    <Text style={[styles.fullTelemSub, { color: colors.textMuted }]}>
                      Initial Blank • Tap to Set 🎯
                    </Text>
                  </>
                )}
              </Pressable>

              {/* ROW 4: NEXT HIGH TIDE & NEXT LOW TIDE */}
              <View
                style={[
                  styles.fullTelemCard,
                  {
                    backgroundColor: isLight ? '#FFFFFF' : 'rgba(15, 39, 66, 0.65)',
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Text style={[styles.fullTelemLabel, { color: colors.textMuted }]}>NEXT HIGH TIDE</Text>
                <Text style={[styles.fullTelemVal, { color: '#22C55E' }]}>
                  {tides?.nextHighTide?.time || '14:30'}{' '}
                  <Text style={[styles.fullTelemUnit, { color: '#22C55E' }]}>
                    {tides?.nextHighTide?.heightM ? `${tides.nextHighTide.heightM.toFixed(1)}m` : '3.8m'}
                  </Text>
                </Text>
                <Text style={[styles.fullTelemSub, { color: isTideRising ? '#22C55E' : colors.textMuted }]}>
                  {tides?.nextHighTide?.relativeText || 'In ~2h'} {isTideRising ? '• Rising ↗' : ''}
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
                <Text style={[styles.fullTelemLabel, { color: colors.textMuted }]}>NEXT LOW TIDE</Text>
                <Text style={[styles.fullTelemVal, { color: '#EAB308' }]}>
                  {tides?.nextLowTide?.time || '20:45'}{' '}
                  <Text style={[styles.fullTelemUnit, { color: '#EAB308' }]}>
                    {tides?.nextLowTide?.heightM ? `${tides.nextLowTide.heightM.toFixed(1)}m` : '0.9m'}
                  </Text>
                </Text>
                <Text style={[styles.fullTelemSub, { color: colors.textMuted }]}>
                  {tides?.nextLowTide?.relativeText || 'In ~8h'} • Depth {tides?.currentHeightM ? `${tides.currentHeightM.toFixed(1)}m` : '2.4m'}
                </Text>
              </View>

              {/* ROW 5: MOON ILLUMINATION & TIDAL CYCLE */}
              <View
                style={[
                  styles.fullTelemCard,
                  {
                    backgroundColor: isLight ? '#FFFFFF' : 'rgba(15, 39, 66, 0.65)',
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Text style={[styles.fullTelemLabel, { color: colors.textMuted }]}>MOON ILLUMINATION</Text>
                <Text style={[styles.fullTelemVal, { color: '#C084FC' }]}>
                  {moonInfo.illumination}% <Text style={[styles.fullTelemUnit, { color: '#C084FC' }]}>{getMoonIcon(moonInfo.phase)}</Text>
                </Text>
                <Text style={[styles.fullTelemSub, { color: colors.textMuted }]} numberOfLines={1}>
                  {moonInfo.phaseNameEn}
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
                <Text style={[styles.fullTelemLabel, { color: colors.textMuted }]}>TIDAL CYCLE</Text>
                <Text style={[styles.fullTelemVal, { color: colors.text }]}>
                  {moonInfo.tideType === 'spring' ? 'Spring Tide' : 'Neap Tide'}
                </Text>
                <Text style={[styles.fullTelemSub, { color: colors.textMuted }]}>
                  Age {moonInfo.moonAgeDays}d • {moonInfo.tideType === 'spring' ? 'High Current' : 'Gentle Sea'}
                </Text>
              </View>

              {/* ROW 6: WIND SPEED & GUSTS */}
              <View
                style={[
                  styles.fullTelemCard,
                  {
                    backgroundColor: isLight ? '#FFFFFF' : 'rgba(15, 39, 66, 0.65)',
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Text style={[styles.fullTelemLabel, { color: colors.textMuted }]}>WIND SPEED</Text>
                <Text style={[styles.fullTelemVal, { color: colors.text }]}>
                  {conditions?.windSpeedKnots ?? 14}{' '}
                  <Text style={[styles.fullTelemUnit, { color: colors.accent }]}>kts</Text>
                </Text>
                <Text style={[styles.fullTelemSub, { color: colors.textMuted }]}>
                  {conditions?.windDirectionText || 'WNW'} ({conditions?.windDirectionDeg ?? 290}°) • {conditions?.windBeaufort || 'Force 4'}
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
                <Text style={[styles.fullTelemLabel, { color: colors.textMuted }]}>WIND GUSTS</Text>
                <Text style={[styles.fullTelemVal, { color: '#F97316' }]}>
                  {conditions?.windGustsKnots ?? 21}{' '}
                  <Text style={[styles.fullTelemUnit, { color: '#F97316' }]}>kts</Text>
                </Text>
                <Text style={[styles.fullTelemSub, { color: colors.textMuted }]}>Peak Offshore Gusts</Text>
              </View>

              {/* ROW 7: SWELL WAVE & BAROMETER */}
              <View
                style={[
                  styles.fullTelemCard,
                  {
                    backgroundColor: isLight ? '#FFFFFF' : 'rgba(15, 39, 66, 0.65)',
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Text style={[styles.fullTelemLabel, { color: colors.textMuted }]}>WAVE SWELL</Text>
                <Text style={[styles.fullTelemVal, { color: colors.text }]}>
                  {conditions?.waveHeightM ? `${conditions.waveHeightM.toFixed(1)}m` : '1.2m'}
                </Text>
                <Text style={[styles.fullTelemSub, { color: colors.textMuted }]}>
                  Period {conditions?.wavePeriodS ? `${conditions.wavePeriodS.toFixed(0)}s` : '7s'} • Swell
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
                <Text style={[styles.fullTelemLabel, { color: colors.textMuted }]}>BAROMETER & TEMP</Text>
                <Text style={[styles.fullTelemVal, { color: colors.text }]}>
                  {conditions?.surfacePressureHpa ?? 1012}{' '}
                  <Text style={[styles.fullTelemUnit, { color: colors.accent }]}>hPa</Text>
                </Text>
                <Text style={[styles.fullTelemSub, { color: colors.textMuted }]}>
                  Sea {conditions?.seaTempC ? `${conditions.seaTempC.toFixed(1)}°C` : '28.2°C'} • Steady
                </Text>
              </View>
            </View>
          </ScrollView>

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
                  {isPaused ? `REC ${t('btn.pause', 'PAUSED')} • ${t('btn.resume', 'RESUME')}` : `REC ${formatTime(elapsedSeconds)} • ${t('btn.stop', 'STOP')}`}
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
                <Text style={[styles.startRecordText, { color: colors.accent }]}>{t('hud.record_trip', 'RECORD TRIP')}</Text>
              </Pressable>
            )}

            {/* Red End Navigation Button */}
            <Pressable style={styles.fullExitBtn} onPress={exitNavigation}>
              <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
              <Text style={styles.fullExitText}>{t('hud.exit_nav', 'END NAVIGATION')}</Text>
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
              size={SCREEN_WIDTH < 380 ? 60 : 70}
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
                {getLocalizedSteer(steeringInstruction)}
              </Text>
            </View>
            <Text style={styles.secondarySub} numberOfLines={1}>
              {targetSpot
                ? `${t('cockpit.navigating_to', 'TO')}: ${targetSpot.name} ${targetSpot.depthM ? `(${targetSpot.depthM}m)` : ''}`
                : `${t('hud.free_nav', 'Navigating Course')} • ${String(userCompassHeading)}°`}
            </Text>
          </Pressable>

          {/* Recenter / Heading Button */}
          <Pressable
            style={[styles.miniHeaderBtn, headingUp && styles.miniHeaderBtnActive]}
            onPress={() => setShowFullCompass(true)}
            hitSlop={8}
          >
            <Ionicons name="expand-outline" size={20} color="#00F0FF" />
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
              <Text style={styles.recText} numberOfLines={1}>
                {isPaused ? 'PAUSED' : `REC ${formatTime(elapsedSeconds)}`}
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
              <Text style={[styles.startRecordText, { color: colors.accent }]}>
                {SCREEN_WIDTH < 390 ? 'REC' : 'RECORD TRIP'}
              </Text>
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

      {/* Target Waypoint Selection Modal */}
      <TargetWaypointPickerModal
        visible={showTargetPicker}
        onClose={() => setShowTargetPicker(false)}
      />
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
    marginHorizontal: 10,
  },
  topGreenCard: {
    backgroundColor: '#043427', // Google Maps dark green navigation bar
    borderRadius: 18,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#10B981',
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    gap: 8,
  },
  compassDialWrap: {
    borderRadius: 35,
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
    gap: 5,
  },
  primaryInstruction: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
    flex: 1,
  },
  expandCompassIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondarySub: {
    color: '#A7F3D0',
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 1,
    flexShrink: 1,
  },
  miniHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  fullCompassHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.2)',
  },
  fullCompassPreTitle: {
    color: '#38BDF8',
    fontSize: 10.5,
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
    paddingVertical: 10,
  },
  fullSteerBlock: {
    alignItems: 'center',
    marginTop: 10,
  },
  fullHeadingReadout: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  fullHeadingCardinal: {
    color: '#38BDF8',
    fontSize: 26,
    fontWeight: '900',
  },
  fullSteerBadge: {
    paddingHorizontal: 16,
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
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  fullTelemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    width: '100%',
    marginTop: 10,
  },
  fullTelemCard: {
    flex: 1,
    minWidth: '48%',
    maxWidth: '49.5%',
    backgroundColor: 'rgba(15, 39, 66, 0.65)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    justifyContent: 'space-between',
  },
  fullTelemLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  fullTelemVal: {
    fontSize: 23,
    fontWeight: '900',
    marginTop: 3,
    letterSpacing: -0.3,
  },
  fullTelemValCoord: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: -0.3,
  },
  fullTelemUnit: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  fullTelemSub: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    width: '100%',
  },
  gpsMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  gpsMiniDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10B981',
  },
  gpsMiniText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800',
  },
  targetActiveMiniBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  targetActiveMiniText: {
    color: '#38BDF8',
    fontSize: 9,
    fontWeight: '800',
  },
  targetSetMiniBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  targetSetMiniText: {
    color: '#EAB308',
    fontSize: 9,
    fontWeight: '800',
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
    paddingHorizontal: 4,
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

  fullCompassScroll: {
    flex: 1,
  },
  fullCompassScrollContent: {
    paddingBottom: 20,
  },

  // Bottom Google Maps Style Bar
  bottomCockpitWrap: {
    marginHorizontal: 10,
  },
  bottomCockpitCard: {
    backgroundColor: '#0B1C2D',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statMainGreen: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  statMainWhite: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  unitText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#93C5FD',
  },
  statSubLabel: {
    color: '#64748B',
    fontSize: 8.5,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  vertDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 2,
  },
  actionButtonsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 4,
  },
  pauseCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  redEndTripBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DC2626', // Google Maps vibrant red stop circle
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
});

