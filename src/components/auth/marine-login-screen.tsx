import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GoogleLogoSvg } from '@/components/ui/google-logo-svg';
import { useAuth } from '@/context/auth-context';
import { useSubscription } from '@/context/subscription-context';

type MarineLoginScreenProps = {
  onLoginSuccess: () => void;
};

type PhoneStep = 'phone' | 'otp';

export function MarineLoginScreen({ onLoginSuccess }: MarineLoginScreenProps) {
  const insets = useSafeAreaInsets();
  const { loginWithPhone, loginWithGoogle, loginAsDemo } = useAuth();
  const { applyReferralCode } = useSubscription();

  // Mobile Auth state
  const [step, setStep] = useState<PhoneStep>('phone');
  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingPhone, setIsLoadingPhone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // OTP Countdown timer
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    let timer: any;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Google Login Handler
  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setIsLoadingGoogle(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600)); // Smooth UX transition
      await loginWithGoogle({
        name: 'Capt. Vikram Rathore',
        email: 'capt.vikram@gmail.com',
      });
      if (referralCode.trim()) {
        applyReferralCode(referralCode.trim());
      }
      onLoginSuccess();
    } catch {
      setErrorMsg('Google Sign-In failed. Please try again.');
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  // Mobile Step 1: Send OTP
  const handleSendOtp = () => {
    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }

    setErrorMsg(null);
    setIsLoadingPhone(true);

    setTimeout(() => {
      setIsLoadingPhone(false);
      setStep('otp');
      setCountdown(30);
      setOtp('1234'); // Pre-fill mock OTP for effortless user testing
    }, 500);
  };

  // Mobile Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.trim().length < 4) {
      setErrorMsg('Please enter the 4-digit verification code');
      return;
    }

    setErrorMsg(null);
    setIsLoadingPhone(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await loginWithPhone(
        `+91 ${phone.replace(/\D/g, '').slice(-10)}`,
        'Capt. Vikram Rathore',
        'Sea Hunter II',
      );
      if (referralCode.trim()) {
        applyReferralCode(referralCode.trim());
      }
      onLoginSuccess();
    } catch {
      setErrorMsg('Verification failed. Please try again.');
    } finally {
      setIsLoadingPhone(false);
    }
  };

  // Resend OTP
  const handleResendOtp = () => {
    if (countdown > 0) return;
    setCountdown(30);
    setOtp('1234');
    Alert.alert('OTP Sent', `New verification code 1234 sent to +91 ${phone}`);
  };

  // 1-Tap Offline Demo Login
  const handleDemoLogin = () => {
    setIsLoadingPhone(true);
    setTimeout(() => {
      loginAsDemo();
      setIsLoadingPhone(false);
      onLoginSuccess();
    }, 350);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <LinearGradient
        colors={['#020B14', '#041728', '#010A14']}
        style={StyleSheet.absoluteFill}
      />

      {/* Nautical Grid Lines Background */}
      <View style={styles.gridLines} pointerEvents="none">
        <View style={styles.gridLineH1} />
        <View style={styles.gridLineH2} />
        <View style={styles.gridLineV1} />
        <View style={styles.gridLineV2} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 24) + 12,
            paddingBottom: Math.max(insets.bottom, 24) + 16,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Logo Header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <LinearGradient
              colors={['#0284C7', '#0369A1']}
              style={styles.logoBadgeInner}
            >
              <MaterialCommunityIcons name="sail-boat" size={32} color="#00F0FF" />
            </LinearGradient>
          </View>

          <Text style={styles.brandName}>
            FISHNAV<Text style={styles.brandPro}> PRO</Text>
          </Text>

          <Text style={styles.brandTagline}>
            OFFSHORE MARINE CHARTPLOTTER & NAUTICAL NAVIGATION
          </Text>
        </View>

        {/* Auth Glass Card */}
        <View style={styles.authCard}>
          {/* Card Title Banner */}
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="shield-account" size={22} color="#00F0FF" />
            <Text style={styles.cardTitle}>CAPTAIN & VESSEL SIGN IN</Text>
          </View>

          {/* 1. GOOGLE LOGIN BUTTON (Top Primary Action) */}
          <Pressable
            style={[styles.googleBtn, isLoadingGoogle && styles.btnDisabled]}
            onPress={handleGoogleLogin}
            disabled={isLoadingGoogle || isLoadingPhone}
          >
            {isLoadingGoogle ? (
              <ActivityIndicator color="#020B14" size="small" />
            ) : (
              <>
                <View style={styles.googleIconBox}>
                  <GoogleLogoSvg size={20} />
                </View>
                <View style={styles.googleTextWrap}>
                  <Text style={styles.googleBtnText}>Continue with Google</Text>
                  <Text style={styles.googleBtnSub}>Fast 1-Tap Marine Sign-In</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color="#020B14" />
              </>
            )}
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR LOGIN WITH MOBILE NUMBER</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* 2. MOBILE NUMBER LOGIN FLOW */}
          {step === 'phone' ? (
            <View style={styles.formWrap}>
              {/* Phone Input */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>CAPTAIN MOBILE NUMBER</Text>
                <View style={styles.phoneInputRow}>
                  {/* Country Code Pill */}
                  <View style={styles.countryCodePill}>
                    <Text style={styles.flagEmoji}>🇮🇳</Text>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>

                  {/* Number Input */}
                  <View style={styles.phoneInputWrap}>
                    <Ionicons name="call-outline" size={18} color="#38BDF8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="98765 43210"
                      placeholderTextColor="#64748B"
                      value={phone}
                      onChangeText={(val) => setPhone(val.replace(/\D/g, ''))}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>
                </View>
              </View>

              {/* Referral Code Field (Optional: Get 10 Days Free Pro) */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldLabelRow}>
                  <Text style={styles.fieldLabel}>CAPTAIN REFERRAL CODE (OPTIONAL)</Text>
                  <View style={styles.proRewardBadge}>
                    <Ionicons name="gift" size={11} color="#22C55E" />
                    <Text style={styles.proRewardBadgeText}>+10 DAYS FREE PRO</Text>
                  </View>
                </View>
                <View style={styles.inputWrap}>
                  <Ionicons name="ticket-outline" size={18} color="#22C55E" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { letterSpacing: referralCode ? 1.2 : 0 }]}
                    placeholder="e.g. NAV-GJ8821"
                    placeholderTextColor="#64748B"
                    value={referralCode}
                    onChangeText={(val) => setReferralCode(val.toUpperCase())}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                  {referralCode.length > 0 && (
                    <Pressable
                      onPress={() => setReferralCode('')}
                      hitSlop={8}
                      style={styles.inputClearBtn}
                    >
                      <Ionicons name="close-circle" size={16} color="#64748B" />
                    </Pressable>
                  )}
                </View>
                <Text style={styles.referralHint}>
                  Have a fellow Captain&apos;s invite code? Enter it to get 10 days of free Pro access on sign-up!
                </Text>
              </View>

              {/* Error box */}
              {errorMsg && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {/* Get OTP Button */}
              <Pressable
                style={[styles.submitBtn, isLoadingPhone && styles.btnDisabled]}
                onPress={handleSendOtp}
                disabled={isLoadingPhone || isLoadingGoogle}
              >
                <LinearGradient
                  colors={['#0284C7', '#00F0FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  {isLoadingPhone ? (
                    <ActivityIndicator color="#020B14" size="small" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="cellphone-message" size={20} color="#020B14" />
                      <Text style={styles.submitText}>GET VERIFICATION OTP</Text>
                      <Ionicons name="arrow-forward" size={18} color="#020B14" />
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          ) : (
            /* STEP 2: OTP VERIFICATION */
            <View style={styles.formWrap}>
              {/* OTP Info Card */}
              <View style={styles.otpBanner}>
                <View style={styles.otpBannerIcon}>
                  <Ionicons name="shield-checkmark" size={22} color="#00F0FF" />
                </View>
                <View style={styles.otpBannerTextWrap}>
                  <Text style={styles.otpBannerTitle}>Enter Verification Code</Text>
                  <Text style={styles.otpBannerSub}>
                    Sent to <Text style={styles.phoneHighlight}>+91 {phone}</Text>
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    setStep('phone');
                    setErrorMsg(null);
                  }}
                  hitSlop={10}
                  style={styles.changePhoneBtn}
                >
                  <Text style={styles.changePhoneText}>Change</Text>
                </Pressable>
              </View>

              {/* OTP Input */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>4-DIGIT VERIFICATION CODE</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="key-outline" size={18} color="#00F0FF" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="1 2 3 4"
                    placeholderTextColor="#64748B"
                    value={otp}
                    onChangeText={(v) => setOtp(v.replace(/\D/g, ''))}
                    keyboardType="number-pad"
                    maxLength={4}
                    autoFocus
                  />
                </View>
              </View>

              {/* Auto-fill demo badge */}
              <Pressable
                style={styles.mockOtpBadge}
                onPress={() => setOtp('1234')}
              >
                <Ionicons name="sparkles" size={14} color="#FBBF24" />
                <Text style={styles.mockOtpText}>
                  Demo Auto-fill OTP: <Text style={styles.otpBold}>1234</Text> (Tap to fill)
                </Text>
              </Pressable>

              {/* Resend Countdown */}
              <View style={styles.resendRow}>
                {countdown > 0 ? (
                  <Text style={styles.resendTimerText}>
                    Resend code in <Text style={styles.resendTimerCount}>{countdown}s</Text>
                  </Text>
                ) : (
                  <Pressable onPress={handleResendOtp}>
                    <Text style={styles.resendBtnText}>Resend OTP Code</Text>
                  </Pressable>
                )}
              </View>

              {/* Error box */}
              {errorMsg && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {/* Verify & Launch Button */}
              <Pressable
                style={[styles.submitBtn, isLoadingPhone && styles.btnDisabled]}
                onPress={handleVerifyOtp}
                disabled={isLoadingPhone || isLoadingGoogle}
              >
                <LinearGradient
                  colors={['#0284C7', '#00F0FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  {isLoadingPhone ? (
                    <ActivityIndicator color="#020B14" size="small" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="steering" size={20} color="#020B14" />
                      <Text style={styles.submitText}>VERIFY & BOARD VESSEL</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          )}

          {/* Quick Demo Bypass */}
          <View style={styles.demoDividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR INSTANT PREVIEW</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            style={styles.demoBtn}
            onPress={handleDemoLogin}
            disabled={isLoadingPhone || isLoadingGoogle}
          >
            <Ionicons name="flash" size={16} color="#FBBF24" />
            <View style={styles.demoTextWrap}>
              <Text style={styles.demoTitle}>QUICK CAPTAIN ACCESS (DEMO)</Text>
              <Text style={styles.demoSub}>Capt. Vikram Rathore • Sea Hunter II</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#38BDF8" />
          </Pressable>
        </View>

        {/* Offline Assurance Card */}
        <View style={styles.offlineNotice}>
          <Ionicons name="shield-checkmark" size={16} color="#10B981" />
          <Text style={styles.offlineText}>
            100% Offline Marine Ready • High-res coastal charts cache locally for open-ocean voyages.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footerWrap}>
          <Text style={styles.footerVersion}>
            FishNav Pro v2.4 • Marine Bathymetry & Chartplotter System
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020B14',
  },
  gridLines: {
    ...StyleSheet.absoluteFill,
    opacity: 0.12,
  },
  gridLineH1: {
    position: 'absolute',
    top: '25%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#38BDF8',
  },
  gridLineH2: {
    position: 'absolute',
    top: '75%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#38BDF8',
  },
  gridLineV1: {
    position: 'absolute',
    left: '20%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#38BDF8',
  },
  gridLineV2: {
    position: 'absolute',
    right: '20%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#38BDF8',
  },
  scrollContent: {
    paddingHorizontal: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    padding: 3,
    marginBottom: 12,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 12,
  },
  logoBadgeInner: {
    width: '100%',
    height: '100%',
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  brandPro: {
    color: '#00F0FF',
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 1.2,
    marginTop: 4,
    textAlign: 'center',
  },
  authCard: {
    backgroundColor: 'rgba(4, 23, 40, 0.95)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.7,
    shadowRadius: 24,
    elevation: 20,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 18,
  },
  cardTitle: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    gap: 12,
  },
  googleIconBox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleTextWrap: {
    flex: 1,
  },
  googleBtnText: {
    color: '#020B14',
    fontSize: 15,
    fontWeight: '800',
  },
  googleBtnSub: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 10,
  },
  demoDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 12,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  formWrap: {
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginLeft: 2,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  countryCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  flagEmoji: {
    fontSize: 16,
  },
  countryCodeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  phoneInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 12,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 12,
  },
  otpInput: {
    fontSize: 20,
    letterSpacing: 8,
    fontWeight: '800',
    textAlign: 'center',
    color: '#00F0FF',
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  proRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
    gap: 4,
  },
  proRewardBadgeText: {
    color: '#22C55E',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  referralHint: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  inputClearBtn: {
    paddingHorizontal: 8,
  },
  otpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.4)',
    padding: 12,
    gap: 10,
  },
  otpBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBannerTextWrap: {
    flex: 1,
  },
  otpBannerTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  otpBannerSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  phoneHighlight: {
    color: '#00F0FF',
    fontWeight: '700',
  },
  changePhoneBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  changePhoneText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  mockOtpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  mockOtpText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '600',
  },
  otpBold: {
    fontWeight: '900',
    color: '#FFFFFF',
  },
  resendRow: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  resendTimerText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  resendTimerCount: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  resendBtnText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  submitBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    marginTop: 4,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  submitText: {
    color: '#020B14',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  demoTextWrap: {
    flex: 1,
  },
  demoTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  demoSub: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 18,
    gap: 10,
  },
  offlineText: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    lineHeight: 15,
  },
  footerWrap: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerVersion: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '600',
  },
});
