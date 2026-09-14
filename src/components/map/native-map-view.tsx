import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { buildLeafletHtml } from '@/components/map/leaflet-map-html';
import type { MapStyleId } from '@/components/map/map-style-selector';
import type { FishingSpot } from '@/constants/fishing-spots';
import { MapColors } from '@/constants/map-theme';
import type { UserLocation } from '@/hooks/use-user-location';

export type MapOverlaysState = {
  seamarks: boolean;
  dangerZone: boolean;
};

export type DroppedPin = {
  latitude: number;
  longitude: number;
};

export type NativeMapHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  centerOnUser: () => void;
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  goToSpot: (spot: FishingSpot) => void;
  fitRoute: (spot: FishingSpot | DroppedPin) => void;
  fitTrackBounds: (points: { latitude: number; longitude: number }[]) => void;
  setMeasurementMode: (active: boolean) => void;
  undoMeasurement: () => void;
  clearMeasurement: () => void;
  setDroppedPin: (lat: number, lng: number) => void;
  clearDroppedPin: () => void;
};

type NativeMapViewProps = {
  mapStyle: MapStyleId;
  overlays: MapOverlaysState;
  location: UserLocation | null;
  navTarget?: { latitude: number; longitude: number; name?: string } | null;
  heading?: number | null;
  followUser: boolean;
  headingUp: boolean;
  selectedSpotId: string | null;
  spots: FishingSpot[];
  droppedPin?: DroppedPin | null;
  measurementActive: boolean;
  activeTrackPoints?: { latitude: number; longitude: number }[];
  savedTracks?: { id: string; name: string; color: string; visibleOnMap?: boolean; points: { latitude: number; longitude: number }[] }[];
  onSelectSpot: (spot: FishingSpot) => void;
  onMapClick: (lat: number, lng: number) => void;
  onMeasureUpdate?: (totalNm: number, pointsCount: number) => void;
  onUserPanned?: () => void;
};

type MapCommand =
  | { type: 'zoomIn' }
  | { type: 'zoomOut' }
  | { type: 'setStyle'; style: MapStyleId }
  | { type: 'setOverlays'; overlays: MapOverlaysState }
  | { type: 'setUser'; lat: number; lng: number; heading: number; follow: boolean; headingUp: boolean }
  | { type: 'clearUser' }
  | { type: 'centerOnUser' }
  | { type: 'flyTo'; lat: number; lng: number; zoom?: number }
  | { type: 'fitRoute'; targetLat: number; targetLng: number }
  | { type: 'fitTrackBounds'; points: { latitude: number; longitude: number }[] }
  | { type: 'setActiveTrack'; points: { latitude: number; longitude: number }[] }
  | { type: 'setSavedTracks'; tracks: { id: string; color: string; points: { latitude: number; longitude: number }[] }[] }
  | { type: 'setSelected'; id: string | null }
  | { type: 'setNavTarget'; target: { lat: number; lng: number; name?: string } | null }
  | { type: 'setCustomSpots'; spots: { id: string; name: string; lat: number; lng: number; color: string; depthM: number; favorite?: boolean }[] }
  | { type: 'setDroppedPin'; lat: number; lng: number }
  | { type: 'clearDroppedPin' }
  | { type: 'setMeasurementMode'; active: boolean }
  | { type: 'undoMeasurement' }
  | { type: 'clearMeasurement' };

export const NativeMapView = forwardRef<NativeMapHandle, NativeMapViewProps>(
  function NativeMapView(
    {
      mapStyle,
      overlays,
      location,
      navTarget,
      heading,
      followUser,
      headingUp,
      selectedSpotId,
      spots,
      droppedPin,
      measurementActive,
      activeTrackPoints,
      savedTracks,
      onSelectSpot,
      onMapClick,
      onMeasureUpdate,
      onUserPanned,
    },
    ref,
  ) {
    const webRef = useRef<WebView>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const readyRef = useRef(false);
    const queueRef = useRef<MapCommand[]>([]);
    const html = useMemo(() => buildLeafletHtml(), []);

    const send = useCallback((cmd: MapCommand) => {
      if (!readyRef.current) {
        queueRef.current.push(cmd);
        return;
      }
      if (Platform.OS === 'web') {
        (iframeRef.current as any)?.contentWindow?.postMessage(JSON.stringify(cmd), '*');
      } else {
        webRef.current?.postMessage(JSON.stringify(cmd));
      }
    }, []);

    const flushQueue = useCallback(() => {
      const queued = queueRef.current;
      queueRef.current = [];
      queued.forEach((cmd) => {
        if (Platform.OS === 'web') {
          (iframeRef.current as any)?.contentWindow?.postMessage(JSON.stringify(cmd), '*');
        } else {
          webRef.current?.postMessage(JSON.stringify(cmd));
        }
      });
    }, []);

    useImperativeHandle(ref, () => ({
      zoomIn: () => send({ type: 'zoomIn' }),
      zoomOut: () => send({ type: 'zoomOut' }),
      centerOnUser: () => send({ type: 'centerOnUser' }),
      flyTo: (lat, lng, zoom = 13) => send({ type: 'flyTo', lat, lng, zoom }),
      goToSpot: (spot) => send({ type: 'flyTo', lat: spot.latitude, lng: spot.longitude, zoom: 13 }),
      fitRoute: (target) => {
        send({
          type: 'fitRoute',
          targetLat: 'latitude' in target ? target.latitude : (target as any).latitude,
          targetLng: 'longitude' in target ? target.longitude : (target as any).longitude,
        });
      },
      fitTrackBounds: (points) => {
        send({ type: 'fitTrackBounds', points });
      },
      setMeasurementMode: (active) => send({ type: 'setMeasurementMode', active }),
      undoMeasurement: () => send({ type: 'undoMeasurement' }),
      clearMeasurement: () => send({ type: 'clearMeasurement' }),
      setDroppedPin: (lat, lng) => send({ type: 'setDroppedPin', lat, lng }),
      clearDroppedPin: () => send({ type: 'clearDroppedPin' }),
    }));

    // Synchronize style
    useEffect(() => {
      send({ type: 'setStyle', style: mapStyle });
    }, [mapStyle, send]);

    // Synchronize overlays
    useEffect(() => {
      send({ type: 'setOverlays', overlays });
    }, [overlays, send]);

    // Synchronize spots list
    useEffect(() => {
      const formatted = spots.map((s) => ({
        id: s.id,
        name: s.name,
        lat: s.latitude,
        lng: s.longitude,
        color: s.color,
        depthM: s.depthM,
        favorite: !!s.favorite,
      }));
      send({ type: 'setCustomSpots', spots: formatted });
    }, [spots, send]);

    // Synchronize selected spot
    useEffect(() => {
      send({ type: 'setSelected', id: selectedSpotId });
    }, [selectedSpotId, send]);

    // Synchronize navigation destination target for continuous route line
    useEffect(() => {
      if (navTarget && Number.isFinite(navTarget.latitude) && Number.isFinite(navTarget.longitude)) {
        send({
          type: 'setNavTarget',
          target: {
            lat: navTarget.latitude,
            lng: navTarget.longitude,
            name: navTarget.name,
          },
        });
      } else {
        send({ type: 'setNavTarget', target: null });
      }
    }, [navTarget, send]);

    // Synchronize dropped pin
    useEffect(() => {
      if (droppedPin) {
        send({ type: 'setDroppedPin', lat: droppedPin.latitude, lng: droppedPin.longitude });
      } else {
        send({ type: 'clearDroppedPin' });
      }
    }, [droppedPin, send]);

    // Synchronize measurement mode
    useEffect(() => {
      send({ type: 'setMeasurementMode', active: measurementActive });
    }, [measurementActive, send]);

    // Synchronize active tracking polyline
    useEffect(() => {
      send({ type: 'setActiveTrack', points: activeTrackPoints || [] });
    }, [activeTrackPoints, send]);

    // Synchronize saved visible tracks
    useEffect(() => {
      const visible = (savedTracks || [])
        .filter((t) => t.visibleOnMap !== false)
        .map((t) => ({
          id: t.id,
          color: t.color,
          points: t.points,
        }));
      send({ type: 'setSavedTracks', tracks: visible });
    }, [savedTracks, send]);

    // Synchronize user position & heading
    useEffect(() => {
      if (!location) {
        send({ type: 'clearUser' });
        return;
      }

      send({
        type: 'setUser',
        lat: location.latitude,
        lng: location.longitude,
        heading: heading ?? location.heading ?? 0,
        follow: followUser,
        headingUp,
      });
    }, [location, heading, followUser, headingUp, send]);

    const processMessageData = useCallback((data: any) => {
      if (!data || typeof data !== 'object') return;

      if (data.type === 'ready') {
        readyRef.current = true;
        flushQueue();
        send({ type: 'setStyle', style: mapStyle });
        send({ type: 'setOverlays', overlays });
        return;
      }

      if (data.type === 'selectSpot' && data.id) {
        const spot = spots.find((s) => s.id === data.id);
        if (spot) onSelectSpot(spot);
        return;
      }

      if (data.type === 'mapClick' && typeof data.lat === 'number' && typeof data.lng === 'number') {
        onMapClick(data.lat, data.lng);
        return;
      }

      if (data.type === 'measureUpdate' && typeof data.totalNm === 'number') {
        onMeasureUpdate?.(data.totalNm, data.pointsCount ?? 0);
        return;
      }

      if (data.type === 'userPanned') {
        onUserPanned?.();
        return;
      }
    }, [flushQueue, mapStyle, onMapClick, onMeasureUpdate, onSelectSpot, onUserPanned, overlays, send, spots]);

    const onMessage = (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        processMessageData(data);
      } catch {
        // Ignore malformed messages
      }
    };

    // Web iframe listener
    useEffect(() => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const handleWebMsg = (e: MessageEvent) => {
          try {
            const parsed = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
            processMessageData(parsed);
          } catch {}
        };
        window.addEventListener('message', handleWebMsg);
        return () => window.removeEventListener('message', handleWebMsg);
      }
    }, [processMessageData]);

    if (Platform.OS === 'web') {
      return (
        <View style={styles.wrap}>
          <iframe
            ref={iframeRef as any}
            srcDoc={html}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: MapColors.navyDeep,
            }}
          />
        </View>
      );
    }

    return (
      <View style={styles.wrap}>
        <WebView
          ref={webRef}
          originWhitelist={['*']}
          source={{ html }}
          style={styles.map}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          allowsInlineMediaPlayback
          setSupportMultipleWindows={false}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator color={MapColors.accent} size="large" />
            </View>
          )}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: MapColors.navyDeep,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: MapColors.navyDeep,
  },
  loading: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MapColors.navyDeep,
  },
});
