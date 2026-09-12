import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AddSpotModal } from '@/components/map/add-spot-modal';
import { CoordinateInputModal } from '@/components/map/coordinate-input-modal';
import { MapLayersModal } from '@/components/map/map-layers-modal';
import {
  CompassWidget,
  GpsInfoCard,
  MapControlStack,
  MeasurementBanner,
} from '@/components/map/map-overlays';
import { CategoryFilter, MapSearchBar } from '@/components/map/map-search-bar';
import { MapStyleId } from '@/components/map/map-style-selector';
import {
  DroppedPin,
  MapOverlaysState,
  NativeMapHandle,
  NativeMapView,
} from '@/components/map/native-map-view';
import { NavigationHud } from '@/components/map/navigation-hud';
import { SpotBottomSheet } from '@/components/map/spot-bottom-sheet';
import {
  CRUISE_SPEED_KNOTS,
  DANGER_ZONE,
  FISHING_SPOTS,
  FishingSpot,
} from '@/constants/fishing-spots';
import { MapColors } from '@/constants/map-theme';
import { useUserLocation } from '@/hooks/use-user-location';
import {
  bearingDegrees,
  distanceNm,
  etaFromNm,
  formatBearing,
  formatNm,
} from '@/utils/geo';

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<NativeMapHandle>(null);

  // Map Appearance & Layer State
  const [mapStyle, setMapStyle] = useState<MapStyleId>('standard');
  const [overlays, setOverlays] = useState<MapOverlaysState>({
    seamarks: true,
    dangerZone: true,
  });
  const [showGpsHud, setShowGpsHud] = useState(true);

  // Spots and Selection State
  const [allSpots, setAllSpots] = useState<FishingSpot[]>(FISHING_SPOTS);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(FISHING_SPOTS[0]?.id ?? null);
  const [droppedPin, setDroppedPin] = useState<DroppedPin | null>(null);

  // Camera & Tracking State
  const [followUser, setFollowUser] = useState(true);
  const [headingUp, setHeadingUp] = useState(false);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');

  // Navigation & Ruler Tool Modes
  const [isNavigating, setIsNavigating] = useState(false);
  const [measurementActive, setMeasurementActive] = useState(false);
  const [measurementStats, setMeasurementStats] = useState({ totalNm: 0, pointsCount: 0 });

  // Modals Visibility
  const [layersModalVisible, setLayersModalVisible] = useState(false);
  const [addSpotModalVisible, setAddSpotModalVisible] = useState(false);
  const [coordModalVisible, setCoordModalVisible] = useState(false);

  // GPS User Location
  const {
    status,
    location,
    placeLabel,
    heading,
    requestPermissionAndLocate,
    openSettings,
    refresh,
  } = useUserLocation();

  // Current selected spot or dropped pin
  const selectedSpot = useMemo(() => {
    if (!selectedSpotId) return null;
    return allSpots.find((s) => s.id === selectedSpotId) ?? null;
  }, [allSpots, selectedSpotId]);

  // Filtered spots based on category pill
  const displayedSpots = useMemo(() => {
    switch (activeFilter) {
      case 'favorites':
        return allSpots.filter((s) => s.favorite);
      case 'deep':
        return allSpots.filter((s) => s.depthM >= 60);
      default:
        return allSpots;
    }
  }, [allSpots, activeFilter]);

  // Navigation stats to target
  const navStats = useMemo(() => {
    let targetLat = 0;
    let targetLng = 0;

    if (selectedSpot) {
      targetLat = selectedSpot.latitude;
      targetLng = selectedSpot.longitude;
    } else if (droppedPin) {
      targetLat = droppedPin.latitude;
      targetLng = droppedPin.longitude;
    } else {
      return { distanceLabel: '—', bearingLabel: '—', etaLabel: '—', rawNm: 0, rawBearing: 0 };
    }

    if (!location) {
      return { distanceLabel: '—', bearingLabel: '—', etaLabel: '—', rawNm: 0, rawBearing: 0 };
    }

    const nm = distanceNm(location.latitude, location.longitude, targetLat, targetLng);
    const bearing = bearingDegrees(location.latitude, location.longitude, targetLat, targetLng);

    return {
      distanceLabel: formatNm(nm),
      bearingLabel: formatBearing(bearing),
      etaLabel: etaFromNm(nm, CRUISE_SPEED_KNOTS),
      rawNm: nm,
      rawBearing: bearing,
    };
  }, [location, selectedSpot, droppedPin]);

  // Location Handlers
  const handlePermissionAction = () => {
    if (status === 'denied' || status === 'disabled') {
      openSettings();
      return;
    }
    void requestPermissionAndLocate();
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

  // Spot Selection & Pin Dropping Handlers
  const handleSelectSpot = (spot: FishingSpot) => {
    setSelectedSpotId(spot.id);
    setDroppedPin(null);
    setFollowUser(false);
    mapRef.current?.goToSpot(spot);
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (measurementActive) return;
    setDroppedPin({ latitude: lat, longitude: lng });
    setSelectedSpotId(null);
    setFollowUser(false);
  };

  const handleGoToCoords = (lat: number, lng: number) => {
    mapRef.current?.flyTo(lat, lng, 13);
    setDroppedPin({ latitude: lat, longitude: lng });
    setSelectedSpotId(null);
    setFollowUser(false);
  };

  // Navigation Mode Toggle
  const handleStartNavigation = () => {
    if (!selectedSpot && !droppedPin) return;
    setIsNavigating(true);
    setFollowUser(true);
    const target = selectedSpot ?? droppedPin;
    if (target) mapRef.current?.fitRoute(target);
  };

  const handleExitNavigation = () => {
    setIsNavigating(false);
  };

  // Category Filter Pill Action
  const handleSelectFilter = (filter: CategoryFilter) => {
    setActiveFilter(filter);
    if (filter === 'measure') {
      setMeasurementActive((v) => !v);
      return;
    }
    if (filter === 'add_spot') {
      setAddSpotModalVisible(true);
      return;
    }
    if (filter === 'goto_coords') {
      setCoordModalVisible(true);
      return;
    }
    if (filter === 'hazards') {
      mapRef.current?.flyTo(DANGER_ZONE.latitude, DANGER_ZONE.longitude, 12);
      return;
    }
  };

  // Measurement Tool Handlers
  const handleToggleMeasure = () => {
    setMeasurementActive((prev) => !prev);
  };

  const handleUndoMeasure = () => {
    mapRef.current?.undoMeasurement();
  };

  const handleClearMeasure = () => {
    mapRef.current?.clearMeasurement();
    setMeasurementStats({ totalNm: 0, pointsCount: 0 });
  };

  const handleDoneMeasure = () => {
    setMeasurementActive(false);
  };

  // Custom Spot Creation
  const handleSaveCustomSpot = (spot: FishingSpot) => {
    setAllSpots((prev) => [spot, ...prev]);
    setSelectedSpotId(spot.id);
    setDroppedPin(null);
    mapRef.current?.goToSpot(spot);
  };

  const handleToggleFavorite = () => {
    if (!selectedSpot) return;
    setAllSpots((prev) =>
      prev.map((s) => (s.id === selectedSpot.id ? { ...s, favorite: !s.favorite } : s)),
    );
  };

  const handleOpenAddSpotFromPin = () => {
    setAddSpotModalVisible(true);
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* Google Maps Style Top Floating Search & Filter Bar (hidden during active turn-by-turn navigation) */}
      {!isNavigating ? (
        <MapSearchBar
          spots={allSpots}
          activeFilter={activeFilter}
          measurementActive={measurementActive}
          status={status}
          placeLabel={placeLabel}
          onSelectFilter={handleSelectFilter}
          onSelectSpot={handleSelectSpot}
          onGoToCoords={handleGoToCoords}
          onOpenLayers={() => setLayersModalVisible(true)}
          onBack={() => (router.canGoBack() ? router.back() : undefined)}
        />
      ) : null}

      {/* Main Interactive Leaflet Marine Map */}
      <View style={styles.mapArea}>
        <NativeMapView
          ref={mapRef}
          mapStyle={mapStyle}
          overlays={overlays}
          location={location}
          heading={heading ?? location?.heading ?? 0}
          followUser={followUser}
          headingUp={headingUp}
          selectedSpotId={selectedSpotId}
          spots={displayedSpots}
          droppedPin={droppedPin}
          measurementActive={measurementActive}
          onSelectSpot={handleSelectSpot}
          onMapClick={handleMapClick}
          onMeasureUpdate={(totalNm, pointsCount) => setMeasurementStats({ totalNm, pointsCount })}
          onUserPanned={() => setFollowUser(false)}
        />

        {/* GPS telemetry card & Compass widget */}
        {!isNavigating ? (
          <View style={styles.topTelemetry} pointerEvents="box-none">
            {showGpsHud ? (
              <GpsInfoCard
                status={status}
                location={location}
                onRequestPermission={handlePermissionAction}
              />
            ) : <View />}

            <CompassWidget
              heading={heading ?? location?.heading ?? 0}
              onResetNorth={handleResetNorth}
            />
          </View>
        ) : null}

        {/* Google Maps Style Right Control Stack */}
        {!isNavigating ? (
          <View style={styles.rightControls} pointerEvents="box-none">
            <MapControlStack
              headingUp={headingUp}
              followUser={followUser}
              measurementActive={measurementActive}
              onZoomIn={() => mapRef.current?.zoomIn()}
              onZoomOut={() => mapRef.current?.zoomOut()}
              onLocate={handleLocate}
              onHeading={() => {
                setHeadingUp((v) => !v);
                setFollowUser(true);
                mapRef.current?.centerOnUser();
              }}
              onToggleMeasure={handleToggleMeasure}
              onAddSpot={() => setAddSpotModalVisible(true)}
            />
          </View>
        ) : null}
      </View>

      {/* Measurement Mode Floating Banner */}
      {measurementActive && !isNavigating ? (
        <MeasurementBanner
          totalNm={measurementStats.totalNm}
          pointsCount={measurementStats.pointsCount}
          onUndo={handleUndoMeasure}
          onClear={handleClearMeasure}
          onDone={handleDoneMeasure}
        />
      ) : null}

      {/* Spot / Dropped Pin Bottom Sheet */}
      {(selectedSpot || droppedPin) && !isNavigating && !measurementActive ? (
        <SpotBottomSheet
          spot={selectedSpot}
          droppedPin={droppedPin}
          distanceLabel={navStats.distanceLabel}
          bearingLabel={navStats.bearingLabel}
          etaLabel={navStats.etaLabel}
          isFavorite={!!selectedSpot?.favorite}
          onGoTo={handleStartNavigation}
          onSaveSpot={handleOpenAddSpotFromPin}
          onToggleFavorite={handleToggleFavorite}
          onMeasureFromHere={() => {
            setMeasurementActive(true);
          }}
          onClose={() => {
            setSelectedSpotId(null);
            setDroppedPin(null);
            mapRef.current?.clearDroppedPin();
          }}
        />
      ) : null}

      {/* Turn-by-Turn Marine Navigation Mode HUD */}
      {isNavigating ? (
        <NavigationHud
          targetName={selectedSpot ? selectedSpot.name : 'Dropped Pin'}
          distanceLabel={navStats.distanceLabel}
          bearingLabel={navStats.bearingLabel}
          etaLabel={navStats.etaLabel}
          depthM={selectedSpot?.depthM}
          location={location}
          heading={heading ?? location?.heading ?? 0}
          onExit={handleExitNavigation}
          onRecenter={handleLocate}
        />
      ) : null}

      {/* Layers Bottom Sheet Modal */}
      <MapLayersModal
        visible={layersModalVisible}
        activeStyle={mapStyle}
        overlays={overlays}
        showGpsHud={showGpsHud}
        onClose={() => setLayersModalVisible(false)}
        onSelectStyle={(s) => setMapStyle(s)}
        onToggleOverlay={(key) =>
          setOverlays((prev) => ({ ...prev, [key]: !prev[key] }))
        }
        onToggleGpsHud={() => setShowGpsHud((v) => !v)}
      />

      {/* Add Custom Spot Modal */}
      <AddSpotModal
        visible={addSpotModalVisible}
        initialLat={droppedPin?.latitude ?? location?.latitude ?? 20.35}
        initialLng={droppedPin?.longitude ?? location?.longitude ?? 70.82}
        onClose={() => setAddSpotModalVisible(false)}
        onSave={handleSaveCustomSpot}
      />

      {/* Manual Coordinates Input Modal */}
      <CoordinateInputModal
        visible={coordModalVisible}
        onClose={() => setCoordModalVisible(false)}
        onPlot={handleGoToCoords}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: MapColors.navy,
  },
  mapArea: {
    flex: 1,
    position: 'relative',
  },
  topTelemetry: {
    position: 'absolute',
    top: 110,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 5,
  },
  rightControls: {
    position: 'absolute',
    right: 12,
    top: '32%',
    zIndex: 5,
  },
});
