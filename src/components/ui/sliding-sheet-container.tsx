import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapColors } from '@/constants/map-theme';
import { useAppTheme } from '@/context/theme-context';

type SlidingSheetContainerProps = {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
  height?: number;
  heightRatio?: number;
  maxHeightRatio?: number;
};

/**
 * 📱 SlidingSheetContainer
 * Dynamic Bottom Sheet anchored to bottom of screen:
 * - Auto-sizes to fit content up to 85% screen height
 * - If content > 85%, caps at 85% and enables scrolling
 * - Leaves map area visible above
 * - Drag DOWN on header handle to dismiss
 * - Tap on top map area or [ ✕ ] to close
 */
export function SlidingSheetContainer({
  isOpen,
  title,
  subtitle,
  badge,
  headerRight,
  children,
  onClose,
  height: customHeight,
  heightRatio,
  maxHeightRatio = 0.85,
}: SlidingSheetContainerProps) {
  const { colors, isLight } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTablet = windowWidth >= 600;
  const isLandscape = windowWidth > windowHeight;

  // Maximum 85% of screen height (or custom maxHeightRatio, 90% in landscape phone)
  const defaultMaxRatio = isLandscape && !isTablet ? 0.90 : 0.85;
  const maxSheetHeight = Math.round(windowHeight * (maxHeightRatio ?? defaultMaxRatio));

  // If an explicit fixed height or heightRatio was provided, use it, otherwise let content size up to 85%
  const effectiveFixed = customHeight ?? (heightRatio ? Math.round(windowHeight * heightRatio) : undefined);

  const [measuredHeight, setMeasuredHeight] = useState<number>(effectiveFixed ?? maxSheetHeight);
  const heightRef = useRef(effectiveFixed ?? maxSheetHeight);
  heightRef.current = measuredHeight;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const translateY = useRef(new Animated.Value(heightRef.current + 60)).current;

  // Track layout to adjust dismissal and pan limits based on actual rendered content height
  const handleSheetLayout = useCallback((e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height);
    if (h > 0 && Math.abs(h - heightRef.current) > 2) {
      heightRef.current = h;
      setMeasuredHeight(h);
    }
  }, []);

  // Dismiss animation (slides down below screen edge)
  const handleDismiss = useCallback(() => {
    Animated.timing(translateY, {
      toValue: heightRef.current + 60,
      duration: 220,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      onCloseRef.current();
    });
  }, [translateY]);

  // Handle open animation when opened or height changes
  useEffect(() => {
    if (isOpen) {
      Animated.spring(translateY, {
        toValue: 0,
        damping: 24,
        stiffness: 220,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    } else {
      translateY.setValue(heightRef.current + 60);
    }
  }, [isOpen, translateY]);

  // Pan Responder for Drag-down to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 90 || gestureState.vy > 0.6) {
          handleDismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            damping: 22,
            stiffness: 220,
            useNativeDriver: Platform.OS !== 'web',
          }).start();
        }
      },
    }),
  ).current;

  if (!isOpen) {
    return null;
  }

  return (
    <View style={styles.outerContainer} pointerEvents="box-none">
      {/* 1. Touch-to-dismiss zone above/behind the card */}
      <Pressable
        style={styles.dismissZone}
        onPress={handleDismiss}
        accessibilityRole="button"
        accessibilityLabel="Close sheet and return to map"
      />

      {/* 2. Slide-up bottom card (up to 85% max height, fit-content if smaller) */}
      <Animated.View
        onLayout={handleSheetLayout}
        style={[
          styles.sheet,
          {
            backgroundColor: colors.sheetBg,
            borderTopColor: colors.sheetBorder,
            borderLeftColor: colors.cardBorder,
            borderRightColor: colors.cardBorder,
            maxHeight: maxSheetHeight,
            paddingBottom: Math.max(insets.bottom, 12),
            ...(effectiveFixed ? { height: effectiveFixed } : {}),
            transform: [{ translateY }],
            ...(isTablet
              ? {
                maxWidth: 640,
                width: Math.min(windowWidth - 48, 640),
                alignSelf: 'center',
                borderRadius: 28,
                borderWidth: 1.5,
                borderColor: colors.sheetBorder,
                marginBottom: Math.max(insets.bottom + 8, 14),
              }
              : {}),
          },
        ]}
      >
        {/* Top Header & Drag Handle */}
        <View
          {...panResponder.panHandlers}
          style={[
            styles.headerContainer,
            {
              backgroundColor: colors.sheetHeaderBg,
              borderBottomColor: colors.divider,
            },
          ]}
        >
          <View
            style={[
              styles.dragHandle,
              {
                backgroundColor: isLight
                  ? 'rgba(0, 0, 0, 0.25)'
                  : 'rgba(255, 255, 255, 0.35)',
              },
            ]}
          />

          <View style={styles.headerBar}>
            {/* Title & Info */}
            <View style={styles.titleInfo}>
              <View style={styles.titleWithBadge}>
                <Text
                  style={[styles.titleText, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
                {badge}
              </View>
              {subtitle ? (
                <Text
                  style={[styles.subtitleText, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>

            {/* Right Actions & Close Button */}
            <View style={styles.actionsWrap}>
              {headerRight}

              <Pressable
                onPress={handleDismiss}
                hitSlop={14}
                style={[
                  styles.closeBtn,
                  {
                    backgroundColor: colors.chipBg,
                    borderColor: colors.chipBorder,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Close sheet"
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Sheet Content Body */}
        <View style={[styles.contentBody, { maxHeight: maxSheetHeight - 64 }]}>{children}</View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 80, // Sits above map (1) and map controls, below AppTabs (150)
  },
  dismissZone: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent', // Map is 100% visible and bright!
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: MapColors.navy,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(56, 189, 248, 0.25)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 30,
    overflow: 'hidden',
  },
  headerContainer: {
    paddingTop: 6,
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(10, 31, 53, 0.98)',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    alignSelf: 'center',
    marginBottom: 6,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleInfo: {
    flex: 1,
    paddingRight: 6,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  subtitleText: {
    color: MapColors.textSecondary,
    fontSize: 11,
    marginTop: 1,
    flexShrink: 1,
  },
  actionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentBody: {
    flexShrink: 1,
  },
});
