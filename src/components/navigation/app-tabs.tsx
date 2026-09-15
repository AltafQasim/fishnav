import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { useAppTheme } from '@/context/theme-context';
import {
  CalendarTabIcon,
  SettingsTabIcon,
  WaypointTabIcon,
  WeatherTabIcon,
} from './tab-icons';
import { WorkingMiniCompass } from './working-mini-compass';

export type ActiveTabType = 'waypoint' | 'weather' | 'compass' | 'calendar' | 'settings' | null;

export type AppTabsProps = {
  activeTab: ActiveTabType;
  onTabPress: (tab: 'waypoint' | 'weather' | 'compass' | 'calendar' | 'settings') => void;
};

/**
 * 🌟 AppTabs (Curved Floating Marine Navigation Bar)
 * Clean, structured navigation bar dynamically responsive across all devices:
 * - Small phones (< 365px): Proportionally scaled down, tight tabs, compact compass (60px)
 * - Standard phones (365px - 480px): Sleek floating binnacle (max 428px), 66px compass
 * - Tablets & Foldables (>= 600px): Spacious floating cockpit (up to 560px), 72px compass, large hit targets
 * - Real-time orientation & safe area adaptation for iOS & Android
 */
export function AppTabs({ activeTab, onTabPress }: AppTabsProps) {
  const { colors, isLight, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  // Responsive device classification
  const isSmallPhone = windowWidth < 365;
  const isTablet = windowWidth >= 600;
  const isLandscape = windowWidth > windowHeight;

  // Responsive Bar Geometry
  // Account for landscape left/right safe insets (e.g. Dynamic Island / notch)
  const horizontalSafeGap = insets.left + insets.right;
  const maxBarWidth = isTablet
    ? (isLandscape ? 560 : 520)
    : isSmallPhone
      ? 340
      : 428;

  const barWidth = Math.round(
    Math.min(windowWidth - (horizontalSafeGap + (isSmallPhone ? 16 : 24)), maxBarWidth)
  );

  // Adaptive heights & radii
  const totalHeight = isSmallPhone ? 98 : isTablet ? 112 : 107;
  const barTopY = isSmallPhone ? 32 : isTablet ? 38 : 35;
  const radius = isSmallPhone ? 22 : isTablet ? 28 : 26;
  const bottomRadius = isSmallPhone ? 32 : isTablet ? 40 : 38;
  const center = barWidth / 2;

  // Center Compass button dimensions
  const compassDiameter = isSmallPhone ? 60 : isTablet ? 72 : 66;
  const compassInnerSize = isSmallPhone ? 58 : isTablet ? 70 : 64;
  const cutoutHalf = isSmallPhone ? 52 : isTablet ? 68 : 60;
  const cutoutDip = 4;

  // Dynamic SVG Path Data:
  // Perfectly smooth curve with binnacle cutout for center compass
  const pathData = `
    M ${radius} ${barTopY}
    H ${center - cutoutHalf}
    C ${center - cutoutHalf * 0.66} ${barTopY}, ${center - cutoutHalf * 0.6} ${cutoutDip}, ${center} ${cutoutDip}
    C ${center + cutoutHalf * 0.6} ${cutoutDip}, ${center + cutoutHalf * 0.66} ${barTopY}, ${center + cutoutHalf} ${barTopY}
    H ${barWidth - radius}
    Q ${barWidth} ${barTopY} ${barWidth} ${barTopY + radius}
    V ${totalHeight - bottomRadius}
    Q ${barWidth} ${totalHeight} ${barWidth - bottomRadius} ${totalHeight}
    H ${bottomRadius}
    Q 0 ${totalHeight} 0 ${totalHeight - bottomRadius}
    V ${barTopY + radius}
    Q 0 ${barTopY} ${radius} ${barTopY}
    Z
  `;

  // Safe area bottom offset:
  // - On iOS with home bar: insets.bottom + 4 (floats cleanly above gesture indicator)
  // - On iPhone SE / no home bar: 12-14px floating margin
  // - On Android with 3-button nav (insets.bottom ~48): insets.bottom + 4 (above buttons)
  // - On Android gesture nav: insets.bottom + 4
  const bottomOffset = insets.bottom > 0
    ? insets.bottom + (isTablet ? 8 : 4)
    : (isSmallPhone ? 8 : 14);

  const handleCenterPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 80, useNativeDriver: Platform.OS !== 'web' }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 40, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
    onTabPress('compass');
  };

  const activeLabelFontSize = isSmallPhone ? 9.5 : isTablet ? 12 : 11;
  const centerSpacerWidth = isSmallPhone ? 58 : isTablet ? 76 : 68;

  return (
    <View
      style={[
        styles.tabBarWrapper,
        {
          bottom: bottomOffset,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.barContainer,
          {
            width: barWidth,
            height: totalHeight,
          },
        ]}
        pointerEvents="box-none"
      >
        {/* 1. Curved Background Bar (Theme Adaptive & Responsive SVG) */}
        <Svg width={barWidth} height={totalHeight} style={styles.svgBackground} pointerEvents="none">
          <Path d={pathData} fill={colors.navBarFill} stroke={colors.navBarBorder} strokeWidth={1.5} />
        </Svg>

        {/* 2. Elevated Floating Center Live Compass Button */}
        <Animated.View
          style={[
            styles.centerButtonWrapper,
            {
              top: isSmallPhone ? 5 : isTablet ? 8 : 7,
              transform: [{ scale: scaleAnim }],
            },
          ]}
          pointerEvents="auto"
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleCenterPress}
            style={[styles.centerTouch, { borderRadius: compassDiameter / 2 }]}
            accessibilityRole="button"
            accessibilityLabel="Marine Compass"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <LinearGradient
              colors={
                activeTab === 'compass'
                  ? colors.accentGradient
                  : isLight
                    ? ['#f8fcf8ff', '#E2E8F0']
                    : isDark
                      ? ['#1E293B', '#0F172A']
                      : ['#082238', '#031424']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[
                styles.gradientCircle,
                {
                  width: compassDiameter,
                  height: compassDiameter,
                  borderRadius: compassDiameter / 2,
                  borderColor: colors.navBarBorder,
                },
                activeTab === 'compass' && styles.gradientCircleActive,
              ]}
            >
              {/* Real-time turning mini compass with responsive size */}
              <WorkingMiniCompass size={compassInnerSize} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* 3. Tab Items Row */}
        <View
          style={[
            styles.itemsRow,
            {
              height: isSmallPhone ? 70 : isTablet ? 82 : 76,
              paddingHorizontal: isSmallPhone ? 8 : isTablet ? 24 : 16,
            },
          ]}
          pointerEvents="auto"
        >
          {/* Tab 1: Waypoint */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onTabPress('waypoint')}
            style={styles.tabItem}
            accessibilityRole="button"
            accessibilityLabel="Waypoints"
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          >
            <WaypointTabIcon isActive={activeTab === 'waypoint'} />
            {activeTab === 'waypoint' && (
              <Text
                numberOfLines={1}
                style={[
                  styles.activeLabel,
                  { color: colors.accent, fontSize: activeLabelFontSize },
                ]}
              >
                Waypoint
              </Text>
            )}
          </TouchableOpacity>

          {/* Tab 2: Weather */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onTabPress('weather')}
            style={styles.tabItem}
            accessibilityRole="button"
            accessibilityLabel="Weather"
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          >
            <WeatherTabIcon isActive={activeTab === 'weather'} />
            {activeTab === 'weather' && (
              <Text
                numberOfLines={1}
                style={[
                  styles.activeLabel,
                  { color: colors.accent, fontSize: activeLabelFontSize },
                ]}
              >
                Weather
              </Text>
            )}
          </TouchableOpacity>

          {/* Center Spacer for Elevated Compass Button */}
          <View style={{ width: centerSpacerWidth }} pointerEvents="none" />

          {/* Tab 4: Calendar */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onTabPress('calendar')}
            style={styles.tabItem}
            accessibilityRole="button"
            accessibilityLabel="Calendar"
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          >
            <CalendarTabIcon isActive={activeTab === 'calendar'} />
            {activeTab === 'calendar' && (
              <Text
                numberOfLines={1}
                style={[
                  styles.activeLabel,
                  { color: colors.accent, fontSize: activeLabelFontSize },
                ]}
              >
                Calendar
              </Text>
            )}
          </TouchableOpacity>

          {/* Tab 5: Settings */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onTabPress('settings')}
            style={styles.tabItem}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          >
            <SettingsTabIcon isActive={activeTab === 'settings'} />
            {activeTab === 'settings' && (
              <Text
                numberOfLines={1}
                style={[
                  styles.activeLabel,
                  { color: colors.accent, fontSize: activeLabelFontSize },
                ]}
              >
                Settings
              </Text>
            )}
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
    backgroundColor: 'transparent',
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
  centerButtonWrapper: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 10,
    elevation: 14,
  },
  centerTouch: {
    borderRadius: 36,
  },
  gradientCircle: {
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 5,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingHorizontal: 2,
  },
  activeLabel: {
    color: '#38BDF8',
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: 0.2,
  },
});
