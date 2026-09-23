import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Polygon,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { MapColors } from '@/constants/map-theme';
import { useLanguage } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';
import { useWaypoints } from '@/context/waypoints-context';
import { useMarineWeather } from '@/hooks/use-marine-weather';
import { formatLatitude, formatLongitude, useUserLocation } from '@/hooks/use-user-location';
import { getMoonPhaseDetails } from '@/utils/astronomy';
import { bearingDegrees, distanceNm, etaFromNm, formatBearing, formatNm } from '@/utils/geo';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COMPASS_SIZE = Math.min(SCREEN_WIDTH - 64, 300);
const RADIUS = COMPASS_SIZE / 2;

function getCardinalText(deg: number): string {
  const cardinals = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((deg % 360) + 360) % 360 / 22.5) % 16;
  return cardinals[index] || 'N';
}

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

export type MarineCompassViewProps = {
  northMode?: 'magnetic' | 'true';
  onOpenTargetPicker?: () => void;
};

export function MarineCompassView({ northMode = 'magnetic', onOpenTargetPicker }: MarineCompassViewProps) {
  const { colors, isLight } = useAppTheme();
  const { t } = useLanguage();
  const { location, heading, magHeading, trueHeading, headingAccuracy } = useUserLocation();
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

  // Pick current heading according to mode, falling back gracefully
  const currentHeading =
    (northMode === 'true' && trueHeading != null ? trueHeading : magHeading) ??
    heading ??
    (location?.heading != null && Number.isFinite(location.heading) ? Math.round(location.heading) : 0);

  // 1. Animated rotation value with continuous angle unwrapping (prevents 360° reverse spin at North)
  const prevHeadingRef = useRef<number | null>(null);
  const continuousAngleRef = useRef<number>(0);
  const rotationAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (prevHeadingRef.current === null) {
      prevHeadingRef.current = currentHeading;
      continuousAngleRef.current = currentHeading;
      rotationAnim.setValue(-currentHeading);
      return;
    }

    let diff = currentHeading - prevHeadingRef.current;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;

    // Table deadband filter: Ignore micro-fluctuations under 0.8 degrees
    if (Math.abs(diff) < 0.8) {
      return;
    }

    continuousAngleRef.current += diff;
    prevHeadingRef.current = currentHeading;

    Animated.timing(rotationAnim, {
      toValue: -continuousAngleRef.current,
      duration: 160,
      easing: Easing.out(Easing.quad),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [currentHeading, rotationAnim]);

  // Target waypoint navigation stats
  const targetBearing = activeNavigationTarget && location
    ? bearingDegrees(location.latitude, location.longitude, activeNavigationTarget.latitude, activeNavigationTarget.longitude)
    : null;

  const targetDistNm = activeNavigationTarget && location
    ? distanceNm(location.latitude, location.longitude, activeNavigationTarget.latitude, activeNavigationTarget.longitude)
    : null;

  // Relative angle to steer toward waypoint (-180° to +180° from bow)
  const steerAngle =
    targetBearing != null
      ? ((targetBearing - currentHeading + 540) % 360) - 180
      : null;

  const isOnCourse = steerAngle != null && Math.abs(steerAngle) <= 6;
  const arrowColor = isOnCourse ? '#10B981' : isLight ? '#0284C7' : '#00F0FF';
  const arrowGlow = isOnCourse
    ? 'rgba(16, 185, 129, 0.45)'
    : isLight
    ? 'rgba(2, 132, 199, 0.35)'
    : 'rgba(0, 240, 255, 0.45)';

  // 2. Continuous angle unwrapping for destination steer arrow
  const prevSteerRef = useRef<number | null>(null);
  const continuousSteerRef = useRef<number>(0);
  const arrowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (steerAngle == null) return;
    if (prevSteerRef.current === null) {
      prevSteerRef.current = steerAngle;
      continuousSteerRef.current = steerAngle;
      arrowAnim.setValue(steerAngle);
      return;
    }

    let diff = steerAngle - prevSteerRef.current;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;

    continuousSteerRef.current += diff;
    prevSteerRef.current = steerAngle;

    Animated.timing(arrowAnim, {
      toValue: continuousSteerRef.current,
      duration: 160,
      easing: Easing.out(Easing.quad),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [steerAngle, arrowAnim]);

  // Speed in knots
  const speedKnotsNum = location?.speed != null && location.speed > 0 ? location.speed * 1.94384 : 0;
  const speedKnots = speedKnotsNum.toFixed(1);

  return (
    <View style={styles.container}>
      {/* Target Waypoint Steer Banner if navigating */}
      {activeNavigationTarget && targetBearing != null && targetDistNm != null ? (
        <View
          style={[
            styles.steerBanner,
            {
              backgroundColor: isLight ? '#F0FDF4' : 'rgba(56, 189, 248, 0.12)',
              borderColor: isLight ? '#BBF7D0' : 'rgba(56, 189, 248, 0.3)',
            },
          ]}
        >
          <View
            style={[
              styles.steerIconWrap,
              { backgroundColor: isOnCourse ? 'rgba(34, 197, 94, 0.2)' : isLight ? '#DCFCE7' : 'rgba(56, 189, 248, 0.2)' },
            ]}
          >
            <Ionicons
              name={isOnCourse ? 'checkmark-circle' : 'navigate'}
              size={20}
              color={isOnCourse ? '#22C55E' : isLight ? '#166534' : '#38BDF8'}
              style={isOnCourse ? undefined : { transform: [{ rotate: `${steerAngle ?? 0}deg` }] }}
            />
          </View>
          <View style={styles.steerInfo}>
            <View style={styles.steerTitleRow}>
              <Text style={[styles.steerTitle, { color: isLight ? '#166534' : '#38BDF8' }]} numberOfLines={1}>
                TARGET: {activeNavigationTarget.name}
              </Text>
              <View
                style={[
                  styles.coursePill,
                  { backgroundColor: isOnCourse ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)' },
                ]}
              >
                <Text style={[styles.coursePillText, { color: isOnCourse ? '#22C55E' : '#EAB308' }]}>
                  {isOnCourse
                    ? 'ON COURSE'
                    : (steerAngle ?? 0) > 0
                    ? `STEER RIGHT ${Math.round(steerAngle ?? 0)}°`
                    : `STEER LEFT ${Math.round(Math.abs(steerAngle ?? 0))}°`}
                </Text>
              </View>
            </View>
            <Text style={[styles.steerSub, { color: isLight ? '#15803D' : colors.textSecondary }]}>
              Bearing {formatBearing(targetBearing)} • {formatNm(targetDistNm)} • ETA {etaFromNm(targetDistNm, speedKnotsNum > 2 ? speedKnotsNum : 8)}
            </Text>
          </View>
          <View style={styles.steerActions}>
            {onOpenTargetPicker && (
              <Pressable
                onPress={onOpenTargetPicker}
                style={[styles.steerSmallBtn, { backgroundColor: colors.chipBg, borderColor: colors.chipBorder }]}
                hitSlop={8}
              >
                <Ionicons name="swap-horizontal" size={13} color={colors.accent} style={{ marginRight: 2 }} />
                <Text style={[styles.steerSmallBtnText, { color: colors.accent }]}>Change</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => setActiveNavigationTarget(null)}
              style={[
                styles.steerSmallBtn,
                { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' },
              ]}
              hitSlop={8}
            >
              <Ionicons name="close" size={14} color="#EF4444" />
            </Pressable>
          </View>
        </View>
      ) : onOpenTargetPicker ? (
        <Pressable
          onPress={onOpenTargetPicker}
          style={[
            styles.noTargetBanner,
            {
              backgroundColor: isLight ? '#F8FAFC' : 'rgba(15, 23, 42, 0.65)',
              borderColor: isLight ? '#E2E8F0' : 'rgba(56, 189, 248, 0.25)',
            },
          ]}
        >
          <View style={styles.noTargetLeft}>
            <View
              style={[
                styles.targetIconPill,
                { backgroundColor: isLight ? '#E0F2FE' : 'rgba(56, 189, 248, 0.15)' },
              ]}
            >
              <Ionicons name="flag-outline" size={18} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.noTargetTitle, { color: colors.text }]}>No Target Waypoint</Text>
              <Text style={[styles.noTargetSub, { color: colors.textMuted }]}>
                Tap to select a waypoint & activate steer pointer
              </Text>
            </View>
          </View>
          <View style={[styles.setTargetBtn, { backgroundColor: colors.accent }]}>
            <Ionicons name="navigate" size={13} color="#001428" style={{ marginRight: 4 }} />
            <Text style={styles.setTargetBtnText}>Set Target</Text>
          </View>
        </Pressable>
      ) : null}

      {/* Main Digital Heading HUD */}
      <View style={styles.headingHud}>
        <Text style={[styles.headingDeg, { color: colors.text }]}>{String(currentHeading).padStart(3, '0')}°</Text>
        <Text style={[styles.headingCardinal, { color: colors.accent }]}>{getCardinalText(currentHeading)}</Text>
      </View>

      {/* Rotating SVG Compass Rose with Navigation Steer Arrow */}
      <View style={[styles.compassWrapper, { width: COMPASS_SIZE, height: COMPASS_SIZE }]}>
        {/* Animated Rotating Compass Dial */}
        <Animated.View
          style={{
            width: COMPASS_SIZE,
            height: COMPASS_SIZE,
            transform: [
              {
                rotate: rotationAnim.interpolate({
                  inputRange: [-360000, 360000],
                  outputRange: ['-360000deg', '360000deg'],
                }),
              },
            ],
          }}
        >
          <Svg
            key={`compass-dial-svg-${isLight ? 'light' : 'dark'}`}
            width={COMPASS_SIZE}
            height={COMPASS_SIZE}
            viewBox={`0 0 ${COMPASS_SIZE} ${COMPASS_SIZE}`}
          >
            <Defs>
              <LinearGradient id={isLight ? 'dialGrad_light' : 'dialGrad_dark'} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={isLight ? '#F8FAFC' : '#0B233C'} />
                <Stop offset="100%" stopColor={isLight ? '#E2E8F0' : '#041221'} />
              </LinearGradient>
              <LinearGradient id={isLight ? 'outerRing_light' : 'outerRing_dark'} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor={colors.accent} stopOpacity={isLight ? 0.8 : 0.4} />
                <Stop offset="100%" stopColor={isLight ? '#0284C7' : 'rgba(2, 132, 199, 0.1)'} stopOpacity={isLight ? 0.4 : 0.1} />
              </LinearGradient>
            </Defs>

            {/* Dial Background Disc */}
            <Circle
              cx={RADIUS}
              cy={RADIUS}
              r={RADIUS - 4}
              fill={`url(#${isLight ? 'dialGrad_light' : 'dialGrad_dark'})`}
              stroke={`url(#${isLight ? 'outerRing_light' : 'outerRing_dark'})`}
              strokeWidth={2.5}
            />
            <Circle
              cx={RADIUS}
              cy={RADIUS}
              r={RADIUS - 22}
              fill="none"
              stroke={isLight ? '#CBD5E1' : 'rgba(255,255,255,0.08)'}
              strokeWidth={1}
            />

            {/* 360 Degree Ticks */}
            {Array.from({ length: 72 }).map((_, i) => {
              const deg = i * 5;
              const isMajor = deg % 30 === 0;
              const isMedium = deg % 15 === 0;
              const tickLength = isMajor ? 14 : isMedium ? 9 : 5;
              const rad = (deg * Math.PI) / 180;
              const x1 = RADIUS + (RADIUS - 24) * Math.sin(rad);
              const y1 = RADIUS - (RADIUS - 24) * Math.cos(rad);
              const x2 = RADIUS + (RADIUS - 24 - tickLength) * Math.sin(rad);
              const y2 = RADIUS - (RADIUS - 24 - tickLength) * Math.cos(rad);

              return (
                <Line
                  key={`tick-${deg}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isMajor ? (isLight ? '#0F172A' : '#FFFFFF') : (isLight ? '#94A3B8' : 'rgba(255,255,255,0.35)')}
                  strokeWidth={isMajor ? 2 : 1}
                />
              );
            })}

            {/* Degree Numbers every 30 degrees */}
            {[30, 60, 120, 150, 210, 240, 300, 330].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const x = RADIUS + (RADIUS - 44) * Math.sin(rad);
              const y = RADIUS - (RADIUS - 44) * Math.cos(rad) + 4;
              return (
                <SvgText
                  key={`deg-${deg}`}
                  x={x}
                  y={y}
                  fill={colors.textSecondary}
                  fontSize={10}
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {deg}
                </SvgText>
              );
            })}

            {/* Cardinal Points */}
            <SvgText x={RADIUS} y={38} fill="#EF4444" fontSize={18} fontWeight="900" textAnchor="middle">
              N
            </SvgText>
            <SvgText x={RADIUS} y={COMPASS_SIZE - 26} fill={isLight ? '#0F172A' : '#FFFFFF'} fontSize={16} fontWeight="800" textAnchor="middle">
              S
            </SvgText>
            <SvgText x={COMPASS_SIZE - 30} y={RADIUS + 6} fill={isLight ? '#0F172A' : '#FFFFFF'} fontSize={16} fontWeight="800" textAnchor="middle">
              E
            </SvgText>
            <SvgText x={30} y={RADIUS + 6} fill={isLight ? '#0F172A' : '#FFFFFF'} fontSize={16} fontWeight="800" textAnchor="middle">
              W
            </SvgText>

            {/* Center Rose Star */}
            <Polygon
              points={`${RADIUS},${RADIUS - 38} ${RADIUS + 8},${RADIUS - 10} ${RADIUS + 38},${RADIUS} ${RADIUS + 10},${RADIUS + 8} ${RADIUS},${RADIUS + 38} ${RADIUS - 8},${RADIUS + 10} ${RADIUS - 38},${RADIUS} ${RADIUS - 10},${RADIUS - 8}`}
              fill={colors.chipBg}
              stroke={colors.accent}
              strokeWidth={1}
            />
          </Svg>
        </Animated.View>

        {/* 🎯 AUTHENTIC NAVIGATION STEERING ARROW (Exact arrow from NavigationCockpit) */}
        {targetBearing != null && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                width: COMPASS_SIZE,
                height: COMPASS_SIZE,
                transform: [
                  {
                    rotate: arrowAnim.interpolate({
                      inputRange: [-360000, 360000],
                      outputRange: ['-360000deg', '360000deg'],
                    }),
                  },
                ],
              },
            ]}
            pointerEvents="none"
          >
            <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} viewBox={`0 0 ${COMPASS_SIZE} ${COMPASS_SIZE}`}>
              <Defs>
                <LinearGradient id="compassNavArrowGrad" x1="0" y1="1" x2="0" y2="0">
                  <Stop offset="0%" stopColor={arrowGlow} />
                  <Stop offset="100%" stopColor={arrowColor} />
                </LinearGradient>
              </Defs>

              <G>
                {/* Outer glowing target chevron / pointer head at dial edge */}
                <Polygon
                  points={`
                    ${RADIUS},${RADIUS * 0.08}
                    ${RADIUS + Math.max(7, COMPASS_SIZE * 0.065)},${RADIUS * 0.32}
                    ${RADIUS},${RADIUS * 0.24}
                    ${RADIUS - Math.max(7, COMPASS_SIZE * 0.065)},${RADIUS * 0.32}
                  `}
                  fill="url(#compassNavArrowGrad)"
                  stroke="#FFFFFF"
                  strokeWidth={1.4}
                />

                {/* Needle Line towards center */}
                <Line
                  x1={RADIUS}
                  y1={RADIUS * 0.24}
                  x2={RADIUS}
                  y2={RADIUS * 0.72}
                  stroke={arrowColor}
                  strokeWidth={Math.max(2, COMPASS_SIZE * 0.02)}
                  strokeDasharray="4 2"
                  opacity={0.88}
                />

                {/* Target Dot Beacon on perimeter */}
                <Circle
                  cx={RADIUS}
                  cy={RADIUS * 0.06}
                  r={Math.max(3.5, COMPASS_SIZE * 0.03)}
                  fill={arrowColor}
                  stroke="#FFFFFF"
                  strokeWidth={1}
                />
              </G>
            </Svg>
          </Animated.View>
        )}

        {/* Top fixed reference lubber line (Orange/Red arrow pointing forward to bow) */}
        <View style={styles.lubberLine} pointerEvents="none">
          <View style={styles.lubberArrow} />
        </View>

        {/* Center Pivot Point Overlay */}
        <View
          style={[
            styles.centerCap,
            {
              backgroundColor: isLight ? '#FFFFFF' : '#0B233C',
              borderColor: colors.accent,
            },
          ]}
          pointerEvents="none"
        >
          <View style={[styles.centerCapDot, { backgroundColor: colors.accent }]} />
        </View>
      </View>

      {/* 🧭 UNIFIED MARINE TELEMETRY INSTRUMENT GRID (Identical card design across all metrics) */}
      <View style={styles.telemetryGrid}>
        {/* ROW 1: SOG & COG */}
        <View style={[styles.telemetryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.telemLabel, { color: colors.textMuted }]}>SPEED (SOG)</Text>
          <Text style={[styles.telemVal, { color: colors.text }]}>
            {speedKnots} <Text style={[styles.telemUnit, { color: colors.accent }]}>kts</Text>
          </Text>
          <Text style={[styles.telemSub, { color: colors.textMuted }]}>Speed Over Ground</Text>
        </View>

        <View style={[styles.telemetryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.telemLabel, { color: colors.textMuted }]}>COURSE (COG)</Text>
          <Text style={[styles.telemVal, { color: colors.text }]}>
            {location?.heading != null && Number.isFinite(location.heading) ? `${Math.round(location.heading)}°` : `${currentHeading}°`}
          </Text>
          <Text style={[styles.telemSub, { color: colors.textMuted }]}>{getCardinalText(currentHeading)} • Heading</Text>
        </View>

        {/* ROW 2: CURRENT POSITION & TARGET POSITION (Latitude & Longitude combined in one card) */}
        <View style={[styles.telemetryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.telemLabel, { color: colors.textMuted }]}>CURRENT POSITION</Text>
            <View style={[styles.gpsMiniPill, isLight && { backgroundColor: '#DCFCE7' }]}>
              <View style={styles.gpsMiniDot} />
              <Text style={[styles.gpsMiniText, isLight && { color: '#16A34A' }]}>3D GPS</Text>
            </View>
          </View>
          <Text style={[styles.telemValCoord, { color: colors.text }]}>
            {location ? formatLatitude(location.latitude) : '22° 26\' 40" N'}
          </Text>
          <Text style={[styles.telemValCoord, { color: colors.text }]}>
            {location ? formatLongitude(location.longitude) : '070° 52\' 41" E'}
          </Text>
          <Text style={[styles.telemSub, { color: colors.accent }]}>
            {location ? `${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°` : '22.4444°, 70.8780°'}
          </Text>
        </View>

        <Pressable
          onPress={onOpenTargetPicker}
          style={[
            styles.telemetryCard,
            {
              backgroundColor: colors.card,
              borderColor: activeNavigationTarget ? colors.accent : colors.cardBorder,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Target Position"
        >
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.telemLabel, { color: activeNavigationTarget ? colors.accent : colors.textMuted }]}>
              TARGET POSITION
            </Text>
            {activeNavigationTarget ? (
              <View style={styles.targetActiveMiniBadge}>
                <Text style={styles.targetActiveMiniText}>LOCKED</Text>
              </View>
            ) : (
              <View style={styles.targetSetMiniBadge}>
                <Text style={styles.targetSetMiniText}>SET 🎯</Text>
              </View>
            )}
          </View>
          {activeNavigationTarget ? (
            <>
              <Text style={[styles.telemValCoord, { color: colors.text }]}>
                {formatLatitude(activeNavigationTarget.latitude)}
              </Text>
              <Text style={[styles.telemValCoord, { color: colors.text }]}>
                {formatLongitude(activeNavigationTarget.longitude)}
              </Text>
              <Text style={[styles.telemSub, { color: colors.accent }]} numberOfLines={1}>
                {activeNavigationTarget.name} {targetDistNm != null ? `• ${formatNm(targetDistNm)}` : ''}
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.telemValCoord, { color: colors.textMuted }]}>
                --° --' --" N
              </Text>
              <Text style={[styles.telemValCoord, { color: colors.textMuted }]}>
                ---° --' --" E
              </Text>
              <Text style={[styles.telemSub, { color: colors.textMuted }]}>
                Initial Blank • Tap to Set 🎯
              </Text>
            </>
          )}
        </Pressable>

        {/* ROW 3: HIGH TIDE & LOW TIDE */}
        <View style={[styles.telemetryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.telemLabel, { color: colors.textMuted }]}>NEXT HIGH TIDE</Text>
          <Text style={[styles.telemVal, { color: '#22C55E' }]}>
            {tides?.nextHighTide?.time || '14:30'}{' '}
            <Text style={[styles.telemUnit, { color: '#22C55E' }]}>
              {tides?.nextHighTide?.heightM ? `${tides.nextHighTide.heightM.toFixed(1)}m` : '3.8m'}
            </Text>
          </Text>
          <Text style={[styles.telemSub, { color: isTideRising ? '#22C55E' : colors.textMuted }]}>
            {tides?.nextHighTide?.relativeText || 'In ~2h'} {isTideRising ? '• Rising ↗' : ''}
          </Text>
        </View>

        <View style={[styles.telemetryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.telemLabel, { color: colors.textMuted }]}>NEXT LOW TIDE</Text>
          <Text style={[styles.telemVal, { color: '#EAB308' }]}>
            {tides?.nextLowTide?.time || '20:45'}{' '}
            <Text style={[styles.telemUnit, { color: '#EAB308' }]}>
              {tides?.nextLowTide?.heightM ? `${tides.nextLowTide.heightM.toFixed(1)}m` : '0.9m'}
            </Text>
          </Text>
          <Text style={[styles.telemSub, { color: colors.textMuted }]}>
            {tides?.nextLowTide?.relativeText || 'In ~8h'} • Depth {tides?.currentHeightM ? `${tides.currentHeightM.toFixed(1)}m` : '2.4m'}
          </Text>
        </View>

        {/* ROW 4: MOON & TIDAL CYCLE */}
        <View style={[styles.telemetryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.telemLabel, { color: colors.textMuted }]}>MOON ILLUMINATION</Text>
          <Text style={[styles.telemVal, { color: '#C084FC' }]}>
            {moonInfo.illumination}% <Text style={[styles.telemUnit, { color: '#C084FC' }]}>{getMoonIcon(moonInfo.phase)}</Text>
          </Text>
          <Text style={[styles.telemSub, { color: colors.textMuted }]} numberOfLines={1}>
            {moonInfo.phaseNameEn}
          </Text>
        </View>

        <View style={[styles.telemetryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.telemLabel, { color: colors.textMuted }]}>TIDAL CYCLE</Text>
          <Text style={[styles.telemVal, { color: colors.text }]}>
            {moonInfo.tideType === 'spring' ? 'Spring Tide' : 'Neap Tide'}
          </Text>
          <Text style={[styles.telemSub, { color: colors.textMuted }]}>
            Age {moonInfo.moonAgeDays}d • {moonInfo.tideType === 'spring' ? 'High Current' : 'Gentle Sea'}
          </Text>
        </View>

        {/* ROW 5: WIND SPEED & GUSTS */}
        <View style={[styles.telemetryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.telemLabel, { color: colors.textMuted }]}>WIND SPEED</Text>
          <Text style={[styles.telemVal, { color: colors.text }]}>
            {conditions?.windSpeedKnots ?? 14} <Text style={[styles.telemUnit, { color: colors.accent }]}>kts</Text>
          </Text>
          <Text style={[styles.telemSub, { color: colors.textMuted }]}>
            {conditions?.windDirectionText || 'WNW'} ({conditions?.windDirectionDeg ?? 290}°) • {conditions?.windBeaufort || 'Force 4'}
          </Text>
        </View>

        <View style={[styles.telemetryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.telemLabel, { color: colors.textMuted }]}>WIND GUSTS</Text>
          <Text style={[styles.telemVal, { color: '#F97316' }]}>
            {conditions?.windGustsKnots ?? 21} <Text style={[styles.telemUnit, { color: '#F97316' }]}>kts</Text>
          </Text>
          <Text style={[styles.telemSub, { color: colors.textMuted }]}>Peak Offshore Gusts</Text>
        </View>

        {/* ROW 6: SWELL WAVE & BAROMETER */}
        <View style={[styles.telemetryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.telemLabel, { color: colors.textMuted }]}>WAVE SWELL</Text>
          <Text style={[styles.telemVal, { color: colors.text }]}>
            {conditions?.waveHeightM ? `${conditions.waveHeightM.toFixed(1)}m` : '1.2m'}
          </Text>
          <Text style={[styles.telemSub, { color: colors.textMuted }]}>
            Period {conditions?.wavePeriodS ? `${conditions.wavePeriodS.toFixed(0)}s` : '7s'} • Swell
          </Text>
        </View>

        <View style={[styles.telemetryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.telemLabel, { color: colors.textMuted }]}>BAROMETER & TEMP</Text>
          <Text style={[styles.telemVal, { color: colors.text }]}>
            {conditions?.surfacePressureHpa ?? 1012} <Text style={[styles.telemUnit, { color: colors.accent }]}>hPa</Text>
          </Text>
          <Text style={[styles.telemSub, { color: colors.textMuted }]}>
            Sea {conditions?.seaTempC ? `${conditions.seaTempC.toFixed(1)}°C` : '28.2°C'} • Steady
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  steerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    width: '100%',
  },
  steerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  steerInfo: {
    flex: 1,
  },
  steerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  steerTitle: {
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  coursePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  coursePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  steerSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  steerActions: {
    flexDirection: 'column',
    gap: 4,
  },
  steerSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  steerSmallBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  noTargetBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    width: '100%',
  },
  noTargetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  targetIconPill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noTargetTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  noTargetSub: {
    fontSize: 10.5,
    marginTop: 1,
  },
  setTargetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  setTargetBtnText: {
    color: '#001428',
    fontSize: 12,
    fontWeight: '800',
  },
  headingHud: {
    alignItems: 'center',
    marginBottom: 12,
  },
  headingDeg: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
  },
  headingCardinal: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: -4,
  },
  compassWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 6,
  },
  lubberLine: {
    position: 'absolute',
    top: -6,
    alignSelf: 'center',
    zIndex: 10,
  },
  lubberArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#EF4444',
  },
  centerCap: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
  },
  centerCapDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
    width: '100%',
  },
  telemetryCard: {
    flex: 1,
    minWidth: '48%',
    maxWidth: '49.5%',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  telemLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
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
  telemVal: {
    fontSize: 23,
    fontWeight: '900',
    marginTop: 3,
    letterSpacing: -0.3,
  },
  telemValCoord: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: -0.3,
  },
  telemUnit: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  telemSub: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 4,
  },
});
