import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  CompassWidget,
  GpsInfoCard,
  MapControlStack,
} from '@/components/map/map-overlays';
import {
  DroppedPin,
  MapOverlaysState,
  NativeMapHandle,
  NativeMapView,
} from '@/components/map/native-map-view';
import { SpotBottomSheet } from '@/components/map/spot-bottom-sheet';
import { FishingSpot } from '@/constants/fishing-spots';
import { useWaypoints } from '@/context/waypoints-context';
import { useUserLocation } from '@/hooks/use-user-location';
import { bearingDegrees, distanceNm, etaFromNm, formatBearing, formatNm } from '@/utils/geo';

export function SharedBackgroundMap() {
  const mapRef = useRef<NativeMapHandle>(null);
  const { waypoints, selectedSpot, selectedSpotId, setSelectedSpotId } = useWaypoints();
  const { location, status, heading, requestPermissionAndLocate, openSettings, refresh } =
    useUserLocation();

  const [followUser, setFollowUser] = useState(true);
  const [headingUp, setHeadingUp] = useState(false);
  const [droppedPin, setDroppedPin] = useState<DroppedPin | null>(null);
  const [overlays] = useState<MapOverlaysState>({
    seamarks: true,
    dangerZone: true,
  });

  const handleSelectSpot = (spot: FishingSpot) => {
    setSelectedSpotId(spot.id);
    setDroppedPin(null);
    setFollowUser(false);
    mapRef.current?.goToSpot(spot);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setDroppedPin({ latitude: lat, longitude: lng });
    setSelectedSpotId(null);
    setFollowUser(false);
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

  // Nav stats if a spot or pin is tapped on the map
  const activeTarget = selectedSpot ?? droppedPin;
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

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Interactive Marine Leaflet Map */}
      <NativeMapView
        ref={mapRef}
        mapStyle="standard"
        overlays={overlays}
        location={location}
        heading={heading ?? location?.heading ?? 0}
        followUser={followUser}
        headingUp={headingUp}
        selectedSpotId={selectedSpotId}
        spots={waypoints}
        droppedPin={droppedPin}
        measurementActive={false}
        onSelectSpot={handleSelectSpot}
        onMapClick={handleMapClick}
        onUserPanned={() => setFollowUser(false)}
      />

      {/* Floating GPS HUD & Compass Widget (at top of map) */}
      <View style={styles.topTelemetry} pointerEvents="box-none">
        <GpsInfoCard
          status={status}
          location={location}
          onRequestPermission={() => {
            if (status === 'denied' || status === 'disabled') {
              openSettings();
            } else {
              void requestPermissionAndLocate();
            }
          }}
        />

        <CompassWidget
          heading={heading ?? location?.heading ?? 0}
          onResetNorth={handleResetNorth}
        />
      </View>

      {/* Floating Right Control Stack */}
      <View style={styles.rightControls} pointerEvents="box-none">
        <MapControlStack
          headingUp={headingUp}
          followUser={followUser}
          measurementActive={false}
          onZoomIn={() => mapRef.current?.zoomIn()}
          onZoomOut={() => mapRef.current?.zoomOut()}
          onLocate={handleLocate}
          onHeading={() => {
            setHeadingUp((v) => !v);
            setFollowUser(true);
            mapRef.current?.centerOnUser();
          }}
          onToggleMeasure={() => { }}
          onAddSpot={() => { }}
        />
      </View>

      {/* Spot Bottom Sheet if user clicks a pin on the map while sheet is closed */}
      {(selectedSpot || droppedPin) ? (
        <SpotBottomSheet
          spot={selectedSpot}
          droppedPin={droppedPin}
          distanceLabel={navStats.distanceLabel}
          bearingLabel={navStats.bearingLabel}
          etaLabel={navStats.etaLabel}
          isFavorite={!!selectedSpot?.favorite}
          onGoTo={() => {
            if (activeTarget) mapRef.current?.fitRoute(activeTarget);
          }}
          onSaveSpot={() => { }}
          onToggleFavorite={() => { }}
          onMeasureFromHere={() => { }}
          onClose={() => {
            setSelectedSpotId(null);
            setDroppedPin(null);
            mapRef.current?.clearDroppedPin();
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  topTelemetry: {
    position: 'absolute',
    top: 50,
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
});
