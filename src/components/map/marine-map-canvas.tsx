import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  Path,
  Polygon,
  RadialGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { MapColors } from '@/constants/map-theme';

type SpotPin = {
  id: string;
  label: string;
  distance: string;
  color: string;
  x: number;
  y: number;
};

const SPOTS: SpotPin[] = [
  { id: 'tuna', label: 'Tuna Spot', distance: '32.4 NM', color: MapColors.pink, x: 72, y: 28 },
  { id: 'ghol', label: 'Ghol Spot', distance: '18.2 NM', color: MapColors.yellow, x: 58, y: 48 },
  { id: 'king', label: 'King Fish Spot', distance: '26.7 NM', color: MapColors.purple, x: 78, y: 62 },
];

function SpotMarker({ spot }: { spot: SpotPin }) {
  return (
    <View style={[styles.markerWrap, { left: `${spot.x}%`, top: `${spot.y}%` }]} pointerEvents="none">
      <View style={[styles.pin, { backgroundColor: spot.color }]}>
        <View style={styles.pinInner} />
        <View style={[styles.pinTip, { borderTopColor: spot.color }]} />
      </View>
      <View style={styles.markerLabel}>
        <Text style={styles.markerTitle}>{spot.label}</Text>
        <Text style={styles.markerDistance}>{spot.distance}</Text>
      </View>
    </View>
  );
}

export function MarineMapCanvas({
  heading = 0,
  hasGpsFix = false,
}: {
  heading?: number | null;
  hasGpsFix?: boolean;
}) {
  const boatRotation = Number.isFinite(heading) ? (heading ?? 0) - 90 : -25;

  return (
    <View style={styles.canvas}>
      <Svg width="100%" height="100%" viewBox="0 0 390 720" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id="oceanGlow" cx="45%" cy="50%" r="70%">
            <Stop offset="0%" stopColor={MapColors.oceanMid} stopOpacity="1" />
            <Stop offset="55%" stopColor={MapColors.oceanDeep} stopOpacity="1" />
            <Stop offset="100%" stopColor={MapColors.navyDeep} stopOpacity="1" />
          </RadialGradient>
        </Defs>

        <Path d="M0 0 H390 V720 H0 Z" fill="url(#oceanGlow)" />

        {/* Depth bands */}
        <Ellipse cx="160" cy="380" rx="210" ry="260" fill={MapColors.oceanDeep} opacity={0.55} />
        <Ellipse cx="170" cy="400" rx="150" ry="190" fill="#031F38" opacity={0.7} />
        <Ellipse cx="175" cy="420" rx="95" ry="120" fill="#021628" opacity={0.85} />

        {/* Contour lines */}
        <G stroke={MapColors.contour} strokeWidth="1.2" fill="none">
          <Path d="M20 180 C80 160, 140 200, 200 170 S320 140, 380 190" />
          <Path d="M10 250 C90 220, 150 280, 230 240 S330 210, 400 270" />
          <Path d="M0 340 C100 300, 160 380, 250 330 S340 300, 400 360" />
          <Path d="M20 430 C110 390, 170 470, 260 420 S350 390, 400 450" />
          <Path d="M30 520 C120 480, 190 560, 280 510 S360 480, 400 540" />
          <Path d="M40 600 C130 560, 200 640, 290 590 S370 560, 400 620" />
          <Ellipse cx="175" cy="420" rx="70" ry="90" />
          <Ellipse cx="175" cy="420" rx="110" ry="140" />
          <Ellipse cx="170" cy="400" rx="155" ry="195" />
        </G>

        <SvgText x="95" y="255" fill={MapColors.textMuted} fontSize="11" fontWeight="600">
          50
        </SvgText>
        <SvgText x="70" y="340" fill={MapColors.textMuted} fontSize="11" fontWeight="600">
          100
        </SvgText>
        <SvgText x="55" y="440" fill={MapColors.textMuted} fontSize="11" fontWeight="600">
          200
        </SvgText>
        <SvgText x="145" y="430" fill={MapColors.textMuted} fontSize="11" fontWeight="600">
          500
        </SvgText>

        {/* Coastline / land */}
        <Path
          d="M250 0 C280 40, 300 70, 310 110 C330 170, 360 190, 390 210 L390 0 Z"
          fill={MapColors.land}
        />
        <Path
          d="M270 0 C290 35, 305 65, 318 105 C335 155, 365 175, 390 190 L390 0 Z"
          fill={MapColors.landLight}
          opacity={0.45}
        />

        {/* Route: start -> boat -> ghol */}
        <Path
          d="M95 455 C120 430, 145 400, 155 360 C170 300, 200 270, 235 250"
          stroke={MapColors.route}
          strokeWidth="2.5"
          strokeDasharray="8 6"
          fill="none"
          opacity={0.95}
        />

        {/* Start point */}
        <Circle cx="95" cy="455" r="7" fill={MapColors.green} />
        <Circle cx="95" cy="455" r="11" stroke={MapColors.green} strokeWidth="2" fill="none" opacity={0.5} />

        {/* Boat / live GPS marker */}
        {hasGpsFix ? (
          <>
            <Circle cx="158" cy="354" r="18" fill={MapColors.accent} opacity={0.18} />
            <Circle cx="158" cy="354" r="10" stroke={MapColors.accent} strokeWidth="2" fill="none" opacity={0.55} />
          </>
        ) : null}
        <G transform={`translate(148, 345) rotate(${boatRotation}, 10, 9)`}>
          <Path d="M0 8 L10 0 L20 8 L16 18 L4 18 Z" fill="#E8EEF5" stroke="#94A3B8" strokeWidth="1" />
          <Path d="M7 6 L10 2 L13 6" fill={MapColors.accent} />
        </G>

        {/* Danger zone */}
        <Circle
          cx="300"
          cy="380"
          r="42"
          stroke={MapColors.danger}
          strokeWidth="2"
          strokeDasharray="6 5"
          fill="rgba(255, 59, 59, 0.12)"
        />
        <Polygon points="300,358 312,382 288,382" fill={MapColors.danger} />
        <SvgText x="297" y="377" fill="#fff" fontSize="11" fontWeight="700">
          !
        </SvgText>
        <SvgText x="275" y="405" fill={MapColors.danger} fontSize="10" fontWeight="700">
          Danger Zone
        </SvgText>


        {/* Distance chip near boat */}
        <Path
          d="M168 320 H248 C252 320 255 323 255 327 V339 C255 343 252 346 248 346 H168 C164 346 161 343 161 339 V327 C161 323 164 320 168 320 Z"
          fill={MapColors.accent}
        />
        <SvgText x="172" y="338" fill="#fff" fontSize="11" fontWeight="700">
          18.2 NM | 238°
        </SvgText>

        {/* Scale bar */}
        <Line x1="24" y1="560" x2="140" y2="560" stroke={MapColors.scale} strokeWidth="2" />
        <Line x1="24" y1="554" x2="24" y2="566" stroke={MapColors.scale} strokeWidth="2" />
        <Line x1="53" y1="556" x2="53" y2="564" stroke={MapColors.scale} strokeWidth="1.5" />
        <Line x1="82" y1="556" x2="82" y2="564" stroke={MapColors.scale} strokeWidth="1.5" />
        <Line x1="140" y1="554" x2="140" y2="566" stroke={MapColors.scale} strokeWidth="2" />
        <SvgText x="20" y="580" fill={MapColors.scale} fontSize="10">
          0
        </SvgText>
        <SvgText x="48" y="580" fill={MapColors.scale} fontSize="10">
          5
        </SvgText>
        <SvgText x="74" y="580" fill={MapColors.scale} fontSize="10">
          10
        </SvgText>
        <SvgText x="118" y="580" fill={MapColors.scale} fontSize="10">
          20 NM
        </SvgText>
      </Svg>

      {SPOTS.map((spot) => (
        <SpotMarker key={spot.id} spot={spot} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: MapColors.navyDeep,
  },
  markerWrap: {
    position: 'absolute',
    alignItems: 'center',
    width: 110,
    marginLeft: -55,
    marginTop: -36,
  },
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  pinInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  pinTip: {
    position: 'absolute',
    bottom: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  markerLabel: {
    marginTop: 10,
    backgroundColor: 'rgba(0, 14, 28, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  markerTitle: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  markerDistance: {
    color: MapColors.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },
});
