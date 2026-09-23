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
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';
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
  const { t } = useLanguage();
  const { formatDepth, formatSpeed } = useSettings();

  const lat = spot?.latitude ?? 0;
  const lng = spot?.longitude ?? 0;
  const name = spot?.name ?? t('spot.regular', 'Fishing Spot');
  const depthM = spot ? formatDepth(spot.depthM).full : `Depth ~${formatDepth(55).full}`;

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
          <Text style={styles.badgeYellowText}>{t('spot.favorite', 'FAVORITE SPOT')}</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badgeCyan, { backgroundColor: colors.chipBg, borderColor: colors.chipBorder }]}>
        <Text style={[styles.badgeCyanText, { color: colors.accent }]}>{t('spot.regular', 'FISHING SPOT')}</Text>
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
          <Ionicons name="navigate" size={19} color={isLight ? '#FFFFFF' : '#020B14'} />
          <Text style={[styles.goText, { color: isLight ? '#FFFFFF' : '#020B14' }]}>{t('spot.start_nav', 'Navigate')}</Text>
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
            label={t('cockpit.distance', 'Distance')}
            value={distanceLabel}
          />
          <Stat
            icon={<Ionicons name="compass-outline" size={18} color={colors.accent} />}
            label={t('hud.bearing', 'Bearing')}
            value={bearingLabel}
          />
          <Stat
            icon={<Ionicons name="time-outline" size={18} color={colors.accent} />}
            label={t('cockpit.eta', 'ETA (12kt)')}
            value={etaLabel}
          />
          <Stat
            icon={<MaterialCommunityIcons name="waves" size={18} color={colors.accent} />}
            label={t('spot.depth', 'Depth')}
            value={depthM}
          />
        </View>

        {/* 3. Marine Weather & Sea Condition Strip */}
        <View style={[styles.seaStrip, { backgroundColor: colors.chipBg, borderColor: colors.chipBorder }]}>
          <View style={styles.seaItem}>
            <MaterialCommunityIcons name="weather-windy" size={16} color="#38BDF8" />
            <Text style={[styles.seaText, { color: colors.text }]}>Wind {formatSpeed(12).full} NW</Text>
          </View>
          <View style={[styles.seaDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.seaItem}>
            <MaterialCommunityIcons name="waves" size={16} color="#60A5FA" />
            <Text style={[styles.seaText, { color: colors.text }]}>Swell {formatDepth(0.8).full}</Text>
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
              size={16}
              color={isFavorite ? MapColors.yellow : colors.text}
            />
            <Text style={[styles.quickActionText, { color: colors.text }]} numberOfLines={1}>
              {isFavorite ? t('spot.saved', 'Saved') : t('spot.save', 'Favorite')}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.quickActionBtn, { backgroundColor: colors.chipBg, borderColor: colors.chipBorder }]}
            onPress={handleShare}
          >
            <Ionicons name="share-social-outline" size={16} color={colors.text} />
            <Text style={[styles.quickActionText, { color: colors.text }]} numberOfLines={1}>{t('spot.share', 'Share')}</Text>
          </Pressable>
        </View>

        {/* 5. Full Coordinates & Waypoint Details Card */}
        <View style={[styles.geoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.geoCardTitle, { color: colors.textSecondary }]}>{t('hub.coords', 'GPS COORDINATES & DETAILS')}</Text>
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
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 10,
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
    borderRadius: 14,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#0284C7',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  goText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#041728',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 3,
  },
  statLabel: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1,
  },
  seaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  seaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  seaText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  seaDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
  },
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickActionText: {
    color: MapColors.text,
    fontSize: 11.5,
    fontWeight: '700',
  },
  geoCard: {
    backgroundColor: '#041728',
    borderRadius: 14,
    padding: 10,
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
