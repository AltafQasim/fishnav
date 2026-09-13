import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { MapColors } from '@/constants/map-theme';

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
};

/**
 * 📱 SlidingSheetContainer
 * Compact Bottom Sheet anchored to bottom of screen (~62% screen height):
 * - Firmly pinned to bottom: 0 (never renders from the top!)
 * - Leaves top ~38% open so marine map is always visible
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
  heightRatio = 0.62,
}: SlidingSheetContainerProps) {
  const { height: windowHeight } = useWindowDimensions();

  // Exactly 62% of screen height (or customHeight)
  const sheetHeight = customHeight ?? Math.round(windowHeight * heightRatio);

  const translateY = useRef(new Animated.Value(sheetHeight + 60)).current;
  const heightRef = useRef(sheetHeight);
  heightRef.current = sheetHeight;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Dismiss animation (slides down below screen edge)
  const handleDismiss = useCallback(() => {
    Animated.timing(translateY, {
      toValue: heightRef.current + 60,
      duration: 180,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      onCloseRef.current();
    });
  }, [translateY]);

  // Open animation (slides up from below screen to bottom: 0)
  useEffect(() => {
    if (isOpen) {
      translateY.setValue(sheetHeight + 60);
      Animated.spring(translateY, {
        toValue: 0,
        damping: 24,
        mass: 0.8,
        stiffness: 220,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    } else {
      translateY.setValue(sheetHeight + 60);
    }
  }, [isOpen, sheetHeight, translateY]);

  // Drag down on header to close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) {
          translateY.setValue(g.dy);
        } else {
          // Rubber-band resistance if dragged upward
          translateY.setValue(g.dy * 0.15);
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 70 || g.vy > 0.4) {
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
      {/* 1. Touch-to-dismiss zone above the card (allows tapping the top map area to close card!) */}
      <Pressable
        style={[styles.dismissZone, { height: Math.max(0, windowHeight - sheetHeight) }]}
        onPress={handleDismiss}
        accessibilityRole="button"
        accessibilityLabel="Close sheet and return to map"
      />

      {/* 2. Slide-up bottom card (HARD-PINNED TO BOTTOM: 0!) */}
      <Animated.View
        style={[
          styles.sheet,
          {
            height: sheetHeight,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Top Header & Drag Handle */}
        <View {...panResponder.panHandlers} style={styles.headerContainer}>
          <View style={styles.dragHandle} />

          <View style={styles.headerBar}>
            {/* Title & Info */}
            <View style={styles.titleInfo}>
              <View style={styles.titleWithBadge}>
                <Text style={styles.titleText} numberOfLines={1}>
                  {title}
                </Text>
                {badge}
              </View>
              {subtitle ? (
                <Text style={styles.subtitleText} numberOfLines={1}>
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
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close sheet"
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Sheet Content Body */}
        <View style={styles.contentBody}>{children}</View>
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent', // Map is 100% visible and bright!
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
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
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(10, 31, 53, 0.98)',
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    alignSelf: 'center',
    marginBottom: 8,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleInfo: {
    flex: 1,
    paddingRight: 8,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitleText: {
    color: MapColors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  actionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentBody: {
    flex: 1,
  },
});
