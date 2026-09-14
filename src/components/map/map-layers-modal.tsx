import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapStyleId } from '@/components/map/map-style-selector';
import { MapOverlaysState } from '@/components/map/native-map-view';
import { MapColors } from '@/constants/map-theme';

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

const MAP_STYLES: {
  id: MapStyleId;
  name: string;
  desc: string;
  icon: 'map' | 'earth' | 'compass' | 'moon';
  color: string;
}[] = [
    {
      id: 'standard',
      name: 'Standard Chart',
      desc: 'Crisp vector coastal and street geography',
      icon: 'map',
      color: '#0284C7',
    },
    {
      id: 'satellite',
      name: 'Satellite View',
      desc: 'High-res ArcGIS oceanic & reef satellite imagery',
      icon: 'earth',
      color: '#10B981',
    },
    {
      id: 'marine',
      name: 'Marine Nautical',
      desc: 'Voyager oceanic contrast with shallow depth bands',
      icon: 'compass',
      color: '#3B82F6',
    },
    {
      id: 'night',
      name: 'Night Navigation',
      desc: 'Darkened palette to preserve ship night vision',
      icon: 'moon',
      color: '#8B5CF6',
    },
  ];

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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouch} onPress={onClose} />
        <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, 20) + 12 }]}>
          {/* Header */}
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="layers" size={20} color="#00F0FF" />
              </View>
              <View>
                <Text style={styles.title}>Map Layers & Nautical Details</Text>
                <Text style={styles.subtitle}>Base chart styles & marine overlays</Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </Pressable>
          </View>

          {/* Section: Base Map Styles */}
          <Text style={styles.sectionLabel}>MAP TYPE</Text>
          <View style={styles.stylesGrid}>
            {MAP_STYLES.map((item) => {
              const selected = item.id === activeStyle;
              return (
                <Pressable
                  key={item.id}
                  style={[styles.styleCard, selected && styles.styleCardSelected]}
                  onPress={() => onSelectStyle(item.id)}>
                  <View style={[styles.styleIconWrap, { backgroundColor: item.color + '22' }]}>
                    <Ionicons name={item.icon} size={22} color={item.color} />
                  </View>
                  <View style={styles.styleContent}>
                    <View style={styles.styleNameRow}>
                      <Text style={[styles.styleName, selected && styles.styleNameSelected]}>
                        {item.name}
                      </Text>
                      {selected ? (
                        <Ionicons name="checkmark-circle" size={16} color={MapColors.accent} />
                      ) : null}
                    </View>
                    <Text style={styles.styleDesc} numberOfLines={1}>
                      {item.desc}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Section: Nautical Overlays */}
          <Text style={[styles.sectionLabel, { marginTop: 18 }]}>MARINE OVERLAYS</Text>
          <View style={styles.togglesList}>
            <ToggleRow
              icon={<MaterialCommunityIcons name="lighthouse" size={20} color="#38BDF8" />}
              title="OpenSeaMap Seamarks"
              subtitle="Buoys, beacons, navigation lights, harbor signals"
              value={overlays.seamarks}
              onValueChange={() => onToggleOverlay('seamarks')}
            />
            <View style={styles.divider} />
            <ToggleRow
              icon={<Ionicons name="warning-outline" size={20} color={MapColors.red} />}
              title="Maritime Danger Zones"
              subtitle="Underwater obstructions, sandbars & restricted reefs"
              value={overlays.dangerZone}
              onValueChange={() => onToggleOverlay('dangerZone')}
            />
            <View style={styles.divider} />
            <ToggleRow
              icon={<Ionicons name="speedometer-outline" size={20} color={MapColors.green} />}
              title="Marine GPS Instrument Card"
              subtitle="Live Coordinates, accuracy & GPS telemetry"
              value={showGpsHud}
              onValueChange={onToggleGpsHud}
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
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: () => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleIcon}>{icon}</View>
      <View style={styles.toggleText}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#00F0FF' }}
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
    ...StyleSheet.absoluteFillObject,
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
