import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoordinateInputModal } from '@/components/map/coordinate-input-modal';
import { GoogleNavHud } from '@/components/map/google-nav-hud';
import { MapLayersModal } from '@/components/map/map-layers-modal';
import {
  MapControlStack
} from '@/components/map/map-overlays';
import type { MapStyleId } from '@/components/map/map-style-selector';
import {
  type MapOverlaysState,
  type NativeMapHandle,
  NativeMapView,
} from '@/components/map/native-map-view';
import { SaveTripModal } from '@/components/map/save-trip-modal';
import { SpotBottomSheet } from '@/components/map/spot-bottom-sheet';
import {
  type ActiveTabType,
  AppTabs,
} from '@/components/navigation/app-tabs';
import { MarineDirectionsModal } from '@/components/navigation/marine-directions-modal';
import { CaptainProfileModal } from '@/components/search/captain-profile-modal';
import { MarineSearchHeader } from '@/components/search/marine-search-header';
import { MarineDownloadPill } from '@/components/map/marine-download-pill';
import { CalendarSheetContent } from '@/components/sheets/calendar-sheet-content';
import { CompassSheetContent } from '@/components/sheets/compass-sheet-content';
import { SettingsSheetContent } from '@/components/sheets/settings-sheet-content';
import { WaypointsSheetContent } from '@/components/sheets/waypoints-sheet-content';
import { WeatherSheetContent } from '@/components/sheets/marine-weather-sheet';
import { SlidingSheetContainer } from '@/components/ui/sliding-sheet-container';
import type { FishingSpot } from '@/constants/fishing-spots';
import { MapColors } from '@/constants/map-theme';
import { useTripTracking } from '@/context/trip-context';
import { useSubscription } from '@/context/subscription-context';
import { useWaypoints } from '@/context/waypoints-context';
import { useLanguage } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';
import { useUserLocation } from '@/hooks/use-user-location';
import { bearingDegrees, distanceNm, etaFromNm, formatBearing, formatNm } from '@/utils/geo';

type MarineMainScreenProps = {
  initialTab?: ActiveTabType;
};

export function MarineMainScreen({ initialTab = null }: MarineMainScreenProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;
  const isTablet = windowWidth >= 600;
  const mapRef = useRef<NativeMapHandle>(null);
  const { colors } = useAppTheme();
  const { t, language } = useLanguage();

  const {
    waypoints,
    selectedSpot,
    selectedSpotId,
    setSelectedSpotId,
    setActiveNavigationTarget,
    toggleFavorite,
  } = useWaypoints();
  const { location, status, heading, requestPermissionAndLocate, openSettings, refresh, placeLabel } =
    useUserLocation();

  // Active Sheet Tab (Default is NULL = Map is shown!)
  const [activeTab, setActiveTab] = useState<ActiveTabType>(initialTab);

  // Map state
  const [followUser, setFollowUser] = useState(true);
  const [headingUp, setHeadingUp] = useState(false);
  const [overlays, setOverlays] = useState<MapOverlaysState>({
    seamarks: true,
    dangerZone: true,
  });
  const [activeMapStyle, setActiveMapStyle] = useState<MapStyleId>('google');

  const [showGpsHud, setShowGpsHud] = useState(false);

  // Search & Navigation Modals state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCoordsModal, setShowCoordsModal] = useState(false);
  const [showLayersModal, setShowLayersModal] = useState(false);

  // 🚀 Google Maps Directions & Interactive Map-Picking State
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const [directionsDestination, setDirectionsDestination] = useState<FishingSpot | null>(null);
  const [isMapPickingMode, setIsMapPickingMode] = useState(false);
  const [droppedPin, setDroppedPin] = useState<{ latitude: number; longitude: number } | null>(null);

  const {
    isTracking,
    isNavigating,
    targetSpot,
    activePoints,
    savedTrips,
    selectedTripForMap,
    startNavigation,
    startTracking,
    finishTracking,
    exitNavigation,
    clearSelectedTrip,
  } = useTripTracking();
  const { isTrialExpired, isPro, openProModal } = useSubscription();

  // Auto-prompt Pro modal if trial has expired on app open
  React.useEffect(() => {
    if (isTrialExpired && !isPro) {
      const timer = setTimeout(() => {
        openProModal('trial_expired_auto');
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isTrialExpired, isPro, openProModal]);

  // If a trip was clicked from Trips screen, zoom to it on the map
  React.useEffect(() => {
    if (selectedTripForMap && selectedTripForMap.points.length > 0) {
      mapRef.current?.fitTrackBounds(selectedTripForMap.points);
      setActiveTab(null);
    }
  }, [selectedTripForMap]);

  // Handle Tab Click from Bottom Bar
  const handleTabPress = useCallback((tab: 'waypoint' | 'weather' | 'compass' | 'calendar' | 'settings') => {
    setActiveTab((prev) => (prev === tab ? null : tab));
  }, []);

  const handleCloseSheet = useCallback(() => {
    setActiveTab(null);
  }, []);

  const handleViewSpotOnMap = useCallback((spot: FishingSpot) => {
    setSelectedSpotId(spot.id);
    setActiveNavigationTarget(spot);
    setFollowUser(false);
    mapRef.current?.goToSpot(spot);
    setActiveTab(null);
  }, [setSelectedSpotId, setActiveNavigationTarget]);

  const handleStartNavigationToSpot = useCallback((spot: FishingSpot) => {
    mapRef.current?.fitRoute(spot);
    setFollowUser(true);
    startNavigation(spot);
    setSelectedSpotId(null);
    setActiveTab(null);
  }, [startNavigation, setSelectedSpotId]);

  const handleGoPress = useCallback(() => {
    setDirectionsDestination(selectedSpot ?? null);
    setShowDirectionsModal(true);
  }, [selectedSpot]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (isMapPickingMode) {
      setDroppedPin({ latitude: lat, longitude: lng });
      mapRef.current?.setDroppedPin(lat, lng);
      return;
    }
    setSelectedSpotId(null);
    setFollowUser(false);
    mapRef.current?.clearDroppedPin();
  }, [isMapPickingMode, setSelectedSpotId]);

  // Stats for the pin dropped in Map-Picking mode
  const pickingPinStats = useMemo(() => {
    if (!droppedPin || !location) return null;
    const nm = distanceNm(location.latitude, location.longitude, droppedPin.latitude, droppedPin.longitude);
    const brg = bearingDegrees(location.latitude, location.longitude, droppedPin.latitude, droppedPin.longitude);
    return {
      distNmStr: formatNm(nm),
      distKmStr: `${(nm * 1.852).toFixed(1)} km`,
      bearingStr: formatBearing(brg),
    };
  }, [droppedPin, location]);

  const handleConfirmPickedPinAndStart = useCallback(() => {
    if (!droppedPin) return;
    const customSpot: FishingSpot = {
      id: `dest-${Date.now()}`,
      name: `Target (${droppedPin.latitude.toFixed(4)}, ${droppedPin.longitude.toFixed(4)})`,
      latitude: droppedPin.latitude,
      longitude: droppedPin.longitude,
      depthM: 42,
      color: '#00F0FF',
      category: 'Chart Destination',
    };
    setIsMapPickingMode(false);
    setDroppedPin(null);
    mapRef.current?.clearDroppedPin();
    handleStartNavigationToSpot(customSpot);
  }, [droppedPin, handleStartNavigationToSpot]);

  const handleConfirmPickedPinToDirections = useCallback(() => {
    if (!droppedPin) return;
    const customSpot: FishingSpot = {
      id: `dest-${Date.now()}`,
      name: `Target (${droppedPin.latitude.toFixed(4)}, ${droppedPin.longitude.toFixed(4)})`,
      latitude: droppedPin.latitude,
      longitude: droppedPin.longitude,
      depthM: 42,
      color: '#00F0FF',
      category: 'Chart Destination',
    };
    setIsMapPickingMode(false);
    setDroppedPin(null);
    mapRef.current?.clearDroppedPin();
    setDirectionsDestination(customSpot);
    setShowDirectionsModal(true);
  }, [droppedPin]);

  const handleCancelMapPicking = useCallback(() => {
    setIsMapPickingMode(false);
    setDroppedPin(null);
    mapRef.current?.clearDroppedPin();
  }, []);

  const handlePlotCoordinate = useCallback((lat: number, lng: number, label?: string) => {
    setSelectedSpotId(null);
    setFollowUser(false);
    mapRef.current?.flyTo(lat, lng, 14);
    mapRef.current?.clearDroppedPin();
  }, [setSelectedSpotId]);

  const handleLocate = useCallback(() => {
    setFollowUser(true);
    void refresh();
    mapRef.current?.centerOnUser();
  }, [refresh]);

  const handleResetNorth = useCallback(() => {
    setHeadingUp(false);
    mapRef.current?.centerOnUser();
  }, []);

  const handleUserPanned = useCallback(() => {
    setFollowUser(false);
  }, []);

  // Nav stats if a spot is tapped on the map
  const activeTarget = selectedSpot;
  const navStats = useMemo(() => {
    if (!activeTarget || !location) {
      return { distanceLabel: '—', bearingLabel: '—', etaLabel: '—' };
    }
    const nm = distanceNm(location.latitude, location.longitude, activeTarget.latitude, activeTarget.longitude);
    const brg = bearingDegrees(location.latitude, location.longitude, activeTarget.latitude, activeTarget.longitude);
    return {
      distanceLabel: formatNm(nm),
      bearingLabel: formatBearing(brg),
      etaLabel: etaFromNm(nm, 12),
    };
  }, [activeTarget, location]);

  const meta = useMemo(() => {
    const monthYear = new Date()
      .toLocaleDateString(language === 'en' ? 'en-US' : `${language}-IN`, {
        month: 'short',
        year: 'numeric',
      })
      .toUpperCase();

    switch (activeTab) {
      case 'waypoint':
        return {
          title: t('tab.waypoints', 'Spots & Waypoints'),
          subtitle: 'Save active GPS coordinates as waypoint',
          badgeText: `${waypoints.length} SPOTS`,
        };
      case 'weather':
        return {
          title: t('tab.weather', 'Marine Forecast'),
          subtitle: t('weather.title', 'Waves, wind speed, tides & sea surface conditions'),
          badgeText: 'LIVE RADAR',
        };
      case 'compass':
        return {
          title: t('tab.compass', 'Marine Compass & HUD'),
          subtitle: t('compass.guidance_title', 'Magnetic course, target bearing & steering advice'),
          badgeText: 'SENSOR ON',
        };
      case 'calendar':
        return {
          title: t('tab.calendar', 'Solunar Fishing Forecast'),
          subtitle: t('calendar.solunar_subtitle', 'Moon phases, feeding windows & prime bite times'),
          badgeText: monthYear,
        };
      case 'settings':
        return {
          title: t('tab.settings', 'Navionics & Vessel Settings'),
          subtitle: 'Vessel profile, units, navigation alarms & backup',
          badgeText: 'v1.0.0 PRO',
        };
      default:
        return { title: '', subtitle: '', badgeText: '' };
    }
  }, [activeTab, waypoints.length, language, t]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 1. Full Screen Interactive Marine Map (Default Layer!) */}
      <View style={styles.mapWrap}>
        <NativeMapView
          ref={mapRef}
          mapStyle={activeMapStyle}
          overlays={overlays}
          location={location}
          navTarget={targetSpot}
          heading={heading ?? location?.heading ?? 0}
          followUser={followUser}
          headingUp={headingUp}
          selectedSpotId={selectedSpotId}
          spots={waypoints}
          droppedPin={droppedPin}
          measurementActive={false}
          activeTrackPoints={activePoints}
          savedTracks={savedTrips}
          onSelectSpot={handleViewSpotOnMap}
          onMapClick={handleMapClick}
          onUserPanned={handleUserPanned}
        />

        {/* Floating Right Map Controls (Zoom In/Out, Locate, Heading Mode, GO) */}
        <View
          style={[
            styles.rightControls,
            {
              right: Math.max(insets.right + 14, 14),
              bottom: isLandscape
                ? Math.max(insets.bottom + 16, 20)
                : Math.max(insets.bottom + 12, 16) + 76,
            },
          ]}
          pointerEvents="box-none"
        >
          <MapControlStack
            headingUp={headingUp}
            followUser={followUser}
            hasTarget={Boolean(selectedSpot || targetSpot)}
            onZoomIn={() => mapRef.current?.zoomIn()}
            onZoomOut={() => mapRef.current?.zoomOut()}
            onLocate={handleLocate}
            onHeading={() => {
              setHeadingUp((v) => !v);
              setFollowUser(true);
              mapRef.current?.centerOnUser();
            }}
            onGo={handleGoPress}
          />
        </View>
      </View>

      {/* 🟢 Universal Top Search Bar (Google Maps Style: More | Search | Captain Profile) */}
      {!isNavigating && (
        <MarineSearchHeader
          hidden={activeTab !== null || Boolean(selectedSpot) || isMapPickingMode}
          userLocation={location}
          placeLabel={placeLabel}
          onPressLocationBadge={() => {
            if (location) {
              mapRef.current?.centerOnUser();
            } else {
              void requestPermissionAndLocate();
            }
          }}
          onOpenMore={() => setShowLayersModal(true)}
          onOpenProfile={() => setShowProfileModal(true)}
          onSelectSpot={handleViewSpotOnMap}
          onPlotCoordinate={handlePlotCoordinate}
          onOpenTab={(tab) => setActiveTab(tab)}
          onOpenCoordsModal={() => setShowCoordsModal(true)}
          onOpenLayersModal={() => setShowLayersModal(true)}
          onFocus={() => setActiveTab(null)}
        />
      )}

      {/* 🗺️ Live Floating Background Map Download Progress HUD */}
      <MarineDownloadPill
        onOpenSettings={() => setActiveTab('settings')}
        isSettingsOpen={activeTab === 'settings'}
      />

      {/* 📍 Map Picking Mode: Guidance Header */}
      {isMapPickingMode && (
        <View
          style={[
            styles.mapPickingHeader,
            { top: Math.max(insets.top, Platform.OS === 'ios' ? 12 : 8) + 8 },
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.mapPickingPill}>
            <Ionicons name="location" size={18} color="#00F0FF" />
            <Text style={styles.mapPickingText}>
              {droppedPin
                ? 'Destination pinned! Tap anywhere to adjust or confirm below'
                : 'Tap anywhere on the marine chart to drop destination pin'}
            </Text>
            <Pressable
              onPress={handleCancelMapPicking}
              hitSlop={10}
              style={styles.mapPickingCloseBtn}
              accessibilityRole="button"
              accessibilityLabel="Cancel map selection"
            >
              <Ionicons name="close" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      )}

      {/* 🚀 Map Picking Mode: Bottom Confirmation & Route Start Card */}
      {isMapPickingMode && droppedPin && (
        <View
          style={[
            styles.mapPickingCard,
            {
              bottom: Math.max(insets.bottom, 12) + (isLandscape ? 20 : 80),
              backgroundColor: colors.surfaceHeader,
              borderColor: colors.accent,
            },
          ]}
        >
          <View style={styles.pickingCardTop}>
            <View style={[styles.pickingCardIconWrap, { backgroundColor: `${colors.accent}22` }]}>
              <Ionicons name="location" size={20} color={colors.accent} />
            </View>
            <View style={styles.pickingCardTextWrap}>
              <Text style={[styles.pickingCardTitle, { color: colors.text }]}>Selected Target Point</Text>
              <Text style={[styles.pickingCardCoords, { color: colors.textSecondary }]}>
                {droppedPin.latitude.toFixed(4)}° N, {droppedPin.longitude.toFixed(4)}° E
                {pickingPinStats ? ` • ${pickingPinStats.distNmStr} (${pickingPinStats.bearingStr})` : ''}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                setDroppedPin(null);
                mapRef.current?.clearDroppedPin();
              }}
              hitSlop={8}
              style={[styles.pickingCardResetBtn, { backgroundColor: colors.chipBg }]}
              accessibilityRole="button"
              accessibilityLabel="Reset pin"
            >
              <Ionicons name="refresh" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.pickingCardActions}>
            <Pressable
              onPress={handleConfirmPickedPinToDirections}
              style={[styles.pickingCardSecondaryBtn, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}
              accessibilityRole="button"
              accessibilityLabel="Review Route"
            >
              <Ionicons name="git-branch-outline" size={15} color={colors.text} style={{ marginRight: 4 }} />
              <Text style={[styles.pickingCardSecondaryText, { color: colors.text }]} numberOfLines={1}>Route</Text>
            </Pressable>

            <Pressable
              onPress={handleConfirmPickedPinAndStart}
              style={styles.pickingCardPrimaryBtn}
              accessibilityRole="button"
              accessibilityLabel="Start Navigation"
            >
              <MaterialCommunityIcons name="navigation" size={16} color="#FFFFFF" style={{ transform: [{ rotate: '45deg' }], marginRight: 4 }} />
              <Text style={styles.pickingCardPrimaryText} numberOfLines={1}>Start</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* 2. Spot Sliding Sheet (Scrollable & Drag-to-dismiss like tab cards!) */}
      {activeTab === null && !isNavigating && selectedSpot ? (
        <SpotBottomSheet
          spot={selectedSpot}
          distanceLabel={navStats.distanceLabel}
          bearingLabel={navStats.bearingLabel}
          etaLabel={navStats.etaLabel}
          isFavorite={!!selectedSpot?.favorite}
          onGoTo={() => {
            if (selectedSpot) {
              handleStartNavigationToSpot(selectedSpot);
            }
          }}
          onSaveSpot={() => setActiveTab('waypoint')}
          onToggleFavorite={() => {
            if (selectedSpot) {
              void toggleFavorite(selectedSpot.id);
            }
          }}
          onClose={() => {
            setSelectedSpotId(null);
            mapRef.current?.clearDroppedPin();
          }}
        />
      ) : null}

      {/* 🟢 GOOGLE MAPS STYLE NAVIGATION COCKPIT & TURN ARROW HUD */}
      {isNavigating && (
        <GoogleNavHud
          onRecenter={handleLocate}
          onToggleHeadingUp={() => {
            setHeadingUp((v) => !v);
            setFollowUser(true);
            mapRef.current?.centerOnUser();
          }}
          headingUp={headingUp}
        />
      )}

      {/* 2. Compact Sliding Card Sheet (Sits at bottom ~58% so map is ALWAYS visible at top!) */}
      <SlidingSheetContainer
        isOpen={activeTab !== null && !isNavigating}
        title={meta.title}
        subtitle={meta.subtitle}
        badge={
          meta.badgeText ? (
            <View style={[styles.sheetBadge, { backgroundColor: colors.chipBg, borderColor: colors.chipBorder }]}>
              <Text style={[styles.sheetBadgeText, { color: colors.accent }]}>{meta.badgeText}</Text>
            </View>
          ) : undefined
        }
        onClose={handleCloseSheet}
      >
        {activeTab === 'waypoint' && (
          <WaypointsSheetContent
            onViewOnMap={handleViewSpotOnMap}
            onStartNavigation={handleStartNavigationToSpot}
          />
        )}
        {activeTab === 'weather' && <WeatherSheetContent />}
        {activeTab === 'compass' && <CompassSheetContent />}
        {activeTab === 'calendar' && <CalendarSheetContent />}
        {activeTab === 'settings' && <SettingsSheetContent />}
      </SlidingSheetContainer>

      {/* 3. Curved Floating Bottom Navigation Bar (Hidden during active Google Maps turn-by-turn navigation!) */}
      {!isNavigating && (
        <AppTabs
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      )}

      {/* 4. Save Trip Summary Modal */}
      <SaveTripModal />

      {/* 5. Captain & Vessel Profile Modal */}
      <CaptainProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* 7. Quick Coordinate Input Modal */}
      <CoordinateInputModal
        visible={showCoordsModal}
        onClose={() => setShowCoordsModal(false)}
        onPlot={handlePlotCoordinate}
      />

      {/* 8. Map Layers & Bathymetry Modal */}
      <MapLayersModal
        visible={showLayersModal}
        activeStyle={activeMapStyle}
        overlays={overlays}
        showGpsHud={showGpsHud}
        onClose={() => setShowLayersModal(false)}
        onSelectStyle={(style) => setActiveMapStyle(style)}
        onToggleOverlay={(key) =>
          setOverlays((prev) => ({ ...prev, [key]: !prev[key] }))
        }
        onToggleGpsHud={() => setShowGpsHud((v) => !v)}
      />

      {/* 🟢 Google Maps Style Marine Directions & Route Planning Modal */}
      <MarineDirectionsModal
        visible={showDirectionsModal}
        onClose={() => setShowDirectionsModal(false)}
        userLocation={location}
        waypoints={waypoints}
        initialDestination={directionsDestination || selectedSpot}
        onStartNavigation={(dest) => {
          handleStartNavigationToSpot(dest);
        }}
        onChooseOnMap={() => {
          setIsMapPickingMode(true);
        }}
        onOpenCoordsModal={() => {
          setShowCoordsModal(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MapColors.navy,
    position: 'relative',
  },
  mapWrap: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  topTelemetry: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 10,
  },
  rightControls: {
    position: 'absolute',
    zIndex: 10,
  },
  sheetBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  sheetBadgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
  },
  mapPickingHeader: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 130,
    alignItems: 'center',
  },
  mapPickingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 11, 20, 0.94)',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#00F0FF',
    gap: 10,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
    maxWidth: 600,
  },
  mapPickingText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  mapPickingCloseBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPickingCard: {
    position: 'absolute',
    left: 10,
    right: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 10,
    zIndex: 130,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 12,
    maxWidth: 600,
    alignSelf: 'center',
  },
  pickingCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  pickingCardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickingCardTextWrap: {
    flex: 1,
  },
  pickingCardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  pickingCardCoords: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 1,
  },
  pickingCardResetBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickingCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickingCardSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickingCardSecondaryText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  pickingCardPrimaryBtn: {
    flex: 1.3,
    backgroundColor: '#0284C7',
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#00F0FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 5,
  },
  pickingCardPrimaryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
