import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapColors } from '@/constants/map-theme';
import { LocationStatus } from '@/hooks/use-user-location';

type MapHeaderProps = {
  onBack?: () => void;
  placeLabel?: string | null;
  status: LocationStatus;
};

export function MapHeader({ onBack, placeLabel, status }: MapHeaderProps) {
  const insets = useSafeAreaInsets();
  const connected = status === 'granted';
  const locationName = placeLabel?.trim() || 'Locating…';

  let statusLabel = 'Searching GPS…';
  if (status === 'requesting') statusLabel = 'Permission…';
  if (status === 'denied') statusLabel = 'Permission Denied';
  if (status === 'disabled') statusLabel = 'GPS Off';
  if (status === 'error') statusLabel = 'GPS Error';
  if (connected) statusLabel = 'GPS Connected';

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 6 }]}>
      <View style={styles.row}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={MapColors.text} />
        </Pressable>

        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <MaterialCommunityIcons name="map" size={18} color={MapColors.accent} />
            <Text style={styles.title}>Marine Map</Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.liveDot, !connected && styles.liveDotWarn]} />
            <Text style={styles.status} numberOfLines={1}>
              {locationName} · {statusLabel}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable hitSlop={10} style={styles.iconBtn}>
            <Ionicons name="search" size={20} color={MapColors.text} />
          </Pressable>
          <Pressable hitSlop={10} style={styles.iconBtn}>
            <Ionicons name="layers-outline" size={20} color={MapColors.text} />
          </Pressable>
          <Pressable hitSlop={10} style={styles.iconBtn}>
            <Ionicons name="ellipsis-vertical" size={18} color={MapColors.text} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 8,
    paddingBottom: 10,
    backgroundColor: MapColors.navy,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    marginLeft: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: MapColors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: MapColors.green,
  },
  liveDotWarn: {
    backgroundColor: MapColors.yellow,
  },
  status: {
    color: MapColors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
