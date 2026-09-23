import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLanguage } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';

export type StopNavigationModalProps = {
  visible: boolean;
  destinationName?: string;
  distanceRemaining?: string;
  onCancel: () => void;
  onConfirmStop: () => void;
};

export function StopNavigationModal({
  visible,
  destinationName,
  distanceRemaining,
  onCancel,
  onConfirmStop,
}: StopNavigationModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isLight } = useAppTheme();
  const { t } = useLanguage();
  const { width: windowWidth } = useWindowDimensions();

  const animScale = useRef(new Animated.Value(0.92)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(animOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(animScale, {
          toValue: 1,
          damping: 20,
          stiffness: 260,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      animOpacity.setValue(0);
      animScale.setValue(0.92);
    }
  }, [visible]);

  if (!visible) return null;

  const cardMaxWidth = Math.min(windowWidth - 36, 400);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        {/* Touch dismiss backdrop */}
        <Pressable style={styles.backdropTouch} onPress={onCancel} />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              width: cardMaxWidth,
              opacity: animOpacity,
              transform: [{ scale: animScale }],
              backgroundColor: isLight ? '#FFFFFF' : '#0B1C2D',
              borderColor: isLight ? '#FCA5A5' : 'rgba(239, 68, 68, 0.45)',
              paddingBottom: Math.max(insets.bottom, 16) + 6,
            },
          ]}
        >
          {/* Top Decorative Amber/Red Accent Stripe */}
          <View style={styles.topAlertStripe} />

          {/* 1. Header Icon */}
          <View style={styles.iconCircleOuter}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.18)',
                  borderColor: isLight ? '#FCA5A5' : 'rgba(239, 68, 68, 0.45)',
                },
              ]}
            >
              <MaterialCommunityIcons name="navigation-variant-outline" size={32} color="#EF4444" />
            </View>
          </View>

          {/* 2. Title & Subtitle */}
          <Text style={[styles.title, { color: colors.text }]}>
            {t('nav.stop_title', 'Stop Navigation?')}
          </Text>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('nav.stop_desc', 'Are you sure you want to end active route guidance?')}
          </Text>

          {/* 3. Destination Preview Card if available */}
          {destinationName ? (
            <View
              style={[
                styles.destinationCard,
                {
                  backgroundColor: isLight ? '#F8FAFC' : 'rgba(255, 255, 255, 0.05)',
                  borderColor: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.1)',
                },
              ]}
            >
              <View style={styles.destLeft}>
                <View style={[styles.destDot, { backgroundColor: '#00F0FF' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.destLabel, { color: colors.textMuted }]}>
                    DESTINATION
                  </Text>
                  <Text
                    style={[styles.destName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {destinationName}
                  </Text>
                </View>
              </View>

              {distanceRemaining && distanceRemaining !== '—' && (
                <View
                  style={[
                    styles.distBadge,
                    {
                      backgroundColor: isLight ? '#E0F2FE' : 'rgba(0, 240, 255, 0.15)',
                      borderColor: isLight ? '#BAE6FD' : 'rgba(0, 240, 255, 0.3)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.distBadgeText,
                      { color: isLight ? '#0284C7' : '#00F0FF' },
                    ]}
                  >
                    {distanceRemaining}
                  </Text>
                </View>
              )}
            </View>
          ) : null}

          {/* 4. Action Buttons */}
          <View style={styles.actionRow}>
            {/* Cancel / Resume Button */}
            <Pressable
              onPress={onCancel}
              style={[
                styles.cancelBtn,
                {
                  backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.08)',
                  borderColor: isLight ? '#CBD5E1' : 'rgba(255, 255, 255, 0.15)',
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Keep Navigating"
            >
              <Text style={[styles.cancelBtnText, { color: colors.text }]}>
                {t('nav.keep_navigating', 'Keep Navigating')}
              </Text>
            </Pressable>

            {/* Confirm Stop Button */}
            <Pressable
              onPress={onConfirmStop}
              style={styles.stopBtn}
              accessibilityRole="button"
              accessibilityLabel="Stop Navigation"
            >
              <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.stopBtnText}>
                {t('btn.stop', 'Stop')}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 5, 12, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingTop: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 28,
  },
  topAlertStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#EF4444',
  },
  iconCircleOuter: {
    marginBottom: 14,
  },
  iconCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  destinationCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 18,
    gap: 10,
  },
  destLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  destDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  destLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  destName: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  distBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  distBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  actionRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  stopBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#DC2626',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  stopBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
