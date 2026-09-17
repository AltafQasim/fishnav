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
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapColors } from '@/constants/map-theme';
import { useAuth } from '@/context/auth-context';
import { useSubscription } from '@/context/subscription-context';
import { useAppTheme } from '@/context/theme-context';
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
  const { theme, setTheme, colors, isLight, isDark, isHighContrast } = useAppTheme();
  const { captain, updateCaptain } = useAuth();
  const { waypoints, resetWaypoints } = useWaypoints();
  const { savedTrips } = useTripTracking();
  const {
    isPro,
    hasReferralBonus,
    bonusProDaysRemaining,
    isTrialActive,
    isTrialExpired,
    trialDaysRemaining,
    referralDaysEarned,
    referralCount,
    openProModal,
    openReferralModal,
    devResetTrial,
    devExpireTrial,
    devAddReferralReward,
  } = useSubscription();

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

  // 🗺️ Offline Marine Charts State
  const { location } = useUserLocation();
  const [downloadedRegions, setDownloadedRegions] = useState<DownloadedRegionMeta[]>([]);
  const [storageUsageMb, setStorageUsageMb] = useState<number>(0);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);

  const refreshOfflineStatus = useCallback(async () => {
    const [regions, mb] = await Promise.all([
      offlineTileManager.getDownloadedRegions(),
      offlineTileManager.getOfflineStorageUsageMb(),
    ]);
    setDownloadedRegions(regions);
    setStorageUsageMb(mb);
  }, []);

  const [showAllRegions, setShowAllRegions] = useState(false);

  const displayedRegions = useMemo(() => {
    return offlineTileManager.getNearbyRegions(
      location?.latitude,
      location?.longitude,
      showAllRegions ? 10 : 4,
    );
  }, [location?.latitude, location?.longitude, showAllRegions]);

  useEffect(() => {
    refreshOfflineStatus();
  }, [refreshOfflineStatus]);

  const handleDownloadRegion = async (region: OfflineRegion) => {
    if (downloadProgress?.isDownloading) {
      Alert.alert('Download in Progress', 'Please wait until the current map chart finishes downloading.');
      return;
    }

    setDownloadProgress({
      total: region.estimatedTiles,
      completed: 0,
      failed: 0,
      percent: 0,
      regionId: region.id,
      regionName: region.name,
      isDownloading: true,
    });

    const success = await offlineTileManager.downloadRegion(region, (progress) => {
      setDownloadProgress(progress);
    });

    await refreshOfflineStatus();
    setDownloadProgress(null);

    if (success) {
      Alert.alert(
        '✓ Chart Saved Offline',
        `"${region.name}" has been successfully downloaded! You can now navigate this area in deep sea with 0% cellular internet.`
      );
    } else {
      Alert.alert(
        'Download Incomplete',
        'Could not complete downloading all map tiles. Please check your internet connection and try again.'
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

  const handleClearCache = () => {
    Alert.alert(
      'Clear Offline Charts',
      'Are you sure you want to remove all downloaded offline map tiles? They can be re-downloaded at any time.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await offlineTileManager.clearAllOfflineTiles();
            await refreshOfflineStatus();
            Alert.alert('Cleared', 'All offline map tiles have been cleared.');
          },
        },
      ]
    );
  };

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
      showsVerticalScrollIndicator={false} >
      {/* 👑 Section 0: FishNav Pro & Fleet Referral Membership */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeader, { color: '#F59E0B' }]}>
            MEMBERSHIP & PRO ACCESS
          </Text>
          <View
            style={[
              styles.badgeTheme,
              {
                backgroundColor: isPro
                  ? 'rgba(245, 158, 11, 0.15)'
                  : hasReferralBonus
                    ? 'rgba(34, 197, 94, 0.15)'
                    : isTrialExpired
                      ? 'rgba(239, 68, 68, 0.15)'
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
            <Text
              style={[
                styles.badgeThemeText,
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
                ? 'PRO MEMBER 👑'
                : hasReferralBonus
                  ? `${bonusProDaysRemaining}D BONUS 🎁`
                  : isTrialExpired
                    ? 'TRIAL EXPIRED 🚨'
                    : `${trialDaysRemaining}D TRIAL ACTIVE ⚡`}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.proMembershipRow}>
            <View
              style={[
                styles.proIconBox,
                {
                  backgroundColor: isPro
                    ? 'rgba(245, 158, 11, 0.15)'
                    : hasReferralBonus
                      ? 'rgba(34, 197, 94, 0.12)'
                      : 'rgba(0, 240, 255, 0.12)',
                  borderColor: isPro ? '#F59E0B' : hasReferralBonus ? '#22C55E' : colors.accent,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={isPro ? 'crown' : hasReferralBonus ? 'gift' : 'shield-star'}
                size={24}
                color={isPro ? '#F59E0B' : hasReferralBonus ? '#22C55E' : colors.accent}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.proMembershipTitle, { color: colors.text }]}>
                {isPro
                  ? 'FishNav Pro Console Active'
                  : hasReferralBonus
                    ? 'Referral Bonus Pass Active'
                    : '3-Day Free Trial Mode'}
              </Text>
              <Text style={[styles.proMembershipSub, { color: colors.textSecondary }]}>
                {isPro
                  ? 'Full bathymetry, AI fishing hotspots & AIS vessel radar unlocked.'
                  : hasReferralBonus
                    ? `You have ${bonusProDaysRemaining} days of free Pro access from Captain Invites.`
                    : isTrialExpired
                      ? 'Free trial has ended. Upgrade to continue high-res navigation.'
                      : `You have ${trialDaysRemaining} days remaining of unrestricted Pro trial.`}
              </Text>
            </View>
          </View>

          {/* Referral Bonus Tag if any */}
          {referralDaysEarned > 0 && (
            <View style={styles.referralBonusPill}>
              <Ionicons name="gift" size={14} color="#22C55E" />
              <Text style={styles.referralBonusPillText}>
                +{referralDaysEarned} Days Free Pro earned from {referralCount} Captain Invites
              </Text>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* Action Buttons: Upgrade Pro & Invite Crew */}
          <View style={styles.actionsRow}>
            <Pressable
              style={[
                styles.actionBtn,
                {
                  backgroundColor: isPro
                    ? colors.chipBg
                    : isLight
                      ? '#E0F2FE'
                      : 'rgba(0, 240, 255, 0.18)',
                  borderColor: colors.accent,
                },
              ]}
              onPress={() => openProModal('settings_btn')}
            >
              <MaterialCommunityIcons
                name="crown"
                size={16}
                color={colors.accent}
              />
              <Text style={[styles.actionBtnText, { color: colors.accent }]}>
                {isPro ? 'Manage Pro' : 'Upgrade to Pro'}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.actionBtn,
                {
                  backgroundColor: isLight ? '#DCFCE7' : 'rgba(34, 197, 94, 0.14)',
                  borderColor: '#22C55E',
                },
              ]}
              onPress={openReferralModal}
            >
              <Ionicons name="people" size={16} color="#22C55E" />
              <Text style={[styles.actionBtnText, { color: '#22C55E' }]}>
                Invite Crew (+10d)
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

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

      {/* 🗺️ OFFLINE MARINE CHARTS & REGIONAL TILES */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <MaterialCommunityIcons name="map-clock-outline" size={18} color={colors.accent} style={{ marginRight: 6 }} />
            <Text style={[styles.sectionHeader, { color: colors.accent }]}>
              OFFLINE NAUTICAL CHARTS
            </Text>
          </View>
          <View
            style={[
              styles.badgeTheme,
              {
                backgroundColor: downloadedRegions.length > 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                borderColor: downloadedRegions.length > 0 ? '#22C55E' : '#F59E0B',
              },
            ]}
          >
            <Text style={[styles.badgeThemeText, { color: downloadedRegions.length > 0 ? '#22C55E' : '#F59E0B' }]}>
              {downloadedRegions.length > 0 ? 'DEEP-SEA READY ✓' : 'NEEDS SETUP ⚡'}
            </Text>
          </View>
        </View>

        {/* 🛡️ Nautical Offline Readiness Strip */}
        <View
          style={[
            styles.offlineStatusStrip,
            {
              backgroundColor: downloadedRegions.length > 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              borderColor: downloadedRegions.length > 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)',
            },
          ]}
        >
          <View style={styles.statusStripLeft}>
            <View
              style={[
                styles.statusIconWrap,
                { backgroundColor: downloadedRegions.length > 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)' },
              ]}
            >
              <MaterialCommunityIcons
                name={downloadedRegions.length > 0 ? 'shield-check' : 'cloud-download-outline'}
                size={20}
                color={downloadedRegions.length > 0 ? '#22C55E' : '#F59E0B'}
              />
            </View>
            <View style={styles.statusStripTextWrap}>
              <Text style={[styles.statusStripTitle, { color: downloadedRegions.length > 0 ? '#22C55E' : '#F59E0B' }]}>
                {downloadedRegions.length > 0 ? 'OFFLINE CHARTS READY FOR SEA' : 'NO OFFLINE CHARTS SAVED'}
              </Text>
              <Text style={[styles.statusStripSub, { color: colors.textSecondary }]}>
                {downloadedRegions.length > 0
                  ? `${downloadedRegions.length} chart zone(s) saved • ${storageUsageMb} MB cached on phone`
                  : 'Pre-download charts while connected to port Wi-Fi or 4G before sailing'}
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
                  Downloading {downloadProgress.regionName}...
                </Text>
              </View>
              <Pressable onPress={() => offlineTileManager.cancelDownload()} style={styles.cancelDownloadBtn}>
                <Text style={styles.cancelDownloadText}>Cancel</Text>
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
                {downloadProgress.percent === 100 ? 'Finalizing cache...' : 'Saving high-res tiles'}
              </Text>
            </View>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {/* 📍 Hero Option: Current Boat Sea Area */}
          <View
            style={[
              styles.currentAreaHeroCard,
              {
                backgroundColor: isLight ? '#F0FDF4' : 'rgba(0, 240, 255, 0.05)',
                borderColor: isLight ? '#86EFAC' : 'rgba(0, 240, 255, 0.25)',
              },
            ]}
          >
            <View style={styles.currentAreaHeader}>
              <View style={styles.currentAreaBadge}>
                <Ionicons name="navigate" size={11} color={colors.accent} style={{ marginRight: 4 }} />
                <Text style={[styles.currentAreaBadgeText, { color: colors.accent }]}>
                  CURRENT BOAT PERIMETER
                </Text>
              </View>
              <Text style={[styles.currentAreaCoordText, { color: colors.textMuted }]}>
                {location
                  ? `${location.latitude.toFixed(3)}°N, ${location.longitude.toFixed(3)}°E`
                  : 'Veraval Port Waters'}
              </Text>
            </View>

            <View style={styles.currentAreaBody}>
              <View style={styles.currentAreaTextWrap}>
                <Text style={[styles.currentAreaTitle, { color: colors.text }]}>
                  Surrounding Sea Chart (30 NM)
                </Text>
                <Text style={[styles.currentAreaDesc, { color: colors.textSecondary }]}>
                  Instant 30 Nautical Mile boundary covering all fishing spots, banks & channels
                </Text>
              </View>
              <Pressable
                style={[
                  styles.downloadHeroBtn,
                  { backgroundColor: colors.accent },
                  downloadProgress?.isDownloading && { opacity: 0.5 },
                ]}
                disabled={downloadProgress?.isDownloading}
                onPress={handleDownloadCurrentArea}
              >
                {downloadProgress?.regionId === 'current-area' ? (
                  <ActivityIndicator size="small" color={isLight ? '#FFFFFF' : '#020B14'} />
                ) : (
                  <>
                    <Ionicons name="cloud-download" size={15} color={isLight ? '#FFFFFF' : '#020B14'} />
                    <Text style={[styles.downloadHeroBtnText, { color: isLight ? '#FFFFFF' : '#020B14' }]}>
                      Download
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* 📍 Dynamic Nearby Harbor Suggestions Header */}
          <View style={styles.nearbyHeaderRow}>
            <View style={styles.nearbyTitleWithDot}>
              <View
                style={[
                  styles.pulsingGpsDot,
                  { backgroundColor: location ? '#22C55E' : '#F59E0B' },
                ]}
              />
              <Text style={[styles.harborPacksHeader, { color: colors.textSecondary }]}>
                {location ? 'NEARBY HARBOR CHARTS (GPS SUGGESTIONS)' : 'POPULAR HARBOR CHARTS (GUJARAT)'}
              </Text>
            </View>
            <View style={[styles.nearbyGpsBadge, { backgroundColor: colors.chipBg, borderColor: colors.chipBorder }]}>
              <Ionicons name="location-outline" size={11} color={colors.accent} style={{ marginRight: 2 }} />
              <Text style={[styles.nearbyGpsBadgeText, { color: colors.accent }]}>
                {location ? 'TOP 4 CLOSEST' : 'DEFAULT'}
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
                <View style={styles.offlineItemRow}>
                  <View
                    style={[
                      styles.offlineIconWrap,
                      { backgroundColor: isDownloaded ? 'rgba(34, 197, 94, 0.15)' : colors.chipBg },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={isDownloaded ? 'check-decagram' : 'anchor'}
                      size={22}
                      color={isDownloaded ? '#22C55E' : colors.accent}
                    />
                  </View>
                  <View style={styles.offlineTextWrap}>
                    <View style={styles.regionTitleLine}>
                      <Text style={[styles.offlineItemTitle, { color: colors.text }]}>
                        {region.name}
                      </Text>
                      {isDownloaded ? (
                        <View style={styles.downloadedPill}>
                          <Text style={styles.downloadedPillText}>SAVED</Text>
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
                              {region.distanceNm <= 3 ? '⚓ IN PORT' : `${region.distanceNm} NM`}
                            </Text>
                          </View>
                        )
                      )}
                    </View>
                    <Text style={[styles.offlineItemDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                      {region.description}
                    </Text>
                    <Text style={[styles.offlineSizeLabel, { color: colors.textMuted }]}>
                      {region.estimatedTiles} tiles • ~{region.estimatedSizeMb} MB • Zoom {region.minZoom}-{region.maxZoom}
                    </Text>
                  </View>

                  <Pressable
                    style={[
                      styles.downloadActionBtn,
                      isDownloaded
                        ? { backgroundColor: colors.chipBg, borderColor: '#22C55E', borderWidth: 1 }
                        : { backgroundColor: colors.accent },
                      downloadProgress?.isDownloading && { opacity: 0.5 },
                    ]}
                    disabled={downloadProgress?.isDownloading}
                    onPress={() => handleDownloadRegion(region)}
                  >
                    {isDownloadingThis ? (
                      <ActivityIndicator size="small" color={isLight ? '#FFFFFF' : '#020B14'} />
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
                          {isDownloaded ? 'Update' : 'Download'}
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
                ? '▴ Show Top 4 Nearest Only'
                : '▾ Show All 10 Coastal Regions'}
            </Text>
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* Storage Footer */}
          <View style={styles.storageFooterRow}>
            <View style={styles.storageStatsWrap}>
              <Ionicons name="save-outline" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.storageStatsText, { color: colors.textSecondary }]}>
                Offline Storage: <Text style={{ color: colors.text, fontWeight: '700' }}>{storageUsageMb} MB</Text>
                {downloadedRegions.length > 0
                  ? ` (${downloadedRegions.length} pack${downloadedRegions.length > 1 ? 's' : ''})`
                  : ' (No maps saved)'}
              </Text>
            </View>

            {storageUsageMb > 0 && (
              <Pressable style={styles.clearCacheBtn} onPress={handleClearCache}>
                <Ionicons name="trash-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                <Text style={styles.clearCacheBtnText}>Clear</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

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
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  clearCacheBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  clearCacheBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
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
});
