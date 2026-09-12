import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { MapColors } from '@/constants/map-theme';
import { useWaypoints } from '@/context/waypoints-context';

export function SettingsSheetContent() {
  const { waypoints, resetWaypoints } = useWaypoints();

  // Vessel Profile
  const [boatName, setBoatName] = useState('Sea Hunter');
  const [boatDraft, setBoatDraft] = useState('1.8');
  const [cruiseSpeed, setCruiseSpeed] = useState('12');

  // Units
  const [distanceUnit, setDistanceUnit] = useState<'NM' | 'KM' | 'MI'>('NM');
  const [speedUnit, setSpeedUnit] = useState<'KTS' | 'KMH'>('KTS');
  const [depthUnit, setDepthUnit] = useState<'M' | 'FT'>('M');

  // Alarms
  const [gpsPrecision, setGpsPrecision] = useState(true);
  const [shallowAlarm, setShallowAlarm] = useState(true);
  const [dangerZoneAlarm, setDangerZoneAlarm] = useState(true);
  const [keepAwake, setKeepAwake] = useState(true);

  // Map overlays
  const [showContours, setShowContours] = useState(true);
  const [showSeamarks, setShowSeamarks] = useState(true);

  const handleExportGpx = () => {
    Alert.alert(
      'Export GPX',
      `Exported ${waypoints.length} waypoints successfully to "FishNavPro_Backup.gpx".`,
      [{ text: 'OK' }],
    );
  };

  const handleImportGpx = () => {
    Alert.alert(
      'Import GPX',
      'Select a GPX or KML waypoint file from your device storage.',
      [{ text: 'Browse Files' }, { text: 'Cancel', style: 'cancel' }],
    );
  };

  const handleResetPrompt = () => {
    Alert.alert(
      'Reset Waypoints',
      'This will restore default Arabian Sea fishing spots (Ghol, Tuna, King Fish) and clear custom spots. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Defaults',
          style: 'destructive',
          onPress: async () => {
            await resetWaypoints();
            Alert.alert('Reset Complete', 'Waypoints restored to default.');
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: 110 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Vessel Profile */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>VESSEL & BOAT PROFILE</Text>
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Boat Name</Text>
            <TextInput
              style={styles.textInput}
              value={boatName}
              onChangeText={setBoatName}
              placeholder="e.g. Sea Hunter"
              placeholderTextColor={MapColors.textMuted}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Draft Limit (Meters)</Text>
            <TextInput
              style={[styles.textInput, styles.shortInput]}
              value={boatDraft}
              onChangeText={setBoatDraft}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Cruise Speed (Knots)</Text>
            <TextInput
              style={[styles.textInput, styles.shortInput]}
              value={cruiseSpeed}
              onChangeText={setCruiseSpeed}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      {/* 2. Units */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>UNITS & MEASUREMENTS</Text>
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Distance Unit</Text>
            <View style={styles.toggleRow}>
              {(['NM', 'KM', 'MI'] as const).map((u) => (
                <Pressable
                  key={u}
                  style={[styles.unitBtn, distanceUnit === u && styles.unitBtnActive]}
                  onPress={() => setDistanceUnit(u)}
                >
                  <Text style={[styles.unitBtnText, distanceUnit === u && styles.unitBtnTextActive]}>
                    {u}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Speed Unit</Text>
            <View style={styles.toggleRow}>
              {(['KTS', 'KMH'] as const).map((u) => (
                <Pressable
                  key={u}
                  style={[styles.unitBtn, speedUnit === u && styles.unitBtnActive]}
                  onPress={() => setSpeedUnit(u)}
                >
                  <Text style={[styles.unitBtnText, speedUnit === u && styles.unitBtnTextActive]}>
                    {u}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Depth Unit</Text>
            <View style={styles.toggleRow}>
              {(['M', 'FT'] as const).map((u) => (
                <Pressable
                  key={u}
                  style={[styles.unitBtn, depthUnit === u && styles.unitBtnActive]}
                  onPress={() => setDepthUnit(u)}
                >
                  <Text style={[styles.unitBtnText, depthUnit === u && styles.unitBtnTextActive]}>
                    {u === 'M' ? 'Meters' : 'Feet'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* 3. Safety Alarms */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>NAVIGATION ALARMS & SENSORS</Text>
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.fieldLabel}>High-Precision GPS</Text>
              <Text style={styles.fieldSub}>1-second interval NMEA tracking</Text>
            </View>
            <Switch
              value={gpsPrecision}
              onValueChange={setGpsPrecision}
              trackColor={{ false: '#334155', true: '#0284C7' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.fieldLabel}>Shallow Water Warning</Text>
              <Text style={styles.fieldSub}>Alarm when depth is &lt; {boatDraft}m</Text>
            </View>
            <Switch
              value={shallowAlarm}
              onValueChange={setShallowAlarm}
              trackColor={{ false: '#334155', true: '#0284C7' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.fieldLabel}>Arabian Sea Danger Alerts</Text>
              <Text style={styles.fieldSub}>Hazard warnings around coastal rocks</Text>
            </View>
            <Switch
              value={dangerZoneAlarm}
              onValueChange={setDangerZoneAlarm}
              trackColor={{ false: '#334155', true: '#0284C7' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.fieldLabel}>Keep Screen Awake</Text>
              <Text style={styles.fieldSub}>Never sleep during active navigation</Text>
            </View>
            <Switch
              value={keepAwake}
              onValueChange={setKeepAwake}
              trackColor={{ false: '#334155', true: '#0284C7' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </View>

      {/* 4. Map Overlays */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>MAP DISPLAY & CHARTS</Text>
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Bathymetric Depth Contours</Text>
            <Switch
              value={showContours}
              onValueChange={setShowContours}
              trackColor={{ false: '#334155', true: '#0284C7' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Nautical Seamarks & Buoys</Text>
            <Switch
              value={showSeamarks}
              onValueChange={setShowSeamarks}
              trackColor={{ false: '#334155', true: '#0284C7' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </View>

      {/* 5. Data & Backup */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>DATA & GPX BACKUP</Text>
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <View>
              <Text style={styles.fieldLabel}>Saved Waypoints</Text>
              <Text style={styles.fieldSub}>{waypoints.length} spots in storage</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.actionsRow}>
            <Pressable style={styles.actionBtn} onPress={handleExportGpx}>
              <Ionicons name="download-outline" size={16} color="#38BDF8" />
              <Text style={styles.actionBtnText}>Export GPX</Text>
            </Pressable>

            <Pressable style={styles.actionBtn} onPress={handleImportGpx}>
              <Ionicons name="cloud-upload-outline" size={16} color="#38BDF8" />
              <Text style={styles.actionBtnText}>Import GPX</Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          <Pressable style={styles.resetBtn} onPress={handleResetPrompt}>
            <Ionicons name="refresh-outline" size={16} color="#EF4444" />
            <Text style={styles.resetBtnText}>Reset Waypoints to Default</Text>
          </Pressable>
        </View>
      </View>

      {/* 6. Emergency VHF */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>MARINE EMERGENCY CHANNELS</Text>
        <View style={[styles.card, { borderColor: 'rgba(239, 68, 68, 0.25)' }]}>
          <View style={styles.emergencyRow}>
            <Ionicons name="radio" size={18} color="#EF4444" />
            <View style={{ flex: 1 }}>
              <Text style={styles.emergencyTitle}>VHF CHANNEL 16</Text>
              <Text style={styles.emergencySub}>International Maritime Distress & Safety</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.emergencyRow}>
            <Ionicons name="call" size={18} color="#22C55E" />
            <View style={{ flex: 1 }}>
              <Text style={styles.emergencyTitle}>COAST GUARD: 1554</Text>
              <Text style={styles.emergencySub}>24x7 Indian Coast Guard Maritime Search & Rescue</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  section: {
    marginBottom: 14,
  },
  sectionHeader: {
    color: MapColors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginLeft: 4,
  },
  card: {
    backgroundColor: MapColors.navyPanel,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  fieldLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  fieldSub: {
    color: MapColors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  switchInfo: {
    flex: 1,
    paddingRight: 10,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 8,
  },
  textInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#FFFFFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    textAlign: 'right',
    minWidth: 110,
  },
  shortInput: {
    minWidth: 60,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 4,
  },
  unitBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  unitBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    borderColor: '#38BDF8',
  },
  unitBtnText: {
    color: MapColors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  unitBtnTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  actionBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  resetBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  emergencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emergencyTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  emergencySub: {
    color: MapColors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
});
