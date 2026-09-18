import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Keyboard,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { FishingSpot } from '@/constants/fishing-spots';
import { MapColors } from '@/constants/map-theme';
import { useAuth } from '@/context/auth-context';
import { useSubscription } from '@/context/subscription-context';
import { useAppTheme } from '@/context/theme-context';
import { useWaypoints } from '@/context/waypoints-context';
import type { UserLocation } from '@/hooks/use-user-location';
import { distanceNm, formatBearing, formatNm } from '@/utils/geo';

// Predefined Major Coastal Ports & Fishing Harbors
const COASTAL_PORTS = [
  {
    id: 'port-veraval',
    name: 'Veraval Fishing Harbor',
    state: 'Gujarat',
    latitude: 20.9000,
    longitude: 70.3667,
    depthM: 18,
    category: 'Port / Harbor',
    notes: 'Major Indian Ghol, Pomfret & Deep Sea Trawler Port',
  },
  {
    id: 'port-porbandar',
    name: 'Porbandar Coastal Port',
    state: 'Gujarat',
    latitude: 21.6417,
    longitude: 69.6083,
    depthM: 22,
    category: 'Port / Harbor',
    notes: 'Commercial Trawler Base & Coast Guard Station',
  },
  {
    id: 'port-mangrol',
    name: 'Mangrol Fish Landing',
    state: 'Gujarat',
    latitude: 21.1200,
    longitude: 70.1167,
    depthM: 14,
    category: 'Port / Harbor',
    notes: 'Artisanal Fishery & Nearshore Reef Harbor',
  },
  {
    id: 'port-okha',
    name: 'Okha Port & Gulf Channel',
    state: 'Gujarat',
    latitude: 22.4667,
    longitude: 69.0667,
    depthM: 28,
    category: 'Port / Harbor',
    notes: 'Gateway to Gulf of Kutch & Bet Dwarka Reefs',
  },
  {
    id: 'port-diu',
    name: 'Diu Vanakbara Anchorage',
    state: 'Diu',
    latitude: 20.7144,
    longitude: 70.9874,
    depthM: 16,
    category: 'Port / Harbor',
    notes: 'Deep Harbor for Traditional Fishing Craft',
  },
  {
    id: 'port-jafrabad',
    name: 'Jafrabad Fishing Jetty',
    state: 'Gujarat',
    latitude: 20.8667,
    longitude: 71.3667,
    depthM: 20,
    category: 'Port / Harbor',
    notes: 'Famous for Bombay Duck & Ribbon Fish Grounds',
  },
  {
    id: 'port-mumbai',
    name: 'Sassoon Dock, Mumbai',
    state: 'Maharashtra',
    latitude: 18.9167,
    longitude: 72.8250,
    depthM: 24,
    category: 'Port / Harbor',
    notes: 'Historic Indian Deep Sea Tuna & Prawn Harbor',
  },
];

// App Features & Navigation Tools
const APP_FEATURES = [
  {
    id: 'feat-weather',
    name: 'Weather & Tide Forecast',
    desc: 'Live wind, waves, tide curves & sea state advisory',
    icon: 'partly-sunny',
    iconColor: '#38BDF8',
    category: 'Marine Telemetry',
    target: 'tab:weather' as const,
  },
  {
    id: 'feat-compass',
    name: 'Marine Gyro Compass',
    desc: 'Real-time steering lubber line & bearing heading',
    icon: 'compass',
    iconColor: '#10B981',
    category: 'Navigation Sensor',
    target: 'tab:compass' as const,
  },
  {
    id: 'feat-calendar',
    name: 'Solunar Fish Calendar',
    desc: 'Major/minor bite hours, moon phase & solunar rating',
    icon: 'moon',
    iconColor: '#F59E0B',
    category: 'Solunar Activity',
    target: 'tab:calendar' as const,
  },
  {
    id: 'feat-waypoints',
    name: 'Saved Waypoints & Hotspots',
    desc: 'List of marine GPS markers, depths & fish species',
    icon: 'location',
    iconColor: '#A78BFA',
    category: 'Chartplotter Logs',
    target: 'tab:waypoint' as const,
  },
  {
    id: 'feat-trips',
    name: 'Trips & Routes Logbook',
    desc: 'Recorded vessel tracks, voyage distances & log history',
    icon: 'navigate',
    iconColor: '#00F0FF',
    category: 'Voyage Logbook',
    target: 'route:/trips' as const,
  },
  {
    id: 'feat-settings',
    name: 'Vessel Profile & Alarms',
    desc: 'Draft limits, units, GPX backup & shallow water alarms',
    icon: 'settings-sharp',
    iconColor: '#94A3B8',
    category: 'Configuration',
    target: 'tab:settings' as const,
  },
  {
    id: 'feat-coords',
    name: 'Go to GPS Coordinates',
    desc: 'Plot raw decimal or nautical coordinates on marine chart',
    icon: 'locate',
    iconColor: '#00F0FF',
    category: 'Navigation Tool',
    target: 'action:coords' as const,
  },
  {
    id: 'feat-layers',
    name: 'Map Layers & Bathymetry',
    desc: 'Switch between satellite, standard, seamarks & contours',
    icon: 'layers',
    iconColor: '#38BDF8',
    category: 'Chart Settings',
    target: 'action:layers' as const,
  },
  {
    id: 'feat-sos',
    name: 'Emergency Coast Guard SOS',
    desc: 'Direct hotline 1554 for Indian maritime rescue',
    icon: 'warning',
    iconColor: '#EF4444',
    category: 'Maritime Safety',
    target: 'action:sos' as const,
  },
];

type MarineSearchHeaderProps = {
  userLocation: UserLocation | null;
  onOpenMore: () => void;
  onOpenProfile: () => void;
  onSelectSpot: (spot: FishingSpot) => void;
  onPlotCoordinate: (lat: number, lng: number, label?: string) => void;
  onOpenTab: (tab: 'waypoint' | 'weather' | 'compass' | 'calendar' | 'settings') => void;
  onOpenCoordsModal?: () => void;
  onOpenLayersModal?: () => void;
  onFocus?: () => void;
  hidden?: boolean;
};

export function MarineSearchHeader({
  userLocation,
  onOpenMore,
  onOpenProfile,
  onSelectSpot,
  onPlotCoordinate,
  onOpenTab,
  onOpenCoordsModal,
  onOpenLayersModal,
  onFocus,
  hidden = false,
}: MarineSearchHeaderProps) {
  const { colors, isLight } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { captain } = useAuth();
  const { waypoints } = useWaypoints();
  const {
    isPro,
    proPlan,
    proDaysRemaining,
    isExpiringSoon,
    hasReferralBonus,
    bonusProDaysRemaining,
    isTrialActive,
    isTrialExpired,
    trialDaysRemaining,
    openProModal,
  } = useSubscription();

  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Smooth slide-up animation when sheet/tab opens
  const animY = useRef(new Animated.Value(0)).current;
  const animOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (hidden) {
      Keyboard.dismiss();
      setIsFocused(false);
    }

    Animated.parallel([
      Animated.spring(animY, {
        toValue: hidden ? -120 : 0,
        friction: 8,
        tension: 50,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(animOpacity, {
        toValue: hidden ? 0 : 1,
        duration: hidden ? 200 : 250,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [hidden]);

  // Parse potential coordinates typed in search bar (e.g. "20.35, 70.82" or "20.35 70.82")
  const parsedCoords = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return null;

    // Pattern: 2 numbers separated by comma or space
    const match = trimmed.match(/^(-?\d{1,2}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)$/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
    return null;
  }, [query]);

  // Universal Filtered Results
  const searchResults = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return { waypoints: [], ports: [], features: [] };

    // 1. Waypoints & Spots
    const matchedWaypoints = waypoints.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (w.category && w.category.toLowerCase().includes(q)) ||
        (w.notes && w.notes.toLowerCase().includes(q)),
    );

    // 2. Coastal Ports & Harbors
    const matchedPorts = COASTAL_PORTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.state.toLowerCase().includes(q) ||
        p.notes.toLowerCase().includes(q),
    );

    // 3. App Features & Navigation Tools
    const matchedFeatures = APP_FEATURES.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.desc.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q),
    );

    return {
      waypoints: matchedWaypoints,
      ports: matchedPorts,
      features: matchedFeatures,
    };
  }, [query, waypoints]);

  const totalResultsCount =
    (parsedCoords ? 1 : 0) +
    searchResults.waypoints.length +
    searchResults.ports.length +
    searchResults.features.length;

  const handleClear = () => {
    setQuery('');
  };

  const handleCloseSearch = () => {
    setQuery('');
    setIsFocused(false);
    Keyboard.dismiss();
  };

  const handleSelectFeature = (target: string) => {
    handleCloseSearch();
    if (target.startsWith('tab:')) {
      const tabName = target.replace('tab:', '') as
        | 'waypoint'
        | 'weather'
        | 'compass'
        | 'calendar'
        | 'settings';
      onOpenTab(tabName);
    } else if (target.startsWith('route:')) {
      router.push(target.replace('route:', '') as any);
    } else if (target === 'action:coords') {
      onOpenCoordsModal?.();
    } else if (target === 'action:layers') {
      onOpenLayersModal?.();
    } else if (target === 'action:sos') {
      Alert.alert(
        '🚨 Indian Coast Guard Distress SOS',
        'Toll-free 24x7 Marine Rescue: 1554\n\nDial emergency rescue service now?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Call 1554',
            style: 'destructive',
            onPress: () => {
              Linking.openURL('tel:1554').catch(() => {
                Alert.alert('Unable to place call', 'Please dial 1554 manually.');
              });
            },
          },
        ],
      );
    }
  };

  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth >= 600;
  const headerLeftOffset = isTablet
    ? Math.max((windowWidth - 640) / 2, 20)
    : Math.max(insets.left + 12, 12);
  const headerRightOffset = isTablet
    ? Math.max((windowWidth - 640) / 2, 20)
    : Math.max(insets.right + 12, 12);

  return (
    <Animated.View
      style={[
        styles.headerContainer,
        {
          top: Math.max(insets.top, Platform.OS === 'ios' ? 12 : 8) + 4,
          left: headerLeftOffset,
          right: headerRightOffset,
          maxWidth: isTablet ? 640 : undefined,
          alignSelf: 'center',
          transform: [{ translateY: animY }],
          opacity: animOpacity,
        },
        isFocused && { zIndex: 500, elevation: 40 },
      ]}
      pointerEvents={hidden ? 'none' : 'box-none'}
    >
      {/* 🟢 Search Bar Pill Row (Left: More, Center: Search Input, Right: Captain Avatar) */}
      <View
        style={[
          styles.searchBarRow,
          {
            backgroundColor: colors.searchBarBg,
            borderColor: colors.searchBarBorder,
          },
        ]}
      >
        {/* 1. START: Map Layers & Nautical Details Button */}
        {isFocused ? (
          <Pressable
            onPress={handleCloseSearch}
            hitSlop={10}
            style={[styles.actionPillBtn, { backgroundColor: colors.chipBg }]}
            accessibilityRole="button"
            accessibilityLabel="Back to map"
          >
            <Ionicons name="arrow-back" size={20} color={colors.accent} />
          </Pressable>
        ) : (
          <Pressable
            onPress={onOpenMore}
            hitSlop={10}
            style={[styles.actionPillBtn, { backgroundColor: colors.chipBg }]}
            accessibilityRole="button"
            accessibilityLabel="Map Layers & Nautical Details"
          >
            <Ionicons name="layers" size={20} color={colors.accent} />
          </Pressable>
        )}

        {/* 2. CENTER: Google-Style Search Input Bar */}
        <View style={styles.inputContainer}>
          <Ionicons name="search" size={17} color={colors.accent} style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={[styles.textInput, { color: colors.text }]}
            value={query}
            onChangeText={setQuery}
            onFocus={() => {
              setIsFocused(true);
              onFocus?.();
            }}
            placeholder="Search spots, coords, weather, ports..."
            placeholderTextColor={colors.textSecondary}
            returnKeyType="search"
            autoCorrect={false}
          />

          {query.length > 0 && (
            <Pressable onPress={handleClear} hitSlop={10} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Pro / 3-Day Trial Status Badge */}
        <Pressable
          style={[
            styles.trialBadgePill,
            {
              backgroundColor: isPro
                ? isExpiringSoon
                  ? 'rgba(239, 68, 68, 0.16)'
                  : 'rgba(245, 158, 11, 0.15)'
                : hasReferralBonus
                  ? 'rgba(34, 197, 94, 0.15)'
                  : isTrialExpired
                    ? 'rgba(239, 68, 68, 0.16)'
                    : isLight
                      ? '#EFF6FF'
                      : 'rgba(0, 240, 255, 0.14)',
              borderColor: isPro
                ? isExpiringSoon
                  ? '#EF4444'
                  : '#F59E0B'
                : hasReferralBonus
                  ? '#22C55E'
                  : isTrialExpired
                    ? '#EF4444'
                    : colors.accent,
            },
          ]}
          onPress={() => openProModal('header_badge')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="FishNav Pro membership status"
        >
          {isPro ? (
            <>
              <MaterialCommunityIcons
                name={isExpiringSoon ? 'alert-circle' : 'crown'}
                size={12}
                color={isExpiringSoon ? '#EF4444' : '#F59E0B'}
              />
              <Text style={[styles.trialBadgeText, { color: isExpiringSoon ? '#EF4444' : '#F59E0B' }]}>
                {isExpiringSoon
                  ? `PRO ${proDaysRemaining}d ⚠️`
                  : proPlan === 'lifetime'
                    ? 'PRO ♾️'
                    : proDaysRemaining <= 60
                      ? `PRO ${proDaysRemaining}d`
                      : 'PRO 👑'}
              </Text>
            </>
          ) : hasReferralBonus ? (
            <>
              <Ionicons name="gift" size={12} color="#22C55E" />
              <Text style={[styles.trialBadgeText, { color: '#22C55E' }]}>{bonusProDaysRemaining}d BONUS</Text>
            </>
          ) : isTrialExpired ? (
            <>
              <Ionicons name="alert-circle" size={12} color="#EF4444" />
              <Text style={[styles.trialBadgeText, { color: '#EF4444' }]}>EXPIRED</Text>
            </>
          ) : (
            <>
              <Ionicons name="flash" size={11} color={colors.accent} />
              <Text style={[styles.trialBadgeText, { color: colors.accent }]}>
                {trialDaysRemaining}d TRIAL
              </Text>
            </>
          )}
        </Pressable>

        {/* 3. LAST / END: User Profile Avatar */}
        <Pressable
          onPress={onOpenProfile}
          hitSlop={10}
          style={[styles.profileBtn, { borderColor: colors.accent }]}
          accessibilityRole="button"
          accessibilityLabel="Captain and vessel profile"
        >
          <View style={styles.avatarInner}>
            {captain?.avatarUrl ? (
              <Image source={{ uri: captain.avatarUrl }} style={styles.avatarImg} />
            ) : (
              <MaterialCommunityIcons name="ship-wheel" size={18} color={colors.accent} />
            )}
          </View>
        </Pressable>
      </View>

      {/* 🟡 Universal Search Results / Suggestions Dropdown */}
      {isFocused && (
        <View
          style={[
            styles.resultsCard,
            {
              backgroundColor: colors.sheetBg,
              borderColor: colors.sheetBorder,
            },
          ]}
        >
          <ScrollView
            style={styles.resultsScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* A. If user typed GPS Coordinates -> Quick Plot Banner */}
            {parsedCoords && (
              <Pressable
                style={styles.coordPlotRow}
                onPress={() => {
                  onPlotCoordinate(
                    parsedCoords.lat,
                    parsedCoords.lng,
                    `GPS (${parsedCoords.lat.toFixed(4)}, ${parsedCoords.lng.toFixed(4)})`,
                  );
                  handleCloseSearch();
                }}
              >
                <View style={styles.coordPlotIcon}>
                  <Ionicons name="navigate-circle" size={24} color="#00F0FF" />
                </View>
                <View style={styles.resultTextWrap}>
                  <Text style={styles.coordPlotTitle}>
                    Plot GPS Coordinates on Chart
                  </Text>
                  <Text style={styles.coordPlotSub}>
                    {parsedCoords.lat.toFixed(4)}°N, {parsedCoords.lng.toFixed(4)}°E • Tap to view on chart
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color="#00F0FF" />
              </Pressable>
            )}

            {/* B. When query is empty: Show Quick Suggestions Chips */}
            {!query.trim() && (
              <View style={styles.quickSection}>
                <Text style={styles.sectionHeader}>SUGGESTIONS & QUICK ACCESS</Text>
                <View style={styles.chipGrid}>
                  {[
                    { label: '🎣 Ghol Spots', q: 'Ghol' },
                    { label: '🌊 Tide Forecast', feat: 'tab:weather' },
                    { label: '🧭 Marine Compass', feat: 'tab:compass' },
                    { label: '⚓ Veraval Harbor', q: 'Veraval' },
                    { label: '🌙 Fish Bite Times', feat: 'tab:calendar' },
                    { label: '📜 Trips Logbook', feat: 'route:/trips' },
                  ].map((chip) => (
                    <Pressable
                      key={chip.label}
                      style={styles.chip}
                      onPress={() => {
                        if (chip.q) {
                          setQuery(chip.q);
                        } else if (chip.feat) {
                          handleSelectFeature(chip.feat);
                        }
                      }}
                    >
                      <Text style={styles.chipText}>{chip.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* C. Waypoints & Fishing Spots Matches */}
            {searchResults.waypoints.length > 0 && (
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionHeader}>
                  FISHING HOTSPOTS ({searchResults.waypoints.length})
                </Text>
                {searchResults.waypoints.map((item) => {
                  let distanceText = '';
                  let bearingText = '';
                  if (userLocation) {
                    const dist = distanceNm(userLocation.latitude, userLocation.longitude, item.latitude, item.longitude);
                    distanceText = formatNm(dist);
                  }

                  return (
                    <Pressable
                      key={item.id}
                      style={styles.resultRow}
                      onPress={() => {
                        onSelectSpot(item);
                        handleCloseSearch();
                      }}
                    >
                      <View
                        style={[
                          styles.resultIcon,
                          { backgroundColor: `${item.color || '#F59E0B'}25` },
                        ]}
                      >
                        <Ionicons
                          name="location"
                          size={18}
                          color={item.color || '#F59E0B'}
                        />
                      </View>
                      <View style={styles.resultTextWrap}>
                        <View style={styles.titleRow}>
                          <Text style={styles.resultTitle}>{item.name}</Text>
                          {item.favorite && (
                            <Ionicons name="star" size={12} color="#FBBF24" />
                          )}
                        </View>
                        <Text style={styles.resultSubtitle}>
                          {item.category || 'Waypoint'} • Depth {item.depthM}m
                          {distanceText ? ` • ${distanceText} away` : ''}
                        </Text>
                      </View>
                      <Ionicons name="navigate-outline" size={18} color="#38BDF8" />
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* D. Coastal Ports & Fishing Harbors */}
            {searchResults.ports.length > 0 && (
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionHeader}>
                  COASTAL PORTS & HARBORS ({searchResults.ports.length})
                </Text>
                {searchResults.ports.map((port) => (
                  <Pressable
                    key={port.id}
                    style={styles.resultRow}
                    onPress={() => {
                      onPlotCoordinate(port.latitude, port.longitude, port.name);
                      handleCloseSearch();
                    }}
                  >
                    <View style={[styles.resultIcon, styles.portIconWrap]}>
                      <MaterialCommunityIcons name="anchor" size={18} color="#38BDF8" />
                    </View>
                    <View style={styles.resultTextWrap}>
                      <Text style={styles.resultTitle}>{port.name}</Text>
                      <Text style={styles.resultSubtitle}>
                        {port.state} • {port.notes}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#64748B" />
                  </Pressable>
                ))}
              </View>
            )}

            {/* E. App Navigation Tools & Features */}
            {searchResults.features.length > 0 && (
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionHeader}>
                  APPLICATION FEATURES & TOOLS ({searchResults.features.length})
                </Text>
                {searchResults.features.map((feat) => (
                  <Pressable
                    key={feat.id}
                    style={styles.resultRow}
                    onPress={() => handleSelectFeature(feat.target)}
                  >
                    <View
                      style={[
                        styles.resultIcon,
                        { backgroundColor: `${feat.iconColor}22` },
                      ]}
                    >
                      <Ionicons
                        name={feat.icon as any}
                        size={18}
                        color={feat.iconColor}
                      />
                    </View>
                    <View style={styles.resultTextWrap}>
                      <Text style={styles.resultTitle}>{feat.name}</Text>
                      <Text style={styles.resultSubtitle}>
                        {feat.category} • {feat.desc}
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward" size={16} color="#64748B" />
                  </Pressable>
                ))}
              </View>
            )}

            {/* No matches fallback */}
            {query.trim().length > 1 && totalResultsCount === 0 && (
              <View style={styles.noResultsWrap}>
                <Ionicons name="search-outline" size={36} color="#64748B" />
                <Text style={styles.noResultsTitle}>No Marine Matches Found</Text>
                <Text style={styles.noResultsSub}>
                  Try searching for "Ghol", "Tides", "Compass", "Veraval", or enter GPS coordinates (e.g. 20.35, 70.82)
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    zIndex: 120, // Sits above map controls (10), below active AppTabs (150)
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(4, 23, 40, 0.95)',
    borderRadius: 26,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 16,
    gap: 8,
  },
  actionPillBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 6,
    paddingRight: 6,
  },
  clearBtn: {
    padding: 4,
  },
  profileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(2, 132, 199, 0.25)',
    borderWidth: 1.5,
    borderColor: '#00F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
  },
  resultsCard: {
    backgroundColor: 'rgba(4, 23, 40, 0.98)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    marginTop: 8,
    maxHeight: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
  },
  resultsScroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  coordPlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#00F0FF',
    marginBottom: 10,
    gap: 12,
  },
  coordPlotIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coordPlotTitle: {
    color: '#00F0FF',
    fontSize: 13,
    fontWeight: '800',
  },
  coordPlotSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  quickSection: {
    paddingVertical: 6,
  },
  sectionWrap: {
    marginBottom: 14,
  },
  sectionHeader: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portIconWrap: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  resultTextWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  resultSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  noResultsWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    gap: 8,
  },
  noResultsTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  noResultsSub: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  trialBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    marginRight: 6,
  },
  trialBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
