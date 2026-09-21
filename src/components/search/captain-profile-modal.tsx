import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
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
import { useLanguage } from '@/context/language-context';
import { useSubscription } from '@/context/subscription-context';
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

export const CaptainProfileModal = ({ visible, onClose }: CaptainProfileModalProps) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, colors, isLight } = useAppTheme();
  const { t } = useLanguage();
  const {
    captain,
    isAuthenticated,
    loginWithGoogle,
    logout,
    updateCaptain,
  } = useAuth();
  const { savedTrips } = useTripTracking();
  const { waypoints } = useWaypoints();

  const handleOpenTrips = () => {
    onClose();
    router.push('/trips');
  };

  const {
    isPro,
    proPlan,
    proDaysRemaining,
    proHoursRemaining,
    proFormattedExpiry,
    proProgressPercent,
    isExpiringSoon,
    licenseCertificateId,
    invoiceNumber,
    hasReferralBonus,
    bonusProDaysRemaining,
    bonusProFormattedExpiry,
    referralCount,
    isTrialActive,
    isTrialExpired,
    trialDaysRemaining,
    trialHoursRemaining,
    trialProgressPercent,
    trialFormattedExpiry,
    referralDaysEarned,
    openProModal,
    openReferralModal,
  } = useSubscription();

  // Sub-modals state
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [showVesselEditor, setShowVesselEditor] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const planDisplayName = useMemo(() => {
    if (proPlan === 'lifetime') return t('pro.lifetime_title', 'Lifetime Skipper Pass');
    if (proPlan === 'quarterly') return t('pro.quarterly_title', 'Quarterly Voyager License');
    return t('pro.annual_title', 'Annual Master Mariner License');
  }, [proPlan, t]);

  const planCostDisplay = useMemo(() => {
    if (proPlan === 'lifetime') return `₹3,999 • ${t('pro.forever', 'One-Time Permanent')}`;
    if (proPlan === 'quarterly') return `₹499 / 3 ${t('pro.months', 'Months')} (₹166/${t('pro.month', 'mo')})`;
    return `₹1,499 / ${t('pro.year', 'Year')} (₹125/${t('pro.month', 'mo')})`;
  }, [proPlan, t]);

  const handleCopyLicenseKey = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(licenseCertificateId);
      }
      Alert.alert('License Copied', `Maritime Certificate ID ${licenseCertificateId} copied to clipboard.`);
    } catch {
      Alert.alert('Certificate ID', licenseCertificateId);
    }
  };

  // Vessel Edit Form State
  const [editCaptainName, setEditCaptainName] = useState(captain?.name || '');
  const [editVesselName, setEditVesselName] = useState(captain?.vesselName || '');
  const [editVesselType, setEditVesselType] = useState(captain?.vesselType || '');
  const [editCallSign, setEditCallSign] = useState(captain?.callSign || '');
  const [editHomeHarbor, setEditHomeHarbor] = useState(captain?.homeHarbor || '');
  const [editLicenseNumber, setEditLicenseNumber] = useState(captain?.licenseNumber || '');
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
    <>
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
              <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile.title', 'Captain & Vessel Dossier')}</Text>
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
                  backgroundColor: isLight ? '#FFFFFF' : 'rgba(10, 31, 53, 0.75)',
                  borderColor: isLight ? '#E2E8F0' : colors.cardBorder,
                  shadowColor: isLight ? '#64748B' : '#00F0FF',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: isLight ? 0.08 : 0.25,
                  shadowRadius: 10,
                  elevation: isLight ? 2 : 4,
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
                  style={[styles.cameraBadge, { backgroundColor: colors.accent, borderColor: isLight ? '#FFFFFF' : colors.surface }]}
                  onPress={() => setShowPhotoPicker(true)}
                  hitSlop={8}
                >
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                </Pressable>
              </View>

              <Text style={[styles.captainName, { color: colors.text }]}>
                {captain?.name || 'Capt. Vikram Rathore'}
              </Text>
              <View style={[styles.rankBadge, isLight && { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}>
                <Ionicons name="shield-checkmark" size={12} color={isLight ? '#16A34A' : '#10B981'} />
                <Text style={[styles.rankText, isLight && { color: '#16A34A' }]}>{t('pro.master_license', 'LICENSED MASTER MARINER')}</Text>
              </View>
              <Text style={[styles.captainContact, { color: colors.textSecondary }]}>
                {captain?.emailOrPhone || '+91 98765 43210'}
              </Text>

              <Pressable
                style={[styles.changePhotoLink, isLight && { backgroundColor: '#E0F2FE' }]}
                onPress={() => setShowPhotoPicker(true)}
              >
                <Ionicons name="image-outline" size={13} color={colors.accent} />
                <Text style={[styles.changePhotoText, { color: colors.accent }]}>{t('profile.choose_photo', 'Change Profile Photo')}</Text>
              </Pressable>
            </View>

            {/* Stats Overview */}
            <View style={styles.statsRow}>
              <View
                style={[
                  styles.statBox,
                  {
                    backgroundColor: isLight ? '#FFFFFF' : 'rgba(10, 31, 53, 0.75)',
                    borderColor: isLight ? '#E2E8F0' : colors.cardBorder,
                    shadowColor: isLight ? '#64748B' : 'transparent',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isLight ? 0.06 : 0,
                    shadowRadius: 6,
                    elevation: isLight ? 2 : 0,
                  },
                ]}
              >
                <Ionicons name="location" size={18} color={colors.accent} />
                <Text style={[styles.statVal, { color: colors.text }]}>{waypoints.length}</Text>
                <Text style={[styles.statLbl, { color: colors.textMuted }]}>{t('waypoints.title', 'HOTSPOTS').toUpperCase()}</Text>
              </View>
              <Pressable
                style={[
                  styles.statBox,
                  {
                    backgroundColor: isLight ? '#FFFFFF' : 'rgba(10, 31, 53, 0.75)',
                    borderColor: isLight ? '#E2E8F0' : colors.cardBorder,
                    shadowColor: isLight ? '#64748B' : 'transparent',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isLight ? 0.06 : 0,
                    shadowRadius: 6,
                    elevation: isLight ? 2 : 0,
                  },
                ]}
                onPress={handleOpenTrips}
              >
                <MaterialCommunityIcons name="map-marker-path" size={18} color={isLight ? colors.accent : '#38BDF8'} />
                <Text style={[styles.statVal, { color: colors.text }]}>{savedTrips.length}</Text>
                <Text style={[styles.statLbl, { color: colors.textMuted }]}>{t('tab.trips', 'VOYAGES').toUpperCase()} ›</Text>
              </Pressable>
              <View
                style={[
                  styles.statBox,
                  {
                    backgroundColor: isLight ? '#FFFFFF' : 'rgba(10, 31, 53, 0.75)',
                    borderColor: isLight ? '#E2E8F0' : colors.cardBorder,
                    shadowColor: isLight ? '#64748B' : 'transparent',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isLight ? 0.06 : 0,
                    shadowRadius: 6,
                    elevation: isLight ? 2 : 0,
                  },
                ]}
              >
                <Ionicons name="navigate" size={18} color={isLight ? '#16A34A' : '#10B981'} />
                <Text style={[styles.statVal, { color: colors.text }]}>3D FIX</Text>
                <Text style={[styles.statLbl, { color: colors.textMuted }]}>{t('overlay.gps', 'GPS LOCK').toUpperCase()}</Text>
              </View>
            </View>

            {/* 👑 PRO MEMBERSHIP & VESSEL LICENSE MANAGEMENT */}
            <View style={styles.sectionHeaderBetween}>
              <View style={styles.sectionHeaderLeft}>
                <MaterialCommunityIcons name="crown" size={18} color="#F59E0B" />
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  {t('pro.title', 'PRO MEMBERSHIP')} & {t('settings.vessel', 'VESSEL LICENSE')}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadgePill,
                  {
                    backgroundColor: isPro
                      ? 'rgba(245, 158, 11, 0.15)'
                      : hasReferralBonus
                        ? 'rgba(34, 197, 94, 0.15)'
                        : isTrialExpired
                          ? 'rgba(239, 68, 68, 0.15)'
                          : 'rgba(0, 240, 255, 0.12)',
                    borderColor: isPro
                      ? '#F59E0B'
                      : hasReferralBonus
                        ? '#22C55E'
                        : isTrialExpired
                          ? '#EF4444'
                          : colors.accent,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgePillText,
                    {
                      color: isPro
                        ? '#F59E0B'
                        : hasReferralBonus
                          ? '#22C55E'
                          : isTrialExpired
                            ? '#EF4444'
                            : colors.accent,
                    },
                  ]}
                >
                  {isPro
                    ? 'PRO ACTIVE 👑'
                    : hasReferralBonus
                      ? `${bonusProDaysRemaining}D BONUS 🎁`
                      : isTrialExpired
                        ? 'TRIAL EXPIRED 🚨'
                        : `${trialDaysRemaining}D TRIAL ⚡`}
                </Text>
              </View>
            </View>

            {/* Pro Plan Card: Same Modern HUD Console As Settings */}
            <View
              style={[
                styles.proCardContainer,
                {
                  backgroundColor: isLight ? '#FFFFFF' : colors.card,
                  borderColor: isPro
                    ? isExpiringSoon
                      ? '#EF4444'
                      : isLight
                        ? '#FDE68A'
                        : 'rgba(245, 158, 11, 0.35)'
                    : hasReferralBonus
                      ? isLight
                        ? '#BBF7D0'
                        : 'rgba(34, 197, 94, 0.35)'
                      : isTrialExpired
                        ? '#EF4444'
                        : isLight
                          ? '#BAE6FD'
                          : colors.accent,
                  shadowColor: isPro ? '#F59E0B' : '#00F0FF',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isLight ? 0.08 : 0.25,
                  shadowRadius: 10,
                  elevation: 4,
                },
              ]}
            >
              {/* Top Stripe */}
              <LinearGradient
                colors={
                  isPro
                    ? ['#F59E0B', '#FBBF24']
                    : hasReferralBonus
                      ? ['#22C55E', '#4ADE80']
                      : ['#00F0FF', '#38BDF8']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cardTopStripe}
              />

              {/* Membership Row */}
              <View style={styles.proMembershipRow}>
                <View
                  style={[
                    styles.proIconBox,
                    {
                      backgroundColor: isPro
                        ? isLight
                          ? '#FEF3C7'
                          : 'rgba(245, 158, 11, 0.15)'
                        : hasReferralBonus
                          ? isLight
                            ? '#DCFCE7'
                            : 'rgba(34, 197, 94, 0.15)'
                          : isTrialExpired
                            ? isLight
                              ? '#FEE2E2'
                              : 'rgba(239, 68, 68, 0.15)'
                            : isLight
                              ? '#E0F2FE'
                              : 'rgba(0, 240, 255, 0.15)',
                      borderColor: isPro
                        ? '#F59E0B'
                        : hasReferralBonus
                          ? '#22C55E'
                          : isTrialExpired
                            ? '#EF4444'
                            : colors.accent,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      isPro
                        ? proPlan === 'lifetime'
                          ? 'shield-crown'
                          : 'crown'
                        : hasReferralBonus
                          ? 'gift'
                          : isTrialExpired
                            ? 'alert-octagon'
                            : 'compass-outline'
                    }
                    size={22}
                    color={
                      isPro
                        ? '#F59E0B'
                        : hasReferralBonus
                          ? '#22C55E'
                          : isTrialExpired
                            ? '#EF4444'
                            : colors.accent
                    }
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.planTitleBadgeRow}>
                    <Text style={[styles.proMembershipTitle, { color: colors.text }]}>
                      {isPro
                        ? planDisplayName
                        : hasReferralBonus
                          ? t('settings.status_referral_pass', 'Captain Referral Pass')
                          : isTrialExpired
                            ? t('settings.trial_ended', 'Evaluation Trial Ended')
                            : t('settings.status_active_trial', '3-Day Free Vessel Trial')}
                    </Text>

                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: isPro
                            ? isExpiringSoon
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(16, 185, 129, 0.15)'
                            : hasReferralBonus
                              ? 'rgba(34, 197, 94, 0.15)'
                              : isTrialExpired
                                ? 'rgba(239, 68, 68, 0.15)'
                                : 'rgba(0, 240, 255, 0.15)',
                          borderColor: isPro
                            ? isExpiringSoon
                              ? '#EF4444'
                              : '#10B981'
                            : hasReferralBonus
                              ? '#22C55E'
                              : isTrialExpired
                                ? '#EF4444'
                                : colors.accent,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          {
                            color: isPro
                              ? isExpiringSoon
                                ? '#EF4444'
                                : '#10B981'
                              : hasReferralBonus
                                ? '#22C55E'
                                : isTrialExpired
                                  ? '#EF4444'
                                  : colors.accent,
                          },
                        ]}
                      >
                        {isPro
                          ? isExpiringSoon
                            ? t('settings.status_expiring_soon', 'EXPIRING SOON')
                            : t('settings.status_active', 'ACTIVE')
                          : hasReferralBonus
                            ? t('settings.status_referral_pass', 'REFERRAL PASS')
                            : isTrialExpired
                              ? t('settings.status_expired', 'EXPIRED')
                              : t('settings.status_active_trial', 'ACTIVE TRIAL')}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.proMembershipSub, { color: colors.textSecondary }]}>
                    {isPro
                      ? proPlan === 'lifetime'
                        ? t('pro.perpetual_desc', 'Perpetual master license. High-res bathymetry & AIS radar unlocked forever.')
                        : t('pro.active_desc', 'Official vessel license active with full offshore bathymetry & AIS radar.')
                      : hasReferralBonus
                        ? t('pro.referral_active_desc', 'Unlocked via Captain referral invitations. Zero recurring charges.')
                        : isTrialExpired
                          ? t('settings.trial_ended_desc', 'Free trial has ended. Upgrade to continue high-res navigation.')
                          : t('settings.trial_eval_desc', 'Unrestricted Pro evaluation pass. All features active.')}
                  </Text>
                </View>
              </View>

              {/* ⚡ Glowing Expiry & Countdown HUD Console */}
              <View
                style={[
                  styles.expiryHudConsole,
                  {
                    backgroundColor: isLight ? '#F8FAFC' : 'rgba(2, 12, 23, 0.85)',
                    borderColor: isPro
                      ? isExpiringSoon
                        ? '#EF4444'
                        : isLight
                          ? '#FDE68A'
                          : 'rgba(245, 158, 11, 0.35)'
                      : hasReferralBonus
                        ? 'rgba(34, 197, 94, 0.3)'
                        : isTrialExpired
                          ? 'rgba(239, 68, 68, 0.35)'
                          : isLight
                            ? '#E0F2FE'
                            : 'rgba(0, 240, 255, 0.25)',
                  },
                ]}
              >
                {isPro ? (
                  proPlan === 'lifetime' ? (
                    // Lifetime View
                    <View style={styles.hudLifetimeWrap}>
                      <View style={styles.hudLifetimeLeft}>
                        <Text style={[styles.hudHugeInfinity, { color: '#F59E0B' }]}>♾️</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.hudHeadline, { color: colors.text }]}>
                            {t('pro.perpetual_access', 'PERPETUAL LIFETIME ACCESS')}
                          </Text>
                          <Text style={[styles.hudSubtitle, { color: colors.textSecondary }]}>
                            {t('pro.perpetual_desc', 'Never expires • All bathymetry, radar & offline charts guaranteed')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                    // Annual or Quarterly Pro View
                    <View>
                      <View style={styles.hudTopRow}>
                        <View style={styles.hudCountdownBox}>
                          <Text style={[styles.hudSmallLabel, { color: colors.textSecondary }]}>
                            {t('pro.time_remaining', 'TIME REMAINING')}
                          </Text>
                          <View style={styles.hudDaysRow}>
                            <Text
                              style={[
                                styles.hudBigNumber,
                                { color: isExpiringSoon ? '#EF4444' : '#F59E0B' },
                              ]}
                            >
                              {proDaysRemaining}
                            </Text>
                            <Text
                              style={[
                                styles.hudBigUnit,
                                { color: isExpiringSoon ? '#EF4444' : '#F59E0B' },
                              ]}
                            >
                              {t('pro.days_left', 'DAYS LEFT')}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.hudDateInfoBox}>
                          <View style={[styles.hudDatePill, { backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 0, 0, 0.25)', borderColor: isLight ? '#E2E8F0' : 'transparent', borderWidth: isLight ? 1 : 0 }]}>
                            <Ionicons name="calendar" size={13} color={isExpiringSoon ? '#EF4444' : '#F59E0B'} />
                            <Text style={[styles.hudDateText, { color: colors.text }]}>
                              {t('pro.valid_until', 'Expires:')} <Text style={{ fontWeight: '800' }}>{proFormattedExpiry}</Text>
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Visual Expiry Timeline Progress Bar */}
                      <View style={styles.hudProgressWrap}>
                        <View style={[styles.hudProgressTrack, { backgroundColor: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.1)' }]}>
                          <View
                            style={[
                              styles.hudProgressFill,
                              {
                                width: `${Math.max(5, 100 - proProgressPercent)}%`,
                                backgroundColor: isExpiringSoon ? '#EF4444' : '#F59E0B',
                              },
                            ]}
                          />
                        </View>
                        <View style={styles.hudProgressLabels}>
                          <Text style={[styles.hudProgressLabelText, { color: colors.textMuted }]}>
                            {t('settings.cycle', 'Cycle')}: {proPlan === 'quarterly' ? t('pro.cycle_90', '90 Days') : t('pro.cycle_365', '365 Days')}
                          </Text>
                          <Text
                            style={[
                              styles.hudProgressLabelText,
                              { color: isExpiringSoon ? '#EF4444' : '#F59E0B', fontWeight: '700' },
                            ]}
                          >
                            {proDaysRemaining} {t('settings.days_remaining', 'days remaining')} ({Math.max(1, 100 - proProgressPercent)}%)
                          </Text>
                        </View>
                      </View>
                    </View>
                  )
                ) : hasReferralBonus ? (
                  // Referral Bonus View
                  <View>
                    <View style={styles.hudTopRow}>
                      <View style={styles.hudCountdownBox}>
                        <Text style={[styles.hudSmallLabel, { color: colors.textSecondary }]}>
                          {t('settings.referral_pass_remaining', 'REFERRAL PASS REMAINING')}
                        </Text>
                        <View style={styles.hudDaysRow}>
                          <Text style={[styles.hudBigNumber, { color: '#22C55E' }]}>
                            {bonusProDaysRemaining}
                          </Text>
                          <Text style={[styles.hudBigUnit, { color: '#22C55E' }]}>
                            {bonusProDaysRemaining === 1 ? t('settings.day_free', 'DAY FREE') : t('settings.days_free', 'DAYS FREE')}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.hudDateInfoBox}>
                        <View style={[styles.hudDatePill, { backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 0, 0, 0.25)', borderColor: isLight ? '#BBF7D0' : 'transparent', borderWidth: isLight ? 1 : 0 }]}>
                          <Ionicons name="gift" size={13} color="#22C55E" />
                          <Text style={[styles.hudDateText, { color: colors.text }]}>
                            {t('pro.valid_until', 'Valid Until:')} <Text style={{ fontWeight: '800' }}>{bonusProFormattedExpiry}</Text>
                          </Text>
                        </View>
                        <Text style={[styles.hudSubInfo, { color: colors.textSecondary }]}>
                          +{referralDaysEarned}d {t('settings.invite_crew', 'earned from crew invites')}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  // Free Trial or Expired View
                  <View>
                    <View style={styles.hudTopRow}>
                      <View style={styles.hudCountdownBox}>
                        <Text style={[styles.hudSmallLabel, { color: colors.textSecondary }]}>
                          {isTrialExpired ? t('settings.status_expired', 'TRIAL STATUS') : t('settings.free_evaluation', 'FREE EVALUATION PERIOD')}
                        </Text>
                        <View style={styles.hudDaysRow}>
                          <Text
                            style={[
                              styles.hudBigNumber,
                              { color: isTrialExpired ? '#EF4444' : colors.accent },
                            ]}
                          >
                            {isTrialExpired ? '0h' : `${trialHoursRemaining}h`}
                          </Text>
                          <Text
                            style={[
                              styles.hudBigUnit,
                              { color: isTrialExpired ? '#EF4444' : colors.accent },
                            ]}
                          >
                            {isTrialExpired ? t('settings.status_expired', 'EXPIRED') : `${t('pro.days_left', 'LEFT')} (${trialDaysRemaining}d)`}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.hudDateInfoBox}>
                        <View style={[styles.hudDatePill, { backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 0, 0, 0.25)', borderColor: isLight ? '#E2E8F0' : 'transparent', borderWidth: isLight ? 1 : 0 }]}>
                          <Ionicons
                            name={isTrialExpired ? 'alert-circle' : 'time'}
                            size={13}
                            color={isTrialExpired ? '#EF4444' : colors.accent}
                          />
                          <Text style={[styles.hudDateText, { color: colors.text }]}>
                            {isTrialExpired ? t('settings.trial_ended', 'Trial Ended') : `${t('settings.trial_ends', 'Trial Ends')}: ${trialFormattedExpiry}`}
                          </Text>
                        </View>
                        <Text style={[styles.hudSubInfo, { color: colors.textSecondary }]}>
                          {isTrialExpired
                            ? t('settings.charts_locked', 'Offshore charts locked')
                            : t('settings.upgrade_anytime', 'Upgrade anytime for permanent access')}
                        </Text>
                      </View>
                    </View>
                    {!isTrialExpired && (
                      <View style={styles.hudProgressWrap}>
                        <View style={[styles.hudProgressTrack, { backgroundColor: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.1)' }]}>
                          <View
                            style={[
                              styles.hudProgressFill,
                              {
                                width: `${Math.max(5, 100 - trialProgressPercent)}%`,
                                backgroundColor: colors.accent,
                              },
                            ]}
                          />
                        </View>
                        <View style={styles.hudProgressLabels}>
                          <Text style={[styles.hudProgressLabelText, { color: colors.textMuted }]}>
                            72 Hours {t('settings.free_evaluation', 'Free Evaluation')}
                          </Text>
                          <Text style={[styles.hudProgressLabelText, { color: colors.accent, fontWeight: '700' }]}>
                            {trialHoursRemaining} {t('weather.hours_left', 'hours left')}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* License Certificate & Copy Bar */}
                <View style={[styles.hudCertRow, { borderTopColor: isLight ? '#E2E8F0' : colors.divider }]}>
                  <View style={styles.hudCertLeft}>
                    <MaterialCommunityIcons name="certificate" size={14} color="#F59E0B" />
                    <Text style={[styles.hudCertLabel, { color: isLight ? '#64748B' : colors.textMuted }]}>
                      {t('settings.license_id', 'LICENSE ID:')}
                    </Text>
                    <Text style={[styles.hudCertValue, { color: colors.text }]}>
                      {licenseCertificateId}
                    </Text>
                  </View>
                  <Pressable style={styles.hudCopyBtn} onPress={handleCopyLicenseKey} hitSlop={8}>
                    <Ionicons name="copy-outline" size={12} color={colors.accent} />
                    <Text style={[styles.hudCopyBtnText, { color: colors.accent }]}>COPY</Text>
                  </Pressable>
                </View>
              </View>

              {/* ⚠️ Expiring Soon Urgent Alert Bar */}
              {isExpiringSoon && (
                <View style={styles.expiringSoonAlertBox}>
                  <Ionicons name="warning" size={18} color="#EF4444" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.expiringSoonAlertTitle}>
                      {t('settings.status_expiring_soon', 'LICENSE EXPIRING SOON')} ({proDaysRemaining} {t('pro.days_left', 'Days Left')})
                    </Text>
                    <Text style={styles.expiringSoonAlertDesc}>
                      Your vessel license will expire on {proFormattedExpiry}. Renew now to avoid offshore chart blackout & radar shutdown.
                    </Text>
                  </View>
                </View>
              )}

              {/* Unlocked Capabilities Grid (4 Pills) */}
              <View style={styles.unlockedGrid}>
                <View style={[styles.unlockedItem, { backgroundColor: isLight ? '#F1F5F9' : colors.chipBg, borderColor: isLight ? '#E2E8F0' : colors.chipBorder }]}>
                  <Ionicons name="cloud-offline" size={13} color={isLight ? '#16A34A' : '#10B981'} />
                  <Text style={[styles.unlockedText, { color: colors.text }]}>{t('hub.offline', 'Offline Charts')}</Text>
                </View>
                <View style={[styles.unlockedItem, { backgroundColor: isLight ? '#F1F5F9' : colors.chipBg, borderColor: isLight ? '#E2E8F0' : colors.chipBorder }]}>
                  <Ionicons name="fish" size={13} color={isLight ? colors.accent : '#00F0FF'} />
                  <Text style={[styles.unlockedText, { color: colors.text }]}>{t('hub.spots', 'AI Hotspots')}</Text>
                </View>
                <View style={[styles.unlockedItem, { backgroundColor: isLight ? '#F1F5F9' : colors.chipBg, borderColor: isLight ? '#E2E8F0' : colors.chipBorder }]}>
                  <Ionicons name="radio" size={13} color={isLight ? '#D97706' : '#F59E0B'} />
                  <Text style={[styles.unlockedText, { color: colors.text }]}>{t('pro.feat_ais_title', 'AIS Radar')}</Text>
                </View>
                <View style={[styles.unlockedItem, { backgroundColor: isLight ? '#F1F5F9' : colors.chipBg, borderColor: isLight ? '#E2E8F0' : colors.chipBorder }]}>
                  <Ionicons name="location" size={13} color={isLight ? '#9333EA' : '#A855F7'} />
                  <Text style={[styles.unlockedText, { color: colors.text }]}>{t('hub.waypoints', 'Waypoints Sync')}</Text>
                </View>
              </View>

              {/* Quick Action Buttons for Subscription Management */}
              {isPro ? (
                <View style={styles.proActionBtnGrid}>
                  <Pressable
                    style={[styles.proManageBtn, { backgroundColor: isLight ? '#F1F5F9' : colors.chipBg, borderColor: isLight ? '#CBD5E1' : colors.chipBorder }]}
                    onPress={() => setShowReceiptModal(true)}
                  >
                    <Ionicons name="receipt-outline" size={14} color={isLight ? colors.accent : colors.textSecondary} />
                    <Text style={[styles.proManageBtnText, { color: colors.text }]}>{t('profile.tax_invoice', 'Tax Invoice')}</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.trialActionRow}>
                  <Pressable
                    style={styles.upgradeCtaBtn}
                    onPress={() => {
                      onClose();
                      openProModal('profile_card');
                    }}
                  >
                    <LinearGradient
                      colors={isLight ? ['#0284C7', '#0369A1'] : ['#00F0FF', '#0284C7']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.upgradeCtaGrad}
                    >
                      <MaterialCommunityIcons name="crown" size={17} color="#FFFFFF" />
                      <Text style={[styles.upgradeCtaText, { color: '#FFFFFF' }]}>{t('pro.upgrade_btn', 'UPGRADE TO FISHNAV PRO')}</Text>
                    </LinearGradient>
                  </Pressable>

                  <Pressable
                    style={[styles.referralCtaBtn, { borderColor: isLight ? '#16A34A' : '#22C55E', backgroundColor: isLight ? '#DCFCE7' : 'rgba(34, 197, 94, 0.1)' }]}
                    onPress={() => {
                      onClose();
                      openReferralModal();
                    }}
                  >
                    <Ionicons name="people" size={14} color={isLight ? '#16A34A' : '#22C55E'} />
                    <Text style={[styles.referralCtaText, { color: isLight ? '#16A34A' : '#22C55E' }]}>{t('referral.share_btn', 'Invite')} (+10d)</Text>
                  </Pressable>
                </View>
              )}

              {/* Referral Bonus Bar if active */}
              {referralDaysEarned > 0 && (
                <View style={[styles.refBonusRow, isLight && { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                  <Ionicons name="gift" size={13} color={isLight ? '#16A34A' : '#22C55E'} />
                  <Text style={[styles.refBonusText, isLight && { color: '#166534' }]}>
                    +{referralDaysEarned} Days Free added from Captain Invites
                  </Text>
                </View>
              )}
            </View>

            {/* 🚀 TRIPS & ROUTES LOGBOOK SHORTCUT */}
            <Pressable
              style={[
                styles.tripsShortcutCard,
                {
                  backgroundColor: isLight ? '#FFFFFF' : 'rgba(10, 31, 53, 0.75)',
                  borderColor: isLight ? '#E2E8F0' : colors.cardBorder,
                  shadowColor: isLight ? '#64748B' : '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isLight ? 0.06 : 0.2,
                  shadowRadius: 8,
                  elevation: isLight ? 2 : 0,
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
                  <Text style={[styles.tripsTitle, { color: colors.text }]}>{t('trips.title', 'Trips & Routes Logbook')}</Text>
                  <View
                    style={[
                      styles.tripsBadge,
                      {
                        backgroundColor: isLight ? '#E0F2FE' : colors.chipBg,
                        borderColor: isLight ? '#BAE6FD' : colors.chipBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.tripsBadgeText, { color: colors.accent }]}>
                      {savedTrips.length} {t('tab.trips', 'VOYAGES').toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.tripsSubtitle, { color: colors.textSecondary }]}>
                  {t('trips.subtitle', 'View GPS voyage tracks, distance & backtrack routes')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </Pressable>

            {/* 2. REGISTERED BOAT & VESSEL TELEMETRY */}
            <View style={styles.sectionHeaderBetween}>
              <View style={styles.sectionHeaderLeft}>
                <MaterialCommunityIcons name="sail-boat" size={16} color={colors.accent} />
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('profile.vessel_specs', 'VESSEL & BOAT SPECIFICATIONS')}</Text>
              </View>

              <Pressable
                style={[styles.editSpecsBtn, { backgroundColor: isLight ? '#E0F2FE' : colors.chipBg, borderColor: isLight ? '#BAE6FD' : colors.chipBorder }]}
                onPress={() => setShowVesselEditor(true)}
              >
                <Ionicons name="create-outline" size={14} color={colors.accent} />
                <Text style={[styles.editSpecsText, { color: colors.accent }]}>{t('btn.edit', 'Update')}</Text>
              </Pressable>
            </View>

            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: isLight ? '#FFFFFF' : 'rgba(10, 31, 53, 0.75)',
                  borderColor: isLight ? '#E2E8F0' : colors.cardBorder,
                  shadowColor: isLight ? '#64748B' : '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isLight ? 0.06 : 0.2,
                  shadowRadius: 8,
                  elevation: isLight ? 2 : 0,
                },
              ]}
            >
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('profile.boat_name', 'Vessel Name')}</Text>
                <Text style={[styles.infoValue, { color: colors.accent, fontWeight: '800' }]}>
                  {captain?.vesselName || 'Sea Hunter II'}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: isLight ? '#F1F5F9' : colors.divider }]} />
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('profile.registration', 'Call Sign / Reg No')}</Text>
                <Text style={[styles.infoValue, { color: colors.accent, fontWeight: '800' }]}>
                  {captain?.callSign || 'IND-GJ-8821'}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: isLight ? '#F1F5F9' : colors.divider }]} />
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('profile.vessel_type', 'Vessel Class')}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{captain?.vesselType || 'Deep Sea Trawler (42ft)'}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: isLight ? '#F1F5F9' : colors.divider }]} />
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('profile.home_port', 'Home Harbor')}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{captain?.homeHarbor || 'Veraval Fishing Port'}</Text>
              </View>

              <View style={[styles.divider, { backgroundColor: isLight ? '#F1F5F9' : colors.divider }]} />
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('profile.cruise_speed', 'Cruising Speed')}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{captain?.cruiseSpeedKnots || '12'} knots</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: isLight ? '#F1F5F9' : colors.divider }]} />
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('pro.master_license', 'Maritime License')}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{captain?.licenseNumber || 'IND-MF-2026-991'}</Text>
              </View>
            </View>

            {/* 3. LOGIN & SECURITY CREDENTIALS SECTION */}
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="key-outline" size={15} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('profile.auth_details', 'LOGIN & AUTHENTICATION DETAILS')}</Text>
            </View>

            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: isLight ? '#FFFFFF' : 'rgba(10, 31, 53, 0.75)',
                  borderColor: isLight ? '#E2E8F0' : colors.cardBorder,
                  shadowColor: isLight ? '#64748B' : '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isLight ? 0.06 : 0.2,
                  shadowRadius: 8,
                  elevation: isLight ? 2 : 0,
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
                    <View style={[styles.providerIconBox, { backgroundColor: isLight ? '#E0F2FE' : colors.chipBg }]}>
                      <Ionicons name="call" size={16} color={colors.accent} />
                    </View>
                  ) : (
                    <View style={[styles.providerIconBox, { backgroundColor: isLight ? '#FEF3C7' : 'rgba(251, 191, 36, 0.2)' }]}>
                      <Ionicons name="flash" size={16} color={isLight ? '#D97706' : '#FBBF24'} />
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

                <View style={[styles.activePill, isLight && { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}>
                  <View style={styles.greenPulse} />
                  <Text style={[styles.activeText, isLight && { color: '#16A34A' }]}>{t('profile.verified', 'VERIFIED')}</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: isLight ? '#F1F5F9' : colors.divider }]} />

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('profile.account_id', 'Account Identifier')}</Text>
                <Text style={[styles.infoValue, { color: colors.accent, fontWeight: '700' }]}>
                  {captain?.emailOrPhone || '+91 98765 43210'}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: isLight ? '#F1F5F9' : colors.divider }]} />

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('profile.session_started', 'Session Started')}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {captain?.loginAt || 'Today, Active'}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: isLight ? '#F1F5F9' : colors.divider }]} />

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('profile.account_security', 'Account Security')}</Text>
                <View style={styles.securityBadge}>
                  <Ionicons name="shield-checkmark-outline" size={13} color="#10B981" />
                  <Text style={[styles.securityText, { color: isLight ? '#16A34A' : '#10B981' }]}>{t('profile.security_key', '256-Bit Marine Key')}</Text>
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
              <Text style={[styles.logoutText, isLight && { color: '#DC2626' }]}>{t('profile.sign_out', 'SIGN OUT').toUpperCase()}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>

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
                <Text style={[styles.subModalTitle, { color: colors.text }]}>{t('profile.choose_photo', 'Choose Profile Photo')}</Text>
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
                    backgroundColor: isLight ? '#FFFFFF' : 'rgba(10, 31, 53, 0.75)',
                    borderColor: isLight ? '#E2E8F0' : colors.cardBorder,
                  },
                ]}
                onPress={handlePickDeviceImage}
              >
                <View style={[styles.uploadIconWrap, { backgroundColor: isLight ? '#E0F2FE' : colors.chipBg }]}>
                  <Ionicons name="cloud-upload" size={22} color={colors.accent} />
                </View>
                <View style={styles.uploadTextWrap}>
                  <Text style={[styles.uploadTitle, { color: colors.text }]}>{t('profile.device_gallery', 'Choose from Device / Gallery')}</Text>
                  <Text style={[styles.uploadSub, { color: colors.textSecondary }]}>
                    {t('profile.gallery_desc', 'Select a personal photo from your phone or PC')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>

              {/* Option 2: Curated Maritime Captain Presets */}
              <Text style={[styles.presetSectionTitle, { color: colors.textMuted }]}>
                {t('profile.select_avatar', 'OR SELECT MARITIME CAPTAIN AVATAR')}
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
                          backgroundColor: isLight ? (isSelected ? '#E0F2FE' : '#FFFFFF') : (isSelected ? colors.chipBg : 'rgba(10, 31, 53, 0.75)'),
                          borderColor: isSelected ? colors.accent : (isLight ? '#E2E8F0' : colors.divider),
                        },
                        isSelected && { borderWidth: 1.5 },
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
              <Text style={[styles.presetSectionTitle, { color: colors.textMuted }]}>{t('profile.enter_url', 'OR ENTER IMAGE URL')}</Text>
              <View style={styles.urlInputRow}>
                <TextInput
                  style={[
                    styles.urlTextInput,
                    {
                      backgroundColor: isLight ? '#F8FAFC' : 'rgba(0, 0, 0, 0.35)',
                      borderColor: isLight ? '#CBD5E1' : colors.cardBorder,
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
                  <Text style={styles.urlApplyText}>{t('btn.update', 'Apply')}</Text>
                </Pressable>
              </View>

              {/* Option 4: Reset / Remove Photo */}
              {captain?.avatarUrl && (
                <Pressable style={styles.resetPhotoBtn} onPress={handleResetPhoto}>
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  <Text style={styles.resetPhotoText}>{t('profile.remove_photo', 'Remove Photo (Use Ship Wheel Icon)')}</Text>
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
                <Text style={[styles.subModalTitle, { color: colors.text }]}>{t('profile.edit_vessel', 'Update Boat & Vessel Specs')}</Text>
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
                <Text style={[styles.editLabel, { color: colors.textSecondary }]}>{t('profile.boat_name', 'BOAT / VESSEL NAME').toUpperCase()}</Text>
                <View
                  style={[
                    styles.editInputWrap,
                    {
                      backgroundColor: isLight ? '#F8FAFC' : 'rgba(0, 0, 0, 0.35)',
                      borderColor: isLight ? '#CBD5E1' : colors.cardBorder,
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
                  {t('profile.registration', 'OFFICIAL REGISTRATION / CALL SIGN').toUpperCase()}
                </Text>
                <View
                  style={[
                    styles.editInputWrap,
                    {
                      backgroundColor: isLight ? '#F8FAFC' : 'rgba(0, 0, 0, 0.35)',
                      borderColor: isLight ? '#CBD5E1' : colors.cardBorder,
                    },
                  ]}
                >
                  <MaterialCommunityIcons name="radio-handheld" size={18} color={isLight ? colors.accent : '#38BDF8'} style={styles.editIcon} />
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
                <Text style={[styles.editLabel, { color: colors.textSecondary }]}>{t('profile.title', 'CAPTAIN / MASTER NAME').toUpperCase()}</Text>
                <View
                  style={[
                    styles.editInputWrap,
                    {
                      backgroundColor: isLight ? '#F8FAFC' : 'rgba(0, 0, 0, 0.35)',
                      borderColor: isLight ? '#CBD5E1' : colors.cardBorder,
                    },
                  ]}
                >
                  <Ionicons name="person" size={18} color={isLight ? colors.accent : '#38BDF8'} style={styles.editIcon} />
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
                <Text style={[styles.editLabel, { color: colors.textSecondary }]}>{t('profile.vessel_type', 'VESSEL CLASS / TYPE').toUpperCase()}</Text>
                <View
                  style={[
                    styles.editInputWrap,
                    {
                      backgroundColor: isLight ? '#F8FAFC' : 'rgba(0, 0, 0, 0.35)',
                      borderColor: isLight ? '#CBD5E1' : colors.cardBorder,
                    },
                  ]}
                >
                  <Ionicons name="construct-outline" size={18} color={isLight ? colors.accent : '#38BDF8'} style={styles.editIcon} />
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
                          backgroundColor: isLight ? '#E0F2FE' : 'rgba(255, 255, 255, 0.06)',
                          borderColor: isLight ? '#BAE6FD' : colors.divider,
                        },
                      ]}
                      onPress={() => setEditVesselType(chip)}
                    >
                      <Text style={[styles.chipText, { color: isLight ? colors.accent : '#38BDF8' }]}>{chip.split(' ')[0]}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* 5. Home Harbor Selector */}
              <View style={styles.editField}>
                <Text style={[styles.editLabel, { color: colors.textSecondary }]}>
                  {t('profile.home_port', 'HOME HARBOR / PORT OF REGISTRY').toUpperCase()}
                </Text>
                <View
                  style={[
                    styles.editInputWrap,
                    {
                      backgroundColor: isLight ? '#F8FAFC' : 'rgba(0, 0, 0, 0.35)',
                      borderColor: isLight ? '#CBD5E1' : colors.cardBorder,
                    },
                  ]}
                >
                  <Ionicons name="anchor" size={18} color={isLight ? colors.accent : '#38BDF8'} style={styles.editIcon} />
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
                          backgroundColor: isLight ? '#E0F2FE' : 'rgba(255, 255, 255, 0.06)',
                          borderColor: isLight ? '#BAE6FD' : colors.divider,
                        },
                      ]}
                      onPress={() => setEditHomeHarbor(chip)}
                    >
                      <Text style={[styles.chipText, { color: isLight ? colors.accent : '#38BDF8' }]}>{chip.split(' ')[0]}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* 6. Cruising Speed */}
              <View style={styles.editField}>
                <Text style={[styles.editLabel, { color: colors.textSecondary }]}>
                  {t('profile.cruise_speed', 'CRUISING SPEED (KNOTS)').toUpperCase()}
                </Text>
                <View
                  style={[
                    styles.editInputWrap,
                    {
                      backgroundColor: isLight ? '#F8FAFC' : 'rgba(0, 0, 0, 0.35)',
                      borderColor: isLight ? '#CBD5E1' : colors.cardBorder,
                    },
                  ]}
                >
                  <Ionicons name="speedometer-outline" size={18} color={isLight ? colors.accent : '#38BDF8'} style={styles.editIcon} />
                  <TextInput
                    style={[styles.editTextInput, { color: colors.text }]}
                    placeholder="e.g. 12"
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
                  {t('pro.master_license', 'MARITIME LICENSE / PERMIT NO').toUpperCase()}
                </Text>
                <View
                  style={[
                    styles.editInputWrap,
                    {
                      backgroundColor: isLight ? '#F8FAFC' : 'rgba(0, 0, 0, 0.35)',
                      borderColor: isLight ? '#CBD5E1' : colors.cardBorder,
                    },
                  ]}
                >
                  <Ionicons name="document-text-outline" size={18} color={isLight ? colors.accent : '#38BDF8'} style={styles.editIcon} />
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
                  colors={isLight ? ['#0284C7', '#0369A1'] : ['#00F0FF', '#0284C7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveGradient}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.saveText}>{t('profile.save_changes', 'SAVE BOAT SPECIFICATIONS')}</Text>
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* 🧾 MODAL D: TAX INVOICE & PRO RECEIPT */}
      <Modal
        visible={showReceiptModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReceiptModal(false)}
      >
        <View style={styles.subModalOverlay}>
          <Pressable style={styles.subModalTouch} onPress={() => setShowReceiptModal(false)} />
          <View
            style={[
              styles.receiptCard,
              {
                backgroundColor: isLight ? '#FFFFFF' : '#031422',
                borderColor: isLight ? '#E2E8F0' : 'rgba(0, 240, 255, 0.3)',
                shadowColor: isLight ? '#64748B' : '#00F0FF',
                shadowOpacity: isLight ? 0.12 : 0.25,
              },
            ]}
          >
            <View style={styles.receiptTopRow}>
              <View style={styles.receiptLogoRow}>
                <MaterialCommunityIcons name="ship-wheel" size={24} color={colors.accent} />
                <View>
                  <Text style={[styles.receiptBrand, { color: colors.text }]}>FishNav Marine</Text>
                  <Text style={[styles.receiptSub, { color: colors.textMuted }]}>{t('profile.invoice_title', 'Official Maritime Tax Invoice')}</Text>
                </View>
              </View>
              <Pressable
                style={[styles.receiptCloseBtn, { backgroundColor: isLight ? '#F1F5F9' : colors.chipBg }]}
                onPress={() => setShowReceiptModal(false)}
                hitSlop={8}
              >
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={[styles.receiptDivider, { backgroundColor: isLight ? '#F1F5F9' : colors.divider }]} />

            <View style={styles.receiptBody}>
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>{t('profile.invoice_no', 'Invoice No:')}</Text>
                <Text style={[styles.receiptValue, { color: colors.text }]}>{invoiceNumber}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>{t('profile.invoice_cert', 'License Certificate:')}</Text>
                <Text style={[styles.receiptValue, { color: '#F59E0B' }]}>{licenseCertificateId}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>{t('profile.invoice_vessel', 'Vessel / Captain:')}</Text>
                <Text style={[styles.receiptValue, { color: colors.text }]}>
                  {captain?.vesselName || 'Sea Hunter II'} ({captain?.callSign || 'IND-GJ-8821'})
                </Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>{t('profile.invoice_plan', 'Plan Type:')}</Text>
                <Text style={[styles.receiptValue, { color: colors.text }]}>{planDisplayName}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>{t('profile.invoice_period', 'Billing Period:')}</Text>
                <Text style={[styles.receiptValue, { color: colors.text }]}>
                  {proPlan === 'lifetime' ? t('pro.forever', 'Perpetual Lifetime') : proFormattedExpiry || '1 Year Active'}
                </Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>{t('profile.invoice_status', 'Payment Status:')}</Text>
                <View style={[styles.paidBadge, isLight && { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="checkmark-circle" size={13} color={isLight ? '#16A34A' : '#10B981'} />
                  <Text style={[styles.paidBadgeText, isLight && { color: '#16A34A' }]}>{t('profile.invoice_paid', 'PAID & VERIFIED')}</Text>
                </View>
              </View>

              <View style={[styles.receiptDivider, { backgroundColor: isLight ? '#F1F5F9' : colors.divider }]} />

              <View style={styles.receiptRow}>
                <Text style={[styles.receiptTotalLabel, { color: colors.text }]}>{t('profile.invoice_total', 'Total Amount Paid:')}</Text>
                <Text style={[styles.receiptTotalVal, { color: colors.accent }]}>
                  {proPlan === 'lifetime' ? '₹3,999.00' : proPlan === 'quarterly' ? '₹499.00' : '₹1,499.00'}
                </Text>
              </View>
              <Text style={[styles.receiptGstNote, { color: colors.textMuted }]}>
                {t('profile.invoice_gst', 'Includes 18% Integrated Goods and Services Tax (IGST) for Marine Navigation Software.')}
              </Text>
            </View>

            <Pressable
              style={styles.receiptDoneBtn}
              onPress={() => setShowReceiptModal(false)}
            >
              <LinearGradient
                colors={isLight ? ['#0284C7', '#0369A1'] : ['#00F0FF', '#0284C7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.receiptDoneGrad}
              >
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                <Text style={styles.receiptDoneText}>{t('profile.close_receipt', 'CLOSE RECEIPT')}</Text>
              </LinearGradient>
            </Pressable>
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
    </>
  );
};

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
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  // 👑 PRO MEMBERSHIP & LICENSE HUD STYLES (Identical to Settings HUD Console)
  statusBadgePill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusBadgePillText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  proCardContainer: {
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
    padding: 16,
    gap: 12,
    marginBottom: 4,
  },
  cardTopStripe: {
    height: 4,
    marginTop: -16,
    marginHorizontal: -16,
    marginBottom: 2,
  },
  proMembershipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  proIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTitleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 2,
  },
  proMembershipTitle: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  proMembershipSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  expiryHudConsole: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    marginVertical: 4,
  },
  hudLifetimeWrap: {
    paddingVertical: 4,
  },
  hudLifetimeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hudHugeInfinity: {
    fontSize: 32,
  },
  hudHeadline: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hudSubtitle: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  hudTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  hudCountdownBox: {
    flex: 1,
  },
  hudSmallLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  hudDaysRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  hudBigNumber: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  hudBigUnit: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hudDateInfoBox: {
    alignItems: 'flex-end',
    gap: 6,
  },
  hudDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hudDateText: {
    fontSize: 11,
  },
  hudSubInfo: {
    fontSize: 10,
  },
  hudProgressWrap: {
    marginBottom: 8,
  },
  hudProgressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  hudProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  hudProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hudProgressLabelText: {
    fontSize: 10,
  },
  hudCertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 4,
  },
  hudCertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  hudCertLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hudCertValue: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  hudCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  hudCopyBtnText: {
    fontSize: 9,
    fontWeight: '800',
  },
  expiringSoonAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
  expiringSoonAlertTitle: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  expiringSoonAlertDesc: {
    color: '#FCA5A5',
    fontSize: 10,
    marginTop: 2,
    lineHeight: 14,
  },
  unlockedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unlockedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 1,
  },
  unlockedText: {
    fontSize: 11,
    fontWeight: '700',
  },
  proActionBtnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  proManageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  proManageBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  trialActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  upgradeCtaBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  upgradeCtaGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  upgradeCtaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  referralCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  referralCtaText: {
    fontSize: 12,
    fontWeight: '700',
  },
  refBonusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  refBonusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#22C55E',
  },

  // Sub-modal Shared Styles
  subModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 8, 16, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  subModalTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  receiptCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 20,
    gap: 14,
    shadowColor: '#00F0FF',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 20,
  },
  receiptTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  receiptLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  receiptBrand: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  receiptSub: {
    fontSize: 11,
    marginTop: 1,
  },
  receiptCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptDivider: {
    height: 1,
    width: '100%',
  },
  receiptBody: {
    gap: 10,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  receiptLabel: {
    fontSize: 12,
  },
  receiptValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paidBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '900',
  },
  receiptTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  receiptTotalVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  receiptGstNote: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 4,
  },
  receiptDoneBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  receiptDoneGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  receiptDoneText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

});
