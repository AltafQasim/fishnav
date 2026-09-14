import { Feather, Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { SolunarChart } from '@/components/calendar/solunar-chart';
import { MapColors } from '@/constants/map-theme';

export function CalendarSheetContent() {
  const [selectedDayOffset, setSelectedDayOffset] = useState(0);

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      offset: i,
      dayName: i === 0 ? 'TODAY' : d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      dateNum: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
    };
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: 110 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* 7-Day Horizontal Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
        {days.map((item) => {
          const isSelected = selectedDayOffset === item.offset;
          return (
            <Pressable
              key={item.offset}
              style={[styles.datePill, isSelected && styles.datePillActive]}
              onPress={() => setSelectedDayOffset(item.offset)}
            >
              <Text style={[styles.dayName, isSelected && styles.dayNameActive]}>
                {item.dayName}
              </Text>
              <Text style={[styles.dateNum, isSelected && styles.dateNumActive]}>
                {item.dateNum}
              </Text>
              <Text style={[styles.monthText, isSelected && styles.monthTextActive]}>
                {item.month}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Moon Phase Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleWrap}>
            <Ionicons name="moon" size={18} color="#FBBF24" />
            <Text style={styles.cardTitle}>MOON PHASE & ILLUMINATION</Text>
          </View>
          <View style={styles.illuminationBadge}>
            <Text style={styles.illuminationText}>84% ILLUMINATED</Text>
          </View>
        </View>

        <View style={styles.moonHeroRow}>
          <View style={styles.moonGraphic}>
            <Svg width={64} height={64} viewBox="0 0 72 72">
              <Defs>
                <LinearGradient id="moonSheetGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0%" stopColor="#FEF3C7" />
                  <Stop offset="100%" stopColor="#F59E0B" />
                </LinearGradient>
              </Defs>
              <Circle cx={36} cy={36} r={32} fill="#0F2942" stroke="#38BDF8" strokeWidth={1.5} />
              <Path d="M 36 4 A 32 32 0 0 1 36 68 A 20 32 0 0 1 36 4 Z" fill="url(#moonSheetGrad)" />
            </Svg>
          </View>

          <View style={styles.moonInfoWrap}>
            <Text style={styles.moonPhaseName}>Waxing Gibbous</Text>
            <Text style={styles.moonSub}>Moon Age: Day 11.4 of 29.53</Text>
            <Text style={styles.moonDistance}>Distance: 382,410 km</Text>
          </View>
        </View>

        <View style={styles.timingsGrid}>
          <View style={styles.timingItem}>
            <Text style={styles.timingLabel}>MOONRISE</Text>
            <Text style={styles.timingValue}>15:24</Text>
          </View>
          <View style={styles.timingItem}>
            <Text style={styles.timingLabel}>MOONSET</Text>
            <Text style={styles.timingValue}>04:12</Text>
          </View>
          <View style={styles.timingItem}>
            <Text style={styles.timingLabel}>OVERHEAD</Text>
            <Text style={styles.timingValue}>21:48</Text>
          </View>
          <View style={styles.timingItem}>
            <Text style={styles.timingLabel}>UNDERFOOT</Text>
            <Text style={styles.timingValue}>09:22</Text>
          </View>
        </View>
      </View>

      {/* Sun Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleWrap}>
            <Ionicons name="sunny" size={18} color="#F59E0B" />
            <Text style={styles.cardTitle}>SUN & DAYLIGHT HOURS</Text>
          </View>
          <View style={[styles.illuminationBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <Text style={[styles.illuminationText, { color: '#F59E0B' }]}>12h 26m DAYLIGHT</Text>
          </View>
        </View>

        <View style={styles.timingsGrid}>
          <View style={styles.timingItem}>
            <View style={styles.timingHeaderRow}>
              <Feather name="sunrise" size={12} color="#F59E0B" />
              <Text style={styles.timingLabel}>SUNRISE</Text>
            </View>
            <Text style={styles.timingValue}>06:22</Text>
            <Text style={styles.timingSub}>Dawn: 06:01</Text>
          </View>

          <View style={styles.timingItem}>
            <View style={styles.timingHeaderRow}>
              <Feather name="sunset" size={12} color="#EF4444" />
              <Text style={styles.timingLabel}>SUNSET</Text>
            </View>
            <Text style={styles.timingValue}>18:48</Text>
            <Text style={styles.timingSub}>Dusk: 19:09</Text>
          </View>

          <View style={styles.timingItem}>
            <View style={styles.timingHeaderRow}>
              <Feather name="sun" size={12} color="#F59E0B" />
              <Text style={styles.timingLabel}>SOLAR NOON</Text>
            </View>
            <Text style={styles.timingValue}>12:35</Text>
            <Text style={styles.timingSub}>Angle: 68°</Text>
          </View>

          <View style={styles.timingItem}>
            <View style={styles.timingHeaderRow}>
              <Ionicons name="sparkles" size={12} color="#A855F7" />
              <Text style={styles.timingLabel}>GOLDEN HOUR</Text>
            </View>
            <Text style={styles.timingValue}>18:10</Text>
            <Text style={styles.timingSub}>Prime Catch</Text>
          </View>
        </View>
      </View>

      {/* 24-Hour Solunar Activity Chart */}
      <SolunarChart />
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
    paddingTop: 8,
  },
  dateScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  datePill: {
    alignItems: 'center',
    backgroundColor: MapColors.navyPanel,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minWidth: 58,
  },
  datePillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderColor: '#38BDF8',
  },
  dayName: {
    color: MapColors.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  dayNameActive: {
    color: '#38BDF8',
  },
  dateNum: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginVertical: 1,
  },
  dateNumActive: {
    color: '#FFFFFF',
  },
  monthText: {
    color: MapColors.textSecondary,
    fontSize: 10,
  },
  monthTextActive: {
    color: '#38BDF8',
  },
  card: {
    backgroundColor: MapColors.navyPanel,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  illuminationBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  illuminationText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
  },
  moonHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  moonGraphic: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moonInfoWrap: {
    flex: 1,
  },
  moonPhaseName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  moonSub: {
    color: MapColors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  moonDistance: {
    color: MapColors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  timingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  timingItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    padding: 8,
  },
  timingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timingLabel: {
    color: MapColors.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  timingValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  timingSub: {
    color: MapColors.textSecondary,
    fontSize: 9,
    marginTop: 1,
  },
});
