import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GUJARAT_PORTS } from '@/constants/gujarat-ports';
import { FishingSpot } from '@/constants/fishing-spots';
import { useLanguage } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';
import { useWaypoints } from '@/context/waypoints-context';
import { useUserLocation } from '@/hooks/use-user-location';
import { bearingDegrees, distanceNm, formatBearing, formatNm } from '@/utils/geo';

type TargetWaypointPickerModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function TargetWaypointPickerModal({ visible, onClose }: TargetWaypointPickerModalProps) {
  const { colors, isLight } = useAppTheme();
  const { t } = useLanguage();
  const { location } = useUserLocation();
  const { waypoints, activeNavigationTarget, setActiveNavigationTarget } = useWaypoints();
  const [searchQuery, setSearchQuery] = useState('');

  // Prepare full list: user waypoints + default Gujarat ports if list is small
  const targetItems = useMemo(() => {
    const list: FishingSpot[] = [...waypoints];

    // If user has few or no waypoints, also provide top Gujarat major fishing ports as targets
    if (waypoints.length < 5) {
      GUJARAT_PORTS.slice(0, 15).forEach((port) => {
        const alreadyExists = list.some(
          (w) => Math.abs(w.latitude - port.latitude) < 0.001 && Math.abs(w.longitude - port.longitude) < 0.001
        );
        if (!alreadyExists) {
          list.push({
            id: `port-${port.id}`,
            name: `${port.name}`,
            latitude: port.latitude,
            longitude: port.longitude,
            depthM: 25,
            color: '#38BDF8',
            category: 'Port / Bandar',
            notes: port.description,
          });
        }
      });
    }

    // Filter by search query
    let filtered = list;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      filtered = list.filter((s) => s.name.toLowerCase().includes(q) || (s.category && s.category.toLowerCase().includes(q)));
    }

    // Sort by distance from current user location
    if (location) {
      return [...filtered].sort((a, b) => {
        const distA = distanceNm(location.latitude, location.longitude, a.latitude, a.longitude);
        const distB = distanceNm(location.latitude, location.longitude, b.latitude, b.longitude);
        return distA - distB;
      });
    }

    return filtered;
  }, [waypoints, searchQuery, location]);

  const handleSelectSpot = (spot: FishingSpot) => {
    setActiveNavigationTarget(spot);
    onClose();
  };

  const handleClearTarget = () => {
    setActiveNavigationTarget(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isLight ? '#FFFFFF' : '#0B1C2D',
              borderColor: isLight ? '#E2E8F0' : 'rgba(56, 189, 248, 0.25)',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIconWrap, { backgroundColor: isLight ? '#E0F2FE' : 'rgba(56, 189, 248, 0.15)' }]}>
                <Ionicons name="navigate" size={18} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  {t('compass.set_target_title', 'SELECT TARGET WAYPOINT')}
                </Text>
                <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                  {t('compass.set_target_sub', 'Steer guide & bearing will point to chosen spot')}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.chipBg, borderColor: colors.chipBorder }]}
              hitSlop={8}
            >
              <Ionicons name="close" size={18} color={colors.text} />
            </Pressable>
          </View>

          {/* Active Target Banner with Clear Button */}
          {activeNavigationTarget && (
            <View
              style={[
                styles.activeTargetBanner,
                {
                  backgroundColor: isLight ? '#F0FDF4' : 'rgba(34, 197, 94, 0.12)',
                  borderColor: isLight ? '#BBF7D0' : 'rgba(34, 197, 94, 0.3)',
                },
              ]}
            >
              <View style={styles.activeTargetLeft}>
                <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.activeTargetLabel, { color: '#22C55E' }]}>CURRENT TARGET</Text>
                  <Text style={[styles.activeTargetName, { color: isLight ? '#166534' : '#86EFAC' }]} numberOfLines={1}>
                    {activeNavigationTarget.name}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={handleClearTarget}
                style={styles.clearTargetBtn}
                accessibilityRole="button"
                accessibilityLabel="Clear Target"
              >
                <Ionicons name="trash-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                <Text style={styles.clearTargetText}>Clear Target</Text>
              </Pressable>
            </View>
          )}

          {/* Search Box */}
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: isLight ? '#F8FAFC' : 'rgba(255, 255, 255, 0.06)',
                borderColor: isLight ? '#CBD5E1' : 'rgba(255, 255, 255, 0.12)',
              },
            ]}
          >
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t('compass.search_waypoint', 'Search waypoints or ports...')}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          {/* Waypoints List */}
          <FlatList
            data={targetItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = activeNavigationTarget?.id === item.id;
              const distNm = location
                ? distanceNm(location.latitude, location.longitude, item.latitude, item.longitude)
                : null;
              const bearing = location
                ? bearingDegrees(location.latitude, location.longitude, item.latitude, item.longitude)
                : null;

              return (
                <Pressable
                  onPress={() => handleSelectSpot(item)}
                  style={[
                    styles.itemCard,
                    {
                      backgroundColor: isSelected
                        ? isLight
                          ? '#E0F2FE'
                          : 'rgba(56, 189, 248, 0.16)'
                        : isLight
                        ? '#F8FAFC'
                        : 'rgba(255, 255, 255, 0.04)',
                      borderColor: isSelected
                        ? colors.accent
                        : isLight
                        ? '#E2E8F0'
                        : 'rgba(255, 255, 255, 0.08)',
                    },
                  ]}
                >
                  <View style={[styles.itemIconWrap, { backgroundColor: item.color || colors.accent }]}>
                    <MaterialCommunityIcons
                      name={item.category === 'Port / Bandar' ? 'anchor' : 'map-marker-distance'}
                      size={18}
                      color="#FFFFFF"
                    />
                  </View>

                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.itemMetaRow}>
                      {distNm != null && (
                        <Text style={[styles.itemDist, { color: colors.accent }]}>
                          {formatNm(distNm)}
                        </Text>
                      )}
                      {bearing != null && (
                        <Text style={[styles.itemBearing, { color: colors.textMuted }]}>
                          • {formatBearing(bearing)}
                        </Text>
                      )}
                      {item.category ? (
                        <Text style={[styles.itemCategory, { color: colors.textMuted }]}>
                          • {item.category}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.itemAction}>
                    {isSelected ? (
                      <View style={[styles.selectedBadge, { backgroundColor: colors.accent }]}>
                        <Ionicons name="checkmark" size={14} color="#001428" />
                        <Text style={styles.selectedBadgeText}>Active</Text>
                      </View>
                    ) : (
                      <View style={[styles.selectBtn, { borderColor: colors.chipBorder }]}>
                        <Text style={[styles.selectBtnText, { color: colors.accent }]}>Select</Text>
                        <Ionicons name="chevron-forward" size={13} color={colors.accent} />
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="navigate-circle-outline" size={42} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Waypoints Found</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                  Add waypoints from the Waypoints tab to steer to them here.
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    maxHeight: '82%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.5,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 10.5,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTargetBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  activeTargetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  activeTargetLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activeTargetName: {
    fontSize: 12,
    fontWeight: '700',
  },
  clearTargetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  clearTargetText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  listContent: {
    paddingBottom: 16,
    gap: 8,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  itemIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 3,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemDist: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  itemBearing: {
    fontSize: 11,
    fontWeight: '600',
  },
  itemCategory: {
    fontSize: 10.5,
  },
  itemAction: {},
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  selectedBadgeText: {
    color: '#001428',
    fontSize: 11,
    fontWeight: '800',
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
