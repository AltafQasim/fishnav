import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { MapColors } from '@/constants/map-theme';

// Sits at 75% of the screen as requested, leaving top 25% to preview live marine map
export const DEFAULT_SHEET_HEIGHT = Math.round(Dimensions.get('window').height * 0.75);

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
  // 75% of the screen height
  const height = customHeight ?? Math.round(windowHeight * 0.75);

  const translateY = useRef(new Animated.Value(height + 40)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const heightRef = useRef(height);
  heightRef.current = height;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Animate open whenever isOpen becomes true
  useEffect(() => {
    if (isOpen) {
      translateY.setValue(height + 40);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 22,
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
  }, [isOpen, height, translateY, backdropOpacity]);

  const handleDismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: heightRef.current + 40,
        duration: 160,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      onCloseRef.current();
    });
  }, [translateY, backdropOpacity]);

  // Pan gesture for dragging down on the header to close
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
          translateY.setValue(g.dy * 0.1);
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 60 || g.vy > 0.4) {
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
      {/* Dimmed Background Overlay with tap-to-dismiss */}
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
          accessibilityLabel="Close tab and return to map"
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            height,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Top Drag Handle & Header */}
        <View {...panResponder.panHandlers} style={styles.dragZone}>
          <View style={styles.dragHandle} />

          <View style={styles.headerRow}>
            <View style={styles.titleInfo}>
              <View style={styles.titleWithBadge}>
                <Text style={styles.titleText}>{title}</Text>
                {badge}
              </View>
              {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
            </View>

            <View style={styles.actionsWrap}>
              {headerRight}
              <Pressable
                onPress={handleDismiss}
                hitSlop={14}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close sheet and view full map"
              >
                <Ionicons name="chevron-down" size={20} color={MapColors.textSecondary} />
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 60,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 14, 28, 0.55)',
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
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 25,
    overflow: 'hidden',
  },
  dragZone: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(10, 31, 53, 0.96)',
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    alignSelf: 'center',
    marginBottom: 6,
  },
  headerRow: {
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
    fontSize: 17,
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentBody: {
    flex: 1,
  },
});
