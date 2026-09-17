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
  autoRenew: boolean;
  licenseCertificateId: string;
  invoiceNumber: string;

  // Referral Bonus status
  hasReferralBonus: boolean;
  bonusProDaysRemaining: number;
  bonusProExpiry: number | null;

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
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const TRIAL_STORAGE_KEY = 'fishnav_trial_start_v1';
const PRO_STORAGE_KEY = 'fishnav_pro_status_v1';
const REFERRAL_STORAGE_KEY = 'fishnav_referral_state_v1';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000; // 72 Hours Free Trial
const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000; // 10 Days Pro per referral

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { captain } = useAuth();

  // 1. Pro Status State
  const [isPro, setIsPro] = useState(false);
  const [proPlan, setProPlan] = useState<SubscriptionPlan | null>(null);
  const [proExpiresAt, setProExpiresAt] = useState<string | null>(null);
  const [autoRenew, setAutoRenew] = useState(true);

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
            setProExpiresAt(parsed.expiresAt || null);
            if (typeof parsed.autoRenew === 'boolean') {
              setAutoRenew(parsed.autoRenew);
            }
          } else {
            setIsPro(false);
            setProPlan(null);
            setProExpiresAt(null);
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
      newAutoRenew: boolean = true
    ) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(TRIAL_STORAGE_KEY, String(newTrialStart));
          window.localStorage.setItem(
            PRO_STORAGE_KEY,
            JSON.stringify({
              isPro: newPro && newPlan !== null,
              plan: newPlan,
              expiresAt: newPro && newPlan ? (newPlan === 'lifetime' ? 'Lifetime Access' : '2027-12-31') : null,
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
    [referralRewardMode]
  );

  // Trial Time Calculations
  const now = Date.now();
  const elapsedTrialMs = Math.max(0, now - trialStartDate);
  const trialDurationMs = THREE_DAYS_MS;
  const trialMsRemaining = Math.max(0, trialDurationMs - elapsedTrialMs);

  const trialHoursRemaining = Math.ceil(trialMsRemaining / (1000 * 60 * 60));
  const trialDaysRemaining = Math.ceil(trialMsRemaining / (1000 * 60 * 60 * 24));
  const trialProgressPercent = Math.min(100, Math.round((elapsedTrialMs / trialDurationMs) * 100));

  // Referral Bonus Calculations (10 Days per invite)
  const hasActiveReferralBonus = bonusProExpiry !== null && bonusProExpiry > now;
  const bonusProMsRemaining = bonusProExpiry ? Math.max(0, bonusProExpiry - now) : 0;
  const bonusProDaysRemaining = Math.ceil(bonusProMsRemaining / (1000 * 60 * 60 * 24));

  // Paid Pro Status: ONLY true if user actually purchased an active plan
  const isPaidPro = isPro && proPlan !== null;

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
      setIsPro(true);
      setProPlan(plan);
      setAutoRenew(true);
      const expires = plan === 'lifetime' ? 'Lifetime Access' : '1 Year Active';
      setProExpiresAt(expires);
      persistState(true, plan, trialStartDate, referralCount, referralDaysEarned, bonusProExpiry, true);
      setIsProModalVisible(false);

      Alert.alert(
        '👑 Welcome to FishNav Pro!',
        `Your ${plan.toUpperCase()} marine navigation license is now active. All bathymetric charts, AI fishing zones, and AIS radar are permanently unlocked.`
      );
    },
    [trialStartDate, referralCount, referralDaysEarned, bonusProExpiry, persistState]
  );

  const toggleAutoRenew = useCallback(() => {
    const nextVal = !autoRenew;
    setAutoRenew(nextVal);
    persistState(isPro, proPlan, trialStartDate, referralCount, referralDaysEarned, bonusProExpiry, nextVal);
    if (nextVal) {
      Alert.alert(
        'Auto-Renewal Resumed ⚓',
        'Your vessel license will automatically renew at the end of the billing period to avoid offshore navigation interruption.'
      );
    } else {
      Alert.alert(
        'Auto-Renewal Paused',
        `Auto-renewal has been paused. Your Pro marine license remains fully active until ${proExpiresAt || 'end of period'}. No further charges will occur.`
      );
    }
  }, [autoRenew, isPro, proPlan, trialStartDate, referralCount, referralDaysEarned, bonusProExpiry, proExpiresAt, persistState]);

  const cancelSubscription = useCallback(() => {
    setAutoRenew(false);
    persistState(isPro, proPlan, trialStartDate, referralCount, referralDaysEarned, bonusProExpiry, false);
    Alert.alert(
      'Subscription Cancelled',
      `Auto-renewal has been turned off. You retain full Pro access and offline charts until ${proExpiresAt || 'end of current cycle'}.`
    );
  }, [isPro, proPlan, trialStartDate, referralCount, referralDaysEarned, bonusProExpiry, proExpiresAt, persistState]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedPro = window.localStorage.getItem(PRO_STORAGE_KEY);
        if (savedPro) {
          const parsed = JSON.parse(savedPro);
          if (parsed.isPro) {
            setIsPro(true);
            setProPlan(parsed.plan || 'annual');
            setProExpiresAt(parsed.expiresAt || '1 Year Active');
            if (typeof parsed.autoRenew === 'boolean') setAutoRenew(parsed.autoRenew);
            Alert.alert(
              'License Restored! ⚓',
              `Verified active ${String(parsed.plan || 'annual').toUpperCase()} marine license. All bathymetric contours, radar & secret waypoints unlocked.`
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
  }, []);

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
      persistState(isPro, proPlan, trialStartDate, referralCount, newDays, newExpiry, autoRenew);

      Alert.alert(
        '🎁 10 Days Pro Activated!',
        `Referral code ${trimmed} applied successfully! 10 days of full Pro access have been added to your account.`
      );
      return true;
    },
    [referralCode, bonusProExpiry, referralDaysEarned, isPro, proPlan, trialStartDate, referralCount, autoRenew, persistState]
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
    setBonusProExpiry(null);
    setAutoRenew(true);
    persistState(false, null, nowTs, referralCount, referralDaysEarned, null, true);
    Alert.alert('Trial Reset', '3-Day Free Trial has been reset back to Day 1 (72 hours remaining).');
  }, [referralCount, referralDaysEarned, persistState]);

  const devExpireTrial = useCallback(() => {
    const fourDaysAgo = Date.now() - (4 * 24 * 60 * 60 * 1000);
    setTrialStartDate(fourDaysAgo);
    setIsPro(false);
    setProPlan(null);
    setBonusProExpiry(null);
    setAutoRenew(true);
    persistState(false, null, fourDaysAgo, referralCount, referralDaysEarned, null, true);
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
    persistState(isPro, proPlan, trialStartDate, newCount, newDays, newExpiry, autoRenew);

    Alert.alert(
      '🎉 Referral Bonus Earned!',
      `Simulated successful referral invite #${newCount}! You have earned +10 Days of Free Pro access.`
    );
  }, [referralCount, referralDaysEarned, bonusProExpiry, isPro, proPlan, trialStartDate, autoRenew, persistState]);

  const value = useMemo(
    () => ({
      isPro: isPaidPro,
      hasReferralBonus: hasActiveReferralBonus,
      hasFullAccess,
      proPlan,
      proExpiresAt,
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
      referralCode,
      referralLink,
      referralCount,
      referralDaysEarned,
      referralMonthsEarned: Math.round(referralDaysEarned / 10),
      bonusProDaysRemaining,
      bonusProExpiry,
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
    }),
    [
      isPaidPro,
      hasActiveReferralBonus,
      hasFullAccess,
      proPlan,
      proExpiresAt,
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
      referralCode,
      referralLink,
      referralCount,
      referralDaysEarned,
      bonusProDaysRemaining,
      bonusProExpiry,
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
