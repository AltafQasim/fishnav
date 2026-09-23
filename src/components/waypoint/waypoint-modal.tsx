import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import {
  COORDINATE_FORMATS,
  CoordinateFormatId,
  parseAnyCoordinate,
  parseSingleCoordinate,
  ParsedCoordResult,
  toDDMM_MM,
} from '@/utils/coordinate-converters';
import { bearingDegrees, distanceNm, formatBearing, formatNm } from '@/utils/geo';

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

  // Input Refs for smooth auto-focus on validation failure
  const nameInputRef = useRef<TextInput>(null);
  const singleInputRef = useRef<TextInput>(null);
  const latInputRef = useRef<TextInput>(null);
  const lngInputRef = useRef<TextInput>(null);

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [coordMode, setCoordMode] = useState<'single' | 'pair'>('pair');

  // Coordinates fields matching CoordinateInputModal
  const [singleText, setSingleText] = useState('');
  const [latText, setLatText] = useState('');
  const [lngText, setLngText] = useState('');
  const [latHasError, setLatHasError] = useState(false);
  const [lngHasError, setLngHasError] = useState(false);

  const [depthStr, setDepthStr] = useState('50');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [coordError, setCoordError] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<CoordinateFormatId>('AUTO');
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);

  // Live parsed coordinates for real-time validation and preview
  const liveParsed = useMemo<ParsedCoordResult | null>(() => {
    if (coordMode === 'single') {
      if (!singleText.trim()) return null;
      return parseAnyCoordinate(singleText, selectedFormat);
    } else {
      if (!latText.trim() && !lngText.trim()) return null;
      const lat = parseSingleCoordinate(latText, true);
      const lng = parseSingleCoordinate(lngText, false);
      if (lat !== null && lng !== null) {
        return parseAnyCoordinate(`${lat}, ${lng}`, selectedFormat);
      }
      return null;
    }
  }, [coordMode, singleText, latText, lngText, selectedFormat]);

  // Live nautical distance & bearing calculation from current boat position
  const liveTargetStats = useMemo(() => {
    if (!liveParsed || !userLocation) return null;
    const nm = distanceNm(userLocation.latitude, userLocation.longitude, liveParsed.latitude, liveParsed.longitude);
    const brg = bearingDegrees(userLocation.latitude, userLocation.longitude, liveParsed.latitude, liveParsed.longitude);
    return {
      distanceStr: formatNm(nm),
      bearingStr: formatBearing(brg),
    };
  }, [liveParsed, userLocation]);

  const activeFormatMeta = useMemo(() => {
    return COORDINATE_FORMATS.find((f) => f.id === selectedFormat) || COORDINATE_FORMATS[0];
  }, [selectedFormat]);

  // Sync state ONLY when modal visibility changes or spotToEdit changes (NEVER on background GPS location tick!)
  useEffect(() => {
    if (visible) {
      setNameError(null);
      setCoordError(null);
      setLatHasError(false);
      setLngHasError(false);
      setShowFormatDropdown(false);

      if (spotToEdit) {
        setName(spotToEdit.name);
        const ddmLat = toDDMM_MM(spotToEdit.latitude, true);
        const ddmLng = toDDMM_MM(spotToEdit.longitude, false);
        setLatText(ddmLat.displayStr);
        setLngText(ddmLng.displayStr);
        setSingleText(`${ddmLat.displayStr}, ${ddmLng.displayStr}`);
        setDepthStr(String(spotToEdit.depthM));
        setCategory(spotToEdit.category || CATEGORIES[0].id);
        setColor(spotToEdit.color || COLOR_OPTIONS[0]);
        setNotes(spotToEdit.notes || '');
      } else {
        setName('');
        // No default coordinates prefilled - keep completely empty so only placeholder is shown!
        setLatText('');
        setLngText('');
        setSingleText('');
        setDepthStr('50');
        setCategory(CATEGORIES[0].id);
        setColor(COLOR_OPTIONS[0]);
        setNotes('');
      }
    }
  }, [visible, spotToEdit]);

  // Handle name input change
  const handleNameChange = (text: string) => {
    setName(text);
    if (nameError) setNameError(null);
  };

  // Handle single raw input change (without auto-overwriting pair fields while user is typing!)
  const handleSingleChange = (text: string) => {
    setSingleText(text);
    setCoordError(null);
    setLatHasError(false);
    setLngHasError(false);
  };

  // Handle lat change in pair mode (without cross-polluting or auto-overwriting!)
  const handleLatChange = (text: string) => {
    setLatText(text);
    setCoordError(null);
    setLatHasError(false);
  };

  // Handle lng change in pair mode (without cross-polluting or auto-overwriting!)
  const handleLngChange = (text: string) => {
    setLngText(text);
    setCoordError(null);
    setLngHasError(false);
  };

  // Autofill with current GPS location on explicit user button tap
  const handleUseCurrentGps = () => {
    if (userLocation) {
      const ddmLat = toDDMM_MM(userLocation.latitude, true);
      const ddmLng = toDDMM_MM(userLocation.longitude, false);
      setLatText(ddmLat.displayStr);
      setLngText(ddmLng.displayStr);
      setSingleText(`${ddmLat.displayStr}, ${ddmLng.displayStr}`);
      setCoordError(null);
      setLatHasError(false);
      setLngHasError(false);
    } else {
      setCoordError(t('waypoints.gps_unavail', 'Current GPS location is not available yet.'));
    }
  };

  // Save handler with DIRECT INLINE FIELD VALIDATION & AUTO-FOCUS (Zero alert popups!)
  const handleSave = async () => {
    setNameError(null);
    setCoordError(null);
    setLatHasError(false);
    setLngHasError(false);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError(t('waypoints.val_name_err', 'Please enter a waypoint name.'));
      nameInputRef.current?.focus();
      return;
    }

    let lat: number | null = null;
    let lng: number | null = null;

    if (coordMode === 'single') {
      if (!singleText.trim()) {
        setCoordError(t('coords.err_empty', 'Please enter coordinates.'));
        singleInputRef.current?.focus();
        return;
      }

      const parsed = parseAnyCoordinate(singleText, selectedFormat) || parseAnyCoordinate(singleText);
      if (!parsed) {
        setCoordError(
          t('coords.invalid_format', `Please enter valid coordinates. Example: 20° 44.570' N, 70° 52.340' E or 20.7428, 70.8723`),
        );
        singleInputRef.current?.focus();
        return;
      }
      lat = parsed.latitude;
      lng = parsed.longitude;
    } else {
      // Pair mode validation
      if (!latText.trim()) {
        setCoordError(t('coords.err_lat_empty', 'Please enter Latitude. Example: 20° 44.570\' N or 20.7428'));
        setLatHasError(true);
        latInputRef.current?.focus();
        return;
      }

      if (!lngText.trim()) {
        setCoordError(t('coords.err_lng_empty', 'Please enter Longitude. Example: 070° 52.340\' E or 70.8723'));
        setLngHasError(true);
        lngInputRef.current?.focus();
        return;
      }

      const parsedLat = parseSingleCoordinate(latText, true);
      if (parsedLat === null) {
        setCoordError(t('coords.err_lat_invalid', 'Invalid Latitude (-90° to +90°). Example: 20° 44.570\' N or 20.7428'));
        setLatHasError(true);
        latInputRef.current?.focus();
        return;
      }

      const parsedLng = parseSingleCoordinate(lngText, false);
      if (parsedLng === null) {
        setCoordError(t('coords.err_lng_invalid', 'Invalid Longitude (-180° to +180°). Example: 070° 52.340\' E or 70.8723'));
        setLngHasError(true);
        lngInputRef.current?.focus();
        return;
      }

      lat = parsedLat;
      lng = parsedLng;
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
      setCoordError(
        t('waypoints.save_err', 'Failed to save waypoint. Please check storage.'),
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
                ref={nameInputRef}
                style={[inputStyle, nameError ? styles.inputError : null]}
                placeholder={t('waypoints.name_placeholder', 'e.g. Ghol Spot Alpha, Deep Reef')}
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={handleNameChange}
              />
              {nameError ? (
                <View style={styles.inlineErrorRow}>
                  <Ionicons name="alert-circle" size={14} color="#EF4444" />
                  <Text style={styles.inlineErrorText}>{nameError}</Text>
                </View>
              ) : null}
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

              {/* 🧭 Coordinate Format Dropdown Selector (Matching GPS unit options) */}
              <View style={styles.formatBarWrapper}>
                <Pressable
                  style={[
                    styles.formatSelectorBtn,
                    {
                      backgroundColor: isLight ? '#F8FAFC' : 'rgba(255, 255, 255, 0.05)',
                      borderColor: showFormatDropdown ? colors.accent : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setShowFormatDropdown((prev) => !prev)}
                  accessibilityRole="button"
                  accessibilityLabel="Coordinate format"
                >
                  <View style={styles.formatBtnLeft}>
                    <Ionicons name="compass" size={17} color={colors.accent} />
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.formatBtnTitle, { color: colors.text }]}>{activeFormatMeta.label}</Text>
                        <View style={[styles.formatTagBadge, { backgroundColor: `${colors.accent}25` }]}>
                          <Text style={[styles.formatTagText, { color: colors.accent }]}>GPS FORMAT</Text>
                        </View>
                      </View>
                      <Text style={[styles.formatBtnSub, { color: colors.textSecondary }]}>
                        {activeFormatMeta.sublabel}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={showFormatDropdown ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.textSecondary}
                  />
                </Pressable>

                {/* Dropdown Options List */}
                {showFormatDropdown && (
                  <View
                    style={[
                      styles.formatDropdown,
                      {
                        backgroundColor: isLight ? '#FFFFFF' : '#0B1929',
                        borderColor: colors.cardBorder,
                      },
                    ]}
                  >
                    {COORDINATE_FORMATS.map((fmt, fIdx) => (
                      <Pressable
                        key={fmt.id}
                        style={[
                          styles.formatOptionItem,
                          {
                            borderBottomColor: fIdx < COORDINATE_FORMATS.length - 1 ? (isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.06)') : 'transparent',
                            backgroundColor: selectedFormat === fmt.id ? (isLight ? '#E0F2FE' : 'rgba(0, 240, 255, 0.12)') : 'transparent',
                          },
                        ]}
                        onPress={() => {
                          setSelectedFormat(fmt.id);
                          setShowFormatDropdown(false);
                        }}
                      >
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text
                            style={[
                              styles.formatOptionLabel,
                              { color: selectedFormat === fmt.id ? colors.accent : colors.text },
                            ]}
                          >
                            {fmt.label}
                          </Text>
                          <Text style={[styles.formatOptionSub, { color: colors.textSecondary }]}>
                            {fmt.sublabel}
                          </Text>
                          <Text style={[styles.formatOptionExample, { color: colors.textMuted }]}>
                            {fmt.example}
                          </Text>
                        </View>
                        {selectedFormat === fmt.id && (
                          <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                        )}
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              {/* Mode Switcher Tabs (Same structure as CoordinateInputModal) */}
              <View style={[styles.tabsRow, { backgroundColor: isLight ? '#E2E8F0' : 'rgba(0, 0, 0, 0.35)' }]}>
                <Pressable
                  style={[
                    styles.tab,
                    coordMode === 'pair' && [styles.tabActive, { backgroundColor: colors.accent }],
                  ]}
                  onPress={() => {
                    if (coordMode !== 'pair') {
                      setCoordMode('pair');
                      setCoordError(null);
                      if (singleText.trim() && !latText && !lngText) {
                        const parsed = parseAnyCoordinate(singleText, selectedFormat);
                        if (parsed) {
                          setLatText(parsed.formattedDDM.lat);
                          setLngText(parsed.formattedDDM.lng);
                        }
                      }
                    }
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
                    if (coordMode !== 'single') {
                      setCoordMode('single');
                      setCoordError(null);
                      if ((latText.trim() || lngText.trim()) && !singleText.trim()) {
                        setSingleText(latText && lngText ? `${latText}, ${lngText}` : latText || lngText);
                      }
                    }
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
                    ref={singleInputRef}
                    style={[inputStyle, coordError ? styles.inputError : null]}
                    placeholder={activeFormatMeta.example}
                    placeholderTextColor={colors.textMuted}
                    value={singleText}
                    onChangeText={handleSingleChange}
                    autoCapitalize="none"
                  />
                  <Text style={[styles.hint, { color: colors.textSecondary }]}>
                    💡 {activeFormatMeta.example}
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
                      ref={latInputRef}
                      style={[inputStyle, latHasError ? styles.inputError : null]}
                      placeholder={activeFormatMeta.placeholderLat}
                      placeholderTextColor={colors.textMuted}
                      value={latText}
                      onChangeText={handleLatChange}
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={styles.pairCol}>
                    <Text style={[styles.subLabel, { color: colors.textMuted }]}>
                      {t('waypoints.lng_label', 'LONGITUDE')}
                    </Text>
                    <TextInput
                      ref={lngInputRef}
                      style={[inputStyle, lngHasError ? styles.inputError : null]}
                      placeholder={activeFormatMeta.placeholderLng}
                      placeholderTextColor={colors.textMuted}
                      value={lngText}
                      onChangeText={handleLngChange}
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              )}

              {/* Validation Error Message right below coordinate fields */}
              {coordError ? (
                <View style={[styles.inlineErrorRow, { marginBottom: 6 }]}>
                  <Ionicons name="alert-circle" size={14} color="#EF4444" />
                  <Text style={styles.inlineErrorText}>{coordError}</Text>
                </View>
              ) : null}

              {/* Live Synchronized Preview & Validation Card */}
              {liveParsed ? (
                <View
                  style={[
                    styles.previewCard,
                    {
                      backgroundColor: isLight ? '#F0FDF4' : 'rgba(34, 197, 94, 0.08)',
                      borderColor: isLight ? '#86EFAC' : 'rgba(34, 197, 94, 0.35)',
                    },
                  ]}
                >
                  <View style={styles.previewHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Ionicons name="checkmark-circle" size={15} color="#22C55E" />
                      <Text style={[styles.previewBadgeText, { color: '#22C55E' }]}>
                        ACCURATE NAUTICAL POSITION
                      </Text>
                    </View>
                    {liveTargetStats && (
                      <Text style={[styles.previewDistanceText, { color: colors.accent }]}>
                        📍 {liveTargetStats.distanceStr} ({liveTargetStats.bearingStr})
                      </Text>
                    )}
                  </View>
                  <View style={styles.previewDataGrid}>
                    <View style={styles.previewDataItem}>
                      <Text style={[styles.previewDataLabel, { color: colors.textMuted }]}>GPS (DDMM.MM):</Text>
                      <Text style={[styles.previewDataValue, { color: colors.text }]}>{liveParsed.formattedDDM.full}</Text>
                    </View>
                    <View style={styles.previewDataItem}>
                      <Text style={[styles.previewDataLabel, { color: colors.textMuted }]}>WGS84 DECIMAL:</Text>
                      <Text style={[styles.previewDataValue, { color: colors.accent }]}>{liveParsed.formattedDD.full}</Text>
                    </View>
                    <View style={styles.previewDataItem}>
                      <Text style={[styles.previewDataLabel, { color: colors.textMuted }]}>DMS (DDMM.SS):</Text>
                      <Text style={[styles.previewDataValue, { color: colors.textSecondary }]}>{liveParsed.formattedDMS.full}</Text>
                    </View>
                  </View>
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
  formatBarWrapper: {
    marginBottom: 10,
    zIndex: 20,
  },
  formatSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  formatBtnLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
  },
  formatBtnTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  formatTagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  formatTagText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  formatBtnSub: {
    fontSize: 11,
    marginTop: 2,
  },
  formatDropdown: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  formatOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  formatOptionLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  formatOptionSub: {
    fontSize: 11,
    marginTop: 2,
  },
  formatOptionExample: {
    fontSize: 10.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 3,
  },
  formatExampleHint: {
    fontSize: 11,
    marginTop: 4,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  previewCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 8,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  previewBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  previewDistanceText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  previewDataGrid: {
    gap: 6,
  },
  previewDataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  previewDataLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  previewDataValue: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
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
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  inlineErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
    paddingHorizontal: 2,
  },
  inlineErrorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
});
