import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapColors } from '@/constants/map-theme';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';
import { useTripTracking } from '@/context/trip-context';
import { useWaypoints } from '@/context/waypoints-context';
import { LanguageDropdown } from '@/components/ui/language-dropdown';

type MoreOptionsModalProps = {
  visible: boolean;
  onClose: () => void;
  onOpenTab: (tab: 'waypoint' | 'weather' | 'compass' | 'calendar' | 'settings') => void;
  onOpenCoordsModal?: () => void;
  onOpenLayersModal?: () => void;
};

export function MoreOptionsModal({
  visible,
  onClose,
  onOpenTab,
  onOpenCoordsModal,
  onOpenLayersModal,
}: MoreOptionsModalProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { captain } = useAuth();
  const { waypoints } = useWaypoints();
  const { savedTrips } = useTripTracking();
  const { colors, activeTheme } = useAppTheme();
  const { t } = useLanguage();
  const isLight = activeTheme === 'light';

  const handleSosCall = () => {
    Alert.alert(
      t('hub.sos_alert_title', '🚨 Maritime Distress Call'),
      t('hub.sos_alert_body', 'Indian Coast Guard Maritime Search & Rescue Hotline: 1554\n\nAre you sure you want to dial emergency rescue?'),
      [
        { text: t('btn.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('hub.sos_call_btn', 'Call 1554 (Coast Guard)'),
          style: 'destructive',
          onPress: () => {
            Linking.openURL('tel:1554').catch(() => {
              Alert.alert('Unable to place call', 'Please dial 1554 manually from your phone.');
            });
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouch} onPress={onClose} />

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 20) + 12,
            },
          ]}>
          <View style={[styles.dragHandle, { backgroundColor: isLight ? '#CBD5E1' : 'rgba(255, 255, 255, 0.3)' }]} />

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: isLight ? '#E0F2FE' : 'rgba(0, 240, 255, 0.12)',
                    borderColor: isLight ? '#BAE6FD' : 'rgba(0, 240, 255, 0.25)',
                  },
                ]}>
                <MaterialCommunityIcons name="apps" size={22} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>{t('hub.title', 'Marine Command Hub')}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {captain?.vesselName || 'Sea Hunter II'} • {t('hub.subtitle', 'Quick Access & Tools')}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={[styles.closeBtn, { backgroundColor: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)' }]}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Quick Metrics Bar */}
            <View
              style={[
                styles.metricsBar,
                {
                  backgroundColor: isLight ? '#F1F5F9' : 'rgba(10, 31, 53, 0.7)',
                  borderColor: colors.border,
                },
              ]}>
              <View style={styles.metricItem}>
                <Text style={[styles.metricVal, { color: colors.accent }]}>{waypoints.length}</Text>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{t('hub.waypoints', 'WAYPOINTS')}</Text>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
              <View style={styles.metricItem}>
                <Text style={[styles.metricVal, { color: colors.accent }]}>{savedTrips.length}</Text>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{t('hub.voyages', 'VOYAGES')}</Text>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
              <View style={styles.metricItem}>
                <Text style={[styles.metricVal, { color: colors.accent }]}>100%</Text>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{t('hub.offline', 'OFFLINE')}</Text>
              </View>
            </View>

            {/* Section: Language Dropdown Selector */}
            <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>{t('hub.language_title', 'APP LANGUAGE')}</Text>
            <View style={{ marginBottom: 12 }}>
              <LanguageDropdown compact />
            </View>

            {/* Section: Primary Marine Tools */}
            <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>{t('hub.primary_tools', 'PRIMARY NAVIGATION TOOLS')}</Text>
            <View style={styles.grid}>
              <Pressable
                style={[
                  styles.gridCard,
                  {
                    backgroundColor: isLight ? '#F8FAFC' : 'rgba(10, 31, 53, 0.7)',
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  onClose();
                  router.push('/trips');
                }}
              >
                <View style={[styles.gridIcon, { backgroundColor: 'rgba(0, 240, 255, 0.15)' }]}>
                  <MaterialCommunityIcons name="map-marker-path" size={22} color="#00F0FF" />
                </View>
                <Text style={[styles.gridTitle, { color: colors.text }]}>{t('hub.trips_log', 'Trips Logbook')}</Text>
                <Text style={[styles.gridSub, { color: colors.textSecondary }]}>{t('hub.trips_log_desc', 'Recorded voyage tracks')}</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.gridCard,
                  {
                    backgroundColor: isLight ? '#F8FAFC' : 'rgba(10, 31, 53, 0.7)',
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  onClose();
                  onOpenTab('weather');
                }}
              >
                <View style={[styles.gridIcon, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <Ionicons name="partly-sunny" size={22} color="#38BDF8" />
                </View>
                <Text style={[styles.gridTitle, { color: colors.text }]}>{t('hub.weather_radar', 'Weather & Tides')}</Text>
                <Text style={[styles.gridSub, { color: colors.textSecondary }]}>{t('hub.weather_radar_desc', 'Wind, swell & tides')}</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.gridCard,
                  {
                    backgroundColor: isLight ? '#F8FAFC' : 'rgba(10, 31, 53, 0.7)',
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  onClose();
                  onOpenTab('compass');
                }}
              >
                <View style={[styles.gridIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <MaterialCommunityIcons name="compass" size={22} color="#10B981" />
                </View>
                <Text style={[styles.gridTitle, { color: colors.text }]}>{t('hub.compass', 'Marine Compass')}</Text>
                <Text style={[styles.gridSub, { color: colors.textSecondary }]}>{t('hub.compass_desc', 'Gyro lubber line')}</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.gridCard,
                  {
                    backgroundColor: isLight ? '#F8FAFC' : 'rgba(10, 31, 53, 0.7)',
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  onClose();
                  onOpenTab('calendar');
                }}
              >
                <View style={[styles.gridIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Ionicons name="moon" size={22} color="#F59E0B" />
                </View>
                <Text style={[styles.gridTitle, { color: colors.text }]}>{t('hub.solunar', 'Solunar Calendar')}</Text>
                <Text style={[styles.gridSub, { color: colors.textSecondary }]}>{t('hub.solunar_desc', 'Fish feeding activity')}</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.gridCard,
                  {
                    backgroundColor: isLight ? '#F8FAFC' : 'rgba(10, 31, 53, 0.7)',
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  onClose();
                  onOpenTab('waypoint');
                }}
              >
                <View style={[styles.gridIcon, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                  <Ionicons name="location" size={22} color="#A78BFA" />
                </View>
                <Text style={[styles.gridTitle, { color: colors.text }]}>{t('hub.spots', 'Fishing Spots')}</Text>
                <Text style={[styles.gridSub, { color: colors.textSecondary }]}>{t('hub.spots_desc', 'Ghol, Tuna & reefs')}</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.gridCard,
                  {
                    backgroundColor: isLight ? '#F8FAFC' : 'rgba(10, 31, 53, 0.7)',
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  onClose();
                  onOpenTab('settings');
                }}
              >
                <View style={[styles.gridIcon, { backgroundColor: 'rgba(148, 163, 184, 0.15)' }]}>
                  <Ionicons name="settings-sharp" size={22} color={isLight ? '#64748B' : '#CBD5E1'} />
                </View>
                <Text style={[styles.gridTitle, { color: colors.text }]}>{t('hub.settings', 'Vessel Profile')}</Text>
                <Text style={[styles.gridSub, { color: colors.textSecondary }]}>{t('hub.settings_desc', 'Alarms & telemetry')}</Text>
              </Pressable>
            </View>

            {/* Section: Chart Actions */}
            <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>{t('map.layers.subtitle', 'CHART ACTIONS')}</Text>
            <View
              style={[
                styles.actionsList,
                {
                  backgroundColor: isLight ? '#F8FAFC' : 'rgba(10, 31, 53, 0.7)',
                  borderColor: colors.border,
                },
              ]}>
              {onOpenCoordsModal && (
                <Pressable
                  style={[styles.actionRow, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    onClose();
                    onOpenCoordsModal();
                  }}
                >
                  <View
                    style={[
                      styles.actionIconWrap,
                      { backgroundColor: isLight ? '#E0F2FE' : 'rgba(255, 255, 255, 0.06)' },
                    ]}>
                    <Ionicons name="navigate-circle" size={20} color={colors.accent} />
                  </View>
                  <View style={styles.actionTextWrap}>
                    <Text style={[styles.actionTitle, { color: colors.text }]}>{t('hub.coords', 'Go to GPS Coordinates')}</Text>
                    <Text style={[styles.actionSub, { color: colors.textSecondary }]}>{t('hub.coords_desc', 'Enter decimal or nautical coordinates')}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </Pressable>
              )}

              {onOpenLayersModal && (
                <Pressable
                  style={[styles.actionRow, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    onClose();
                    onOpenLayersModal();
                  }}
                >
                  <View
                    style={[
                      styles.actionIconWrap,
                      { backgroundColor: isLight ? '#E0F2FE' : 'rgba(255, 255, 255, 0.06)' },
                    ]}>
                    <Ionicons name="layers" size={20} color="#38BDF8" />
                  </View>
                  <View style={styles.actionTextWrap}>
                    <Text style={[styles.actionTitle, { color: colors.text }]}>{t('hub.layers', 'Map Layers & Nautical Details')}</Text>
                    <Text style={[styles.actionSub, { color: colors.textSecondary }]}>{t('hub.layers_desc', 'Satellite, bathymetric contours, seamarks')}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>

            {/* Section: Maritime Emergency SOS */}
            <Pressable
              style={[
                styles.sosCard,
                {
                  backgroundColor: isLight ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.12)',
                  borderColor: isLight ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.35)',
                },
              ]}
              onPress={handleSosCall}>
              <View
                style={[
                  styles.sosIconWrap,
                  {
                    backgroundColor: isLight ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.2)',
                  },
                ]}>
                <Ionicons name="warning" size={22} color="#EF4444" />
              </View>
              <View style={styles.sosTextWrap}>
                <Text style={styles.sosTitle}>{t('hub.sos_title', 'EMERGENCY COAST GUARD SOS')}</Text>
                <Text style={[styles.sosSub, { color: isLight ? '#DC2626' : '#FCA5A5' }]}>
                  {t('hub.sos_desc', 'Toll-free 24x7 Marine Rescue: 1554')}
                </Text>
              </View>
              <Ionicons name="call" size={18} color="#EF4444" />
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 8, 16, 0.75)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  card: {
    backgroundColor: '#041728',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    maxHeight: '85%',
    paddingTop: 10,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 25,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 11,
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
  scroll: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingTop: 14,
    paddingBottom: 20,
    gap: 16,
  },
  metricsBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 31, 53, 0.7)',
    borderRadius: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    color: '#00F0FF',
    fontSize: 17,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  metricDivider: {
    width: 1,
    height: '70%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignSelf: 'center',
  },
  sectionHeader: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCard: {
    width: '48%',
    backgroundColor: 'rgba(10, 31, 53, 0.7)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  gridIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gridTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  gridSub: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  actionsList: {
    backgroundColor: 'rgba(10, 31, 53, 0.7)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  actionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextWrap: {
    flex: 1,
  },
  actionTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  actionSub: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  sosCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    gap: 12,
  },
  sosIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosTextWrap: {
    flex: 1,
  },
  sosTitle: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sosSub: {
    color: '#FCA5A5',
    fontSize: 10,
    marginTop: 2,
  },
});
