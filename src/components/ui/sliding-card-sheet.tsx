import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapColors } from '@/constants/map-theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type SlidingCardSheetProps = {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  onDismissChange?: (isDismissed: boolean) => void;
  /** Height ratio of screen for card when fully open, e.g. 0.88 */
  heightRatio?: number;
};

export function SlidingCardSheet({
  title,
  subtitle,
  badge,
  headerRight,
  children,
  onDismissChange,
  heightRatio = 0.85,
}: SlidingCardSheetProps) {
  const insets = useSafeAreaInsets();
  const cardHeight = SCREEN_HEIGHT * heightRatio;
  const dismissThreshold = 100;

  // 0 = fully open, cardHeight = fully down
  const translateY = useRef(new Animated.Value(0)).current;
  const [isDismissed, setIsDismissed] = useState(false);

  // PanResponder for dragging the card downward to close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
      onPanResponderMove: (_, gesture) => {
        // Only allow downward drag
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        } else {
          // Add slight rubber-band resistance upward
          translateY.setValue(gesture.dy * 0.15);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > dismissThreshold || gesture.vy > 0.6) {
          // Dismiss card down
          dismissCard();
        } else {
          // Snap back to top
          openCard();
        }
      },
    }),
  ).current;

  const dismissCard = () => {
    Animated.spring(translateY, {
      toValue: cardHeight + 40,
      damping: 24,
      stiffness: 220,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setIsDismissed(true);
      onDismissChange?.(true);
    });
  };

  const openCard = () => {
    setIsDismissed(false);
    onDismissChange?.(false);
    Animated.spring(translateY, {
      toValue: 0,
      damping: 24,
      stiffness: 220,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  return (
    <View style={styles.outerContainer} pointerEvents="box-none">
      {/* Floating Pill when dismissed to reopen */}
      {isDismissed ? (
        <Pressable
          style={[styles.reopenPill, { top: insets.top + 12 }]}
          onPress={openCard}
          accessibilityRole="button"
          accessibilityLabel={`Open ${title} card`}
        >
          <Ionicons name="chevron-up" size={16} color="#FFFFFF" />
          <Text style={styles.reopenText}>{title}</Text>
        </Pressable>
      ) : null}

      {/* Main Draggable Slide-Up Card */}
      <Animated.View
        style={[
          styles.sheet,
          {
            height: cardHeight,
            bottom: 0,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Drag Handle Area */}
        <View {...panResponder.panHandlers} style={styles.dragZone}>
          <View style={styles.dragHandle} />

          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <View style={styles.titleWithBadge}>
                <Text style={styles.titleText}>{title}</Text>
                {badge}
              </View>
              {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
            </View>

            <View style={styles.actionsWrap}>
              {headerRight}
              <Pressable
                onPress={dismissCard}
                hitSlop={12}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Slide down to view map"
              >
                <Ionicons name="chevron-down" size={22} color={MapColors.textSecondary} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Content Body */}
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
    zIndex: 20,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: MapColors.navy,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.14)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.06)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 24,
    overflow: 'hidden',
  },
  dragZone: {
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(10, 31, 53, 0.95)',
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWrap: {
    flex: 1,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitleText: {
    color: MapColors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  actionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentBody: {
    flex: 1,
  },
  reopenPill: {
    position: 'absolute',
    left: 16,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10, 31, 53, 0.92)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  reopenText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
});
