import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import { useAuth } from '@/context/auth-context';
import { useTripTracking } from '@/context/trip-context';
import { useWaypoints } from '@/context/waypoints-context';

export function SettingsSheetContent() {
  const router = useRouter();
  const { captain, logout } = useAuth();
  const { waypoints, resetWaypoints } = useWaypoints();
  const { savedTrips } = useTripTracking();

  // Vessel Profile
  const [boatName, setBoatName] = useState(captain?.vesselName || 'Sea Hunter II');
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
      'Reset All Waypoints',
      'This will restore standard Gujarat & Arabian Sea marine hotspots. Custom markers will be erased.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to Defaults',
          style: 'destructive',
          onPress: async () => {
            await resetWaypoints();
            Alert.alert('Restored', 'Fishing spots reset to defaults.');
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
      {/* ⚓ Active Captain & Vessel Profile Badge */}
      <View style={styles.captainCard}>
        <View style={styles.captainAvatarWrap}>
          <MaterialCommunityIcons name="shield-account" size={26} color="#00F0FF" />
        </View>
        <View style={styles.captainTextWrap}>
          <Text style={styles.captainName}>
            {captain?.name || 'Capt. Vikram Rathore'}
          </Text>
          <Text style={styles.captainVessel}>
            {captain?.vesselName || 'Sea Hunter II'} • {captain?.callSign || 'IND-GJ-8821'}
          </Text>
        </View>
        <Pressable
          style={styles.logoutBtn}
          onPress={() => {
            Alert.alert(
              'Switch Vessel / Logout',
              'Are you sure you want to sign out and return to the login screen?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: logout },
              ],
            );
          }}
        >
          <Ionicons name="log-out-outline" size={16} color="#EF4444" />
          <Text style={styles.logoutBtnText}>Logout</Text>
        </Pressable>
      </View>

      {/* 🚀 Trips & Recorded Routes Logbook Shortcut */}
      <Pressable
        style={styles.tripsShortcutCard}
        onPress={() => router.push('/trips')}
      >
        <View style={styles.tripsIconWrap}>
          <MaterialCommunityIcons name="map-marker-path" size={24} color="#00F0FF" />
        </View>
        <View style={styles.tripsTextWrap}>
          <Text style={styles.tripsTitle}>Trips & Routes Logbook</Text>
          <Text style={styles.tripsSubtitle}>
            {savedTrips.length} recorded fishing voyages • View tracks on map
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#64748B" />
      </Pressable>

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
    flexGrow: 0,
    flexShrink: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  captainCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    gap: 12,
  },
  captainAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  captainTextWrap: {
    flex: 1,
  },
  captainName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  captainVessel: {
    color: '#38BDF8',
    fontSize: 11,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  tripsShortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#041728',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 240, 255, 0.35)',
    gap: 12,
  },
  tripsIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripsTextWrap: {
    flex: 1,
  },
  tripsTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  tripsSubtitle: {
    color: '#8BA3B8',
    fontSize: 11,
    marginTop: 2,
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
