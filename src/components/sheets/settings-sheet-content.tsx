import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapColors } from '@/constants/map-theme';
import { useAuth } from '@/context/auth-context';
import { useAppTheme } from '@/context/theme-context';
import { useTripTracking } from '@/context/trip-context';
import { useWaypoints } from '@/context/waypoints-context';

export function SettingsSheetContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, setTheme, colors, isLight, isDark, isHighContrast } = useAppTheme();
  const { captain, updateCaptain } = useAuth();
  const { waypoints, resetWaypoints } = useWaypoints();
  const { savedTrips } = useTripTracking();

  // Vessel Profile
  const [boatName, setBoatName] = useState(captain?.vesselName || 'Sea Hunter II');
  const [boatDraft, setBoatDraft] = useState(captain?.boatDraftM || '1.8');
  const [cruiseSpeed, setCruiseSpeed] = useState(captain?.cruiseSpeedKnots || '12');

  // Sync state if captain changes from profile modal
  useEffect(() => {
    if (captain) {
      if (captain.vesselName) setBoatName(captain.vesselName);
      if (captain.boatDraftM) setBoatDraft(captain.boatDraftM);
      if (captain.cruiseSpeedKnots) setCruiseSpeed(captain.cruiseSpeedKnots);
    }
  }, [captain]);

  const handleSaveVessel = () => {
    if (!boatName.trim()) {
      Alert.alert('Required Field', 'Please enter a valid boat name.');
      return;
    }
    updateCaptain({
      vesselName: boatName.trim(),
      boatDraftM: boatDraft.trim(),
      cruiseSpeedKnots: cruiseSpeed.trim(),
    });
    Alert.alert('Vessel Saved', 'Boat specifications updated successfully.');
  };

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
      'Are you sure you want to reset your saved waypoints back to factory fishing spots? Any custom spots will be cleared.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetWaypoints },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom, 20) + 110 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* 🚀 Trips & Recorded Routes Logbook Shortcut */}
      <Pressable
        style={[
          styles.tripsShortcutCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          },
        ]}
        onPress={() => router.push('/trips')}
      >
        <View style={[styles.tripsIconWrap, { backgroundColor: colors.chipBg }]}>
          <MaterialCommunityIcons name="map-marker-path" size={24} color={colors.accent} />
        </View>
        <View style={styles.tripsTextWrap}>
          <Text style={[styles.tripsTitle, { color: colors.text }]}>Trips & Routes Logbook</Text>
          <Text style={[styles.tripsSubtitle, { color: colors.textSecondary }]}>
            {savedTrips.length} recorded fishing voyages • View tracks on map
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Pressable>

      {/* 🎨 APP THEME: HIGH CONTRAST / DARK / LIGHT */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeader, { color: colors.accent }]}>
            APP THEME
          </Text>
          <View style={[styles.badgeTheme, { backgroundColor: colors.chipBg, borderColor: colors.chipBorder }]}>
            <Text style={[styles.badgeThemeText, { color: colors.accent }]}>
              {theme === 'high-contrast' ? 'HIGH CONTRAST' : 'LIGHT MODE'}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>

          <View style={styles.themesList}>
            {(
              [
                {
                  id: 'high-contrast' as const,
                  name: 'High Contrast',
                  tag: 'CURRENT MARINE',
                  desc: 'Signature oceanic neon: deep abyss with glowing cyan & maximum water legibility',
                  icon: 'contrast' as const,
                  accentColor: '#00F0FF',
                  bgColor: 'rgba(0, 240, 255, 0.15)',
                  badge: 'CURRENT',
                },
                {
                  id: 'light' as const,
                  name: 'Light Theme',
                  tag: 'DAYLIGHT NAUTICAL',
                  desc: 'Clean, high-luminance white & daylight charts for bright outdoor sunlight',
                  icon: 'sunny' as const,
                  accentColor: '#0284C7',
                  bgColor: 'rgba(2, 132, 199, 0.15)',
                  badge: 'DAYLIGHT',
                },
              ]
            ).map((item) => {
              const isSelected = theme === item.id;
              return (
                <Pressable
                  key={item.id}
                  style={[
                    styles.themeItem,
                    {
                      backgroundColor: isSelected
                        ? colors.chipBg
                        : isLight
                          ? '#F8FAFC'
                          : '#041728',
                      borderColor: isSelected ? item.accentColor : colors.divider,
                    },
                    isSelected && styles.themeItemSelected,
                  ]}
                  onPress={() => setTheme(item.id)}
                >
                  <View
                    style={[
                      styles.themeIconCircle,
                      {
                        backgroundColor: item.bgColor,
                        borderColor: isSelected ? item.accentColor : 'transparent',
                      },
                    ]}
                  >
                    <Ionicons name={item.icon} size={22} color={item.accentColor} />
                  </View>

                  <View style={styles.themeInfoWrap}>
                    <View style={styles.themeTitleRow}>
                      <Text
                        style={[
                          styles.themeTitle,
                          { color: isSelected ? colors.text : colors.textSecondary },
                          isSelected && { fontWeight: '800', color: colors.text },
                        ]}
                      >
                        {item.name}
                      </Text>
                      <View
                        style={[
                          styles.themeTag,
                          {
                            borderColor: isSelected
                              ? item.accentColor
                              : colors.divider,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.themeTagText,
                            { color: isSelected ? item.accentColor : colors.textMuted },
                          ]}
                        >
                          {item.badge}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.themeDesc, { color: colors.textMuted }]}>{item.desc}</Text>
                  </View>

                  <View
                    style={[
                      styles.themeRadio,
                      { borderColor: isSelected ? item.accentColor : colors.textMuted },
                      isSelected && { backgroundColor: item.bgColor },
                    ]}
                  >
                    {isSelected && <View style={[styles.themeRadioDot, { backgroundColor: item.accentColor }]} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* 1. Vessel Profile */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>VESSEL & BOAT PROFILE</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Boat Name</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 0, 0, 0.3)',
                  borderColor: colors.divider,
                  color: colors.text,
                },
              ]}
              value={boatName}
              onChangeText={setBoatName}
              placeholder="e.g. Sea Hunter"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Draft Limit (Meters)</Text>
            <TextInput
              style={[
                styles.textInput,
                styles.shortInput,
                {
                  backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 0, 0, 0.3)',
                  borderColor: colors.divider,
                  color: colors.text,
                },
              ]}
              value={boatDraft}
              onChangeText={setBoatDraft}
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Cruise Speed (Knots)</Text>
            <TextInput
              style={[
                styles.textInput,
                styles.shortInput,
                {
                  backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 0, 0, 0.3)',
                  borderColor: colors.divider,
                  color: colors.text,
                },
              ]}
              value={cruiseSpeed}
              onChangeText={setCruiseSpeed}
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <Pressable style={[styles.saveVesselBtn, { backgroundColor: colors.accent }]} onPress={handleSaveVessel}>
            <Ionicons name="checkmark-circle" size={16} color={isLight ? '#FFFFFF' : '#020B14'} />
            <Text style={[styles.saveVesselBtnText, { color: isLight ? '#FFFFFF' : '#020B14' }]}>
              Save Vessel Specs
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 2. Units */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>UNITS & MEASUREMENTS</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Distance Unit</Text>
            <View style={styles.toggleRow}>
              {(['NM', 'KM', 'MI'] as const).map((u) => (
                <Pressable
                  key={u}
                  style={[
                    styles.unitBtn,
                    {
                      backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.06)',
                      borderColor: colors.divider,
                    },
                    distanceUnit === u && {
                      backgroundColor: colors.chipBg,
                      borderColor: colors.accent,
                    },
                  ]}
                  onPress={() => setDistanceUnit(u)}
                >
                  <Text
                    style={[
                      styles.unitBtnText,
                      { color: colors.textSecondary },
                      distanceUnit === u && { color: colors.accent, fontWeight: '700' },
                    ]}
                  >
                    {u}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Speed Unit</Text>
            <View style={styles.toggleRow}>
              {(['KTS', 'KMH'] as const).map((u) => (
                <Pressable
                  key={u}
                  style={[
                    styles.unitBtn,
                    {
                      backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.06)',
                      borderColor: colors.divider,
                    },
                    speedUnit === u && {
                      backgroundColor: colors.chipBg,
                      borderColor: colors.accent,
                    },
                  ]}
                  onPress={() => setSpeedUnit(u)}
                >
                  <Text
                    style={[
                      styles.unitBtnText,
                      { color: colors.textSecondary },
                      speedUnit === u && { color: colors.accent, fontWeight: '700' },
                    ]}
                  >
                    {u}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Depth Unit</Text>
            <View style={styles.toggleRow}>
              {(['M', 'FT'] as const).map((u) => (
                <Pressable
                  key={u}
                  style={[
                    styles.unitBtn,
                    {
                      backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.06)',
                      borderColor: colors.divider,
                    },
                    depthUnit === u && {
                      backgroundColor: colors.chipBg,
                      borderColor: colors.accent,
                    },
                  ]}
                  onPress={() => setDepthUnit(u)}
                >
                  <Text
                    style={[
                      styles.unitBtnText,
                      { color: colors.textSecondary },
                      depthUnit === u && { color: colors.accent, fontWeight: '700' },
                    ]}
                  >
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
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>NAVIGATION ALARMS & SENSORS</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.fieldRow}>
            <View style={styles.switchInfo}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>High-Precision GPS</Text>
              <Text style={[styles.fieldSub, { color: colors.textSecondary }]}>1-second interval NMEA tracking</Text>
            </View>
            <Switch
              value={gpsPrecision}
              onValueChange={setGpsPrecision}
              trackColor={{ false: isLight ? '#CBD5E1' : '#334155', true: colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.fieldRow}>
            <View style={styles.switchInfo}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Shallow Water Warning</Text>
              <Text style={[styles.fieldSub, { color: colors.textSecondary }]}>Alarm when depth is &lt; {boatDraft}m</Text>
            </View>
            <Switch
              value={shallowAlarm}
              onValueChange={setShallowAlarm}
              trackColor={{ false: isLight ? '#CBD5E1' : '#334155', true: colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.fieldRow}>
            <View style={styles.switchInfo}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Arabian Sea Danger Alerts</Text>
              <Text style={[styles.fieldSub, { color: colors.textSecondary }]}>Hazard warnings around coastal rocks</Text>
            </View>
            <Switch
              value={dangerZoneAlarm}
              onValueChange={setDangerZoneAlarm}
              trackColor={{ false: isLight ? '#CBD5E1' : '#334155', true: colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.fieldRow}>
            <View style={styles.switchInfo}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Keep Screen Awake</Text>
              <Text style={[styles.fieldSub, { color: colors.textSecondary }]}>Never sleep during active navigation</Text>
            </View>
            <Switch
              value={keepAwake}
              onValueChange={setKeepAwake}
              trackColor={{ false: isLight ? '#CBD5E1' : '#334155', true: colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </View>

      {/* 4. Map Overlays */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>MAP DISPLAY & CHARTS</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Bathymetric Depth Contours</Text>
            <Switch
              value={showContours}
              onValueChange={setShowContours}
              trackColor={{ false: isLight ? '#CBD5E1' : '#334155', true: colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Nautical Seamarks & Buoys</Text>
            <Switch
              value={showSeamarks}
              onValueChange={setShowSeamarks}
              trackColor={{ false: isLight ? '#CBD5E1' : '#334155', true: colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </View>

      {/* 5. Data & Backup */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>DATA & GPX BACKUP</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.fieldRow}>
            <View>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Saved Waypoints</Text>
              <Text style={[styles.fieldSub, { color: colors.textSecondary }]}>{waypoints.length} spots in storage</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.chipBg, borderColor: colors.chipBorder }]}
              onPress={handleExportGpx}
            >
              <Ionicons name="download-outline" size={16} color={colors.accent} />
              <Text style={[styles.actionBtnText, { color: colors.accent }]}>Export GPX</Text>
            </Pressable>

            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.chipBg, borderColor: colors.chipBorder }]}
              onPress={handleImportGpx}
            >
              <Ionicons name="cloud-upload-outline" size={16} color={colors.accent} />
              <Text style={[styles.actionBtnText, { color: colors.accent }]}>Import GPX</Text>
            </Pressable>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <Pressable style={styles.resetBtn} onPress={handleResetPrompt}>
            <Ionicons name="refresh-outline" size={16} color="#EF4444" />
            <Text style={styles.resetBtnText}>Reset Waypoints to Default</Text>
          </Pressable>
        </View>
      </View>

      {/* 6. Emergency VHF */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>MARINE EMERGENCY CHANNELS</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: 'rgba(239, 68, 68, 0.25)' }]}>
          <View style={styles.emergencyRow}>
            <Ionicons name="radio" size={18} color="#EF4444" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.emergencyTitle, { color: colors.text }]}>VHF CHANNEL 16</Text>
              <Text style={[styles.emergencySub, { color: colors.textSecondary }]}>
                International Maritime Distress & Safety
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.emergencyRow}>
            <Ionicons name="call" size={18} color="#22C55E" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.emergencyTitle, { color: colors.text }]}>COAST GUARD: 1554</Text>
              <Text style={[styles.emergencySub, { color: colors.textSecondary }]}>
                24x7 Indian Coast Guard Maritime Search & Rescue
              </Text>
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
  saveVesselBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00F0FF',
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 6,
    gap: 6,
  },
  saveVesselBtnText: {
    color: '#020B14',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeTheme: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeThemeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  themeSubtitle: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  themesList: {
    gap: 10,
  },
  themeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  themeItemSelected: {
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  themeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  themeInfoWrap: {
    flex: 1,
  },
  themeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  themeTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  themeTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  themeTagText: {
    fontSize: 9,
    fontWeight: '800',
  },
  themeDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  themeRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
