import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/theme-context';
import { useOfflineDownload } from '@/context/offline-map-context';

type MarineDownloadPillProps = {
  onOpenSettings: () => void;
  isSettingsOpen?: boolean;
};

export function MarineDownloadPill({ onOpenSettings, isSettingsOpen }: MarineDownloadPillProps) {
  const insets = useSafeAreaInsets();
  const { colors, isLight } = useAppTheme();
  const { downloadProgress, cancelDownload } = useOfflineDownload();

  const [completedBanner, setCompletedBanner] = useState<{ regionName: string } | null>(null);
  const prevDownloadingRef = useRef(false);

  // Animation values
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Track completion transition
  useEffect(() => {
    if (prevDownloadingRef.current && !downloadProgress?.isDownloading) {
      if (downloadProgress?.percent === 100) {
        setCompletedBanner({ regionName: downloadProgress.regionName });
        const timer = setTimeout(() => {
          setCompletedBanner(null);
        }, 4000);
        return () => clearTimeout(timer);
      }
    }
    prevDownloadingRef.current = Boolean(downloadProgress?.isDownloading);
  }, [downloadProgress]);

  const isVisible = (Boolean(downloadProgress?.isDownloading) || Boolean(completedBanner)) && !isSettingsOpen;

  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 70,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -80,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => {
        setShouldRender(false);
      });
    }
  }, [isVisible, translateY, opacity]);

  if (!shouldRender) {
    return null;
  }

  const isComplete = Boolean(completedBanner);
  const percent = downloadProgress?.percent ?? 0;
  const regionName = completedBanner?.regionName || downloadProgress?.regionName || 'Marine Chart';

  return (
    <View
      style={[
        styles.overlayContainer,
        { top: Math.max(insets.top, Platform.OS === 'ios' ? 12 : 8) + 6 },
      ]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[
          styles.pillCard,
          {
            backgroundColor: isLight
              ? '#FFFFFF'
              : isComplete
                ? 'rgba(6, 44, 24, 0.95)'
                : 'rgba(4, 23, 40, 0.94)',
            borderColor: isComplete ? '#22C55E' : colors.accent,
            shadowColor: isComplete ? '#22C55E' : '#00F0FF',
            transform: [{ translateY }],
            opacity,
          },
        ]}
      >
        <Pressable
          style={styles.pillContentRow}
          onPress={onOpenSettings}
          accessibilityRole="button"
          accessibilityLabel="Open map download settings"
        >
          {/* Status Icon */}
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: isComplete
                  ? 'rgba(34, 197, 94, 0.2)'
                  : 'rgba(0, 240, 255, 0.15)',
              },
            ]}
          >
            {isComplete ? (
              <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            ) : (
              <ActivityIndicator size="small" color={colors.accent} />
            )}
          </View>

          {/* Texts & Mini Progress Bar */}
          <View style={styles.textWrap}>
            <View style={styles.headerRow}>
              <Text
                style={[
                  styles.regionNameText,
                  { color: isLight ? '#0F172A' : '#F8FAFC' },
                ]}
                numberOfLines={1}
              >
                {isComplete ? `Saved: ${regionName}` : regionName}
              </Text>
              <Text
                style={[
                  styles.percentText,
                  { color: isComplete ? '#22C55E' : colors.accent },
                ]}
              >
                {isComplete ? 'READY OFFLINE' : `${percent}%`}
              </Text>
            </View>

            {/* Mini Progress Track */}
            {!isComplete && (
              <View style={[styles.progressTrack, { backgroundColor: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.12)' }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${percent}%`,
                      backgroundColor: colors.accent,
                    },
                  ]}
                />
              </View>
            )}

            <Text style={[styles.subText, { color: colors.textSecondary }]} numberOfLines={1}>
              {isComplete
                ? 'Ready for deep-sea navigation with 0% cellular signal'
                : `${downloadProgress?.completed ?? 0} / ${downloadProgress?.total ?? 0} tiles cached • Tap to open`}
            </Text>
          </View>
        </Pressable>

        {/* Action Controls */}
        <View style={styles.actionButtons}>
          {!isComplete && (
            <Pressable
              style={[styles.actionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}
              onPress={cancelDownload}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Cancel map download"
            >
              <Ionicons name="close" size={16} color="#EF4444" />
            </Pressable>
          )}

          <Pressable
            style={[styles.actionBtn, { backgroundColor: colors.chipBg }]}
            onPress={onOpenSettings}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="View map in settings"
          >
            <Ionicons name="chevron-forward" size={16} color={colors.accent} />
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
    alignItems: 'center',
  },
  pillCard: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 18,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
  },
  pillContentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textWrap: {
    flex: 1,
    marginRight: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  regionNameText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: 6,
  },
  percentText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  subText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
