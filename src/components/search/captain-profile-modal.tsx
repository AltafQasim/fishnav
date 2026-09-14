import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';
import { useTripTracking } from '@/context/trip-context';
import { useWaypoints } from '@/context/waypoints-context';

type CaptainProfileModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function CaptainProfileModal({ visible, onClose }: CaptainProfileModalProps) {
  const insets = useSafeAreaInsets();
  const { captain, logout } = useAuth();
  const { waypoints } = useWaypoints();
  const { savedTrips } = useTripTracking();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out Vessel',
      'Are you sure you want to sign out and return to the login screen?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            onClose();
            logout();
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

          {/* Top Bar with Close Button */}
          <View style={styles.topBar}>
            <Text style={styles.headerTitle}>Captain & Vessel Dossier</Text>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Captain Hero Header */}
            <View style={styles.heroCard}>
              <View style={styles.avatarWrap}>
                <MaterialCommunityIcons name="ship-wheel" size={32} color="#00F0FF" />
              </View>
              <Text style={styles.captainName}>
                {captain?.name || 'Capt. Vikram Rathore'}
              </Text>
              <View style={styles.rankBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                <Text style={styles.rankText}>LICENSED MASTER MARINER</Text>
              </View>
              <Text style={styles.captainContact}>
                {captain?.emailOrPhone || 'capt.vikram@fishnav.pro'}
              </Text>
            </View>

            {/* Stats Overview */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Ionicons name="location" size={18} color="#00F0FF" />
                <Text style={styles.statVal}>{waypoints.length}</Text>
                <Text style={styles.statLbl}>HOTSPOTS</Text>
              </View>
              <View style={styles.statBox}>
                <MaterialCommunityIcons name="map-marker-path" size={18} color="#38BDF8" />
                <Text style={styles.statVal}>{savedTrips.length}</Text>
                <Text style={styles.statLbl}>VOYAGES</Text>
              </View>
              <View style={styles.statBox}>
                <Ionicons name="navigate" size={18} color="#10B981" />
                <Text style={styles.statVal}>3D FIX</Text>
                <Text style={styles.statLbl}>GPS ACCURACY</Text>
              </View>
            </View>

            {/* Vessel Information Card */}
            <Text style={styles.sectionTitle}>REGISTERED VESSEL TELEMETRY</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Vessel Name</Text>
                <Text style={styles.infoValue}>{captain?.vesselName || 'Sea Hunter II'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Call Sign</Text>
                <Text style={[styles.infoValue, styles.cyanText]}>
                  {captain?.callSign || 'IND-GJ-8821'}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Vessel Class</Text>
                <Text style={styles.infoValue}>{captain?.vesselType || 'Deep Sea Trawler (42ft)'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Home Harbor</Text>
                <Text style={styles.infoValue}>{captain?.homeHarbor || 'Veraval Fishing Port'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Maritime License</Text>
                <Text style={styles.infoValue}>{captain?.licenseNumber || 'IND-MF-2024-991'}</Text>
              </View>
            </View>

            {/* Offline Data Status */}
            <View style={styles.offlineBox}>
              <Ionicons name="cloud-offline" size={18} color="#10B981" />
              <View style={styles.offlineTextWrap}>
                <Text style={styles.offlineTitle}>Offline Mode Active</Text>
                <Text style={styles.offlineSub}>
                  All waypoints, routes and bathymetric layers are cached locally on this device.
                </Text>
              </View>
            </View>

            {/* Sign Out Button */}
            <Pressable style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              <Text style={styles.logoutText}>SIGN OUT / SWITCH VESSEL</Text>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
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
  heroCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(10, 31, 53, 0.75)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00F0FF',
    marginBottom: 10,
  },
  captainName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  rankText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  captainContact: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(10, 31, 53, 0.75)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statVal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  statLbl: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  infoCard: {
    backgroundColor: 'rgba(10, 31, 53, 0.75)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  cyanText: {
    color: '#00F0FF',
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  offlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  offlineTextWrap: {
    flex: 1,
  },
  offlineTitle: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '700',
  },
  offlineSub: {
    color: '#6EE7B7',
    fontSize: 10,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    marginTop: 4,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
