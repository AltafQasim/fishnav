import { DarkTheme, ThemeProvider } from 'expo-router';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { MapColors } from '@/constants/map-theme';
import { LocationProvider } from '@/context/location-context';
import { WaypointsProvider } from '@/context/waypoints-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <LocationProvider>
        <WaypointsProvider>
          <View style={styles.root}>
            <AnimatedSplashOverlay />
            <Slot />
          </View>
        </WaypointsProvider>
      </LocationProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: MapColors.navy,
  },
});
