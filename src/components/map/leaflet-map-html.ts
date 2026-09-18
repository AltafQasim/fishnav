import {
  DANGER_ZONE,
  DEFAULT_MAP_REGION,
  FISHING_SPOTS,
} from '@/constants/fishing-spots';
import { BUNDLED_LEAFLET_CSS } from '@/constants/leaflet-css';

export function buildLeafletHtml(cachedJs?: string | null, offlineTilesDir?: string | null) {
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

  const offlineDirJson = JSON.stringify(offlineTilesDir || '');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
${BUNDLED_LEAFLET_CSS}
  </style>
  ${
    cachedJs
      ? `<script>\n${cachedJs}\n</script>`
      : `<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>`
  }
  <style>
    * { box-sizing: border-box; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #00162B; overflow: hidden; }
    
    /* 🌊 High-Performance Tile Rendering & Smooth Transitions */
    .leaflet-tile {
      transition: opacity 0.22s cubic-bezier(0.4, 0, 0.2, 1) !important;
      will-change: opacity;
    }
    .leaflet-tile-container img, .leaflet-tile-container canvas {
      image-rendering: auto;
    }
    
    /* 🌫️ Overzoom / Parent Tile Fallback with Soft Nautical Blur */
    .tile-fallback-blur {
      filter: blur(1.8px) contrast(1.08) saturate(1.1) !important;
      opacity: 0.92 !important;
      transition: opacity 0.25s ease-in, filter 0.25s ease !important;
      background-color: #00162B !important;
    }
    
    /* ⚓ Uncharted Deep-Water Bathymetric Blurred Canvas Fallback */
    .tile-ocean-fallback {
      filter: blur(1.5px) !important;
      opacity: 0.9 !important;
      background-color: #00162B !important;
    }

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
      background: #0891B2;
      color: #FFFFFF;
      padding: 5px 10px;
      border-radius: 9px;
      font: 800 11px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      white-space: nowrap;
      box-shadow: 0 3px 10px rgba(0,0,0,0.55);
      border: 1.5px solid #00F0FF;
      letter-spacing: 0.2px;
    }
    .nav-target-beacon {
      position: relative;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }
    .beacon-pulse {
      position: absolute;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: 2.5px solid #00F0FF;
      animation: beaconPulse 1.8s infinite ease-out;
      background: rgba(0, 240, 255, 0.22);
    }
    @keyframes beaconPulse {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(1.8); opacity: 0; }
    }
    .beacon-center {
      font-size: 24px;
      line-height: 1;
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.85));
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
    const OFFLINE_BASE_DIR = ${offlineDirJson};

    let map = null;
    let baseLayer = null;
    let activeStyle = 'standard';
    let seamarkLayer = null;
    let dangerCircle = null;
    let userMarker = null;
    let droppedPinMarker = null;
    let routeLine = null;
    let routeChipMarker = null;
    let navTarget = null;
    let navTargetMarker = null;
    let activeTrackPolyline = null;
    let savedTracksGroup = null;

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

    // Fast in-memory cache for loaded parent images & missing state
    var tileMemoryCache = {};
    var missingTileCache = {};

    function getLocalTilePath(z, x, y) {
      if (!OFFLINE_BASE_DIR) return null;
      var base = OFFLINE_BASE_DIR;
      if (!base.startsWith('file://') && !base.startsWith('http') && !base.startsWith('/')) {
        base = 'file://' + base;
      }
      return base + z + '_' + x + '_' + y + '.png';
    }

    function drawBlurredOceanTile(canvas, coords, style) {
      var ctx = canvas.getContext('2d');
      var isNight = style === 'night';
      
      // Base marine deep bathymetric gradient
      var grad = ctx.createLinearGradient(0, 0, 256, 256);
      if (isNight) {
        grad.addColorStop(0, '#010912');
        grad.addColorStop(0.5, '#031728');
        grad.addColorStop(1, '#020C17');
      } else {
        grad.addColorStop(0, '#001428');
        grad.addColorStop(0.5, '#002547');
        grad.addColorStop(1, '#001021');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

      // Subtle bathymetric contour curves (soft blurred oceanic ripples)
      ctx.save();
      ctx.strokeStyle = isNight ? 'rgba(0, 240, 255, 0.05)' : 'rgba(56, 189, 248, 0.07)';
      ctx.lineWidth = 1.6;
      
      var seed = (Math.abs(coords.x) * 31 + Math.abs(coords.y) * 17 + coords.z * 13) % 100;
      var offsetY = (seed / 100) * 40;

      ctx.beginPath();
      ctx.moveTo(0, 50 + offsetY);
      ctx.bezierCurveTo(80, 30 + offsetY, 160, 80 + offsetY, 256, 60 + offsetY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, 150 + offsetY);
      ctx.bezierCurveTo(90, 180 + offsetY, 170, 130 + offsetY, 256, 160 + offsetY);
      ctx.stroke();

      // Subtle nautical coordinate grid cross at tile center
      ctx.strokeStyle = isNight ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 240, 255, 0.05)';
      ctx.beginPath();
      ctx.moveTo(124, 128); ctx.lineTo(132, 128);
      ctx.moveTo(128, 124); ctx.lineTo(128, 132);
      ctx.stroke();

      ctx.restore();

      canvas.className = 'leaflet-tile tile-ocean-fallback';
      canvas.style.filter = 'blur(1.6px)';
      canvas.style.opacity = '0.92';
    }

    function renderBlurredFallback(coords, done, canvas) {
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
      }

      // 1. Attempt Parent Tile at z - 1 (Overzoom upscale with soft nautical blur)
      if (coords.z > 4) {
        var pZ = coords.z - 1;
        var pX = Math.floor(coords.x / 2);
        var pY = Math.floor(coords.y / 2);
        var parentKey = pZ + '_' + pX + '_' + pY;
        var parentPath = getLocalTilePath(pZ, pX, pY);

        var drawParentToCanvas = function(img) {
          try {
            var ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            var subX = coords.x % 2;
            var subY = coords.y % 2;
            ctx.drawImage(img, subX * 128, subY * 128, 128, 128, 0, 0, 256, 256);
            canvas.className = 'leaflet-tile tile-fallback-blur';
            canvas.style.filter = 'blur(1.6px)';
            canvas.style.opacity = '0.92';
            done(null, canvas);
            return true;
          } catch (e) {
            return false;
          }
        };

        // Check memory cache first
        if (tileMemoryCache[parentKey]) {
          if (drawParentToCanvas(tileMemoryCache[parentKey])) {
            return;
          }
        }

        if (parentPath && !missingTileCache[parentKey]) {
          var pImg = new Image();
          pImg.crossOrigin = 'anonymous';
          var handled = false;

          pImg.onload = function() {
            if (handled) return;
            handled = true;
            tileMemoryCache[parentKey] = pImg;
            if (!drawParentToCanvas(pImg)) {
              drawBlurredOceanTile(canvas, coords, activeStyle);
              done(null, canvas);
            }
          };

          pImg.onerror = function() {
            if (handled) return;
            handled = true;
            missingTileCache[parentKey] = true;

            // 2. Attempt Grandparent Tile at z - 2
            if (coords.z > 5) {
              var gpZ = coords.z - 2;
              var gpX = Math.floor(coords.x / 4);
              var gpY = Math.floor(coords.y / 4);
              var gpKey = gpZ + '_' + gpX + '_' + gpY;
              var gpPath = getLocalTilePath(gpZ, gpX, gpY);

              if (gpPath && !missingTileCache[gpKey]) {
                var gpImg = new Image();
                gpImg.crossOrigin = 'anonymous';
                gpImg.onload = function() {
                  try {
                    tileMemoryCache[gpKey] = gpImg;
                    var ctx2 = canvas.getContext('2d');
                    ctx2.imageSmoothingEnabled = true;
                    ctx2.imageSmoothingQuality = 'high';
                    var gpSubX = coords.x % 4;
                    var gpSubY = coords.y % 4;
                    ctx2.drawImage(gpImg, gpSubX * 64, gpSubY * 64, 64, 64, 0, 0, 256, 256);
                    canvas.className = 'leaflet-tile tile-fallback-blur';
                    canvas.style.filter = 'blur(2.2px)';
                    canvas.style.opacity = '0.88';
                    done(null, canvas);
                  } catch (e) {
                    drawBlurredOceanTile(canvas, coords, activeStyle);
                    done(null, canvas);
                  }
                };
                gpImg.onerror = function() {
                  missingTileCache[gpKey] = true;
                  drawBlurredOceanTile(canvas, coords, activeStyle);
                  done(null, canvas);
                };
                gpImg.src = gpPath;
                return;
              }
            }

            drawBlurredOceanTile(canvas, coords, activeStyle);
            done(null, canvas);
          };

          pImg.src = parentPath;
          return;
        }
      }

      // Default: Beautiful blurred ocean bathymetry canvas
      drawBlurredOceanTile(canvas, coords, activeStyle);
      done(null, canvas);
    }

    function createOfflineAwareTileLayer(onlineUrl, options, isOfflineEligible) {
      var mergedOptions = Object.assign({
        maxZoom: 19,
        minZoom: 3,
        keepBuffer: 8,
        updateWhenIdle: false,
        updateWhenZooming: false,
        updateInterval: 50,
      }, options || {});

      var LayerClass = L.TileLayer.extend({
        createTile: function(coords, done) {
          var tile = document.createElement('img');
          tile.setAttribute('role', 'presentation');
          tile.alt = '';
          tile.className = 'leaflet-tile';

          var onlineSrc = this.getTileUrl(coords);
          var localPath = getLocalTilePath(coords.z, coords.x, coords.y);
          var tileKey = coords.z + '_' + coords.x + '_' + coords.y;

          // 1. Web Browser CacheStorage Check (for PWA / Web offline)
          if (typeof window !== 'undefined' && 'caches' in window) {
            window.caches.open('fishnav_offline_tiles').then(function(cache) {
              cache.match(onlineSrc).then(function(matchResp) {
                if (matchResp && matchResp.ok) {
                  matchResp.blob().then(function(blob) {
                    tile.onload = function() { done(null, tile); };
                    tile.onerror = function() { renderBlurredFallback(coords, done); };
                    tile.src = URL.createObjectURL(blob);
                  }).catch(function() {
                    proceedWithNativeOrOnline();
                  });
                } else {
                  proceedWithNativeOrOnline();
                }
              }).catch(function() {
                proceedWithNativeOrOnline();
              });
            }).catch(function() {
              proceedWithNativeOrOnline();
            });
            return tile;
          }

          proceedWithNativeOrOnline();
          return tile;

          function proceedWithNativeOrOnline() {
            // 2. Native Offline Filesystem Check
            if (localPath && isOfflineEligible && !missingTileCache[tileKey]) {
              tile.onload = function() {
                done(null, tile);
              };

              tile.onerror = function() {
                // Local tile not found on disk: mark key in missing cache
                missingTileCache[tileKey] = true;

                // If online network is available, attempt online tile
                if (navigator.onLine !== false) {
                  tile.onload = function() {
                    done(null, tile);
                  };
                  tile.onerror = function() {
                    // Online failed too (e.g. at sea or poor signal) -> smooth blur fallback!
                    renderBlurredFallback(coords, done);
                  };
                  tile.src = onlineSrc;
                } else {
                  // Offline -> immediately show smooth blur fallback!
                  renderBlurredFallback(coords, done);
                }
              };

              tile.src = localPath;
              return;
            }

            // 3. Online fallback or direct load
            tile.onload = function() {
              done(null, tile);
            };
            tile.onerror = function() {
              // Online tile failed (offline or network error) -> smooth blur fallback!
              renderBlurredFallback(coords, done);
            };
            tile.src = onlineSrc;
          }
        }
      });

      return new LayerClass(onlineUrl, mergedOptions);
    }

    // Available tile sets (Offline tiles priority + online fallback + blur overzoom)
    const baseLayers = {
      standard: createOfflineAwareTileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }, true),
      satellite: createOfflineAwareTileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri'
      }, false),
      marine: createOfflineAwareTileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OSM &copy; CARTO'
      }, true),
      night: createOfflineAwareTileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OSM &copy; CARTO'
      }, true)
    };

    function post(msg) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      }
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(JSON.stringify(msg), '*');
        }
      } catch (e) {}
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
        preferCanvas: true,
        fadeAnimation: true,
        zoomAnimation: true,
        markerZoomAnimation: true,
        inertia: true,
        inertiaDeceleration: 3000,
        inertiaMaxSpeed: 2000,
        worldCopyJump: false
      }).setView([DEFAULT.lat, DEFAULT.lng], DEFAULT.zoom);

      setBaseStyle('standard');

      // Danger zone
      setDangerZone(true);

      // Render spots
      renderSpots();

      // Map Click event: Clicking empty water/chart deselects any active item (no dropped pin)
      map.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        if (isMeasuring) {
          addMeasurePoint(lat, lng);
          return;
        }

        clearDroppedPin();
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

    function updateNavTargetMarker() {
      if (!navTarget) {
        clearNavTargetMarker();
        return;
      }
      if (!navTargetMarker) {
        navTargetMarker = L.marker([navTarget.lat, navTarget.lng], {
          icon: L.divIcon({
            className: '',
            html: '<div class="nav-target-beacon"><div class="beacon-pulse"></div><div class="beacon-center">🎯</div></div>',
            iconSize: [44, 44],
            iconAnchor: [22, 22]
          }),
          zIndexOffset: 920
        }).addTo(map);
      } else {
        navTargetMarker.setLatLng([navTarget.lat, navTarget.lng]);
      }
    }

    function clearNavTargetMarker() {
      if (navTargetMarker) {
        map.removeLayer(navTargetMarker);
        navTargetMarker = null;
      }
    }

    function updateRoute() {
      if (!userLatLng) {
        clearRoute();
        return;
      }

      // Find target: navTarget has priority during active navigation
      let target = null;
      let targetName = '';

      if (navTarget) {
        target = { lat: navTarget.lat, lng: navTarget.lng };
        targetName = navTarget.name || 'Destination';
      } else if (selectedSpotId) {
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
      const chipLabel = formatNm(dist) + ' • ' + Math.round(brg) + '° BRG';

      if (!routeLine) {
        routeLine = L.polyline(pts, {
          color: '#00E5FF',
          weight: 4.5,
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
            iconSize: [130, 26],
            iconAnchor: [65, 13]
          }),
          interactive: false
        }).addTo(map);
      } else {
        routeChipMarker.setLatLng(mid);
        routeChipMarker.setIcon(L.divIcon({
          className: '',
          html: '<div class="route-chip">' + chipLabel + '</div>',
          iconSize: [130, 26],
          iconAnchor: [65, 13]
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

    // Active trip breadcrumb trail
    function updateActiveTrack(points) {
      if (!points || points.length === 0) {
        if (activeTrackPolyline) {
          map.removeLayer(activeTrackPolyline);
          activeTrackPolyline = null;
        }
        return;
      }
      const latlngs = points.map(function(p) { return [p.latitude || p.lat, p.longitude || p.lng]; });
      if (!activeTrackPolyline) {
        activeTrackPolyline = L.polyline(latlngs, {
          color: '#00F0FF',
          weight: 4.5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);
      } else {
        activeTrackPolyline.setLatLngs(latlngs);
      }
    }

    // Saved historical trips layer
    function updateSavedTracks(tracks) {
      if (!savedTracksGroup) {
        savedTracksGroup = L.layerGroup().addTo(map);
      }
      savedTracksGroup.clearLayers();
      if (!Array.isArray(tracks)) return;

      tracks.forEach(function(t) {
        if (!t.points || t.points.length < 2) return;
        const pts = t.points.map(function(p) { return [p.latitude || p.lat, p.longitude || p.lng]; });
        const poly = L.polyline(pts, {
          color: t.color || '#38BDF8',
          weight: 3.5,
          opacity: 0.8,
          dashArray: '5 5'
        });
        savedTracksGroup.addLayer(poly);
      });
    }

    function fitTrackBounds(points) {
      if (!points || points.length === 0) return;
      const latlngs = points.map(function(p) { return [p.latitude || p.lat, p.longitude || p.lng]; });
      map.fitBounds(L.latLngBounds(latlngs).pad(0.2));
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
        case 'setNavTarget':
          if (cmd.target && isFinite(cmd.target.lat) && isFinite(cmd.target.lng)) {
            navTarget = { lat: cmd.target.lat, lng: cmd.target.lng, name: cmd.target.name || '' };
            updateNavTargetMarker();
          } else {
            navTarget = null;
            clearNavTargetMarker();
          }
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
        case 'setActiveTrack':
          updateActiveTrack(cmd.points);
          break;
        case 'setSavedTracks':
          updateSavedTracks(cmd.tracks);
          break;
        case 'fitTrackBounds':
          fitTrackBounds(cmd.points);
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
