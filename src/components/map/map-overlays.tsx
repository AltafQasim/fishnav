import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

import { MapColors } from '@/constants/map-theme';
import {
  formatAccuracy,
  formatLatitude,
  formatLongitude,
  LocationStatus,
  UserLocation,
} from '@/hooks/use-user-location';

type GpsInfoCardProps = {
  status: LocationStatus;
  location: UserLocation | null;
  onRequestPermission?: () => void;
};

export function GpsInfoCard({ status, location, onRequestPermission }: GpsInfoCardProps) {
  const connected = status === 'granted' && !!location;
  const accuracyLabel = connected ? formatAccuracy(location.accuracy) : '—';

  let statusText = 'Waiting for GPS…';
  if (status === 'requesting') statusText = 'Requesting GPS…';
  if (status === 'denied') statusText = 'GPS Denied — Tap to enable';
  if (status === 'disabled') statusText = 'Location Off — Tap for settings';
  if (status === 'error') statusText = 'GPS error — Tap to retry';
  if (connected) statusText = `GPS Fix: ${accuracyLabel}`;

  return (
    <Pressable
      style={styles.gpsCard}
      onPress={!connected ? onRequestPermission : undefined}
      disabled={connected}>
      <View style={styles.gpsTop}>
        <View style={[styles.dot, !connected && styles.dotWarn]} />
        <Text style={styles.gpsAccuracy} numberOfLines={1}>{statusText}</Text>
      </View>
      {connected ? (
        <>
          <Text style={styles.coords}>{formatLatitude(location.latitude)}</Text>
          <Text style={styles.coords}>{formatLongitude(location.longitude)}</Text>
        </>
      ) : (
        <Text style={styles.coords}>Lat / Long acquiring…</Text>
      )}
    </Pressable>
  );
}

type CompassWidgetProps = {
  heading?: number | null;
  onResetNorth?: () => void;
};

export function CompassWidget({ heading = 0, onResetNorth }: CompassWidgetProps) {
  const rotation = Number.isFinite(heading) ? -(heading ?? 0) : 0;

  return (
    <Pressable onPress={onResetNorth} hitSlop={8} style={styles.compassWrap}>
      <Svg width={68} height={68} viewBox="0 0 72 72">
        <Circle
          cx="36"
          cy="36"
          r="34"
          fill="rgba(8, 28, 48, 0.9)"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="2"
        />
        <Circle cx="36" cy="36" r="26" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        <G transform={`rotate(${rotation} 36 36)`}>
          <Path d="M36 12 L40 36 L36 32 L32 36 Z" fill={MapColors.red} />
          <Path d="M36 60 L40 36 L36 40 L32 36 Z" fill="#E8EEF5" />
        </G>
        <Line x1="36" y1="8" x2="36" y2="14" stroke="#fff" strokeWidth="1.5" />
        <Line x1="36" y1="58" x2="36" y2="64" stroke="#fff" strokeWidth="1.5" />
        <Line x1="8" y1="36" x2="14" y2="36" stroke="#fff" strokeWidth="1.5" />
        <Line x1="58" y1="36" x2="64" y2="36" stroke="#fff" strokeWidth="1.5" />
        <SvgText x="33" y="20" fill={MapColors.red} fontSize="9" fontWeight="700">
          N
        </SvgText>
      </Svg>
    </Pressable>
  );
}

type MapControlStackProps = {
  headingUp?: boolean;
  followUser?: boolean;
  measurementActive?: boolean;
  isTracking?: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  onHeading: () => void;
  onToggleMeasure?: () => void;
  onAddSpot?: () => void;
  onToggleTrack?: () => void;
};

export function MapControlStack({
  headingUp = false,
  followUser = true,
  measurementActive = false,
  isTracking = false,
  onZoomIn,
  onZoomOut,
  onLocate,
  onHeading,
  onToggleMeasure,
  onAddSpot,
  onToggleTrack,
}: MapControlStackProps) {
  return (
    <View style={styles.controlStack}>
      {/* 🔴 Track Recording Action Button */}
      {onToggleTrack && (
        <View style={styles.btnGroup}>
          <Pressable
            style={[styles.toolBtn, isTracking && styles.toolBtnRecording]}
            onPress={onToggleTrack}>
            <MaterialCommunityIcons
              name={isTracking ? 'record-circle' : 'record-circle-outline'}
              size={22}
              color={isTracking ? '#EF4444' : '#00F0FF'}
            />
          </Pressable>
        </View>
      )}

      {/* Zoom In & Out */}
      <View style={styles.btnGroup}>
        <Pressable style={styles.toolBtn} onPress={onZoomIn}>
          <Ionicons name="add" size={22} color={MapColors.text} />
        </Pressable>
        <View style={styles.divider} />
        <Pressable style={styles.toolBtn} onPress={onZoomOut}>
          <Ionicons name="remove" size={22} color={MapColors.text} />
        </Pressable>
      </View>

      {/* Tools: Measure & Add Spot (only rendered if handlers passed) */}
      {(onToggleMeasure || onAddSpot) && (
        <View style={styles.btnGroup}>
          {onToggleMeasure && (
            <Pressable
              style={[styles.toolBtn, measurementActive && styles.toolBtnActive]}
              onPress={onToggleMeasure}>
              <MaterialCommunityIcons
                name="ruler"
                size={20}
                color={measurementActive ? '#FFFFFF' : '#F59E0B'}
              />
            </Pressable>
          )}
          {onToggleMeasure && onAddSpot && <View style={styles.divider} />}
          {onAddSpot && (
            <Pressable style={styles.toolBtn} onPress={onAddSpot}>
              <Ionicons name="add-circle" size={20} color={MapColors.green} />
            </Pressable>
          )}
        </View>
      )}

      {/* Navigation & Location Center */}
      <View style={styles.btnGroup}>
        <Pressable
          style={[styles.toolBtn, followUser && styles.toolBtnHighlight]}
          onPress={onLocate}>
          <Ionicons
            name="locate"
            size={20}
            color={followUser ? MapColors.accent : MapColors.text}
          />
        </Pressable>
        <View style={styles.divider} />
        <Pressable
          style={[styles.toolBtn, headingUp && styles.toolBtnHighlight]}
          onPress={onHeading}>
          <Ionicons
            name="navigate"
            size={18}
            color={headingUp ? MapColors.accent : MapColors.text}
          />
        </Pressable>
      </View>
    </View>
  );
}

type MeasurementBannerProps = {
  totalNm: number;
  pointsCount: number;
  onUndo: () => void;
  onClear: () => void;
  onDone: () => void;
};

export function MeasurementBanner({
  totalNm,
  pointsCount,
  onUndo,
  onClear,
  onDone,
}: MeasurementBannerProps) {
  const km = (totalNm * 1.852).toFixed(1);
  const nmStr = totalNm < 10 ? totalNm.toFixed(2) : totalNm.toFixed(1);

  return (
    <View style={styles.measureBanner}>
      <View style={styles.measureInfo}>
        <View style={styles.measureTitleRow}>
          <MaterialCommunityIcons name="ruler" size={16} color="#F59E0B" />
          <Text style={styles.measureTitle}>Nautical Ruler ({pointsCount} pts)</Text>
        </View>
        <Text style={styles.measureDist}>
          {nmStr} NM <Text style={styles.measureKm}>({km} km)</Text>
        </Text>
      </View>

      <View style={styles.measureActions}>
        <Pressable
          style={[styles.measureActionBtn, pointsCount === 0 && styles.btnDisabled]}
          onPress={onUndo}
          disabled={pointsCount === 0}>
          <Ionicons name="arrow-undo" size={16} color="#FFFFFF" />
        </Pressable>

        <Pressable style={styles.measureActionBtn} onPress={onClear}>
          <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
        </Pressable>

        <Pressable style={styles.measureDoneBtn} onPress={onDone}>
          <Text style={styles.measureDoneText}>DONE</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gpsCard: {
    backgroundColor: MapColors.navyGlass,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minWidth: 140,
    maxWidth: 200,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  gpsTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: MapColors.green,
  },
  dotWarn: {
    backgroundColor: MapColors.yellow,
  },
  gpsAccuracy: {
    color: MapColors.text,
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
  coords: {
    color: MapColors.textSecondary,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    lineHeight: 15,
  },
  compassWrap: {
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  controlStack: {
    gap: 10,
    alignItems: 'center',
  },
  btnGroup: {
    backgroundColor: MapColors.navyGlass,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  toolBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnActive: {
    backgroundColor: '#F59E0B',
  },
  toolBtnHighlight: {
    backgroundColor: 'rgba(0, 132, 255, 0.2)',
  },
  toolBtnRecording: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.14)',
    marginHorizontal: 8,
  },
  measureBanner: {
    position: 'absolute',
    bottom: 24,
    left: 12,
    right: 12,
    backgroundColor: MapColors.navyPanel,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 20,
  },
  measureInfo: {
    flex: 1,
  },
  measureTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  measureTitle: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
  },
  measureDist: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  measureKm: {
    color: MapColors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  measureActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  measureActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  measureDoneBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  measureDoneText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.4,
  },
});
