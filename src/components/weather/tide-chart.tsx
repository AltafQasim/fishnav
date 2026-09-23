import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { useSettings } from '@/context/settings-context';
import { useAppTheme } from '@/context/theme-context';
import { AstronomicalTidePoint, TideCycleData } from '@/services/marine-weather-service';

const TOTAL_HOURS = 48; // 48-hour continuous cycle (Today + Tomorrow)
const PX_PER_HOUR = 32;
const CHART_WIDTH = TOTAL_HOURS * PX_PER_HOUR + 70; // ~1606px scrollable width
const CHART_HEIGHT = 175;
const PADDING_TOP = 28;
const PADDING_BOTTOM = 30;
const PADDING_LEFT = 35;

export type TideChartProps = {
  tideData?: TideCycleData;
  isOffline?: boolean;
};

export function TideChart({ tideData, isOffline = false }: TideChartProps) {
  const { colors, isLight } = useAppTheme();
  const { depthUnit, formatDepth } = useSettings();
  const scrollRef = useRef<ScrollView>(null);
  const [activeTab, setActiveTab] = useState<'now' | 'today' | 'tomorrow'>('now');

  const minHeight = 0.2;
  const maxHeight = 4.2;
  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  // Convert hour (0 - 48) to X coordinate
  const getX = (hour: number) => {
    const safeH = Number.isFinite(hour) ? hour : 0;
    return PADDING_LEFT + safeH * PX_PER_HOUR;
  };

  // Convert water height (meters) to Y coordinate
  const getY = (h: number) => {
    const safeH = Number.isFinite(h) ? h : 2.15;
    const clampedH = Math.max(minHeight, Math.min(maxHeight, safeH));
    return PADDING_TOP + plotHeight - ((clampedH - minHeight) / (maxHeight - minHeight)) * plotHeight;
  };

  // Real device clock time (0 - 24)
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const currentX = getX(currentHour);

  // Tidal harmonic curve parameters (48-hour wave)
  const baseline = Number.isFinite(tideData?.tidalCurveCoeff?.baselineM) ? tideData!.tidalCurveCoeff.baselineM : 2.15;
  const amplitude = Number.isFinite(tideData?.tidalCurveCoeff?.amplitudeM) ? tideData!.tidalCurveCoeff.amplitudeM : 1.35;
  const phase = Number.isFinite(tideData?.tidalCurveCoeff?.phaseHour) ? tideData!.tidalCurveCoeff.phaseHour : 4.15;

  // Generate 96 points (every 30 mins for 48 hours)
  const points: { x: number; y: number; hour: number; height: number }[] = [];
  const steps = 96;
  for (let i = 0; i <= steps; i++) {
    const hour = (i / steps) * TOTAL_HOURS;
    const rad = ((hour - phase) / 12.42) * 2 * Math.PI;
    const heightM = Math.max(0.4, Number((baseline + amplitude * Math.cos(rad)).toFixed(2)));
    points.push({ x: getX(hour), y: getY(heightM), hour, height: heightM });
  }

  // Build SVG path
  let pathD = points.length > 0 ? `M ${points[0].x} ${points[0].y}` : '';
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    pathD += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  // Area under curve
  const areaD = points.length > 0 ? `${pathD} L ${points[points.length - 1].x} ${PADDING_TOP + plotHeight} L ${
    points[0].x
  } ${PADDING_TOP + plotHeight} Z` : '';

  // Live water level
  const currentCalculatedHeight = Number.isFinite(tideData?.currentHeightM)
    ? (tideData!.currentHeightM)
    : Number((baseline + amplitude * Math.cos(((currentHour - phase) / 12.42) * 2 * Math.PI)).toFixed(2));
  const currentY = getY(currentCalculatedHeight);

  // All 8 extreme high and low points across 48h
  const activeExtremes: AstronomicalTidePoint[] = tideData?.points ?? [];

  // Dynamic gradient IDs for SVG native cache busting
  const gradAreaId = isLight ? 'tideAreaGrad_48h_light' : 'tideAreaGrad_48h_dark';
  const gradLineId = isLight ? 'tideLineGrad_48h_light' : 'tideLineGrad_48h_dark';

  // Auto-scroll to current hour on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ x: Math.max(0, currentX - 110), animated: false });
    }, 200);
    return () => clearTimeout(timer);
  }, [currentX]);

  // Jump handlers
  const handleJumpTo = (target: 'now' | 'today' | 'tomorrow') => {
    setActiveTab(target);
    if (target === 'now') {
      scrollRef.current?.scrollTo({ x: Math.max(0, currentX - 110), animated: true });
    } else if (target === 'today') {
      scrollRef.current?.scrollTo({ x: 0, animated: true });
    } else if (target === 'tomorrow') {
      scrollRef.current?.scrollTo({ x: getX(24) - 20, animated: true });
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.chartCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          },
        ]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={[styles.title, { color: colors.text }]}>48-Hour Arabian Sea Tide Cycle</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {isOffline
                ? 'Astronomical tidal harmonic model (100% Offline computed)'
                : 'Live semi-diurnal continuous 48h curve & extremes'}
            </Text>
          </View>
          <View
            style={[
              styles.liveTag,
              {
                backgroundColor: isOffline
                  ? isLight
                    ? '#FEF3C7'
                    : 'rgba(245, 158, 11, 0.15)'
                  : isLight
                  ? '#FEE2E2'
                  : 'rgba(239, 68, 68, 0.15)',
                borderColor: isOffline
                  ? isLight
                    ? '#FCD34D'
                    : 'rgba(245, 158, 11, 0.3)'
                  : isLight
                  ? '#FCA5A5'
                  : 'rgba(239, 68, 68, 0.3)',
              },
            ]}>
            <View
              style={[
                styles.liveDot,
                { backgroundColor: isOffline ? '#F59E0B' : '#EF4444' },
              ]}
            />
            <Text
              style={[
                styles.liveText,
                {
                  color: isOffline
                    ? isLight
                      ? '#B45309'
                      : '#F59E0B'
                    : isLight
                    ? '#DC2626'
                    : '#EF4444',
                },
              ]}>
              {isOffline ? 'OFFLINE 48H' : 'LIVE 48H'}
            </Text>
          </View>
        </View>

        {/* Quick Jump Timeline Navigation Bar */}
        <View style={styles.controlsRow}>
          <View style={styles.jumpBtnGroup}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleJumpTo('now')}
              style={[
                styles.jumpBtn,
                activeTab === 'now' && {
                  backgroundColor: isLight ? '#0284C7' : colors.accent,
                },
                {
                  borderColor: isLight ? '#CBD5E1' : colors.cardBorder,
                },
              ]}>
              <Feather
                name="crosshair"
                size={11}
                color={activeTab === 'now' ? (isLight ? '#FFFFFF' : '#041728') : colors.textSecondary}
              />
              <Text
                style={[
                  styles.jumpBtnText,
                  {
                    color: activeTab === 'now' ? (isLight ? '#FFFFFF' : '#041728') : colors.textSecondary,
                    fontWeight: activeTab === 'now' ? '800' : '600',
                  },
                ]}>
                Now ({now.getHours()}:{String(now.getMinutes()).padStart(2, '0')})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleJumpTo('today')}
              style={[
                styles.jumpBtn,
                activeTab === 'today' && {
                  backgroundColor: isLight ? '#0284C7' : colors.accent,
                },
                {
                  borderColor: isLight ? '#CBD5E1' : colors.cardBorder,
                },
              ]}>
              <Text
                style={[
                  styles.jumpBtnText,
                  {
                    color: activeTab === 'today' ? (isLight ? '#FFFFFF' : '#041728') : colors.textSecondary,
                    fontWeight: activeTab === 'today' ? '800' : '600',
                  },
                ]}>
                Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleJumpTo('tomorrow')}
              style={[
                styles.jumpBtn,
                activeTab === 'tomorrow' && {
                  backgroundColor: isLight ? '#0284C7' : colors.accent,
                },
                {
                  borderColor: isLight ? '#CBD5E1' : colors.cardBorder,
                },
              ]}>
              <Text
                style={[
                  styles.jumpBtnText,
                  {
                    color: activeTab === 'tomorrow' ? (isLight ? '#FFFFFF' : '#041728') : colors.textSecondary,
                    fontWeight: activeTab === 'tomorrow' ? '800' : '600',
                  },
                ]}>
                Tomorrow
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.swipeHint, { color: colors.textMuted }]}>
            👉 Swipe to inspect full 48h
          </Text>
        </View>

        {/* Scrollable 48-Hour SVG Tide Canvas */}
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scrollCanvas}
          contentContainerStyle={{ paddingRight: 35 }}
        >
          <Svg
            key={`tide-chart-48h-${isLight ? 'light' : 'dark'}`}
            width={CHART_WIDTH}
            height={CHART_HEIGHT}
          >
            <Defs>
              <LinearGradient id={gradAreaId} x1="0" y1="0" x2="0" y2="1">
                <Stop
                  offset="0%"
                  stopColor={isLight ? '#0284C7' : colors.accent}
                  stopOpacity={isLight ? 0.3 : 0.45}
                />
                <Stop
                  offset="80%"
                  stopColor={isLight ? '#0284C7' : colors.accent}
                  stopOpacity={isLight ? 0.07 : 0.12}
                />
                <Stop
                  offset="100%"
                  stopColor={isLight ? '#0284C7' : colors.accent}
                  stopOpacity={0.0}
                />
              </LinearGradient>
              <LinearGradient id={gradLineId} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0%" stopColor={isLight ? '#0284C7' : colors.accent} />
                <Stop offset="50%" stopColor={isLight ? '#0369A1' : '#60A5FA'} />
                <Stop offset="100%" stopColor={isLight ? '#0284C7' : colors.accent} />
              </LinearGradient>
            </Defs>

            {/* Horizontal Water Level Meter Grid Lines */}
            {(depthUnit === 'FT' ? [3, 6, 9, 12] : [1, 2, 3, 4]).map((level) => {
              const heightM = depthUnit === 'FT' ? level / 3.28084 : level;
              const y = getY(heightM);
              return (
                <React.Fragment key={`grid-${level}`}>
                  <Line
                    x1={PADDING_LEFT}
                    y1={y}
                    x2={CHART_WIDTH - 20}
                    y2={y}
                    stroke={isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)'}
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                  <SvgText
                    x={PADDING_LEFT - 8}
                    y={y + 4}
                    fill={colors.textMuted}
                    fontSize={10}
                    textAnchor="end"
                  >
                    {level}{depthUnit === 'FT' ? 'ft' : 'm'}
                  </SvgText>
                </React.Fragment>
              );
            })}

            {/* Day 1 / Day 2 Boundary Separation at Hour 24 */}
            <Line
              x1={getX(24)}
              y1={PADDING_TOP - 10}
              x2={getX(24)}
              y2={PADDING_TOP + plotHeight}
              stroke={colors.accent}
              strokeWidth={1.5}
              strokeDasharray="5 5"
            />
            {/* Day Header Badges */}
            <Rect
              x={getX(0) + 10}
              y={PADDING_TOP - 18}
              width={56}
              height={18}
              rx={5}
              fill={isLight ? '#F1F5F9' : 'rgba(255,255,255,0.08)'}
            />
            <SvgText
              x={getX(0) + 38}
              y={PADDING_TOP - 5}
              fill={colors.text}
              fontSize={10}
              fontWeight="bold"
              textAnchor="middle"
            >
              TODAY
            </SvgText>

            <Rect
              x={getX(24) + 10}
              y={PADDING_TOP - 18}
              width={82}
              height={18}
              rx={5}
              fill={isLight ? '#F1F5F9' : 'rgba(255,255,255,0.08)'}
            />
            <SvgText
              x={getX(24) + 51}
              y={PADDING_TOP - 5}
              fill={colors.accent}
              fontSize={10}
              fontWeight="bold"
              textAnchor="middle"
            >
              TOMORROW
            </SvgText>

            {/* Timeline Hour Marks (Every 3 hours) */}
            {Array.from({ length: 17 }).map((_, i) => {
              const h = i * 3;
              const x = getX(h);
              const isMidnight = h === 0 || h === 24 || h === 48;
              const displayHour = h % 24;
              const label = `${String(displayHour).padStart(2, '0')}:00`;

              return (
                <React.Fragment key={`hour-tick-${h}`}>
                  <Line
                    x1={x}
                    y1={PADDING_TOP + plotHeight}
                    x2={x}
                    y2={PADDING_TOP + plotHeight + 6}
                    stroke={isLight ? '#CBD5E1' : 'rgba(255,255,255,0.2)'}
                    strokeWidth={isMidnight ? 2 : 1}
                  />
                  <SvgText
                    x={x}
                    y={CHART_HEIGHT - 6}
                    fill={isMidnight ? (isLight ? '#0F172A' : colors.accent) : colors.textSecondary}
                    fontSize={9}
                    fontWeight={isMidnight ? 'bold' : 'normal'}
                    textAnchor="middle"
                  >
                    {label}
                  </SvgText>
                </React.Fragment>
              );
            })}

            {/* Tidal Wave Shaded Fill Area */}
            <Path d={areaD} fill={`url(#${gradAreaId})`} />

            {/* Continuous 48-Hour Wave Line */}
            <Path
              d={pathD}
              fill="none"
              stroke={`url(#${gradLineId})`}
              strokeWidth={3}
              strokeLinecap="round"
            />

            {/* Live Current Time Line & Marker */}
            <Line
              x1={currentX}
              y1={PADDING_TOP}
              x2={currentX}
              y2={PADDING_TOP + plotHeight}
              stroke={isLight ? '#DC2626' : '#EF4444'}
              strokeWidth={1.8}
              strokeDasharray="3 3"
            />
            <Circle
              cx={currentX}
              cy={currentY}
              r={5.5}
              fill={isLight ? '#DC2626' : '#EF4444'}
              stroke={isLight ? '#FFFFFF' : '#041728'}
              strokeWidth={2}
            />
            <SvgText
              x={currentX}
              y={Math.max(PADDING_TOP + 12, currentY - 10)}
              fill={isLight ? '#DC2626' : '#EF4444'}
              fontSize={10}
              fontWeight="bold"
              textAnchor="middle"
            >
              NOW {formatDepth(currentCalculatedHeight).full}
            </SvgText>

            {/* All Astronomical High and Low Points across 48h */}
            {activeExtremes.map((pt, idx) => {
              const x = getX(pt.hour);
              const y = getY(pt.heightM);
              const isHigh = pt.type === 'high';
              const markerColor = isHigh
                ? isLight
                  ? '#0284C7'
                  : colors.accent
                : isLight
                ? '#D97706'
                : '#F59E0B';

              return (
                <React.Fragment key={`extreme-pt-${idx}`}>
                  <Circle
                    cx={x}
                    cy={y}
                    r={4.5}
                    fill={markerColor}
                    stroke={isLight ? '#FFFFFF' : '#041728'}
                    strokeWidth={2}
                  />
                  {/* Extreme Height Value & Arrow */}
                  <SvgText
                    x={x}
                    y={isHigh ? y - 8 : y + 16}
                    fill={markerColor}
                    fontSize={10}
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {isHigh ? '▲' : '▼'} {formatDepth(pt.heightM).full}
                  </SvgText>
                  {/* Extreme Time */}
                  <SvgText
                    x={x}
                    y={isHigh ? y - 20 : y + 27}
                    fill={colors.textSecondary}
                    fontSize={9}
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {pt.time}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
        </ScrollView>

        {/* Tide Summary Cards (Next High & Low) */}
        <View style={[styles.summaryRow, { borderTopColor: colors.divider }]}>
          <View
            style={[
              styles.tideCard,
              {
                backgroundColor: isLight ? '#F8FAFC' : 'rgba(255, 255, 255, 0.04)',
                borderColor: colors.cardBorder,
              },
            ]}>
            <Text style={[styles.tideLabel, { color: colors.textMuted }]}>NEXT HIGH TIDE</Text>
            <Text style={[styles.tideVal, { color: isLight ? '#0284C7' : colors.accent }]}>
              {tideData?.nextHighTide?.heightM != null ? formatDepth(tideData.nextHighTide.heightM).full : formatDepth(3.5).full}
            </Text>
            <Text style={[styles.tideTime, { color: colors.textSecondary }]}>
              {tideData?.nextHighTide?.relativeText ?? 'at 16:45 (in 2h 15m)'}
            </Text>
          </View>

          <View
            style={[
              styles.tideCard,
              {
                backgroundColor: isLight ? '#F8FAFC' : 'rgba(255, 255, 255, 0.04)',
                borderColor: colors.cardBorder,
              },
            ]}>
            <Text style={[styles.tideLabel, { color: colors.textMuted }]}>NEXT LOW TIDE</Text>
            <Text style={[styles.tideVal, { color: isLight ? '#D97706' : '#F59E0B' }]}>
              {tideData?.nextLowTide?.heightM != null ? formatDepth(tideData.nextLowTide.heightM).full : formatDepth(1.1).full}
            </Text>
            <Text style={[styles.tideTime, { color: colors.textSecondary }]}>
              {tideData?.nextLowTide?.relativeText ?? 'at 22:50 (in 8h 20m)'}
            </Text>
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
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  jumpBtnGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  jumpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  jumpBtnText: {
    fontSize: 10,
  },
  swipeHint: {
    fontSize: 10,
    fontWeight: '500',
  },
  scrollCanvas: {
    marginVertical: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  tideCard: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  tideLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tideVal: {
    fontSize: 18,
    fontWeight: '800',
    marginVertical: 2,
  },
  tideTime: {
    fontSize: 11,
  },
});
