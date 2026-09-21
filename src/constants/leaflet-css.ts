/**
 * Bundled Leaflet 1.9.4 Core Styles
 * 100% Offline Embedded - zero network latency, works in deep sea
 */
export const BUNDLED_LEAFLET_CSS = `
/* required styles */
.leaflet-pane,
.leaflet-tile,
.leaflet-marker-icon,
.leaflet-marker-shadow,
.leaflet-tile-container,
.leaflet-pane > svg,
.leaflet-pane > canvas,
.leaflet-zoom-box,
.leaflet-image-layer,
.leaflet-layer {
  position: absolute;
  left: 0;
  top: 0;
}
.leaflet-container {
  overflow: hidden;
  -ms-touch-action: none;
  touch-action: none;
}
.leaflet-tile,
.leaflet-marker-icon,
.leaflet-marker-shadow {
  -webkit-user-select: none;
     -moz-user-select: none;
          user-select: none;
  -webkit-user-drag: none;
}
.leaflet-tile-loaded {
  opacity: 1;
  transition: opacity 0.2s;
}
.leaflet-tile-container {
  pointer-events: none;
}
.leaflet-image-layer {
  pointer-events: none;
}
.leaflet-pane {
  z-index: 400;
}
.leaflet-tile-pane    { z-index: 200; }
.leaflet-overlay-pane { z-index: 400; }
.leaflet-shadow-pane  { z-index: 500; }
.leaflet-marker-pane  { z-index: 600; }
.leaflet-tooltip-pane { z-index: 650; }
.leaflet-popup-pane   { z-index: 700; }
.leaflet-map-pane canvas { z-index: 100; }
.leaflet-map-pane svg    { z-index: 200; }

.leaflet-vml-shape {
  width: 1px;
  height: 1px;
}
.lvml {
  behavior: url(#default#VML);
  display: inline-block;
  position: absolute;
}
.leaflet-control {
  position: relative;
  z-index: 800;
  pointer-events: visiblePainted;
  pointer-events: auto;
}
.leaflet-top,
.leaflet-bottom {
  position: absolute;
  z-index: 1000;
  pointer-events: none;
}
.leaflet-top {
  top: 0;
}
.leaflet-right {
  right: 0;
}
.leaflet-bottom {
  bottom: 0;
}
.leaflet-left {
  left: 0;
}
.leaflet-control {
  float: left;
  clear: both;
}
.leaflet-right .leaflet-control {
  float: right;
}
.leaflet-top .leaflet-control {
  margin-top: 10px;
}
.leaflet-bottom .leaflet-control {
  margin-bottom: 10px;
}
.leaflet-left .leaflet-control {
  margin-left: 10px;
}
.leaflet-right .leaflet-control {
  margin-right: 10px;
}
.leaflet-fade-anim .leaflet-popup {
  opacity: 0;
  transition: opacity 0.2s linear;
}
.leaflet-fade-anim .leaflet-map-pane .leaflet-popup {
  opacity: 1;
}
.leaflet-zoom-animated {
  transform-origin: 0 0;
}
svg.leaflet-zoom-animated {
  will-change: transform;
}
.leaflet-zoom-anim .leaflet-zoom-animated {
  transition: transform 0.25s cubic-bezier(0,0,0.25,1);
}
.leaflet-zoom-anim .leaflet-tile,
.leaflet-pan-anim .leaflet-tile {
  transition: none;
}
.leaflet-zoom-anim .leaflet-zoom-hide {
  visibility: hidden;
}
.leaflet-interactive {
  cursor: pointer;
  pointer-events: visiblePainted;
  pointer-events: auto;
}
.leaflet-grab {
  cursor: grab;
}
.leaflet-crosshair,
.leaflet-crosshair .leaflet-interactive {
  cursor: crosshair;
}
.leaflet-popup-pane,
.leaflet-control {
  cursor: auto;
}
.leaflet-dragging .leaflet-grab,
.leaflet-dragging .leaflet-grab .leaflet-interactive,
.leaflet-dragging .leaflet-marker-draggable {
  cursor: move;
  cursor: grabbing;
}
.leaflet-marker-icon,
.leaflet-marker-shadow {
  display: block;
}
.leaflet-container {
  font-family: "Helvetica Neue", Arial, Helvetica, sans-serif;
  font-size: 12px;
  line-height: 1.5;
}
.leaflet-container a {
  color: #0078A8;
}
.leaflet-container .leaflet-control-attribution,
.leaflet-container .leaflet-control-scale {
  font-size: 11px;
}
.leaflet-control-attribution,
.leaflet-control-scale-line {
  padding: 0 5px;
  color: #333;
  line-height: 1.4;
}
.leaflet-control-attribution a {
  text-decoration: none;
}
.leaflet-control-attribution a:hover,
.leaflet-control-attribution a:focus {
  text-decoration: underline;
}
.leaflet-attribution-flag {
  display: inline !important;
  vertical-align: baseline !important;
  width: 1em;
  height: 0.6669em;
}
.leaflet-bar {
  box-shadow: 0 1px 5px rgba(0,0,0,0.65);
  border-radius: 4px;
}
.leaflet-bar a {
  background-color: #fff;
  border-bottom: 1px solid #ccc;
  width: 26px;
  height: 26px;
  line-height: 26px;
  display: block;
  text-align: center;
  text-decoration: none;
  color: black;
}
.leaflet-bar a,
.leaflet-control-layers-toggle {
  background-position: 50% 50%;
  background-repeat: no-repeat;
  display: block;
}
.leaflet-bar a:hover,
.leaflet-bar a:focus {
  background-color: #f4f4f4;
}
.leaflet-bar a:first-child {
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}
.leaflet-bar a:last-child {
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  border-bottom: none;
}
.leaflet-bar a.leaflet-disabled {
  cursor: default;
  background-color: #f4f4f4;
  color: #bbb;
}
.leaflet-touch .leaflet-bar a {
  width: 30px;
  height: 30px;
  line-height: 30px;
}
.leaflet-control-zoom-in,
.leaflet-control-zoom-out {
  font: bold 18px 'Lucida Console', Monaco, monospace;
  text-indent: 1px;
}
.leaflet-touch .leaflet-control-zoom-in, .leaflet-touch .leaflet-control-zoom-out  {
  font-size: 22px;
}
.leaflet-popup {
  position: absolute;
  text-align: center;
  margin-bottom: 20px;
}
.leaflet-popup-content-wrapper {
  padding: 1px;
  text-align: left;
  border-radius: 12px;
}
.leaflet-popup-content {
  margin: 13px 24px 13px 20px;
  line-height: 1.3;
  font-size: 13px;
  font-size: 1.08333em;
  min-height: 1px;
}
.leaflet-popup-content p {
  margin: 17px 0;
  margin: 1.3em 0;
}
.leaflet-popup-tip-container {
  width: 40px;
  height: 20px;
  position: absolute;
  left: 50%;
  margin-top: -1px;
  margin-left: -20px;
  overflow: hidden;
  pointer-events: none;
}
.leaflet-popup-tip {
  width: 17px;
  height: 17px;
  padding: 1px;
  margin: -10px auto 0;
  transform: rotate(45deg);
}
.leaflet-popup-content-wrapper,
.leaflet-popup-tip {
  background: white;
  color: #333;
  box-shadow: 0 3px 14px rgba(0,0,0,0.4);
}
.leaflet-container a.leaflet-popup-close-button {
  position: absolute;
  top: 0;
  right: 0;
  border: none;
  text-align: center;
  width: 24px;
  height: 24px;
  font: 16px/24px Tahoma, Verdana, sans-serif;
  color: #757575;
  text-decoration: none;
  background: transparent;
}
.leaflet-container a.leaflet-popup-close-button:hover,
.leaflet-container a.leaflet-popup-close-button:focus {
  color: #585858;
}
.leaflet-popup-scrolled {
  overflow: auto;
}
.leaflet-oldie .leaflet-popup-content-wrapper {
  -ms-zoom: 1;
}
.leaflet-oldie .leaflet-popup-tip {
  width: 24px;
  margin: 0 auto;
  -ms-filter: "progid:DXImageTransform.Microsoft.Matrix(M11=0.70710678, M12=0.70710678, M21=-0.70710678, M22=0.70710678)";
  filter: progid:DXImageTransform.Microsoft.Matrix(M11=0.70710678, M12=0.70710678, M21=-0.70710678, M22=0.70710678);
}
.leaflet-div-icon {
  background: #fff;
  border: 1px solid #666;
}
.leaflet-tooltip {
  position: absolute;
  padding: 6px;
  background-color: #fff;
  border: 1px solid #fff;
  border-radius: 3px;
  color: #222;
  white-space: nowrap;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
  pointer-events: none;
  box-shadow: 0 1px 3px rgba(0,0,0,0.4);
}
.leaflet-tooltip.leaflet-interactive {
  cursor: pointer;
  pointer-events: auto;
}
.leaflet-tooltip-top:before,
.leaflet-tooltip-bottom:before,
.leaflet-tooltip-left:before,
.leaflet-tooltip-right:before {
  position: absolute;
  pointer-events: none;
  border: 6px solid transparent;
  background: transparent;
  content: "";
}
.leaflet-tooltip-bottom {
  margin-top: 6px;
}
.leaflet-tooltip-top {
  margin-top: -6px;
}
.leaflet-tooltip-bottom:before {
  top: 0;
  margin-top: -12px;
  margin-left: -6px;
  border-bottom-color: #fff;
}
.leaflet-tooltip-top:before {
  bottom: 0;
  margin-bottom: -12px;
  left: 50%;
  margin-left: -6px;
  border-top-color: #fff;
}
.leaflet-tooltip-left {
  margin-left: -6px;
}
.leaflet-tooltip-right {
  margin-left: 6px;
}
.leaflet-tooltip-left:before {
  right: 0;
  margin-right: -12px;
  border-left-color: #fff;
}
.leaflet-tooltip-right:before {
  left: 0;
  margin-left: -12px;
  border-right-color: #fff;
}
`;
