import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
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

export type NavigationCompassRoseProps = {
  size: number;
  heading: number; // Live boat heading in degrees (0-359)
  targetBearing: number | null; // Destination bearing in degrees (0-359) or null
  relativeSteerAngle?: number | null; // Relative steer angle (-180 to +180)
  showDegreeNumbers?: boolean; // Show numbers every 30 deg (for larger sizes)
  showRoseStar?: boolean;
  themeMode?: 'light' | 'dark';
};

/**
 * 🧭 NavigationCompassRose
 * Authentic marine navigation compass dial featuring:
 * 1. 360° Rotating compass rose with cardinal markers (N in bold red, E, S, W)
 * 2. Top bow lubber line marker (direction vessel is pointing)
 * 3. Real-time Destination Bearing Arrow / Pointer (steers to target)
 * 4. Shortest-path continuous angle unwrapping for smooth non-flipping animations
 */
export function NavigationCompassRose({
  size,
  heading,
  targetBearing,
  relativeSteerAngle,
  showDegreeNumbers = false,
  showRoseStar = false,
  themeMode = 'dark',
}: NavigationCompassRoseProps) {
  const radius = size / 2;
  const isLight = themeMode === 'light';

  // Relative steering angle (-180° to +180°)
  // If targetBearing is provided, calculate relative offset to vessel bow
  const steerAngle =
    relativeSteerAngle != null
      ? relativeSteerAngle
      : targetBearing != null
      ? ((targetBearing - heading + 540) % 360) - 180
      : null;

  // 1. Continuous angle unwrapping for rotating compass dial (Course-Up: dial rotates -heading)
  const prevHeadingRef = useRef<number | null>(null);
  const continuousHeadingRef = useRef<number>(0);
  const dialAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (prevHeadingRef.current === null) {
      prevHeadingRef.current = heading;
      continuousHeadingRef.current = heading;
      dialAnim.setValue(-heading);
      return;
    }

    let diff = heading - prevHeadingRef.current;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;

    continuousHeadingRef.current += diff;
    prevHeadingRef.current = heading;

    Animated.spring(dialAnim, {
      toValue: -continuousHeadingRef.current,
      friction: 8,
      tension: 45,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [heading, dialAnim]);

  // 2. Continuous angle unwrapping for destination arrow (relative angle to bow)
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

    Animated.spring(arrowAnim, {
      toValue: continuousSteerRef.current,
      friction: 9,
      tension: 40,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [steerAngle, arrowAnim]);

  const tickCount = 72; // 5 deg ticks
  const tickStep = 360 / tickCount;
  const outerBorderWidth = Math.max(3, size * 0.024);

  // Is vessel on course? (within ±6°)
  const isOnCourse = steerAngle != null && Math.abs(steerAngle) <= 6;
  const arrowColor = isOnCourse ? '#10B981' : isLight ? '#0284C7' : '#00F0FF';
  const arrowGlow = isOnCourse ? 'rgba(16, 185, 129, 0.4)' : isLight ? 'rgba(2, 132, 199, 0.3)' : 'rgba(0, 240, 255, 0.4)';

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* 1. Bezel Instrument Outer Ring */}
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="bezelGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={isLight ? '#FFFFFF' : '#0B233C'} />
            <Stop offset="100%" stopColor={isLight ? '#F1F5F9' : '#031526'} />
          </LinearGradient>
          <LinearGradient id="ringGlow" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={isLight ? 'rgba(2, 132, 199, 0.45)' : 'rgba(0, 240, 255, 0.55)'} />
            <Stop offset="100%" stopColor={isLight ? 'rgba(2, 132, 199, 0.15)' : 'rgba(2, 132, 199, 0.2)'} />
          </LinearGradient>
        </Defs>

        {/* Outer Bezel */}
        <Circle
          cx={radius}
          cy={radius}
          r={radius - outerBorderWidth}
          fill="url(#bezelGrad)"
          stroke="url(#ringGlow)"
          strokeWidth={outerBorderWidth}
        />
        {/* Inner Track Ring */}
        <Circle
          cx={radius}
          cy={radius}
          r={radius * 0.82}
          fill="none"
          stroke={isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255,255,255,0.08)'}
          strokeWidth={1}
        />
      </Svg>

      {/* 2. Rotating 360° Compass Rose Dial */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            width: size,
            height: size,
            transform: [
              {
                rotate: dialAnim.interpolate({
                  inputRange: [-360000, 360000],
                  outputRange: ['-360000deg', '360000deg'],
                }),
              },
            ],
          },
        ]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Degree Ticks */}
          {Array.from({ length: tickCount }).map((_, i) => {
            const deg = i * tickStep;
            const isCardinal = deg % 90 === 0;
            const isMajor = deg % 30 === 0;
            const isMedium = deg % 15 === 0;

            const tickLen = isCardinal
              ? Math.max(8, size * 0.085)
              : isMajor
              ? Math.max(6, size * 0.065)
              : isMedium
              ? Math.max(4, size * 0.045)
              : Math.max(3, size * 0.03);

            const rad = (deg * Math.PI) / 180;
            const rOuter = radius * 0.94;
            const rInner = rOuter - tickLen;

            const x1 = radius + rOuter * Math.sin(rad);
            const y1 = radius - rOuter * Math.cos(rad);
            const x2 = radius + rInner * Math.sin(rad);
            const y2 = radius - rInner * Math.cos(rad);

            const tickStroke = isLight
              ? isCardinal
                ? '#0284C7'
                : isMajor
                ? '#0F172A'
                : isMedium
                ? 'rgba(15, 23, 42, 0.5)'
                : 'rgba(15, 23, 42, 0.25)'
              : isCardinal
              ? '#00F0FF'
              : isMajor
              ? '#FFFFFF'
              : 'rgba(255,255,255,0.32)';

            return (
              <Line
                key={`tick-${deg}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={tickStroke}
                strokeWidth={isCardinal ? 2 : isMajor ? 1.5 : 1}
              />
            );
          })}

          {/* Degree Numbers every 30° (when size allows) */}
          {showDegreeNumbers &&
            [30, 60, 120, 150, 210, 240, 300, 330].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const rNum = radius * 0.72;
              const x = radius + rNum * Math.sin(rad);
              const y = radius - rNum * Math.cos(rad) + 3.5;
              return (
                <SvgText
                  key={`num-${deg}`}
                  x={x}
                  y={y}
                  fill={isLight ? '#64748B' : 'rgba(148, 163, 184, 0.85)'}
                  fontSize={Math.max(9, size * 0.042)}
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {deg}
                </SvgText>
              );
            })}

          {/* Cardinal Letters */}
          {/* North (Bold Red) */}
          <SvgText
            x={radius}
            y={radius * 0.32}
            fill="#EF4444"
            fontSize={Math.max(13, size * 0.12)}
            fontWeight="900"
            textAnchor="middle"
          >
            N
          </SvgText>
          {/* East */}
          <SvgText
            x={radius * 1.7}
            y={radius + Math.max(4, size * 0.04)}
            fill={isLight ? '#0F172A' : '#FFFFFF'}
            fontSize={Math.max(11, size * 0.1)}
            fontWeight="800"
            textAnchor="middle"
          >
            E
          </SvgText>
          {/* South */}
          <SvgText
            x={radius}
            y={radius * 1.8}
            fill={isLight ? '#0F172A' : '#FFFFFF'}
            fontSize={Math.max(11, size * 0.1)}
            fontWeight="800"
            textAnchor="middle"
          >
            S
          </SvgText>
          {/* West */}
          <SvgText
            x={radius * 0.3}
            y={radius + Math.max(4, size * 0.04)}
            fill={isLight ? '#0F172A' : '#FFFFFF'}
            fontSize={Math.max(11, size * 0.1)}
            fontWeight="800"
            textAnchor="middle"
          >
            W
          </SvgText>

          {/* Compass Rose Star in Center (for larger displays) */}
          {showRoseStar && (
            <Polygon
              points={`
                ${radius},${radius - radius * 0.42}
                ${radius + radius * 0.08},${radius - radius * 0.12}
                ${radius + radius * 0.42},${radius}
                ${radius + radius * 0.12},${radius + radius * 0.08}
                ${radius},${radius + radius * 0.42}
                ${radius - radius * 0.08},${radius + radius * 0.12}
                ${radius - radius * 0.42},${radius}
                ${radius - radius * 0.12},${radius - radius * 0.08}
              `}
              fill={isLight ? 'rgba(2, 132, 199, 0.08)' : 'rgba(56, 189, 248, 0.12)'}
              stroke={isLight ? 'rgba(2, 132, 199, 0.4)' : 'rgba(56, 189, 248, 0.6)'}
              strokeWidth={1.2}
            />
          )}
        </Svg>
      </Animated.View>

      {/* 3. 🎯 DESTINATION ARROW / BEARING POINTER */}
      {targetBearing != null && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              width: size,
              height: size,
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
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Defs>
              <LinearGradient id="destArrowGrad" x1="0" y1="1" x2="0" y2="0">
                <Stop offset="0%" stopColor={arrowGlow} />
                <Stop offset="100%" stopColor={arrowColor} />
              </LinearGradient>
            </Defs>

            {/* Destination Arrow Stem & Pointer Head */}
            <G>
              {/* Outer glowing target chevron / pointer at the dial edge */}
              <Polygon
                points={`
                  ${radius},${radius * 0.08}
                  ${radius + Math.max(6, size * 0.065)},${radius * 0.32}
                  ${radius},${radius * 0.24}
                  ${radius - Math.max(6, size * 0.065)},${radius * 0.32}
                `}
                fill="url(#destArrowGrad)"
                stroke="#FFFFFF"
                strokeWidth={1.2}
              />

              {/* Needle Line towards center */}
              <Line
                x1={radius}
                y1={radius * 0.24}
                x2={radius}
                y2={radius * 0.75}
                stroke={arrowColor}
                strokeWidth={Math.max(2, size * 0.02)}
                strokeDasharray="4 2"
                opacity={0.85}
              />

              {/* Target Dot Beacon on perimeter */}
              <Circle
                cx={radius}
                cy={radius * 0.06}
                r={Math.max(3, size * 0.03)}
                fill={arrowColor}
                stroke="#FFFFFF"
                strokeWidth={1}
              />
            </G>
          </Svg>
        </Animated.View>
      )}

      {/* 4. Center Pivot Cap (Fixed overlay) */}
      <View
        style={[
          styles.centerPivot,
          {
            width: size * 0.16,
            height: size * 0.16,
            borderRadius: size * 0.08,
            backgroundColor: isLight ? '#FFFFFF' : '#0F2742',
            borderColor: isLight ? '#0284C7' : '#38BDF8',
          },
        ]}
      >
        <View
          style={[
            styles.centerDot,
            {
              width: size * 0.08,
              height: size * 0.08,
              borderRadius: size * 0.04,
              backgroundColor: isLight ? '#0284C7' : '#FFFFFF',
            },
          ]}
        />
      </View>

      {/* 5. Top Fixed Bow Lubber Line (12 O'clock reference marker) */}
      <View style={styles.lubberLineWrap} pointerEvents="none">
        <View style={styles.lubberArrow} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerPivot: {
    position: 'absolute',
    backgroundColor: '#0F2742',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00F0FF',
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  centerDot: {
    backgroundColor: '#FFFFFF',
  },
  lubberLineWrap: {
    position: 'absolute',
    top: -2,
    alignItems: 'center',
    zIndex: 10,
  },
  lubberArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#F59E0B', // Marine amber bow line
  },
});
