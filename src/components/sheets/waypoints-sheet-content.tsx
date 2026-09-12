import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { WaypointCard } from '@/components/waypoint/waypoint-card';
import { WaypointModal } from '@/components/waypoint/waypoint-modal';
import { FishingSpot } from '@/constants/fishing-spots';
import { MapColors } from '@/constants/map-theme';
import { useWaypoints } from '@/context/waypoints-context';
import { useUserLocation } from '@/hooks/use-user-location';

type FilterType = 'all' | 'favorites' | 'deep' | 'reef' | 'wreck';

type WaypointsSheetContentProps = {
  onViewOnMap: (spot: FishingSpot) => void;
};

export function WaypointsSheetContent({ onViewOnMap }: WaypointsSheetContentProps) {
  const { location } = useUserLocation();
  const {
    waypoints,
    addWaypoint,
    updateWaypoint,
    deleteWaypoint,
    toggleFavorite,
    setSelectedSpotId,
    setActiveNavigationTarget,
  } = useWaypoints();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [spotToEdit, setSpotToEdit] = useState<FishingSpot | null>(null);

  const filteredSpots = useMemo(() => {
    return waypoints.filter((spot) => {
      const matchSearch =
        spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (spot.category && spot.category.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      switch (activeFilter) {
        case 'favorites':
          return !!spot.favorite;
        case 'deep':
          return spot.depthM >= 50;
        case 'reef':
          return spot.category?.toLowerCase().includes('reef') || spot.name.toLowerCase().includes('reef');
        case 'wreck':
          return spot.category?.toLowerCase().includes('wreck') || spot.name.toLowerCase().includes('wreck');
        default:
          return true;
      }
    });
  }, [waypoints, searchQuery, activeFilter]);

  const handleOpenAdd = () => {
    setSpotToEdit(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (spot: FishingSpot) => {
    setSpotToEdit(spot);
    setModalVisible(true);
  };

  const handleDeletePrompt = (spot: FishingSpot) => {
    Alert.alert(
      'Delete Waypoint',
      `Are you sure you want to delete "${spot.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteWaypoint(spot.id);
          },
        },
      ],
    );
  };

  const handleSaveModal = async (data: Omit<FishingSpot, 'id'>, editId?: string) => {
    if (editId) {
      await updateWaypoint(editId, data);
    } else {
      await addWaypoint(data);
    }
  };

  const handleSelectSpot = (spot: FishingSpot) => {
    setSelectedSpotId(spot.id);
    setActiveNavigationTarget(spot);
    onViewOnMap(spot);
  };

  return (
    <View style={styles.container}>
      {/* Search & Add Bar */}
      <View style={styles.topActionRow}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={17} color={MapColors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search waypoints or species..."
            placeholderTextColor={MapColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={MapColors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <Pressable style={styles.addBtn} onPress={handleOpenAdd} accessibilityRole="button">
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        {[
          { id: 'all', label: 'All' },
          { id: 'favorites', label: 'Favorites' },
          { id: 'deep', label: 'Deep (50m+)' },
          { id: 'reef', label: 'Coral Reefs' },
          { id: 'wreck', label: 'Shipwrecks' },
        ].map((item) => {
          const isSelected = activeFilter === item.id;
          return (
            <Pressable
              key={item.id}
              style={[styles.filterPill, isSelected && styles.filterPillActive]}
              onPress={() => setActiveFilter(item.id as FilterType)}
            >
              <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Waypoints List */}
      <FlatList
        data={filteredSpots}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="location-outline" size={44} color={MapColors.textMuted} />
            <Text style={styles.emptyTitle}>No Waypoints Found</Text>
            <Text style={styles.emptySub}>
              {searchQuery ? 'Try another search query' : 'Tap "+ Add" to save your first fishing waypoint.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <WaypointCard
            spot={item}
            userLocation={location}
            onSelect={handleSelectSpot}
            onEdit={handleOpenEdit}
            onDelete={handleDeletePrompt}
            onToggleFavorite={toggleFavorite}
            onViewOnMap={handleSelectSpot}
          />
        )}
      />

      {/* Add / Edit Modal */}
      <WaypointModal
        visible={modalVisible}
        spotToEdit={spotToEdit}
        userLocation={location}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  topActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    padding: 0,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  filterPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterPillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderColor: '#38BDF8',
  },
  filterText: {
    color: MapColors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  listContent: {
    paddingTop: 4,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySub: {
    color: MapColors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 240,
  },
});
