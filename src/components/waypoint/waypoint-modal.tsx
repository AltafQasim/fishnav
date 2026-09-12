import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import { UserLocation } from '@/hooks/use-user-location';

type WaypointModalProps = {
  visible: boolean;
  spotToEdit: FishingSpot | null;
  userLocation: UserLocation | null;
  onClose: () => void;
  onSave: (spotData: Omit<FishingSpot, 'id'>, editId?: string) => Promise<void>;
};

const COLOR_OPTIONS = [
  MapColors.yellow,
  MapColors.pink,
  MapColors.purple,
  MapColors.green,
  MapColors.accent,
  MapColors.red,
];

const CATEGORIES = [
  'Ghol',
  'Tuna',
  'King Fish',
  'Pomfret',
  'Coral Reef',
  'Shipwreck',
  'Harbor',
  'Hotspot',
];

export function WaypointModal({
  visible,
  spotToEdit,
  userLocation,
  onClose,
  onSave,
}: WaypointModalProps) {
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [latStr, setLatStr] = useState('');
  const [lngStr, setLngStr] = useState('');
  const [depthStr, setDepthStr] = useState('50');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (spotToEdit) {
        setName(spotToEdit.name);
        setLatStr(spotToEdit.latitude.toFixed(4));
        setLngStr(spotToEdit.longitude.toFixed(4));
        setDepthStr(String(spotToEdit.depthM));
        setCategory(spotToEdit.category || CATEGORIES[0]);
        setColor(spotToEdit.color || COLOR_OPTIONS[0]);
        setNotes(spotToEdit.notes || '');
      } else {
        setName('');
        if (userLocation) {
          setLatStr(userLocation.latitude.toFixed(4));
          setLngStr(userLocation.longitude.toFixed(4));
        } else {
          setLatStr('20.3500');
          setLngStr('70.8200');
        }
        setDepthStr('50');
        setCategory(CATEGORIES[0]);
        setColor(COLOR_OPTIONS[0]);
        setNotes('');
      }
    }
  }, [visible, spotToEdit, userLocation]);

  const handleUseCurrentGps = () => {
    if (userLocation) {
      setLatStr(userLocation.latitude.toFixed(4));
      setLngStr(userLocation.longitude.toFixed(4));
    } else {
      Alert.alert('GPS Unavailable', 'Current GPS location is not available yet.');
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Validation Error', 'Please enter a waypoint name.');
      return;
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const depth = parseInt(depthStr, 10) || 40;

    if (isNaN(lat) || lat < -90 || lat > 90) {
      Alert.alert('Validation Error', 'Please enter a valid Latitude between -90 and 90.');
      return;
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      Alert.alert('Validation Error', 'Please enter a valid Longitude between -180 and 180.');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(
        {
          name: trimmedName,
          latitude: lat,
          longitude: lng,
          depthM: depth,
          color,
          category,
          notes: notes.trim() || undefined,
          favorite: spotToEdit ? spotToEdit.favorite : true,
        },
        spotToEdit?.id,
      );
      onClose();
    } catch (err) {
      Alert.alert('Error', 'Failed to save waypoint. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropTouch} onPress={onClose} />

        <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, 20) + 8 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>
                {spotToEdit ? 'Edit Waypoint' : 'Add New Waypoint'}
              </Text>
              <Text style={styles.headerSub}>
                {spotToEdit ? 'Update GPS coords & marine details' : 'Save coastal hotspot to marine logs'}
              </Text>
            </View>

            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={MapColors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
            {/* Waypoint Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>WAYPOINT NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Ghol Spot Alpha, Deep Reef"
                placeholderTextColor={MapColors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* GPS Coordinates Header & Autofill */}
            <View style={styles.fieldGroup}>
              <View style={styles.coordLabelRow}>
                <Text style={styles.label}>GPS COORDINATES</Text>
                <Pressable
                  style={styles.useGpsBtn}
                  onPress={handleUseCurrentGps}
                  accessibilityRole="button"
                >
                  <Ionicons name="locate" size={13} color="#38BDF8" />
                  <Text style={styles.useGpsText}>Use Current GPS</Text>
                </Pressable>
              </View>

              <View style={styles.coordsRow}>
                <View style={styles.coordCol}>
                  <Text style={styles.coordSub}>Latitude (°N/S)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="20.3500"
                    placeholderTextColor={MapColors.textMuted}
                    keyboardType="numeric"
                    value={latStr}
                    onChangeText={setLatStr}
                  />
                </View>

                <View style={styles.coordCol}>
                  <Text style={styles.coordSub}>Longitude (°E/W)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="70.8200"
                    placeholderTextColor={MapColors.textMuted}
                    keyboardType="numeric"
                    value={lngStr}
                    onChangeText={setLngStr}
                  />
                </View>
              </View>
            </View>

            {/* Depth & Category */}
            <View style={styles.coordsRow}>
              <View style={styles.coordCol}>
                <Text style={styles.label}>DEPTH (METERS)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 65"
                  placeholderTextColor={MapColors.textMuted}
                  keyboardType="numeric"
                  value={depthStr}
                  onChangeText={setDepthStr}
                />
              </View>

              <View style={styles.coordCol}>
                <Text style={styles.label}>COLOR TAG</Text>
                <View style={styles.colorPalette}>
                  {COLOR_OPTIONS.map((c) => (
                    <Pressable
                      key={c}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: c },
                        color === c && styles.colorCircleActive,
                      ]}
                      onPress={() => setColor(c)}
                    />
                  ))}
                </View>
              </View>
            </View>

            {/* Category Pills */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>CATEGORY / SPECIES</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll}>
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <Pressable
                      key={cat}
                      style={[styles.tagPill, isSelected && styles.tagPillActive]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text style={[styles.tagText, isSelected && styles.tagTextActive]}>
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Notes */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>NOTES & CATCH LOGS (OPTIONAL)</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="e.g. Best during high tide, rock bottom"
                placeholderTextColor={MapColors.textMuted}
                multiline
                numberOfLines={2}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </ScrollView>

          {/* Save Button */}
          <View style={styles.footerRow}>
            <Pressable style={styles.cancelBtn} onPress={onClose} disabled={isSaving}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              <Text style={styles.saveText}>{isSaving ? 'Saving...' : 'Save Waypoint'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  modalCard: {
    backgroundColor: MapColors.navyPanel,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSub: {
    color: MapColors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formScroll: {
    marginVertical: 14,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    color: MapColors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  coordLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  useGpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  useGpsText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  coordsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  coordCol: {
    flex: 1,
  },
  coordSub: {
    color: MapColors.textMuted,
    fontSize: 11,
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },
  notesInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  colorPalette: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 6,
  },
  colorCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  colorCircleActive: {
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  tagScroll: {
    flexDirection: 'row',
    marginTop: 4,
  },
  tagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tagPillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderColor: '#38BDF8',
  },
  tagText: {
    color: MapColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  tagTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  cancelText: {
    color: MapColors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#0284C7',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
