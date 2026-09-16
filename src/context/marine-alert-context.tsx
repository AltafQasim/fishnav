import { Ionicons } from '@expo/vector-icons';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  AlertButton,
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { useAppTheme } from '@/context/theme-context';

export type AlertType = 'info' | 'success' | 'warning' | 'danger' | 'call';

export type MarineAlertOptions = {
  title: string;
  message?: string;
  type?: AlertType;
  buttons?: AlertButton[];
  cancelable?: boolean;
};

type AlertContextType = {
  showAlert: (options: MarineAlertOptions) => void;
  hideAlert: () => void;
};

const MarineAlertContext = createContext<AlertContextType | undefined>(undefined);

// Reference for global Alert.alert delegation
let globalAlertHandler: ((options: MarineAlertOptions) => void) | null = null;

// Helper to auto-detect icon & style from title & message
function detectAlertType(title: string, message: string = '', buttons?: AlertButton[]): AlertType {
  const t = (title + ' ' + message).toLowerCase();
  if (buttons?.some((b) => b.style === 'destructive') || t.includes('delete') || t.includes('sign out') || t.includes('reset') || t.includes('discard') || t.includes('clear')) {
    return 'danger';
  }
  if (t.includes('call') || t.includes('emergency') || t.includes('1554') || t.includes('coast guard')) {
    return 'call';
  }
  if (t.includes('success') || t.includes('saved') || t.includes('updated') || t.includes('verified') || t.includes('created') || t.includes('sent')) {
    return 'success';
  }
  if (t.includes('warning') || t.includes('hazard') || t.includes('error') || t.includes('required') || t.includes('fail') || t.includes('invalid') || t.includes('unavailable')) {
    return 'warning';
  }
  return 'info';
}

export function MarineAlertProvider({ children }: { children: React.ReactNode }) {
  const { colors, isLight } = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth >= 600;

  const [alertState, setAlertState] = useState<MarineAlertOptions | null>(null);

  // Animations
  const animScale = useRef(new Animated.Value(0.92)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;

  const showAlert = useCallback((options: MarineAlertOptions) => {
    setAlertState(options);
    animScale.setValue(0.92);
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
  }, [animScale, animOpacity]);

  const hideAlert = useCallback(() => {
    Animated.parallel([
      Animated.timing(animScale, {
        toValue: 0.94,
        duration: 120,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(animOpacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      setAlertState(null);
    });
  }, [animScale, animOpacity]);

  // Connect global handler
  useEffect(() => {
    globalAlertHandler = showAlert;
    return () => {
      globalAlertHandler = null;
    };
  }, [showAlert]);

  const alertType = alertState
    ? alertState.type || detectAlertType(alertState.title, alertState.message, alertState.buttons)
    : 'info';

  const getAlertIcon = () => {
    switch (alertType) {
      case 'danger':
        return {
          icon: 'alert-circle',
          color: '#EF4444',
          bgColor: 'rgba(239, 68, 68, 0.15)',
          borderColor: 'rgba(239, 68, 68, 0.4)',
        };
      case 'warning':
        return {
          icon: 'warning',
          color: '#F59E0B',
          bgColor: 'rgba(245, 158, 11, 0.15)',
          borderColor: 'rgba(245, 158, 11, 0.4)',
        };
      case 'success':
        return {
          icon: 'checkmark-circle',
          color: '#10B981',
          bgColor: 'rgba(16, 185, 129, 0.15)',
          borderColor: 'rgba(16, 185, 129, 0.4)',
        };
      case 'call':
        return {
          icon: 'call',
          color: '#06B6D4',
          bgColor: 'rgba(6, 182, 212, 0.15)',
          borderColor: 'rgba(6, 182, 212, 0.4)',
        };
      case 'info':
      default:
        return {
          icon: 'information-circle',
          color: colors.accent,
          bgColor: 'rgba(0, 240, 255, 0.15)',
          borderColor: 'rgba(0, 240, 255, 0.4)',
        };
    }
  };

  const iconInfo = getAlertIcon();
  const buttons: AlertButton[] = alertState?.buttons && alertState.buttons.length > 0
    ? alertState.buttons
    : [{ text: 'OK', style: 'default' }];

  return (
    <MarineAlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}

      {/* 🟢 CUSTOM HIGH-TECH MARINE ALERT MODAL */}
      <Modal
        visible={alertState !== null}
        transparent
        animationType="none"
        onRequestClose={() => {
          if (alertState?.cancelable !== false) {
            hideAlert();
          }
        }}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (alertState?.cancelable !== false) {
                hideAlert();
              }
            }}
          />

          <Animated.View
            style={[
              styles.dialogCard,
              {
                backgroundColor: isLight ? '#FFFFFF' : '#041728',
                borderColor: isLight ? '#CBD5E1' : colors.cardBorder,
                maxWidth: isTablet ? 460 : 360,
                transform: [{ scale: animScale }],
                opacity: animOpacity,
              },
            ]}
          >
            {/* Top Indicator Glow */}
            <View
              style={[
                styles.topGlowLine,
                { backgroundColor: iconInfo.color },
              ]}
            />

            {/* Icon Header */}
            <View style={[styles.iconCircle, { backgroundColor: iconInfo.bgColor, borderColor: iconInfo.borderColor }]}>
              <Ionicons name={iconInfo.icon as any} size={28} color={iconInfo.color} />
            </View>

            {/* Title & Message */}
            <View style={styles.textContainer}>
              <Text style={[styles.titleText, { color: colors.text }]}>
                {alertState?.title}
              </Text>
              {alertState?.message ? (
                <Text style={[styles.messageText, { color: colors.textSecondary }]}>
                  {alertState.message}
                </Text>
              ) : null}
            </View>

            {/* Action Buttons Row / Stack */}
            <View
              style={[
                styles.buttonsWrap,
                buttons.length > 2 ? styles.buttonsWrapVertical : styles.buttonsWrapHorizontal,
              ]}
            >
              {buttons.map((btn, index) => {
                const isCancel = btn.style === 'cancel';
                const isDestructive = btn.style === 'destructive';
                const isPrimary = !isCancel && !isDestructive;

                return (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.alertBtn,
                      isCancel && [
                        styles.cancelBtn,
                        {
                          backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.08)',
                          borderColor: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.15)',
                        },
                      ],
                      isDestructive && styles.destructiveBtn,
                      isPrimary && [
                        styles.primaryBtn,
                        {
                          backgroundColor: '#0284C7',
                          borderColor: colors.accent,
                        },
                      ],
                      pressed && styles.btnPressed,
                      buttons.length > 2 && { width: '100%' },
                    ]}
                    onPress={() => {
                      hideAlert();
                      btn.onPress?.();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={btn.text}
                  >
                    <Text
                      style={[
                        styles.btnText,
                        isCancel && [styles.cancelBtnText, { color: colors.textSecondary }],
                        isDestructive && styles.destructiveBtnText,
                        isPrimary && styles.primaryBtnText,
                      ]}
                    >
                      {btn.text}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </MarineAlertContext.Provider>
  );
}

export function useMarineAlert() {
  const context = useContext(MarineAlertContext);
  if (!context) {
    throw new Error('useMarineAlert must be used within a MarineAlertProvider');
  }
  return context;
}

// 🌐 Seamless Global Interception for React Native Alert.alert
const nativeAlert = Alert.alert;

Alert.alert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: { cancelable?: boolean },
) => {
  if (globalAlertHandler) {
    globalAlertHandler({
      title,
      message,
      buttons,
      cancelable: options?.cancelable,
    });
  } else {
    nativeAlert(title, message, buttons, options);
  }
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(2, 11, 20, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 9999,
  },
  dialogCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 22,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 24,
  },
  topGlowLine: {
    position: 'absolute',
    top: 0,
    left: 40,
    right: 40,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 6,
  },
  buttonsWrap: {
    width: '100%',
    gap: 10,
  },
  buttonsWrapHorizontal: {
    flexDirection: 'row',
  },
  buttonsWrapVertical: {
    flexDirection: 'column',
  },
  alertBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  btnPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.88,
  },
  cancelBtn: {
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  destructiveBtn: {
    backgroundColor: '#DC2626',
    borderWidth: 1,
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  destructiveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  primaryBtn: {
    borderWidth: 1.5,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
