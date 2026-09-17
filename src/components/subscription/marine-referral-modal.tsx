import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSubscription } from '@/context/subscription-context';
import { useAppTheme } from '@/context/theme-context';

export function MarineReferralModal() {
  const insets = useSafeAreaInsets();
  const { colors, isLight } = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const {
    isReferralModalVisible,
    closeReferralModal,
    referralCode,
    referralLink,
    referralCount,
    referralDaysEarned,
    referralMonthsEarned,
    bonusProDaysRemaining,
    shareReferralInvite,
    applyReferralCode,
  } = useSubscription();

  const [inputCode, setInputCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [copied, setCopied] = useState(false);

  // Animations
  const copyTimeoutRef = useRef<any>(null);

  if (!isReferralModalVisible) return null;

  const cardMaxWidth = Math.min(windowWidth - 32, 460);

  const handleCopyCode = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(referralCode);
      }
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(true);
    }
  };

  const handleApplyCode = () => {
    if (!inputCode.trim()) return;
    setIsApplying(true);
    setTimeout(() => {
      const success = applyReferralCode(inputCode.trim());
      setIsApplying(false);
      if (success) {
        setInputCode('');
      }
    }, 400);
  };

  return (
    <Modal
      visible={isReferralModalVisible}
      transparent
      animationType="fade"
      onRequestClose={closeReferralModal}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouch} onPress={closeReferralModal} />

        <View
          style={[
            styles.card,
            {
              width: cardMaxWidth,
              backgroundColor: isLight ? '#FFFFFF' : '#031120',
              borderColor: isLight ? '#E2E8F0' : 'rgba(0, 240, 255, 0.35)',
              paddingBottom: Math.max(insets.bottom, 16) + 12,
            },
          ]}
        >
          {/* Top Decorative Stripe */}
          <LinearGradient
            colors={['#00F0FF', '#0284C7', '#38BDF8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topStripe}
          />

          {/* Close Button */}
          <Pressable
            style={[styles.closeBtn, { backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.08)' }]}
            onPress={closeReferralModal}
            hitSlop={12}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </Pressable>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <View
                style={[
                  styles.giftIconCircle,
                  {
                    backgroundColor: isLight ? '#E0F2FE' : 'rgba(0, 240, 255, 0.12)',
                    borderColor: colors.accent,
                  },
                ]}
              >
                <MaterialCommunityIcons name="gift-open" size={32} color={colors.accent} />
              </View>

              <View style={[styles.badgePill, { backgroundColor: 'rgba(0, 240, 255, 0.15)', borderColor: colors.accent }]}>
                <Ionicons name="people" size={13} color={colors.accent} />
                <Text style={[styles.badgePillText, { color: colors.accent }]}>FLEET REFERRAL PROGRAM</Text>
              </View>

              <Text style={[styles.title, { color: colors.text }]}>
                Invite Crew, Earn 10 Days Pro Free
              </Text>

              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Share your unique Captain link. For every fellow boat owner or fisherman who joins, you receive 10 days of full FishNav Pro access!
              </Text>
            </View>

            {/* How It Works (3 Steps) */}
            <View
              style={[
                styles.stepsCard,
                {
                  backgroundColor: isLight ? '#F8FAFC' : 'rgba(4, 23, 40, 0.95)',
                  borderColor: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)',
                },
              ]}
            >
              <View style={styles.stepRow}>
                <View style={styles.stepNumCircle}>
                  <Text style={styles.stepNumText}>1</Text>
                </View>
                <View style={styles.stepTextCol}>
                  <Text style={[styles.stepHeading, { color: colors.text }]}>Share Your Captain Code</Text>
                  <Text style={[styles.stepSub, { color: colors.textSecondary }]}>
                    Send your referral link or code via WhatsApp or SMS.
                  </Text>
                </View>
              </View>

              <View style={styles.stepRow}>
                <View style={styles.stepNumCircle}>
                  <Text style={styles.stepNumText}>2</Text>
                </View>
                <View style={styles.stepTextCol}>
                  <Text style={[styles.stepHeading, { color: colors.text }]}>Friend Gets 3-Day Free Trial</Text>
                  <Text style={[styles.stepSub, { color: colors.textSecondary }]}>
                    They download FishNav Pro & immediately enjoy full charts.
                  </Text>
                </View>
              </View>

              <View style={styles.stepRow}>
                <View style={[styles.stepNumCircle, { backgroundColor: '#22C55E' }]}>
                  <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                </View>
                <View style={styles.stepTextCol}>
                  <Text style={[styles.stepHeading, { color: '#22C55E' }]}>You Get +10 Days Free Pro</Text>
                  <Text style={[styles.stepSub, { color: colors.textSecondary }]}>
                    10 days of unlimited bathymetry & AIS radar unlocked.
                  </Text>
                </View>
              </View>
            </View>

            {/* Your Referral Code Box */}
            <View
              style={[
                styles.codeCard,
                {
                  backgroundColor: isLight ? '#EFF6FF' : 'rgba(2, 132, 199, 0.12)',
                  borderColor: isLight ? '#BFDBFE' : 'rgba(0, 240, 255, 0.35)',
                },
              ]}
            >
              <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>YOUR CAPTAIN REFERRAL CODE</Text>

              <View style={styles.codeRow}>
                <Text style={[styles.codeDisplay, { color: colors.accent }]}>{referralCode}</Text>
                <Pressable
                  style={[styles.copyBtn, copied && styles.copiedBtn]}
                  onPress={handleCopyCode}
                >
                  <Ionicons
                    name={copied ? 'checkmark' : 'copy-outline'}
                    size={16}
                    color={copied ? '#FFFFFF' : '#020B14'}
                  />
                  <Text style={[styles.copyBtnText, copied && { color: '#FFFFFF' }]}>
                    {copied ? 'Copied!' : 'Copy'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Share Invite CTA */}
            <Pressable
              style={({ pressed }) => [
                styles.shareBtn,
                { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] },
              ]}
              onPress={shareReferralInvite}
            >
              <LinearGradient
                colors={['#00F0FF', '#0284C7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shareGradient}
              >
                <Ionicons name="share-social" size={18} color="#020B14" />
                <Text style={styles.shareBtnText}>SHARE INVITATION LINK</Text>
              </LinearGradient>
            </Pressable>

            {/* Live Stats */}
            <View style={styles.statsRow}>
              <View
                style={[
                  styles.statBox,
                  {
                    backgroundColor: isLight ? '#F8FAFC' : 'rgba(4, 23, 40, 0.95)',
                    borderColor: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)',
                  },
                ]}
              >
                <Text style={[styles.statVal, { color: colors.text }]}>{referralCount}</Text>
                <Text style={[styles.statLbl, { color: colors.textSecondary }]}>FRIENDS REFERRED</Text>
              </View>

              <View
                style={[
                  styles.statBox,
                  {
                    backgroundColor: isLight ? '#F8FAFC' : 'rgba(4, 23, 40, 0.95)',
                    borderColor: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)',
                  },
                ]}
              >
                <Text style={[styles.statVal, { color: '#22C55E' }]}>
                  +{referralDaysEarned || (referralMonthsEarned ? referralMonthsEarned * 10 : 0)}d
                </Text>
                <Text style={[styles.statLbl, { color: colors.textSecondary }]}>FREE PRO EARNED</Text>
              </View>

              <View
                style={[
                  styles.statBox,
                  {
                    backgroundColor: isLight ? '#F8FAFC' : 'rgba(4, 23, 40, 0.95)',
                    borderColor: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)',
                  },
                ]}
              >
                <Text style={[styles.statVal, { color: colors.accent }]}>
                  {bonusProDaysRemaining > 0 ? `${bonusProDaysRemaining}d` : '0d'}
                </Text>
                <Text style={[styles.statLbl, { color: colors.textSecondary }]}>BONUS DAYS LEFT</Text>
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
    backgroundColor: 'rgba(2, 11, 20, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backdropTouch: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    maxHeight: '90%',
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
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
    paddingBottom: 8,
    gap: 14,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 4,
  },
  giftIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
    marginBottom: 8,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 10,
  },
  stepsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepTextCol: {
    flex: 1,
  },
  stepHeading: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  stepSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  codeCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  codeDisplay: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00F0FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
  },
  copiedBtn: {
    backgroundColor: '#22C55E',
  },
  copyBtnText: {
    color: '#020B14',
    fontSize: 11,
    fontWeight: '800',
  },
  shareBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#00F0FF',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  shareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    gap: 8,
  },
  shareBtnText: {
    color: '#020B14',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLbl: {
    fontSize: 8.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  redeemCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  redeemTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  redeemInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  redeemInput: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '700',
  },
  applyBtn: {
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#020B14',
    fontSize: 12,
    fontWeight: '800',
  },
});
