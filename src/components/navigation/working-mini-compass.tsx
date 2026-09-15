import { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';

import { useUserLocation } from '@/hooks/use-user-location';

const MINI_COMPASS_SIZE = 66;

/**
 * 🧭 WorkingMiniCompass
 * Real-time miniature marine compass that turns with device sensors.
 * Features:
 * - Smooth shortest-path angle unwrapping (no 360° flip when passing North)
 * - Rotating dial with marine needle star (Red North / Silver South)
 * - Fixed top lubber line (indicates bow direction)
 * - Real-time digital heading readout badge (e.g. 042°)
 */
type WorkingMiniCompassProps = {
  size?: number;
};

export function WorkingMiniCompass({ size = 66 }: WorkingMiniCompassProps) {
  const { heading, magHeading, location } = useUserLocation();

  // Pick best heading source, defaulting to 0
  const currentHeading =
    magHeading ??
    heading ??
    (location?.heading != null && Number.isFinite(location.heading) ? Math.round(location.heading) : 0);

  // Animated rotation value with continuous angle unwrapping
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
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [currentHeading, rotationAnim]);

  const displayHeading = Math.round(((currentHeading % 360) + 360) % 360);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* 1. Top Fixed Lubber Line (Bow Direction Pointer) */}
      <View style={styles.lubberMarker} pointerEvents="none" />

      {/* 2. Animated Rotating Compass Dial */}
      <Animated.View
        style={[
          styles.dialWrapper,
          {
            width: size,
            height: size,
            transform: [
              {
                rotate: rotationAnim.interpolate({
                  inputRange: [-360000, 360000],
                  outputRange: ['-360000deg', '360000deg'],
                }),
              },
            ],
          },
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 48 48">
          {/* Dial Background Disc */}
          <Circle
            cx="24"
            cy="24"
            r="22.5"
            fill="#031526"
            stroke="#38BDF8"
            strokeWidth="1.2"
            strokeOpacity={0.65}
          />
          <Circle
            cx="24"
            cy="24"
            r="16.5"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="0.8"
            strokeOpacity={0.12}
          />

          {/* 30-degree Ticks */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
            const isCardinal = deg % 90 === 0;
            const length = isCardinal ? 3.5 : 2;
            const rad = (deg * Math.PI) / 180;
            const x1 = 24 + 21 * Math.sin(rad);
            const y1 = 24 - 21 * Math.cos(rad);
            const x2 = 24 + (21 - length) * Math.sin(rad);
            const y2 = 24 - (21 - length) * Math.cos(rad);
            return (
              <Line
                key={`tick-${deg}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isCardinal ? '#FFFFFF' : 'rgba(255,255,255,0.35)'}
                strokeWidth={isCardinal ? 1.2 : 0.8}
              />
            );
          })}

          {/* Cardinal Letters */}
          <SvgText x="24" y="9.5" fill="#EF4444" fontSize="8" fontWeight="900" textAnchor="middle">
            N
          </SvgText>
          <SvgText x="24" y="42" fill="#94A3B8" fontSize="6.5" fontWeight="700" textAnchor="middle">
            S
          </SvgText>
          <SvgText x="41" y="26.2" fill="#94A3B8" fontSize="6.5" fontWeight="700" textAnchor="middle">
            E
          </SvgText>
          <SvgText x="7" y="26.2" fill="#94A3B8" fontSize="6.5" fontWeight="700" textAnchor="middle">
            W
          </SvgText>

          {/* 4-Point Marine Compass Star Needle */}
          {/* North Needle - Vivid Red */}
          <Polygon points="24,11 24,24 21.5,22.5" fill="#EF4444" />
          <Polygon points="24,11 26.5,22.5 24,24" fill="#B91C1C" />

          {/* South Needle - Silver/White */}
          <Polygon points="24,37 24,24 21.5,25.5" fill="#F8FAFC" />
          <Polygon points="24,37 26.5,25.5 24,24" fill="#94A3B8" />

          {/* East Needle - Cyan */}
          <Polygon points="37,24 24,24 25.5,21.5" fill="#38BDF8" />
          <Polygon points="37,24 25.5,26.5 24,24" fill="#0284C7" />

          {/* West Needle - Cyan */}
          <Polygon points="11,24 24,24 22.5,21.5" fill="#38BDF8" />
          <Polygon points="11,24 22.5,26.5 24,24" fill="#0284C7" />

          {/* Center Brass/Cyan Pivot Bead */}
          <Circle cx="24" cy="24" r="2.6" fill="#0284C7" stroke="#FFFFFF" strokeWidth="1" />
        </Svg>
      </Animated.View>

      {/* 3. Real-time Heading Digital Readout */}
      <View style={styles.headingBadge} pointerEvents="none">
        <Text style={styles.headingText}>{displayHeading}°</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dialWrapper: {
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lubberMarker: {
    position: 'absolute',
    top: -2,
    zIndex: 10,
    width: 0,
    height: 0,
    borderLeftWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#F97316',
  },
  headingBadge: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: 'rgba(2, 22, 43, 0.94)',
    paddingHorizontal: 3.5,
    paddingVertical: 0.5,
    borderRadius: 4,
    borderWidth: 0.8,
    borderColor: 'rgba(56, 189, 248, 0.65)',
    zIndex: 12,
  },
  headingText: {
    color: '#38BDF8',
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
