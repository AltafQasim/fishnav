import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FishingSpot } from '@/constants/fishing-spots';
import { MapColors } from '@/constants/map-theme';
import { useAppTheme } from '@/context/theme-context';
import { formatLatitude, formatLongitude, UserLocation } from '@/hooks/use-user-location';
import { bearingDegrees, distanceNm, formatBearing, formatNm } from '@/utils/geo';

type WaypointCardProps = {
  spot: FishingSpot;
  userLocation: UserLocation | null;
  onSelect: (spot: FishingSpot) => void;
  onEdit: (spot: FishingSpot) => void;
  onDelete: (spot: FishingSpot) => void;
  onToggleFavorite: (id: string) => void;
  onViewOnMap?: (spot: FishingSpot) => void;
  onStartNavigation?: (spot: FishingSpot) => void;
};

// Converts degrees to 16-point cardinal compass text
function getCardinalDirection(deg: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
  ];
  const index = Math.round(((deg % 360) + 360) % 360 / 22.5) % 16;
  return directions[index] || 'N';
}

export function WaypointCard({
  spot,
  userLocation,
  onSelect,
  onEdit,
  onDelete,
  onToggleFavorite,
  onViewOnMap,
  onStartNavigation,
}: WaypointCardProps) {
  const { colors, isLight } = useAppTheme();
  const dist = userLocation
    ? distanceNm(userLocation.latitude, userLocation.longitude, spot.latitude, spot.longitude)
    : null;

  const bearing = userLocation
    ? bearingDegrees(userLocation.latitude, userLocation.longitude, spot.latitude, spot.longitude)
    : null;

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
      ]}
      onPress={() => onSelect(spot)}
      android_ripple={{ color: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)' }}
    >
      {/* Accent Color Strip */}
      <View style={[styles.colorStrip, { backgroundColor: spot.color || colors.accent }]} />

      <View style={styles.cardContent}>
        {/* Top Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.titleInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.spotName, { color: colors.text }]} numberOfLines={1}>
                {spot.name}
              </Text>
              {spot.category ? (
                <View
                  style={[
                    styles.categoryBadge,
                    {
                      backgroundColor: colors.chipBg,
                      borderColor: colors.chipBorder,
                    },
                  ]}
                >
                  <Text style={[styles.categoryText, { color: colors.accent }]}>{spot.category}</Text>
                </View>
              ) : null}
            </View>

            <Text style={[styles.coordsText, { color: colors.textSecondary }]}>
              {formatLatitude(spot.latitude)} • {formatLongitude(spot.longitude)}
            </Text>
          </View>

          {/* Favorite Toggle */}
          <Pressable
            hitSlop={10}
            onPress={() => onToggleFavorite(spot.id)}
            style={styles.favoriteBtn}
            accessibilityRole="button"
            accessibilityLabel="Toggle Favorite"
          >
            <Ionicons
              name={spot.favorite ? 'star' : 'star-outline'}
              size={20}
              color={spot.favorite ? MapColors.yellow : colors.textMuted}
            />
          </Pressable>
        </View>

        {/* Marine Telemetry Row (Depth, Distance, Bearing) */}
        <View style={styles.metaRow}>
          <View style={[styles.badge, { backgroundColor: colors.chipBg }]}>
            <MaterialCommunityIcons name="waves" size={13} color={colors.accent} />
            <Text style={[styles.badgeText, { color: colors.text }]}>{spot.depthM} m depth</Text>
          </View>

          {dist != null && (
            <View style={[styles.badge, { backgroundColor: colors.chipBg }]}>
              <MaterialCommunityIcons name="map-marker-distance" size={13} color={MapColors.green} />
              <Text style={[styles.badgeText, { color: colors.text }]}>{formatNm(dist)}</Text>
            </View>
          )}

          {bearing != null && (
            <View style={[styles.badge, { backgroundColor: colors.chipBg }]}>
              <MaterialCommunityIcons name="compass-outline" size={13} color="#F59E0B" />
              <Text style={[styles.badgeText, { color: colors.text }]}>
                {formatBearing(bearing)} {getCardinalDirection(bearing)}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons Row */}
        <View style={[styles.actionsRow, { borderTopColor: colors.divider }]}>
          <Pressable
            style={[
              styles.mapActionBtn,
              {
                backgroundColor: colors.chipBg,
                borderColor: colors.accent,
              },
            ]}
            onPress={() => {
              if (onStartNavigation) {
                onStartNavigation(spot);
              } else if (onViewOnMap) {
                onViewOnMap(spot);
              } else {
                onSelect(spot);
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={`Start navigation to ${spot.name}`}
          >
            <Ionicons name="navigate" size={13} color={colors.accent} />
            <Text style={[styles.mapActionText, { color: colors.accent }]} numberOfLines={1}>Navigate</Text>
          </Pressable>

          <View style={styles.crudBtns}>
            <Pressable
              style={[styles.iconBtn, { backgroundColor: colors.chipBg }]}
              onPress={() => onEdit(spot)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Edit waypoint"
            >
              <Ionicons name="pencil" size={16} color={colors.textSecondary} />
            </Pressable>

            <Pressable
              style={[styles.iconBtn, styles.deleteBtn]}
              onPress={() => onDelete(spot)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Delete waypoint"
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: MapColors.navyPanel,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  colorStrip: {
    width: 5,
    alignSelf: 'stretch',
  },
  cardContent: {
    flex: 1,
    padding: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleInfo: {
    flex: 1,
    paddingRight: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  spotName: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    flexShrink: 1,
  },
  categoryBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  categoryText: {
    color: '#38BDF8',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  coordsText: {
    color: MapColors.textSecondary,
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  favoriteBtn: {
    padding: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  badgeText: {
    color: MapColors.text,
    fontSize: 10,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  mapActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 240, 255, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.35)',
  },
  mapActionText: {
    color: '#00F0FF',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  crudBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
});
