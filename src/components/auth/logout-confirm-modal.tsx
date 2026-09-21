import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';
import { useTripTracking } from '@/context/trip-context';
import { useWaypoints } from '@/context/waypoints-context';

export type LogoutConfirmModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function LogoutConfirmModal({ visible, onClose, onConfirm }: LogoutConfirmModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isLight } = useAppTheme();
  const { t } = useLanguage();
  const { captain } = useAuth();
  const { waypoints } = useWaypoints();
  const { savedTrips } = useTripTracking();
  const { width: windowWidth } = useWindowDimensions();

  const [isDeparting, setIsDeparting] = useState(false);

  // Animations
  const animScale = useRef(new Animated.Value(0.9)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setIsDeparting(false);
      animScale.setValue(0.9);
      animOpacity.setValue(0);

      Animated.parallel([
        Animated.spring(animScale, {
          toValue: 1,
          friction: 7,
          tension: 80,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(animOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();

      // Gentle beacon pulse on the icon
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.12,
            duration: 1200,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
      pulseLoop.start();

      return () => {
        pulseLoop.stop();
      };
    }
  }, [visible, animScale, animOpacity, pulseAnim]);

  const handleClose = () => {
    if (isDeparting) return;
    Animated.parallel([
      Animated.timing(animScale, {
        toValue: 0.92,
        duration: 120,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(animOpacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleSignOutPress = () => {
    if (isDeparting) return;
    setIsDeparting(true);
    // Smooth transition feedback before firing departure
    setTimeout(() => {
      onConfirm();
    }, 450);
  };

  if (!visible) return null;

  const captainName = captain?.name || 'Vessel Master';
  const vesselName = captain?.vesselName || 'Sea Hunter II';
  const callSign = captain?.callSign || 'VHF-16';
  const spotCount = waypoints.length;
  const tripCount = savedTrips.length;

  const cardMaxWidth = Math.min(windowWidth - 32, 440);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        {/* Backdrop dismiss touch */}
        <Pressable style={styles.backdropTouch} onPress={handleClose} />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              width: cardMaxWidth,
              opacity: animOpacity,
              transform: [{ scale: animScale }],
              backgroundColor: isLight ? '#FFFFFF' : '#031120',
              borderColor: isLight ? '#E2E8F0' : 'rgba(239, 68, 68, 0.35)',
              paddingBottom: Math.max(insets.bottom, 16) + 12,
            },
          ]}
        >
          {/* Top Decorative Alert Stripe */}
          <View style={styles.topAlertStripe} />

          {/* Close X Button */}
          <Pressable
            style={[styles.closeButton, { backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.08)' }]}
            onPress={handleClose}
            hitSlop={12}
            disabled={isDeparting}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </Pressable>

          {/* Icon Badge with Pulsing Glow */}
          <View style={styles.heroSection}>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseAnim }],
                  borderColor: isLight ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.35)',
                },
              ]}
            />
            <View
              style={[
                styles.iconBubble,
                {
                  backgroundColor: isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.15)',
                  borderColor: isLight ? '#FCA5A5' : 'rgba(239, 68, 68, 0.5)',
                },
              ]}
            >
              <MaterialCommunityIcons name="sail-boat" size={32} color="#EF4444" />
              <View style={styles.badgeSubIcon}>
                <Ionicons name="log-out" size={13} color="#FFFFFF" />
              </View>
            </View>

            {/* Maritime Tag */}
            <View
              style={[
                styles.tagPill,
                {
                  backgroundColor: isLight ? '#FEF2F2' : 'rgba(239, 68, 68, 0.12)',
                  borderColor: isLight ? '#FECACA' : 'rgba(239, 68, 68, 0.3)',
                },
              ]}
            >
              <View style={styles.redDot} />
              <Text style={styles.tagText}>MARITIME CONSOLE DEPARTURE</Text>
            </View>

            <Text style={[styles.titleText, { color: colors.text }]}>
              {t('auth.logout_title', 'Sign Out, Captain?')}
            </Text>
            <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
              {t('auth.logout_sub', 'You are disconnecting your active marine terminal session.')}
            </Text>
          </View>

          {/* Captain & Vessel Identity Card */}
          <View
            style={[
              styles.captainPillCard,
              {
                backgroundColor: isLight ? '#F8FAFC' : 'rgba(4, 23, 40, 0.95)',
                borderColor: isLight ? '#E2E8F0' : 'rgba(0, 240, 255, 0.18)',
              },
            ]}
          >
            <View style={styles.captainAvatarCircle}>
              <MaterialCommunityIcons name="steering" size={20} color="#00F0FF" />
            </View>
            <View style={styles.captainInfoBlock}>
              <Text style={[styles.captainName, { color: colors.text }]} numberOfLines={1}>
                {captainName}
              </Text>
              <Text style={[styles.vesselSub, { color: colors.textSecondary }]} numberOfLines={1}>
                🚤 {vesselName} • <Text style={{ color: '#00F0FF' }}>{callSign}</Text>
              </Text>
            </View>
            <View style={styles.sessionStatusChip}>
              <View style={styles.statusLiveDot} />
              <Text style={styles.statusLiveText}>LOGGED IN</Text>
            </View>
          </View>

          {/* Reassurance Checklist / Key Safety Points */}
          <View style={styles.checklistCard}>
            <View style={styles.checkItem}>
              <View style={[styles.checkIconBox, { backgroundColor: isLight ? '#DCFCE7' : 'rgba(34, 197, 94, 0.15)' }]}>
                <Ionicons name="shield-checkmark" size={15} color="#22C55E" />
              </View>
              <View style={styles.checkTextCol}>
                <Text style={[styles.checkTitle, { color: colors.text }]}>
                  Offline Data 100% Safe
                </Text>
                <Text style={[styles.checkDesc, { color: colors.textSecondary }]}>
                  {t('auth.safe_return', 'All saved waypoints, offline charts, and recorded voyages are securely preserved.')}
                </Text>
              </View>
            </View>

            <View style={styles.checkItem}>
              <View style={[styles.checkIconBox, { backgroundColor: isLight ? '#FEF3C7' : 'rgba(245, 158, 11, 0.15)' }]}>
                <Ionicons name="pause" size={14} color="#F59E0B" />
              </View>
              <View style={styles.checkTextCol}>
                <Text style={[styles.checkTitle, { color: colors.text }]}>
                  Tracking & Alarms Paused
                </Text>
                <Text style={[styles.checkDesc, { color: colors.textSecondary }]}>
                  Active voyage recording and shallow water alarms will be safely halted until you reconnect.
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {/* Primary Action: Stay On Board */}
            <Pressable
              style={({ pressed }) => [
                styles.primaryStayBtn,
                { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] },
              ]}
              onPress={handleClose}
              disabled={isDeparting}
            >
              <Ionicons name="boat" size={18} color="#020B14" />
              <View style={styles.btnTextGroup}>
                <Text style={styles.primaryStayBtnText}>{t('auth.cancel', 'Stay On Board')}</Text>
                <Text style={styles.primaryStayBtnSub}>Keep charts & navigation active</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#020B14" />
            </Pressable>

            {/* Secondary Action: Confirm Sign Out */}
            <Pressable
              style={({ pressed }) => [
                styles.destructiveSignOutBtn,
                {
                  backgroundColor: isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.12)',
                  borderColor: isLight ? '#FCA5A5' : 'rgba(239, 68, 68, 0.4)',
                  opacity: isDeparting ? 0.7 : pressed ? 0.85 : 1,
                  transform: [{ scale: pressed && !isDeparting ? 0.99 : 1 }],
                },
              ]}
              onPress={handleSignOutPress}
              disabled={isDeparting}
            >
              {isDeparting ? (
                <View style={styles.departingRow}>
                  <ActivityIndicator size="small" color="#EF4444" />
                  <Text style={styles.departingText}>Disembarking Console...</Text>
                </View>
              ) : (
                <View style={styles.departingRow}>
                  <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                  <Text style={styles.destructiveSignOutText}>{t('auth.confirm_logout', 'Sign Out & Lock Console')}</Text>
                </View>
              )}
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
    backgroundColor: 'rgba(2, 11, 20, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
      },
    }),
  },
  backdropTouch: {
    ...StyleSheet.absoluteFill,
  },
  modalContainer: {
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
    paddingTop: 18,
    paddingHorizontal: 20,
  },
  topAlertStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#EF4444',
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  pulseRing: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2,
    top: -6,
  },
  iconBubble: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  badgeSubIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#020B14',
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    marginBottom: 8,
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.8,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 10,
  },
  captainPillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 14,
  },
  captainAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captainInfoBlock: {
    flex: 1,
  },
  captainName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  vesselSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  sessionStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
    gap: 5,
  },
  statusLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#22C55E',
  },
  statusLiveText: {
    color: '#22C55E',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  checklistCard: {
    gap: 10,
    marginBottom: 18,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkTextCol: {
    flex: 1,
  },
  checkTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  checkDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  actionsContainer: {
    gap: 10,
  },
  primaryStayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00F0FF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: '#00F0FF',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  btnTextGroup: {
    flex: 1,
  },
  primaryStayBtnText: {
    color: '#020B14',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  primaryStayBtnSub: {
    color: 'rgba(2, 11, 20, 0.7)',
    fontSize: 10,
    fontWeight: '600',
  },
  destructiveSignOutBtn: {
    borderRadius: 14,
    borderWidth: 1.2,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  departingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  destructiveSignOutText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  departingText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
});
