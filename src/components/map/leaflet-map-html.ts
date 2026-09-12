import {
  DANGER_ZONE,
  DEFAULT_MAP_REGION,
  FISHING_SPOTS,
} from '@/constants/fishing-spots';

export function buildLeafletHtml() {
  const initialSpots = JSON.stringify(
    FISHING_SPOTS.map((s) => ({
      id: s.id,
      name: s.name,
      lat: s.latitude,
      lng: s.longitude,
      color: s.color,
      depthM: s.depthM,
      favorite: !!s.favorite,
    })),
  );

  const initialDanger = JSON.stringify({
    lat: DANGER_ZONE.latitude,
    lng: DANGER_ZONE.longitude,
    radiusM: DANGER_ZONE.radiusM,
  });

  const defaultCenter = JSON.stringify({
    lat: DEFAULT_MAP_REGION.latitude,
    lng: DEFAULT_MAP_REGION.longitude,
    zoom: 11,
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #00162B; overflow: hidden; }
    
    .leaflet-control-attribution {
      font-size: 8px !important;
      background: rgba(0, 22, 43, 0.75) !important;
      color: #8BA3B8 !important;
      padding: 2px 6px !important;
      border-radius: 4px;
      margin: 4px !important;
    }
    .leaflet-control-attribution a { color: #3B9EFF !important; text-decoration: none; }
    
    /* Spot Pin */
    .spot-marker-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
    }
    .spot-pin {
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid #FFFFFF;
      box-shadow: 0 3px 8px rgba(0,0,0,0.5);
      position: relative;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .spot-marker-wrap:active .spot-pin,
    .spot-marker-wrap.selected .spot-pin {
      transform: rotate(-45deg) scale(1.18);
      box-shadow: 0 0 0 4px rgba(255,255,255,0.4), 0 4px 12px rgba(0,0,0,0.6);
    }
    .spot-pin-inner {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #FFFFFF;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(45deg);
    }
    .spot-label-pill {
      background: rgba(0, 22, 43, 0.92);
      color: #FFFFFF;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 6px;
      padding: 2px 6px;
      font: 700 10px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin-top: 4px;
      white-space: nowrap;
      box-shadow: 0 2px 5px rgba(0,0,0,0.4);
      pointer-events: none;
    }
    
    /* Dropped Pin */
    .dropped-pin {
      width: 24px;
      height: 36px;
      background: #EF4444;
      border-radius: 12px 12px 0 0;
      position: relative;
      border: 2px solid #FFFFFF;
      box-shadow: 0 4px 10px rgba(0,0,0,0.5);
      animation: pinDrop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .dropped-pin::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 3px;
      width: 0;
      height: 0;
      border-left: 7px solid transparent;
      border-right: 7px solid transparent;
      border-top: 9px solid #EF4444;
    }
    .dropped-pin-dot {
      width: 8px;
      height: 8px;
      background: #FFFFFF;
      border-radius: 50%;
      margin: 6px auto 0;
    }
    @keyframes pinDrop {
      0% { transform: translateY(-16px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
    
    /* User GPS Marker with Beam Cone */
    .user-container {
      position: relative;
      width: 60px;
      height: 60px;
      pointer-events: none;
    }
    .user-beam {
      position: absolute;
      top: 0;
      left: 0;
      width: 60px;
      height: 60px;
      transform-origin: 30px 30px;
      transition: transform 0.3s ease-out;
    }
    .user-dot-pulse {
      position: absolute;
      top: 21px;
      left: 21px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #0084FF;
      border: 3px solid #FFFFFF;
      box-shadow: 0 0 10px rgba(0,132,255,0.8);
      z-index: 2;
    }
    .user-dot-pulse::after {
      content: '';
      position: absolute;
      top: -8px;
      left: -8px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(0, 132, 255, 0.3);
      animation: pulse 2s infinite ease-out;
    }
    @keyframes pulse {
      0% { transform: scale(0.6); opacity: 0.9; }
      100% { transform: scale(1.6); opacity: 0; }
    }

    /* Route info chip */
    .route-chip {
      background: #0084FF;
      color: #FFFFFF;
      padding: 5px 9px;
      border-radius: 8px;
      font: 700 11px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      white-space: nowrap;
      box-shadow: 0 3px 8px rgba(0,0,0,0.45);
      border: 1px solid rgba(255,255,255,0.25);
    }
    
    /* Measure vertex */
    .measure-vertex {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #F59E0B;
      border: 2px solid #FFFFFF;
      box-shadow: 0 2px 6px rgba(0,0,0,0.5);
    }
    .measure-label {
      background: rgba(15, 23, 42, 0.9);
      color: #FBBF24;
      font: 700 11px/1.1 -apple-system, sans-serif;
      padding: 3px 6px;
      border-radius: 6px;
      border: 1px solid rgba(245, 158, 11, 0.4);
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div id="map"></div>

  <script>
    let SPOTS = ${initialSpots};
    let DANGER = ${initialDanger};
    const DEFAULT = ${defaultCenter};

    let map = null;
    let baseLayer = null;
    let activeStyle = 'standard';
    let seamarkLayer = null;
    let dangerCircle = null;
    let userMarker = null;
    let droppedPinMarker = null;
    let routeLine = null;
    let routeChipMarker = null;

    let followUser = true;
    let headingUp = false;
    let userLatLng = null;
    let userHeading = 0;
    let selectedSpotId = null;

    // Measurement ruler state
    let isMeasuring = false;
    let measurePoints = [];
    let measureMarkers = [];
    let measurePolyline = null;
    let measureLegLabels = [];

    const spotMarkers = {};

    // Available tile sets
    const baseLayers = {
      standard: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }),
      satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri'
      }),
      marine: L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '&copy; OSM &copy; CARTO'
      }),
      night: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '&copy; OSM &copy; CARTO'
      })
    };

    function post(msg) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      }
    }

    function toRad(deg) { return (deg * Math.PI) / 180; }
    function toDeg(rad) { return (rad * 180) / Math.PI; }

    function distanceNm(a, b) {
      const R = 3440.065; // Nautical miles
      const dLat = toRad(b.lat - a.lat);
      const dLng = toRad(b.lng - a.lng);
      const sinLat = Math.sin(dLat / 2);
      const sinLng = Math.sin(dLng / 2);
      const x = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
      return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
    }

    function bearingDeg(a, b) {
      const φ1 = toRad(a.lat), φ2 = toRad(b.lat);
      const Δλ = toRad(b.lng - a.lng);
      const y = Math.sin(Δλ) * Math.cos(φ2);
      const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
      return (toDeg(Math.atan2(y, x)) + 360) % 360;
    }

    function formatNm(nm) {
      return nm < 10 ? nm.toFixed(2) + ' NM' : nm.toFixed(1) + ' NM';
    }

    function createSpotIcon(spot, isSelected) {
      const selectedClass = isSelected ? 'selected' : '';
      return L.divIcon({
        className: '',
        html: '<div class="spot-marker-wrap ' + selectedClass + '">' +
                '<div class="spot-pin" style="background:' + (spot.color || '#F59E0B') + '">' +
                  '<div class="spot-pin-inner"></div>' +
                '</div>' +
                '<div class="spot-label-pill">' + spot.name + '</div>' +
              '</div>',
        iconSize: [80, 52],
        iconAnchor: [40, 26],
        popupAnchor: [0, -26]
      });
    }

    function createUserIcon(heading) {
      const rot = isFinite(heading) ? heading : 0;
      return L.divIcon({
        className: '',
        html: '<div class="user-container">' +
                '<svg class="user-beam" style="transform: rotate(' + rot + 'deg)" viewBox="0 0 60 60">' +
                  '<defs>' +
                    '<radialGradient id="beamGrad" cx="50%" cy="50%" r="50%">' +
                      '<stop offset="0%" stop-color="#0084FF" stop-opacity="0.5"/>' +
                      '<stop offset="100%" stop-color="#0084FF" stop-opacity="0"/>' +
                    '</radialGradient>' +
                  '</defs>' +
                  '<path d="M30 30 L10 0 A30 30 0 0 1 50 0 Z" fill="url(#beamGrad)"/>' +
                '</svg>' +
                '<div class="user-dot-pulse"></div>' +
              '</div>',
        iconSize: [60, 60],
        iconAnchor: [30, 30]
      });
    }

    function createDroppedPinIcon() {
      return L.divIcon({
        className: '',
        html: '<div class="dropped-pin"><div class="dropped-pin-dot"></div></div>',
        iconSize: [24, 38],
        iconAnchor: [12, 38],
        popupAnchor: [0, -36]
      });
    }

    function initMap() {
      map = L.map('map', {
        zoomControl: false,
        attributionControl: true,
        preferCanvas: true
      }).setView([DEFAULT.lat, DEFAULT.lng], DEFAULT.zoom);

      setBaseStyle('standard');

      // Danger zone
      setDangerZone(true);

      // Render spots
      renderSpots();

      // Map Click event for Dropped Pin or Ruler measurement
      map.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        if (isMeasuring) {
          addMeasurePoint(lat, lng);
          return;
        }

        // Drop pin at clicked location
        setDroppedPin(lat, lng);
        post({ type: 'mapClick', lat: lat, lng: lng });
      });

      map.on('dragstart', function() {
        followUser = false;
        post({ type: 'userPanned' });
      });

      post({ type: 'ready' });
    }

    function setBaseStyle(style) {
      if (baseLayer) map.removeLayer(baseLayer);
      baseLayer = baseLayers[style] || baseLayers.standard;
      baseLayer.addTo(map);
      activeStyle = style;
    }

    function setDangerZone(visible) {
      if (dangerCircle) {
        map.removeLayer(dangerCircle);
        dangerCircle = null;
      }
      if (visible && DANGER) {
        dangerCircle = L.circle([DANGER.lat, DANGER.lng], {
          radius: DANGER.radiusM,
          color: '#FF3B3B',
          weight: 2,
          dashArray: '6 5',
          fillColor: '#FF3B3B',
          fillOpacity: 0.15
        }).addTo(map);
        dangerCircle.bindTooltip('⚠️ Maritime Danger Zone', { permanent: false, direction: 'top' });
      }
    }

    function setSeamarks(enabled) {
      if (enabled) {
        if (!seamarkLayer) {
          seamarkLayer = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: 'Map data &copy; OpenSeaMap'
          });
        }
        seamarkLayer.addTo(map);
      } else {
        if (seamarkLayer && map.hasLayer(seamarkLayer)) {
          map.removeLayer(seamarkLayer);
        }
      }
    }

    function renderSpots() {
      // Clear existing
      Object.keys(spotMarkers).forEach(function(id) {
        map.removeLayer(spotMarkers[id]);
        delete spotMarkers[id];
      });

      SPOTS.forEach(function(spot) {
        const isSelected = spot.id === selectedSpotId;
        const m = L.marker([spot.lat, spot.lng], {
          icon: createSpotIcon(spot, isSelected),
          zIndexOffset: isSelected ? 800 : 100
        }).addTo(map);

        m.on('click', function(ev) {
          L.DomEvent.stopPropagation(ev);
          selectedSpotId = spot.id;
          highlightSelectedSpot();
          updateRoute();
          post({ type: 'selectSpot', id: spot.id });
        });

        spotMarkers[spot.id] = m;
      });
    }

    function highlightSelectedSpot() {
      SPOTS.forEach(function(spot) {
        const m = spotMarkers[spot.id];
        if (m) {
          const isSelected = spot.id === selectedSpotId;
          m.setIcon(createSpotIcon(spot, isSelected));
          m.setZIndexOffset(isSelected ? 800 : 100);
        }
      });
    }

    function setDroppedPin(lat, lng) {
      if (droppedPinMarker) {
        map.removeLayer(droppedPinMarker);
        droppedPinMarker = null;
      }
      if (lat == null || lng == null) return;

      droppedPinMarker = L.marker([lat, lng], {
        icon: createDroppedPinIcon(),
        zIndexOffset: 950
      }).addTo(map);

      droppedPinMarker.on('click', function(ev) {
        L.DomEvent.stopPropagation(ev);
        post({ type: 'mapClick', lat: lat, lng: lng });
      });
    }

    function clearDroppedPin() {
      if (droppedPinMarker) {
        map.removeLayer(droppedPinMarker);
        droppedPinMarker = null;
      }
    }

    function setUser(lat, lng, heading, follow, hUp) {
      userLatLng = { lat: lat, lng: lng };
      if (isFinite(heading)) userHeading = heading;
      followUser = !!follow;
      headingUp = !!hUp;

      if (!userMarker) {
        userMarker = L.marker([lat, lng], {
          icon: createUserIcon(userHeading),
          zIndexOffset: 1000
        }).addTo(map);
      } else {
        userMarker.setLatLng([lat, lng]);
        userMarker.setIcon(createUserIcon(userHeading));
      }

      updateRoute();

      if (followUser) {
        map.panTo([lat, lng], { animate: true });
      }
    }

    function clearUser() {
      if (userMarker) {
        map.removeLayer(userMarker);
        userMarker = null;
      }
      userLatLng = null;
      clearRoute();
    }

    function updateRoute() {
      if (!userLatLng) {
        clearRoute();
        return;
      }

      // Find target: selected spot or dropped pin
      let target = null;
      let targetName = '';

      if (selectedSpotId) {
        const s = SPOTS.find(function(sp) { return sp.id === selectedSpotId; });
        if (s) {
          target = { lat: s.lat, lng: s.lng };
          targetName = s.name;
        }
      } else if (droppedPinMarker) {
        const pos = droppedPinMarker.getLatLng();
        target = { lat: pos.lat, lng: pos.lng };
        targetName = 'Dropped Pin';
      }

      if (!target) {
        clearRoute();
        return;
      }

      const pts = [[userLatLng.lat, userLatLng.lng], [target.lat, target.lng]];
      const dist = distanceNm(userLatLng, target);
      const brg = bearingDeg(userLatLng, target);
      const chipLabel = formatNm(dist) + ' | ' + Math.round(brg) + '°';

      if (!routeLine) {
        routeLine = L.polyline(pts, {
          color: '#0084FF',
          weight: 3.5,
          dashArray: '8 6',
          opacity: 0.95
        }).addTo(map);
      } else {
        routeLine.setLatLngs(pts);
      }

      const mid = [(userLatLng.lat + target.lat) / 2, (userLatLng.lng + target.lng) / 2];
      if (!routeChipMarker) {
        routeChipMarker = L.marker(mid, {
          icon: L.divIcon({
            className: '',
            html: '<div class="route-chip">' + chipLabel + '</div>',
            iconSize: [120, 26],
            iconAnchor: [60, 13]
          }),
          interactive: false
        }).addTo(map);
      } else {
        routeChipMarker.setLatLng(mid);
        routeChipMarker.setIcon(L.divIcon({
          className: '',
          html: '<div class="route-chip">' + chipLabel + '</div>',
          iconSize: [120, 26],
          iconAnchor: [60, 13]
        }));
      }
    }

    function clearRoute() {
      if (routeLine) {
        map.removeLayer(routeLine);
        routeLine = null;
      }
      if (routeChipMarker) {
        map.removeLayer(routeChipMarker);
        routeChipMarker = null;
      }
    }

    // Measurement functions
    function setMeasurementMode(active) {
      isMeasuring = !!active;
      if (!isMeasuring) {
        clearMeasurement();
      }
    }

    function addMeasurePoint(lat, lng) {
      const pt = { lat: lat, lng: lng };
      measurePoints.push(pt);

      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: '',
          html: '<div class="measure-vertex"></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        })
      }).addTo(map);
      measureMarkers.push(marker);

      redrawMeasureLine();
    }

    function redrawMeasureLine() {
      if (measurePolyline) {
        map.removeLayer(measurePolyline);
        measurePolyline = null;
      }
      measureLegLabels.forEach(function(l) { map.removeLayer(l); });
      measureLegLabels = [];

      if (measurePoints.length === 0) {
        post({ type: 'measureUpdate', totalNm: 0, pointsCount: 0 });
        return;
      }

      const latlngs = measurePoints.map(function(p) { return [p.lat, p.lng]; });
      measurePolyline = L.polyline(latlngs, {
        color: '#F59E0B',
        weight: 3,
        dashArray: '6 4'
      }).addTo(map);

      let totalNm = 0;
      for (let i = 1; i < measurePoints.length; i++) {
        const segNm = distanceNm(measurePoints[i - 1], measurePoints[i]);
        totalNm += segNm;
        const mid = [(measurePoints[i - 1].lat + measurePoints[i].lat) / 2, (measurePoints[i - 1].lng + measurePoints[i].lng) / 2];
        const label = L.marker(mid, {
          icon: L.divIcon({
            className: '',
            html: '<div class="measure-label">' + formatNm(segNm) + '</div>',
            iconSize: [80, 20],
            iconAnchor: [40, 10]
          }),
          interactive: false
        }).addTo(map);
        measureLegLabels.push(label);
      }

      post({ type: 'measureUpdate', totalNm: totalNm, pointsCount: measurePoints.length });
    }

    function undoMeasurement() {
      if (measurePoints.length > 0) {
        measurePoints.pop();
        const lastMarker = measureMarkers.pop();
        if (lastMarker) map.removeLayer(lastMarker);
        redrawMeasureLine();
      }
    }

    function clearMeasurement() {
      measurePoints = [];
      measureMarkers.forEach(function(m) { map.removeLayer(m); });
      measureMarkers = [];
      if (measurePolyline) {
        map.removeLayer(measurePolyline);
        measurePolyline = null;
      }
      measureLegLabels.forEach(function(l) { map.removeLayer(l); });
      measureLegLabels = [];
      post({ type: 'measureUpdate', totalNm: 0, pointsCount: 0 });
    }

    // Command Dispatcher from React Native
    function handle(cmd) {
      if (!cmd || !cmd.type) return;
      switch (cmd.type) {
        case 'zoomIn':
          map.zoomIn();
          break;
        case 'zoomOut':
          map.zoomOut();
          break;
        case 'setStyle':
          setBaseStyle(cmd.style);
          break;
        case 'setOverlays':
          if (cmd.overlays) {
            setSeamarks(!!cmd.overlays.seamarks);
            setDangerZone(!!cmd.overlays.dangerZone);
          }
          break;
        case 'setUser':
          setUser(cmd.lat, cmd.lng, cmd.heading, cmd.follow, cmd.headingUp);
          break;
        case 'clearUser':
          clearUser();
          break;
        case 'centerOnUser':
          followUser = true;
          if (userLatLng) {
            map.flyTo([userLatLng.lat, userLatLng.lng], Math.max(map.getZoom(), 13), { duration: 0.8 });
          }
          break;
        case 'flyTo':
          map.flyTo([cmd.lat, cmd.lng], cmd.zoom || 13, { duration: 0.8 });
          break;
        case 'fitBounds':
          map.fitBounds(L.latLngBounds([cmd.minLat, cmd.minLng], [cmd.maxLat, cmd.maxLng]).pad(0.3));
          break;
        case 'fitRoute':
          if (userLatLng && cmd.targetLat && cmd.targetLng) {
            map.fitBounds(L.latLngBounds([userLatLng.lat, userLatLng.lng], [cmd.targetLat, cmd.targetLng]).pad(0.35));
          } else if (cmd.targetLat && cmd.targetLng) {
            map.flyTo([cmd.targetLat, cmd.targetLng], 13);
          }
          break;
        case 'setSelected':
          selectedSpotId = cmd.id;
          highlightSelectedSpot();
          updateRoute();
          break;
        case 'setCustomSpots':
          if (Array.isArray(cmd.spots)) {
            SPOTS = cmd.spots;
            renderSpots();
            updateRoute();
          }
          break;
        case 'setDroppedPin':
          setDroppedPin(cmd.lat, cmd.lng);
          updateRoute();
          break;
        case 'clearDroppedPin':
          clearDroppedPin();
          updateRoute();
          break;
        case 'setMeasurementMode':
          setMeasurementMode(cmd.active);
          break;
        case 'undoMeasurement':
          undoMeasurement();
          break;
        case 'clearMeasurement':
          clearMeasurement();
          break;
      }
    }

    document.addEventListener('message', function(e) {
      try { handle(JSON.parse(e.data)); } catch (err) {}
    });
    window.addEventListener('message', function(e) {
      try { handle(JSON.parse(e.data)); } catch (err) {}
    });

    initMap();
  </script>
</body>
</html>`;
}
