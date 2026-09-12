import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FishingSpot, HARBOR } from '@/constants/fishing-spots';
import { MapColors } from '@/constants/map-theme';
import { LocationStatus } from '@/hooks/use-user-location';
import { parseCoordinates } from '@/utils/geo';

export type CategoryFilter =
  | 'all'
  | 'favorites'
  | 'harbor'
  | 'deep'
  | 'hazards'
  | 'measure'
  | 'add_spot'
  | 'goto_coords';

type MapSearchBarProps = {
  spots: FishingSpot[];
  activeFilter: CategoryFilter;
  measurementActive: boolean;
  status: LocationStatus;
  placeLabel?: string | null;
  onSelectFilter: (filter: CategoryFilter) => void;
  onSelectSpot: (spot: FishingSpot) => void;
  onSelectHarbor: () => void;
  onGoToCoords: (lat: number, lng: number) => void;
  onOpenLayers: () => void;
  onBack?: () => void;
};

export function MapSearchBar({
  spots,
  activeFilter,
  measurementActive,
  status,
  placeLabel,
  onSelectFilter,
  onSelectSpot,
  onSelectHarbor,
  onGoToCoords,
  onOpenLayers,
  onBack,
}: MapSearchBarProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Parse raw coordinate if user entered one
  const parsedCoord = useMemo(() => {
    if (!query.trim()) return null;
    return parseCoordinates(query);
  }, [query]);

  // Filter matching results
  const searchResults = useMemo<{ spots: FishingSpot[]; matchesHarbor: boolean }>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { spots: [], matchesHarbor: false };

    const matchedSpots = spots.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        `${s.depthM}m`.includes(q),
    );

    const matchesHarbor = HARBOR.name.toLowerCase().includes(q);

    return {
      spots: matchedSpots,
      matchesHarbor,
    };
  }, [query, spots]);

  const showDropdown = isFocused && query.trim().length > 0;

  const handleSelectSpotItem = (spot: FishingSpot) => {
    setQuery('');
    setIsFocused(false);
    onSelectSpot(spot);
  };

  const handleSelectHarborItem = () => {
    setQuery('');
    setIsFocused(false);
    onSelectHarbor();
  };

  const handleSelectCoordsItem = () => {
    if (!parsedCoord) return;
    setQuery('');
    setIsFocused(false);
    onGoToCoords(parsedCoord.latitude, parsedCoord.longitude);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
      {/* Floating Google Maps Search Pill */}
      <View style={styles.searchBar}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={10} style={styles.searchSideBtn}>
            <Ionicons name="arrow-back" size={20} color={MapColors.text} />
          </Pressable>
        ) : (
          <View style={styles.searchIconWrap}>
            <Ionicons name="search" size={20} color={MapColors.accent} />
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="Search spots, harbors, coordinates..."
          placeholderTextColor={MapColors.textMuted}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Slight delay so item click registers before blur hides it
            setTimeout(() => setIsFocused(false), 200);
          }}
          autoCorrect={false}
          returnKeyType="search"
        />

        {query.length > 0 ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10} style={styles.searchSideBtn}>
            <Ionicons name="close-circle" size={18} color={MapColors.textSecondary} />
          </Pressable>
        ) : null}

        <View style={styles.vDivider} />

        <Pressable onPress={onOpenLayers} hitSlop={10} style={styles.searchSideBtn}>
          <Ionicons name="layers" size={20} color={MapColors.text} />
        </Pressable>
      </View>

      {/* Autocomplete Dropdown List */}
      {showDropdown ? (
        <View style={styles.dropdownCard}>
          {parsedCoord ? (
            <Pressable style={styles.dropdownItem} onPress={handleSelectCoordsItem}>
              <View style={[styles.itemIcon, { backgroundColor: MapColors.accentSoft }]}>
                <Ionicons name="navigate-circle" size={20} color={MapColors.accent} />
              </View>
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>Go to Coordinates</Text>
                <Text style={styles.itemSub}>
                  {parsedCoord.latitude.toFixed(4)}°, {parsedCoord.longitude.toFixed(4)}°
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={MapColors.textMuted} />
            </Pressable>
          ) : null}

          {searchResults.matchesHarbor ? (
            <Pressable style={styles.dropdownItem} onPress={handleSelectHarborItem}>
              <View style={[styles.itemIcon, { backgroundColor: 'rgba(56, 189, 248, 0.2)' }]}>
                <MaterialCommunityIcons name="anchor" size={20} color="#38BDF8" />
              </View>
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>{HARBOR.name} Port</Text>
                <Text style={styles.itemSub}>Base Harbor & Fishing Landing Center</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={MapColors.textMuted} />
            </Pressable>
          ) : null}

          {searchResults.spots.map((spot) => (
            <Pressable
              key={spot.id}
              style={styles.dropdownItem}
              onPress={() => handleSelectSpotItem(spot)}>
              <View style={[styles.itemIcon, { backgroundColor: spot.color + '33' }]}>
                <Ionicons name="location" size={20} color={spot.color} />
              </View>
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>{spot.name}</Text>
                <Text style={styles.itemSub}>
                  Depth: {spot.depthM} m {spot.favorite ? '• ⭐ Favorite' : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={MapColors.textMuted} />
            </Pressable>
          ))}

          {!parsedCoord && !searchResults.matchesHarbor && searchResults.spots.length === 0 ? (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No marine spots found for "{query}"</Text>
              <Text style={styles.noResultsSub}>Try typing coordinates like 20.35, 70.82</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Horizontal Category Filter Pills (Google Maps style) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
        style={styles.chipsRow}>
        <Chip
          label="All Spots"
          icon={<Ionicons name="map-outline" size={14} color={activeFilter === 'all' ? '#FFF' : MapColors.text} />}
          active={activeFilter === 'all'}
          onPress={() => onSelectFilter('all')}
        />
        <Chip
          label="Favorites"
          icon={<Ionicons name="star" size={14} color={activeFilter === 'favorites' ? '#FFF' : MapColors.yellow} />}
          active={activeFilter === 'favorites'}
          onPress={() => onSelectFilter('favorites')}
        />
        <Chip
          label="Harbors"
          icon={<MaterialCommunityIcons name="anchor" size={14} color={activeFilter === 'harbor' ? '#FFF' : '#38BDF8'} />}
          active={activeFilter === 'harbor'}
          onPress={() => onSelectFilter('harbor')}
        />
        <Chip
          label="Deep Sea"
          icon={<MaterialCommunityIcons name="waves" size={14} color={activeFilter === 'deep' ? '#FFF' : '#60A5FA'} />}
          active={activeFilter === 'deep'}
          onPress={() => onSelectFilter('deep')}
        />
        <Chip
          label="Hazards"
          icon={<Ionicons name="warning-outline" size={14} color={activeFilter === 'hazards' ? '#FFF' : MapColors.red} />}
          active={activeFilter === 'hazards'}
          onPress={() => onSelectFilter('hazards')}
        />
        <Chip
          label={measurementActive ? 'Measuring...' : 'Measure Dist'}
          icon={<MaterialCommunityIcons name="ruler" size={14} color={measurementActive ? '#FFF' : '#F59E0B'} />}
          active={measurementActive}
          onPress={() => onSelectFilter('measure')}
        />
        <Chip
          label="+ Add Waypoint"
          icon={<Ionicons name="add-circle-outline" size={14} color={activeFilter === 'add_spot' ? '#FFF' : MapColors.green} />}
          active={activeFilter === 'add_spot'}
          onPress={() => onSelectFilter('add_spot')}
        />
        <Chip
          label="🎯 Lat/Lng"
          icon={<Ionicons name="locate-outline" size={14} color={activeFilter === 'goto_coords' ? '#FFF' : MapColors.accent} />}
          active={activeFilter === 'goto_coords'}
          onPress={() => onSelectFilter('goto_coords')}
        />
      </ScrollView>
    </View>
  );
}

function Chip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.15)' }}>
      {icon}
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MapColors.navyGlass,
    borderRadius: 24,
    height: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  searchIconWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSideBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    color: MapColors.text,
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 0,
  },
  vDivider: {
    width: StyleSheet.hairlineWidth,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginHorizontal: 4,
  },
  dropdownCard: {
    backgroundColor: MapColors.navyPanel,
    borderRadius: 16,
    marginTop: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    maxHeight: 260,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    color: MapColors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  itemSub: {
    color: MapColors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  noResults: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    color: MapColors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  noResultsSub: {
    color: MapColors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  chipsRow: {
    marginTop: 8,
  },
  chipsScroll: {
    paddingRight: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: MapColors.navyGlass,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  chipActive: {
    backgroundColor: MapColors.accent,
    borderColor: MapColors.accent,
  },
  chipLabel: {
    color: MapColors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: '#FFFFFF',
  },
});
