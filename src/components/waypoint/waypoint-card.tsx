import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FishingSpot } from '@/constants/fishing-spots';
import { MapColors } from '@/constants/map-theme';
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
  const dist = userLocation
    ? distanceNm(userLocation.latitude, userLocation.longitude, spot.latitude, spot.longitude)
    : null;

  const bearing = userLocation
    ? bearingDegrees(userLocation.latitude, userLocation.longitude, spot.latitude, spot.longitude)
    : null;

  return (
    <Pressable
      style={styles.card}
      onPress={() => onSelect(spot)}
      android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
    >
      {/* Accent Color Strip */}
      <View style={[styles.colorStrip, { backgroundColor: spot.color || MapColors.accent }]} />

      <View style={styles.cardContent}>
        {/* Top Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.titleInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.spotName} numberOfLines={1}>
                {spot.name}
              </Text>
              {spot.category ? (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{spot.category}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.coordsText}>
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
              color={spot.favorite ? MapColors.yellow : MapColors.textSecondary}
            />
          </Pressable>
        </View>

        {/* Marine Telemetry Row (Depth, Distance, Bearing) */}
        <View style={styles.metaRow}>
          <View style={styles.badge}>
            <MaterialCommunityIcons name="waves" size={13} color={MapColors.accent} />
            <Text style={styles.badgeText}>{spot.depthM} m depth</Text>
          </View>

          {dist != null && (
            <View style={styles.badge}>
              <MaterialCommunityIcons name="map-marker-distance" size={13} color={MapColors.green} />
              <Text style={styles.badgeText}>{formatNm(dist)}</Text>
            </View>
          )}

          {bearing != null && (
            <View style={styles.badge}>
              <MaterialCommunityIcons name="compass-outline" size={13} color="#F59E0B" />
              <Text style={styles.badgeText}>
                {formatBearing(bearing)} {getCardinalDirection(bearing)}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionsRow}>
          <Pressable
            style={styles.mapActionBtn}
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
            <Ionicons name="navigate" size={14} color="#00F0FF" />
            <Text style={styles.mapActionText}>Start Navigation</Text>
          </Pressable>

          <View style={styles.crudBtns}>
            <Pressable
              style={styles.iconBtn}
              onPress={() => onEdit(spot)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Edit waypoint"
            >
              <Ionicons name="pencil" size={16} color={MapColors.textSecondary} />
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  colorStrip: {
    width: 6,
    alignSelf: 'stretch',
  },
  cardContent: {
    flex: 1,
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleInfo: {
    flex: 1,
    paddingRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  spotName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  categoryBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  categoryText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  coordsText: {
    color: MapColors.textSecondary,
    fontSize: 12,
    marginTop: 3,
    letterSpacing: 0.2,
  },
  favoriteBtn: {
    padding: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: MapColors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  mapActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 240, 255, 0.14)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.35)',
  },
  mapActionText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  crudBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
});
