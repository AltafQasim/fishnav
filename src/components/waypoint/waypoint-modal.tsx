import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
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
import { useLanguage } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';
import { UserLocation } from '@/hooks/use-user-location';
import { parseCoordinates } from '@/utils/geo';

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
  { id: 'Ghol', key: 'category.ghol', fallback: 'Ghol' },
  { id: 'Tuna', key: 'category.tuna', fallback: 'Tuna' },
  { id: 'King Fish', key: 'category.king_fish', fallback: 'King Fish' },
  { id: 'Pomfret', key: 'category.pomfret', fallback: 'Pomfret' },
  { id: 'Coral Reef', key: 'category.coral_reef', fallback: 'Coral Reef' },
  { id: 'Shipwreck', key: 'category.shipwreck', fallback: 'Shipwreck' },
  { id: 'Harbor', key: 'category.harbor', fallback: 'Harbor' },
  { id: 'Hotspot', key: 'category.hotspot', fallback: 'Hotspot' },
];

export function WaypointModal({
  visible,
  spotToEdit,
  userLocation,
  onClose,
  onSave,
}: WaypointModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isLight } = useAppTheme();
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [coordMode, setCoordMode] = useState<'single' | 'pair'>('pair');

  // Coordinates fields matching CoordinateInputModal
  const [singleText, setSingleText] = useState('');
  const [latText, setLatText] = useState('');
  const [lngText, setLngText] = useState('');

  const [depthStr, setDepthStr] = useState('50');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [coordError, setCoordError] = useState<string | null>(null);

  // Sync state when modal opens or spotToEdit changes
  useEffect(() => {
    if (visible) {
      setCoordError(null);
      if (spotToEdit) {
        setName(spotToEdit.name);
        const lStr = spotToEdit.latitude.toFixed(4);
        const gStr = spotToEdit.longitude.toFixed(4);
        setLatText(lStr);
        setLngText(gStr);
        setSingleText(`${lStr}, ${gStr}`);
        setDepthStr(String(spotToEdit.depthM));
        setCategory(spotToEdit.category || CATEGORIES[0].id);
        setColor(spotToEdit.color || COLOR_OPTIONS[0]);
        setNotes(spotToEdit.notes || '');
      } else {
        setName('');
        const initLat = userLocation ? userLocation.latitude.toFixed(4) : '20.3500';
        const initLng = userLocation ? userLocation.longitude.toFixed(4) : '70.8200';
        setLatText(initLat);
        setLngText(initLng);
        setSingleText(`${initLat}, ${initLng}`);
        setDepthStr('50');
        setCategory(CATEGORIES[0].id);
        setColor(COLOR_OPTIONS[0]);
        setNotes('');
      }
    }
  }, [visible, spotToEdit, userLocation]);

  // Handle single raw input change -> try to auto-sync to pair fields
  const handleSingleChange = (text: string) => {
    setSingleText(text);
    setCoordError(null);
    const parsed = parseCoordinates(text);
    if (parsed) {
      setLatText(parsed.latitude.toFixed(4));
      setLngText(parsed.longitude.toFixed(4));
    }
  };

  // Handle lat change in pair mode -> auto-sync to single field
  const handleLatChange = (text: string) => {
    setLatText(text);
    setCoordError(null);
    setSingleText(`${text}, ${lngText}`);
  };

  // Handle lng change in pair mode -> auto-sync to single field
  const handleLngChange = (text: string) => {
    setLngText(text);
    setCoordError(null);
    setSingleText(`${latText}, ${text}`);
  };

  // Autofill with current GPS location
  const handleUseCurrentGps = () => {
    if (userLocation) {
      const lStr = userLocation.latitude.toFixed(4);
      const gStr = userLocation.longitude.toFixed(4);
      setLatText(lStr);
      setLngText(gStr);
      setSingleText(`${lStr}, ${gStr}`);
      setCoordError(null);
    } else {
      Alert.alert(
        t('validation.error', 'GPS Unavailable'),
        t('waypoints.gps_unavail', 'Current GPS location is not available yet.'),
      );
    }
  };

  // Save handler with dual validation
  const handleSave = async () => {
    setCoordError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert(
        t('validation.error', 'Validation Error'),
        t('waypoints.val_name_err', 'Please enter a waypoint name.'),
      );
      return;
    }

    let lat: number;
    let lng: number;

    if (coordMode === 'single') {
      const parsed = parseCoordinates(singleText);
      if (!parsed) {
        setCoordError(
          t('coords.invalid_format', 'Invalid coordinates format. Example: 20.3875, 70.8783'),
        );
        return;
      }
      lat = parsed.latitude;
      lng = parsed.longitude;
    } else {
      const l = parseFloat(latText);
      const g = parseFloat(lngText);
      if (isNaN(l) || l < -90 || l > 90) {
        setCoordError(
          t('waypoints.val_lat_err', 'Please enter a valid Latitude between -90 and 90.'),
        );
        return;
      }
      if (isNaN(g) || g < -180 || g > 180) {
        setCoordError(
          t('waypoints.val_lng_err', 'Please enter a valid Longitude between -180 and 180.'),
        );
        return;
      }
      lat = l;
      lng = g;
    }

    const depth = parseInt(depthStr, 10) || 40;

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
    } catch {
      Alert.alert(
        t('validation.error', 'Error'),
        t('waypoints.save_err', 'Failed to save waypoint. Please try again.'),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const previewLat = parseFloat(latText) || 0;
  const previewLng = parseFloat(lngText) || 0;

  const inputStyle = [
    styles.input,
    {
      backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 0, 0, 0.35)',
      borderColor: colors.cardBorder,
      color: colors.text,
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropTouch} onPress={onClose} />

        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.cardBorder,
              paddingBottom: Math.max(insets.bottom, 20) + 8,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.divider }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {spotToEdit
                  ? t('waypoints.edit_title', 'Edit Waypoint')
                  : t('waypoints.add_new_title', 'Add New Waypoint')}
              </Text>
              <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
                {spotToEdit
                  ? t('waypoints.edit_sub', 'Update GPS coords & marine details')
                  : t('waypoints.add_sub', 'Save coastal hotspot to marine logs')}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={[styles.closeBtn, { backgroundColor: colors.chipBg }]}
              accessibilityRole="button"
              accessibilityLabel={t('btn.close', 'Close')}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
            {/* Waypoint Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {t('waypoints.name_label', 'WAYPOINT NAME')}
              </Text>
              <TextInput
                style={inputStyle}
                placeholder={t('waypoints.name_placeholder', 'e.g. Ghol Spot Alpha, Deep Reef')}
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* GPS Coordinates Header & Autofill */}
            <View style={styles.fieldGroup}>
              <View style={styles.coordLabelRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {t('waypoints.coords_section', 'GPS COORDINATES')}
                </Text>
                <Pressable
                  style={[styles.useGpsBtn, { backgroundColor: colors.chipBg, borderColor: colors.accent }]}
                  onPress={handleUseCurrentGps}
                  accessibilityRole="button"
                >
                  <Ionicons name="locate" size={13} color={colors.accent} />
                  <Text style={[styles.useGpsText, { color: colors.accent }]}>
                    {t('waypoints.use_current_gps', 'Use Current GPS')}
                  </Text>
                </Pressable>
              </View>

              {/* Mode Switcher Tabs (Same structure as CoordinateInputModal) */}
              <View style={[styles.tabsRow, { backgroundColor: isLight ? '#E2E8F0' : 'rgba(0, 0, 0, 0.35)' }]}>
                <Pressable
                  style={[
                    styles.tab,
                    coordMode === 'pair' && [styles.tabActive, { backgroundColor: colors.accent }],
                  ]}
                  onPress={() => {
                    setCoordMode('pair');
                    setCoordError(null);
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: coordMode === 'pair' }}
                >
                  <Ionicons
                    name="grid-outline"
                    size={14}
                    color={coordMode === 'pair' ? '#FFFFFF' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      { color: colors.textSecondary },
                      coordMode === 'pair' && styles.tabTextActive,
                    ]}
                  >
                    {t('coords.separate_fields', 'Separate Lat & Lng')}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.tab,
                    coordMode === 'single' && [styles.tabActive, { backgroundColor: colors.accent }],
                  ]}
                  onPress={() => {
                    setCoordMode('single');
                    setCoordError(null);
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: coordMode === 'single' }}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={14}
                    color={coordMode === 'single' ? '#FFFFFF' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      { color: colors.textSecondary },
                      coordMode === 'single' && styles.tabTextActive,
                    ]}
                  >
                    {t('coords.quick_paste', 'Quick Paste / Raw')}
                  </Text>
                </Pressable>
              </View>

              {/* Option 1: Quick Paste / Raw Single Field */}
              {coordMode === 'single' ? (
                <View style={styles.fieldBlock}>
                  <Text style={[styles.subLabel, { color: colors.textMuted }]}>
                    {t('coords.pair_label', 'ENTER COORDINATE PAIR')}
                  </Text>
                  <TextInput
                    style={inputStyle}
                    placeholder={t('coords.pair_placeholder', "e.g. 20.3875, 70.8783 or 20° 23' N, 70° 52' E")}
                    placeholderTextColor={colors.textMuted}
                    value={singleText}
                    onChangeText={handleSingleChange}
                    autoCapitalize="none"
                  />
                  <Text style={[styles.hint, { color: colors.textSecondary }]}>
                    {t('coords.pair_hint', 'Accepts decimal (20.35, 70.82) or standard nautical notation.')}
                  </Text>
                </View>
              ) : (
                /* Option 2: Separate Lat & Lng Pair Fields */
                <View style={styles.pairRow}>
                  <View style={styles.pairCol}>
                    <Text style={[styles.subLabel, { color: colors.textMuted }]}>
                      {t('waypoints.lat_label', 'LATITUDE')}
                    </Text>
                    <TextInput
                      style={inputStyle}
                      keyboardType="numeric"
                      placeholder={t('coords.lat_placeholder', 'e.g. 20.3875')}
                      placeholderTextColor={colors.textMuted}
                      value={latText}
                      onChangeText={handleLatChange}
                    />
                  </View>
                  <View style={styles.pairCol}>
                    <Text style={[styles.subLabel, { color: colors.textMuted }]}>
                      {t('waypoints.lng_label', 'LONGITUDE')}
                    </Text>
                    <TextInput
                      style={inputStyle}
                      keyboardType="numeric"
                      placeholder={t('coords.lng_placeholder', 'e.g. 70.8783')}
                      placeholderTextColor={colors.textMuted}
                      value={lngText}
                      onChangeText={handleLngChange}
                    />
                  </View>
                </View>
              )}

              {/* Validation Error Message */}
              {coordError ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={14} color="#EF4444" />
                  <Text style={styles.errorText}>{coordError}</Text>
                </View>
              ) : null}

            </View>

            {/* Depth & Color Pin */}
            <View style={styles.pairRow}>
              <View style={styles.pairCol}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {t('waypoints.depth_label', 'WATER DEPTH (METERS)')}
                </Text>
                <TextInput
                  style={inputStyle}
                  placeholder={t('waypoints.depth_placeholder', 'e.g. 65')}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={depthStr}
                  onChangeText={setDepthStr}
                />
              </View>

              <View style={styles.pairCol}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {t('waypoints.color_tag', 'COLOR PIN')}
                </Text>
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

            {/* Category / Target Species */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {t('waypoints.category_label', 'CATEGORY / TARGET SPECIES')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll}>
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      style={[
                        styles.tagPill,
                        {
                          backgroundColor: isSelected
                            ? colors.chipBg
                            : isLight
                              ? '#F1F5F9'
                              : 'rgba(255, 255, 255, 0.06)',
                          borderColor: isSelected ? colors.accent : colors.divider,
                        },
                      ]}
                      onPress={() => setCategory(cat.id)}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          { color: isSelected ? colors.accent : colors.textSecondary },
                          isSelected && { fontWeight: '700' },
                        ]}
                      >
                        {t(cat.key, cat.fallback)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Notes & Catch Logs */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {t('waypoints.notes_label', 'NOTES & CATCH LOGS (OPTIONAL)')}
              </Text>
              <TextInput
                style={[inputStyle, styles.notesInput]}
                placeholder={t(
                  'waypoints.notes_placeholder',
                  'e.g. Best during high tide, rocky reef bottom',
                )}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={2}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </ScrollView>

          {/* Save / Update Action Buttons */}
          <View style={styles.footerRow}>
            <Pressable
              style={[
                styles.cancelBtn,
                { backgroundColor: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)' },
              ]}
              onPress={onClose}
              disabled={isSaving}
              accessibilityRole="button"
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                {t('btn.cancel', 'Cancel')}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.saveBtn,
                { backgroundColor: colors.accent },
                isSaving && styles.saveBtnDisabled,
              ]}
              onPress={handleSave}
              disabled={isSaving}
              accessibilityRole="button"
            >
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              <Text style={styles.saveText}>
                {isSaving
                  ? t('waypoints.saving', 'Saving...')
                  : spotToEdit
                    ? t('waypoints.update_btn', 'Update Waypoint')
                    : t('waypoints.save_btn', 'Save Waypoint')}
              </Text>
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
    maxHeight: '88%',
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
    flexShrink: 1,
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
  subLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  coordLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  useGpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  useGpsText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#0284C7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  fieldBlock: {
    marginBottom: 8,
  },
  hint: {
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  pairRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  pairCol: {
    flex: 1,
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
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 6,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  previewText: {
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  previewDec: {
    fontSize: 10.5,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  notesInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  colorPalette: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
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
  tagText: {
    color: MapColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
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
