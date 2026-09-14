import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
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

import { useAuth } from '@/context/auth-context';

type MarineLoginScreenProps = {
  onLoginSuccess: () => void;
};

type AuthMode = 'login' | 'register';

export function MarineLoginScreen({ onLoginSuccess }: MarineLoginScreenProps) {
  const insets = useSafeAreaInsets();
  const { login, loginAsDemo } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [identifier, setIdentifier] = useState('capt.vikram@fishnav.pro');
  const [password, setPassword] = useState('marine123');
  const [captainName, setCaptainName] = useState('Capt. Vikram Rathore');
  const [vesselName, setVesselName] = useState('Sea Hunter II');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!identifier.trim()) {
      setErrorMsg('Please enter Captain ID, Email or Mobile Number');
      return;
    }

    if (mode === 'register' && !captainName.trim()) {
      setErrorMsg('Please enter Captain / Master Name');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      await login({
        identifier,
        password,
        name: mode === 'register' ? captainName : undefined,
        vesselName: mode === 'register' ? vesselName : undefined,
      });
      onLoginSuccess();
    } catch {
      setErrorMsg('Failed to verify vessel credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      loginAsDemo();
      setIsLoading(false);
      onLoginSuccess();
    }, 400);
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
        {/* Brand Header */}
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
            OFFSHORE MARINE CHARTPLOTTER & NAUTICAL LOGBOOK
          </Text>
        </View>

        {/* Auth Glass Card */}
        <View style={styles.authCard}>
          {/* Mode Switcher Tabs */}
          <View style={styles.tabBar}>
            <Pressable
              style={[styles.tabBtn, mode === 'login' && styles.tabBtnActive]}
              onPress={() => {
                setMode('login');
                setErrorMsg(null);
              }}
            >
              <Ionicons
                name="log-in-outline"
                size={16}
                color={mode === 'login' ? '#00F0FF' : '#94A3B8'}
              />
              <Text style={[styles.tabBtnText, mode === 'login' && styles.tabBtnTextActive]}>
                Vessel Sign In
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tabBtn, mode === 'register' && styles.tabBtnActive]}
              onPress={() => {
                setMode('register');
                setErrorMsg(null);
              }}
            >
              <Ionicons
                name="boat-outline"
                size={16}
                color={mode === 'register' ? '#00F0FF' : '#94A3B8'}
              />
              <Text style={[styles.tabBtnText, mode === 'register' && styles.tabBtnTextActive]}>
                Register Vessel
              </Text>
            </Pressable>
          </View>

          {/* Form Fields */}
          <View style={styles.formWrap}>
            {mode === 'register' && (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>CAPTAIN / MASTER NAME</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="person-outline" size={18} color="#38BDF8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Capt. Vikram Rathore"
                      placeholderTextColor="#64748B"
                      value={captainName}
                      onChangeText={setCaptainName}
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>VESSEL NAME & REGISTRATION</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="boat-outline" size={18} color="#38BDF8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Sea Hunter II (IND-GJ)"
                      placeholderTextColor="#64748B"
                      value={vesselName}
                      onChangeText={setVesselName}
                    />
                  </View>
                </View>
              </>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CAPTAIN ID / EMAIL / MOBILE</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color="#38BDF8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="capt.vikram@fishnav.pro"
                  placeholderTextColor="#64748B"
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>SECURITY PIN / ACCESS KEY</Text>
                {mode === 'login' && (
                  <Pressable
                    onPress={() =>
                      Alert.alert(
                        'Demo Credentials',
                        'Use "capt.vikram@fishnav.pro" and PIN "marine123", or tap "Quick Captain Demo Login" below!',
                      )
                    }
                  >
                    <Text style={styles.forgotText}>Forgot PIN?</Text>
                  </Pressable>
                )}
              </View>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#38BDF8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit PIN or password"
                  placeholderTextColor="#64748B"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <Pressable
                  onPress={() => setShowPassword((prev) => !prev)}
                  hitSlop={10}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#94A3B8"
                  />
                </Pressable>
              </View>
            </View>

            {errorMsg ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Primary Action Button */}
            <Pressable
              style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#0284C7', '#00F0FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#020B14" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="steering" size={20} color="#020B14" />
                    <Text style={styles.submitText}>
                      {mode === 'login' ? 'BOARD VESSEL & LAUNCH MAP' : 'REGISTER & COMMENCE VOYAGE'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR QUICK ACCESS</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* 1-Tap Quick Demo Captain Login */}
            <Pressable
              style={styles.demoBtn}
              onPress={handleDemoLogin}
              disabled={isLoading}
            >
              <Ionicons name="flash" size={16} color="#FBBF24" />
              <View style={styles.demoTextWrap}>
                <Text style={styles.demoTitle}>QUICK CAPTAIN ACCESS (DEMO)</Text>
                <Text style={styles.demoSub}>Capt. Vikram Rathore • Sea Hunter II</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#38BDF8" />
            </Pressable>
          </View>
        </View>

        {/* Offline Assurance Card */}
        <View style={styles.offlineNotice}>
          <Ionicons name="shield-checkmark" size={16} color="#10B981" />
          <Text style={styles.offlineText}>
            100% Offline Capable • Nautical charts & waypoints cache locally for open-ocean operations.
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
    ...StyleSheet.absoluteFillObject,
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
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 12,
  },
  logoBadgeInner: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00F0FF',
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandPro: {
    color: '#00F0FF',
    fontWeight: '900',
  },
  brandTagline: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 4,
    textAlign: 'center',
  },
  authCard: {
    backgroundColor: 'rgba(10, 31, 53, 0.85)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(4, 23, 40, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 14,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.18)',
    borderBottomWidth: 2.5,
    borderBottomColor: '#00F0FF',
  },
  tabBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#00F0FF',
    fontWeight: '800',
  },
  formWrap: {
    padding: 20,
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  forgotText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(4, 23, 40, 0.8)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 12,
  },
  eyeBtn: {
    padding: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  submitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  submitText: {
    color: '#020B14',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  demoTextWrap: {
    flex: 1,
  },
  demoTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  demoSub: {
    color: '#38BDF8',
    fontSize: 11,
    marginTop: 2,
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 12,
    marginTop: 16,
  },
  offlineText: {
    color: '#A7F3D0',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  footerWrap: {
    alignItems: 'center',
    marginTop: 16,
  },
  footerVersion: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
});
