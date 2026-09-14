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
import { useTripTracking } from '@/context/trip-context';
import { useWaypoints } from '@/context/waypoints-context';

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

  const handleSosCall = () => {
    Alert.alert(
      '🚨 Maritime Distress Call',
      'Indian Coast Guard Maritime Search & Rescue Hotline: 1554\n\nAre you sure you want to dial emergency rescue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call 1554 (Coast Guard)',
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

        <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, 20) + 12 }]}>
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="apps" size={22} color="#00F0FF" />
              </View>
              <View>
                <Text style={styles.title}>Marine Command Hub</Text>
                <Text style={styles.subtitle}>
                  {captain?.vesselName || 'Sea Hunter II'} • Quick Access & Tools
                </Text>
              </View>
            </View>

            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Quick Metrics Bar */}
            <View style={styles.metricsBar}>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{waypoints.length}</Text>
                <Text style={styles.metricLabel}>WAYPOINTS</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{savedTrips.length}</Text>
                <Text style={styles.metricLabel}>VOYAGES</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>100%</Text>
                <Text style={styles.metricLabel}>OFFLINE</Text>
              </View>
            </View>

            {/* Section: Primary Marine Tools */}
            <Text style={styles.sectionHeader}>PRIMARY NAVIGATION TOOLS</Text>
            <View style={styles.grid}>
              <Pressable
                style={styles.gridCard}
                onPress={() => {
                  onClose();
                  router.push('/trips');
                }}
              >
                <View style={[styles.gridIcon, { backgroundColor: 'rgba(0, 240, 255, 0.15)' }]}>
                  <MaterialCommunityIcons name="map-marker-path" size={22} color="#00F0FF" />
                </View>
                <Text style={styles.gridTitle}>Trips Logbook</Text>
                <Text style={styles.gridSub}>Recorded voyage tracks</Text>
              </Pressable>

              <Pressable
                style={styles.gridCard}
                onPress={() => {
                  onClose();
                  onOpenTab('weather');
                }}
              >
                <View style={[styles.gridIcon, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <Ionicons name="partly-sunny" size={22} color="#38BDF8" />
                </View>
                <Text style={styles.gridTitle}>Weather & Tides</Text>
                <Text style={styles.gridSub}>Wind, swell & tides</Text>
              </Pressable>

              <Pressable
                style={styles.gridCard}
                onPress={() => {
                  onClose();
                  onOpenTab('compass');
                }}
              >
                <View style={[styles.gridIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <MaterialCommunityIcons name="compass" size={22} color="#10B981" />
                </View>
                <Text style={styles.gridTitle}>Marine Compass</Text>
                <Text style={styles.gridSub}>Gyro lubber line</Text>
              </Pressable>

              <Pressable
                style={styles.gridCard}
                onPress={() => {
                  onClose();
                  onOpenTab('calendar');
                }}
              >
                <View style={[styles.gridIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Ionicons name="moon" size={22} color="#F59E0B" />
                </View>
                <Text style={styles.gridTitle}>Solunar Calendar</Text>
                <Text style={styles.gridSub}>Fish feeding activity</Text>
              </Pressable>

              <Pressable
                style={styles.gridCard}
                onPress={() => {
                  onClose();
                  onOpenTab('waypoint');
                }}
              >
                <View style={[styles.gridIcon, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                  <Ionicons name="location" size={22} color="#A78BFA" />
                </View>
                <Text style={styles.gridTitle}>Fishing Spots</Text>
                <Text style={styles.gridSub}>Ghol, Tuna & reefs</Text>
              </Pressable>

              <Pressable
                style={styles.gridCard}
                onPress={() => {
                  onClose();
                  onOpenTab('settings');
                }}
              >
                <View style={[styles.gridIcon, { backgroundColor: 'rgba(148, 163, 184, 0.15)' }]}>
                  <Ionicons name="settings-sharp" size={22} color="#CBD5E1" />
                </View>
                <Text style={styles.gridTitle}>Vessel Profile</Text>
                <Text style={styles.gridSub}>Alarms & telemetry</Text>
              </Pressable>
            </View>

            {/* Section: Chart Actions */}
            <Text style={styles.sectionHeader}>CHART ACTIONS</Text>
            <View style={styles.actionsList}>
              {onOpenCoordsModal && (
                <Pressable
                  style={styles.actionRow}
                  onPress={() => {
                    onClose();
                    onOpenCoordsModal();
                  }}
                >
                  <View style={styles.actionIconWrap}>
                    <Ionicons name="navigate-circle" size={20} color="#00F0FF" />
                  </View>
                  <View style={styles.actionTextWrap}>
                    <Text style={styles.actionTitle}>Go to GPS Coordinates</Text>
                    <Text style={styles.actionSub}>Enter decimal or nautical coordinates</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#64748B" />
                </Pressable>
              )}

              {onOpenLayersModal && (
                <Pressable
                  style={styles.actionRow}
                  onPress={() => {
                    onClose();
                    onOpenLayersModal();
                  }}
                >
                  <View style={styles.actionIconWrap}>
                    <Ionicons name="layers" size={20} color="#38BDF8" />
                  </View>
                  <View style={styles.actionTextWrap}>
                    <Text style={styles.actionTitle}>Map Layers & Nautical Details</Text>
                    <Text style={styles.actionSub}>Satellite, bathymetric contours, seamarks</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#64748B" />
                </Pressable>
              )}
            </View>

            {/* Section: Maritime Emergency SOS */}
            <Pressable style={styles.sosCard} onPress={handleSosCall}>
              <View style={styles.sosIconWrap}>
                <Ionicons name="warning" size={22} color="#EF4444" />
              </View>
              <View style={styles.sosTextWrap}>
                <Text style={styles.sosTitle}>EMERGENCY COAST GUARD SOS</Text>
                <Text style={styles.sosSub}>Toll-free 24x7 Marine Rescue: 1554</Text>
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
