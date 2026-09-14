import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { TideChart } from '@/components/weather/tide-chart';
import { MapColors } from '@/constants/map-theme';

export function WeatherSheetContent() {
  const hourlyData = [
    { hour: 'Now', temp: '29°', wind: '14 kts', wave: '1.2m', icon: 'weather-sunny' },
    { hour: '15:00', temp: '29°', wind: '15 kts', wave: '1.3m', icon: 'weather-partly-cloudy' },
    { hour: '18:00', temp: '28°', wind: '12 kts', wave: '1.1m', icon: 'weather-sunset' },
    { hour: '21:00', temp: '27°', wind: '10 kts', wave: '0.9m', icon: 'weather-night' },
    { hour: '00:00', temp: '26°', wind: '9 kts', wave: '0.8m', icon: 'weather-night' },
    { hour: '03:00', temp: '25°', wind: '8 kts', wave: '0.8m', icon: 'weather-night' },
    { hour: '06:00', temp: '26°', wind: '11 kts', wave: '1.0m', icon: 'weather-sunset-up' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: 110 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Coastal Safety Advisory */}
      <View style={styles.advisoryBanner}>
        <Ionicons name="shield-checkmark" size={18} color="#22C55E" />
        <View style={styles.advisoryInfo}>
          <Text style={styles.advisoryTitle}>COASTAL SAFETY ADVISORY: NORMAL</Text>
          <Text style={styles.advisorySub}>
            Sea state suitable for nearshore & deep sea fishing. Swell height 1.0 - 1.4m.
          </Text>
        </View>
      </View>

      {/* Ocean & Sea Conditions Grid */}
      <Text style={styles.sectionTitle}>OCEAN & SEA CONDITIONS</Text>
      <View style={styles.grid}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="wave" size={16} color="#38BDF8" />
            <Text style={styles.cardLabel}>WAVE & SWELL</Text>
          </View>
          <Text style={styles.cardValue}>1.2 <Text style={styles.cardUnit}>m</Text></Text>
          <Text style={styles.cardSub}>Period: 7.2s • Swell: SSW</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="wind" size={16} color="#F59E0B" />
            <Text style={styles.cardLabel}>WIND (SOG)</Text>
          </View>
          <Text style={styles.cardValue}>14 <Text style={styles.cardUnit}>kts</Text></Text>
          <Text style={styles.cardSub}>WSW 245° • Force 4</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="coolant-temperature" size={16} color="#06B6D4" />
            <Text style={styles.cardLabel}>WATER TEMP</Text>
          </View>
          <Text style={styles.cardValue}>27.5 <Text style={styles.cardUnit}>°C</Text></Text>
          <Text style={styles.cardSub}>Ideal for Pelagic Catch</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="gauge" size={16} color="#A855F7" />
            <Text style={styles.cardLabel}>BAROMETER</Text>
          </View>
          <Text style={styles.cardValue}>1012 <Text style={styles.cardUnit}>hPa</Text></Text>
          <Text style={styles.cardSub}>Steady • Fair Marine</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="eye-outline" size={16} color="#10B981" />
            <Text style={styles.cardLabel}>VISIBILITY</Text>
          </View>
          <Text style={styles.cardValue}>10 <Text style={styles.cardUnit}>NM</Text></Text>
          <Text style={styles.cardSub}>Clear Horizon • No Fog</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="compass-rose" size={16} color="#EC4899" />
            <Text style={styles.cardLabel}>TIDAL CURRENT</Text>
          </View>
          <Text style={styles.cardValue}>0.8 <Text style={styles.cardUnit}>kts</Text></Text>
          <Text style={styles.cardSub}>Bearing: 110° ESE</Text>
        </View>
      </View>

      {/* 24-Hour Tide Chart */}
      <TideChart />

      {/* Hourly Marine Forecast */}
      <Text style={styles.sectionTitle}>HOURLY MARINE FORECAST</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyScroll}>
        {hourlyData.map((item, idx) => (
          <View key={idx} style={styles.hourlyCard}>
            <Text style={styles.hourlyHour}>{item.hour}</Text>
            <MaterialCommunityIcons name={item.icon as any} size={22} color="#38BDF8" style={{ marginVertical: 6 }} />
            <Text style={styles.hourlyTemp}>{item.temp}</Text>
            <Text style={styles.hourlyMetricText}>{item.wind}</Text>
            <Text style={[styles.hourlyMetricText, { color: '#38BDF8' }]}>{item.wave}</Text>
          </View>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
    flexShrink: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  advisoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    marginBottom: 12,
  },
  advisoryInfo: {
    flex: 1,
  },
  advisoryTitle: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '800',
  },
  advisorySub: {
    color: MapColors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  sectionTitle: {
    color: MapColors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  card: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: MapColors.navyPanel,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cardLabel: {
    color: MapColors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  cardValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  cardUnit: {
    fontSize: 12,
    color: MapColors.textSecondary,
  },
  cardSub: {
    color: MapColors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  hourlyScroll: {
    flexDirection: 'row',
    marginTop: 4,
  },
  hourlyCard: {
    alignItems: 'center',
    backgroundColor: MapColors.navyPanel,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  hourlyHour: {
    color: MapColors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  hourlyTemp: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  hourlyMetricText: {
    color: MapColors.textMuted,
    fontSize: 10,
  },
});
