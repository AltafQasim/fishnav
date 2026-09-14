import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
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

import { useTripTracking } from '@/context/trip-context';
import { useAppTheme } from '@/context/theme-context';
import { formatNm } from '@/utils/geo';

export function SaveTripModal() {
  const {
    showSaveModal,
    pendingTripSummary,
    saveTrip,
    discardTrip,
    closeSaveModal,
    resumeTracking,
  } = useTripTracking();

  const [tripName, setTripName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (pendingTripSummary) {
      setTripName(pendingTripSummary.name || 'Fishing Voyage');
      setNotes('');
    }
  }, [pendingTripSummary]);

  if (!showSaveModal || !pendingTripSummary) return null;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveTrip(tripName, notes);
    } catch (e) {
      console.error('Failed to save trip:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResume = () => {
    closeSaveModal();
    resumeTracking();
  };

  // Format seconds to Hh Mm Ss
  const formatDuration = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const { colors, isLight } = useAppTheme();

  return (
    <Modal visible={showSaveModal} transparent animationType="fade" onRequestClose={handleResume}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={handleResume} />

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {/* Top Title & Icon */}
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: colors.chipBg, borderColor: colors.chipBorder }]}>
              <MaterialCommunityIcons name="sail-boat" size={26} color={colors.accent} />
            </View>
            <View style={styles.headerTitles}>
              <Text style={[styles.title, { color: colors.text }]}>Voyage Completed!</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Save this track to your Trips Logbook</Text>
            </View>
            <Pressable onPress={handleResume} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Voyage Metrics Grid */}
          <View style={[styles.metricsGrid, { backgroundColor: colors.chipBg, borderColor: colors.divider }]}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.text }]}>{formatNm(pendingTripSummary.distanceNm)}</Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>DISTANCE</Text>
            </View>

            <View style={[styles.gridDivider, { backgroundColor: colors.divider }]} />

            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {formatDuration(pendingTripSummary.durationSeconds)}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>DURATION</Text>
            </View>

            <View style={[styles.gridDivider, { backgroundColor: colors.divider }]} />

            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {pendingTripSummary.avgSpeedKnots}{' '}
                <Text style={[styles.metricUnit, { color: colors.textSecondary }]}>kts</Text>
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>AVG SPEED</Text>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Trip Name</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 0, 0, 0.4)',
                  borderColor: colors.divider,
                  color: colors.text,
                },
              ]}
              value={tripName}
              onChangeText={setTripName}
              placeholder="e.g. Veraval Kingfish Run"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Trip Notes & Catch Details (Optional)</Text>
            <TextInput
              style={[
                styles.textInput,
                styles.notesInput,
                {
                  backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 0, 0, 0.4)',
                  borderColor: colors.divider,
                  color: colors.text,
                },
              ]}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. 6 Ghol fish caught at 60m depth, good water clarity"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.btn, styles.saveBtn, { backgroundColor: colors.accent }]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Ionicons name="save-outline" size={18} color={isLight ? '#FFFFFF' : '#020B14'} />
              <Text style={[styles.saveBtnText, { color: isLight ? '#FFFFFF' : '#020B14' }]}>
                {isSaving ? 'SAVING...' : 'SAVE TO LOGBOOK'}
              </Text>
            </Pressable>

            <Pressable style={[styles.btn, styles.discardBtn]} onPress={discardTrip}>
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={styles.discardBtnText}>DISCARD</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 10, 20, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#041728',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.7,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  headerTitles: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 39, 66, 0.75)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    color: '#00F0FF',
    fontSize: 17,
    fontWeight: '800',
  },
  metricUnit: {
    fontSize: 12,
    color: '#93C5FD',
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 3,
    letterSpacing: 0.4,
  },
  gridDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  formGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: 'rgba(8, 28, 48, 0.85)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  notesInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    gap: 6,
  },
  saveBtn: {
    flex: 2,
    backgroundColor: '#0284C7',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  discardBtn: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  discardBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
  },
});
