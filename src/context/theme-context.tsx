import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { createContext, useContext, useMemo, useState } from 'react';

export type AppThemeId = 'high-contrast' | 'light';

export type AppThemeColors = {
  surfaceSubtle?: string;
  border?: string;
  id: AppThemeId;
  name: string;
  tag: string;
  desc: string;
  background: string;
  surface: string;
  surfaceHeader: string;
  card: string;
  cardBorder: string;
  accent: string;
  accentSoft: string;
  accentGradient: [string, string];
  text: string;
  textSecondary: string;
  textMuted: string;
  divider: string;
  mapStyle?: 'marine' | 'night' | 'standard';
  statusBar: 'light' | 'dark';
  navBarFill: string;
  navBarBorder: string;
  searchBarBg: string;
  searchBarBorder: string;
  sheetBg: string;
  sheetHeaderBg: string;
  sheetBorder: string;
  chipBg: string;
  chipBorder: string;
  iconBg: string;
};

export const APP_THEMES: Record<AppThemeId, AppThemeColors> = {
  'high-contrast': {
    id: 'high-contrast',
    name: 'High Contrast',
    tag: 'OCEANIC NEON',
    desc: 'Current signature marine look: deep abyss, vibrant neon cyan accents & maximum water visibility',
    background: '#020B14',
    surface: '#00162B',
    surfaceHeader: '#0A1F35',
    card: '#041728',
    cardBorder: 'rgba(0, 240, 255, 0.35)',
    accent: '#00F0FF',
    accentSoft: 'rgba(0, 240, 255, 0.15)',
    accentGradient: ['#00F0FF', '#0284C7'],
    text: '#FFFFFF',
    textSecondary: '#94A3B8',
    textMuted: '#5E7A90',
    divider: 'rgba(0, 240, 255, 0.18)',
    mapStyle: 'marine',
    statusBar: 'light',
    navBarFill: '#00162B',
    navBarBorder: 'rgba(0, 240, 255, 0.35)',
    searchBarBg: 'rgba(4, 23, 40, 0.95)',
    searchBarBorder: 'rgba(0, 240, 255, 0.35)',
    sheetBg: '#00162B',
    sheetHeaderBg: '#0A1F35',
    sheetBorder: 'rgba(0, 240, 255, 0.35)',
    chipBg: 'rgba(0, 240, 255, 0.12)',
    chipBorder: 'rgba(0, 240, 255, 0.3)',
    iconBg: 'rgba(0, 240, 255, 0.15)',
  },
  'light': {
    id: 'light',
    name: 'Light Mode',
    tag: 'DAYLIGHT NAUTICAL',
    desc: 'Crisp, high-luminance white & daylight charts built to cut through bright outdoor sunlight',
    background: '#F1F5F9',
    surface: '#FFFFFF',
    surfaceHeader: '#F8FAFC',
    card: '#FFFFFF',
    cardBorder: '#E2E8F0',
    accent: '#0284C7',
    accentSoft: 'rgba(2, 132, 199, 0.12)',
    accentGradient: ['#0284C7', '#0369A1'],
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    divider: '#E2E8F0',
    mapStyle: 'standard',
    statusBar: 'dark',
    navBarFill: '#FFFFFF',
    navBarBorder: '#CBD5E1',
    searchBarBg: 'rgba(255, 255, 255, 0.96)',
    searchBarBorder: '#CBD5E1',
    sheetBg: '#FFFFFF',
    sheetHeaderBg: '#F8FAFC',
    sheetBorder: '#E2E8F0',
    chipBg: 'rgba(2, 132, 199, 0.08)',
    chipBorder: 'rgba(2, 132, 199, 0.2)',
    iconBg: 'rgba(2, 132, 199, 0.1)',
  },
};

type ThemeContextType = {
  theme: AppThemeId;
  activeTheme: AppThemeId;
  colors: AppThemeColors;
  setTheme: (theme: AppThemeId) => void;
  isHighContrast: boolean;
  isDark: boolean;
  isLight: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'high-contrast',
  activeTheme: 'high-contrast',
  colors: APP_THEMES['high-contrast'],
  setTheme: () => { },
  isHighContrast: true,
  isDark: false,
  isLight: false,
});

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  // Default is 'high-contrast' to preserve the signature marine aesthetic
  const [theme, setTheme] = useState<AppThemeId>('high-contrast');

  const colors = APP_THEMES[theme] || APP_THEMES['high-contrast'];
  const isHighContrast = theme === 'high-contrast';
  const isDark = false;
  const isLight = theme === 'light';

  const navTheme = isLight ? DefaultTheme : DarkTheme;

  const value = useMemo(
    () => ({
      theme,
      activeTheme: theme,
      colors,
      setTheme,
      isHighContrast,
      isDark,
      isLight,
    }),
    [theme, colors, isHighContrast, isLight]
  );

  return (
    <ThemeContext.Provider value={value}>
      <NavThemeProvider value={navTheme}>
        <StatusBar style={colors.statusBar} />
        {children}
      </NavThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
