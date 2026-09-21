import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { useAppTheme } from '@/context/theme-context';

export type TabIconProps = {
  isActive: boolean;
  color?: string;
  size?: number;
};

// 📍 1. Modern Nautical GPS & Radar Waypoint Icon
export function WaypointTabIcon({ isActive, color, size = 24 }: TabIconProps) {
  const { colors, isLight } = useAppTheme();
  const strokeColor = color || (isLight ? '#475569' : '#8FA4B8');

  if (isActive) {
    return (
      <View style={styles.activeWrapper}>
        <LinearGradient
          colors={colors.accentGradient || ['#00F0FF', '#0284C7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.activeSquircle,
            {
              shadowColor: colors.accent,
            },
          ]}
        >
          {/* High-contrast crisp marine radar beacon */}
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            {/* Beacon Body */}
            <Path
              d="M12 2C8.13 2 5 5.13 5 9.5c0 4.8 5.75 11.08 6.54 11.93a.62.62 0 0 0 .92 0C13.25 20.58 19 14.3 19 9.5 19 5.13 15.87 2 12 2z"
              fill="#FFFFFF"
            />
            {/* Cut-out Sonar Target */}
            <Circle cx="12" cy="9.5" r="3.2" fill={colors.accent || '#0284C7'} />
            <Circle cx="12" cy="9.5" r="1.5" fill="#FFFFFF" />
          </Svg>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.inactiveWrapper}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Precision Beacon Contour */}
        <Path d="M12 2C8.13 2 5 5.13 5 9.5c0 4.8 5.75 11.08 6.54 11.93a.62.62 0 0 0 .92 0C13.25 20.58 19 14.3 19 9.5 19 5.13 15.87 2 12 2z" />
        {/* Radar Concentric Target */}
        <Circle cx="12" cy="9.5" r="3" strokeWidth={1.5} />
        <Circle cx="12" cy="9.5" r="1.1" fill={strokeColor} stroke="none" />
        {/* Lateral Radar Notches */}
        <Line x1="6.8" y1="9.5" x2="8.3" y2="9.5" strokeWidth={1.5} />
        <Line x1="15.7" y1="9.5" x2="17.2" y2="9.5" strokeWidth={1.5} />
      </Svg>
    </View>
  );
}

// 🌊 2. Modern Oceanic Weather, Sun & Tidal Swell Icon
export function WeatherTabIcon({ isActive, color, size = 24 }: TabIconProps) {
  const { colors, isLight } = useAppTheme();
  const strokeColor = color || (isLight ? '#475569' : '#8FA4B8');

  if (isActive) {
    return (
      <View style={styles.activeWrapper}>
        <LinearGradient
          colors={colors.accentGradient || ['#00F0FF', '#0284C7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.activeSquircle,
            {
              shadowColor: colors.accent,
            },
          ]}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            {/* Solar disc peeking */}
            <Path
              d="M15.5 7.5a3.5 3.5 0 0 0-3.5-3.5c-.3 0-.6.04-.9.1A4.8 4.8 0 0 1 15.4 7.6c0 .3-.04.6-.1.9.4-.2.8-.5 1.1-.9.4-.7.6-1.5.6-2.4 0-.6-.1-1.2-.3-1.8"
              fill="#FFE885"
            />
            {/* White Puffy Marine Cloud */}
            <Path
              d="M17.5 15.5H7.2a4.2 4.2 0 0 1-.7-8.34A5.25 5.25 0 0 1 17 8.5a3.75 3.75 0 0 1 .5 7z"
              fill="#FFFFFF"
            />
            {/* Oceanic Wave Swell Ripple */}
            <Path
              d="M4.5 18.8c1.5 0 2.4-.8 3.9-.8s2.4.8 3.9.8 2.4-.8 3.9-.8 2.4.8 3.9.8"
              stroke="#020B14"
              strokeWidth={1.8}
              strokeLinecap="round"
            />
          </Svg>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.inactiveWrapper}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Sun Corona Rays */}
        <Line x1="16.5" y1="2" x2="16.5" y2="3.3" />
        <Line x1="20" y1="3.5" x2="19.1" y2="4.4" />
        <Line x1="21.5" y1="7" x2="20.2" y2="7" />
        <Path d="M16.5 7a3 3 0 0 0-2.8-2" />

        {/* Dynamic Curved Marine Cloud */}
        <Path d="M17.5 15H7a4.2 4.2 0 0 1-.7-8.34A5.25 5.25 0 0 1 16.8 8a3.75 3.75 0 0 1 .7 7z" />

        {/* Ocean Wave / Tide Crest Swell */}
        <Path d="M4.5 18.8c1.5 0 2.4-.8 3.9-.8s2.4.8 3.9.8 2.4-.8 3.9-.8 2.4.8 3.9.8" />
      </Svg>
    </View>
  );
}

// 🌙 3. Modern Solunar Fishing Calendar & Lunar Activity Icon
export function CalendarTabIcon({ isActive, color, size = 24 }: TabIconProps) {
  const { colors, isLight } = useAppTheme();
  const strokeColor = color || (isLight ? '#475569' : '#8FA4B8');

  if (isActive) {
    return (
      <View style={styles.activeWrapper}>
        <LinearGradient
          colors={colors.accentGradient || ['#00F0FF', '#0284C7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.activeSquircle,
            {
              shadowColor: colors.accent,
            },
          ]}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            {/* Solid White Rounded Calendar Body */}
            <Rect x="3.5" y="4.5" width="17" height="15.5" rx="3.5" fill="#FFFFFF" />
            {/* Top Suspension Binder Hooks */}
            <Rect x="7" y="2" width="2" height="4" rx="1" fill="#FFFFFF" />
            <Rect x="15" y="2" width="2" height="4" rx="1" fill="#FFFFFF" />
            {/* Header Accent Bar */}
            <Path d="M3.5 9h17" stroke={colors.accent || '#0284C7'} strokeWidth={2} />
            {/* Solunar Bite Activity Dots */}
            <Circle cx="8" cy="13" r="1.3" fill={colors.accent || '#0284C7'} />
            <Circle cx="12" cy="13" r="1.3" fill={colors.accent || '#0284C7'} />
            <Circle cx="8" cy="16.5" r="1.3" fill={colors.accent || '#0284C7'} />
            {/* Lunar Crescent for Peak Feeding Tide */}
            <Path
              d="M16.5 13a2.5 2.5 0 0 1-2.5 2.5c-.3 0-.6-.06-.9-.18a2.5 2.5 0 0 0 2.2-2.82c.4.16.8.34 1.2.5z"
              fill={colors.accent || '#0284C7'}
            />
          </Svg>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.inactiveWrapper}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Rounded Modern Calendar Console */}
        <Rect x="3.5" y="4.5" width="17" height="15.5" rx="3.5" />
        {/* Top Suspension Pins */}
        <Line x1="8" y1="2.2" x2="8" y2="5" strokeWidth={2} />
        <Line x1="16" y1="2.2" x2="16" y2="5" strokeWidth={2} />
        {/* Calendar Header Line */}
        <Line x1="3.5" y1="9.5" x2="20.5" y2="9.5" strokeWidth={1.5} />
        {/* Solunar Activity Grid Dots */}
        <Circle cx="8" cy="13" r="1.1" fill={strokeColor} stroke="none" />
        <Circle cx="12" cy="13" r="1.1" fill={strokeColor} stroke="none" />
        <Circle cx="8" cy="16.5" r="1.1" fill={strokeColor} stroke="none" />
        {/* Crescent Moon Indicator */}
        <Path
          d="M15.8 12.8a2.2 2.2 0 0 1-1.8 2.2 2.2 2.2 0 0 0 2.2-2.2c0-.3-.07-.6-.2-.8-.1.3-.1.5-.2.8z"
          fill={strokeColor}
          stroke="none"
        />
      </Svg>
    </View>
  );
}

// ⚙️ 4. Modern Cockpit Console & Marine Gyro-Turbine Icon
export function SettingsTabIcon({ isActive, color, size = 24 }: TabIconProps) {
  const { colors, isLight } = useAppTheme();
  const strokeColor = color || (isLight ? '#475569' : '#8FA4B8');

  if (isActive) {
    return (
      <View style={styles.activeWrapper}>
        <LinearGradient
          colors={colors.accentGradient || ['#00F0FF', '#0284C7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.activeSquircle,
            {
              shadowColor: colors.accent,
            },
          ]}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            {/* Solid White Fluid Aerodynamic Turbine */}
            <Path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
              fill="#FFFFFF"
            />
            {/* Cut-out Core Aperture */}
            <Circle cx="12" cy="12" r="3.2" fill={colors.accent || '#0284C7'} />
            <Circle cx="12" cy="12" r="1.4" fill="#FFFFFF" />
          </Svg>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.inactiveWrapper}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Fluid 6-Lobe Turbine Contour */}
        <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        {/* Central Precision Radar Hub */}
        <Circle cx="12" cy="12" r="3" strokeWidth={1.5} />
        <Circle cx="12" cy="12" r="1.1" fill={strokeColor} stroke="none" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  activeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSquircle: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
  inactiveWrapper: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
