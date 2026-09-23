import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  Alert,
  BackHandler,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { FishingTrip } from '@/constants/trips';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';
import { useAppTheme } from '@/context/theme-context';
import { useTripTracking } from '@/context/trip-context';
import { formatNm } from '@/utils/geo';

export default function TripsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isLight } = useAppTheme();
  const { t } = useLanguage();
  const { formatDistance, formatSpeed } = useSettings();
  const {
    savedTrips,
    deleteTrip,
    toggleTripVisibility,
    viewTripOnMap,
    startTracking,
  } = useTripTracking();

  // Aggregate stats
  const totalTrips = savedTrips.length;
  const totalNm = savedTrips.reduce((acc, t) => acc + (t.distanceNm || 0), 0);
  const totalSeconds = savedTrips.reduce((acc, t) => acc + (t.durationSeconds || 0), 0);
  const totalHours = (totalSeconds / 3600).toFixed(1);

  const formatDuration = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} min`;
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  useEffect(() => {
    const onBack = () => {
      handleBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [router]);

  const handleViewOnMap = (trip: FishingTrip) => {
    viewTripOnMap(trip);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleDeletePrompt = (trip: FishingTrip) => {
    Alert.alert(
      t('trips.delete_trip', 'Delete Voyage'),
      `${t('trips.delete_confirm', 'Are you sure you want to delete')} "${trip.name}"?`,
      [
        { text: t('btn.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('btn.delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteTrip(trip.id);
          },
        },
      ],
    );
  };

  const handleStartNewTrip = () => {
    startTracking();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 16,
        },
      ]}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={[styles.backBtn, { backgroundColor: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.1)' }]}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={[styles.title, { color: colors.text }]}>{t('trips.title', 'Trips & Routes Log')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('trips.subtitle', 'GPS Tracks, Marine Logs & Backtrack Routes')}
          </Text>
        </View>
        <Pressable
          onPress={handleStartNewTrip}
          hitSlop={8}
          style={[styles.newTripBtn, { backgroundColor: colors.accent }]}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.newTripBtnText}>{t('trips.record_new', 'RECORD')}</Text>
        </Pressable>
      </View>

      {/* Cumulative Metrics Strip */}
      <View
        style={[
          styles.statsBanner,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          },
        ]}>
        <View style={styles.statsItem}>
          <Text style={[styles.statsVal, { color: colors.accent }]}>{totalTrips}</Text>
          <Text style={[styles.statsLbl, { color: colors.textMuted }]}>{t('trips.total_trips', 'VOYAGES')}</Text>
        </View>
        <View style={[styles.statsDivider, { backgroundColor: colors.divider }]} />
        <View style={styles.statsItem}>
          <Text style={[styles.statsVal, { color: colors.accent }]}>
            {formatDistance(totalNm)}
          </Text>
          <Text style={[styles.statsLbl, { color: colors.textMuted }]}>{t('trips.total_miles', 'TOTAL DISTANCE')}</Text>
        </View>
        <View style={[styles.statsDivider, { backgroundColor: colors.divider }]} />
        <View style={styles.statsItem}>
          <Text style={[styles.statsVal, { color: colors.accent }]}>
            {totalHours} <Text style={[styles.statsUnit, { color: isLight ? colors.textSecondary : '#93C5FD' }]}>hrs</Text>
          </Text>
          <Text style={[styles.statsLbl, { color: colors.textMuted }]}>{t('trips.total_hours', 'HOURS AT SEA')}</Text>
        </View>
      </View>

      {/* Trips List */}
      <FlatList
        data={savedTrips}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="map-marker-path" size={54} color={isLight ? '#CBD5E1' : '#334155'} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('trips.empty_title', 'No Recorded Trips Yet')}</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              {t('trips.empty_sub', 'Start a track recording on the map to log your vessel path, distance, and speeds.')}
            </Text>
            <Pressable
              style={[styles.startEmptyBtn, { backgroundColor: colors.accent }]}
              onPress={handleStartNewTrip}>
              <Ionicons name="navigate" size={18} color="#FFFFFF" />
              <Text style={styles.startEmptyBtnText}>{t('trips.record_new', 'START FIRST TRIP')}</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => {
          const isVisible = item.visibleOnMap !== false;
          return (
            <View
              style={[
                styles.tripCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={[styles.trackColorPill, { backgroundColor: item.color || colors.accent }]} />
                <View style={styles.cardTitles}>
                  <Text style={[styles.tripName, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.tripDate, { color: colors.textSecondary }]}>
                    {formatDate(item.startTime)} • {item.targetSpotName || t('trips.open_sea', 'Open Sea Track')}
                  </Text>
                </View>

                {/* Map Visibility Toggle */}
                <Pressable
                  onPress={() => toggleTripVisibility(item.id)}
                  hitSlop={8}
                  style={[
                    styles.eyeBtn,
                    { backgroundColor: isLight ? '#F1F5F9' : 'rgba(255,255,255,0.06)' },
                  ]}>
                  <Ionicons
                    name={isVisible ? 'eye' : 'eye-off-outline'}
                    size={20}
                    color={isVisible ? colors.accent : colors.textMuted}
                  />
                </Pressable>
              </View>

              {/* Stats Row */}
              <View
                style={[
                  styles.cardStatsRow,
                  {
                    backgroundColor: isLight ? '#F8FAFC' : 'rgba(15, 39, 66, 0.65)',
                    borderColor: colors.divider,
                    borderWidth: isLight ? 1 : 0,
                  },
                ]}>
                <View style={styles.cardStat}>
                  <Text style={[styles.cardStatVal, { color: colors.text }]}>{formatDistance(item.distanceNm)}</Text>
                  <Text style={[styles.cardStatLbl, { color: colors.textMuted }]}>{t('trips.distance', 'DISTANCE')}</Text>
                </View>

                <View style={[styles.cardStatDivider, { backgroundColor: colors.divider }]} />

                <View style={styles.cardStat}>
                  <Text style={[styles.cardStatVal, { color: colors.text }]}>{formatDuration(item.durationSeconds)}</Text>
                  <Text style={[styles.cardStatLbl, { color: colors.textMuted }]}>{t('trips.duration', 'DURATION')}</Text>
                </View>

                <View style={[styles.cardStatDivider, { backgroundColor: colors.divider }]} />

                <View style={styles.cardStat}>
                  <Text style={[styles.cardStatVal, { color: colors.text }]}>
                    {formatSpeed(item.avgSpeedKnots).value} <Text style={[styles.subKts, { color: colors.accent }]}>{formatSpeed(item.avgSpeedKnots).unit}</Text>
                  </Text>
                  <Text style={[styles.cardStatLbl, { color: colors.textMuted }]}>{t('trips.avg_speed', 'AVG SPEED')}</Text>
                </View>

                <View style={[styles.cardStatDivider, { backgroundColor: colors.divider }]} />

                <View style={styles.cardStat}>
                  <Text style={[styles.cardStatVal, { color: colors.text }]}>
                    {formatSpeed(item.maxSpeedKnots).value} <Text style={[styles.subKts, { color: colors.accent }]}>{formatSpeed(item.maxSpeedKnots).unit}</Text>
                  </Text>
                  <Text style={[styles.cardStatLbl, { color: colors.textMuted }]}>{t('trips.max_speed', 'MAX SPEED')}</Text>
                </View>
              </View>

              {/* Notes if any */}
              {item.notes ? (
                <View
                  style={[
                    styles.notesBox,
                    {
                      backgroundColor: isLight ? '#F8FAFC' : 'rgba(255,255,255,0.03)',
                      borderLeftColor: colors.accent,
                    },
                  ]}>
                  <Text style={[styles.notesText, { color: colors.textSecondary }]} numberOfLines={2}>
                    {`"${item.notes}"`}
                  </Text>
                </View>
              ) : null}

              {/* Actions Footer */}
              <View style={styles.cardActions}>
                <Pressable
                  style={[styles.viewMapBtn, { backgroundColor: colors.accent }]}
                  onPress={() => handleViewOnMap(item)}>
                  <Ionicons name="map-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.viewMapText}>{t('trips.view_map', 'VIEW ON MAP')}</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.deleteBtn,
                    {
                      backgroundColor: isLight ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.1)',
                      borderColor: isLight ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                    },
                  ]}
                  onPress={() => handleDeletePrompt(item)}
                  hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#00162B',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: '#8BA3B8',
    fontSize: 12,
    marginTop: 2,
  },
  newTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  newTripBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#041728',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  statsItem: {
    flex: 1,
    alignItems: 'center',
  },
  statsVal: {
    color: '#00F0FF',
    fontSize: 18,
    fontWeight: '900',
  },
  statsUnit: {
    fontSize: 12,
    color: '#93C5FD',
    fontWeight: '600',
  },
  statsLbl: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 3,
    letterSpacing: 0.4,
  },
  statsDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  tripCard: {
    backgroundColor: '#041728',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  trackColorPill: {
    width: 5,
    height: 36,
    borderRadius: 3,
  },
  cardTitles: {
    flex: 1,
  },
  tripName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  tripDate: {
    color: '#8BA3B8',
    fontSize: 12,
    marginTop: 2,
  },
  eyeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 39, 66, 0.65)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  cardStat: {
    flex: 1,
    alignItems: 'center',
  },
  cardStatVal: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  subKts: {
    fontSize: 10,
    color: '#93C5FD',
  },
  cardStatLbl: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
    marginTop: 2,
  },
  cardStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  notesBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#38BDF8',
  },
  notesText: {
    color: '#94A3B8',
    fontSize: 12,
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  viewMapBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  viewMapText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 16,
  },
  emptySub: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  startEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    marginTop: 20,
  },
  startEmptyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
