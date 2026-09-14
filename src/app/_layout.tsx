import { DarkTheme, ThemeProvider } from 'expo-router';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { MapColors } from '@/constants/map-theme';
import { AuthProvider } from '@/context/auth-context';
import { LocationProvider } from '@/context/location-context';
import { TripProvider } from '@/context/trip-context';
import { WaypointsProvider } from '@/context/waypoints-context';

SplashScreen.preventAutoHideAsync().catch(() => {});

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
                <Slot />
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
