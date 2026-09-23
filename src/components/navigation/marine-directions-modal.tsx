import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Modal,
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
import { useAppTheme } from '@/context/theme-context';
import { useSettings } from '@/context/settings-context';
import type { UserLocation } from '@/hooks/use-user-location';
import { bearingDegrees, distanceNm, etaFromNm, formatBearing, formatNm } from '@/utils/geo';

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

type MarineDirectionsModalProps = {
  visible: boolean;
  onClose: () => void;
  userLocation: UserLocation | null;
  waypoints: FishingSpot[];
  initialDestination?: FishingSpot | null;
  onStartNavigation: (destination: FishingSpot) => void;
  onChooseOnMap: () => void;
  onOpenCoordsModal?: () => void;
};

export function MarineDirectionsModal({
  visible,
  onClose,
  userLocation,
  waypoints,
  initialDestination = null,
  onStartNavigation,
  onChooseOnMap,
  onOpenCoordsModal,
}: MarineDirectionsModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isLight } = useAppTheme();
  const { formatDistance, formatDepth } = useSettings();
  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth >= 600;

  // Active editable fields (Google Maps style)
  const [fromText, setFromText] = useState<string>('Your location');
  const [toText, setToText] = useState<string>(initialDestination?.name ?? '');
  const [activeField, setActiveField] = useState<'from' | 'to'>('to');

  // Currently resolved destination object
  const [destination, setDestination] = useState<FishingSpot | null>(initialDestination);

  // Sync with initialDestination when opened or changed
  React.useEffect(() => {
    if (initialDestination) {
      setDestination(initialDestination);
      setToText(initialDestination.name);
    }
  }, [initialDestination, visible]);

  // Coordinate Parser for manual text typing (e.g. "20.38, 70.82")
  const parseCoordinates = (text: string): { lat: number; lng: number } | null => {
    const trimmed = text.trim();
    if (!trimmed) return null;
    const match = trimmed.match(/^(-?\d{1,2}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)$/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
    return null;
  };

  const typedCoords = useMemo(() => {
    return parseCoordinates(activeField === 'to' ? toText : fromText);
  }, [toText, fromText, activeField]);

  // Swap From and To
  const handleSwap = () => {
    const prevFrom = fromText;
    const prevTo = toText;
    setFromText(prevTo || 'Your location');
    setToText(prevFrom === 'Your location' ? '' : prevFrom);
  };

  // Route calculation between user location and destination
  const routeStats = useMemo(() => {
    if (!destination || !userLocation) return null;
    const nm = distanceNm(
      userLocation.latitude,
      userLocation.longitude,
      destination.latitude,
      destination.longitude,
    );
    const brg = bearingDegrees(
      userLocation.latitude,
      userLocation.longitude,
      destination.latitude,
      destination.longitude,
    );
    const eta = etaFromNm(nm, 12); // Average cruising speed: 12 knots

    return {
      distanceStr: formatDistance(nm),
      bearingStr: formatBearing(brg),
      bearingDeg: Math.round(brg),
      etaStr: eta,
    };
  }, [destination, userLocation, formatDistance]);

  // Query filter according to active typing field
  const currentQuery = (activeField === 'to' ? toText : fromText).toLowerCase().trim();

  // Filtered waypoints and ports based on active query
  const filteredWaypoints = useMemo(() => {
    if (!currentQuery || currentQuery === 'your location') return waypoints;
    return waypoints.filter(
      (w) =>
        w.name.toLowerCase().includes(currentQuery) ||
        (w.category && w.category.toLowerCase().includes(currentQuery)) ||
        (w.notes && w.notes.toLowerCase().includes(currentQuery)),
    );
  }, [waypoints, currentQuery]);

  const filteredPorts = useMemo(() => {
    if (!currentQuery || currentQuery === 'your location') return COASTAL_PORTS;
    return COASTAL_PORTS.filter(
      (p) =>
        p.name.toLowerCase().includes(currentQuery) ||
        p.state.toLowerCase().includes(currentQuery) ||
        p.notes.toLowerCase().includes(currentQuery),
    );
  }, [currentQuery]);

  const portToSpot = (port: typeof COASTAL_PORTS[0]): FishingSpot => ({
    id: port.id,
    name: port.name,
    latitude: port.latitude,
    longitude: port.longitude,
    depthM: port.depthM,
    color: '#38BDF8',
    category: port.category,
    notes: port.notes,
  });

  const handleSelectSpot = (spot: FishingSpot) => {
    if (activeField === 'to') {
      setDestination(spot);
      setToText(spot.name);
    } else {
      setFromText(spot.name);
    }
  };

  const handleSelectPort = (port: typeof COASTAL_PORTS[0]) => {
    const spot = portToSpot(port);
    handleSelectSpot(spot);
  };

  const handleStart = () => {
    if (destination) {
      onStartNavigation(destination);
      onClose();
    }
  };

  const handleStartCoords = (coords: { lat: number; lng: number }) => {
    const coordSpot: FishingSpot = {
      id: `coord-${coords.lat.toFixed(4)}-${coords.lng.toFixed(4)}`,
      name: `Point (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
      latitude: coords.lat,
      longitude: coords.lng,
      depthM: 35,
      color: '#00F0FF',
      category: 'GPS Coordinates',
    };
    onStartNavigation(coordSpot);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* 🟢 TOP GOOGLE-MAPS STYLE DIRECTIONS HEADER */}
        <View
          style={[
            styles.headerCard,
            {
              backgroundColor: colors.surfaceHeader,
              borderBottomColor: colors.divider,
              paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 12 : 8) + 8,
              paddingLeft: Math.max(insets.left + 12, 12),
              paddingRight: Math.max(insets.right + 12, 12),
            },
          ]}
        >
          {/* Top Bar: Back Arrow, Title, Close Button */}
          <View style={styles.topBarRow}>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={[styles.roundIconBtn, { backgroundColor: colors.chipBg }]}
              accessibilityRole="button"
              accessibilityLabel="Back to map"
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </Pressable>

            <View style={styles.titleWrap}>
              <Text style={[styles.screenTitle, { color: colors.text }]}>Directions</Text>
              <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
                Interactive Marine Route Planning
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={[styles.roundIconBtn, { backgroundColor: colors.chipBg }]}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          {/* 📍 Editable From / To Route Box (Google Maps Style) */}
          <View style={styles.routeInputsWrap}>
            {/* Left Indicators + Connecting Line */}
            <View style={styles.routeDotsColumn}>
              <View style={[styles.originDot, { backgroundColor: '#10B981' }]} />
              <View style={[styles.routeDotLine, { backgroundColor: colors.divider }]} />
              <View style={[styles.destDot, { backgroundColor: '#EF4444' }]}>
                <Ionicons name="location" size={12} color="#FFFFFF" />
              </View>
            </View>

            {/* Middle Fields: Origin & Destination Inputs */}
            <View style={styles.inputsColumn}>
              {/* Origin ("From") Editable Input */}
              <View
                style={[
                  styles.fieldBox,
                  {
                    backgroundColor: colors.searchBarBg,
                    borderColor: activeField === 'from' ? '#10B981' : colors.searchBarBorder,
                  },
                ]}
              >
                <Text style={[styles.fieldLabel, { color: '#10B981' }]}>FROM</Text>
                <TextInput
                  style={[styles.fieldInput, { color: colors.text }]}
                  value={fromText}
                  onChangeText={(val) => {
                    setFromText(val);
                  }}
                  onFocus={() => setActiveField('from')}
                  placeholder="Your location, waypoint, port or coords..."
                  placeholderTextColor={colors.textSecondary}
                  autoCorrect={false}
                  selectTextOnFocus
                />
                {fromText.length > 0 && fromText !== 'Your location' && (
                  <Pressable
                    onPress={() => {
                      setFromText('Your location');
                    }}
                    hitSlop={8}
                    style={styles.fieldClearBtn}
                  >
                    <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                  </Pressable>
                )}
              </View>

              {/* Destination ("To") Editable Input */}
              <View
                style={[
                  styles.fieldBox,
                  {
                    backgroundColor: colors.searchBarBg,
                    borderColor: activeField === 'to' ? colors.accent : colors.searchBarBorder,
                  },
                ]}
              >
                <Text style={[styles.fieldLabel, { color: '#EF4444' }]}>TO</Text>
                <TextInput
                  style={[styles.fieldInput, { color: colors.text }]}
                  value={toText}
                  onChangeText={(val) => {
                    setToText(val);
                    // Check if user manually typed coordinates
                    const parsed = parseCoordinates(val);
                    if (parsed) {
                      setDestination({
                        id: `coord-${parsed.lat}-${parsed.lng}`,
                        name: `Point (${parsed.lat.toFixed(4)}, ${parsed.lng.toFixed(4)})`,
                        latitude: parsed.lat,
                        longitude: parsed.lng,
                        depthM: 40,
                        color: '#00F0FF',
                        category: 'GPS Coordinates',
                      });
                    }
                  }}
                  onFocus={() => setActiveField('to')}
                  placeholder="Choose destination, port or coords..."
                  placeholderTextColor={colors.textSecondary}
                  autoCorrect={false}
                  selectTextOnFocus
                />
                {toText.length > 0 && (
                  <Pressable
                    onPress={() => {
                      setToText('');
                      setDestination(null);
                    }}
                    hitSlop={8}
                    style={styles.fieldClearBtn}
                  >
                    <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Right Swap Button (⇅) */}
            <Pressable
              onPress={handleSwap}
              hitSlop={10}
              style={[
                styles.swapButton,
                { backgroundColor: colors.chipBg, borderColor: colors.chipBorder },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Swap origin and destination"
            >
              <Ionicons name="swap-vertical" size={20} color={colors.accent} />
            </Pressable>
          </View>

          {/* Quick reset pill if From was changed */}
          {fromText !== 'Your location' && (
            <Pressable
              onPress={() => setFromText('Your location')}
              style={[styles.resetYourLocationPill, { backgroundColor: colors.chipBg }]}
            >
              <Ionicons name="locate" size={14} color="#10B981" />
              <Text style={[styles.resetYourLocationText, { color: colors.text }]}>
                Reset FROM to "Your location" (GPS)
              </Text>
            </Pressable>
          )}
        </View>

        {/* 🚀 ACTIVE ROUTE SUMMARY & BIG START NAVIGATION BUTTON */}
        {destination && routeStats && (
          <View
            style={[
              styles.routeSummaryCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.accent,
                marginHorizontal: isTablet ? Math.max((windowWidth - 640) / 2, 16) : 12,
              },
            ]}
          >
            <View style={styles.routeStatsRow}>
              {/* ETA */}
              <View style={styles.statPill}>
                <Ionicons name="time-outline" size={16} color={colors.accent} />
                <View>
                  <Text style={[styles.statValue, { color: colors.text }]}>{routeStats.etaStr}</Text>
                  <Text style={[styles.statSub, { color: colors.textSecondary }]}>ETA @ 12 kt</Text>
                </View>
              </View>

              <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />

              {/* Distance */}
              <View style={styles.statPill}>
                <MaterialCommunityIcons name="map-marker-distance" size={17} color="#38BDF8" />
                <View>
                  <Text style={[styles.statValue, { color: colors.text }]}>{routeStats.distanceStr}</Text>
                  <Text style={[styles.statSub, { color: colors.textSecondary }]}>Direct Course</Text>
                </View>
              </View>

              <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />

              {/* Bearing */}
              <View style={styles.statPill}>
                <MaterialCommunityIcons name="compass-outline" size={17} color="#10B981" />
                <View>
                  <Text style={[styles.statValue, { color: colors.text }]}>{routeStats.bearingStr}</Text>
                  <Text style={[styles.statSub, { color: colors.textSecondary }]}>Steer Course</Text>
                </View>
              </View>
            </View>

            {/* BIG START / GO BUTTON */}
            <Pressable
              onPress={handleStart}
              style={({ pressed }) => [
                styles.startNavButton,
                pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Start Navigation"
            >
              <View style={styles.startNavInner}>
                <MaterialCommunityIcons
                  name="navigation"
                  size={24}
                  color="#FFFFFF"
                  style={{ transform: [{ rotate: '45deg' }] }}
                />
                <Text style={styles.startNavText}>START NAVIGATION</Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* 📋 DESTINATION SUGGESTIONS LIST (With Direct Navigation Buttons!) */}
        <ScrollView
          style={styles.scrollList}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: Math.max(insets.bottom, 20) + 40,
              maxWidth: isTablet ? 640 : undefined,
              alignSelf: isTablet ? 'center' : undefined,
              width: isTablet ? '100%' : undefined,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Direct Typed Coordinate Match Card */}
          {typedCoords && (
            <View
              style={[
                styles.typedCoordCard,
                { backgroundColor: `${colors.accent}15`, borderColor: colors.accent },
              ]}
            >
              <View style={styles.typedCoordInfo}>
                <Ionicons name="navigate-circle" size={24} color={colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.typedCoordTitle, { color: colors.text }]}>
                    Navigate to Coordinates
                  </Text>
                  <Text style={[styles.typedCoordSub, { color: colors.textSecondary }]}>
                    {typedCoords.lat.toFixed(4)}° N, {typedCoords.lng.toFixed(4)}° E
                    {userLocation ? ` • ${formatDistance(distanceNm(userLocation.latitude, userLocation.longitude, typedCoords.lat, typedCoords.lng))}` : ''}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => handleStartCoords(typedCoords)}
                style={styles.directNavBtn}
              >
                <MaterialCommunityIcons name="navigation" size={16} color="#FFFFFF" style={{ transform: [{ rotate: '45deg' }] }} />
                <Text style={styles.directNavText}>GO</Text>
              </Pressable>
            </View>
          )}

          {/* 1. 🗺️ "CHOOSE ON MAP" ACTION BUTTON */}
          <Pressable
            onPress={() => {
              onClose();
              onChooseOnMap();
            }}
            style={({ pressed }) => [
              styles.chooseOnMapCard,
              {
                backgroundColor: colors.chipBg,
                borderColor: colors.accent,
              },
              pressed && { opacity: 0.8 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Choose destination on map"
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#0284C7' }]}>
              <Ionicons name="map" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.actionTextWrap}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Choose on Map</Text>
              <Text style={[styles.actionSub, { color: colors.textSecondary }]}>
                Tap anywhere on the marine chart to drop a pin & navigate
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.accent} />
          </Pressable>

          {/* 2. 📍 ENTER GPS COORDINATES MODAL BUTTON */}
          {onOpenCoordsModal && (
            <Pressable
              onPress={() => {
                onClose();
                onOpenCoordsModal();
              }}
              style={[
                styles.chooseOnMapCard,
                {
                  backgroundColor: colors.chipBg,
                  borderColor: colors.chipBorder,
                  marginTop: 8,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Enter GPS coordinates"
            >
              <View style={[styles.actionIconCircle, { backgroundColor: '#6366F1' }]}>
                <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={[styles.actionTitle, { color: colors.text }]}>Enter Coordinates</Text>
                <Text style={[styles.actionSub, { color: colors.textSecondary }]}>
                  Type decimal or DMS latitude & longitude
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </Pressable>
          )}

          {/* 3. 🏷️ SAVED WAYPOINTS & HOTSPOTS (With Direct "GO" Navigation Button!) */}
          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
              SAVED WAYPOINTS & FISHING HOTSPOTS ({filteredWaypoints.length})
            </Text>

            {filteredWaypoints.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No saved waypoints match your search.
                </Text>
              </View>
            ) : (
              filteredWaypoints.map((w) => {
                const isSelected = destination?.id === w.id;
                const distStr = userLocation
                  ? formatDistance(distanceNm(userLocation.latitude, userLocation.longitude, w.latitude, w.longitude))
                  : null;

                return (
                  <Pressable
                    key={w.id}
                    onPress={() => handleSelectSpot(w)}
                    style={[
                      styles.itemRow,
                      {
                        backgroundColor: isSelected ? `${colors.accent}18` : colors.card,
                        borderColor: isSelected ? colors.accent : colors.cardBorder,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.itemIconCircle,
                        { backgroundColor: `${w.color || '#F59E0B'}22` },
                      ]}
                    >
                      <Ionicons
                        name={w.favorite ? 'star' : 'fish'}
                        size={18}
                        color={w.color || '#F59E0B'}
                      />
                    </View>

                    <View style={styles.itemTextWrap}>
                      <View style={styles.itemNameRow}>
                        <Text
                          style={[
                            styles.itemTitle,
                            { color: isSelected ? colors.accent : colors.text },
                          ]}
                          numberOfLines={1}
                        >
                          {w.name}
                        </Text>
                        {w.favorite && (
                          <View style={styles.favBadge}>
                            <Text style={styles.favBadgeText}>FAVORITE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.itemSub, { color: colors.textSecondary }]} numberOfLines={1}>
                        {w.depthM ? `Depth ${formatDepth(w.depthM).full} • ` : ''}{w.category || 'Waypoint'}
                      </Text>
                    </View>

                    {distStr && (
                      <View style={styles.distBadge}>
                        <Text style={[styles.distBadgeText, { color: colors.accent }]}>{distStr}</Text>
                      </View>
                    )}

                    {/* 🚀 DIRECT NAVIGATION BUTTON */}
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        onStartNavigation(w);
                        onClose();
                      }}
                      style={styles.directNavBtn}
                      accessibilityRole="button"
                      accessibilityLabel={`Navigate directly to ${w.name}`}
                    >
                      <MaterialCommunityIcons
                        name="navigation"
                        size={16}
                        color="#FFFFFF"
                        style={{ transform: [{ rotate: '45deg' }] }}
                      />
                      <Text style={styles.directNavText}>GO</Text>
                    </Pressable>
                  </Pressable>
                );
              })
            )}
          </View>

          {/* 4. ⚓ MAJOR COASTAL PORTS & HARBORS (With Direct "GO" Navigation Button!) */}
          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
              MAJOR COASTAL PORTS & HARBORS ({filteredPorts.length})
            </Text>

            {filteredPorts.map((port) => {
              const isSelected = destination?.id === port.id;
              const distStr = userLocation
                ? formatDistance(distanceNm(userLocation.latitude, userLocation.longitude, port.latitude, port.longitude))
                : null;

              return (
                <Pressable
                  key={port.id}
                  onPress={() => handleSelectPort(port)}
                  style={[
                    styles.itemRow,
                    {
                      backgroundColor: isSelected ? `${colors.accent}18` : colors.card,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    },
                  ]}
                >
                  <View style={[styles.itemIconCircle, { backgroundColor: '#0284C722' }]}>
                    <MaterialCommunityIcons name="anchor" size={18} color="#38BDF8" />
                  </View>

                  <View style={styles.itemTextWrap}>
                    <Text
                      style={[
                        styles.itemTitle,
                        { color: isSelected ? colors.accent : colors.text },
                      ]}
                      numberOfLines={1}
                    >
                      {port.name}
                    </Text>
                    <Text style={[styles.itemSub, { color: colors.textSecondary }]} numberOfLines={1}>
                      {port.state} • {port.notes}
                    </Text>
                  </View>

                  {distStr && (
                    <View style={styles.distBadge}>
                      <Text style={[styles.distBadgeText, { color: '#38BDF8' }]}>{distStr}</Text>
                    </View>
                  )}

                  {/* 🚀 DIRECT NAVIGATION BUTTON */}
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      const spot = portToSpot(port);
                      onStartNavigation(spot);
                      onClose();
                    }}
                    style={styles.directNavBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`Navigate directly to ${port.name}`}
                  >
                    <MaterialCommunityIcons
                      name="navigation"
                      size={16}
                      color="#FFFFFF"
                      style={{ transform: [{ rotate: '45deg' }] }}
                    />
                    <Text style={styles.directNavText}>GO</Text>
                  </Pressable>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    borderBottomWidth: 1,
    paddingBottom: 14,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  roundIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    marginHorizontal: 12,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  screenSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  routeInputsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeDotsColumn: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    height: 94,
  },
  originDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeDotLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  destDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputsColumn: {
    flex: 1,
    gap: 8,
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    minHeight: 44,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  fieldInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 4,
  },
  fieldClearBtn: {
    padding: 3,
  },
  swapButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetYourLocationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 10,
    marginLeft: 28,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  resetYourLocationText: {
    fontSize: 11,
    fontWeight: '600',
  },
  routeSummaryCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  routeStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  statSub: {
    fontSize: 10,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  startNavButton: {
    backgroundColor: '#0284C7',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#00F0FF',
  },
  startNavInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  startNavText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
  },
  typedCoordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
    justifyContent: 'space-between',
    gap: 10,
  },
  typedCoordInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typedCoordTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  typedCoordSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  chooseOnMapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextWrap: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  sectionWrap: {
    marginTop: 18,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  emptyWrap: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  itemIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextWrap: {
    flex: 1,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  favBadge: {
    backgroundColor: '#F59E0B22',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#F59E0B66',
  },
  favBadgeText: {
    color: '#F59E0B',
    fontSize: 8,
    fontWeight: '800',
  },
  distBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  distBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  directNavBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#00F0FF',
    gap: 4,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  directNavText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
