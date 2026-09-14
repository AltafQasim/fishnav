import { DarkTheme, ThemeProvider } from 'expo-router';
import { Slot, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { MarineLoginScreen } from '@/components/auth/marine-login-screen';
import { MarineSplashScreen } from '@/components/auth/marine-splash-screen';
import { MapColors } from '@/constants/map-theme';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { LocationProvider } from '@/context/location-context';
import { TripProvider } from '@/context/trip-context';
import { WaypointsProvider } from '@/context/waypoints-context';

SplashScreen.preventAutoHideAsync().catch(() => {});

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

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <ThemeProvider value={DarkTheme}>
      <AuthProvider>
        <LocationProvider>
          <WaypointsProvider>
            <TripProvider>
              <View style={styles.root}>
                <ProtectedAuthGate>
                  <Slot />
                </ProtectedAuthGate>
              </View>
            </TripProvider>
          </WaypointsProvider>
        </LocationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: MapColors.navy,
  },
});
