import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Line,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { MapColors } from '@/constants/map-theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = Math.min(SCREEN_WIDTH - 48, 380);
const CHART_HEIGHT = 130;
const PADDING_X = 20;

export type SolunarPeriod = {
  type: 'Major' | 'Minor';
  startTime: string;
  endTime: string;
  rating: number; // 1-5
};

export const DEMO_SOLUNAR_PERIODS: SolunarPeriod[] = [
  { type: 'Major', startTime: '05:20', endTime: '07:20', rating: 5 },
  { type: 'Minor', startTime: '11:45', endTime: '12:45', rating: 3 },
  { type: 'Major', startTime: '17:40', endTime: '19:40', rating: 5 },
  { type: 'Minor', startTime: '23:50', endTime: '00:50', rating: 4 },
];

export function SolunarChart() {
  const plotW = CHART_WIDTH - PADDING_X * 2;
  const plotH = CHART_HEIGHT - 36;

  const getX = (hour: number) => PADDING_X + (hour / 24) * plotW;
  const getY = (score: number) => 15 + plotH - (score / 100) * plotH;

  // Generate 24h curve with feeding peaks
  const points: { x: number; y: number }[] = [];
  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    const hour = (i / steps) * 24;
    // Base feeding activity 15%
    let activity = 18;
    // Major Peak 1 around 06:20
    activity += 70 * Math.exp(-Math.pow((hour - 6.3) / 1.4, 2));
    // Minor Peak 1 around 12:15
    activity += 40 * Math.exp(-Math.pow((hour - 12.2) / 1.0, 2));
    // Major Peak 2 around 18:40
    activity += 75 * Math.exp(-Math.pow((hour - 18.6) / 1.4, 2));
    // Minor Peak 2 around 23:55
    activity += 45 * Math.exp(-Math.pow((hour - 23.9) / 1.0, 2));

    points.push({ x: getX(hour), y: getY(Math.min(activity, 96)) });
  }

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    pathD += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  const areaD = `${pathD} L ${points[points.length - 1].x} ${15 + plotH} L ${points[0].x} ${
    15 + plotH
  } Z`;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.cardTitle}>24-Hour Solunar Feeding Activity</Text>
            <Text style={styles.cardSub}>Moon transit & tidal alignment activity score</Text>
          </View>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={13} color="#F59E0B" />
            <Text style={styles.ratingText}>92% EXCELLENT</Text>
          </View>
        </View>

        {/* SVG Curve */}
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={styles.svg}>
          <Defs>
            <LinearGradient id="solunarAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#10B981" stopOpacity="0.45" />
              <Stop offset="70%" stopColor="#059669" stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#064E3B" stopOpacity="0.0" />
            </LinearGradient>
            <LinearGradient id="solunarLineGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#34D399" />
              <Stop offset="50%" stopColor="#10B981" />
              <Stop offset="100%" stopColor="#34D399" />
            </LinearGradient>
          </Defs>

          {/* Time axis grid */}
          {[0, 6, 12, 18, 24].map((h) => {
            const x = getX(h);
            return (
              <React.Fragment key={`grid-h-${h}`}>
                <Line
                  x1={x}
                  y1={15}
                  x2={x}
                  y2={15 + plotH}
                  stroke="rgba(255, 255, 255, 0.07)"
                  strokeDasharray="3 3"
                />
                <SvgText
                  x={x}
                  y={CHART_HEIGHT - 4}
                  fill={MapColors.textMuted}
                  fontSize={9}
                  textAnchor="middle"
                >
                  {String(h).padStart(2, '0')}:00
                </SvgText>
              </React.Fragment>
            );
          })}

          <Path d={areaD} fill="url(#solunarAreaGrad)" />
          <Path
            d={pathD}
            fill="none"
            stroke="url(#solunarLineGrad)"
            strokeWidth={2.5}
            strokeLinecap="round"
          />

          {/* Peak Indicators */}
          <Circle cx={getX(6.3)} cy={getY(88)} r={4} fill="#10B981" stroke="#FFFFFF" strokeWidth={1.5} />
          <SvgText x={getX(6.3)} y={getY(88) - 8} fill="#34D399" fontSize={9} fontWeight="bold" textAnchor="middle">
            MAJOR
          </SvgText>

          <Circle cx={getX(18.6)} cy={getY(93)} r={4} fill="#10B981" stroke="#FFFFFF" strokeWidth={1.5} />
          <SvgText x={getX(18.6)} y={getY(93) - 8} fill="#34D399" fontSize={9} fontWeight="bold" textAnchor="middle">
            MAJOR
          </SvgText>
        </Svg>

        {/* Feeding Windows List */}
        <View style={styles.periodsGrid}>
          {DEMO_SOLUNAR_PERIODS.map((period, i) => {
            const isMajor = period.type === 'Major';
            return (
              <View key={i} style={styles.periodItem}>
                <View style={styles.periodTop}>
                  <Text style={[styles.periodType, isMajor && styles.periodTypeMajor]}>
                    {period.type} Period
                  </Text>
                  <View style={styles.stars}>
                    {Array.from({ length: period.rating }).map((_, s) => (
                      <Ionicons key={s} name="star" size={10} color="#F59E0B" />
                    ))}
                  </View>
                </View>
                <Text style={styles.periodTime}>
                  {period.startTime} - {period.endTime}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  card: {
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
    marginBottom: 6,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cardSub: {
    color: MapColors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  ratingText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  svg: {
    alignSelf: 'center',
    marginVertical: 4,
  },
  periodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  periodItem: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    padding: 10,
  },
  periodTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  periodType: {
    color: MapColors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  periodTypeMajor: {
    color: '#34D399',
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  periodTime: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
});
