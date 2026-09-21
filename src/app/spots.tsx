import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FISHING_SPOTS, FishingSpot } from '@/constants/fishing-spots';
import { MapColors } from '@/constants/map-theme';
import { BottomTabInset } from '@/constants/theme';
import { useLanguage } from '@/context/language-context';
import { formatLatitude, formatLongitude, useUserLocation } from '@/hooks/use-user-location';
import { distanceNm, formatNm } from '@/utils/geo';

export default function SpotsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();
  const { location } = useUserLocation();

  const handleSpotPress = (_spot: FishingSpot) => {
    router.push('/map');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16, paddingBottom: BottomTabInset }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('waypoints.title', 'Fishing Waypoints')}</Text>
        <Text style={styles.subtitle}>{t('waypoints.subtitle', 'Coastal Hotspots & Recorded Catch Zones')}</Text>
      </View>

      {/* List of Spots */}
      <FlatList
        data={FISHING_SPOTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const nm = location
            ? distanceNm(location.latitude, location.longitude, item.latitude, item.longitude)
            : null;

          return (
            <Pressable
              style={styles.spotCard}
              onPress={() => handleSpotPress(item)}>
              <View style={[styles.colorBar, { backgroundColor: item.color }]} />

              <View style={styles.spotMain}>
                <View style={styles.spotTitleRow}>
                  <Text style={styles.spotName}>{item.name}</Text>
                  {item.favorite ? (
                    <Ionicons name="star" size={16} color={MapColors.yellow} />
                  ) : null}
                </View>

                <Text style={styles.spotCoords}>
                  {formatLatitude(item.latitude)} • {formatLongitude(item.longitude)}
                </Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaBadge}>
                    <MaterialCommunityIcons name="waves" size={13} color={MapColors.accent} />
                    <Text style={styles.metaText}>{item.depthM} m depth</Text>
                  </View>

                  {nm != null ? (
                    <View style={styles.metaBadge}>
                      <MaterialCommunityIcons
                        name="arrow-top-right-bottom-left"
                        size={13}
                        color={MapColors.green}
                      />
                      <Text style={styles.metaText}>{formatNm(nm)} away</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.navArrowWrap}>
                <Ionicons name="navigate" size={20} color={MapColors.accent} />
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: MapColors.navy,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    color: MapColors.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: MapColors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  harborCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: MapColors.navyPanel,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    marginBottom: 16,
  },
  harborIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  harborInfo: {
    flex: 1,
  },
  harborTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  harborSub: {
    color: MapColors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  viewMapBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewMapText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  spotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MapColors.navyPanel,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  colorBar: {
    width: 6,
    alignSelf: 'stretch',
  },
  spotMain: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  spotTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  spotName: {
    color: MapColors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  spotCoords: {
    color: MapColors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: MapColors.navyGlass,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaText: {
    color: MapColors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  navArrowWrap: {
    paddingRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
