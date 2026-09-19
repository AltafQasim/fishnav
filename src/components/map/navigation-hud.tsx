import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapColors } from '@/constants/map-theme';
import { useAppTheme } from '@/context/theme-context';
import { UserLocation } from '@/hooks/use-user-location';

type NavigationHudProps = {
  targetName: string;
  distanceLabel: string;
  bearingLabel: string;
  etaLabel: string;
  depthM?: number | null;
  location: UserLocation | null;
  heading?: number | null;
  onExit: () => void;
  onRecenter: () => void;
};

export function NavigationHud({
  targetName,
  distanceLabel,
  bearingLabel,
  etaLabel,
  depthM,
  location,
  heading = 0,
  onExit,
  onRecenter,
}: NavigationHudProps) {
  const insets = useSafeAreaInsets();
  const { colors, activeTheme } = useAppTheme();
  const isLight = activeTheme === 'light';

  // Speed over ground (SOG) in knots (Location speed is m/s; 1 m/s = 1.94384 knots)
  const speedKnots =
    location?.speed != null && location.speed > 0
      ? (location.speed * 1.94384).toFixed(1)
      : '0.0';

  const userHeadingDeg =
    heading != null && Number.isFinite(heading)
      ? `${Math.round(heading)}°`
      : '—';

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {/* Top Turn-by-Turn Guidance Banner */}
      <View
        style={[
          styles.topBanner,
          {
            top: insets.top + 8,
            backgroundColor: isLight ? '#059669' : '#0F2742',
            borderColor: isLight ? '#10B981' : colors.accent,
          },
        ]}>
        <View style={[styles.steerBadge, { backgroundColor: isLight ? '#047857' : colors.accent }]}>
          <MaterialCommunityIcons name="navigation-variant" size={26} color="#FFFFFF" />
          <Text style={styles.steerBearing}>{bearingLabel}</Text>
        </View>

        <View style={styles.guidanceContent}>
          <Text style={styles.guidanceTitle} numberOfLines={1}>
            Steer to {targetName}
          </Text>
          <Text style={[styles.guidanceSub, { color: isLight ? '#D1FAE5' : '#93C5FD' }]}>
            {distanceLabel} remaining • ETA {etaLabel} {depthM ? `• ${depthM}m depth` : ''}
          </Text>
        </View>

        <Pressable
          onPress={onRecenter}
          hitSlop={10}
          style={[styles.recenterBtn, { backgroundColor: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.1)' }]}>
          <Ionicons name="locate" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Bottom Marine Cockpit HUD */}
      <View
        style={[
          styles.bottomCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 14) + 6,
          },
        ]}>
        <View
          style={[
            styles.instrumentsRow,
            {
              backgroundColor: isLight ? '#F1F5F9' : colors.surfaceSubtle,
              borderColor: colors.border,
            },
          ]}>
          <InstrumentBlock label="SOG" value={`${speedKnots} kts`} sub="Speed" valColor={colors.accent} textColor={colors.textSecondary} mutedColor={colors.textMuted} />
          <View style={[styles.instDivider, { backgroundColor: colors.border }]} />
          <InstrumentBlock label="BRG" value={bearingLabel} sub="Target" valColor={colors.text} textColor={colors.textSecondary} mutedColor={colors.textMuted} />
          <View style={[styles.instDivider, { backgroundColor: colors.border }]} />
          <InstrumentBlock label="DTW" value={distanceLabel} sub="Distance" valColor={colors.text} textColor={colors.textSecondary} mutedColor={colors.textMuted} />
          <View style={[styles.instDivider, { backgroundColor: colors.border }]} />
          <InstrumentBlock label="ETA" value={etaLabel} sub="Arrival" valColor={colors.text} textColor={colors.textSecondary} mutedColor={colors.textMuted} />
        </View>

        <View style={styles.actionsRow}>
          <Pressable style={styles.stopBtn} onPress={onExit}>
            <Ionicons name="close" size={20} color="#FFFFFF" />
            <Text style={styles.stopText}>EXIT NAVIGATION</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function InstrumentBlock({
  label,
  value,
  sub,
  valColor = '#FFFFFF',
  textColor = '#94A3B8',
  mutedColor = '#64748B',
}: {
  label: string;
  value: string;
  sub: string;
  valColor?: string;
  textColor?: string;
  mutedColor?: string;
}) {
  return (
    <View style={styles.instItem}>
      <Text style={[styles.instLabel, { color: mutedColor }]}>{label}</Text>
      <Text style={[styles.instValue, { color: valColor }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.instSub, { color: textColor }]}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    justifyContent: 'space-between',
  },
  topBanner: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: '#0F2742',
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: MapColors.accent,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  steerBadge: {
    backgroundColor: MapColors.accent,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 58,
  },
  steerBearing: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  guidanceContent: {
    flex: 1,
  },
  guidanceTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  guidanceSub: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  recenterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: MapColors.navyPanel,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  instrumentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: MapColors.navyGlass,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  instItem: {
    flex: 1,
    alignItems: 'center',
  },
  instLabel: {
    color: MapColors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  instValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  instSub: {
    color: MapColors.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },
  instDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  actionsRow: {
    marginTop: 12,
  },
  stopBtn: {
    backgroundColor: '#EF4444',
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stopText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
