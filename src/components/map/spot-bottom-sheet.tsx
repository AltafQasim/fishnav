import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SlidingSheetContainer } from '@/components/ui/sliding-sheet-container';
import type { FishingSpot } from '@/constants/fishing-spots';
import { MapColors } from '@/constants/map-theme';
import { useAppTheme } from '@/context/theme-context';
import { formatLatitude, formatLongitude } from '@/hooks/use-user-location';
import { toDms } from '@/utils/geo';

type SpotBottomSheetProps = {
  isOpen?: boolean;
  spot?: FishingSpot | null;
  distanceLabel: string;
  bearingLabel: string;
  etaLabel: string;
  isFavorite?: boolean;
  onGoTo?: () => void;
  onSaveSpot?: () => void;
  onToggleFavorite?: () => void;
  onClose?: () => void;
};

/**
 * 🗺️ SpotBottomSheet
 * Displays fishing spot details in a smooth SlidingSheetContainer
 * (identical to tab cards, with drag-down to dismiss and full vertical scrolling).
 */
export function SpotBottomSheet({
  isOpen,
  spot,
  distanceLabel,
  bearingLabel,
  etaLabel,
  isFavorite = false,
  onGoTo,
  onSaveSpot,
  onToggleFavorite,
  onClose = () => { },
}: SpotBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors, isLight } = useAppTheme();

  const lat = spot?.latitude ?? 0;
  const lng = spot?.longitude ?? 0;
  const name = spot?.name ?? 'Fishing Spot';
  const depthM = spot ? `${spot.depthM} m` : 'Depth ~55 m';

  const isSheetOpen = isOpen !== undefined ? isOpen : spot !== null;

  const handleShare = async () => {
    const dmsLat = toDms(lat, 'N', 'S');
    const dmsLng = toDms(lng, 'E', 'W');
    const msg = `FishNavPro Marine Waypoint:\n${name}\nCoordinates: ${dmsLat} ${dmsLng}\nDecimal: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    try {
      await Share.share({ message: msg });
    } catch {
      Alert.alert('Waypoint Coordinates', `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  };

  const getBadge = () => {
    if (isFavorite) {
      return (
        <View style={styles.badgeYellow}>
          <Text style={styles.badgeYellowText}>FAVORITE SPOT</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badgeCyan, { backgroundColor: colors.chipBg, borderColor: colors.chipBorder }]}>
        <Text style={[styles.badgeCyanText, { color: colors.accent }]}>FISHING SPOT</Text>
      </View>
    );
  };

  return (
    <SlidingSheetContainer
      isOpen={isSheetOpen}
      title={name}
      subtitle={`${formatLatitude(lat)} • ${formatLongitude(lng)}`}
      badge={getBadge()}
      onClose={onClose}
    >
      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 110 },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* 1. Primary Big "GO TO" Action Button (Top Prominence!) */}
        <Pressable
          style={[styles.goBtn, { backgroundColor: colors.accent }]}
          onPress={onGoTo}
        >
          <Ionicons name="navigate" size={22} color={isLight ? '#FFFFFF' : '#020B14'} />
          <Text style={[styles.goText, { color: isLight ? '#FFFFFF' : '#020B14' }]}>GO TO SPOT</Text>
        </Pressable>

        {/* 2. Nautical Stats Grid (Distance, Bearing, ETA, Depth) */}
        <View style={[styles.statsGrid, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Stat
            icon={
              <MaterialCommunityIcons
                name="arrow-top-right-bottom-left"
                size={18}
                color={colors.accent}
              />
            }
            label="Distance"
            value={distanceLabel}
          />
          <Stat
            icon={<Ionicons name="compass-outline" size={18} color={colors.accent} />}
            label="Bearing"
            value={bearingLabel}
          />
          <Stat
            icon={<Ionicons name="time-outline" size={18} color={colors.accent} />}
            label="ETA (12kt)"
            value={etaLabel}
          />
          <Stat
            icon={<MaterialCommunityIcons name="waves" size={18} color={colors.accent} />}
            label="Depth"
            value={depthM}
          />
        </View>

        {/* 3. Marine Weather & Sea Condition Strip */}
        <View style={[styles.seaStrip, { backgroundColor: colors.chipBg, borderColor: colors.chipBorder }]}>
          <View style={styles.seaItem}>
            <MaterialCommunityIcons name="weather-windy" size={16} color="#38BDF8" />
            <Text style={[styles.seaText, { color: colors.text }]}>Wind 12 kts NW</Text>
          </View>
          <View style={[styles.seaDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.seaItem}>
            <MaterialCommunityIcons name="waves" size={16} color="#60A5FA" />
            <Text style={[styles.seaText, { color: colors.text }]}>Swell 0.8 m</Text>
          </View>
          <View style={[styles.seaDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.seaItem}>
            <MaterialCommunityIcons name="thermometer" size={16} color="#FBBF24" />
            <Text style={[styles.seaText, { color: colors.text }]}>Sea 28°C</Text>
          </View>
        </View>

        {/* 4. Quick Action Tools Row */}
        <View style={styles.quickActionsRow}>
          <Pressable
            style={[styles.quickActionBtn, { backgroundColor: colors.chipBg, borderColor: colors.chipBorder }]}
            onPress={onToggleFavorite}
          >
            <Ionicons
              name={isFavorite ? 'star' : 'star-outline'}
              size={18}
              color={isFavorite ? MapColors.yellow : colors.text}
            />
            <Text style={[styles.quickActionText, { color: colors.text }]}>
              {isFavorite ? 'Saved' : 'Favorite'}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.quickActionBtn, { backgroundColor: colors.chipBg, borderColor: colors.chipBorder }]}
            onPress={handleShare}
          >
            <Ionicons name="share-social-outline" size={18} color={colors.text} />
            <Text style={[styles.quickActionText, { color: colors.text }]}>Share Spot</Text>
          </Pressable>
        </View>

        {/* 5. Full Coordinates & Waypoint Details Card */}
        <View style={[styles.geoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.geoCardTitle, { color: colors.textSecondary }]}>GPS COORDINATES & DETAILS</Text>
          <View style={styles.geoRow}>
            <Text style={[styles.geoLabel, { color: colors.textSecondary }]}>DMS Format</Text>
            <Text style={[styles.geoVal, { color: colors.text }]}>
              {formatLatitude(lat)} • {formatLongitude(lng)}
            </Text>
          </View>
          <View style={[styles.geoDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.geoRow}>
            <Text style={[styles.geoLabel, { color: colors.textSecondary }]}>Decimal Degree</Text>
            <Text style={[styles.geoVal, { color: colors.text }]}>
              {lat.toFixed(5)}°, {lng.toFixed(5)}°
            </Text>
          </View>
          {spot?.category ? (
            <>
              <View style={[styles.geoDivider, { backgroundColor: colors.divider }]} />
              <View style={styles.geoRow}>
                <Text style={[styles.geoLabel, { color: colors.textSecondary }]}>Category</Text>
                <Text style={[styles.geoVal, { color: colors.text }]}>{spot.category.toUpperCase()}</Text>
              </View>
            </>
          ) : null}
          {spot?.notes ? (
            <>
              <View style={[styles.geoDivider, { backgroundColor: colors.divider }]} />
              <View style={styles.geoRow}>
                <Text style={[styles.geoLabel, { color: colors.textSecondary }]}>Spot Notes</Text>
                <Text style={[styles.geoVal, { color: colors.text }]}>{spot.notes}</Text>
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>
    </SlidingSheetContainer>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.stat}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollBody: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },
  badgeCyan: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  badgeCyanText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
  },
  badgeAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  badgeAmberText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
  },
  badgeYellow: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.35)',
  },
  badgeYellowText: {
    color: '#EAB308',
    fontSize: 10,
    fontWeight: '800',
  },
  goBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0284C7',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  goText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#041728',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 4,
  },
  statLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  seaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  seaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  seaDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
  },
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickActionText: {
    color: MapColors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  geoCard: {
    backgroundColor: '#041728',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  geoCardTitle: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  geoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  geoLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  geoVal: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  geoDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 6,
  },
});
