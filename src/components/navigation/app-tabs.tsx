import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { useAppTheme } from '@/context/theme-context';
import { MapColors } from '@/constants/map-theme';
import {
  CalendarTabIcon,
  SettingsTabIcon,
  WaypointTabIcon,
  WeatherTabIcon,
} from './tab-icons';
import { WorkingMiniCompass } from './working-mini-compass';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_WIDTH = Math.min(SCREEN_WIDTH - 24, 428);
const TOTAL_HEIGHT = 107;

export type ActiveTabType = 'waypoint' | 'weather' | 'compass' | 'calendar' | 'settings' | null;

export type AppTabsProps = {
  activeTab: ActiveTabType;
  onTabPress: (tab: 'waypoint' | 'weather' | 'compass' | 'calendar' | 'settings') => void;
};

/**
 * 🌟 AppTabs (Curved Floating Marine Navigation Bar)
 * Clean, structured navigation bar with:
 * - Real-time working mini marine compass in the center button
 * - SVG curved cutout binnacle bar
 * - 4 marine utility tabs: Waypoint, Weather, Calendar, Settings
 */
export function AppTabs({ activeTab, onTabPress }: AppTabsProps) {
  const { colors, isLight, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  // SVG Curved Bar Geometry
  const width = BAR_WIDTH;
  const height = TOTAL_HEIGHT;
  const barTopY = 35;
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
        {/* 1. Curved Background Bar (Theme Adaptive) */}
        <Svg width={BAR_WIDTH} height={TOTAL_HEIGHT} style={styles.svgBackground} pointerEvents="none">
          <Path d={pathData} fill={colors.navBarFill} stroke={colors.navBarBorder} strokeWidth={1.5} />
        </Svg>

        {/* 3. Elevated Floating Center Live Compass Button */}
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
              colors={
                activeTab === 'compass'
                  ? colors.accentGradient
                  : isLight
                  ? ['#F8FAFC', '#E2E8F0']
                  : isDark
                  ? ['#1E293B', '#0F172A']
                  : ['#082238', '#031424']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[
                styles.gradientCircle,
                { borderColor: colors.navBarBorder },
                activeTab === 'compass' && styles.gradientCircleActive,
              ]}
            >
              {/* Real-time turning mini compass */}
              <WorkingMiniCompass />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* 4. Tab Items Row */}
        <View style={styles.itemsRow} pointerEvents="auto">
          {/* Tab 1: Waypoint */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onTabPress('waypoint')}
            style={styles.tabItem}
            accessibilityRole="button"
            accessibilityLabel="Waypoints"
          >
            <WaypointTabIcon isActive={activeTab === 'waypoint'} />
            {activeTab === 'waypoint' && <Text style={[styles.activeLabel, { color: colors.accent }]}>Waypoint</Text>}
          </TouchableOpacity>

          {/* Tab 2: Weather */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onTabPress('weather')}
            style={styles.tabItem}
            accessibilityRole="button"
            accessibilityLabel="Weather"
          >
            <WeatherTabIcon isActive={activeTab === 'weather'} />
            {activeTab === 'weather' && <Text style={[styles.activeLabel, { color: colors.accent }]}>Weather</Text>}
          </TouchableOpacity>

          {/* Center Spacer for Elevated Compass Button */}
          <View style={styles.centerSpacer} pointerEvents="none" />

          {/* Tab 4: Calendar */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onTabPress('calendar')}
            style={styles.tabItem}
            accessibilityRole="button"
            accessibilityLabel="Calendar"
          >
            <CalendarTabIcon isActive={activeTab === 'calendar'} />
            {activeTab === 'calendar' && <Text style={[styles.activeLabel, { color: colors.accent }]}>Calendar</Text>}
          </TouchableOpacity>

          {/* Tab 5: Settings */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onTabPress('settings')}
            style={styles.tabItem}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <SettingsTabIcon isActive={activeTab === 'settings'} />
            {activeTab === 'settings' && <Text style={[styles.activeLabel, { color: colors.accent }]}>Settings</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// Backward-compatible alias
export const CurvedBottomBar = AppTabs;
export default AppTabs;

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 150,
  },
  barContainer: {
    width: BAR_WIDTH,
    height: TOTAL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-end',
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
    zIndex: 10,
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
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  gradientCircleActive: {
    borderColor: '#38BDF8',
    borderWidth: 2,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  itemsRow: {
    width: '100%',
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 5,
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
  activeLabel: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: 0.2,
  },
});
