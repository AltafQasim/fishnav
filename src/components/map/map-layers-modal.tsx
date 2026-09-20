import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapStyleId } from '@/components/map/map-style-selector';
import { MapOverlaysState } from '@/components/map/native-map-view';
import { MapColors } from '@/constants/map-theme';
import { useLanguage } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';

type MapLayersModalProps = {
  visible: boolean;
  activeStyle: MapStyleId;
  overlays: MapOverlaysState;
  showGpsHud: boolean;
  onClose: () => void;
  onSelectStyle: (style: MapStyleId) => void;
  onToggleOverlay: (key: keyof MapOverlaysState) => void;
  onToggleGpsHud: () => void;
};

export function MapLayersModal({
  visible,
  activeStyle,
  overlays,
  showGpsHud,
  onClose,
  onSelectStyle,
  onToggleOverlay,
  onToggleGpsHud,
}: MapLayersModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isLight } = useAppTheme();
  const { t } = useLanguage();

  const mapStyles = useMemo(
    () => [
      {
        id: 'google' as MapStyleId,
        name: t('style.standard', 'Standard Chart'),
        desc: t('style.standard.desc', 'Clear coastal geography, roads, harbors & marine landmarks'),
        icon: 'map' as const,
        color: '#0284C7',
      },
      {
        id: 'satellite' as MapStyleId,
        name: t('style.satellite', 'Satellite View'),
        desc: t('style.satellite.desc', 'High-resolution aerial satellite imagery, coral reefs & shallow sandbars'),
        icon: 'earth' as const,
        color: '#10B981',
      },
      {
        id: 'standard' as MapStyleId,
        name: t('style.vector', 'Nautical Vector Chart'),
        desc: t('style.vector.desc', 'Detailed coastal vectors, shoreline docks & depth contours'),
        icon: 'compass' as const,
        color: '#6366F1',
      },
    ],
    [t],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouch} onPress={onClose} />
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
              paddingBottom: Math.max(insets.bottom, 20) + 12,
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.handle,
              { backgroundColor: isLight ? '#CBD5E1' : 'rgba(255, 255, 255, 0.3)' },
            ]}
          />
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.iconBg }]}>
                <Ionicons name="layers" size={20} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>
                  {t('map.layers.title', 'Map Layers & Nautical Details')}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {t('map.layers.subtitle', 'Base chart styles & marine overlays')}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={[styles.closeBtn, { backgroundColor: colors.chipBg }]}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Section: Base Map Styles */}
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            {t('map.type', 'MAP TYPE')}
          </Text>
          <View style={styles.stylesGrid}>
            {mapStyles.map((item) => {
              const selected = item.id === activeStyle;
              return (
                <Pressable
                  key={item.id}
                  style={[
                    styles.styleCard,
                    {
                      backgroundColor: selected
                        ? colors.chipBg
                        : isLight
                          ? '#F8FAFC'
                          : 'rgba(10, 31, 53, 0.75)',
                      borderColor: selected ? colors.accent : colors.divider,
                    },
                    selected && { borderWidth: 1.5 },
                  ]}
                  onPress={() => onSelectStyle(item.id)}>
                  <View style={[styles.styleIconWrap, { backgroundColor: item.color + '22' }]}>
                    <Ionicons name={item.icon} size={22} color={item.color} />
                  </View>
                  <View style={styles.styleContent}>
                    <View style={styles.styleNameRow}>
                      <Text
                        style={[
                          styles.styleName,
                          { color: selected ? colors.accent : colors.text },
                          selected && { fontWeight: '700' },
                        ]}>
                        {item.name}
                      </Text>
                      {selected ? (
                        <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
                      ) : null}
                    </View>
                    <Text style={[styles.styleDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.desc}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Section: Nautical Overlays */}
          <Text style={[styles.sectionLabel, { marginTop: 18, color: colors.textMuted }]}>
            {t('map.overlays', 'MARINE OVERLAYS')}
          </Text>
          <View
            style={[
              styles.togglesList,
              {
                backgroundColor: isLight ? '#F8FAFC' : 'rgba(255, 255, 255, 0.04)',
                borderColor: colors.divider,
              },
            ]}
          >
            <ToggleRow
              icon={<MaterialCommunityIcons name="lighthouse" size={20} color="#38BDF8" />}
              title={t('overlay.seamarks', 'OpenSeaMap Seamarks')}
              subtitle={t('overlay.seamarks.desc', 'Buoys, beacons, navigation lights, harbor signals')}
              value={overlays.seamarks}
              onValueChange={() => onToggleOverlay('seamarks')}
              textColor={colors.text}
              subColor={colors.textSecondary}
              trackColorActive={colors.accent}
              trackColorInactive={isLight ? '#E2E8F0' : 'rgba(255,255,255,0.15)'}
              iconBg={colors.chipBg}
            />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <ToggleRow
              icon={<Ionicons name="warning-outline" size={20} color={MapColors.red} />}
              title={t('overlay.danger', 'Maritime Danger Zones')}
              subtitle={t('overlay.danger.desc', 'Underwater obstructions, sandbars & restricted reefs')}
              value={overlays.dangerZone}
              onValueChange={() => onToggleOverlay('dangerZone')}
              textColor={colors.text}
              subColor={colors.textSecondary}
              trackColorActive={colors.accent}
              trackColorInactive={isLight ? '#E2E8F0' : 'rgba(255,255,255,0.15)'}
              iconBg={colors.chipBg}
            />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <ToggleRow
              icon={<Ionicons name="speedometer-outline" size={20} color={MapColors.green} />}
              title={t('overlay.gps', 'Marine GPS Instrument Card')}
              subtitle={t('overlay.gps.desc', 'Live Coordinates, accuracy & GPS telemetry')}
              value={showGpsHud}
              onValueChange={onToggleGpsHud}
              textColor={colors.text}
              subColor={colors.textSecondary}
              trackColorActive={colors.accent}
              trackColorInactive={isLight ? '#E2E8F0' : 'rgba(255,255,255,0.15)'}
              iconBg={colors.chipBg}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  textColor,
  subColor,
  trackColorActive,
  trackColorInactive,
  iconBg,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: () => void;
  textColor: string;
  subColor: string;
  trackColorActive: string;
  trackColorInactive: string;
  iconBg: string;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={[styles.toggleIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={styles.toggleText}>
        <Text style={[styles.toggleTitle, { color: textColor }]}>{title}</Text>
        <Text style={[styles.toggleSubtitle, { color: subColor }]}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: trackColorInactive, true: trackColorActive }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 8, 16, 0.75)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    backgroundColor: '#041728',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -8 },
    elevation: 24,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    color: MapColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  stylesGrid: {
    gap: 8,
  },
  styleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: MapColors.navyGlass,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  styleCardSelected: {
    backgroundColor: 'rgba(2, 132, 199, 0.22)',
    borderColor: '#00F0FF',
    borderWidth: 1.5,
  },
  styleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleContent: {
    flex: 1,
  },
  styleNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  styleName: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  styleNameSelected: {
    color: '#00F0FF',
    fontWeight: '700',
  },
  styleDesc: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  togglesList: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    paddingVertical: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  toggleIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    flex: 1,
  },
  toggleTitle: {
    color: MapColors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  toggleSubtitle: {
    color: MapColors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginLeft: 58,
  },
});
