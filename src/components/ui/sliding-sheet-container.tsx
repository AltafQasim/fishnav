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
};

/**
 * 📱 SlidingSheetContainer
 * Clean 80% Bottom Sheet with Dark Dimmed Backdrop Overlay.
 * - Opens at exactly 80% screen height.
 * - Dimmed dark overlay behind the sheet (tap overlay to close).
 * - Drag DOWN on header to dismiss.
 * - Tap [ ✕ ] to close.
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
}: SlidingSheetContainerProps) {
  const { height: windowHeight } = useWindowDimensions();

  // Exactly 80% of screen height
  const sheetHeight = customHeight ?? Math.round(windowHeight * 0.80);

  const translateY = useRef(new Animated.Value(sheetHeight + 50)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const heightRef = useRef(sheetHeight);
  heightRef.current = sheetHeight;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Dismiss animation (slides down and fades out overlay)
  const handleDismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: heightRef.current + 50,
        duration: 180,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      onCloseRef.current();
    });
  }, [translateY, backdropOpacity]);

  // Open animation (slides up to 80% and fades in dark overlay)
  useEffect(() => {
    if (isOpen) {
      translateY.setValue(sheetHeight + 50);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 24,
          mass: 0.8,
          stiffness: 220,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }
  }, [isOpen, sheetHeight, translateY, backdropOpacity]);

  // Drag down on header to close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) {
          translateY.setValue(g.dy);
          const progress = Math.max(0, 1 - g.dy / (heightRef.current || 1));
          backdropOpacity.setValue(progress);
        } else {
          // Slight resistance if pulled upward
          translateY.setValue(g.dy * 0.1);
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 70 || g.vy > 0.4) {
          handleDismiss();
        } else {
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              damping: 22,
              stiffness: 220,
              useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.timing(backdropOpacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: Platform.OS !== 'web',
            }),
          ]).start();
        }
      },
    }),
  ).current;

  if (!isOpen) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* 1. Dark Dimmed Overlay (Tapping outside closes the tab) */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropOpacity,
          },
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleDismiss}
          accessibilityRole="button"
          accessibilityLabel="Close sheet and return to map"
        />
      </Animated.View>

      {/* 2. 80% Bottom Sheet */}
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 70, // Sits above map but below floating AppTabs (150)
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)', // Strong, clear dark overlay
  },
  sheet: {
    width: '100%',
    backgroundColor: MapColors.navy,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.16)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.65,
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
    width: 40,
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
