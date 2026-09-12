import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
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
import { parseCoordinates } from '@/utils/geo';

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
  const [latText, setLatText] = useState('');
  const [lngText, setLngText] = useState('');
  const [singleText, setSingleText] = useState('');
  const [mode, setMode] = useState<'pair' | 'single'>('single');
  const [error, setError] = useState<string | null>(null);

  const handlePlot = () => {
    setError(null);
    let lat: number | null = null;
    let lng: number | null = null;

    if (mode === 'single') {
      const parsed = parseCoordinates(singleText);
      if (!parsed) {
        setError('Invalid coordinates format. Example: 20.3875, 70.8783');
        return;
      }
      lat = parsed.latitude;
      lng = parsed.longitude;
    } else {
      const l = parseFloat(latText);
      const g = parseFloat(lngText);
      if (isNaN(l) || isNaN(g) || l < -90 || l > 90 || g < -180 || g > 180) {
        setError('Please enter valid Latitude (-90 to 90) and Longitude (-180 to 180).');
        return;
      }
      lat = l;
      lng = g;
    }

    onPlot(lat, lng);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, 20) + 12 }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="navigate-circle" size={22} color={MapColors.accent} />
              <Text style={styles.title}>Go to GPS Coordinates</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={MapColors.textSecondary} />
            </Pressable>
          </View>

          {/* Mode Switcher Tabs */}
          <View style={styles.tabsRow}>
            <Pressable
              style={[styles.tab, mode === 'single' && styles.tabActive]}
              onPress={() => { setMode('single'); setError(null); }}>
              <Text style={[styles.tabText, mode === 'single' && styles.tabTextActive]}>
                Quick Paste / Raw
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, mode === 'pair' && styles.tabActive]}
              onPress={() => { setMode('pair'); setError(null); }}>
              <Text style={[styles.tabText, mode === 'pair' && styles.tabTextActive]}>
                Separate Lat & Lng
              </Text>
            </Pressable>
          </View>

          {mode === 'single' ? (
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>ENTER COORDINATE PAIR</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 20.3875, 70.8783 or 20° 23' N, 70° 52' E"
                placeholderTextColor={MapColors.textMuted}
                value={singleText}
                onChangeText={setSingleText}
                autoCapitalize="none"
              />
              <Text style={styles.hint}>
                Accepts decimal (20.35, 70.82) or standard nautical notation.
              </Text>
            </View>
          ) : (
            <View style={styles.pairRow}>
              <View style={styles.pairCol}>
                <Text style={styles.label}>LATITUDE</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="e.g. 20.3875"
                  placeholderTextColor={MapColors.textMuted}
                  value={latText}
                  onChangeText={setLatText}
                />
              </View>
              <View style={styles.pairCol}>
                <Text style={styles.label}>LONGITUDE</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="e.g. 70.8783"
                  placeholderTextColor={MapColors.textMuted}
                  value={lngText}
                  onChangeText={setLngText}
                />
              </View>
            </View>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Action button */}
          <Pressable style={styles.plotBtn} onPress={handlePlot}>
            <Ionicons name="compass" size={20} color="#FFFFFF" />
            <Text style={styles.plotText}>PLOT ON CHART</Text>
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
