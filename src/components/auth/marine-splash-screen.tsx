import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type MarineSplashScreenProps = {
  onFinish: () => void;
};

const STATUS_MESSAGES = [
  'INITIALIZING MARINE TELEMETRY...',
  'CALIBRATING GYRO & MAGNETIC SENSORS...',
  'SYNCHRONIZING GPS SATELLITES (3D FIX)...',
  'LOADING ARCGIS BATHYMETRIC MAP TILES...',
  'CAPTAIN COCKPIT READY',
];

export function MarineSplashScreen({ onFinish }: MarineSplashScreenProps) {
  const [statusIndex, setStatusIndex] = useState(0);

  // Animations
  const radarRotation = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(0.95)).current;
  const pulseOpacity = useRef(new Animated.Value(0.7)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const exitFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Entrance animation
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        damping: 15,
        stiffness: 120,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 900,
        delay: 300,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    // 2. Continuous Radar Sweep Rotation
    const rotateLoop = Animated.loop(
      Animated.timing(radarRotation, {
        toValue: 1,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      }),
    );
    rotateLoop.start();

    // 3. Sonar Ring Pulse
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1.15,
            duration: 1600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.2,
            duration: 1600,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 0.95,
            duration: 1600,
            easing: Easing.in(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.7,
            duration: 1600,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
      ]),
    );
    pulseLoop.start();

    // 4. Progress bar filling from 0 to 100% over 2.6 seconds
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2600,
      easing: Easing.bezier(0.2, 0.65, 0.4, 0.9),
      useNativeDriver: false,
    }).start();

    // 5. Status ticker step
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev < STATUS_MESSAGES.length - 1 ? prev + 1 : prev));
    }, 600);

    // 6. Complete after 2.9 seconds
    const timer = setTimeout(() => {
      handleExit();
    }, 2900);

    return () => {
      rotateLoop.stop();
      pulseLoop.stop();
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  const handleExit = () => {
    Animated.timing(exitFade, {
      toValue: 0,
      duration: 350,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      onFinish();
    });
  };

  const spin = radarRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: exitFade }]}>
      {/* Deep Ocean Nautical Background Gradient */}
      <LinearGradient
        colors={['#010A14', '#041728', '#020C18']}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle Coordinate Grid Lines */}
      <View style={styles.gridOverlay} pointerEvents="none">
        <View style={styles.gridHLine1} />
        <View style={styles.gridHLine2} />
        <View style={styles.gridVLine1} />
        <View style={styles.gridVLine2} />
      </View>

      {/* Top Header Row with Skip Button */}
      <View style={styles.topBar}>
        <View style={styles.vesselTag}>
          <View style={styles.gpsDot} />
          <Text style={styles.vesselTagText}>GPS LIVE • 10Hz DUAL-BAND</Text>
        </View>

        <Pressable onPress={handleExit} hitSlop={12} style={styles.skipBtn}>
          <Text style={styles.skipText}>SKIP</Text>
          <Ionicons name="arrow-forward" size={13} color="#38BDF8" />
        </Pressable>
      </View>

      {/* Center Radar & Nautical Logo */}
      <View style={styles.centerSection}>
        {/* Pulsing Sonar Ring 1 */}
        <Animated.View
          style={[
            styles.sonarRing,
            styles.sonarRingOuter,
            {
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
            },
          ]}
        />

        {/* Sonar Ring 2 (Fixed Range Marker) */}
        <View style={[styles.sonarRing, styles.sonarRingMid]}>
          <Text style={styles.rangeLabel}>1.5 NM</Text>
        </View>

        {/* Sonar Ring 3 (Inner Range Marker) */}
        <View style={[styles.sonarRing, styles.sonarRingInner]}>
          <Text style={styles.rangeLabelInner}>0.5 NM</Text>
        </View>

        {/* Rotating Radar Sweep Beam */}
        <Animated.View
          style={[
            styles.radarBeamWrap,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(0, 240, 255, 0.45)', 'rgba(0, 240, 255, 0.0)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.radarSweep}
          />
        </Animated.View>

        {/* Central Marine Compass Icon */}
        <Animated.View
          style={[
            styles.logoCircle,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <LinearGradient
            colors={['#0284C7', '#0369A1', '#082F49']}
            style={styles.logoGradient}
          >
            <MaterialCommunityIcons name="compass-rose" size={62} color="#00F0FF" />
          </LinearGradient>
        </Animated.View>
      </View>

      {/* Brand & Ticker Footer */}
      <Animated.View style={[styles.bottomSection, { opacity: contentFade }]}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="sail-boat" size={24} color="#00F0FF" />
          <Text style={styles.brandTitle}>FISHNAV<Text style={styles.brandPro}> PRO</Text></Text>
        </View>

        <Text style={styles.brandSub}>
          MARINE CHARTPLOTTER & NAUTICAL NAVIGATION
        </Text>

        {/* Live Loading Telemetry Bar */}
        <View style={styles.telemetryBox}>
          <View style={styles.tickerHeader}>
            <Text style={styles.statusText}>{STATUS_MESSAGES[statusIndex]}</Text>
            <Text style={styles.percentText}>
              {Math.min(100, Math.round(((statusIndex + 1) / STATUS_MESSAGES.length) * 100))}%
            </Text>
          </View>

          {/* Progress Bar Track */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, { width: progressWidth }]}>
              <LinearGradient
                colors={['#0284C7', '#00F0FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
        </View>

        {/* Feature Badges Row */}
        <View style={styles.badgeRow}>
          <View style={styles.featureBadge}>
            <Ionicons name="map-outline" size={12} color="#38BDF8" />
            <Text style={styles.badgeText}>Offline Bathymetry</Text>
          </View>

          <View style={styles.featureBadge}>
            <Ionicons name="compass-outline" size={12} color="#10B981" />
            <Text style={styles.badgeText}>Real-Time Gyro</Text>
          </View>

          <View style={styles.featureBadge}>
            <Ionicons name="fish-outline" size={12} color="#F59E0B" />
            <Text style={styles.badgeText}>Sonar Waypoints</Text>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#010A14',
    zIndex: 9999,
    justifyContent: 'space-between',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
  },
  gridHLine1: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#38BDF8',
  },
  gridHLine2: {
    position: 'absolute',
    top: '70%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#38BDF8',
  },
  gridVLine1: {
    position: 'absolute',
    left: '25%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#38BDF8',
  },
  gridVLine2: {
    position: 'absolute',
    right: '25%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#38BDF8',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 12 : 6,
  },
  vesselTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  gpsDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  vesselTagText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: SCREEN_WIDTH - 48,
    height: 280,
    alignSelf: 'center',
  },
  sonarRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  sonarRingOuter: {
    width: 260,
    height: 260,
    borderColor: 'rgba(0, 240, 255, 0.35)',
    borderStyle: 'dashed',
  },
  sonarRingMid: {
    width: 195,
    height: 195,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  sonarRingInner: {
    width: 135,
    height: 135,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  rangeLabel: {
    color: 'rgba(56, 189, 248, 0.6)',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 4,
  },
  rangeLabelInner: {
    color: 'rgba(0, 240, 255, 0.7)',
    fontSize: 8,
    fontWeight: '700',
    marginTop: 3,
  },
  radarBeamWrap: {
    width: 250,
    height: 250,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarSweep: {
    width: 125,
    height: 125,
    position: 'absolute',
    top: 0,
    right: 0,
    borderTopRightRadius: 125,
  },
  logoCircle: {
    width: 106,
    height: 106,
    borderRadius: 53,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 53,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00F0FF',
  },
  bottomSection: {
    alignItems: 'center',
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandPro: {
    color: '#00F0FF',
    fontWeight: '900',
  },
  brandSub: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  telemetryBox: {
    width: '100%',
    backgroundColor: 'rgba(15, 39, 66, 0.65)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 4,
  },
  tickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  percentText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  badgeText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '600',
  },
});
