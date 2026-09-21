import { Slot, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { LogBox, Platform, StyleSheet, View } from 'react-native';

import { MarineLoginScreen } from '@/components/auth/marine-login-screen';
import { MarineSplashScreen } from '@/components/auth/marine-splash-screen';
import { FishNavProModal } from '@/components/subscription/fishnav-pro-modal';
import { MarineReferralModal } from '@/components/subscription/marine-referral-modal';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { LanguageProvider } from '@/context/language-context';
import { LocationProvider } from '@/context/location-context';
import { MarineAlertProvider } from '@/context/marine-alert-context';
import { OfflineMapProvider } from '@/context/offline-map-context';
import { SubscriptionProvider } from '@/context/subscription-context';
import { AppThemeProvider, useAppTheme } from '@/context/theme-context';
import { TripProvider } from '@/context/trip-context';
import { WaypointsProvider } from '@/context/waypoints-context';

LogBox.ignoreLogs([
  '"shadow*" style props are deprecated. Use "boxShadow".',
  'props.pointerEvents is deprecated. Use style.pointerEvents',
  'Location.watchDeviceHeading: is not supported on web',
  'Animated: `useNativeDriver` is not supported',
]);

if (Platform.OS === 'web' && typeof console !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const first = typeof args[0] === 'string' ? args[0] : '';
    if (
      first.includes('"shadow*" style props are deprecated') ||
      first.includes('props.pointerEvents is deprecated') ||
      first.includes('Location.watchDeviceHeading: is not supported on web') ||
      first.includes('useNativeDriver')
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

SplashScreen.preventAutoHideAsync().catch(() => { });

/**
 * 🛡️ ProtectedAuthGate
 * Restricts the entire application behind marine authentication:
 * - Shows Radar Splash Screen on launch
 * - If user is NOT authenticated, blocks all routes and renders MarineLoginScreen
 * - Completely protects all routes (/trips, /settings, /map, etc.)
 * - Once authenticated, unlocks and renders <Slot />
 */
function ProtectedAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isAuthReady } = useAuth();
  const [splashFinished, setSplashFinished] = useState(false);

  // 1. Initial High-Tech Marine Radar Splash Screen
  if (!splashFinished) {
    return <MarineSplashScreen onFinish={() => setSplashFinished(true)} />;
  }

  // 2. Wait until local storage credentials check finishes
  if (!isAuthReady) {
    return null;
  }

  // 3. 🚨 PROTECTED ROUTE GATE:
  // Without login, user CANNOT view any part of the application!
  if (!isAuthenticated) {
    return (
      <MarineLoginScreen
        onLoginSuccess={() => {
          router.replace('/');
        }}
      />
    );
  }

  // 4. Authenticated: Render protected route content
  return <>{children}</>;
}

function RootContent() {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ProtectedAuthGate>
        <Slot />
        <FishNavProModal />
        <MarineReferralModal />
      </ProtectedAuthGate>
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => { });
  }, []);

  return (
    <AppThemeProvider>
      <LanguageProvider>
        <MarineAlertProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <LocationProvider>
                <WaypointsProvider>
                  <TripProvider>
                    <OfflineMapProvider>
                      <RootContent />
                    </OfflineMapProvider>
                  </TripProvider>
                </WaypointsProvider>
              </LocationProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </MarineAlertProvider>
      </LanguageProvider>
    </AppThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020B14',
  },
});
