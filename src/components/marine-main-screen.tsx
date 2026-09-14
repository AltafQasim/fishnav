import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
import { CaptainProfileModal } from '@/components/search/captain-profile-modal';
import { MarineSearchHeader } from '@/components/search/marine-search-header';
import { CalendarSheetContent } from '@/components/sheets/calendar-sheet-content';
import { CompassSheetContent } from '@/components/sheets/compass-sheet-content';
import { SettingsSheetContent } from '@/components/sheets/settings-sheet-content';
import { WaypointsSheetContent } from '@/components/sheets/waypoints-sheet-content';
import { WeatherSheetContent } from '@/components/sheets/weather-sheet-content';
import { SlidingSheetContainer } from '@/components/ui/sliding-sheet-container';
import type { FishingSpot } from '@/constants/fishing-spots';
import { MapColors } from '@/constants/map-theme';
import { useTripTracking } from '@/context/trip-context';
import { useWaypoints } from '@/context/waypoints-context';
import { useAppTheme } from '@/context/theme-context';
import { useUserLocation } from '@/hooks/use-user-location';
import { bearingDegrees, distanceNm, etaFromNm, formatBearing, formatNm } from '@/utils/geo';

type MarineMainScreenProps = {
  initialTab?: ActiveTabType;
};

export function MarineMainScreen({ initialTab = null }: MarineMainScreenProps) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<NativeMapHandle>(null);
  const { colors } = useAppTheme();

  const {
    waypoints,
    selectedSpot,
    selectedSpotId,
    setSelectedSpotId,
    setActiveNavigationTarget,
    toggleFavorite,
  } = useWaypoints();
  const { location, status, heading, requestPermissionAndLocate, openSettings, refresh } =
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
  const [activeMapStyle, setActiveMapStyle] = useState<MapStyleId>(colors.mapStyle || 'standard');

  // Sync map tiles with App Theme changes
  React.useEffect(() => {
    if (colors.mapStyle) {
      setActiveMapStyle(colors.mapStyle);
    }
  }, [colors.mapStyle]);

  const [showGpsHud, setShowGpsHud] = useState(false);

  // Search & Navigation Modals state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCoordsModal, setShowCoordsModal] = useState(false);
  const [showLayersModal, setShowLayersModal] = useState(false);

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

  // If a trip was clicked from Trips screen, zoom to it on the map
  React.useEffect(() => {
    if (selectedTripForMap && selectedTripForMap.points.length > 0) {
      mapRef.current?.fitTrackBounds(selectedTripForMap.points);
      setActiveTab(null);
    }
  }, [selectedTripForMap]);

  // Handle Tab Click from Bottom Bar
  const handleTabPress = (tab: 'waypoint' | 'weather' | 'compass' | 'calendar' | 'settings') => {
    // If tapping the already open tab, toggle it closed to view full map; otherwise open it
    if (activeTab === tab) {
      setActiveTab(null);
    } else {
      setActiveTab(tab);
    }
  };

  const handleCloseSheet = () => {
    setActiveTab(null);
  };

  const handleViewSpotOnMap = (spot: FishingSpot) => {
    setSelectedSpotId(spot.id);
    setActiveNavigationTarget(spot);
    setFollowUser(false);
    mapRef.current?.goToSpot(spot);
    // Dismiss sheet so spot is visible on map
    setActiveTab(null);
  };

  const handleStartNavigationToSpot = (spot: FishingSpot) => {
    mapRef.current?.fitRoute(spot);
    setFollowUser(true);
    startNavigation(spot);
    setSelectedSpotId(null);
    setActiveTab(null);
  };

  const handleMapClick = (_lat: number, _lng: number) => {
    // Dismiss any open spot selection or bottom sheet; no pin is dropped
    setSelectedSpotId(null);
    setFollowUser(false);
    mapRef.current?.clearDroppedPin();
  };

  const handlePlotCoordinate = (lat: number, lng: number, label?: string) => {
    setSelectedSpotId(null);
    setFollowUser(false);
    mapRef.current?.flyTo(lat, lng, 14);
    mapRef.current?.clearDroppedPin();
  };

  const handleLocate = () => {
    setFollowUser(true);
    void refresh();
    mapRef.current?.centerOnUser();
  };

  const handleResetNorth = () => {
    setHeadingUp(false);
    mapRef.current?.centerOnUser();
  };

  // Nav stats if a spot is tapped on the map
  const activeTarget = selectedSpot;
  const navStats = React.useMemo(() => {
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

  const getSheetMetadata = () => {
    switch (activeTab) {
      case 'waypoint':
        return {
          title: 'Mark Waypoint',
          subtitle: 'Save active GPS coordinates as waypoint',
          badgeText: `${waypoints.length} SPOTS`,
        };
      case 'weather':
        return {
          title: 'Marine Forecast',
          subtitle: 'Waves, wind speed, tides & sea surface conditions',
          badgeText: 'LIVE RADAR',
        };
      case 'compass':
        return {
          title: 'Marine Compass & HUD',
          subtitle: 'Magnetic course, target bearing & steering advice',
          badgeText: 'SENSOR ON',
        };
      case 'calendar':
        return {
          title: 'Solunar Fishing Forecast',
          subtitle: 'Moon phases, feeding windows & prime bite times',
          badgeText: 'OCT 2026',
        };
      case 'settings':
        return {
          title: 'Navionics & Vessel Settings',
          subtitle: 'Vessel profile, units, navigation alarms & backup',
          badgeText: 'v1.0.0 PRO',
        };
      default:
        return { title: '', subtitle: '', badgeText: '' };
    }
  };

  const meta = getSheetMetadata();

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
          droppedPin={null}
          measurementActive={false}
          activeTrackPoints={activePoints}
          savedTracks={savedTrips}
          onSelectSpot={handleViewSpotOnMap}
          onMapClick={handleMapClick}
          onUserPanned={() => setFollowUser(false)}
        />

        {/* Floating Right Map Controls (Zoom In/Out, Locate, Heading Mode) */}
        <View style={styles.rightControls} pointerEvents="box-none">
          <MapControlStack
            headingUp={headingUp}
            followUser={followUser}
            onZoomIn={() => mapRef.current?.zoomIn()}
            onZoomOut={() => mapRef.current?.zoomOut()}
            onLocate={handleLocate}
            onHeading={() => {
              setHeadingUp((v) => !v);
              setFollowUser(true);
              mapRef.current?.centerOnUser();
            }}
          />
        </View>
      </View>

      {/* 🟢 Universal Top Search Bar (Google Maps Style: More | Search | Captain Profile) */}
      {!isNavigating && (
        <MarineSearchHeader
          userLocation={location}
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
    right: 14,
    top: 170,
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
});
