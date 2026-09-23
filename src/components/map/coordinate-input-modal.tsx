import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapColors } from '@/constants/map-theme';
import { useLanguage } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';
import {
  COORDINATE_FORMATS,
  CoordinateFormatId,
  parseAnyCoordinate,
  parseSingleCoordinate,
} from '@/utils/coordinate-converters';

type CoordinateInputModalProps = {
  visible: boolean;
  onClose: () => void;
  onPlot: (lat: number, lng: number) => void;
};

export function CoordinateInputModal({
  visible,
  onClose,
  onPlot,
}: CoordinateInputModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, activeTheme } = useAppTheme();
  const { t } = useLanguage();
  const isLight = activeTheme === 'light';

  const singleInputRef = useRef<TextInput>(null);
  const latInputRef = useRef<TextInput>(null);
  const lngInputRef = useRef<TextInput>(null);

  const [latText, setLatText] = useState('');
  const [lngText, setLngText] = useState('');
  const [latHasError, setLatHasError] = useState(false);
  const [lngHasError, setLngHasError] = useState(false);
  const [singleText, setSingleText] = useState('');
  const [mode, setMode] = useState<'pair' | 'single'>('single');
  const [selectedFormat, setSelectedFormat] = useState<CoordinateFormatId>('AUTO');
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeFormatMeta = useMemo(
    () => COORDINATE_FORMATS.find((f) => f.id === selectedFormat) || COORDINATE_FORMATS[0],
    [selectedFormat]
  );

  // Live parsed coordinates for real-time validation preview
  const liveParsed = useMemo(() => {
    if (mode === 'single') {
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
  }, [mode, singleText, latText, lngText, selectedFormat]);

  const handlePlot = () => {
    setError(null);
    setLatHasError(false);
    setLngHasError(false);

    let lat: number | null = null;
    let lng: number | null = null;

    if (mode === 'single') {
      if (!singleText.trim()) {
        setError(t('coords.invalid_format', 'Please enter coordinates.'));
        singleInputRef.current?.focus();
        return;
      }
      const parsed = parseAnyCoordinate(singleText, selectedFormat) || parseAnyCoordinate(singleText);
      if (!parsed) {
        setError(t('coords.invalid_format', `Invalid coordinates. Example: ${activeFormatMeta.example}`));
        singleInputRef.current?.focus();
        return;
      }
      lat = parsed.latitude;
      lng = parsed.longitude;
    } else {
      if (!latText.trim()) {
        setError(t('waypoints.val_lat_err', 'Please enter Latitude. Example: 20° 44.570\' N or 20.7428'));
        setLatHasError(true);
        latInputRef.current?.focus();
        return;
      }
      if (!lngText.trim()) {
        setError(t('coords.err_lng_empty', 'Please enter Longitude. Example: 070° 52.340\' E or 70.8723'));
        setLngHasError(true);
        lngInputRef.current?.focus();
        return;
      }

      const parsedLat = parseSingleCoordinate(latText, true);
      if (parsedLat === null) {
        setError(t('coords.err_lat_invalid', 'Invalid Latitude (-90° to +90°). Example: 20° 44.570\' N or 20.7428'));
        setLatHasError(true);
        latInputRef.current?.focus();
        return;
      }

      const parsedLng = parseSingleCoordinate(lngText, false);
      if (parsedLng === null) {
        setError(t('coords.err_lng_invalid', 'Invalid Longitude (-180° to +180°). Example: 070° 52.340\' E or 70.8723'));
        setLngHasError(true);
        lngInputRef.current?.focus();
        return;
      }

      lat = parsedLat;
      lng = parsedLng;
    }

    onPlot(lat, lng);
    onClose();
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: isLight ? '#F1F5F9' : colors.surfaceSubtle,
      borderColor: colors.border,
      color: colors.text,
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 20) + 12,
            },
          ]}>
          <View style={[styles.handle, { backgroundColor: isLight ? '#CBD5E1' : 'rgba(255,255,255,0.2)' }]} />
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="navigate-circle" size={22} color={colors.accent} />
              <Text style={[styles.title, { color: colors.text }]}>{t('coords.goto_title', 'Go to GPS Coordinates')}</Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={[styles.closeBtn, { backgroundColor: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.08)' }]}
              accessibilityRole="button"
              accessibilityLabel={t('btn.close', 'Close')}
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Coordinate Format Selector (Matches Garmin/Marine GPS Options) */}
          <View style={styles.formatBarWrapper}>
            <Pressable
              style={[
                styles.formatSelectorBtn,
                {
                  backgroundColor: isLight ? '#F1F5F9' : colors.surfaceSubtle,
                  borderColor: showFormatDropdown ? colors.accent : colors.border,
                },
              ]}
              onPress={() => setShowFormatDropdown((prev) => !prev)}
            >
              <View style={styles.formatBtnLeft}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.formatBtnTitle, { color: colors.text }]}>
                    {activeFormatMeta.label}
                  </Text>
                  <View style={styles.formatTagBadge}>
                    <Text style={styles.formatTagText}>GPS FORMAT</Text>
                  </View>
                </View>
                <Text style={[styles.formatBtnSub, { color: colors.textMuted }]} numberOfLines={1}>
                  {activeFormatMeta.description} (e.g. {activeFormatMeta.example})
                </Text>
              </View>
              <Ionicons
                name={showFormatDropdown ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.accent}
              />
            </Pressable>

            {/* Dropdown Options List */}
            {showFormatDropdown && (
              <View
                style={[
                  styles.formatDropdown,
                  {
                    backgroundColor: isLight ? '#FFFFFF' : '#0B192C',
                    borderColor: colors.border,
                  },
                ]}
              >
                {COORDINATE_FORMATS.map((fmt) => {
                  const isSelected = fmt.id === selectedFormat;
                  return (
                    <Pressable
                      key={fmt.id}
                      style={[
                        styles.formatOptionItem,
                        {
                          borderBottomColor: colors.border,
                          backgroundColor: isSelected
                            ? isLight
                              ? 'rgba(2, 132, 199, 0.1)'
                              : 'rgba(56, 189, 248, 0.15)'
                            : 'transparent',
                        },
                      ]}
                      onPress={() => {
                        setSelectedFormat(fmt.id);
                        setShowFormatDropdown(false);
                        setError(null);
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text
                          style={[
                            styles.formatOptionLabel,
                            { color: isSelected ? colors.accent : colors.text },
                          ]}
                        >
                          {fmt.label}
                        </Text>
                        {isSelected && <Ionicons name="checkmark-circle" size={16} color={colors.accent} />}
                      </View>
                      <Text style={[styles.formatOptionSub, { color: colors.textMuted }]}>
                        {fmt.description}
                      </Text>
                      <Text style={[styles.formatOptionExample, { color: colors.accent }]}>
                        e.g. {fmt.example}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* Mode Switcher Tabs (2 Modes: Quick Paste / Raw vs Separate Lat & Lng) */}
          <View style={[styles.tabsRow, { backgroundColor: isLight ? '#E2E8F0' : colors.surfaceSubtle }]}>
            <Pressable
              style={[
                styles.tab,
                mode === 'single' && [styles.tabActive, { backgroundColor: colors.accent }],
              ]}
              onPress={() => { setMode('single'); setError(null); }}>
              <Text
                style={[
                  styles.tabText,
                  { color: colors.textSecondary },
                  mode === 'single' && styles.tabTextActive,
                ]}>
                {t('coords.quick_paste', 'Quick Paste / Raw')}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.tab,
                mode === 'pair' && [styles.tabActive, { backgroundColor: colors.accent }],
              ]}
              onPress={() => { setMode('pair'); setError(null); }}>
              <Text
                style={[
                  styles.tabText,
                  { color: colors.textSecondary },
                  mode === 'pair' && styles.tabTextActive,
                ]}>
                {t('coords.separate_fields', 'Separate Lat & Lng')}
              </Text>
            </Pressable>
          </View>

          {mode === 'single' ? (
            <View style={styles.fieldBlock}>
              <Text style={[styles.label, { color: colors.textMuted }]}>{t('coords.pair_label', 'ENTER COORDINATE PAIR')}</Text>
              <TextInput
                ref={singleInputRef}
                style={[inputStyle, error ? styles.inputError : null]}
                placeholder={activeFormatMeta.example}
                placeholderTextColor={colors.textMuted}
                value={singleText}
                onChangeText={(text) => {
                  setSingleText(text);
                  if (error) setError(null);
                }}
                autoCapitalize="none"
              />
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                {activeFormatMeta.description} • Format: {activeFormatMeta.label}
              </Text>
            </View>
          ) : (
            <View style={styles.pairRow}>
              <View style={styles.pairCol}>
                <Text style={[styles.label, { color: colors.textMuted }]}>{t('waypoints.lat_label', 'LATITUDE')}</Text>
                <TextInput
                  ref={latInputRef}
                  style={[inputStyle, latHasError ? styles.inputError : null]}
                  placeholder={activeFormatMeta.placeholderLat}
                  placeholderTextColor={colors.textMuted}
                  value={latText}
                  onChangeText={(text) => {
                    setLatText(text);
                    if (error) setError(null);
                    if (latHasError) setLatHasError(false);
                  }}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.pairCol}>
                <Text style={[styles.label, { color: colors.textMuted }]}>{t('waypoints.lng_label', 'LONGITUDE')}</Text>
                <TextInput
                  ref={lngInputRef}
                  style={[inputStyle, lngHasError ? styles.inputError : null]}
                  placeholder={activeFormatMeta.placeholderLng}
                  placeholderTextColor={colors.textMuted}
                  value={lngText}
                  onChangeText={(text) => {
                    setLngText(text);
                    if (error) setError(null);
                    if (lngHasError) setLngHasError(false);
                  }}
                  autoCapitalize="none"
                />
              </View>
            </View>
          )}

          {/* Live Preview Card */}
          {liveParsed && (
            <View
              style={[
                styles.previewCard,
                {
                  backgroundColor: isLight ? '#F0FDF4' : 'rgba(34, 197, 94, 0.08)',
                  borderColor: isLight ? '#86EFAC' : 'rgba(34, 197, 94, 0.3)',
                },
              ]}
            >
              <View style={styles.previewHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                  <Text style={[styles.previewBadgeText, { color: '#22C55E' }]}>
                    VERIFIED GPS POSITION
                  </Text>
                </View>
                <Text style={[styles.previewBadgeText, { color: colors.textMuted }]}>
                  {liveParsed.formatDetected}
                </Text>
              </View>
              <View style={{ gap: 3 }}>
                <Text style={[styles.previewValText, { color: colors.text }]}>
                  DDM: {liveParsed.formattedDDM.full}
                </Text>
                <Text style={[styles.previewValText, { color: colors.textSecondary }]}>
                  Dec: {liveParsed.latitude.toFixed(6)}°, {liveParsed.longitude.toFixed(6)}°
                </Text>
              </View>
            </View>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Action button */}
          <Pressable style={[styles.plotBtn, { backgroundColor: colors.accent }]} onPress={handlePlot}>
            <Ionicons name="compass" size={20} color="#FFFFFF" />
            <Text style={styles.plotText}>{t('coords.plot_and_go', 'PLOT ON CHART')}</Text>
          </Pressable>
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
  formatBarWrapper: {
    marginBottom: 12,
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
    marginRight: 8,
  },
  formatBtnTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  formatTagBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  formatTagText: {
    color: '#38BDF8',
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
  previewCard: {
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    marginTop: 6,
    marginBottom: 10,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  previewBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  previewValText: {
    fontSize: 11.5,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: MapColors.navyGlass,
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: MapColors.accent,
  },
  tabText: {
    color: MapColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  fieldBlock: {
    marginBottom: 12,
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
  hint: {
    color: MapColors.textSecondary,
    fontSize: 11,
    marginTop: 5,
  },
  pairRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  pairCol: {
    flex: 1,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  plotBtn: {
    backgroundColor: MapColors.accent,
    borderRadius: 16,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  plotText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
