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
import { useLanguage } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';
import { useWaypoints } from '@/context/waypoints-context';
import { useUserLocation } from '@/hooks/use-user-location';

type FilterType = 'all' | 'favorites' | 'deep' | 'reef' | 'wreck';

type WaypointsSheetContentProps = {
  onViewOnMap: (spot: FishingSpot) => void;
  onStartNavigation?: (spot: FishingSpot) => void;
};

export function WaypointsSheetContent({
  onViewOnMap,
  onStartNavigation,
}: WaypointsSheetContentProps) {
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

  const { colors, isLight } = useAppTheme();
  const { t } = useLanguage();

  const handleDeletePrompt = (spot: FishingSpot) => {
    Alert.alert(
      t('waypoints.delete_title', 'Delete Waypoint'),
      t('waypoints.delete_confirm', `Are you sure you want to delete "${spot.name}"? This action cannot be undone.`),
      [
        { text: t('btn.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('btn.delete', 'Delete'),
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
        <View
          style={[
            styles.searchWrap,
            {
              backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.06)',
              borderColor: colors.divider,
            },
          ]}
        >
          <Ionicons name="search" size={17} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('waypoints.search_placeholder', 'Search waypoints or species...')}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          style={[styles.addBtn, { backgroundColor: colors.accent }]}
          onPress={handleOpenAdd}
          accessibilityRole="button"
        >
          <Ionicons name="add" size={18} color={isLight ? '#FFFFFF' : '#020B14'} />
          <Text style={[styles.addBtnText, { color: isLight ? '#FFFFFF' : '#020B14' }]}>{t('waypoints.add_spot', 'Add')}</Text>
        </Pressable>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        {[
          { id: 'all', label: t('waypoints.filter_all', 'All') },
          { id: 'favorites', label: t('waypoints.filter_favorites', 'Favorites') },
          { id: 'deep', label: t('waypoints.filter_deep', 'Deep (50m+)') },
          { id: 'reef', label: t('waypoints.filter_reefs', 'Coral Reefs') },
          { id: 'wreck', label: t('waypoints.filter_wrecks', 'Shipwrecks') },
        ].map((item) => {
          const isSelected = activeFilter === item.id;
          return (
            <Pressable
              key={item.id}
              style={[
                styles.filterPill,
                {
                  backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.06)',
                  borderColor: colors.divider,
                },
                isSelected && {
                  backgroundColor: colors.chipBg,
                  borderColor: colors.accent,
                },
              ]}
              onPress={() => setActiveFilter(item.id as FilterType)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: colors.textSecondary },
                  isSelected && { color: colors.accent, fontWeight: '700' },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Waypoints List */}
      <FlatList
        data={filteredSpots}
        style={styles.list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="location-outline" size={44} color={MapColors.textMuted} />
            <Text style={styles.emptyTitle}>{t('waypoints.empty_title', 'No Waypoints Found')}</Text>
            <Text style={styles.emptySub}>
              {searchQuery ? t('waypoints.empty_sub', 'Try another search query') : t('waypoints.empty_sub', 'Tap "+ Add" to save your first fishing waypoint.')}
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
            onStartNavigation={onStartNavigation || handleSelectSpot}
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
    flexGrow: 0,
    flexShrink: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  list: {
    flexGrow: 0,
    flexShrink: 1,
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
