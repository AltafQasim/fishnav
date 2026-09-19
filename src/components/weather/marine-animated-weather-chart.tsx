import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
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
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { useAppTheme } from '@/context/theme-context';
import { HourlyMarineForecast, MarineConditions } from '@/services/marine-weather-service';

export type WeatherMetricType =
  | 'wave'
  | 'wind'
  | 'rain'
  | 'temp'
  | 'pressure'
  | 'visibility'
  | 'current'
  | 'period'
  | 'humidity';

export type MetricConfig = {
  type: WeatherMetricType;
  title: string;
  shortLabel: string;
  unit: string;
  icon: string;
  iconFamily: 'material' | 'feather' | 'ionicons';
  colorDark: string;
  colorLight: string;
  minScale: number;
  maxScale: number;
  cautionThreshold?: number;
  dangerThreshold?: number;
  cautionLabel?: string;
  dangerLabel?: string;
};

export const WEATHER_METRICS: Record<WeatherMetricType, MetricConfig> = {
  wave: {
    type: 'wave',
    title: 'Wave & Swell Height',
    shortLabel: 'Wave',
    unit: 'm',
    icon: 'wave',
    iconFamily: 'material',
    colorDark: '#00F0FF',
    colorLight: '#0284C7',
    minScale: 0.2,
    maxScale: 3.5,
    cautionThreshold: 1.5,
    dangerThreshold: 2.2,
    cautionLabel: '1.5m Moderate',
    dangerLabel: '2.2m Rough Swell',
  },
  wind: {
    type: 'wind',
    title: 'Wind Speed & Gusts',
    shortLabel: 'Wind',
    unit: 'kts',
    icon: 'wind',
    iconFamily: 'feather',
    colorDark: '#F59E0B',
    colorLight: '#D97706',
    minScale: 4,
    maxScale: 32,
    cautionThreshold: 17,
    dangerThreshold: 22,
    cautionLabel: '17 kts Fresh Breeze',
    dangerLabel: '22 kts Near Gale',
  },
  rain: {
    type: 'rain',
    title: 'Precipitation & Rain Rate',
    shortLabel: 'Rain',
    unit: 'mm/h',
    icon: 'rainy',
    iconFamily: 'ionicons',
    colorDark: '#38BDF8',
    colorLight: '#2563EB',
    minScale: 0,
    maxScale: 10,
    cautionThreshold: 2.5,
    dangerThreshold: 5.0,
    cautionLabel: '2.5mm Heavy',
    dangerLabel: '5.0mm Squall',
  },
  temp: {
    type: 'temp',
    title: 'Sea & Air Temperature',
    shortLabel: 'Temp',
    unit: '°C',
    icon: 'coolant-temperature',
    iconFamily: 'material',
    colorDark: '#FB923C',
    colorLight: '#EA580C',
    minScale: 20,
    maxScale: 36,
  },
  pressure: {
    type: 'pressure',
    title: 'Barometric Surface Pressure',
    shortLabel: 'Barometer',
    unit: 'hPa',
    icon: 'gauge',
    iconFamily: 'material',
    colorDark: '#A855F7',
    colorLight: '#7C3AED',
    minScale: 998,
    maxScale: 1020,
    cautionThreshold: 1005,
    cautionLabel: '1005 hPa Low Depression',
  },
  visibility: {
    type: 'visibility',
    title: 'Marine Horizon Visibility',
    shortLabel: 'Visibility',
    unit: 'NM',
    icon: 'eye-outline',
    iconFamily: 'ionicons',
    colorDark: '#10B981',
    colorLight: '#059669',
    minScale: 1.0,
    maxScale: 12.0,
    cautionThreshold: 4.0,
    dangerThreshold: 2.0,
    cautionLabel: '4.0 NM Moderate Mist',
    dangerLabel: '2.0 NM Fog / Poor Sight',
  },
  current: {
    type: 'current',
    title: 'Tidal Current & Drift Speed',
    shortLabel: 'Current',
    unit: 'kts',
    icon: 'water-outline',
    iconFamily: 'ionicons',
    colorDark: '#818CF8',
    colorLight: '#4F46E5',
    minScale: 0.2,
    maxScale: 3.0,
    cautionThreshold: 1.8,
    dangerThreshold: 2.5,
    cautionLabel: '1.8 kts Strong Drift',
    dangerLabel: '2.5 kts Heavy Rip Current',
  },
  period: {
    type: 'period',
    title: 'Wave & Swell Period',
    shortLabel: 'Period',
    unit: 's',
    icon: 'timer-outline',
    iconFamily: 'ionicons',
    colorDark: '#FB7185',
    colorLight: '#E11D48',
    minScale: 4.0,
    maxScale: 16.0,
    cautionThreshold: 5.5,
    dangerThreshold: 14.0,
    cautionLabel: '5.5s Choppy Wind-Wave',
    dangerLabel: '14.0s Heavy Groundswell',
  },
  humidity: {
    type: 'humidity',
    title: 'Relative Air Humidity',
    shortLabel: 'Humidity',
    unit: '%',
    icon: 'water-percent',
    iconFamily: 'material',
    colorDark: '#06B6D4',
    colorLight: '#0891B2',
    minScale: 40,
    maxScale: 100,
    cautionThreshold: 85,
    cautionLabel: '85% Dense Marine Moisture',
  },
};

const CHART_HEIGHT = 185;
const PADDING_TOP = 26;
const PADDING_BOTTOM = 32;
const PADDING_LEFT = 35;
const PX_PER_ITEM = 50;

export type MarineAnimatedWeatherChartProps = {
  hourly: HourlyMarineForecast[];
  conditions?: MarineConditions;
  activeMetric?: WeatherMetricType;
  onMetricChange?: (metric: WeatherMetricType) => void;
};

export function MarineAnimatedWeatherChart({
  hourly,
  conditions,
  activeMetric = 'wind',
  onMetricChange,
}: MarineAnimatedWeatherChartProps) {
  const { colors, isLight } = useAppTheme();
  const [selectedMetric, setSelectedMetric] = useState<WeatherMetricType>(activeMetric);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number>(0);
  const scrollRef = useRef<ScrollView>(null);

  // Sync external metric changes
  useEffect(() => {
    if (activeMetric && activeMetric !== selectedMetric) {
      setSelectedMetric(activeMetric);
    }
  }, [activeMetric]);

  const config = WEATHER_METRICS[selectedMetric];
  const activeColor = isLight ? config.colorLight : config.colorDark;

  // Pulse animation for the "Now" indicator beacon
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.7)).current;

  // Tab switch transition animation
  const chartAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    chartAnim.setValue(0);
    Animated.spring(chartAnim, {
      toValue: 1,
      friction: 8,
      tension: 50,
      useNativeDriver: true,
    }).start();
  }, [selectedMetric]);

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 2.2,
            duration: 1500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 1500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.7,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim, pulseOpacity]);

  // Extract raw numerical values for the active metric across the dataset
  const parsedItems = useMemo(() => {
    if (!hourly || hourly.length === 0) return [];
    return hourly.map((item, idx) => {
      let val = 0;
      let secondaryVal: number | undefined = undefined;

      switch (selectedMetric) {
        case 'wave':
          val = item.waveNum ?? parseFloat(item.wave?.replace('m', '') || '1.2');
          break;
        case 'wind':
          val = item.windNum ?? parseFloat(item.wind?.replace(' kts', '') || '14');
          secondaryVal = item.gustsNum ?? Math.round(val * 1.35);
          break;
        case 'rain':
          val = item.rainNum ?? parseFloat(item.rain?.replace('mm', '') || '0');
          break;
        case 'temp':
          val = item.tempNum ?? parseFloat(item.temp?.replace('°', '') || '28');
          break;
        case 'pressure':
          val = item.pressureNum ?? 1012;
          break;
        case 'visibility':
          val = item.visibilityNum ?? (conditions?.visibilityNm || 9.5);
          break;
        case 'current':
          val = item.currentNum ?? (conditions?.tidalCurrentKnots || 0.8);
          break;
        case 'period':
          val = item.periodNum ?? (conditions?.wavePeriodS || 7.0);
          break;
        case 'humidity':
          val = item.humidityNum ?? (conditions?.relativeHumidity || 74);
          break;
      }

      return {
        ...item,
        index: idx,
        value: Number.isNaN(val) ? 0 : val,
        secondaryValue: secondaryVal,
      };
    });
  }, [hourly, selectedMetric]);

  // Dynamic min and max for chart scaling
  const { minVal, maxVal, avgVal, peakIdx } = useMemo(() => {
    if (parsedItems.length === 0) {
      return { minVal: config.minScale, maxVal: config.maxScale, avgVal: 0, peakIdx: 0 };
    }
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    let pIdx = 0;

    parsedItems.forEach((pt, i) => {
      const v = pt.value;
      if (v < min) min = v;
      if (v > max) {
        max = v;
        pIdx = i;
      }
      sum += v;
    });

    const calculatedMin = Math.min(min, config.minScale);
    const calculatedMax = Math.max(max, config.maxScale);
    const margin = (calculatedMax - calculatedMin) * 0.15 || 1;

    return {
      minVal: Math.max(0, calculatedMin - (selectedMetric === 'pressure' ? margin : 0)),
      maxVal: calculatedMax + margin,
      avgVal: Number((sum / parsedItems.length).toFixed(1)),
      peakIdx: pIdx,
    };
  }, [parsedItems, config, selectedMetric]);

  const totalPoints = parsedItems.length;
  const chartWidth = Math.max(Dimensions.get('window').width - 32, totalPoints * PX_PER_ITEM + PADDING_LEFT + 40);
  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const getX = (idx: number) => PADDING_LEFT + idx * PX_PER_ITEM;
  const getY = (val: number) => {
    if (maxVal === minVal) return PADDING_TOP + plotHeight / 2;
    const ratio = (val - minVal) / (maxVal - minVal);
    const clamped = Math.max(0, Math.min(1, ratio));
    return PADDING_TOP + plotHeight - clamped * plotHeight;
  };

  // Build SVG path points for main value
  const svgPoints = useMemo(() => {
    return parsedItems.map((pt) => ({
      x: getX(pt.index),
      y: getY(pt.value),
      item: pt,
    }));
  }, [parsedItems, minVal, maxVal]);

  // Secondary curve points (e.g. Wind Gusts)
  const secondarySvgPoints = useMemo(() => {
    if (selectedMetric !== 'wind') return [];
    return parsedItems.map((pt) => ({
      x: getX(pt.index),
      y: getY(pt.secondaryValue ?? pt.value * 1.3),
      item: pt,
    }));
  }, [parsedItems, selectedMetric, minVal, maxVal]);

  // Generate cubic bezier curved path
  const curvePathD = useMemo(() => {
    if (svgPoints.length < 2) return '';
    let d = `M ${svgPoints[0].x} ${svgPoints[0].y}`;
    for (let i = 1; i < svgPoints.length; i++) {
      const prev = svgPoints[i - 1];
      const curr = svgPoints[i];
      const midX = (prev.x + curr.x) / 2;
      d += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  }, [svgPoints]);

  // Secondary curve path for gusts
  const secondaryCurvePathD = useMemo(() => {
    if (secondarySvgPoints.length < 2) return '';
    let d = `M ${secondarySvgPoints[0].x} ${secondarySvgPoints[0].y}`;
    for (let i = 1; i < secondarySvgPoints.length; i++) {
      const prev = secondarySvgPoints[i - 1];
      const curr = secondarySvgPoints[i];
      const midX = (prev.x + curr.x) / 2;
      d += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  }, [secondarySvgPoints]);

  // Closed area under the curve for gradient fill
  const areaPathD = useMemo(() => {
    if (!curvePathD || svgPoints.length === 0) return '';
    const lastX = svgPoints[svgPoints.length - 1].x;
    const firstX = svgPoints[0].x;
    const bottomY = PADDING_TOP + plotHeight;
    return `${curvePathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [curvePathD, svgPoints, plotHeight]);

  const activePoint = parsedItems[selectedPointIndex] || parsedItems[0];
  const activeX = activePoint ? getX(activePoint.index) : PADDING_LEFT;
  const activeY = activePoint ? getY(activePoint.value) : PADDING_TOP;

  const handleSelectMetric = (m: WeatherMetricType) => {
    setSelectedMetric(m);
    if (onMetricChange) onMetricChange(m);
  };

  const renderIcon = (iconName: string, family: string, size = 16, color = activeColor) => {
    if (family === 'feather') {
      return <Feather name={iconName as any} size={size} color={color} />;
    }
    if (family === 'ionicons') {
      return <Ionicons name={iconName as any} size={size} color={color} />;
    }
    return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />;
  };

  // Get current live value from conditions if available
  const getLiveBadge = (m: WeatherMetricType): string => {
    if (!conditions) return '';
    switch (m) {
      case 'wave':
        return `${conditions.waveHeightM}m`;
      case 'wind':
        return `${conditions.windSpeedKnots}k`;
      case 'rain':
        return `${conditions.precipitationMm}mm`;
      case 'temp':
        return `${conditions.seaTempC}°`;
      case 'pressure':
        return `${conditions.surfacePressureHpa}`;
      case 'visibility':
        return `${conditions.visibilityNm}NM`;
      case 'current':
        return `${conditions.tidalCurrentKnots}k`;
      case 'period':
        return `${conditions.wavePeriodS}s`;
      case 'humidity':
        return `${conditions.relativeHumidity ?? 74}%`;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      {/* 1. Header with Title & Live Status */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.metricIconWrap, { backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.08)' }]}>
            {renderIcon(config.icon, config.iconFamily, 18, activeColor)}
          </View>
          <View>
            <Text style={[styles.chartTitle, { color: colors.text }]}>{config.title}</Text>
            <Text style={[styles.chartSub, { color: colors.textSecondary }]}>
              36-Hour Predictive Telemetry Curve
            </Text>
          </View>
        </View>

        <View style={[styles.liveIndicatorPill, isLight && { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' }]}>
          <View style={styles.livePulseDot} />
          <Text style={[styles.liveIndicatorText, isLight && { color: '#16A34A' }]}>LIVE FORECAST</Text>
        </View>
      </View>

      {/* 2. Interactive Metric Tabs Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScroll}
        style={styles.tabsContainer}
      >
        {(Object.keys(WEATHER_METRICS) as WeatherMetricType[]).map((metricKey) => {
          const isSelected = selectedMetric === metricKey;
          const met = WEATHER_METRICS[metricKey];
          const tabColor = isLight ? met.colorLight : met.colorDark;
          const liveVal = getLiveBadge(metricKey);

          return (
            <TouchableOpacity
              key={metricKey}
              activeOpacity={0.75}
              style={[
                styles.tabBtn,
                {
                  backgroundColor: isSelected
                    ? isLight
                      ? '#FFFFFF'
                      : 'rgba(255, 255, 255, 0.12)'
                    : isLight
                    ? '#F8FAFC'
                    : 'rgba(255, 255, 255, 0.04)',
                  borderColor: isSelected ? tabColor : isLight ? '#E2E8F0' : colors.cardBorder,
                  borderWidth: isSelected ? 1.5 : 1,
                  shadowColor: isSelected ? tabColor : 'transparent',
                  shadowOpacity: isSelected ? 0.2 : 0,
                  shadowRadius: 6,
                  elevation: isSelected ? 2 : 0,
                },
              ]}
              onPress={() => handleSelectMetric(metricKey)}
            >
              {renderIcon(met.icon, met.iconFamily, 14, isSelected ? tabColor : colors.textMuted)}
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isSelected ? (isLight ? colors.text : '#FFFFFF') : colors.textSecondary,
                    fontWeight: isSelected ? '800' : '600',
                  },
                ]}
              >
                {met.shortLabel}
              </Text>
              {liveVal ? (
                <View
                  style={[
                    styles.tabValBadge,
                    {
                      backgroundColor: isSelected
                        ? tabColor
                        : isLight
                        ? '#E2E8F0'
                        : 'rgba(255, 255, 255, 0.08)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabValBadgeText,
                      { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {liveVal}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

        {/* Selected Point Telemetry HUD Bar */}
        {(() => {
          const isDecimalMetric =
            selectedMetric === 'wave' ||
            selectedMetric === 'rain' ||
            selectedMetric === 'visibility' ||
            selectedMetric === 'current' ||
            selectedMetric === 'period';
          return (
            <View
              style={[
                styles.telemetryHud,
                {
                  backgroundColor: isLight ? '#F8FAFC' : 'rgba(0, 0, 0, 0.25)',
                  borderColor: isLight ? '#E2E8F0' : colors.divider,
                },
              ]}
            >
              <View style={styles.hudLeft}>
                <Text style={[styles.hudTime, { color: colors.textSecondary }]}>
                  {activePoint?.time || 'Now'} ({activePoint?.isoTime ? activePoint.isoTime.slice(11, 16) : 'Current'} UTC)
                </Text>
                <View style={styles.hudValRow}>
                  <Text style={[styles.hudLargeVal, { color: activeColor }]}>
                    {typeof activePoint?.value === 'number'
                      ? isDecimalMetric
                        ? activePoint.value.toFixed(1)
                        : Math.round(activePoint.value)
                      : 0}
                  </Text>
                  <Text style={[styles.hudUnit, { color: colors.textSecondary }]}>
                    {config.unit}
                  </Text>
                  {activePoint?.secondaryValue ? (
                    <View style={[styles.gustPill, isLight && { backgroundColor: '#FEF3C7' }]}>
                      <Feather name="zap" size={11} color="#D97706" />
                      <Text style={[styles.gustPillText, isLight && { color: '#B45309' }]}>
                        Gusts {activePoint.secondaryValue} kts
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Min / Max / Avg Trio */}
              <View style={styles.hudStatsGroup}>
                <View style={styles.hudStatItem}>
                  <Text style={[styles.hudStatLabel, { color: colors.textMuted }]}>MAX</Text>
                  <Text style={[styles.hudStatNum, { color: '#EF4444' }]}>
                    {maxVal.toFixed(isDecimalMetric ? 1 : 0)}
                    {config.unit}
                  </Text>
                </View>
                <View style={styles.hudStatItem}>
                  <Text style={[styles.hudStatLabel, { color: colors.textMuted }]}>AVG</Text>
                  <Text style={[styles.hudStatNum, { color: colors.text }]}>
                    {avgVal.toFixed(isDecimalMetric ? 1 : 0)}
                    {config.unit}
                  </Text>
                </View>
                <View style={styles.hudStatItem}>
                  <Text style={[styles.hudStatLabel, { color: colors.textMuted }]}>MIN</Text>
                  <Text style={[styles.hudStatNum, { color: '#10B981' }]}>
                    {minVal.toFixed(isDecimalMetric ? 1 : 0)}
                    {config.unit}
                  </Text>
                </View>
              </View>
            </View>
          );
        })()}

      {/* 4. Scrollable Animated SVG Chart */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 40 }}
        style={styles.chartScroll}
      >
        <Animated.View style={{ opacity: chartAnim, transform: [{ scaleY: chartAnim }] }}>
          <Svg width={chartWidth} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id="weatherAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={activeColor} stopOpacity="0.45" />
                <Stop offset="70%" stopColor={activeColor} stopOpacity="0.12" />
                <Stop offset="100%" stopColor={activeColor} stopOpacity="0.0" />
              </LinearGradient>
              <LinearGradient id="gustAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#EA580C" stopOpacity="0.25" />
                <Stop offset="100%" stopColor="#EA580C" stopOpacity="0.0" />
              </LinearGradient>
            </Defs>

            {/* Horizontal Grid & Threshold Lines */}
            {config.cautionThreshold && config.cautionThreshold <= maxVal && (
              <>
                <Line
                  x1={PADDING_LEFT}
                  y1={getY(config.cautionThreshold)}
                  x2={chartWidth}
                  y2={getY(config.cautionThreshold)}
                  stroke="#F59E0B"
                  strokeWidth="1"
                  strokeDasharray="4, 4"
                  strokeOpacity="0.6"
                />
                <SvgText
                  x={PADDING_LEFT}
                  y={getY(config.cautionThreshold) - 4}
                  fill="#F59E0B"
                  fontSize="9"
                  fontWeight="bold"
                >
                  {config.cautionLabel || `Caution ${config.cautionThreshold}${config.unit}`}
                </SvgText>
              </>
            )}

            {config.dangerThreshold && config.dangerThreshold <= maxVal && (
              <>
                <Line
                  x1={PADDING_LEFT}
                  y1={getY(config.dangerThreshold)}
                  x2={chartWidth}
                  y2={getY(config.dangerThreshold)}
                  stroke="#EF4444"
                  strokeWidth="1"
                  strokeDasharray="5, 3"
                  strokeOpacity="0.8"
                />
                <SvgText
                  x={PADDING_LEFT}
                  y={getY(config.dangerThreshold) - 4}
                  fill="#EF4444"
                  fontSize="9"
                  fontWeight="bold"
                >
                  {config.dangerLabel || `Danger ${config.dangerThreshold}${config.unit}`}
                </SvgText>
              </>
            )}

            {/* Vertical Time Lines */}
            {svgPoints.map((pt, i) => {
              const isSelected = i === selectedPointIndex;
              return (
                <Line
                  key={`vLine-${i}`}
                  x1={pt.x}
                  y1={PADDING_TOP}
                  x2={pt.x}
                  y2={PADDING_TOP + plotHeight}
                  stroke={isSelected ? activeColor : isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.06)'}
                  strokeWidth={isSelected ? '1.5' : '1'}
                  strokeDasharray={isSelected ? undefined : '2, 4'}
                />
              );
            })}

            {/* Secondary Curve (Gusts for Wind) */}
            {secondaryCurvePathD ? (
              <Path
                d={secondaryCurvePathD}
                fill="none"
                stroke="#EA580C"
                strokeWidth="1.5"
                strokeDasharray="4, 3"
                opacity={0.8}
              />
            ) : null}

            {/* Area Fill Under Curve */}
            {areaPathD ? (
              <Path d={areaPathD} fill="url(#weatherAreaGrad)" />
            ) : null}

            {/* Main Primary Spline Line */}
            {curvePathD ? (
              <Path
                d={curvePathD}
                fill="none"
                stroke={activeColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {/* Data Circles & Touch Targets */}
            {svgPoints.map((pt, i) => {
              const isSelected = i === selectedPointIndex;
              const isPeak = i === peakIdx;

              return (
                <React.Fragment key={`dot-${i}`}>
                  {/* Outer circle for peak point */}
                  {isPeak && !isSelected && (
                    <Circle
                      cx={pt.x}
                      cy={pt.y}
                      r="6"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Main data point circle */}
                  <Circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? '6' : '3.5'}
                    fill={isSelected ? '#FFFFFF' : activeColor}
                    stroke={isSelected ? activeColor : isLight ? '#FFFFFF' : '#031422'}
                    strokeWidth={isSelected ? '2.5' : '1'}
                  />

                  {/* Hour text label at bottom */}
                  <SvgText
                    x={pt.x}
                    y={PADDING_TOP + plotHeight + 18}
                    fill={isSelected ? (isLight ? '#0F172A' : '#FFFFFF') : colors.textMuted}
                    fontSize={isSelected ? '10' : '9'}
                    fontWeight={isSelected ? 'bold' : 'normal'}
                    textAnchor="middle"
                  >
                    {pt.item.time.replace('Tomorrow ', 'T+')}
                  </SvgText>

                  {/* Value label directly above point for key indices */}
                  {(i % 2 === 0 || isSelected || isPeak) && (
                    <SvgText
                      x={pt.x}
                      y={pt.y - 8}
                      fill={isSelected ? activeColor : isLight ? '#334155' : '#94A3B8'}
                      fontSize="9"
                      fontWeight={isSelected || isPeak ? 'bold' : 'normal'}
                      textAnchor="middle"
                    >
                      {pt.item.value}
                    </SvgText>
                  )}
                </React.Fragment>
              );
            })}

            {/* Selected Active Cursor Highlight Line */}
            <Line
              x1={activeX}
              y1={PADDING_TOP - 6}
              x2={activeX}
              y2={PADDING_TOP + plotHeight + 4}
              stroke={activeColor}
              strokeWidth="2"
            />
            <Circle
              cx={activeX}
              cy={activeY}
              r="7"
              fill={activeColor}
              stroke="#FFFFFF"
              strokeWidth="2"
            />
          </Svg>
        </Animated.View>
      </ScrollView>

      {/* 5. Horizontal Touch Scrubbing Bar */}
      <View style={styles.scrubberRow}>
        <Text style={[styles.scrubberHint, { color: colors.textMuted }]}>
          👆 Tap any hour along timeline to inspect predictive telemetry
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.touchButtonsTrack}
        >
          {parsedItems.map((item, idx) => {
            const isSelected = idx === selectedPointIndex;
            return (
              <TouchableOpacity
                key={`btn-${idx}`}
                activeOpacity={0.7}
                style={[
                  styles.scrubChip,
                  {
                    backgroundColor: isSelected
                      ? activeColor
                      : isLight
                      ? '#F1F5F9'
                      : 'rgba(255, 255, 255, 0.06)',
                    borderColor: isSelected ? activeColor : isLight ? '#CBD5E1' : colors.divider,
                  },
                ]}
                onPress={() => setSelectedPointIndex(idx)}
              >
                <Text
                  style={[
                    styles.scrubChipText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.text,
                      fontWeight: isSelected ? 'bold' : 'normal',
                    },
                  ]}
                >
                  {item.time.replace('Tomorrow ', '+1d ')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

/**
 * Compact Animated SVG Sparkline for Grid Cards
 * Embeds right inside Ocean & Sea Conditions cards
 * Features live pulsing radar beacon on latest data point and smooth Bezier curve
 */
export function MiniWeatherSparkline({
  data,
  color,
  height = 32,
  width = 96,
  isActive = false,
}: {
  data: number[];
  color: string;
  height?: number;
  width?: number;
  isActive?: boolean;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [data]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 2.2,
            duration: 1600,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 1600,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.75,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim, pulseOpacity]);

  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 4;
  const w = width - padding * 2;
  const h = height - padding * 2;

  const pts = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * w;
    const y = padding + h - ((val - min) / range) * h;
    return { x, y };
  });

  let pathD = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const midX = (prev.x + curr.x) / 2;
    pathD += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  const lastPt = pts[pts.length - 1];
  const areaD = `${pathD} L ${lastPt.x} ${height} L ${pts[0].x} ${height} Z`;
  const gradKey = `miniGrad_${color.replace('#', '')}_${Math.round(height)}_${Math.round(width)}`;

  return (
    <Animated.View style={{ opacity: anim, height, width, position: 'relative' }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gradKey} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity={isActive ? 0.5 : 0.28} />
            <Stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>
        <Path d={areaD} fill={`url(#${gradKey})`} />
        <Path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={isActive ? 2.2 : 1.8}
          strokeLinecap="round"
        />
        <Circle cx={lastPt.x} cy={lastPt.y} r={isActive ? 3.0 : 2.4} fill={color} />
      </Svg>

      {/* Pulsing radar beacon around the latest point */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: Math.max(0, lastPt.x - 7),
          top: Math.max(0, lastPt.y - 7),
          width: 14,
          height: 14,
          borderRadius: 7,
          borderWidth: 1.5,
          borderColor: color,
          opacity: pulseOpacity,
          transform: [{ scale: pulseAnim }],
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1.5,
    paddingTop: 16,
    paddingBottom: 14,
    marginBottom: 16,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  chartSub: {
    fontSize: 10,
    marginTop: 1,
  },
  liveIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  liveIndicatorText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#22C55E',
    letterSpacing: 0.5,
  },

  // Tabs
  tabsContainer: {
    marginBottom: 12,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  tabLabel: {
    fontSize: 12,
  },
  tabValBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tabValBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },

  // Telemetry HUD Bar
  telemetryHud: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hudLeft: {
    gap: 2,
  },
  hudTime: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  hudValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  hudLargeVal: {
    fontSize: 24,
    fontWeight: '900',
  },
  hudUnit: {
    fontSize: 12,
    fontWeight: '700',
  },
  gustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 6,
  },
  gustPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
  },
  hudStatsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hudStatItem: {
    alignItems: 'center',
  },
  hudStatLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  hudStatNum: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },

  // Chart Canvas
  chartScroll: {
    marginBottom: 10,
  },

  // Scrubber
  scrubberRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  scrubberHint: {
    fontSize: 9,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  touchButtonsTrack: {
    gap: 6,
    paddingVertical: 2,
  },
  scrubChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  scrubChipText: {
    fontSize: 10,
  },
});
