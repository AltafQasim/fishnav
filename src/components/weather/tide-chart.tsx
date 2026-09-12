import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Line,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { MapColors } from '@/constants/map-theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = Math.min(SCREEN_WIDTH - 48, 380);
const CHART_HEIGHT = 160;
const PADDING_TOP = 25;
const PADDING_BOTTOM = 28;
const PADDING_LEFT = 35;
const PADDING_RIGHT = 15;

export type TidePoint = {
  time: string; // "04:15"
  hour: number; // 4.25
  heightM: number; // 3.8
  type: 'high' | 'low';
};

const DEMO_TIDES: TidePoint[] = [
  { time: '04:15', hour: 4.25, heightM: 3.8, type: 'high' },
  { time: '10:30', hour: 10.5, heightM: 0.9, type: 'low' },
  { time: '16:45', hour: 16.75, heightM: 3.5, type: 'high' },
  { time: '22:50', hour: 22.83, heightM: 1.1, type: 'low' },
];

export function TideChart() {
  const plotWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const minHeight = 0;
  const maxHeight = 4.2;

  // Convert hour (0-24) to X
  const getX = (hour: number) => PADDING_LEFT + (hour / 24) * plotWidth;

  // Convert water height to Y (inverted)
  const getY = (h: number) =>
    PADDING_TOP + plotHeight - ((h - minHeight) / (maxHeight - minHeight)) * plotHeight;

  // Generate smooth sine curve path for 24 hours
  // Baseline average height is 2.3m, amplitude is 1.4m, period is 12.4 hours
  const points: { x: number; y: number }[] = [];
  const steps = 48; // every 30 mins
  for (let i = 0; i <= steps; i++) {
    const hour = (i / steps) * 24;
    // Approximating semi-diurnal tide in Arabian Sea
    const rad = ((hour - 4.25) / 12.4) * 2 * Math.PI;
    const wave = Math.cos(rad);
    const heightM = 2.35 + 1.45 * wave;
    points.push({ x: getX(hour), y: getY(heightM) });
  }

  // Build SVG path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    pathD += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  // Area under curve fill path
  const areaD = `${pathD} L ${points[points.length - 1].x} ${PADDING_TOP + plotHeight} L ${
    points[0].x
  } ${PADDING_TOP + plotHeight} Z`;

  // Current hour marker (e.g. 14:30)
  const currentHour = 14.5;
  const currentX = getX(currentHour);
  const currentY = getY(2.35 + 1.45 * Math.cos(((currentHour - 4.25) / 12.4) * 2 * Math.PI));

  return (
    <View style={styles.container}>
      <View style={styles.chartCard}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>24-Hour Arabian Sea Tide Cycle</Text>
            <Text style={styles.subtitle}>Semi-diurnal tidal curves with predicted extremes</Text>
          </View>
          <View style={styles.liveTag}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* SVG Graphic */}
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={styles.svg}>
          <Defs>
            <LinearGradient id="tideAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#0284C7" stopOpacity="0.45" />
              <Stop offset="80%" stopColor="#0369A1" stopOpacity="0.12" />
              <Stop offset="100%" stopColor="#082F49" stopOpacity="0.0" />
            </LinearGradient>
            <LinearGradient id="tideLineGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#38BDF8" />
              <Stop offset="50%" stopColor="#60A5FA" />
              <Stop offset="100%" stopColor="#38BDF8" />
            </LinearGradient>
          </Defs>

          {/* Grid Lines */}
          {[1, 2, 3, 4].map((level) => {
            const y = getY(level);
            return (
              <React.Fragment key={`grid-${level}`}>
                <Line
                  x1={PADDING_LEFT}
                  y1={y}
                  x2={CHART_WIDTH - PADDING_RIGHT}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <SvgText
                  x={PADDING_LEFT - 8}
                  y={y + 4}
                  fill={MapColors.textMuted}
                  fontSize={10}
                  textAnchor="end"
                >
                  {level}m
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Area under curve */}
          <Path d={areaD} fill="url(#tideAreaGrad)" />

          {/* Curve Stroke */}
          <Path
            d={pathD}
            fill="none"
            stroke="url(#tideLineGrad)"
            strokeWidth={3}
            strokeLinecap="round"
          />

          {/* Current Time Line */}
          <Line
            x1={currentX}
            y1={PADDING_TOP}
            x2={currentX}
            y2={PADDING_TOP + plotHeight}
            stroke="#EF4444"
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
          <Circle cx={currentX} cy={currentY} r={5} fill="#EF4444" stroke="#FFFFFF" strokeWidth={1.5} />

          {/* Extreme Tide Points (High & Low markers) */}
          {DEMO_TIDES.map((pt, idx) => {
            const x = getX(pt.hour);
            const y = getY(pt.heightM);
            const isHigh = pt.type === 'high';
            return (
              <React.Fragment key={`pt-${idx}`}>
                <Circle
                  cx={x}
                  cy={y}
                  r={4.5}
                  fill={isHigh ? '#38BDF8' : '#F59E0B'}
                  stroke="#0A1F35"
                  strokeWidth={2}
                />
                <SvgText
                  x={x}
                  y={isHigh ? y - 8 : y + 16}
                  fill={isHigh ? '#38BDF8' : '#F59E0B'}
                  fontSize={10}
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {isHigh ? '▲' : '▼'} {pt.heightM}m
                </SvgText>
                <SvgText
                  x={x}
                  y={CHART_HEIGHT - 6}
                  fill={MapColors.textSecondary}
                  fontSize={9}
                  textAnchor="middle"
                >
                  {pt.time}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>

        {/* Tide Indicators Summary Row */}
        <View style={styles.summaryRow}>
          <View style={styles.tideCard}>
            <Text style={styles.tideLabel}>NEXT HIGH TIDE</Text>
            <Text style={styles.tideVal}>3.5 m</Text>
            <Text style={styles.tideTime}>at 16:45 (in 2h 15m)</Text>
          </View>

          <View style={styles.tideCard}>
            <Text style={styles.tideLabel}>NEXT LOW TIDE</Text>
            <Text style={[styles.tideVal, { color: '#F59E0B' }]}>1.1 m</Text>
            <Text style={styles.tideTime}>at 22:50 (in 8h 20m)</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  chartCard: {
    backgroundColor: MapColors.navyPanel,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    color: MapColors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveText: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '800',
  },
  svg: {
    alignSelf: 'center',
    marginVertical: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  tideCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 10,
  },
  tideLabel: {
    color: MapColors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tideVal: {
    color: '#38BDF8',
    fontSize: 18,
    fontWeight: '800',
    marginVertical: 2,
  },
  tideTime: {
    color: MapColors.textSecondary,
    fontSize: 11,
  },
});
