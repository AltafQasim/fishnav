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
    autoRenew,
    licenseCertificateId,
    toggleAutoRenew,
    restorePurchases,
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
                <Text style={styles.proPillBadgeText}>MARITIME MASTER LICENSE</Text>
              </View>

              <Text style={[styles.mainTitle, { color: colors.text }]}>
                {isPro
                  ? 'FishNav Pro Console Active'
                  : hasReferralBonus
                    ? 'Referral Bonus Pass Active'
                    : 'FishNav Pro Console'}
              </Text>
              <Text style={[styles.mainSubtitle, { color: colors.textSecondary }]}>
                {isPro
                  ? 'Your vessel navigation license is active. Full bathymetry, AIS radar and AI hotspots are permanently unlocked.'
                  : hasReferralBonus
                    ? `You have ${bonusProDaysRemaining} days of complimentary Pro access unlocked via Captain Referral. Upgrade anytime for perpetual access.`
                    : 'Unlock full-spectrum marine bathymetry, AI fishing hotspots, and real-time AIS ship collision radar.'}
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
                      ? 'LIFETIME SKIPPER LICENSE ACTIVE'
                      : isExpiringSoon
                        ? `LICENSE EXPIRING SOON (${proDaysRemaining}D LEFT)`
                        : proPlan === 'quarterly'
                          ? `QUARTERLY VOYAGER (${proDaysRemaining}D LEFT)`
                          : `ANNUAL MASTER MARINER (${proDaysRemaining}D LEFT)`}
                  </Text>
                </View>

                {/* Big Expiry Countdown Row */}
                {proPlan === 'lifetime' ? (
                  <View style={styles.modalLifetimeRow}>
                    <Text style={{ fontSize: 24 }}>♾️</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalCountdownTitle, { color: colors.text }]}>
                        PERPETUAL MARINE ACCESS
                      </Text>
                      <Text style={[styles.trialDesc, { color: colors.textSecondary }]}>
                        No expiration date • All future bathymetric charts & AIS radar updates included.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.modalCountdownContainer}>
                    <View style={styles.modalCountdownHero}>
                      <View>
                        <Text style={[styles.modalCountdownSub, { color: colors.textSecondary }]}>
                          TIME REMAINING
                        </Text>
                        <Text
                          style={[
                            styles.modalCountdownBigNum,
                            { color: isExpiringSoon ? '#EF4444' : '#F59E0B' },
                          ]}
                        >
                          {proDaysRemaining} <Text style={styles.modalCountdownUnit}>DAYS LEFT</Text>
                        </Text>
                      </View>
                      <View style={styles.modalExpiryDatePill}>
                        <Ionicons name="calendar" size={13} color={isExpiringSoon ? '#EF4444' : '#F59E0B'} />
                        <Text style={[styles.modalExpiryDateText, { color: colors.text }]}>
                          Valid Until: <Text style={{ fontWeight: '800' }}>{proFormattedExpiry}</Text>
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
                        {proPlan === 'quarterly' ? '90-Day Cycle' : '1-Year License Cycle'}
                      </Text>
                      <Text
                        style={[
                          styles.modalProgressLabelText,
                          { color: isExpiringSoon ? '#EF4444' : '#F59E0B', fontWeight: '700' },
                        ]}
                      >
                        {proDaysRemaining} days remaining ({Math.max(1, 100 - proProgressPercent)}%)
                      </Text>
                    </View>
                  </View>
                )}

                <Text style={[styles.trialDesc, { color: colors.textSecondary, marginTop: 4 }]}>
                  License ID: {licenseCertificateId}
                </Text>

                {proPlan !== 'lifetime' && (
                  <Pressable
                    style={[
                      styles.proToggleRenewBtn,
                      {
                        backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 0, 0, 0.35)',
                        borderColor: colors.cardBorder,
                      },
                    ]}
                    onPress={toggleAutoRenew}
                  >
                    <Ionicons
                      name={autoRenew ? 'refresh-circle' : 'pause-circle'}
                      size={16}
                      color={autoRenew ? '#10B981' : '#F59E0B'}
                    />
                    <Text style={[styles.proToggleRenewText, { color: colors.text }]}>
                      Auto-Renewal: {autoRenew ? 'ACTIVE (Renews automatically)' : 'PAUSED'}
                    </Text>
                  </Pressable>
                )}
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
                    REFERRAL PASS ACTIVE • {bonusProDaysRemaining} DAYS FREE
                  </Text>
                </View>

                <Text style={[styles.trialDesc, { color: colors.textSecondary }]}>
                  Complimentary Pro access earned via Captain Referral. Enjoy all offshore features with zero recurring charges.
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
                      ? '3-DAY FREE TRIAL EXPIRED'
                      : `3-DAY TRIAL ACTIVE • ${trialDaysRemaining} DAYS LEFT`}
                  </Text>
                </View>

                <Text style={[styles.trialDesc, { color: colors.textSecondary }]}>
                  {isTrialExpired
                    ? 'Your 72-hour trial has ended. Upgrade to Pro to continue full offshore navigation & bathymetry.'
                    : `You have ${trialHoursRemaining} hours left of unrestricted access on your vessel terminal.`}
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
                  <Text style={[styles.referralTitle, { color: colors.text }]}>Want 10 Days Pro Free?</Text>
                  <View style={styles.freeBadge}>
                    <Text style={styles.freeBadgeText}>+10 DAYS FREE</Text>
                  </View>
                </View>
                <Text style={[styles.referralDesc, { color: colors.textSecondary }]}>
                  Invite fellow boat captains with your link. Earn 10 days of free Pro access for each friend!
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#22C55E" />
            </Pressable>

            {/* Features Showcase Matrix */}
            <View style={styles.featuresSection}>
              <Text style={[styles.featuresHeading, { color: colors.textSecondary }]}>
                ALL PRO MARITIME CAPABILITIES INCLUDED
              </Text>
              <View style={styles.featuresList}>
                {PRO_FEATURES.map((feat, idx) => (
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
                  ? 'SWITCH OR EXTEND VESSEL LICENSE'
                  : hasReferralBonus
                    ? 'UPGRADE TO PERMANENT VESSEL LICENSE'
                    : 'CHOOSE VESSEL MEMBERSHIP'}
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
                  <Text style={styles.saveBadgeText}>BEST VALUE • SAVE 50%</Text>
                </View>

                <View style={styles.planHeaderRow}>
                  <View style={styles.planRadioCircle}>
                    {selectedPlan === 'annual' && <View style={styles.planRadioDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planTitle, { color: colors.text }]}>Annual Master Mariner</Text>
                    <Text style={[styles.planPeriod, { color: colors.textSecondary }]}>Full 12 Months Access</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.planPrice, { color: colors.text }]}>₹1,499</Text>
                    <Text style={[styles.planSubPrice, { color: colors.accent }]}>₹125/month</Text>
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
                    <Text style={[styles.planTitle, { color: colors.text }]}>Quarterly Voyager</Text>
                    <Text style={[styles.planPeriod, { color: colors.textSecondary }]}>3 Months Seasonal Fishing</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.planPrice, { color: colors.text }]}>₹499</Text>
                    <Text style={[styles.planSubPrice, { color: colors.textSecondary }]}>₹166/month</Text>
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
                    <Text style={[styles.planTitle, { color: colors.text }]}>Lifetime Skipper Pass</Text>
                    <Text style={[styles.planPeriod, { color: colors.textSecondary }]}>One-Time Permanent License</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.planPrice, { color: colors.text }]}>₹3,999</Text>
                    <Text style={[styles.planSubPrice, { color: '#F59E0B' }]}>Forever</Text>
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
                      ? 'PRO LICENSE ACTIVE • DONE'
                      : `SWITCH TO ${selectedPlan.toUpperCase()} PLAN`
                    : hasReferralBonus
                      ? `ACTIVATE PERMANENT ${selectedPlan.toUpperCase()} PRO`
                      : 'UPGRADE TO FISHNAV PRO'}
                </Text>
              </LinearGradient>
            </Pressable>

            {/* Trial / Referral Bonus Dismiss option if user has active access */}
            {(isTrialActive || hasReferralBonus) && !isPro && (
              <Pressable style={styles.dismissTrialBtn} onPress={closeProModal}>
                <Text style={[styles.dismissTrialText, { color: colors.textSecondary }]}>
                  {hasReferralBonus
                    ? `Continue with Referral Bonus (${bonusProDaysRemaining} days left)`
                    : `Continue Free Trial (${trialDaysRemaining} days left)`}
                </Text>
              </Pressable>
            )}

            {/* Reassurance Footer */}
            <View style={styles.footerGuarantees}>
              <View style={styles.guaranteeRow}>
                <Ionicons name="shield-checkmark" size={13} color="#22C55E" />
                <Text style={[styles.guaranteeText, { color: colors.textSecondary }]}>
                  Secure Marine License • Cancel Anytime • 100% Offline
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
  proToggleRenewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  proToggleRenewText: {
    fontSize: 12,
    fontWeight: '700',
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

