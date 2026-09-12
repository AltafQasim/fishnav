import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FishingSpot } from '@/constants/fishing-spots';
import { MapColors } from '@/constants/map-theme';

type AddSpotModalProps = {
  visible: boolean;
  initialLat?: number;
  initialLng?: number;
  onClose: () => void;
  onSave: (spot: FishingSpot) => void;
};

const COLOR_OPTIONS = [
  MapColors.yellow,
  MapColors.pink,
  MapColors.purple,
  MapColors.green,
  MapColors.accent,
  MapColors.red,
];

const SPECIES_TAGS = [
  'Ghol',
  'Tuna',
  'King Fish',
  'Pomfret',
  'Reef / Coral',
  'Shipwreck',
  'Harbor',
  'General',
];

export function AddSpotModal({
  visible,
  initialLat = 20.35,
  initialLng = 70.82,
  onClose,
  onSave,
}: AddSpotModalProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [latStr, setLatStr] = useState('');
  const [lngStr, setLngStr] = useState('');
  const [depthStr, setDepthStr] = useState('50');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [selectedTag, setSelectedTag] = useState(SPECIES_TAGS[0]);

  useEffect(() => {
    if (visible) {
      setLatStr(initialLat.toFixed(4));
      setLngStr(initialLng.toFixed(4));
      if (!name) setName(`Waypoint ${Math.floor(100 + Math.random() * 900)}`);
    }
  }, [visible, initialLat, initialLng]);

  const handleSave = () => {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const depth = parseInt(depthStr, 10) || 45;

    if (isNaN(lat) || isNaN(lng)) return;

    const newSpot: FishingSpot = {
      id: `custom_${Date.now()}`,
      name: name.trim() || `Spot (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
      latitude: lat,
      longitude: lng,
      depthM: depth,
      color: selectedColor,
      favorite: true,
    };

    onSave(newSpot);
    setName('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, 20) + 10 }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="bookmark" size={20} color={MapColors.accent} />
              <Text style={styles.title}>Save Fishing Waypoint</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={MapColors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Spot Name */}
            <Text style={styles.label}>SPOT / REEF NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Deep Ghol Hole, North Shoal..."
              placeholderTextColor={MapColors.textMuted}
              value={name}
              onChangeText={setName}
            />

            {/* Target Species / Category */}
            <Text style={[styles.label, { marginTop: 14 }]}>TARGET SPECIES / TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagScroll}>
              {SPECIES_TAGS.map((tag) => {
                const active = tag === selectedTag;
                return (
                  <Pressable
                    key={tag}
                    style={[styles.tagChip, active && styles.tagChipActive]}
                    onPress={() => {
                      setSelectedTag(tag);
                      if (!name || name.startsWith('Waypoint')) {
                        setName(`${tag} Spot`);
                      }
                    }}>
                    <Text style={[styles.tagText, active && styles.tagTextActive]}>{tag}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Coordinates Lat & Long */}
            <View style={styles.coordRow}>
              <View style={styles.coordField}>
                <Text style={styles.label}>LATITUDE</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={latStr}
                  onChangeText={setLatStr}
                />
              </View>
              <View style={styles.coordField}>
                <Text style={styles.label}>LONGITUDE</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={lngStr}
                  onChangeText={setLngStr}
                />
              </View>
            </View>

            {/* Depth */}
            <Text style={[styles.label, { marginTop: 14 }]}>WATER DEPTH (METERS)</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="Depth in meters (e.g. 60)"
              placeholderTextColor={MapColors.textMuted}
              value={depthStr}
              onChangeText={setDepthStr}
            />

            {/* Marker Color */}
            <Text style={[styles.label, { marginTop: 14 }]}>CHART PIN COLOR</Text>
            <View style={styles.colorsRow}>
              {COLOR_OPTIONS.map((c) => {
                const active = c === selectedColor;
                return (
                  <Pressable
                    key={c}
                    style={[styles.colorDot, { backgroundColor: c }, active && styles.colorDotActive]}
                    onPress={() => setSelectedColor(c)}>
                    {active ? <Ionicons name="checkmark" size={16} color="#000" /> : null}
                  </Pressable>
                );
              })}
            </View>

            {/* Save Button */}
            <Pressable style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.saveText}>SAVE TO MY SPOTS</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 8, 16, 0.72)',
    justifyContent: 'flex-end',
  },
  backdropPress: {
    flex: 1,
  },
  card: {
    backgroundColor: MapColors.navyPanel,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    gap: 8,
  },
  title: {
    color: MapColors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: MapColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  input: {
    backgroundColor: MapColors.navyGlass,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: MapColors.text,
    fontSize: 14,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tagScroll: {
    gap: 8,
  },
  tagChip: {
    backgroundColor: MapColors.navyGlass,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tagChipActive: {
    backgroundColor: MapColors.accent,
    borderColor: MapColors.accent,
  },
  tagText: {
    color: MapColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  tagTextActive: {
    color: '#FFFFFF',
  },
  coordRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  coordField: {
    flex: 1,
  },
  colorsRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  colorDotActive: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  saveBtn: {
    backgroundColor: MapColors.accent,
    borderRadius: 16,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
