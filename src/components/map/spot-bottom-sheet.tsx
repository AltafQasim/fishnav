import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FishingSpot } from '@/constants/fishing-spots';
import { MapColors } from '@/constants/map-theme';
import { formatLatitude, formatLongitude } from '@/hooks/use-user-location';
import { toDms } from '@/utils/geo';

type SpotBottomSheetProps = {
  spot?: FishingSpot | null;
  droppedPin?: { latitude: number; longitude: number } | null;
  distanceLabel: string;
  bearingLabel: string;
  etaLabel: string;
  isFavorite?: boolean;
  onGoTo?: () => void;
  onSaveSpot?: () => void;
  onToggleFavorite?: () => void;
  onMeasureFromHere?: () => void;
  onClose?: () => void;
};

export function SpotBottomSheet({
  spot,
  droppedPin,
  distanceLabel,
  bearingLabel,
  etaLabel,
  isFavorite = false,
  onGoTo,
  onSaveSpot,
  onToggleFavorite,
  onMeasureFromHere,
  onClose,
}: SpotBottomSheetProps) {
  const insets = useSafeAreaInsets();

  const isDroppedPin = !spot && !!droppedPin;
  const lat = spot ? spot.latitude : droppedPin?.latitude ?? 0;
  const lng = spot ? spot.longitude : droppedPin?.longitude ?? 0;
  const name = spot ? spot.name : 'Dropped Pin';
  const depthM = spot ? `${spot.depthM} m` : 'Depth ~55 m';
  const pinColor = spot ? spot.color : '#EF4444';

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

  return (
    <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 14) + 6 }]}>
      <View style={styles.handle} />

      {/* Header Row */}
      <View style={styles.header}>
        <View style={[styles.pinBadge, { backgroundColor: pinColor }]}>
          <Ionicons
            name={isDroppedPin ? 'pin' : 'location'}
            size={22}
            color="#FFFFFF"
          />
        </View>

        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            {isFavorite ? (
              <Ionicons name="star" size={18} color={MapColors.yellow} />
            ) : null}
          </View>
          <Text style={styles.coords}>
            {formatLatitude(lat)} • {formatLongitude(lng)}
          </Text>
          <Text style={styles.coordsDec}>
            {lat.toFixed(4)}°, {lng.toFixed(4)}°
          </Text>
        </View>

        <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color={MapColors.textSecondary} />
        </Pressable>
      </View>

      {/* Marine Weather / Sea Condition Strip */}
      <View style={styles.seaStrip}>
        <View style={styles.seaItem}>
          <MaterialCommunityIcons name="weather-windy" size={15} color="#38BDF8" />
          <Text style={styles.seaText}>Wind 12 kts NW</Text>
        </View>
        <View style={styles.seaDivider} />
        <View style={styles.seaItem}>
          <MaterialCommunityIcons name="waves" size={15} color="#60A5FA" />
          <Text style={styles.seaText}>Swell 0.8 m</Text>
        </View>
        <View style={styles.seaDivider} />
        <View style={styles.seaItem}>
          <MaterialCommunityIcons name="thermometer" size={15} color="#FBBF24" />
          <Text style={styles.seaText}>Sea 28°C</Text>
        </View>
      </View>

      {/* Nautical Stats Grid */}
      <View style={styles.stats}>
        <Stat
          icon={
            <MaterialCommunityIcons
              name="arrow-top-right-bottom-left"
              size={16}
              color={MapColors.accent}
            />
          }
          label="Distance"
          value={distanceLabel}
        />
        <Stat
          icon={<Ionicons name="compass-outline" size={16} color={MapColors.accent} />}
          label="Bearing"
          value={bearingLabel}
        />
        <Stat
          icon={<Ionicons name="time-outline" size={16} color={MapColors.accent} />}
          label="ETA (12kt)"
          value={etaLabel}
        />
        <Stat
          icon={<MaterialCommunityIcons name="waves" size={16} color={MapColors.accent} />}
          label="Depth"
          value={depthM}
        />
      </View>

      {/* Google Maps Style Action Buttons Row */}
      <View style={styles.quickActionsRow}>
        {isDroppedPin ? (
          <Pressable style={styles.quickActionBtn} onPress={onSaveSpot}>
            <Ionicons name="bookmark-outline" size={18} color={MapColors.text} />
            <Text style={styles.quickActionText}>Save Spot</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.quickActionBtn} onPress={onToggleFavorite}>
            <Ionicons
              name={isFavorite ? 'star' : 'star-outline'}
              size={18}
              color={isFavorite ? MapColors.yellow : MapColors.text}
            />
            <Text style={styles.quickActionText}>
              {isFavorite ? 'Saved' : 'Favorite'}
            </Text>
          </Pressable>
        )}

        <Pressable style={styles.quickActionBtn} onPress={onMeasureFromHere}>
          <MaterialCommunityIcons name="ruler" size={18} color={MapColors.text} />
          <Text style={styles.quickActionText}>Measure</Text>
        </Pressable>

        <Pressable style={styles.quickActionBtn} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={18} color={MapColors.text} />
          <Text style={styles.quickActionText}>Share</Text>
        </Pressable>
      </View>

      {/* Primary Big "NAVIGATE / GO TO" Button */}
      <Pressable style={styles.goBtn} onPress={onGoTo}>
        <Ionicons name="navigate" size={20} color="#FFFFFF" />
        <Text style={styles.goText}>START NAVIGATION</Text>
      </Pressable>
    </View>
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
  return (
    <View style={styles.stat}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: MapColors.navyPanel,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -5 },
    elevation: 14,
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  pinBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  headerText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    color: MapColors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  coords: {
    color: MapColors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  coordsDec: {
    color: MapColors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: MapColors.navyGlass,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  seaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  seaText: {
    color: MapColors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  seaDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  stats: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: MapColors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    color: MapColors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  statValue: {
    color: MapColors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: MapColors.navyGlass,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  quickActionText: {
    color: MapColors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  goBtn: {
    backgroundColor: MapColors.accent,
    borderRadius: 16,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: MapColors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  goText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
