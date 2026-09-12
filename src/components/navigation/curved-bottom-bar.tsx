import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, Polygon } from 'react-native-svg';

import { MapColors } from '@/constants/map-theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_WIDTH = Math.min(SCREEN_WIDTH - 24, 428);
const TOTAL_HEIGHT = 107;

export type ActiveTabType = 'waypoint' | 'weather' | 'compass' | 'calendar' | 'settings' | null;

type CurvedBottomBarProps = {
  activeTab: ActiveTabType;
  onTabPress: (tab: 'waypoint' | 'weather' | 'compass' | 'calendar' | 'settings') => void;
};

// 1. Waypoint Icon
const WaypointIcon = ({ isActive }: { isActive: boolean }) => {
  if (isActive) {
    return (
      <View style={styles.activeIconBadge}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="white">
          <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
        </Svg>
      </View>
    );
  }
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <Circle cx="12" cy="10" r="3" />
    </Svg>
  );
};

// 2. Weather Icon
const WeatherIcon = ({ isActive }: { isActive: boolean }) => {
  if (isActive) {
    return (
      <View style={styles.activeIconBadge}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="white">
          <Path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
        </Svg>
      </View>
    );
  }
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </Svg>
  );
};

// 3. Center Compass Rose Icon
const CenterCompassIcon = () => (
  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke="#FFFFFF" strokeWidth={1.8} />
    <Polygon points="12,4 14,11 12,9 10,11" fill="#EF4444" stroke="#EF4444" strokeWidth={1} />
    <Polygon points="12,20 14,13 12,15 10,13" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth={1} />
    <Polygon points="4,12 11,10 9,12 11,14" fill="#93C5FD" stroke="#93C5FD" strokeWidth={1} />
    <Polygon points="20,12 13,10 15,12 13,14" fill="#93C5FD" stroke="#93C5FD" strokeWidth={1} />
    <Circle cx="12" cy="12" r="2" fill="#0284C7" />
  </Svg>
);

// 4. Calendar Icon
const CalendarIcon = ({ isActive }: { isActive: boolean }) => {
  if (isActive) {
    return (
      <View style={styles.activeIconBadge}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="white">
          <Path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
        </Svg>
      </View>
    );
  }
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z" />
      <Line x1="16" y1="2" x2="16" y2="6" />
      <Line x1="8" y1="2" x2="8" y2="6" />
      <Line x1="4" y1="10" x2="20" y2="10" />
    </Svg>
  );
};

// 5. Settings Icon
const SettingsIcon = ({ isActive }: { isActive: boolean }) => {
  if (isActive) {
    return (
      <View style={styles.activeIconBadge}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="white">
          <Path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
        </Svg>
      </View>
    );
  }
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="3" />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Svg>
  );
};

export function CurvedBottomBar({ activeTab, onTabPress }: CurvedBottomBarProps) {
  const insets = useSafeAreaInsets();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const width = BAR_WIDTH;
  const height = TOTAL_HEIGHT;
  const barTopY = 24;
  const radius = 26;
  const bottomRadius = 38;
  const center = width / 2;

  const pathData = `
    M ${radius} ${barTopY}
    H ${center - 60}
    C ${center - 40} ${barTopY}, ${center - 36} 4, ${center} 4
    C ${center + 36} 4, ${center + 40} ${barTopY}, ${center + 60} ${barTopY}
    H ${width - radius}
    Q ${width} ${barTopY} ${width} ${barTopY + radius}
    V ${height - bottomRadius}
    Q ${width} ${height} ${width - bottomRadius} ${height}
    H ${bottomRadius}
    Q 0 ${height} 0 ${height - bottomRadius}
    V ${barTopY + radius}
    Q 0 ${barTopY} ${radius} ${barTopY}
    Z
  `;

  const handleCenterPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 80, useNativeDriver: Platform.OS !== 'web' }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 40, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
    onTabPress('compass');
  };

  return (
    <View
      style={[styles.tabBarWrapper, { bottom: Platform.OS === 'ios' ? insets.bottom : 12 }]}
      pointerEvents="box-none"
    >
      <View style={styles.barContainer} pointerEvents="box-none">
        {/* Curved Background Bar */}
        <Svg width={BAR_WIDTH} height={TOTAL_HEIGHT} style={styles.svgBackground} pointerEvents="none">
          <Path d={pathData} fill={MapColors?.navy || '#00162B'} />
        </Svg>

        {/* Center Crescent Arch */}
        <View style={styles.crescentWrapper} pointerEvents="none">
          <Svg width={76} height={38} viewBox="0 0 76 38">
            <Path
              d="M 5 36 C 5 16, 20 2, 38 2 C 56 2, 71 16, 71 36"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={3.5}
              strokeLinecap="round"
            />
          </Svg>
        </View>

        {/* Elevated Floating Center Compass Button */}
        <Animated.View
          style={[styles.centerButtonWrapper, { transform: [{ scale: scaleAnim }] }]}
          pointerEvents="auto"
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleCenterPress}
            style={styles.centerTouch}
            accessibilityRole="button"
            accessibilityLabel="Marine Compass"
          >
            <LinearGradient
              colors={activeTab === 'compass' ? ['#0284C7', '#0369A1'] : ['#0F2942', '#0A1F35']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[styles.gradientCircle, activeTab === 'compass' && styles.gradientCircleActive]}
            >
              <CenterCompassIcon />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Tab Items Row */}
        <View style={styles.itemsRow} pointerEvents="auto">
          {/* Tab 1: Waypoint */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onTabPress('waypoint')}
            style={styles.tabItem}
            accessibilityRole="button"
            accessibilityLabel="Waypoints"
          >
            <WaypointIcon isActive={activeTab === 'waypoint'} />
            {activeTab === 'waypoint' && <Text style={styles.activeLabel}>Waypoint</Text>}
          </TouchableOpacity>

          {/* Tab 2: Weather */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onTabPress('weather')}
            style={styles.tabItem}
            accessibilityRole="button"
            accessibilityLabel="Weather"
          >
            <WeatherIcon isActive={activeTab === 'weather'} />
            {activeTab === 'weather' && <Text style={styles.activeLabel}>Weather</Text>}
          </TouchableOpacity>

          {/* Spacer for Elevated Center Compass */}
          <View style={styles.centerSpacer} pointerEvents="none" />

          {/* Tab 4: Calendar */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onTabPress('calendar')}
            style={styles.tabItem}
            accessibilityRole="button"
            accessibilityLabel="Calendar"
          >
            <CalendarIcon isActive={activeTab === 'calendar'} />
            {activeTab === 'calendar' && <Text style={styles.activeLabel}>Calendar</Text>}
          </TouchableOpacity>

          {/* Tab 5: Settings */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onTabPress('settings')}
            style={styles.tabItem}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <SettingsIcon isActive={activeTab === 'settings'} />
            {activeTab === 'settings' && <Text style={styles.activeLabel}>Settings</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 90,
  },
  barContainer: {
    width: BAR_WIDTH,
    height: TOTAL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  svgBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 10,
  },
  crescentWrapper: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    zIndex: 1,
  },
  centerButtonWrapper: {
    position: 'absolute',
    top: 7,
    alignSelf: 'center',
    zIndex: 20,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 14,
  },
  centerTouch: {
    borderRadius: 34,
  },
  gradientCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  gradientCircleActive: {
    borderColor: '#38BDF8',
    borderWidth: 2,
  },
  itemsRow: {
    width: '100%',
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  centerSpacer: {
    width: 68,
  },
  activeIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 5,
  },
  activeLabel: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: 0.2,
  },
});
