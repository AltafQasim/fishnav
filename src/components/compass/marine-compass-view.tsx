import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
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
  Path,
  Polygon,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { MapColors } from '@/constants/map-theme';
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

export function MarineCompassView() {
  const { location, heading: hookHeading } = useUserLocation();
  const { activeNavigationTarget } = useWaypoints();

  const [currentHeading, setCurrentHeading] = useState<number>(hookHeading ?? 0);
  const [headingAccuracy, setHeadingAccuracy] = useState<number | null>(null);

  // Animated rotation value
  const rotationAnim = useRef(new Animated.Value(0)).current;

  // Real-time sensor heading subscription
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    const startHeadingWatch = async () => {
      try {
        const { granted } = await Location.getForegroundPermissionsAsync();
        if (!granted) {
          await Location.requestForegroundPermissionsAsync();
        }

        sub = await Location.watchHeadingAsync((data) => {
          const val = data.trueHeading >= 0 ? data.trueHeading : data.magHeading;
          if (Number.isFinite(val)) {
            setCurrentHeading(Math.round(val));
            setHeadingAccuracy(data.accuracy ?? null);
          }
        });
      } catch (e) {
        // Fallback or sensor not available
      }
    };

    void startHeadingWatch();

    return () => {
      sub?.remove();
    };
  }, []);

  // Update animated value whenever heading changes
  useEffect(() => {
    Animated.spring(rotationAnim, {
      toValue: -currentHeading,
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
        <View style={styles.steerBanner}>
          <View style={styles.steerIconWrap}>
            <Ionicons name="navigate" size={20} color="#38BDF8" style={{ transform: [{ rotate: `${relativeSteerAngle ?? 0}deg` }] }} />
          </View>
          <View style={styles.steerInfo}>
            <Text style={styles.steerTitle}>STEER TO: {activeNavigationTarget.name}</Text>
            <Text style={styles.steerSub}>
              Bearing {formatBearing(targetBearing)} • {formatNm(targetDistNm)} • ETA {etaFromNm(targetDistNm, 12)}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Main Digital Heading HUD */}
      <View style={styles.headingHud}>
        <Text style={styles.headingDeg}>{String(currentHeading).padStart(3, '0')}°</Text>
        <Text style={styles.headingCardinal}>{getCardinalText(currentHeading)}</Text>
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
                  inputRange: [-360, 0, 360],
                  outputRange: ['-360deg', '0deg', '360deg'],
                }),
              },
            ],
          }}
        >
          <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} viewBox={`0 0 ${COMPASS_SIZE} ${COMPASS_SIZE}`}>
            <Defs>
              <LinearGradient id="dialGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#0B233C" />
                <Stop offset="100%" stopColor="#041221" />
              </LinearGradient>
              <LinearGradient id="outerRing" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="rgba(56, 189, 248, 0.4)" />
                <Stop offset="100%" stopColor="rgba(2, 132, 199, 0.1)" />
              </LinearGradient>
            </Defs>

            {/* Dial Background Disc */}
            <Circle cx={RADIUS} cy={RADIUS} r={RADIUS - 4} fill="url(#dialGrad)" stroke="url(#outerRing)" strokeWidth={2.5} />
            <Circle cx={RADIUS} cy={RADIUS} r={RADIUS - 22} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />

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
                  stroke={isMajor ? '#FFFFFF' : 'rgba(255,255,255,0.35)'}
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
                  fill={MapColors.textSecondary}
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
            <SvgText x={RADIUS} y={COMPASS_SIZE - 26} fill="#FFFFFF" fontSize={16} fontWeight="800" textAnchor="middle">
              S
            </SvgText>
            {/* East */}
            <SvgText x={COMPASS_SIZE - 30} y={RADIUS + 6} fill="#FFFFFF" fontSize={16} fontWeight="800" textAnchor="middle">
              E
            </SvgText>
            {/* West */}
            <SvgText x={30} y={RADIUS + 6} fill="#FFFFFF" fontSize={16} fontWeight="800" textAnchor="middle">
              W
            </SvgText>

            {/* Center Rose Star */}
            <Polygon
              points={`${RADIUS},${RADIUS - 38} ${RADIUS + 8},${RADIUS - 10} ${RADIUS + 38},${RADIUS} ${RADIUS + 10},${RADIUS + 8} ${RADIUS},${RADIUS + 38} ${RADIUS - 8},${RADIUS + 10} ${RADIUS - 38},${RADIUS} ${RADIUS - 10},${RADIUS - 8}`}
              fill="rgba(56, 189, 248, 0.15)"
              stroke="#38BDF8"
              strokeWidth={1}
            />

            {/* Center Pivot Point */}
            <Circle cx={RADIUS} cy={RADIUS} r={8} fill="#0284C7" stroke="#FFFFFF" strokeWidth={2} />
          </Svg>
        </Animated.View>
      </View>

      {/* Marine Telemetry Row (SOG, COG, Lat, Lng) */}
      <View style={styles.telemetryGrid}>
        <View style={styles.telemetryCard}>
          <Text style={styles.telemLabel}>SPEED (SOG)</Text>
          <Text style={styles.telemVal}>{speedKnots} <Text style={styles.telemUnit}>kts</Text></Text>
        </View>

        <View style={styles.telemetryCard}>
          <Text style={styles.telemLabel}>COURSE (COG)</Text>
          <Text style={styles.telemVal}>{location?.heading != null ? `${Math.round(location.heading)}°` : `${currentHeading}°`}</Text>
        </View>

        <View style={styles.telemetryCard}>
          <Text style={styles.telemLabel}>LATITUDE</Text>
          <Text style={styles.telemValSmall}>{location ? formatLatitude(location.latitude) : '20° 21\' 00" N'}</Text>
        </View>

        <View style={styles.telemetryCard}>
          <Text style={styles.telemLabel}>LONGITUDE</Text>
          <Text style={styles.telemValSmall}>{location ? formatLongitude(location.longitude) : '70° 52\' 41" E'}</Text>
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
    backgroundColor: MapColors.navyPanel,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  telemLabel: {
    color: MapColors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  telemVal: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  telemUnit: {
    fontSize: 12,
    color: MapColors.textSecondary,
    fontWeight: '600',
  },
  telemValSmall: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
});
