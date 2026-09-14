import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Polygon,
  Stop,
  Text as SvgText
} from 'react-native-svg';

import { MapColors } from '@/constants/map-theme';
import { useAppTheme } from '@/context/theme-context';
import { useWaypoints } from '@/context/waypoints-context';
import { formatLatitude, formatLongitude, useUserLocation } from '@/hooks/use-user-location';
import { bearingDegrees, distanceNm, etaFromNm, formatBearing, formatNm } from '@/utils/geo';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COMPASS_SIZE = Math.min(SCREEN_WIDTH - 64, 300);
const RADIUS = COMPASS_SIZE / 2;

function getCardinalText(deg: number): string {
  const cardinals = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((deg % 360) + 360) % 360 / 22.5) % 16;
  return cardinals[index] || 'N';
}

export type MarineCompassViewProps = {
  northMode?: 'magnetic' | 'true';
};

export function MarineCompassView({ northMode = 'magnetic' }: MarineCompassViewProps) {
  const { colors, isLight } = useAppTheme();
  const { location, heading, magHeading, trueHeading, headingAccuracy } = useUserLocation();
  const { activeNavigationTarget } = useWaypoints();

  // Pick current heading according to mode, falling back gracefully
  const currentHeading =
    (northMode === 'true' && trueHeading != null ? trueHeading : magHeading) ??
    heading ??
    (location?.heading != null && Number.isFinite(location.heading) ? Math.round(location.heading) : 0);

  // Animated rotation value with continuous angle unwrapping (prevents 360° reverse spin at North)
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
    // Calculate shortest angular path on circle (-180° to 180°)
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;

    continuousAngleRef.current += diff;
    prevHeadingRef.current = currentHeading;

    Animated.spring(rotationAnim, {
      toValue: -continuousAngleRef.current,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [currentHeading, rotationAnim]);

  // Target waypoint navigation stats
  const targetBearing = activeNavigationTarget && location
    ? bearingDegrees(location.latitude, location.longitude, activeNavigationTarget.latitude, activeNavigationTarget.longitude)
    : null;

  const targetDistNm = activeNavigationTarget && location
    ? distanceNm(location.latitude, location.longitude, activeNavigationTarget.latitude, activeNavigationTarget.longitude)
    : null;

  // Relative angle to steer toward waypoint
  const relativeSteerAngle = targetBearing != null ? (targetBearing - currentHeading + 360) % 360 : null;

  // Speed in knots
  const speedKnots = location?.speed != null && location.speed > 0
    ? (location.speed * 1.94384).toFixed(1)
    : '0.0';

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
          ]}>
          <View style={[styles.steerIconWrap, { backgroundColor: isLight ? '#DCFCE7' : 'rgba(56, 189, 248, 0.2)' }]}>
            <Ionicons
              name="navigate"
              size={20}
              color={isLight ? '#166534' : '#38BDF8'}
              style={{ transform: [{ rotate: `${relativeSteerAngle ?? 0}deg` }] }}
            />
          </View>
          <View style={styles.steerInfo}>
            <Text style={[styles.steerTitle, { color: isLight ? '#166534' : '#38BDF8' }]}>
              STEER TO: {activeNavigationTarget.name}
            </Text>
            <Text style={[styles.steerSub, { color: isLight ? '#15803D' : colors.textSecondary }]}>
              Bearing {formatBearing(targetBearing)} • {formatNm(targetDistNm)} • ETA {etaFromNm(targetDistNm, 12)}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Main Digital Heading HUD */}
      <View style={styles.headingHud}>
        <Text style={[styles.headingDeg, { color: colors.text }]}>{String(currentHeading).padStart(3, '0')}°</Text>
        <Text style={[styles.headingCardinal, { color: colors.accent }]}>{getCardinalText(currentHeading)}</Text>
      </View>

      {/* Rotating SVG Compass Rose */}
      <View style={[styles.compassWrapper, { width: COMPASS_SIZE, height: COMPASS_SIZE }]}>
        {/* Top fixed reference lubber line (Orange arrow pointing forward) */}
        <View style={styles.lubberLine} pointerEvents="none">
          <View style={styles.lubberArrow} />
        </View>

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
            {/* North (Red) */}
            <SvgText x={RADIUS} y={38} fill="#EF4444" fontSize={18} fontWeight="900" textAnchor="middle">
              N
            </SvgText>
            {/* South */}
            <SvgText x={RADIUS} y={COMPASS_SIZE - 26} fill={isLight ? '#0F172A' : '#FFFFFF'} fontSize={16} fontWeight="800" textAnchor="middle">
              S
            </SvgText>
            {/* East */}
            <SvgText x={COMPASS_SIZE - 30} y={RADIUS + 6} fill={isLight ? '#0F172A' : '#FFFFFF'} fontSize={16} fontWeight="800" textAnchor="middle">
              E
            </SvgText>
            {/* West */}
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

            {/* Center Pivot Point */}
            <Circle cx={RADIUS} cy={RADIUS} r={8} fill={colors.accent} stroke={isLight ? '#FFFFFF' : '#020B14'} strokeWidth={2} />
          </Svg>
        </Animated.View>
      </View>

      {/* Marine Telemetry Row (SOG, COG, Lat, Lng) */}
      <View style={styles.telemetryGrid}>
        <View style={[styles.telemetryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.telemLabel, { color: colors.textMuted }]}>SPEED (SOG)</Text>
          <Text style={[styles.telemVal, { color: colors.text }]}>
            {speedKnots} <Text style={[styles.telemUnit, { color: colors.accent }]}>kts</Text>
          </Text>
        </View>

        <View style={[styles.telemetryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.telemLabel, { color: colors.textMuted }]}>COURSE (COG)</Text>
          <Text style={[styles.telemVal, { color: colors.text }]}>
            {location?.heading != null ? `${Math.round(location.heading)}°` : `${currentHeading}°`}
          </Text>
        </View>

        <View style={[styles.telemetryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.telemLabel, { color: colors.textMuted }]}>LATITUDE</Text>
          <Text style={[styles.telemValSmall, { color: colors.text }]}>
            {location ? formatLatitude(location.latitude) : '20° 21\' 00" N'}
          </Text>
        </View>

        <View style={[styles.telemetryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.telemLabel, { color: colors.textMuted }]}>LONGITUDE</Text>
          <Text style={[styles.telemValSmall, { color: colors.text }]}>
            {location ? formatLongitude(location.longitude) : '70° 52\' 41" E'}
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
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginBottom: 14,
    width: '92%',
  },
  steerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  steerInfo: {
    flex: 1,
  },
  steerTitle: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '800',
  },
  steerSub: {
    color: MapColors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  headingHud: {
    alignItems: 'center',
    marginBottom: 12,
  },
  headingDeg: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1,
  },
  headingCardinal: {
    color: '#38BDF8',
    fontSize: 16,
    fontWeight: '700',
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
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
    width: '92%',
  },
  telemetryCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  telemLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  telemVal: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  telemUnit: {
    fontSize: 12,
    fontWeight: '600',
  },
  telemValSmall: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
});
