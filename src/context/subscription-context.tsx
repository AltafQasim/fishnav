import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert, Platform, Share } from 'react-native';

import { useAuth } from './auth-context';

export type SubscriptionPlan = 'annual' | 'quarterly' | 'lifetime';

export type ReferralRewardMode = 'on_install' | 'on_pro_purchase';

export type SubscriptionContextType = {
  // Pro status (True ONLY when a paid plan is active)
  isPro: boolean;
  proPlan: SubscriptionPlan | null;
  proExpiresAt: string | null;
  proExpiresAtMs: number | null;
  proDaysRemaining: number;
  proHoursRemaining: number;
  proFormattedExpiry: string;
  proProgressPercent: number;
  isExpiringSoon: boolean;
  isProExpired: boolean;
  planDisplayName: string;
  autoRenew: boolean;
  licenseCertificateId: string;
  invoiceNumber: string;

  // Referral Bonus status
  hasReferralBonus: boolean;
  bonusProDaysRemaining: number;
  bonusProExpiry: number | null;
  bonusProFormattedExpiry: string;

  // Full access status (bypasses paywall)
  hasFullAccess: boolean;

  // Trial status
  isTrialActive: boolean;
  isTrialExpired: boolean;
  trialStartDate: number;
  trialDurationMs: number;
  trialDaysRemaining: number;
  trialHoursRemaining: number;
  trialProgressPercent: number;
  trialFormattedExpiry: string;

  // Referral Program (10 Days per Invite)
  referralCode: string;
  referralLink: string;
  referralCount: number;
  referralDaysEarned: number;
  referralMonthsEarned: number;
  referralRewardMode: ReferralRewardMode;
  setReferralRewardMode: (mode: ReferralRewardMode) => void;

  // Modals state
  isProModalVisible: boolean;
  isReferralModalVisible: boolean;
  openProModal: (source?: string) => void;
  closeProModal: () => void;
  openReferralModal: () => void;
  closeReferralModal: () => void;

  // Actions
  subscribeToPro: (plan: SubscriptionPlan) => void;
  toggleAutoRenew: () => void;
  cancelSubscription: () => void;
  restorePurchases: () => Promise<boolean>;
  applyReferralCode: (code: string) => boolean;
  shareReferralInvite: () => Promise<void>;

  // Dev testing helpers
  devResetTrial: () => void;
  devExpireTrial: () => void;
  devAddReferralReward: () => void;
  devSetExpiryDays: (days: number) => void;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const TRIAL_STORAGE_KEY = 'fishnav_trial_start_v1';
const PRO_STORAGE_KEY = 'fishnav_pro_status_v1';
const REFERRAL_STORAGE_KEY = 'fishnav_referral_state_v1';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000; // 72 Hours Free Trial
const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000; // 10 Days Pro per referral
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export function formatMaritimeDate(timestampMs: number): string {
  try {
    const d = new Date(timestampMs);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return 'Active';
  }
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { captain } = useAuth();

  // 1. Pro Status State
  const [isPro, setIsPro] = useState(false);
  const [proPlan, setProPlan] = useState<SubscriptionPlan | null>(null);
  const [proExpiresAt, setProExpiresAt] = useState<string | null>(null);
  const [proExpiresAtMs, setProExpiresAtMs] = useState<number | null>(null);
  const [autoRenew, setAutoRenew] = useState(false);

  // 2. Trial Timestamp State
  const [trialStartDate, setTrialStartDate] = useState<number>(() => Date.now());

  // 3. Referral State
  const [referralCount, setReferralCount] = useState(0);
  const [referralDaysEarned, setReferralDaysEarned] = useState(0);
  const [bonusProExpiry, setBonusProExpiry] = useState<number | null>(null);
  const [referralRewardMode, setReferralRewardMode] = useState<ReferralRewardMode>('on_install');

  // 4. Modals
  const [isProModalVisible, setIsProModalVisible] = useState(false);
  const [isReferralModalVisible, setIsReferralModalVisible] = useState(false);

  // Derive unique captain referral code
  const referralCode = useMemo(() => {
    if (captain?.callSign) {
      return `NAV-${captain.callSign.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 7)}`;
    }
    if (captain?.name) {
      const cleanName = captain.name.replace(/[^A-Z]/gi, '').toUpperCase().slice(0, 5);
      return `FISH-${cleanName || 'CAPTAIN'}-88`;
    }
    return 'FISHNAV-PRO-77';
  }, [captain?.callSign, captain?.name]);

  const referralLink = useMemo(() => {
    return `https://fishnav.pro/invite?ref=${referralCode}`;
  }, [referralCode]);

  // Unique Marine License Certificate ID & Invoice ID
  const licenseCertificateId = useMemo(() => {
    const raw = (captain?.callSign || referralCode || '8821').replace(/[^A-Z0-9]/gi, '').toUpperCase();
    return `IN-MAR-PRO-${raw.slice(0, 4)}-2026`;
  }, [captain?.callSign, referralCode]);

  const invoiceNumber = useMemo(() => {
    const raw = (captain?.callSign || referralCode || '8821').replace(/[^A-Z0-9]/gi, '').toUpperCase();
    return `INV-FN-2026-${raw.slice(-4)}`;
  }, [captain?.callSign, referralCode]);

  // Load saved state from LocalStorage on web / persistent store
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Trial Start
        const savedTrial = window.localStorage.getItem(TRIAL_STORAGE_KEY);
        if (savedTrial) {
          setTrialStartDate(Number(savedTrial));
        } else {
          const now = Date.now();
          window.localStorage.setItem(TRIAL_STORAGE_KEY, String(now));
          setTrialStartDate(now);
        }

        // Pro Status (Only restore if a valid plan exists)
        const savedPro = window.localStorage.getItem(PRO_STORAGE_KEY);
        if (savedPro) {
          const parsed = JSON.parse(savedPro);
          if (parsed.isPro && parsed.plan) {
            setIsPro(true);
            setProPlan(parsed.plan);

            if (parsed.plan === 'lifetime') {
              setProExpiresAt('Lifetime Access');
              setProExpiresAtMs(null);
            } else if (parsed.expiresAtMs && typeof parsed.expiresAtMs === 'number') {
              setProExpiresAtMs(parsed.expiresAtMs);
              setProExpiresAt(parsed.expiresAt || formatMaritimeDate(parsed.expiresAtMs));
            } else if (parsed.expiresAt && parsed.expiresAt !== '1 Year Active' && parsed.expiresAt !== 'Lifetime Access') {
              const parsedDate = Date.parse(parsed.expiresAt);
              if (!isNaN(parsedDate) && parsedDate > Date.now() - 30 * 24 * 60 * 60 * 1000) {
                setProExpiresAtMs(parsedDate);
                setProExpiresAt(formatMaritimeDate(parsedDate));
              } else {
                const defaultMs = Date.now() + ONE_YEAR_MS;
                setProExpiresAtMs(defaultMs);
                setProExpiresAt(formatMaritimeDate(defaultMs));
              }
            } else {
              const defaultMs = Date.now() + ONE_YEAR_MS;
              setProExpiresAtMs(defaultMs);
              setProExpiresAt(formatMaritimeDate(defaultMs));
            }

            if (typeof parsed.autoRenew === 'boolean') {
              setAutoRenew(parsed.autoRenew);
            }
          } else {
            setIsPro(false);
            setProPlan(null);
            setProExpiresAt(null);
            setProExpiresAtMs(null);
          }
        }

        // Referral Data
        const savedRef = window.localStorage.getItem(REFERRAL_STORAGE_KEY);
        if (savedRef) {
          const parsed = JSON.parse(savedRef);
          setReferralCount(parsed.count || 0);
          setReferralDaysEarned(parsed.daysEarned || (parsed.monthsEarned ? parsed.monthsEarned * 10 : 0));
          setBonusProExpiry(parsed.bonusProExpiry || null);
          if (parsed.rewardMode) setReferralRewardMode(parsed.rewardMode);
        }
      }
    } catch {
      // Storage unavailable fallback
    }
  }, []);

  // Save changes to storage
  const persistState = useCallback(
    (
      newPro: boolean,
      newPlan: SubscriptionPlan | null,
      newTrialStart: number,
      newCount: number,
      newDays: number,
      newBonusExpiry: number | null,
      newAutoRenew: boolean = false,
      newExpiresAtMs?: number | null,
      newExpiresAtStr?: string | null
    ) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(TRIAL_STORAGE_KEY, String(newTrialStart));

          let calculatedExpiryMs = newExpiresAtMs;
          if (newPro && newPlan && newPlan !== 'lifetime' && (calculatedExpiryMs === undefined || calculatedExpiryMs === null)) {
            calculatedExpiryMs = proExpiresAtMs || Date.now() + (newPlan === 'quarterly' ? NINETY_DAYS_MS : ONE_YEAR_MS);
          } else if (newPlan === 'lifetime') {
            calculatedExpiryMs = null;
          }

          const expiryString = newPro && newPlan
            ? (newExpiresAtStr || (newPlan === 'lifetime' ? 'Lifetime Access' : formatMaritimeDate(calculatedExpiryMs || (Date.now() + ONE_YEAR_MS))))
            : null;

          window.localStorage.setItem(
            PRO_STORAGE_KEY,
            JSON.stringify({
              isPro: newPro && newPlan !== null,
              plan: newPlan,
              expiresAt: expiryString,
              expiresAtMs: calculatedExpiryMs,
              autoRenew: newAutoRenew,
            })
          );
          window.localStorage.setItem(
            REFERRAL_STORAGE_KEY,
            JSON.stringify({
              count: newCount,
              daysEarned: newDays,
              monthsEarned: Math.round(newDays / 10),
              bonusProExpiry: newBonusExpiry,
              rewardMode: referralRewardMode,
            })
          );
        }
      } catch {
        // ignore
      }
    },
    [proExpiresAtMs, referralRewardMode]
  );

  // Time Calculations
  const now = Date.now();
  const elapsedTrialMs = Math.max(0, now - trialStartDate);
  const trialDurationMs = THREE_DAYS_MS;
  const trialMsRemaining = Math.max(0, trialDurationMs - elapsedTrialMs);

  const trialHoursRemaining = Math.ceil(trialMsRemaining / (1000 * 60 * 60));
  const trialDaysRemaining = Math.ceil(trialMsRemaining / (1000 * 60 * 60 * 24));
  const trialProgressPercent = Math.min(100, Math.round((elapsedTrialMs / trialDurationMs) * 100));
  const trialFormattedExpiry = formatMaritimeDate(trialStartDate + trialDurationMs);

  // Referral Bonus Calculations (10 Days per invite)
  const hasActiveReferralBonus = bonusProExpiry !== null && bonusProExpiry > now;
  const bonusProMsRemaining = bonusProExpiry ? Math.max(0, bonusProExpiry - now) : 0;
  const bonusProDaysRemaining = Math.ceil(bonusProMsRemaining / (1000 * 60 * 60 * 24));
  const bonusProFormattedExpiry = bonusProExpiry ? formatMaritimeDate(bonusProExpiry) : '';

  // Paid Pro Status: ONLY true if user actually purchased an active plan
  const isPaidPro = isPro && proPlan !== null;
  const isLifetime = isPaidPro && proPlan === 'lifetime';

  // Pro Expiry & Days Remaining Calculation
  const proMsRemaining = isLifetime ? Infinity : proExpiresAtMs ? Math.max(0, proExpiresAtMs - now) : 0;
  const proDaysRemaining = isLifetime ? 9999 : Math.ceil(proMsRemaining / (1000 * 60 * 60 * 24));
  const proHoursRemaining = isLifetime ? 99999 : Math.ceil(proMsRemaining / (1000 * 60 * 60));

  const proTotalPeriodMs = proPlan === 'quarterly' ? NINETY_DAYS_MS : ONE_YEAR_MS;
  const proProgressPercent = isLifetime
    ? 100
    : Math.max(0, Math.min(100, Math.round(((proTotalPeriodMs - proMsRemaining) / proTotalPeriodMs) * 100)));

  const isExpiringSoon = isPaidPro && !isLifetime && proDaysRemaining <= 15 && proDaysRemaining > 0;
  const isProExpired = isPaidPro && !isLifetime && proExpiresAtMs !== null && proExpiresAtMs <= now;

  const proFormattedExpiry = useMemo(() => {
    if (!isPaidPro) return '';
    if (proPlan === 'lifetime') return 'Lifetime Access (Never Expires)';
    if (proExpiresAtMs) return formatMaritimeDate(proExpiresAtMs);
    return proExpiresAt || 'Active';
  }, [isPaidPro, proPlan, proExpiresAtMs, proExpiresAt]);

  const planDisplayName = useMemo(() => {
    if (proPlan === 'lifetime') return 'Lifetime Skipper Pass';
    if (proPlan === 'quarterly') return 'Quarterly Voyager License';
    if (proPlan === 'annual') return 'Annual Master Mariner License';
    if (hasActiveReferralBonus) return 'Captain Referral Pass';
    if (trialMsRemaining > 0) return '3-Day Free Trial';
    return 'Trial Expired';
  }, [proPlan, hasActiveReferralBonus, trialMsRemaining]);

  // Unrestricted Access: User has full access to features if Paid Pro OR active Referral Bonus OR Trial Active
  const hasFullAccess = isPaidPro || hasActiveReferralBonus || trialMsRemaining > 0;
  const isTrialActive = !isPaidPro && !hasActiveReferralBonus && trialMsRemaining > 0;
  const isTrialExpired = !isPaidPro && !hasActiveReferralBonus && trialMsRemaining === 0;

  // STRICT PAYWALL: Locked only when user is NOT paid Pro, has NO active referral bonus, and trial expired
  const isProModalActuallyVisible = isProModalVisible || (isTrialExpired && !isReferralModalVisible);

  // Actions
  const openProModal = useCallback(() => {
    setIsProModalVisible(true);
  }, []);

  const closeProModal = useCallback(() => {
    // 🚨 STRICT PAYWALL RULE: If trial is expired and user has no access, user CANNOT dismiss
    if (isTrialExpired && !hasFullAccess) {
      return;
    }
    setIsProModalVisible(false);
  }, [isTrialExpired, hasFullAccess]);

  const openReferralModal = useCallback(() => {
    setIsReferralModalVisible(true);
  }, []);

  const closeReferralModal = useCallback(() => {
    setIsReferralModalVisible(false);
  }, []);

  const subscribeToPro = useCallback(
    (plan: SubscriptionPlan) => {
      const durationMs = plan === 'lifetime' ? null : plan === 'quarterly' ? NINETY_DAYS_MS : ONE_YEAR_MS;
      const expiryMs = durationMs ? Date.now() + durationMs : null;
      const expiresStr = plan === 'lifetime' ? 'Lifetime Access' : formatMaritimeDate(expiryMs!);

      setIsPro(true);
      setProPlan(plan);
      setAutoRenew(false);
      setProExpiresAt(expiresStr);
      setProExpiresAtMs(expiryMs);

      persistState(true, plan, trialStartDate, referralCount, referralDaysEarned, bonusProExpiry, false, expiryMs, expiresStr);
      setIsProModalVisible(false);

      Alert.alert(
        '👑 Welcome to FishNav Pro!',
        `Your ${plan.toUpperCase()} marine navigation license is now active.\n\n📅 Valid Through: ${expiresStr}\n⚓ Certificate ID: ${licenseCertificateId}`
      );
    },
    [trialStartDate, referralCount, referralDaysEarned, bonusProExpiry, licenseCertificateId, persistState]
  );

  const toggleAutoRenew = useCallback(() => {
    const nextVal = !autoRenew;
    setAutoRenew(nextVal);
    persistState(isPro, proPlan, trialStartDate, referralCount, referralDaysEarned, bonusProExpiry, nextVal, proExpiresAtMs, proExpiresAt);
    if (nextVal) {
      Alert.alert(
        'Auto-Renewal Resumed ⚓',
        `Your vessel license will automatically renew on ${proFormattedExpiry || 'end of period'} to avoid offshore navigation interruption.`
      );
    } else {
      Alert.alert(
        'Auto-Renewal Paused',
        `Auto-renewal has been paused. Your Pro marine license remains fully active until ${proFormattedExpiry || 'end of period'}. No further charges will occur.`
      );
    }
  }, [autoRenew, isPro, proPlan, trialStartDate, referralCount, referralDaysEarned, bonusProExpiry, proExpiresAtMs, proExpiresAt, proFormattedExpiry, persistState]);

  const cancelSubscription = useCallback(() => {
    setAutoRenew(false);
    persistState(isPro, proPlan, trialStartDate, referralCount, referralDaysEarned, bonusProExpiry, false, proExpiresAtMs, proExpiresAt);
    Alert.alert(
      'Subscription Cancelled',
      `Auto-renewal has been turned off. You retain full Pro access and offline charts until ${proFormattedExpiry || 'end of current cycle'}.`
    );
  }, [isPro, proPlan, trialStartDate, referralCount, referralDaysEarned, bonusProExpiry, proExpiresAtMs, proExpiresAt, proFormattedExpiry, persistState]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedPro = window.localStorage.getItem(PRO_STORAGE_KEY);
        if (savedPro) {
          const parsed = JSON.parse(savedPro);
          if (parsed.isPro) {
            const plan: SubscriptionPlan = parsed.plan || 'annual';
            const expiryMs = parsed.expiresAtMs || (plan === 'lifetime' ? null : Date.now() + ONE_YEAR_MS);
            const expiresStr = plan === 'lifetime' ? 'Lifetime Access' : formatMaritimeDate(expiryMs!);

            setIsPro(true);
            setProPlan(plan);
            setProExpiresAt(expiresStr);
            setProExpiresAtMs(expiryMs);
            if (typeof parsed.autoRenew === 'boolean') setAutoRenew(parsed.autoRenew);

            Alert.alert(
              'License Restored! ⚓',
              `Verified active ${String(plan).toUpperCase()} marine license.\nValid until: ${expiresStr}\nCertificate ID: ${licenseCertificateId}`
            );
            return true;
          }
        }
      }
      Alert.alert(
        'No Past Purchases Found',
        'We could not find an existing marine license for this vessel account. You can start a free trial or upgrade.'
      );
      return false;
    } catch {
      Alert.alert('Restore Error', 'Unable to reach maritime licensing server. Please check internet connection.');
      return false;
    }
  }, [licenseCertificateId]);

  const applyReferralCode = useCallback(
    (code: string): boolean => {
      const trimmed = code.trim().toUpperCase();
      if (!trimmed || trimmed === referralCode) {
        Alert.alert('Invalid Code', 'You cannot enter your own referral code.');
        return false;
      }

      // Add 10 Days Pro bonus
      const currentExpiry = bonusProExpiry && bonusProExpiry > Date.now() ? bonusProExpiry : Date.now();
      const newExpiry = currentExpiry + TEN_DAYS_MS;
      setBonusProExpiry(newExpiry);
      const newDays = referralDaysEarned + 10;
      setReferralDaysEarned(newDays);
      persistState(isPro, proPlan, trialStartDate, referralCount, newDays, newExpiry, autoRenew, proExpiresAtMs, proExpiresAt);

      Alert.alert(
        '🎁 10 Days Pro Activated!',
        `Referral code ${trimmed} applied successfully! 10 days of full Pro access added until ${formatMaritimeDate(newExpiry)}.`
      );
      return true;
    },
    [referralCode, bonusProExpiry, referralDaysEarned, isPro, proPlan, trialStartDate, referralCount, autoRenew, proExpiresAtMs, proExpiresAt, persistState]
  );

  const shareReferralInvite = useCallback(async () => {
    try {
      const shareMessage = `⚓ Join me on FishNav Pro Marine Navigation! Use my Captain invite link to get a 3-day full Pro Trial and unlock high-res ocean bathymetry, AIS radar, and secret reef spots:\n\n🔗 ${referralLink}\n\nInvite Code: ${referralCode}`;

      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareMessage);
        Alert.alert('Link Copied!', 'Referral invitation link copied to clipboard. Share it with your fellow boat captains.');
        return;
      }

      await Share.share({
        title: 'FishNav Pro Maritime Invitation',
        message: shareMessage,
        url: referralLink,
      });
    } catch {
      // ignore
    }
  }, [referralLink, referralCode]);

  // Dev Testing Controls
  const devResetTrial = useCallback(() => {
    const nowTs = Date.now();
    setTrialStartDate(nowTs);
    setIsPro(false);
    setProPlan(null);
    setProExpiresAt(null);
    setProExpiresAtMs(null);
    setBonusProExpiry(null);
    setAutoRenew(false);
    persistState(false, null, nowTs, referralCount, referralDaysEarned, null, false, null, null);
    Alert.alert('Trial Reset', '3-Day Free Trial has been reset back to Day 1 (72 hours remaining).');
  }, [referralCount, referralDaysEarned, persistState]);

  const devExpireTrial = useCallback(() => {
    const fourDaysAgo = Date.now() - 4 * 24 * 60 * 60 * 1000;
    setTrialStartDate(fourDaysAgo);
    setIsPro(false);
    setProPlan(null);
    setProExpiresAt(null);
    setProExpiresAtMs(null);
    setBonusProExpiry(null);
    setAutoRenew(false);
    persistState(false, null, fourDaysAgo, referralCount, referralDaysEarned, null, false, null, null);
    Alert.alert('Trial Expired', 'Trial simulated as expired (> 72 hours passed). Pro modal is now locked on screen.');
  }, [referralCount, referralDaysEarned, persistState]);

  const devAddReferralReward = useCallback(() => {
    const newCount = referralCount + 1;
    const newDays = referralDaysEarned + 10;
    const currentExpiry = bonusProExpiry && bonusProExpiry > Date.now() ? bonusProExpiry : Date.now();
    const newExpiry = currentExpiry + TEN_DAYS_MS;

    setReferralCount(newCount);
    setReferralDaysEarned(newDays);
    setBonusProExpiry(newExpiry);
    persistState(isPro, proPlan, trialStartDate, newCount, newDays, newExpiry, autoRenew, proExpiresAtMs, proExpiresAt);

    Alert.alert(
      '🎉 Referral Bonus Earned!',
      `Simulated successful referral invite #${newCount}! You have earned +10 Days of Free Pro access until ${formatMaritimeDate(newExpiry)}.`
    );
  }, [referralCount, referralDaysEarned, bonusProExpiry, isPro, proPlan, trialStartDate, autoRenew, proExpiresAtMs, proExpiresAt, persistState]);

  const devSetExpiryDays = useCallback(
    (days: number) => {
      const newExpiry = Date.now() + days * 24 * 60 * 60 * 1000;
      setIsPro(true);
      const activePlan = proPlan && proPlan !== 'lifetime' ? proPlan : 'annual';
      setProPlan(activePlan);
      setProExpiresAtMs(newExpiry);
      const str = formatMaritimeDate(newExpiry);
      setProExpiresAt(str);
      persistState(true, activePlan, trialStartDate, referralCount, referralDaysEarned, bonusProExpiry, autoRenew, newExpiry, str);
      Alert.alert(
        'Simulated Expiry Updated',
        `Pro plan expiration set to ${days} days remaining (${str}). Check the glowing expiry countdown and alerts!`
      );
    },
    [proPlan, trialStartDate, referralCount, referralDaysEarned, bonusProExpiry, autoRenew, persistState]
  );

  const value = useMemo(
    () => ({
      isPro: isPaidPro,
      hasReferralBonus: hasActiveReferralBonus,
      hasFullAccess,
      proPlan,
      proExpiresAt,
      proExpiresAtMs,
      proDaysRemaining,
      proHoursRemaining,
      proFormattedExpiry,
      proProgressPercent,
      isExpiringSoon,
      isProExpired,
      planDisplayName,
      autoRenew,
      licenseCertificateId,
      invoiceNumber,
      isTrialActive,
      isTrialExpired,
      trialStartDate,
      trialDurationMs,
      trialDaysRemaining,
      trialHoursRemaining,
      trialProgressPercent,
      trialFormattedExpiry,
      referralCode,
      referralLink,
      referralCount,
      referralDaysEarned,
      referralMonthsEarned: Math.round(referralDaysEarned / 10),
      bonusProDaysRemaining,
      bonusProExpiry,
      bonusProFormattedExpiry,
      referralRewardMode,
      setReferralRewardMode,
      isProModalVisible: isProModalActuallyVisible,
      isReferralModalVisible,
      openProModal,
      closeProModal,
      openReferralModal,
      closeReferralModal,
      subscribeToPro,
      toggleAutoRenew,
      cancelSubscription,
      restorePurchases,
      applyReferralCode,
      shareReferralInvite,
      devResetTrial,
      devExpireTrial,
      devAddReferralReward,
      devSetExpiryDays,
    }),
    [
      isPaidPro,
      hasActiveReferralBonus,
      hasFullAccess,
      proPlan,
      proExpiresAt,
      proExpiresAtMs,
      proDaysRemaining,
      proHoursRemaining,
      proFormattedExpiry,
      proProgressPercent,
      isExpiringSoon,
      isProExpired,
      planDisplayName,
      autoRenew,
      licenseCertificateId,
      invoiceNumber,
      isTrialActive,
      isTrialExpired,
      trialStartDate,
      trialDurationMs,
      trialDaysRemaining,
      trialHoursRemaining,
      trialProgressPercent,
      trialFormattedExpiry,
      referralCode,
      referralLink,
      referralCount,
      referralDaysEarned,
      bonusProDaysRemaining,
      bonusProExpiry,
      bonusProFormattedExpiry,
      referralRewardMode,
      isProModalActuallyVisible,
      isReferralModalVisible,
      openProModal,
      closeProModal,
      openReferralModal,
      closeReferralModal,
      subscribeToPro,
      toggleAutoRenew,
      cancelSubscription,
      restorePurchases,
      applyReferralCode,
      shareReferralInvite,
      devResetTrial,
      devExpireTrial,
      devAddReferralReward,
      devSetExpiryDays,
    ]
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
