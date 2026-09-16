import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogoutConfirmModal } from '@/components/auth/logout-confirm-modal';
import { GoogleLogoSvg } from '@/components/ui/google-logo-svg';
import { useAuth } from '@/context/auth-context';
import { useAppTheme } from '@/context/theme-context';
import { useTripTracking } from '@/context/trip-context';
import { useWaypoints } from '@/context/waypoints-context';

type CaptainProfileModalProps = {
  visible: boolean;
  onClose: () => void;
};

const CAPTAIN_PHOTO_PRESETS = [
  {
    id: 'mariner-1',
    title: 'Master Mariner',
    desc: 'Peaked Cap & Uniform',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=faces',
  },
  {
    id: 'navigator-2',
    title: 'Chart Navigator',
    desc: 'Offshore Bridge Watch',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=faces',
  },
  {
    id: 'skipper-3',
    title: 'Arabian Sea Skipper',
    desc: 'Coastal Deep Waters',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=faces',
  },
  {
    id: 'trawler-4',
    title: 'Trawler Captain',
    desc: 'Experienced Fleet Master',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=faces',
  },
  {
    id: 'officer-5',
    title: 'Deck Officer',
    desc: 'Nautical Navigation',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop&crop=faces',
  },
  {
    id: 'fisher-6',
    title: 'Commercial Fisher',
    desc: 'Marine Harvest Chief',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces',
  },
];

const VESSEL_TYPE_OPTIONS = [
  'Deep Sea Trawler (42ft)',
  'Gillnetter & Longliner',
  'Fiberglass Speedboat (OBM)',
  'Purse Seiner (60ft)',
  'Traditional Dhow / Vahan',
  'Marine Patrol / Workboat',
];

const HARBOR_OPTIONS = [
  'Veraval Fishing Port, Gujarat',
  'Porbandar Coastal Harbor, Gujarat',
  'Mangrol Fish Landing, Gujarat',
  'Okha Port, Gujarat',
  'Diu Marine Harbor',
  'Sassoon Dock, Mumbai',
  'Kochi Harbor, Kerala',
];

export function CaptainProfileModal({ visible, onClose }: CaptainProfileModalProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isLight } = useAppTheme();
  const { captain, logout, updateCaptain } = useAuth();
  const { waypoints } = useWaypoints();
  const { savedTrips } = useTripTracking();

  const handleOpenTrips = () => {
    onClose();
    router.push('/trips');
  };

  // Sub-modals state
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [showVesselEditor, setShowVesselEditor] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Vessel Edit Form State
  const [editCaptainName, setEditCaptainName] = useState(captain?.name || '');
  const [editVesselName, setEditVesselName] = useState(captain?.vesselName || '');
  const [editVesselType, setEditVesselType] = useState(captain?.vesselType || '');
  const [editCallSign, setEditCallSign] = useState(captain?.callSign || '');
  const [editHomeHarbor, setEditHomeHarbor] = useState(captain?.homeHarbor || '');
  const [editLicenseNumber, setEditLicenseNumber] = useState(captain?.licenseNumber || '');
  const [editBoatLength, setEditBoatLength] = useState(captain?.boatLengthM || '24.5');
  const [editBoatDraft, setEditBoatDraft] = useState(captain?.boatDraftM || '1.8');
  const [editCruiseSpeed, setEditCruiseSpeed] = useState(captain?.cruiseSpeedKnots || '12');

  // Custom Photo URL state
  const [customPhotoInput, setCustomPhotoInput] = useState('');

  // Sync form when captain changes or modal opens
  useEffect(() => {
    if (captain) {
      setEditCaptainName(captain.name || '');
      setEditVesselName(captain.vesselName || '');
      setEditVesselType(captain.vesselType || '');
      setEditCallSign(captain.callSign || '');
      setEditHomeHarbor(captain.homeHarbor || '');
      setEditLicenseNumber(captain.licenseNumber || '');
      setEditBoatLength(captain.boatLengthM || '24.5');
      setEditBoatDraft(captain.boatDraftM || '1.8');
      setEditCruiseSpeed(captain.cruiseSpeedKnots || '12');
    }
  }, [captain, visible]);

  // Handle Save Vessel Details
  const handleSaveVesselSpecs = () => {
    if (!editVesselName.trim()) {
      Alert.alert('Required Field', 'Please enter a valid vessel / boat name.');
      return;
    }

    updateCaptain({
      name: editCaptainName.trim() || captain?.name,
      vesselName: editVesselName.trim(),
      vesselType: editVesselType.trim() || 'Commercial Fishing Vessel',
      callSign: editCallSign.trim() || 'IND-GJ-8821',
      homeHarbor: editHomeHarbor.trim() || 'Veraval Fishing Port',
      licenseNumber: editLicenseNumber.trim() || 'IND-MF-2026-991',
      boatLengthM: editBoatLength.trim(),
      boatDraftM: editBoatDraft.trim(),
      cruiseSpeedKnots: editCruiseSpeed.trim(),
    });

    setShowVesselEditor(false);
    Alert.alert('Vessel Updated', 'Boat specifications and telemetry updated successfully.');
  };

  // Handle Pick from Device Gallery / File upload
  const handlePickDeviceImage = () => {
    if (typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (dataUrl) {
              updateCaptain({ avatarUrl: dataUrl });
              setShowPhotoPicker(false);
              Alert.alert('Photo Updated', 'Profile photo uploaded from device.');
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      Alert.alert('Select Photo', 'Choose from the maritime captain presets below.');
    }
  };

  // Handle Apply Custom Photo URL
  const handleApplyCustomUrl = () => {
    if (!customPhotoInput.trim()) return;
    updateCaptain({ avatarUrl: customPhotoInput.trim() });
    setCustomPhotoInput('');
    setShowPhotoPicker(false);
    Alert.alert('Photo Updated', 'Custom profile photo URL applied.');
  };

  // Handle Reset Photo to Default Wheel
  const handleResetPhoto = () => {
    updateCaptain({ avatarUrl: undefined });
    setShowPhotoPicker(false);
    Alert.alert('Photo Reset', 'Avatar restored to standard nautical wheel icon.');
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const isGoogle = captain?.authProvider === 'google';
  const isPhone = captain?.authProvider === 'phone';

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
              borderColor: colors.cardBorder,
              paddingBottom: Math.max(insets.bottom, 20) + 12,
            },
          ]}
        >
          <View
            style={[
              styles.dragHandle,
              { backgroundColor: isLight ? '#CBD5E1' : 'rgba(255, 255, 255, 0.3)' },
            ]}
          />

          {/* Top Bar with Close Button */}
          <View style={[styles.topBar, { borderBottomColor: colors.divider }]}>
            <View style={styles.topBarLeft}>
              <MaterialCommunityIcons name="badge-account-horizontal" size={22} color={colors.accent} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>Captain & Vessel Dossier</Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={[styles.closeBtn, { backgroundColor: colors.chipBg }]}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. CAPTAIN HERO HEADER WITH PHOTO & CAMERA BADGE */}
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: isLight ? '#F8FAFC' : 'rgba(10, 31, 53, 0.75)',
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <View style={styles.avatarContainer}>
                <Pressable
                  style={[
                    styles.avatarWrap,
                    {
                      borderColor: colors.accent,
                      backgroundColor: colors.chipBg,
                    },
                  ]}
                  onPress={() => setShowPhotoPicker(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Change profile photo"
                >
                  {captain?.avatarUrl ? (
                    <Image source={{ uri: captain.avatarUrl }} style={styles.avatarImg} />
                  ) : (
                    <MaterialCommunityIcons name="ship-wheel" size={38} color={colors.accent} />
                  )}
                </Pressable>

                {/* Floating Camera Edit Badge */}
                <Pressable
                  style={[styles.cameraBadge, { backgroundColor: colors.accent, borderColor: colors.surface }]}
                  onPress={() => setShowPhotoPicker(true)}
                  hitSlop={8}
                >
                  <Ionicons name="camera" size={14} color="#020B14" />
                </Pressable>
              </View>

              <Text style={[styles.captainName, { color: colors.text }]}>
                {captain?.name || 'Capt. Vikram Rathore'}
              </Text>
              <View style={styles.rankBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                <Text style={styles.rankText}>LICENSED MASTER MARINER</Text>
              </View>
              <Text style={[styles.captainContact, { color: colors.textSecondary }]}>
                {captain?.emailOrPhone || '+91 98765 43210'}
              </Text>

              <Pressable
                style={styles.changePhotoLink}
                onPress={() => setShowPhotoPicker(true)}
              >
                <Ionicons name="image-outline" size={13} color={colors.accent} />
                <Text style={[styles.changePhotoText, { color: colors.accent }]}>Change Profile Photo</Text>
              </Pressable>
            </View>

            {/* Stats Overview */}
            <View style={styles.statsRow}>
              <View
                style={[
                  styles.statBox,
                  {
                    backgroundColor: isLight ? '#F8FAFC' : 'rgba(10, 31, 53, 0.75)',
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Ionicons name="location" size={18} color={colors.accent} />
                <Text style={[styles.statVal, { color: colors.text }]}>{waypoints.length}</Text>
                <Text style={[styles.statLbl, { color: colors.textMuted }]}>HOTSPOTS</Text>
              </View>
              <Pressable
                style={[
                  styles.statBox,
                  {
                    backgroundColor: isLight ? '#F8FAFC' : 'rgba(10, 31, 53, 0.75)',
                    borderColor: colors.cardBorder,
                  },
                ]}
                onPress={handleOpenTrips}
              >
                <MaterialCommunityIcons name="map-marker-path" size={18} color="#38BDF8" />
                <Text style={[styles.statVal, { color: colors.text }]}>{savedTrips.length}</Text>
                <Text style={[styles.statLbl, { color: colors.textMuted }]}>VOYAGES ›</Text>
              </Pressable>
              <View
                style={[
                  styles.statBox,
                  {
                    backgroundColor: isLight ? '#F8FAFC' : 'rgba(10, 31, 53, 0.75)',
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Ionicons name="navigate" size={18} color="#10B981" />
                <Text style={[styles.statVal, { color: colors.text }]}>3D FIX</Text>
                <Text style={[styles.statLbl, { color: colors.textMuted }]}>GPS LOCK</Text>
              </View>
            </View>

            {/* 🚀 TRIPS & ROUTES LOGBOOK SHORTCUT */}
            <Pressable
              style={[
                styles.tripsShortcutCard,
                {
                  backgroundColor: isLight ? '#F8FAFC' : 'rgba(10, 31, 53, 0.75)',
                  borderColor: colors.cardBorder,
                },
              ]}
              onPress={handleOpenTrips}
            >
              <View
                style={[
                  styles.tripsIconWrap,
                  {
                    backgroundColor: isLight ? '#E0F2FE' : 'rgba(0, 240, 255, 0.12)',
                    borderColor: isLight ? '#BAE6FD' : 'rgba(0, 240, 255, 0.25)',
                  },
                ]}
              >
                <MaterialCommunityIcons name="map-marker-path" size={22} color={colors.accent} />
              </View>
              <View style={styles.tripsTextWrap}>
                <View style={styles.tripsTitleRow}>
                  <Text style={[styles.tripsTitle, { color: colors.text }]}>Trips & Routes Logbook</Text>
                  <View
                    style={[
                      styles.tripsBadge,
                      {
                        backgroundColor: colors.chipBg,
                        borderColor: colors.chipBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.tripsBadgeText, { color: colors.accent }]}>
                      {savedTrips.length} VOYAGES
                    </Text>
                  </View>
                </View>
                <Text style={[styles.tripsSubtitle, { color: colors.textSecondary }]}>
                  View GPS voyage tracks, distance & backtrack routes
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </Pressable>

            {/* 2. REGISTERED BOAT & VESSEL TELEMETRY */}
            <View style={styles.sectionHeaderBetween}>
              <View style={styles.sectionHeaderLeft}>
                <MaterialCommunityIcons name="sail-boat" size={16} color={colors.accent} />
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>VESSEL & BOAT SPECIFICATIONS</Text>
              </View>

              <Pressable
                style={[styles.editSpecsBtn, { backgroundColor: colors.chipBg, borderColor: colors.chipBorder }]}
                onPress={() => setShowVesselEditor(true)}
              >
                <Ionicons name="create-outline" size={14} color={colors.accent} />
                <Text style={[styles.editSpecsText, { color: colors.accent }]}>Update</Text>
              </Pressable>
            </View>

            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: isLight ? '#F8FAFC' : 'rgba(10, 31, 53, 0.75)',
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Vessel Name</Text>
                <Text style={[styles.infoValue, { color: colors.accent }]}>
                  {captain?.vesselName || 'Sea Hunter II'}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Call Sign / Reg No</Text>
                <Text style={[styles.infoValue, { color: colors.accent }]}>
                  {captain?.callSign || 'IND-GJ-8821'}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Vessel Class</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{captain?.vesselType || 'Deep Sea Trawler (42ft)'}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Home Harbor</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{captain?.homeHarbor || 'Veraval Fishing Port'}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Length & Draft</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {captain?.boatLengthM || '24.5'}m • Draft {captain?.boatDraftM || '1.8'}m
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Cruising Speed</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{captain?.cruiseSpeedKnots || '12'} knots</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Maritime License</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{captain?.licenseNumber || 'IND-MF-2026-991'}</Text>
              </View>
            </View>

            {/* 3. LOGIN & SECURITY CREDENTIALS SECTION */}
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="key-outline" size={15} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>LOGIN & AUTHENTICATION DETAILS</Text>
            </View>

            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: isLight ? '#F8FAFC' : 'rgba(10, 31, 53, 0.75)',
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              {/* Auth Provider Banner */}
              <View style={styles.authProviderRow}>
                <View style={styles.authBadgeLeft}>
                  {isGoogle ? (
                    <View style={styles.providerGoogleBox}>
                      <GoogleLogoSvg size={18} />
                    </View>
                  ) : isPhone ? (
                    <View style={[styles.providerIconBox, { backgroundColor: colors.chipBg }]}>
                      <Ionicons name="call" size={16} color={colors.accent} />
                    </View>
                  ) : (
                    <View style={[styles.providerIconBox, { backgroundColor: 'rgba(251, 191, 36, 0.2)' }]}>
                      <Ionicons name="flash" size={16} color="#FBBF24" />
                    </View>
                  )}
                  <View>
                    <Text style={[styles.authProviderName, { color: colors.text }]}>
                      {isGoogle
                        ? 'Google Sign-In'
                        : isPhone
                          ? 'Mobile Number OTP'
                          : 'Fleet Master Demo Access'}
                    </Text>
                    <Text style={[styles.authProviderSub, { color: colors.textMuted }]}>
                      {captain?.authMethodLabel || 'Authenticated Session'}
                    </Text>
                  </View>
                </View>

                <View style={styles.activePill}>
                  <View style={styles.greenPulse} />
                  <Text style={styles.activeText}>VERIFIED</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Account Identifier</Text>
                <Text style={[styles.infoValue, { color: colors.accent }]}>
                  {captain?.emailOrPhone || '+91 98765 43210'}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Session Started</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {captain?.loginAt || 'Today, Active'}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Account Security</Text>
                <View style={styles.securityBadge}>
                  <Ionicons name="shield-checkmark-outline" size={13} color="#10B981" />
                  <Text style={styles.securityText}>256-Bit Marine Key</Text>
                </View>
              </View>
            </View>

            {/* Offline Data Status */}
            <View
              style={[
                styles.offlineBox,
                {
                  backgroundColor: isLight ? '#F0FDF4' : 'rgba(16, 185, 129, 0.08)',
                  borderColor: isLight ? '#BBF7D0' : 'rgba(16, 185, 129, 0.25)',
                },
              ]}
            >
              <Ionicons name="cloud-offline" size={18} color="#10B981" />
              <View style={styles.offlineTextWrap}>
                <Text style={[styles.offlineTitle, { color: isLight ? '#166534' : '#10B981' }]}>
                  Offline Mode Active
                </Text>
                <Text style={[styles.offlineSub, { color: isLight ? '#15803D' : '#6EE7B7' }]}>
                  All waypoints, routes and bathymetric layers are cached locally on this device.
                </Text>
              </View>
            </View>

            {/* Sign Out Button */}
            <Pressable
              style={[
                styles.logoutBtn,
                {
                  backgroundColor: isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.12)',
                  borderColor: isLight ? '#FCA5A5' : 'rgba(239, 68, 68, 0.35)',
                },
              ]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              <Text style={styles.logoutText}>SIGN OUT / SWITCH ACCOUNT</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>

      {/* 🟢 MODAL A: PROFILE PHOTO SELECTOR */}
      <Modal
        visible={showPhotoPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPhotoPicker(false)}
      >
        <View style={styles.subModalBackdrop}>
          <Pressable
            style={styles.backdropTouch}
            onPress={() => setShowPhotoPicker(false)}
          />

          <View
            style={[
              styles.subModalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
                paddingBottom: Math.max(insets.bottom, 20) + 12,
              },
            ]}
          >
            <View
              style={[
                styles.dragHandle,
                { backgroundColor: isLight ? '#CBD5E1' : 'rgba(255, 255, 255, 0.3)' },
              ]}
            />

            <View style={[styles.subModalHeader, { borderBottomColor: colors.divider }]}>
              <View style={styles.topBarLeft}>
                <Ionicons name="camera" size={20} color={colors.accent} />
                <Text style={[styles.subModalTitle, { color: colors.text }]}>Choose Profile Photo</Text>
              </View>
              <Pressable
                onPress={() => setShowPhotoPicker(false)}
                hitSlop={10}
                style={[styles.closeBtn, { backgroundColor: colors.chipBg }]}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Option 1: Pick from Device / Gallery */}
              <Pressable
                style={[
                  styles.uploadBtn,
                  {
                    backgroundColor: isLight ? '#F8FAFC' : 'rgba(10, 31, 53, 0.75)',
                    borderColor: colors.cardBorder,
                  },
                ]}
                onPress={handlePickDeviceImage}
              >
                <View style={[styles.uploadIconWrap, { backgroundColor: colors.chipBg }]}>
                  <Ionicons name="cloud-upload" size={22} color={colors.accent} />
                </View>
                <View style={styles.uploadTextWrap}>
                  <Text style={[styles.uploadTitle, { color: colors.text }]}>Choose from Device / Gallery</Text>
                  <Text style={[styles.uploadSub, { color: colors.textSecondary }]}>
                    Select a personal photo from your phone or PC
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>

              {/* Option 2: Curated Maritime Captain Presets */}
              <Text style={[styles.presetSectionTitle, { color: colors.textMuted }]}>
                OR SELECT MARITIME CAPTAIN AVATAR
              </Text>
              <View style={styles.presetsGrid}>
                {CAPTAIN_PHOTO_PRESETS.map((item) => {
                  const isSelected = captain?.avatarUrl === item.url;
                  return (
                    <Pressable
                      key={item.id}
                      style={[
                        styles.presetCard,
                        {
                          backgroundColor: isLight ? '#F8FAFC' : 'rgba(10, 31, 53, 0.75)',
                          borderColor: isSelected ? colors.accent : colors.divider,
                        },
                        isSelected && { backgroundColor: colors.chipBg, borderWidth: 1.5 },
                      ]}
                      onPress={() => {
                        updateCaptain({ avatarUrl: item.url });
                        setShowPhotoPicker(false);
                      }}
                    >
                      <Image source={{ uri: item.url }} style={styles.presetImg} />
                      <View style={styles.presetInfo}>
                        <Text
                          style={[
                            styles.presetName,
                            { color: isSelected ? colors.accent : colors.text },
                          ]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        <Text style={[styles.presetDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                          {item.desc}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Option 3: Custom URL Input */}
              <Text style={[styles.presetSectionTitle, { color: colors.textMuted }]}>OR ENTER IMAGE URL</Text>
              <View style={styles.urlInputRow}>
                <TextInput
                  style={[
                    styles.urlTextInput,
                    {
                      backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 0, 0, 0.35)',
                      borderColor: colors.cardBorder,
                      color: colors.text,
                    },
                  ]}
                  placeholder="https://example.com/captain.jpg"
                  placeholderTextColor={colors.textMuted}
                  value={customPhotoInput}
                  onChangeText={setCustomPhotoInput}
                  autoCapitalize="none"
                />
                <Pressable
                  style={[styles.urlApplyBtn, { backgroundColor: colors.accent }]}
                  onPress={handleApplyCustomUrl}
                >
                  <Text style={styles.urlApplyText}>Apply</Text>
                </Pressable>
              </View>

              {/* Option 4: Reset / Remove Photo */}
              {captain?.avatarUrl && (
                <Pressable style={styles.resetPhotoBtn} onPress={handleResetPhoto}>
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  <Text style={styles.resetPhotoText}>Remove Photo (Use Ship Wheel Icon)</Text>
                </Pressable>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 🟢 MODAL B: EDIT BOAT & VESSEL SPECIFICATIONS */}
      <Modal
        visible={showVesselEditor}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVesselEditor(false)}
      >
        <View style={styles.subModalBackdrop}>
          <Pressable
            style={styles.backdropTouch}
            onPress={() => setShowVesselEditor(false)}
          />

          <View
            style={[
              styles.subModalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
                maxHeight: '92%',
                paddingBottom: Math.max(insets.bottom, 20) + 12,
              },
            ]}
          >
            <View
              style={[
                styles.dragHandle,
                { backgroundColor: isLight ? '#CBD5E1' : 'rgba(255, 255, 255, 0.3)' },
              ]}
            />

            <View style={[styles.subModalHeader, { borderBottomColor: colors.divider }]}>
              <View style={styles.topBarLeft}>
                <MaterialCommunityIcons name="sail-boat" size={22} color={colors.accent} />
                <Text style={[styles.subModalTitle, { color: colors.text }]}>Update Boat & Vessel Specs</Text>
              </View>
              <Pressable
                onPress={() => setShowVesselEditor(false)}
                hitSlop={10}
                style={[styles.closeBtn, { backgroundColor: colors.chipBg }]}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.editorContent}>
              {/* 1. Vessel Name */}
              <View style={styles.editField}>
                <Text style={[styles.editLabel, { color: colors.textSecondary }]}>BOAT / VESSEL NAME</Text>
                <View
                  style={[
                    styles.editInputWrap,
                    {
                      backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 0, 0, 0.35)',
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <MaterialCommunityIcons name="boat" size={18} color={colors.accent} style={styles.editIcon} />
                  <TextInput
                    style={[styles.editTextInput, { color: colors.text }]}
                    placeholder="e.g. Sea Hunter II"
                    placeholderTextColor={colors.textMuted}
                    value={editVesselName}
                    onChangeText={setEditVesselName}
                  />
                </View>
              </View>

              {/* 2. Call Sign / Registration */}
              <View style={styles.editField}>
                <Text style={[styles.editLabel, { color: colors.textSecondary }]}>
                  OFFICIAL REGISTRATION / CALL SIGN
                </Text>
                <View
                  style={[
                    styles.editInputWrap,
                    {
                      backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 0, 0, 0.35)',
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <MaterialCommunityIcons name="radio-handheld" size={18} color="#38BDF8" style={styles.editIcon} />
                  <TextInput
                    style={[styles.editTextInput, { color: colors.text }]}
                    placeholder="e.g. IND-GJ-8821"
                    placeholderTextColor={colors.textMuted}
                    value={editCallSign}
                    onChangeText={setEditCallSign}
                  />
                </View>
              </View>

              {/* 3. Captain Name */}
              <View style={styles.editField}>
                <Text style={[styles.editLabel, { color: colors.textSecondary }]}>CAPTAIN / MASTER NAME</Text>
                <View
                  style={[
                    styles.editInputWrap,
                    {
                      backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 0, 0, 0.35)',
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <Ionicons name="person" size={18} color="#38BDF8" style={styles.editIcon} />
                  <TextInput
                    style={[styles.editTextInput, { color: colors.text }]}
                    placeholder="e.g. Capt. Vikram Rathore"
                    placeholderTextColor={colors.textMuted}
                    value={editCaptainName}
                    onChangeText={setEditCaptainName}
                  />
                </View>
              </View>

              {/* 4. Vessel Type Selector */}
              <View style={styles.editField}>
                <Text style={[styles.editLabel, { color: colors.textSecondary }]}>VESSEL CLASS / TYPE</Text>
                <View
                  style={[
                    styles.editInputWrap,
                    {
                      backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 0, 0, 0.35)',
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <Ionicons name="construct-outline" size={18} color="#38BDF8" style={styles.editIcon} />
                  <TextInput
                    style={[styles.editTextInput, { color: colors.text }]}
                    placeholder="e.g. Deep Sea Trawler (42ft)"
                    placeholderTextColor={colors.textMuted}
                    value={editVesselType}
                    onChangeText={setEditVesselType}
                  />
                </View>
                <View style={styles.chipRow}>
                  {VESSEL_TYPE_OPTIONS.slice(0, 3).map((chip) => (
                    <Pressable
                      key={chip}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.06)',
                          borderColor: colors.divider,
                        },
                      ]}
                      onPress={() => setEditVesselType(chip)}
                    >
                      <Text style={[styles.chipText, { color: colors.textSecondary }]}>{chip.split(' ')[0]}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* 5. Home Harbor Selector */}
              <View style={styles.editField}>
                <Text style={[styles.editLabel, { color: colors.textSecondary }]}>
                  HOME HARBOR / PORT OF REGISTRY
                </Text>
                <View
                  style={[
                    styles.editInputWrap,
                    {
                      backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 0, 0, 0.35)',
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <Ionicons name="anchor" size={18} color="#38BDF8" style={styles.editIcon} />
                  <TextInput
                    style={[styles.editTextInput, { color: colors.text }]}
                    placeholder="e.g. Veraval Fishing Port"
                    placeholderTextColor={colors.textMuted}
                    value={editHomeHarbor}
                    onChangeText={setEditHomeHarbor}
                  />
                </View>
                <View style={styles.chipRow}>
                  {HARBOR_OPTIONS.slice(0, 4).map((chip) => (
                    <Pressable
                      key={chip}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.06)',
                          borderColor: colors.divider,
                        },
                      ]}
                      onPress={() => setEditHomeHarbor(chip)}
                    >
                      <Text style={[styles.chipText, { color: colors.textSecondary }]}>{chip.split(' ')[0]}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* 6. Technical Specs (Length, Draft, Speed) */}
              <View style={styles.tripletRow}>
                <View style={styles.tripletCol}>
                  <Text style={[styles.editLabel, { color: colors.textSecondary }]}>LENGTH (M)</Text>
                  <TextInput
                    style={[
                      styles.tripletInput,
                      {
                        backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 0, 0, 0.35)',
                        borderColor: colors.cardBorder,
                        color: colors.text,
                      },
                    ]}
                    placeholder="24.5"
                    placeholderTextColor={colors.textMuted}
                    value={editBoatLength}
                    onChangeText={setEditBoatLength}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.tripletCol}>
                  <Text style={[styles.editLabel, { color: colors.textSecondary }]}>DRAFT (M)</Text>
                  <TextInput
                    style={[
                      styles.tripletInput,
                      {
                        backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 0, 0, 0.35)',
                        borderColor: colors.cardBorder,
                        color: colors.text,
                      },
                    ]}
                    placeholder="1.8"
                    placeholderTextColor={colors.textMuted}
                    value={editBoatDraft}
                    onChangeText={setEditBoatDraft}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.tripletCol}>
                  <Text style={[styles.editLabel, { color: colors.textSecondary }]}>SPEED (KTS)</Text>
                  <TextInput
                    style={[
                      styles.tripletInput,
                      {
                        backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 0, 0, 0.35)',
                        borderColor: colors.cardBorder,
                        color: colors.text,
                      },
                    ]}
                    placeholder="12"
                    placeholderTextColor={colors.textMuted}
                    value={editCruiseSpeed}
                    onChangeText={setEditCruiseSpeed}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* 7. Maritime License */}
              <View style={styles.editField}>
                <Text style={[styles.editLabel, { color: colors.textSecondary }]}>
                  MARITIME LICENSE / PERMIT NO
                </Text>
                <View
                  style={[
                    styles.editInputWrap,
                    {
                      backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 0, 0, 0.35)',
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <Ionicons name="document-text-outline" size={18} color="#38BDF8" style={styles.editIcon} />
                  <TextInput
                    style={[styles.editTextInput, { color: colors.text }]}
                    placeholder="e.g. IND-MF-2026-991"
                    placeholderTextColor={colors.textMuted}
                    value={editLicenseNumber}
                    onChangeText={setEditLicenseNumber}
                  />
                </View>
              </View>

              {/* Save Specifications Button */}
              <Pressable style={styles.saveBtn} onPress={handleSaveVesselSpecs}>
                <LinearGradient
                  colors={colors.accentGradient || ['#0284C7', '#00F0FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveGradient}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.saveText}>SAVE BOAT SPECIFICATIONS</Text>
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* 🔴 MODAL C: CUSTOM MARITIME LOGOUT CONFIRMATION */}
      <LogoutConfirmModal
        visible={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onClose();
          logout();
        }}
      />
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
    maxHeight: '90%',
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
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    paddingBottom: 24,
    gap: 14,
  },
  heroCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(10, 31, 53, 0.75)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 2.5,
    borderColor: '#00F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#00F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#041728',
  },
  changePhotoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  changePhotoText: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '700',
  },
  captainName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
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
    fontWeight: '600',
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
  tripsShortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 31, 53, 0.75)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    gap: 12,
  },
  tripsIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  tripsTextWrap: {
    flex: 1,
  },
  tripsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tripsTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  tripsBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  tripsBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  tripsSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  editSpecsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  editSpecsText: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: 'rgba(10, 31, 53, 0.75)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  authProviderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  authBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  providerGoogleBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  providerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authProviderName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  authProviderSub: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  greenPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  activeText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
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
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  securityText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
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

  /* SUB-MODAL STYLING */
  subModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 8, 16, 0.85)',
    justifyContent: 'flex-end',
  },
  subModalCard: {
    backgroundColor: '#041728',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    maxHeight: '85%',
    paddingTop: 10,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 30,
  },
  subModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  subModalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#00F0FF',
    gap: 12,
    marginBottom: 16,
  },
  uploadIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTextWrap: {
    flex: 1,
  },
  uploadTitle: {
    color: '#00F0FF',
    fontSize: 13,
    fontWeight: '800',
  },
  uploadSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  presetSectionTitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 2,
  },
  presetsGrid: {
    gap: 8,
    marginBottom: 16,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  presetCardSelected: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderColor: '#00F0FF',
    borderWidth: 1.5,
  },
  presetImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  presetInfo: {
    flex: 1,
  },
  presetName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  presetDesc: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  urlInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  urlTextInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 12,
  },
  urlApplyBtn: {
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urlApplyText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '800',
  },
  resetPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginBottom: 8,
  },
  resetPhotoText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },

  /* VESSEL EDITOR STYLING */
  editorContent: {
    gap: 12,
    paddingBottom: 20,
  },
  editField: {
    gap: 6,
  },
  editLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  editInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 12,
  },
  editIcon: {
    marginRight: 8,
  },
  editTextInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },
  tripletRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tripletCol: {
    flex: 1,
    gap: 6,
  },
  tripletInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  saveBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  saveText: {
    color: '#020B14',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
