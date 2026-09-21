import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SubscriptionPlan, useSubscription } from '@/context/subscription-context';
import { useLanguage } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';

const PRO_FEATURES = [
  {
    icon: 'cloud-offline' as const,
    title: '100% Offline Coastal Marine Charts',
    desc: 'Download high-density bathymetric tiles for zero-connectivity offshore voyages.',
  },
  {
    icon: 'location' as const,
    title: 'Unlimited Secret Waypoints & Drift Watch',
    desc: 'Store 1,000+ fishing spots, custom reefs, and automatic anchor drag alerts.',
  },
  {
    icon: 'radio' as const,
    title: 'Emergency SOS & Coast Guard Priority',
    desc: 'Direct Coast Guard SAR channel coordinates & instant position broadcast.',
  },
];

export function FishNavProModal() {
  const insets = useSafeAreaInsets();
  const { colors, isLight } = useAppTheme();
  const { t } = useLanguage();
  const { width: windowWidth } = useWindowDimensions();
  const {
    isPro,
    proPlan,
    proExpiresAt,
    proDaysRemaining,
    proHoursRemaining,
    proFormattedExpiry,
    proProgressPercent,
    isExpiringSoon,
    planDisplayName,
    licenseCertificateId,
    hasReferralBonus,
    bonusProDaysRemaining,
    bonusProFormattedExpiry,
    hasFullAccess,
    isProModalVisible,
    closeProModal,
    isTrialActive,
    isTrialExpired,
    trialDaysRemaining,
    trialHoursRemaining,
    trialProgressPercent,
    trialFormattedExpiry,
    subscribeToPro,
    openReferralModal,
  } = useSubscription();

  const proFeatures = [
    {
      icon: 'cloud-offline' as const,
      title: t('pro.feat_offline_title', '100% Offline Coastal Marine Charts'),
      desc: t('pro.feat_offline_desc', 'Download high-density bathymetric tiles for zero-connectivity offshore voyages.'),
    },
    {
      icon: 'location' as const,
      title: t('pro.feat_waypoints_title', 'Unlimited Secret Waypoints & Drift Watch'),
      desc: t('pro.feat_waypoints_desc', 'Store 1,000+ fishing spots, custom reefs, and automatic anchor drag alerts.'),
    },
    {
      icon: 'radio' as const,
      title: t('pro.feat_sos_title', 'Emergency SOS & Coast Guard Priority'),
      desc: t('pro.feat_sos_desc', 'Direct Coast Guard SAR channel coordinates & instant position broadcast.'),
    },
  ];

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(proPlan || 'annual');

  // Keep selectedPlan in sync if proPlan changes
  useEffect(() => {
    if (proPlan) {
      setSelectedPlan(proPlan);
    }
  }, [proPlan]);

  if (!isProModalVisible) return null;

  const cardMaxWidth = Math.min(windowWidth - 32, 480);
  const isPaywallEnforced = isTrialExpired && !hasFullAccess;

  const handleUpgradePress = () => {
    if (isPro && selectedPlan === proPlan) {
      closeProModal();
      return;
    }
    subscribeToPro(selectedPlan);
  };

  const handleReferralPress = () => {
    closeProModal();
    openReferralModal();
  };

  return (
    <Modal
      visible={isProModalVisible}
      transparent
      animationType="fade"
      onRequestClose={isPaywallEnforced ? () => { } : closeProModal}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable
          style={styles.backdropTouch}
          onPress={isPaywallEnforced ? undefined : closeProModal}
        />

        <View
          style={[
            styles.card,
            {
              width: cardMaxWidth,
              backgroundColor: isLight ? '#FFFFFF' : '#020C17',
              borderColor: isPaywallEnforced ? '#EF4444' : isLight ? '#E2E8F0' : 'rgba(0, 240, 255, 0.35)',
              paddingBottom: Math.max(insets.bottom, 16) + 12,
            },
          ]}
        >
          {/* Top Golden / Red Accent Stripe */}
          <LinearGradient
            colors={isPaywallEnforced ? ['#EF4444', '#DC2626', '#B91C1C'] : ['#F59E0B', '#00F0FF', '#38BDF8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topStripe}
          />

          {/* Close X Button - Hidden only if paywall is strictly enforced */}
          {!isPaywallEnforced && (
            <Pressable
              style={[styles.closeBtn, { backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.08)' }]}
              onPress={closeProModal}
              hitSlop={12}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </Pressable>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Crown & Trident Hero */}
            <View style={styles.heroSection}>
              <View
                style={[
                  styles.crownCircle,
                  {
                    backgroundColor: isLight ? '#FEF3C7' : 'rgba(245, 158, 11, 0.15)',
                    borderColor: '#F59E0B',
                  },
                ]}
              >
                <MaterialCommunityIcons name="crown" size={34} color="#F59E0B" />
              </View>

              <View style={styles.proPillBadge}>
                <Text style={styles.proPillBadgeText}>{t('pro.master_license', 'MARITIME MASTER LICENSE')}</Text>
              </View>

              <Text style={[styles.mainTitle, { color: colors.text }]}>
                {isPro
                  ? t('pro.console_active', 'FishNav Pro Console Active')
                  : hasReferralBonus
                    ? t('pro.referral_pass_active', 'Referral Bonus Pass Active')
                    : t('pro.title', 'FishNav Pro Console')}
              </Text>
              <Text style={[styles.mainSubtitle, { color: colors.textSecondary }]}>
                {isPro
                  ? t('pro.active_desc', 'Your vessel navigation license is active. Full bathymetry, AIS radar and AI hotspots are permanently unlocked.')
                  : hasReferralBonus
                    ? t('pro.referral_active_desc', `You have complimentary Pro access unlocked via Captain Referral. Upgrade anytime for perpetual access.`)
                    : t('pro.subtitle', 'Unlock full-spectrum marine bathymetry, AI fishing hotspots, and real-time AIS ship collision radar.')}
              </Text>
            </View>

            {/* Trial Status Countdown Card OR Referral Pass OR Active Pro Status Card */}
            {isPro ? (
              <View
                style={[
                  styles.trialCard,
                  {
                    backgroundColor: isLight ? '#FEF3C7' : 'rgba(245, 158, 11, 0.1)',
                    borderColor: isExpiringSoon ? '#EF4444' : '#F59E0B',
                  },
                ]}
              >
                <View style={styles.trialHeaderRow}>
                  <MaterialCommunityIcons
                    name={isExpiringSoon ? 'shield-alert' : 'shield-crown'}
                    size={22}
                    color={isExpiringSoon ? '#EF4444' : '#F59E0B'}
                  />
                  <Text
                    style={[
                      styles.trialTitle,
                      { color: isExpiringSoon ? '#EF4444' : '#F59E0B' },
                    ]}
                  >
                    {proPlan === 'lifetime'
                      ? t('pro.lifetime_active', 'LIFETIME SKIPPER LICENSE ACTIVE')
                      : isExpiringSoon
                        ? `${t('pro.expiring_soon', 'LICENSE EXPIRING SOON')} (${proDaysRemaining}D)`
                        : proPlan === 'quarterly'
                          ? `${t('pro.quarterly_title', 'Quarterly Voyager').toUpperCase()} (${proDaysRemaining}D)`
                          : `${t('pro.annual_title', 'Annual Master Mariner').toUpperCase()} (${proDaysRemaining}D)`}
                  </Text>
                </View>

                {/* Big Expiry Countdown Row */}
                {proPlan === 'lifetime' ? (
                  <View style={styles.modalLifetimeRow}>
                    <Text style={{ fontSize: 24 }}>♾️</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalCountdownTitle, { color: colors.text }]}>
                        {t('pro.perpetual_access', 'PERPETUAL MARINE ACCESS')}
                      </Text>
                      <Text style={[styles.trialDesc, { color: colors.textSecondary }]}>
                        {t('pro.perpetual_desc', 'No expiration date • All future bathymetric charts & AIS radar updates included.')}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.modalCountdownContainer}>
                    <View style={styles.modalCountdownHero}>
                      <View>
                        <Text style={[styles.modalCountdownSub, { color: colors.textSecondary }]}>
                          {t('pro.time_remaining', 'TIME REMAINING')}
                        </Text>
                        <Text
                          style={[
                            styles.modalCountdownBigNum,
                            { color: isExpiringSoon ? '#EF4444' : '#F59E0B' },
                          ]}
                        >
                          {proDaysRemaining} <Text style={styles.modalCountdownUnit}>{t('pro.days_left', 'DAYS LEFT')}</Text>
                        </Text>
                      </View>
                      <View style={styles.modalExpiryDatePill}>
                        <Ionicons name="calendar" size={13} color={isExpiringSoon ? '#EF4444' : '#F59E0B'} />
                        <Text style={[styles.modalExpiryDateText, { color: colors.text }]}>
                          {t('pro.valid_until', 'Valid Until:')} <Text style={{ fontWeight: '800' }}>{proFormattedExpiry}</Text>
                        </Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.modalProgressTrack}>
                      <View
                        style={[
                          styles.modalProgressFill,
                          {
                            width: `${Math.max(5, 100 - proProgressPercent)}%`,
                            backgroundColor: isExpiringSoon ? '#EF4444' : '#F59E0B',
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.modalProgressLabels}>
                      <Text style={[styles.modalProgressLabelText, { color: colors.textMuted }]}>
                        {proPlan === 'quarterly' ? t('pro.cycle_90', '90-Day Cycle') : t('pro.cycle_365', '1-Year License Cycle')}
                      </Text>
                      <Text
                        style={[
                          styles.modalProgressLabelText,
                          { color: isExpiringSoon ? '#EF4444' : '#F59E0B', fontWeight: '700' },
                        ]}
                      >
                        {proDaysRemaining} {t('settings.days_remaining', 'days remaining')} ({Math.max(1, 100 - proProgressPercent)}%)
                      </Text>
                    </View>
                  </View>
                )}

                <Text style={[styles.trialDesc, { color: colors.textSecondary, marginTop: 4 }]}>
                  {t('settings.license_id', 'LICENSE ID:')} {licenseCertificateId}
                </Text>
              </View>
            ) : hasReferralBonus ? (
              <View
                style={[
                  styles.trialCard,
                  {
                    backgroundColor: isLight ? '#F0FDF4' : 'rgba(34, 197, 94, 0.12)',
                    borderColor: '#22C55E',
                  },
                ]}
              >
                <View style={styles.trialHeaderRow}>
                  <MaterialCommunityIcons name="gift-open" size={20} color="#22C55E" />
                  <Text style={[styles.trialTitle, { color: '#22C55E' }]}>
                    {t('settings.status_referral_pass', 'REFERRAL PASS')} • {bonusProDaysRemaining} {t('settings.days_free', 'DAYS FREE')}
                  </Text>
                </View>

                <Text style={[styles.trialDesc, { color: colors.textSecondary }]}>
                  {t('pro.referral_active_desc', 'Complimentary Pro access earned via Captain Referral. Enjoy all offshore features with zero recurring charges.')}
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.trialCard,
                  {
                    backgroundColor: isTrialExpired
                      ? isLight ? '#FEF2F2' : 'rgba(239, 68, 68, 0.12)'
                      : isLight ? '#EFF6FF' : 'rgba(0, 240, 255, 0.08)',
                    borderColor: isTrialExpired ? '#EF4444' : colors.accent,
                  },
                ]}
              >
                <View style={styles.trialHeaderRow}>
                  <Ionicons
                    name={isTrialExpired ? 'alert-circle' : 'time'}
                    size={18}
                    color={isTrialExpired ? '#EF4444' : colors.accent}
                  />
                  <Text
                    style={[
                      styles.trialTitle,
                      { color: isTrialExpired ? '#EF4444' : colors.accent },
                    ]}
                  >
                    {isTrialExpired
                      ? t('settings.trial_ended', '3-DAY FREE TRIAL EXPIRED')
                      : `${t('settings.status_active_trial', '3-DAY TRIAL ACTIVE')} • ${trialDaysRemaining} ${t('pro.days_left', 'DAYS LEFT')}`}
                  </Text>
                </View>

                <Text style={[styles.trialDesc, { color: colors.textSecondary }]}>
                  {isTrialExpired
                    ? t('settings.trial_ended_desc', 'Your 72-hour trial has ended. Upgrade to Pro to continue full offshore navigation & bathymetry.')
                    : `${trialHoursRemaining} ${t('weather.hours_left', 'hours left')}`}
                </Text>

                {/* Countdown Progress Bar */}
                {!isTrialExpired && (
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${trialProgressPercent}%`, backgroundColor: colors.accent },
                      ]}
                    />
                  </View>
                )}
              </View>
            )}

            {/* 🎁 Referral Banner: Earn 1 Month Free Pro */}
            <Pressable
              style={({ pressed }) => [
                styles.referralBanner,
                {
                  backgroundColor: isLight ? '#F0FDF4' : 'rgba(34, 197, 94, 0.1)',
                  borderColor: isLight ? '#BBF7D0' : 'rgba(34, 197, 94, 0.35)',
                  transform: [{ scale: pressed ? 0.99 : 1 }],
                },
              ]}
              onPress={handleReferralPress}
            >
              <View style={styles.referralIconBox}>
                <MaterialCommunityIcons name="gift-open-outline" size={24} color="#22C55E" />
              </View>
              <View style={styles.referralTextCol}>
                <View style={styles.referralHeaderRow}>
                  <Text style={[styles.referralTitle, { color: colors.text }]}>{t('pro.referral_banner_title', 'Want 10 Days Pro Free?')}</Text>
                  <View style={styles.freeBadge}>
                    <Text style={styles.freeBadgeText}>+10 {t('pro.days_left', 'DAYS FREE').toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={[styles.referralDesc, { color: colors.textSecondary }]}>
                  {t('pro.referral_banner_sub', 'Invite fellow boat captains with your link. Earn 10 days of free Pro access for each friend!')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#22C55E" />
            </Pressable>

            {/* Features Showcase Matrix */}
            <View style={styles.featuresSection}>
              <Text style={[styles.featuresHeading, { color: colors.textSecondary }]}>
                {t('pro.features_heading', 'ALL PRO MARITIME CAPABILITIES INCLUDED')}
              </Text>
              <View style={styles.featuresList}>
                {proFeatures.map((feat, idx) => (
                  <View key={idx} style={styles.featureItem}>
                    <View
                      style={[
                        styles.featIconWrap,
                        {
                          backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 240, 255, 0.1)',
                          borderColor: isLight ? '#CBD5E1' : 'rgba(0, 240, 255, 0.25)',
                        },
                      ]}
                    >
                      <Ionicons name={feat.icon} size={16} color={colors.accent} />
                    </View>
                    <View style={styles.featTextWrap}>
                      <Text style={[styles.featTitle, { color: colors.text }]}>{feat.title}</Text>
                      <Text style={[styles.featDesc, { color: colors.textSecondary }]}>{feat.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Pricing Tiers Selection */}
            <View style={styles.plansSection}>
              <Text style={[styles.featuresHeading, { color: colors.textSecondary }]}>
                {isPro
                  ? t('pro.switch_extend', 'SWITCH OR EXTEND VESSEL LICENSE')
                  : hasReferralBonus
                    ? t('pro.switch_extend', 'UPGRADE TO PERMANENT VESSEL LICENSE')
                    : t('pro.choose_membership', 'CHOOSE VESSEL MEMBERSHIP')}
              </Text>

              {/* Plan 1: Annual (Best Value) */}
              <Pressable
                style={[
                  styles.planCard,
                  selectedPlan === 'annual' && styles.planCardSelected,
                  {
                    backgroundColor: isLight ? '#FFFFFF' : 'rgba(4, 23, 40, 0.95)',
                    borderColor: selectedPlan === 'annual' ? '#00F0FF' : isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.1)',
                  },
                ]}
                onPress={() => setSelectedPlan('annual')}
              >
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>{t('pro.best_value', 'BEST VALUE • SAVE 50%')}</Text>
                </View>

                <View style={styles.planHeaderRow}>
                  <View style={styles.planRadioCircle}>
                    {selectedPlan === 'annual' && <View style={styles.planRadioDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planTitle, { color: colors.text }]}>{t('pro.annual_title', 'Annual Master Mariner')}</Text>
                    <Text style={[styles.planPeriod, { color: colors.textSecondary }]}>{t('pro.annual_period', 'Full 12 Months Access')}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.planPrice, { color: colors.text }]}>₹1,499</Text>
                    <Text style={[styles.planSubPrice, { color: colors.accent }]}>₹125/{t('pro.month', 'month')}</Text>
                  </View>
                </View>
              </Pressable>

              {/* Plan 2: Quarterly */}
              <Pressable
                style={[
                  styles.planCard,
                  selectedPlan === 'quarterly' && styles.planCardSelected,
                  {
                    backgroundColor: isLight ? '#FFFFFF' : 'rgba(4, 23, 40, 0.95)',
                    borderColor: selectedPlan === 'quarterly' ? '#00F0FF' : isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.1)',
                  },
                ]}
                onPress={() => setSelectedPlan('quarterly')}
              >
                <View style={styles.planHeaderRow}>
                  <View style={styles.planRadioCircle}>
                    {selectedPlan === 'quarterly' && <View style={styles.planRadioDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planTitle, { color: colors.text }]}>{t('pro.quarterly_title', 'Quarterly Voyager')}</Text>
                    <Text style={[styles.planPeriod, { color: colors.textSecondary }]}>{t('pro.quarterly_period', '3 Months Seasonal Fishing')}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.planPrice, { color: colors.text }]}>₹499</Text>
                    <Text style={[styles.planSubPrice, { color: colors.textSecondary }]}>₹166/{t('pro.month', 'month')}</Text>
                  </View>
                </View>
              </Pressable>

              {/* Plan 3: Lifetime */}
              <Pressable
                style={[
                  styles.planCard,
                  selectedPlan === 'lifetime' && styles.planCardSelected,
                  {
                    backgroundColor: isLight ? '#FFFFFF' : 'rgba(4, 23, 40, 0.95)',
                    borderColor: selectedPlan === 'lifetime' ? '#00F0FF' : isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.1)',
                  },
                ]}
                onPress={() => setSelectedPlan('lifetime')}
              >
                <View style={styles.planHeaderRow}>
                  <View style={styles.planRadioCircle}>
                    {selectedPlan === 'lifetime' && <View style={styles.planRadioDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planTitle, { color: colors.text }]}>{t('pro.lifetime_title', 'Lifetime Skipper Pass')}</Text>
                    <Text style={[styles.planPeriod, { color: colors.textSecondary }]}>{t('pro.lifetime_period', 'One-Time Permanent License')}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.planPrice, { color: colors.text }]}>₹3,999</Text>
                    <Text style={[styles.planSubPrice, { color: '#F59E0B' }]}>{t('pro.forever', 'Forever')}</Text>
                  </View>
                </View>
              </Pressable>
            </View>

            {/* CTA Upgrade / Manage Button */}
            <Pressable
              style={({ pressed }) => [
                styles.upgradeBtn,
                { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] },
              ]}
              onPress={handleUpgradePress}
            >
              <LinearGradient
                colors={isPro && selectedPlan === proPlan ? ['#10B981', '#059669'] : ['#00F0FF', '#0284C7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.upgradeGradient}
              >
                <MaterialCommunityIcons
                  name={isPro && selectedPlan === proPlan ? 'shield-check' : 'crown'}
                  size={20}
                  color="#020B14"
                />
                <Text style={styles.upgradeBtnText}>
                  {isPro
                    ? selectedPlan === proPlan
                      ? t('pro.license_active', 'PRO LICENSE ACTIVE • DONE')
                      : `${t('pro.switch_extend', 'SWITCH TO').toUpperCase()} ${selectedPlan.toUpperCase()}`
                    : hasReferralBonus
                      ? `${t('pro.upgrade_btn', 'ACTIVATE').toUpperCase()} ${selectedPlan.toUpperCase()}`
                      : t('pro.upgrade_btn', 'UPGRADE TO FISHNAV PRO')}
                </Text>
              </LinearGradient>
            </Pressable>

            {/* Trial / Referral Bonus Dismiss option if user has active access */}
            {(isTrialActive || hasReferralBonus) && !isPro && (
              <Pressable style={styles.dismissTrialBtn} onPress={closeProModal}>
                <Text style={[styles.dismissTrialText, { color: colors.textSecondary }]}>
                  {hasReferralBonus
                    ? `${t('btn.resume', 'Continue')} (${bonusProDaysRemaining} ${t('pro.days_left', 'days left')})`
                    : `${t('btn.resume', 'Continue')} (${trialDaysRemaining} ${t('pro.days_left', 'days left')})`}
                </Text>
              </Pressable>
            )}

            {/* Reassurance Footer */}
            <View style={styles.footerGuarantees}>
              <View style={styles.guaranteeRow}>
                <Ionicons name="shield-checkmark" size={13} color="#22C55E" />
                <Text style={[styles.guaranteeText, { color: colors.textSecondary }]}>
                  {t('pro.guarantee', 'Secure Marine License • Instant Activation • 100% Offline')}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 11, 20, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    maxHeight: '92%',
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#00F0FF',
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 20,
  },
  topStripe: {
    height: 4,
    width: '100%',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    gap: 14,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 4,
  },
  crownCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  proPillBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 8,
  },
  proPillBadgeText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  mainTitle: {
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  mainSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 10,
  },
  trialCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    gap: 6,
  },
  trialHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trialTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  trialDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  referralBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.2,
    padding: 12,
    gap: 12,
  },
  referralIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralTextCol: {
    flex: 1,
  },
  referralHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  referralTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  freeBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  freeBadgeText: {
    color: '#020B14',
    fontSize: 9,
    fontWeight: '800',
  },
  referralDesc: {
    fontSize: 10.5,
    lineHeight: 14,
  },
  featuresSection: {
    gap: 8,
  },
  featuresHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  featuresList: {
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  featIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  featTextWrap: {
    flex: 1,
  },
  featTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  featDesc: {
    fontSize: 10.5,
    lineHeight: 14,
  },
  plansSection: {
    gap: 10,
  },
  planCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    position: 'relative',
  },
  planCardSelected: {
    shadowColor: '#00F0FF',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBadge: {
    position: 'absolute',
    top: -9,
    right: 14,
    backgroundColor: '#00F0FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  saveBadgeText: {
    color: '#020B14',
    fontSize: 9,
    fontWeight: '800',
  },
  planHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#00F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00F0FF',
  },
  planTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  planPeriod: {
    fontSize: 10.5,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '900',
  },
  planSubPrice: {
    fontSize: 10,
    fontWeight: '700',
  },
  upgradeBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#00F0FF',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    marginTop: 4,
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  upgradeBtnText: {
    color: '#020B14',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dismissTrialBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  dismissTrialText: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footerGuarantees: {
    alignItems: 'center',
    marginTop: 2,
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  guaranteeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  modalLifetimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  modalCountdownTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalCountdownContainer: {
    paddingVertical: 6,
  },
  modalCountdownHero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalCountdownSub: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  modalCountdownBigNum: {
    fontSize: 22,
    fontWeight: '900',
  },
  modalCountdownUnit: {
    fontSize: 11,
    fontWeight: '800',
  },
  modalExpiryDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  modalExpiryDateText: {
    fontSize: 11,
  },
  modalProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    marginBottom: 4,
  },
  modalProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  modalProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalProgressLabelText: {
    fontSize: 10,
  },
});

