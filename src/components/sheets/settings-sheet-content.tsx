import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapColors } from '@/constants/map-theme';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { LanguageDropdown } from '@/components/ui/language-dropdown';
import { useSubscription } from '@/context/subscription-context';
import { useAppTheme } from '@/context/theme-context';
import { useOfflineDownload } from '@/context/offline-map-context';
import { useTripTracking } from '@/context/trip-context';
import { useWaypoints } from '@/context/waypoints-context';
import { useUserLocation } from '@/hooks/use-user-location';
import {
  offlineTileManager,
  PRESET_OFFLINE_REGIONS,
  type DownloadedRegionMeta,
  type DownloadProgress,
  type OfflineRegion,
} from '@/services/offline-tile-manager';

export function SettingsSheetContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const isSmall = windowWidth < 365;
  const isVerySmall = windowWidth < 335;
  const { theme, setTheme, colors, isLight, isDark, isHighContrast } = useAppTheme();
  const { language, setLanguage, t, availableLanguages } = useLanguage();
  const { captain, updateCaptain } = useAuth();
  const { waypoints, resetWaypoints } = useWaypoints();
  const { savedTrips } = useTripTracking();
  const {
    isPro,
    proPlan,
    proExpiresAt,
    proDaysRemaining,
    proHoursRemaining,
    proFormattedExpiry,
    proProgressPercent,
    isExpiringSoon,
    isProExpired,
    planDisplayName,
    licenseCertificateId,
    hasReferralBonus,
    bonusProDaysRemaining,
    bonusProFormattedExpiry,
    isTrialActive,
    isTrialExpired,
    trialDaysRemaining,
    trialHoursRemaining,
    trialProgressPercent,
    trialFormattedExpiry,
    referralDaysEarned,
    referralCount,
    openProModal,
    openReferralModal,
    devResetTrial,
    devExpireTrial,
    devAddReferralReward,
    devSetExpiryDays,
  } = useSubscription();

  const handleCopyLicense = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(licenseCertificateId);
      }
      Alert.alert('License Copied', `Maritime Certificate ID ${licenseCertificateId} copied to clipboard.`);
    } catch {
      Alert.alert('Certificate ID', licenseCertificateId);
    }
  };

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

  // Developer / demo controls visibility
  const [showDevControls, setShowDevControls] = useState(false);

  // 🗺️ Offline Marine Charts State (Synchronized with Global Background Service)
  const { location } = useUserLocation();
  const {
    downloadProgress,
    isDownloading,
    downloadedRegions,
    storageUsageMb,
    startDownload,
    cancelDownload,
    refreshOfflineStatus,
  } = useOfflineDownload();

  const [showAllRegions, setShowAllRegions] = useState(false);

  const displayedRegions = useMemo(() => {
    return offlineTileManager.getNearbyRegions(
      location?.latitude,
      location?.longitude,
      showAllRegions ? 10 : 4,
    );
  }, [location?.latitude, location?.longitude, showAllRegions]);

  const isCurrentAreaDownloaded = useMemo(
    () => downloadedRegions.some((r) => r.id === 'current-area'),
    [downloadedRegions],
  );
  const currentAreaMeta = useMemo(
    () => downloadedRegions.find((r) => r.id === 'current-area'),
    [downloadedRegions],
  );

  const handleDownloadRegion = async (region: OfflineRegion) => {
    if (isDownloading) {
      Alert.alert(
        t('settings.download_in_progress', 'Download in Progress'),
        t('settings.download_wait', 'Please wait until the current map chart finishes downloading.')
      );
      return;
    }

    const success = await startDownload(region);

    if (success) {
      Alert.alert(
        t('settings.chart_saved_title', '✓ Chart Saved Offline'),
        `"${region.name}" ${t('settings.chart_saved_body', 'has been successfully downloaded! You can now navigate this area in deep sea with 0% cellular internet.')}`
      );
    } else {
      Alert.alert(
        t('settings.download_failed_title', 'Download Incomplete'),
        t('settings.download_failed_body', 'Could not complete downloading all map tiles. Please check your internet connection and try again.')
      );
    }
  };

  const handleDownloadCurrentArea = () => {
    // If live GPS is ready, use it; otherwise fallback to primary marine zone (Veraval)
    const lat = location?.latitude ?? 20.9022;
    const lng = location?.longitude ?? 70.3667;
    const region = offlineTileManager.createCurrentAreaRegion(lat, lng);
    handleDownloadRegion(region);
  };

  const handleExportGpx = () => {
    Alert.alert(
      t('settings.export_title', 'Export GPX'),
      `${waypoints.length} ${t('settings.export_body', 'waypoints successfully exported to FishNavPro_Backup.gpx.')}`,
      [{ text: t('btn.done', 'OK') }],
    );
  };

  const handleImportGpx = () => {
    Alert.alert(
      t('settings.import_title', 'Import GPX'),
      t('settings.import_body', 'Select a GPX or KML waypoint file from your device storage.'),
      [{ text: t('settings.browse_files', 'Browse Files') }, { text: t('btn.cancel', 'Cancel'), style: 'cancel' }],
    );
  };

  const handleResetPrompt = () => {
    Alert.alert(
      t('settings.reset_prompt_title', 'Reset All Waypoints'),
      t('settings.reset_prompt_body', 'Are you sure you want to reset your saved waypoints back to factory fishing spots? Any custom spots will be cleared.'),
      [
        { text: t('btn.cancel', 'Cancel'), style: 'cancel' },
        { text: t('btn.delete', 'Reset'), style: 'destructive', onPress: resetWaypoints },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: isSmall ? 10 : 16,
          paddingBottom: Math.max(insets.bottom, 20) + 110,
        },
      ]}
      showsVerticalScrollIndicator={false} >
      {/* 👑 Section 0: FishNav Pro & Fleet Referral Membership */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionHeaderLeft, { flexShrink: 1 }]}>
            <MaterialCommunityIcons name="crown" size={15} color="#F59E0B" style={{ marginRight: 5 }} />
            <Text style={[styles.sectionHeader, { color: '#F59E0B', marginLeft: 0 }, isSmall && { fontSize: 10 }]}>
              {t('settings.membership_license', 'MEMBERSHIP & VESSEL LICENSE')}
            </Text>
          </View>
          <View
            style={[
              styles.badgeTheme,
              isSmall && { paddingHorizontal: 6, paddingVertical: 2 },
              {
                backgroundColor: isPro
                  ? isExpiringSoon
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(245, 158, 11, 0.15)'
                  : hasReferralBonus
                    ? 'rgba(34, 197, 94, 0.15)'
                    : isTrialExpired
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(0, 240, 255, 0.15)',
                borderColor: isPro
                  ? isExpiringSoon
                    ? '#EF4444'
                    : '#F59E0B'
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
                styles.badgeThemeText,
                isSmall && { fontSize: 9 },
                {
                  color: isPro
                    ? isExpiringSoon
                      ? '#EF4444'
                      : '#F59E0B'
                    : hasReferralBonus
                      ? '#22C55E'
                      : isTrialExpired
                        ? '#EF4444'
                        : colors.accent,
                },
              ]}
            >
              {isPro
                ? proPlan === 'lifetime'
                  ? 'LIFETIME 👑'
                  : isExpiringSoon
                    ? `${t('settings.status_expiring_soon', 'EXPIRES IN')} ${proDaysRemaining}D ⚠️`
                    : `${proDaysRemaining}D ${t('pro.days_left', 'LEFT')} 👑`
                : hasReferralBonus
                  ? `${bonusProDaysRemaining}D BONUS 🎁`
                  : isTrialExpired
                    ? `${t('settings.status_expired', 'TRIAL EXPIRED')} 🚨`
                    : `${trialDaysRemaining}D ${t('settings.status_active_trial', 'TRIAL ACTIVE')} ⚡`}
            </Text>
          </View>
        </View>

        <View style={[styles.card, isVerySmall && { padding: 10 }, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {/* Top Status Header Row */}
          <View style={[styles.proMembershipRow, isSmall && { gap: 8, marginBottom: 8 }]}>
            <View
              style={[
                styles.proIconBox,
                isSmall && { width: 38, height: 38 },
                {
                  backgroundColor: isPro
                    ? isExpiringSoon
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(245, 158, 11, 0.15)'
                    : hasReferralBonus
                      ? 'rgba(34, 197, 94, 0.12)'
                      : isTrialExpired
                        ? 'rgba(239, 68, 68, 0.12)'
                        : 'rgba(0, 240, 255, 0.12)',
                  borderColor: isPro
                    ? isExpiringSoon
                      ? '#EF4444'
                      : '#F59E0B'
                    : hasReferralBonus
                      ? '#22C55E'
                      : isTrialExpired
                        ? '#EF4444'
                        : colors.accent,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={isPro ? (isExpiringSoon ? 'shield-alert' : 'shield-crown') : hasReferralBonus ? 'gift' : isTrialExpired ? 'shield-off' : 'shield-star'}
                size={isSmall ? 22 : 26}
                color={isPro ? (isExpiringSoon ? '#EF4444' : '#F59E0B') : hasReferralBonus ? '#22C55E' : isTrialExpired ? '#EF4444' : colors.accent}
              />
            </View>

            <View style={{ flex: 1 }}>
              <View style={[styles.planTitleBadgeRow, { flexWrap: 'wrap' }]}>
                <Text style={[styles.proMembershipTitle, { color: colors.text }, isSmall && { fontSize: 13 }]}>
                  {planDisplayName}
                </Text>
                <View
                  style={[
                    styles.statusPill,
                    isSmall && { paddingHorizontal: 5, paddingVertical: 1.5 },
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
                      isSmall && { fontSize: 8.5 },
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
                      ? (isExpiringSoon ? t('settings.status_expiring_soon', 'EXPIRING SOON') : t('settings.status_active', 'ACTIVE'))
                      : hasReferralBonus
                        ? t('settings.status_referral_pass', 'REFERRAL PASS')
                        : isTrialExpired
                          ? t('settings.status_expired', 'EXPIRED')
                          : t('settings.status_active_trial', 'ACTIVE TRIAL')}
                  </Text>
                </View>
              </View>
              <Text style={[styles.proMembershipSub, isSmall && { fontSize: 10.5 }, { color: colors.textSecondary }]}>
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
              isSmall && { padding: 10 },
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
                      <Text style={[styles.hudHeadline, isSmall && { fontSize: 12 }, { color: colors.text }]}>
                        {t('pro.perpetual_access', 'PERPETUAL LIFETIME ACCESS')}
                      </Text>
                      <Text style={[styles.hudSubtitle, isSmall && { fontSize: 10 }, { color: colors.textSecondary }]}>
                        {t('pro.perpetual_desc', 'Never expires • All bathymetry, radar & offline charts guaranteed')}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                // Annual or Quarterly Pro View
                <View>
                  <View style={[styles.hudTopRow, isSmall && { flexDirection: 'column', alignItems: 'flex-start', gap: 8 }]}>
                    <View style={styles.hudCountdownBox}>
                      <Text style={[styles.hudSmallLabel, { color: colors.textSecondary }]}>
                        {t('pro.time_remaining', 'TIME REMAINING')}
                      </Text>
                      <View style={styles.hudDaysRow}>
                        <Text
                          style={[
                            styles.hudBigNumber,
                            isSmall && { fontSize: 22 },
                            { color: isExpiringSoon ? '#EF4444' : '#F59E0B' },
                          ]}
                        >
                          {proDaysRemaining}
                        </Text>
                        <Text
                          style={[
                            styles.hudBigUnit,
                            isSmall && { fontSize: 11 },
                            { color: isExpiringSoon ? '#EF4444' : '#F59E0B' },
                          ]}
                        >
                          {proDaysRemaining === 1 ? t('pro.days_left', 'DAY LEFT') : t('pro.days_left', 'DAYS LEFT')}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.hudDateInfoBox, isSmall && { alignItems: 'flex-start' }]}>
                      <View style={[styles.hudDatePill, isSmall && { paddingHorizontal: 6, paddingVertical: 3 }]}>
                        <Ionicons name="calendar" size={13} color={isExpiringSoon ? '#EF4444' : '#F59E0B'} />
                        <Text style={[styles.hudDateText, isSmall && { fontSize: 10 }, { color: colors.text }]}>
                          {t('pro.valid_until', 'Expires')}: <Text style={{ fontWeight: '800' }}>{proFormattedExpiry}</Text>
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Visual Expiry Timeline Progress Bar */}
                  <View style={styles.hudProgressWrap}>
                    <View style={styles.hudProgressTrack}>
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
                    <View style={[styles.hudProgressLabels, { flexWrap: 'wrap', gap: 4 }]}>
                      <Text style={[styles.hudProgressLabelText, { color: colors.textMuted }, isSmall && { fontSize: 9.5 }]}>
                        {t('settings.cycle', 'Cycle')}: {proPlan === 'quarterly' ? t('pro.cycle_90', '90 Days') : t('pro.cycle_365', '365 Days')}
                      </Text>
                      <Text
                        style={[
                          styles.hudProgressLabelText,
                          { color: isExpiringSoon ? '#EF4444' : '#F59E0B', fontWeight: '700' },
                          isSmall && { fontSize: 9.5 },
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
                <View style={[styles.hudTopRow, isSmall && { flexDirection: 'column', alignItems: 'flex-start', gap: 8 }]}>
                  <View style={styles.hudCountdownBox}>
                    <Text style={[styles.hudSmallLabel, { color: colors.textSecondary }]}>
                      {t('settings.referral_pass_remaining', 'REFERRAL PASS REMAINING')}
                    </Text>
                    <View style={styles.hudDaysRow}>
                      <Text style={[styles.hudBigNumber, isSmall && { fontSize: 22 }, { color: '#22C55E' }]}>
                        {bonusProDaysRemaining}
                      </Text>
                      <Text style={[styles.hudBigUnit, isSmall && { fontSize: 11 }, { color: '#22C55E' }]}>
                        {bonusProDaysRemaining === 1 ? t('settings.day_free', 'DAY FREE') : t('settings.days_free', 'DAYS FREE')}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.hudDateInfoBox, isSmall && { alignItems: 'flex-start' }]}>
                    <View style={[styles.hudDatePill, isSmall && { paddingHorizontal: 6, paddingVertical: 3 }]}>
                      <Ionicons name="gift" size={13} color="#22C55E" />
                      <Text style={[styles.hudDateText, isSmall && { fontSize: 10 }, { color: colors.text }]}>
                        {t('pro.valid_until', 'Valid Until')}: <Text style={{ fontWeight: '800' }}>{bonusProFormattedExpiry}</Text>
                      </Text>
                    </View>
                    <Text style={[styles.hudSubInfo, isSmall && { fontSize: 9.5 }, { color: colors.textSecondary }]}>
                      +{referralDaysEarned}d {t('settings.invite_crew', 'earned from crew invites')} ({referralCount})
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              // Free Trial or Expired View
              <View>
                <View style={[styles.hudTopRow, isSmall && { flexDirection: 'column', alignItems: 'flex-start', gap: 8 }]}>
                  <View style={styles.hudCountdownBox}>
                    <Text style={[styles.hudSmallLabel, { color: colors.textSecondary }]}>
                      {isTrialExpired ? t('pro.trial_expired', 'TRIAL STATUS') : t('settings.free_evaluation', 'FREE EVALUATION PERIOD')}
                    </Text>
                    <View style={styles.hudDaysRow}>
                      <Text
                        style={[
                          styles.hudBigNumber,
                          isSmall && { fontSize: 22 },
                          { color: isTrialExpired ? '#EF4444' : colors.accent },
                        ]}
                      >
                        {isTrialExpired ? '0h' : `${trialHoursRemaining}h`}
                      </Text>
                      <Text
                        style={[
                          styles.hudBigUnit,
                          isSmall && { fontSize: 11 },
                          { color: isTrialExpired ? '#EF4444' : colors.accent },
                        ]}
                      >
                        {isTrialExpired ? t('settings.status_expired', 'EXPIRED') : `${t('pro.days_left', 'LEFT')} (${trialDaysRemaining}d)`}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.hudDateInfoBox, isSmall && { alignItems: 'flex-start' }]}>
                    <View style={[styles.hudDatePill, isSmall && { paddingHorizontal: 6, paddingVertical: 3 }]}>
                      <Ionicons
                        name={isTrialExpired ? 'alert-circle' : 'time'}
                        size={13}
                        color={isTrialExpired ? '#EF4444' : colors.accent}
                      />
                      <Text style={[styles.hudDateText, isSmall && { fontSize: 10 }, { color: colors.text }]}>
                        {isTrialExpired ? t('settings.trial_ended', 'Trial Ended') : `${t('settings.trial_ends', 'Trial Ends')}: ${trialFormattedExpiry}`}
                      </Text>
                    </View>
                    <Text style={[styles.hudSubInfo, isSmall && { fontSize: 9.5 }, { color: colors.textSecondary }]}>
                      {isTrialExpired
                        ? t('settings.charts_locked', 'Offshore charts locked')
                        : t('settings.upgrade_anytime', 'Upgrade anytime for permanent access')}
                    </Text>
                  </View>
                </View>
                {!isTrialExpired && (
                  <View style={styles.hudProgressWrap}>
                    <View style={styles.hudProgressTrack}>
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
                    <View style={[styles.hudProgressLabels, { flexWrap: 'wrap', gap: 4 }]}>
                      <Text style={[styles.hudProgressLabelText, { color: colors.textMuted }, isSmall && { fontSize: 9.5 }]}>
                        72 Hours {t('settings.free_evaluation', 'Free Evaluation')}
                      </Text>
                      <Text style={[styles.hudProgressLabelText, { color: colors.accent, fontWeight: '700' }, isSmall && { fontSize: 9.5 }]}>
                        {trialHoursRemaining} {t('weather.hours_left', 'hours left')}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* License Certificate & Copy Bar */}
            <View style={[styles.hudCertRow, { borderTopColor: colors.divider, flexWrap: 'wrap', gap: 6 }]}>
              <View style={[styles.hudCertLeft, { flexShrink: 1 }]}>
                <MaterialCommunityIcons name="certificate" size={14} color="#F59E0B" />
                <Text style={[styles.hudCertLabel, { color: colors.textMuted }]}>
                  {t('settings.license_id', 'LICENSE ID:')}
                </Text>
                <Text
                  style={[
                    styles.hudCertValue,
                    { color: colors.text },
                    isSmall && { fontSize: 10 },
                  ]}
                  numberOfLines={1}
                >
                  {licenseCertificateId}
                </Text>
              </View>
              <Pressable style={styles.hudCopyBtn} onPress={handleCopyLicense} hitSlop={8}>
                <Ionicons name="copy-outline" size={12} color={colors.accent} />
                <Text style={[styles.hudCopyBtnText, { color: colors.accent }]}>{t('referral.copy', 'COPY')}</Text>
              </Pressable>
            </View>
          </View>

          {/* ⚠️ Expiring Soon Urgent Alert Bar */}
          {isExpiringSoon && (
            <View style={styles.expiringSoonAlertBox}>
              <Ionicons name="warning" size={18} color="#EF4444" />
              <View style={{ flex: 1 }}>
                <Text style={styles.expiringSoonAlertTitle}>
                  {t('settings.status_expiring_soon', 'LICENSE EXPIRING SOON!')} ({proDaysRemaining} {t('pro.days_left', 'Days Left')})
                </Text>
                <Text style={styles.expiringSoonAlertDesc}>
                  Your vessel license will expire on {proFormattedExpiry}. Renew now to avoid offshore chart blackout & radar shutdown.
                </Text>
              </View>
            </View>
          )}

          {/* Referral Bonus Tag if any */}
          {referralDaysEarned > 0 && !hasReferralBonus && (
            <View style={styles.referralBonusPill}>
              <Ionicons name="gift" size={14} color="#22C55E" />
              <Text style={styles.referralBonusPillText}>
                +{referralDaysEarned} {t('settings.days_free', 'Days Free Pro')} ({referralCount} {t('settings.invite_crew', 'Captain Invites')})
              </Text>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.divider, marginVertical: 10 }]} />

          {/* Action Buttons: Upgrade Pro / Renew & Invite Crew */}
          <View style={[styles.actionsRow, isSmall && { flexDirection: 'column' }]}>
            <Pressable
              style={[
                styles.actionBtn,
                isSmall && { width: '100%' },
                {
                  backgroundColor: isExpiringSoon
                    ? '#EF4444'
                    : isPro
                      ? colors.chipBg
                      : isLight
                        ? '#E0F2FE'
                        : 'rgba(0, 240, 255, 0.18)',
                  borderColor: isExpiringSoon ? '#DC2626' : colors.accent,
                },
              ]}
              onPress={() => openProModal('settings_btn')}
            >
              <MaterialCommunityIcons
                name={isExpiringSoon ? 'refresh-circle' : 'crown'}
                size={16}
                color={isExpiringSoon ? '#FFFFFF' : colors.accent}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: isExpiringSoon ? '#FFFFFF' : colors.accent, fontWeight: '800' },
                ]}
                numberOfLines={1}
              >
                {isExpiringSoon
                  ? t('settings.renew_now', 'Renew License Now')
                  : isPro
                    ? t('settings.manage_pro', 'Manage Pro & Billing')
                    : t('pro.upgrade_btn', 'Upgrade to Pro')}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.actionBtn,
                isSmall && { width: '100%' },
                {
                  backgroundColor: isLight ? '#DCFCE7' : 'rgba(34, 197, 94, 0.14)',
                  borderColor: '#22C55E',
                },
              ]}
              onPress={openReferralModal}
            >
              <Ionicons name="people" size={16} color="#22C55E" />
              <Text style={[styles.actionBtnText, { color: '#22C55E' }]} numberOfLines={1}>
                {t('settings.invite_crew', 'Invite Crew (+10d)')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* 🚀 Trips & Recorded Routes Logbook Shortcut */}
      <Pressable
        style={[
          styles.tripsShortcutCard,
          isSmall && { padding: 11, gap: 10, borderRadius: 14 },
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          },
        ]}
        onPress={() => router.push('/trips')}
      >
        <View style={[styles.tripsIconWrap, isSmall && { width: 38, height: 38, borderRadius: 19 }, { backgroundColor: colors.chipBg }]}>
          <MaterialCommunityIcons name="map-marker-path" size={isSmall ? 20 : 24} color={colors.accent} />
        </View>
        <View style={styles.tripsTextWrap}>
          <Text style={[styles.tripsTitle, isSmall && { fontSize: 13.5 }, { color: colors.text }]}>{t('hub.trips_log', 'Trips & Routes Logbook')}</Text>
          <Text style={[styles.tripsSubtitle, isSmall && { fontSize: 10 }, { color: colors.textSecondary }]}>
            {savedTrips.length} {t('settings.trips_sub', 'recorded fishing voyages • View tracks on map')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      {/* 🗺️ OFFLINE MARINE CHARTS & REGIONAL TILES */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionHeaderLeft, { flexShrink: 1 }]}>
            <MaterialCommunityIcons name="map-clock-outline" size={18} color={colors.accent} style={{ marginRight: 6 }} />
            <Text style={[styles.sectionHeader, { color: colors.accent }, isSmall && { fontSize: 10 }]}>
              {t('settings.offline', 'OFFLINE NAUTICAL CHARTS')}
            </Text>
          </View>
          <View
            style={[
              styles.badgeTheme,
              isSmall && { paddingHorizontal: 6, paddingVertical: 2 },
              {
                backgroundColor: downloadedRegions.length > 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                borderColor: downloadedRegions.length > 0 ? '#22C55E' : '#F59E0B',
              },
            ]}
          >
            <Text style={[styles.badgeThemeText, isSmall && { fontSize: 9 }, { color: downloadedRegions.length > 0 ? '#22C55E' : '#F59E0B' }]}>
              {downloadedRegions.length > 0 ? t('settings.deep_sea_ready', 'DEEP-SEA READY ✓') : t('settings.needs_setup', 'NEEDS SETUP ⚡')}
            </Text>
          </View>
        </View>

        {/* 🛡️ Nautical Offline Readiness Strip */}
        <View
          style={[
            styles.offlineStatusStrip,
            isSmall && { padding: 10 },
            {
              backgroundColor: downloadedRegions.length > 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              borderColor: downloadedRegions.length > 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)',
            },
          ]}
        >
          <View style={[styles.statusStripLeft, isSmall && { gap: 10 }]}>
            <View
              style={[
                styles.statusIconWrap,
                isSmall && { width: 34, height: 34, borderRadius: 10 },
                { backgroundColor: downloadedRegions.length > 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)' },
              ]}
            >
              <MaterialCommunityIcons
                name={downloadedRegions.length > 0 ? 'shield-check' : 'cloud-download-outline'}
                size={isSmall ? 18 : 20}
                color={downloadedRegions.length > 0 ? '#22C55E' : '#F59E0B'}
              />
            </View>
            <View style={styles.statusStripTextWrap}>
              <Text style={[styles.statusStripTitle, isSmall && { fontSize: 11 }, { color: downloadedRegions.length > 0 ? '#22C55E' : '#F59E0B' }]}>
                {downloadedRegions.length > 0 ? t('settings.charts_ready_title', 'OFFLINE CHARTS READY FOR SEA') : t('settings.no_charts_title', 'NO OFFLINE CHARTS SAVED')}
              </Text>
              <Text style={[styles.statusStripSub, isSmall && { fontSize: 10 }, { color: colors.textSecondary }]}>
                {downloadedRegions.length > 0
                  ? `${downloadedRegions.length} ${t('settings.zones_saved', 'chart zone(s) saved')} • ${storageUsageMb} MB ${t('settings.cached_on_phone', 'cached on phone')}`
                  : t('settings.predownload_advice', 'Pre-download charts while connected to port Wi-Fi or 4G before sailing')}
              </Text>
            </View>
          </View>
        </View>

        {/* Live Download Progress Notification Card */}
        {downloadProgress?.isDownloading && (
          <View style={[styles.downloadProgressCard, { backgroundColor: colors.chipBg, borderColor: colors.accent }]}>
            <View style={styles.progressHeaderRow}>
              <View style={styles.progressTitleWrap}>
                <ActivityIndicator size="small" color={colors.accent} style={{ marginRight: 8 }} />
                <Text style={[styles.progressTitleText, { color: colors.text }]}>
                  {t('settings.downloading', 'Downloading')} {downloadProgress.regionName}...
                </Text>
              </View>
              <Pressable onPress={() => cancelDownload()} style={styles.cancelDownloadBtn}>
                <Text style={styles.cancelDownloadText}>{t('btn.cancel', 'Cancel')}</Text>
              </Pressable>
            </View>

            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${downloadProgress.percent}%`, backgroundColor: colors.accent }]} />
            </View>

            <View style={styles.progressStatsRow}>
              <Text style={[styles.progressStatText, { color: colors.textSecondary }]}>
                {downloadProgress.completed} / {downloadProgress.total} tiles ({downloadProgress.percent}%)
              </Text>
              <Text style={[styles.progressStatText, { color: colors.accent }]}>
                {downloadProgress.percent === 100 ? t('settings.finalizing_cache', 'Finalizing cache...') : t('settings.saving_tiles', 'Saving high-res tiles')}
              </Text>
            </View>
          </View>
        )}

        <View style={[styles.card, isVerySmall && { padding: 10 }, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {/* 📍 Hero Option: Current Boat Sea Area */}
          <View
            style={[
              styles.currentAreaHeroCard,
              isSmall && { margin: 4, padding: 10 },
              {
                backgroundColor: isLight ? '#F0FDF4' : 'rgba(0, 240, 255, 0.05)',
                borderColor: isLight ? '#86EFAC' : 'rgba(0, 240, 255, 0.25)',
              },
            ]}
          >
            <View style={[styles.currentAreaHeader, isSmall && { flexWrap: 'wrap', gap: 6 }]}>
              <View
                style={[
                  styles.currentAreaBadge,
                  isCurrentAreaDownloaded && {
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    borderColor: '#22C55E',
                  },
                ]}
              >
                <Ionicons
                  name={isCurrentAreaDownloaded ? 'checkmark-circle' : 'navigate'}
                  size={11}
                  color={isCurrentAreaDownloaded ? '#22C55E' : colors.accent}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.currentAreaBadgeText,
                    isSmall && { fontSize: 8.5 },
                    { color: isCurrentAreaDownloaded ? '#22C55E' : colors.accent },
                  ]}
                >
                  {isCurrentAreaDownloaded ? t('settings.cached_30nm', '30 NM CACHED OFFLINE') : t('settings.current_perimeter', 'CURRENT BOAT PERIMETER')}
                </Text>
              </View>
              <Text style={[styles.currentAreaCoordText, isSmall && { fontSize: 9.5 }, { color: colors.textMuted }]}>
                {location
                  ? `${location.latitude.toFixed(3)}°N, ${location.longitude.toFixed(3)}°E`
                  : 'Veraval Port Waters'}
              </Text>
            </View>

            <View style={[styles.currentAreaBody, isSmall && { flexDirection: 'column', alignItems: 'stretch', gap: 10 }]}>
              <View style={styles.currentAreaTextWrap}>
                <Text style={[styles.currentAreaTitle, isSmall && { fontSize: 12.5 }, { color: colors.text }]}>
                  {t('settings.surrounding_sea', 'Surrounding Sea Chart (30 NM)')}
                </Text>
                <Text style={[styles.currentAreaDesc, isSmall && { fontSize: 10.5 }, { color: colors.textSecondary }]}>
                  {isCurrentAreaDownloaded
                    ? t('settings.active_zone_saved', `✓ Active 30 NM zone is saved (${currentAreaMeta?.tileCount || 260} tiles). Tap 'Update' if boat moved to a new zone.`)
                    : t('settings.instant_30nm', 'Instant 30 Nautical Mile boundary covering all fishing spots, banks & channels')}
                </Text>
              </View>
              <Pressable
                style={[
                  styles.downloadHeroBtn,
                  isSmall && { alignSelf: 'stretch', justifyContent: 'center' },
                  isCurrentAreaDownloaded
                    ? { backgroundColor: colors.chipBg, borderColor: '#22C55E', borderWidth: 1 }
                    : { backgroundColor: colors.accent },
                  downloadProgress?.isDownloading && { opacity: 0.5 },
                ]}
                disabled={downloadProgress?.isDownloading}
                onPress={handleDownloadCurrentArea}
              >
                {downloadProgress?.regionId === 'current-area' ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <ActivityIndicator size="small" color={isLight ? '#FFFFFF' : '#020B14'} />
                    <Text style={[styles.downloadHeroBtnText, { color: isLight ? '#FFFFFF' : '#020B14' }]}>
                      {downloadProgress?.percent}%
                    </Text>
                  </View>
                ) : (
                  <>
                    <Ionicons
                      name={isCurrentAreaDownloaded ? 'sync-outline' : 'cloud-download'}
                      size={15}
                      color={isCurrentAreaDownloaded ? '#22C55E' : isLight ? '#FFFFFF' : '#020B14'}
                    />
                    <Text
                      style={[
                        styles.downloadHeroBtnText,
                        { color: isCurrentAreaDownloaded ? '#22C55E' : isLight ? '#FFFFFF' : '#020B14' },
                      ]}
                    >
                      {isCurrentAreaDownloaded ? t('btn.update', 'Update') : t('btn.download', 'Download')}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* 📍 Dynamic Nearby Harbor Suggestions Header */}
          <View style={[styles.nearbyHeaderRow, isSmall && { paddingHorizontal: 6, flexWrap: 'wrap', rowGap: 4 }]}>
            <View style={[styles.nearbyTitleWithDot, { flexShrink: 1 }]}>
              <View
                style={[
                  styles.pulsingGpsDot,
                  { backgroundColor: location ? '#22C55E' : '#F59E0B' },
                ]}
              />
              <Text style={[styles.harborPacksHeader, isSmall && { fontSize: 9.5, paddingHorizontal: 2 }, { color: colors.textSecondary }]}>
                {location ? t('settings.nearby_charts', 'NEARBY HARBOR CHARTS (GPS SUGGESTIONS)') : t('settings.popular_charts', 'POPULAR HARBOR CHARTS (GUJARAT)')}
              </Text>
            </View>
            <View style={[styles.nearbyGpsBadge, { backgroundColor: colors.chipBg, borderColor: colors.chipBorder }]}>
              <Ionicons name="location-outline" size={11} color={colors.accent} style={{ marginRight: 2 }} />
              <Text style={[styles.nearbyGpsBadgeText, { color: colors.accent }]}>
                {location ? t('settings.top4_closest', 'TOP 4 CLOSEST') : t('settings.default_badge', 'DEFAULT')}
              </Text>
            </View>
          </View>

          {/* List of 3 to 4 Nearby Ports */}
          {displayedRegions.map((region, idx) => {
            const isDownloaded = downloadedRegions.some((r) => r.id === region.id);
            const isDownloadingThis = downloadProgress?.regionId === region.id;

            return (
              <View key={region.id}>
                {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.divider }]} />}
                <View style={[styles.offlineItemRow, isSmall && { paddingHorizontal: 8, paddingVertical: 8, gap: 8 }]}>
                  <View
                    style={[
                      styles.offlineIconWrap,
                      isSmall && { width: 32, height: 32, borderRadius: 8 },
                      { backgroundColor: isDownloaded ? 'rgba(34, 197, 94, 0.15)' : colors.chipBg },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={isDownloaded ? 'check-decagram' : 'anchor'}
                      size={isSmall ? 18 : 22}
                      color={isDownloaded ? '#22C55E' : colors.accent}
                    />
                  </View>
                  <View style={styles.offlineTextWrap}>
                    <View style={[styles.regionTitleLine, { flexWrap: 'wrap', gap: 4 }]}>
                      <Text style={[styles.offlineItemTitle, isSmall && { fontSize: 12 }, { color: colors.text }]}>
                        {region.name}
                      </Text>
                      {isDownloaded ? (
                        <View style={styles.downloadedPill}>
                          <Text style={styles.downloadedPillText}>{t('settings.saved_badge', 'SAVED')}</Text>
                        </View>
                      ) : (
                        region.distanceNm !== undefined && (
                          <View
                            style={[
                              styles.distancePill,
                              {
                                backgroundColor:
                                  region.distanceNm <= 3
                                    ? 'rgba(34, 197, 94, 0.15)'
                                    : colors.chipBg,
                                borderColor:
                                  region.distanceNm <= 3 ? '#22C55E' : colors.chipBorder,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.distancePillText,
                                {
                                  color: region.distanceNm <= 3 ? '#22C55E' : colors.accent,
                                },
                              ]}
                            >
                              {region.distanceNm <= 3 ? `⚓ ${t('settings.in_port', 'IN PORT')}` : `${region.distanceNm} NM`}
                            </Text>
                          </View>
                        )
                      )}
                    </View>
                    <Text style={[styles.offlineItemDesc, isSmall && { fontSize: 10 }, { color: colors.textSecondary }]} numberOfLines={1}>
                      {region.description}
                    </Text>
                    <Text style={[styles.offlineSizeLabel, isSmall && { fontSize: 9.5 }, { color: colors.textMuted }]}>
                      {region.estimatedTiles} tiles • ~{region.estimatedSizeMb} MB • Zoom {region.minZoom}-{region.maxZoom}
                    </Text>
                  </View>

                  <Pressable
                    style={[
                      styles.downloadActionBtn,
                      isSmall && { paddingHorizontal: 8, paddingVertical: 5 },
                      isDownloaded
                        ? { backgroundColor: colors.chipBg, borderColor: '#22C55E', borderWidth: 1 }
                        : { backgroundColor: colors.accent },
                      downloadProgress?.isDownloading && { opacity: 0.5 },
                    ]}
                    disabled={downloadProgress?.isDownloading}
                    onPress={() => handleDownloadRegion(region)}
                  >
                    {isDownloadingThis ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <ActivityIndicator size="small" color={isLight ? '#FFFFFF' : '#020B14'} />
                        <Text
                          style={[
                            styles.downloadActionBtnText,
                            { color: isLight ? '#FFFFFF' : '#020B14', fontWeight: '800' },
                          ]}
                        >
                          {downloadProgress?.percent}%
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Ionicons
                          name={isDownloaded ? 'sync-outline' : 'cloud-download-outline'}
                          size={14}
                          color={isDownloaded ? '#22C55E' : isLight ? '#FFFFFF' : '#020B14'}
                        />
                        <Text
                          style={[
                            styles.downloadActionBtnText,
                            { color: isDownloaded ? '#22C55E' : isLight ? '#FFFFFF' : '#020B14' },
                          ]}
                        >
                          {isDownloaded ? t('btn.update', 'Update') : t('btn.download', 'Download')}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            );
          })}

          {/* Show More / Show Less Toggle Button */}
          <Pressable
            style={[styles.showMoreRegionsBtn, { borderTopColor: colors.divider, borderTopWidth: 1 }]}
            onPress={() => setShowAllRegions((prev) => !prev)}
          >
            <Text style={[styles.showMoreRegionsBtnText, { color: colors.accent }]}>
              {showAllRegions
                ? t('settings.show_top4', '▴ Show Top 4 Nearest Only')
                : t('settings.show_all10', '▾ Show All 10 Coastal Regions')}
            </Text>
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* Storage Footer */}
          <View style={[styles.storageFooterRow, isSmall && { paddingHorizontal: 8, paddingVertical: 8, flexWrap: 'wrap', gap: 4 }]}>
            <View style={styles.storageStatsWrap}>
              <Ionicons name="save-outline" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.storageStatsText, isSmall && { fontSize: 10 }, { color: colors.textSecondary }]}>
                {t('settings.offline_storage', 'Offline Storage')}: <Text style={{ color: colors.text, fontWeight: '700' }}>{storageUsageMb} MB</Text>
                {downloadedRegions.length > 0
                  ? ` (${downloadedRegions.length} ${t('settings.packs_saved', 'packs')})`
                  : ` (${t('settings.no_maps_saved', 'No maps saved')})`}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 🎨 APP THEME: HIGH CONTRAST / DARK / LIGHT */}
      <View style={styles.section}>
        <View style={[styles.sectionHeaderRow, isSmall && { flexWrap: 'wrap', gap: 6 }]}>
          <Text style={[styles.sectionHeader, { color: colors.accent }]}>
            {t('settings.app_theme', 'APP THEME')}
          </Text>
          <View style={[styles.badgeTheme, isSmall && { paddingHorizontal: 6, paddingVertical: 2 }, { backgroundColor: colors.chipBg, borderColor: colors.chipBorder }]}>
            <Text style={[styles.badgeThemeText, isSmall && { fontSize: 9 }, { color: colors.accent }]}>
              {theme === 'high-contrast' ? t('settings.high_contrast', 'HIGH CONTRAST').toUpperCase() : t('settings.light_mode', 'LIGHT MODE').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={[styles.card, isSmall && { padding: 10 }, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>

          <View style={[styles.themesList, isSmall && { gap: 8 }]}>
            {(
              [
                {
                  id: 'high-contrast' as const,
                  name: t('settings.high_contrast', 'High Contrast'),
                  tag: 'CURRENT MARINE',
                  desc: t('settings.theme_high_contrast_desc', 'Signature oceanic neon: deep abyss with glowing cyan & maximum water legibility'),
                  icon: 'contrast' as const,
                  accentColor: '#00F0FF',
                  bgColor: 'rgba(0, 240, 255, 0.15)',
                  badge: t('settings.current_badge', 'CURRENT'),
                },
                {
                  id: 'light' as const,
                  name: t('settings.light_mode', 'Light Theme'),
                  tag: 'DAYLIGHT NAUTICAL',
                  desc: t('settings.theme_light_desc', 'Clean, high-luminance white & daylight charts for bright outdoor sunlight'),
                  icon: 'sunny' as const,
                  accentColor: '#0284C7',
                  bgColor: 'rgba(2, 132, 199, 0.15)',
                  badge: t('settings.daylight_badge', 'DAYLIGHT'),
                },
              ]
            ).map((item) => {
              const isSelected = theme === item.id;
              return (
                <Pressable
                  key={item.id}
                  style={[
                    styles.themeItem,
                    isSmall && { padding: 10, gap: 10, borderRadius: 12 },
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
                      isSmall && { width: 36, height: 36, borderRadius: 18 },
                      {
                        backgroundColor: item.bgColor,
                        borderColor: isSelected ? item.accentColor : 'transparent',
                      },
                    ]}
                  >
                    <Ionicons name={item.icon} size={isSmall ? 18 : 22} color={item.accentColor} />
                  </View>

                  <View style={styles.themeInfoWrap}>
                    <View style={[styles.themeTitleRow, { flexWrap: 'wrap', gap: 4 }]}>
                      <Text
                        style={[
                          styles.themeTitle,
                          isSmall && { fontSize: 13 },
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
                            isSmall && { fontSize: 8.5 },
                            { color: isSelected ? item.accentColor : colors.textMuted },
                          ]}
                        >
                          {item.badge}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.themeDesc, isSmall && { fontSize: 10.5, lineHeight: 14 }, { color: colors.textMuted }]}>{item.desc}</Text>
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
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          {t('settings.vessel', 'VESSEL & BOAT PROFILE')}
        </Text>
        <View style={[styles.card, isSmall && { padding: 10 }, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, isSmall && { fontSize: 12 }, { color: colors.text }]}>{t('settings.boat_name', 'Boat Name')}</Text>
            <TextInput
              style={[
                styles.textInput,
                isSmall && { minWidth: 90, maxWidth: '55%', fontSize: 12, paddingHorizontal: 8, paddingVertical: 5 },
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
            <Text style={[styles.fieldLabel, isSmall && { fontSize: 12 }, { color: colors.text }]}>{t('settings.draft_limit', 'Draft Limit (Meters)')}</Text>
            <TextInput
              style={[
                styles.textInput,
                styles.shortInput,
                isSmall && { minWidth: 50, maxWidth: '40%', fontSize: 12, paddingHorizontal: 8, paddingVertical: 5 },
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
            <Text style={[styles.fieldLabel, isSmall && { fontSize: 12 }, { color: colors.text }]}>{t('settings.cruise_speed', 'Cruise Speed (Knots)')}</Text>
            <TextInput
              style={[
                styles.textInput,
                styles.shortInput,
                isSmall && { minWidth: 50, maxWidth: '40%', fontSize: 12, paddingHorizontal: 8, paddingVertical: 5 },
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

          <Pressable style={[styles.saveVesselBtn, isSmall && { paddingVertical: 10 }, { backgroundColor: colors.accent }]} onPress={handleSaveVessel}>
            <Ionicons name="checkmark-circle" size={isSmall ? 15 : 16} color={isLight ? '#FFFFFF' : '#020B14'} />
            <Text style={[styles.saveVesselBtnText, isSmall && { fontSize: 11.5 }, { color: isLight ? '#FFFFFF' : '#020B14' }]}>
              {t('settings.save_vessel', 'Save Vessel Specs')}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 🌐 Section: Application Language & Translation */}
      <View style={styles.section}>
        <View style={[styles.sectionHeaderRow, isSmall && { flexWrap: 'wrap', gap: 6 }]}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="globe-outline" size={16} color={colors.accent} style={{ marginRight: 6 }} />
            <Text style={[styles.sectionHeader, { color: colors.text, marginLeft: 0 }]}>
              {t('settings.language', 'APPLICATION LANGUAGE')}
            </Text>
          </View>
          <View style={[styles.langBadgePill, isSmall && { paddingHorizontal: 6, paddingVertical: 2 }, { backgroundColor: colors.chipBg, borderColor: colors.accent }]}>
            <Text style={[styles.langBadgePillText, isSmall && { fontSize: 10 }, { color: colors.accent }]}>
              {availableLanguages.find((l) => l.code === language)?.flag}{' '}
              {availableLanguages.find((l) => l.code === language)?.nativeName}
            </Text>
          </View>
        </View>

        <View style={[styles.card, isSmall && { padding: 10 }, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.langSectionSub, isSmall && { fontSize: 10.5, lineHeight: 15, marginBottom: 8 }, { color: colors.textSecondary }]}>
            {t('settings.language.subtitle', 'Choose your preferred language for the app')}
          </Text>
          <LanguageDropdown />
        </View>
      </View>

      {/* 2. Units */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          {t('settings.units', 'UNITS & MEASUREMENTS')}
        </Text>
        <View style={[styles.card, isSmall && { padding: 10 }, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, isSmall && { fontSize: 12 }, { color: colors.text }]}>{t('settings.distance_unit', 'Distance Unit')}</Text>
            <View style={[styles.toggleRow, isSmall && { gap: 3 }]}>
              {(['NM', 'KM', 'MI'] as const).map((u) => (
                <Pressable
                  key={u}
                  style={[
                    styles.unitBtn,
                    isSmall && { paddingHorizontal: 7, paddingVertical: 4 },
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
                      isSmall && { fontSize: 10 },
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
            <Text style={[styles.fieldLabel, isSmall && { fontSize: 12 }, { color: colors.text }]}>{t('settings.speed_unit', 'Speed Unit')}</Text>
            <View style={[styles.toggleRow, isSmall && { gap: 3 }]}>
              {(['KTS', 'KMH'] as const).map((u) => (
                <Pressable
                  key={u}
                  style={[
                    styles.unitBtn,
                    isSmall && { paddingHorizontal: 7, paddingVertical: 4 },
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
                      isSmall && { fontSize: 10 },
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
            <Text style={[styles.fieldLabel, isSmall && { fontSize: 12 }, { color: colors.text }]}>{t('settings.depth_unit', 'Depth Unit')}</Text>
            <View style={[styles.toggleRow, isSmall && { gap: 3 }]}>
              {(['M', 'FT'] as const).map((u) => (
                <Pressable
                  key={u}
                  style={[
                    styles.unitBtn,
                    isSmall && { paddingHorizontal: 7, paddingVertical: 4 },
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
                      isSmall && { fontSize: 10 },
                      { color: colors.textSecondary },
                      depthUnit === u && { color: colors.accent, fontWeight: '700' },
                    ]}
                  >
                    {u === 'M' ? t('settings.meters', 'Meters') : t('settings.feet', 'Feet')}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* 3. Safety Alarms */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          {t('settings.alarms', 'NAVIGATION ALARMS & SENSORS')}
        </Text>
        <View style={[styles.card, isSmall && { padding: 10 }, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.fieldRow}>
            <View style={styles.switchInfo}>
              <Text style={[styles.fieldLabel, isSmall && { fontSize: 12 }, { color: colors.text }]}>{t('settings.high_gps', 'High-Precision GPS')}</Text>
              <Text style={[styles.fieldSub, isSmall && { fontSize: 10 }, { color: colors.textSecondary }]}>{t('settings.high_gps_sub', '1-second interval NMEA tracking')}</Text>
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
              <Text style={[styles.fieldLabel, isSmall && { fontSize: 12 }, { color: colors.text }]}>{t('settings.shallow_warning', 'Shallow Water Warning')}</Text>
              <Text style={[styles.fieldSub, isSmall && { fontSize: 10 }, { color: colors.textSecondary }]}>{t('settings.shallow_sub', `Alarm when depth is < ${boatDraft}m`)}</Text>
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
              <Text style={[styles.fieldLabel, isSmall && { fontSize: 12 }, { color: colors.text }]}>{t('settings.danger_alerts', 'Arabian Sea Danger Alerts')}</Text>
              <Text style={[styles.fieldSub, isSmall && { fontSize: 10 }, { color: colors.textSecondary }]}>{t('settings.danger_alerts_sub', 'Hazard warnings around coastal rocks')}</Text>
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
              <Text style={[styles.fieldLabel, isSmall && { fontSize: 12 }, { color: colors.text }]}>{t('settings.keep_awake', 'Keep Screen Awake')}</Text>
              <Text style={[styles.fieldSub, isSmall && { fontSize: 10 }, { color: colors.textSecondary }]}>{t('settings.keep_awake_sub', 'Never sleep during active navigation')}</Text>
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
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{t('settings.map_display', 'MAP DISPLAY & CHARTS')}</Text>
        <View style={[styles.card, isSmall && { padding: 10 }, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, isSmall && { fontSize: 12 }, { color: colors.text }]}>{t('settings.depth_contours', 'Bathymetric Depth Contours')}</Text>
            <Switch
              value={showContours}
              onValueChange={setShowContours}
              trackColor={{ false: isLight ? '#CBD5E1' : '#334155', true: colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, isSmall && { fontSize: 12 }, { color: colors.text }]}>{t('settings.seamarks_buoys', 'Nautical Seamarks & Buoys')}</Text>
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
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          {t('settings.backup', 'DATA & GPX BACKUP')}
        </Text>
        <View style={[styles.card, isSmall && { padding: 10 }, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.fieldRow}>
            <View>
              <Text style={[styles.fieldLabel, isSmall && { fontSize: 12 }, { color: colors.text }]}>{t('settings.saved_waypoints', 'Saved Waypoints')}</Text>
              <Text style={[styles.fieldSub, isSmall && { fontSize: 10 }, { color: colors.textSecondary }]}>{waypoints.length} {t('settings.spots_in_storage', 'spots in storage')}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={[styles.actionsRow, isSmall && { flexDirection: 'column', gap: 8 }]}>
            <Pressable
              style={[
                styles.actionBtn,
                isSmall && { width: '100%', paddingVertical: 10 },
                { backgroundColor: colors.chipBg, borderColor: colors.chipBorder },
              ]}
              onPress={handleExportGpx}
            >
              <Ionicons name="download-outline" size={16} color={colors.accent} />
              <Text style={[styles.actionBtnText, isSmall && { fontSize: 11.5 }, { color: colors.accent }]}>{t('settings.export_gpx', 'Export GPX')}</Text>
            </Pressable>

            <Pressable
              style={[
                styles.actionBtn,
                isSmall && { width: '100%', paddingVertical: 10 },
                { backgroundColor: colors.chipBg, borderColor: colors.chipBorder },
              ]}
              onPress={handleImportGpx}
            >
              <Ionicons name="cloud-upload-outline" size={16} color={colors.accent} />
              <Text style={[styles.actionBtnText, isSmall && { fontSize: 11.5 }, { color: colors.accent }]}>{t('settings.import_gpx', 'Import GPX')}</Text>
            </Pressable>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <Pressable style={styles.resetBtn} onPress={handleResetPrompt}>
            <Ionicons name="refresh-outline" size={16} color="#EF4444" />
            <Text style={[styles.resetBtnText, isSmall && { fontSize: 11.5 }]}>{t('settings.reset_waypoints', 'Reset Waypoints to Default')}</Text>
          </Pressable>
        </View>
      </View>

      {/* 6. Emergency VHF */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{t('settings.emergency', 'MARINE EMERGENCY CHANNELS')}</Text>
        <View style={[styles.card, isSmall && { padding: 10 }, { backgroundColor: colors.card, borderColor: 'rgba(239, 68, 68, 0.25)' }]}>
          <View style={styles.emergencyRow}>
            <Ionicons name="radio" size={18} color="#EF4444" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.emergencyTitle, isSmall && { fontSize: 12 }, { color: colors.text }]}>{t('settings.vhf_16', 'VHF CHANNEL 16')}</Text>
              <Text style={[styles.emergencySub, isSmall && { fontSize: 10 }, { color: colors.textSecondary }]}>
                {t('settings.vhf_sub', 'International Maritime Distress & Safety')}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.emergencyRow}>
            <Ionicons name="call" size={18} color="#22C55E" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.emergencyTitle, isSmall && { fontSize: 12 }, { color: colors.text }]}>{t('settings.coast_guard_title', 'COAST GUARD: 1554')}</Text>
              <Text style={[styles.emergencySub, isSmall && { fontSize: 10 }, { color: colors.textSecondary }]}>
                {t('settings.coast_guard_sub', '24x7 Indian Coast Guard Maritime Search & Rescue')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 🛠️ Captain Developer & Diagnostics Sandbox (Collapsible) */}
      <View style={[styles.section, { marginTop: 4, marginBottom: 28 }]}>
        <Pressable
          style={[styles.devToggleBar, { borderColor: colors.cardBorder }]}
          onPress={() => setShowDevControls((prev) => !prev)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="construct-outline" size={13} color={colors.textSecondary} />
            <Text style={[styles.devToggleBarText, { color: colors.textSecondary }]}>
              DEVELOPER & DEMO CONTROLS
            </Text>
          </View>
          <Ionicons
            name={showDevControls ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.textSecondary}
          />
        </Pressable>

        {showDevControls && (
          <View
            style={[
              styles.card,
              isSmall && { padding: 10 },
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                marginTop: 6,
              },
            ]}
          >
            <Text style={[styles.devControlsTitle, { color: colors.textSecondary, marginBottom: 8 }]}>
              TRIAL & REWARD SIMULATION
            </Text>
            <View style={styles.devBtnsWrap}>
              <Pressable style={styles.devChip} onPress={devResetTrial}>
                <Text style={styles.devChipText}>Reset 3D Trial</Text>
              </Pressable>
              <Pressable style={[styles.devChip, { borderColor: '#EF4444' }]} onPress={devExpireTrial}>
                <Text style={[styles.devChipText, { color: '#EF4444' }]}>Expire Trial</Text>
              </Pressable>
              <Pressable style={[styles.devChip, { borderColor: '#22C55E' }]} onPress={devAddReferralReward}>
                <Text style={[styles.devChipText, { color: '#22C55E' }]}>+10d Referral</Text>
              </Pressable>
              <Pressable style={[styles.devChip, { borderColor: '#F59E0B' }]} onPress={() => devSetExpiryDays(5)}>
                <Text style={[styles.devChipText, { color: '#F59E0B' }]}>Set 5d Expiry</Text>
              </Pressable>
              <Pressable style={[styles.devChip, { borderColor: '#10B981' }]} onPress={() => devSetExpiryDays(365)}>
                <Text style={[styles.devChipText, { color: '#10B981' }]}>Set 1y Pro</Text>
              </Pressable>
            </View>
          </View>
        )}
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
    gap: 8,
  },
  fieldLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
    paddingRight: 6,
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
    flexShrink: 0,
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
    flexWrap: 'wrap',
    gap: 6,
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
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  offlineSectionSub: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: -4,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  downloadProgressCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressTitleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cancelDownloadBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  cancelDownloadText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressStatText: {
    fontSize: 11,
    fontWeight: '600',
  },
  offlineItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  offlineIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineTextWrap: {
    flex: 1,
  },
  regionTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  offlineItemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  downloadedPill: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22C55E',
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  downloadedPillText: {
    color: '#22C55E',
    fontSize: 9,
    fontWeight: '800',
  },
  offlineItemDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  offlineSizeLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  downloadActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  downloadActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  harborPacksHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  storageFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  storageStatsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  storageStatsText: {
    fontSize: 11,
  },
  nearbyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  nearbyTitleWithDot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulsingGpsDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  nearbyGpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  nearbyGpsBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  distancePill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 1,
  },
  distancePillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  showMoreRegionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 4,
  },
  showMoreRegionsBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  offlineStatusStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  statusStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusStripTextWrap: {
    flex: 1,
  },
  statusStripTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  statusStripSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  currentAreaHeroCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    margin: 8,
  },
  currentAreaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentAreaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  currentAreaBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  currentAreaCoordText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  currentAreaBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  currentAreaTextWrap: {
    flex: 1,
  },
  currentAreaTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  currentAreaDesc: {
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },
  downloadHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 9,
    gap: 5,
  },
  downloadHeroBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  devToggleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  devToggleBarText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  devControlsTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  devBtnsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  devChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  devChipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  // Section 0: Pro Membership & Expiry Styles
  proMembershipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
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
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
  referralBonusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginVertical: 4,
  },
  referralBonusPillText: {
    color: '#22C55E',
    fontSize: 11,
    fontWeight: '700',
  },
  langBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  langBadgePillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  langSectionSub: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  langCard: {
    width: '48.5%',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  langCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  langFlag: {
    fontSize: 18,
  },
  langRadioUnchecked: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  langNativeName: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  langEnglishName: {
    fontSize: 11,
    marginTop: 1,
  },
  langRegionText: {
    fontSize: 9,
    marginTop: 3,
  },
});

