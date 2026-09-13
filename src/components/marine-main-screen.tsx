import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  MapControlStack
} from '@/components/map/map-overlays';
import {
  DroppedPin,
  MapOverlaysState,
  NativeMapHandle,
  NativeMapView,
} from '@/components/map/native-map-view';
import { SpotBottomSheet } from '@/components/map/spot-bottom-sheet';
import {
  ActiveTabType,
  AppTabs,
} from '@/components/navigation/app-tabs';
import { CalendarSheetContent } from '@/components/sheets/calendar-sheet-content';
import { CompassSheetContent } from '@/components/sheets/compass-sheet-content';
import { SettingsSheetContent } from '@/components/sheets/settings-sheet-content';
import { WaypointsSheetContent } from '@/components/sheets/waypoints-sheet-content';
import { WeatherSheetContent } from '@/components/sheets/weather-sheet-content';
import { SlidingSheetContainer } from '@/components/ui/sliding-sheet-container';
import { FishingSpot } from '@/constants/fishing-spots';
import { MapColors } from '@/constants/map-theme';
import { useWaypoints } from '@/context/waypoints-context';
import { useUserLocation } from '@/hooks/use-user-location';
import { bearingDegrees, distanceNm, etaFromNm, formatBearing, formatNm } from '@/utils/geo';

type MarineMainScreenProps = {
  initialTab?: ActiveTabType;
};

export function MarineMainScreen({ initialTab = null }: MarineMainScreenProps) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<NativeMapHandle>(null);

  const { waypoints, selectedSpot, selectedSpotId, setSelectedSpotId, setActiveNavigationTarget } =
    useWaypoints();
  const { location, status, heading, requestPermissionAndLocate, openSettings, refresh } =
    useUserLocation();

  // Active Sheet Tab (Default is NULL = Map is shown!)
  const [activeTab, setActiveTab] = useState<ActiveTabType>(initialTab);

  // Map state
  const [followUser, setFollowUser] = useState(true);
  const [headingUp, setHeadingUp] = useState(false);
  const [droppedPin, setDroppedPin] = useState<DroppedPin | null>(null);
  const [overlays] = useState<MapOverlaysState>({
    seamarks: true,
    dangerZone: true,
  });

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
    setDroppedPin(null);
    setFollowUser(false);
    mapRef.current?.goToSpot(spot);
    // Dismiss sheet so spot is visible on map
    setActiveTab(null);
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

  const getSheetMetadata = () => {
    switch (activeTab) {
      case 'waypoint':
        return {
          title: 'Waypoints',
          subtitle: `${waypoints.length} saved fishing spots & GPS marks`,
          badgeText: `${waypoints.length} SPOTS`,
        };
      case 'weather':
        return {
          title: 'Marine & Tides',
          subtitle: 'Arabian Sea coastal weather & hydrographic conditions',
          badgeText: 'MODERATE SEA',
        };
      case 'compass':
        return {
          title: 'Marine Compass',
          subtitle: 'Sensor-stabilized heading & waypoint steering',
          badgeText: 'LIVE SENSOR',
        };
      case 'calendar':
        return {
          title: 'Sun & Moon Calendar',
          subtitle: 'Solunar lunar cycles & fish feeding windows',
          badgeText: 'WAXING GIBBOUS',
        };
      case 'settings':
        return {
          title: 'Marine Settings',
          subtitle: 'Vessel profile, units, navigation alarms & backup',
          badgeText: 'v1.0.0 PRO',
        };
      default:
        return { title: '', subtitle: '', badgeText: '' };
    }
  };

  const meta = getSheetMetadata();

  return (
    <View style={styles.container}>
      {/* 1. Full Screen Interactive Marine Map (Default Layer!) */}
      <View style={styles.mapWrap}>
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
          onSelectSpot={handleViewSpotOnMap}
          onMapClick={handleMapClick}
          onUserPanned={() => setFollowUser(false)}
        />



        {/* Floating Right Map Controls (Zoom In/Out, Locate, Heading Mode) */}
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
            onAddSpot={() => setActiveTab('waypoint')}
          />
        </View>

        {/* Spot Bottom Sheet when clicking any marker on the map */}
        {activeTab === null && (selectedSpot || droppedPin) ? (
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
            onSaveSpot={() => setActiveTab('waypoint')}
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

      {/* 2. Compact Sliding Card Sheet (Sits at bottom ~58% so map is ALWAYS visible at top!) */}
      <SlidingSheetContainer
        isOpen={activeTab !== null}
        title={meta.title}
        subtitle={meta.subtitle}
        badge={
          meta.badgeText ? (
            <View style={styles.sheetBadge}>
              <Text style={styles.sheetBadgeText}>{meta.badgeText}</Text>
            </View>
          ) : undefined
        }
        onClose={handleCloseSheet}
      >
        {activeTab === 'waypoint' && (
          <WaypointsSheetContent onViewOnMap={handleViewSpotOnMap} />
        )}
        {activeTab === 'weather' && <WeatherSheetContent />}
        {activeTab === 'compass' && <CompassSheetContent />}
        {activeTab === 'calendar' && <CalendarSheetContent />}
        {activeTab === 'settings' && <SettingsSheetContent />}
      </SlidingSheetContainer>

      {/* 3. Curved Floating Bottom Navigation Bar (Always Visible!) */}
      <AppTabs
        activeTab={activeTab}
        onTabPress={handleTabPress}
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
