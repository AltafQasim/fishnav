import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import type { FishingSpot } from '@/constants/fishing-spots';
import type { FishingTrip, TripPoint } from '@/constants/trips';
import { useUserLocation } from '@/hooks/use-user-location';
import { tripRepository } from '@/services/trip-storage';
import { bearingDegrees, distanceNm } from '@/utils/geo';

export type SteeringTurn =
  | 'straight'
  | 'slight-right'
  | 'right'
  | 'sharp-right'
  | 'slight-left'
  | 'left'
  | 'sharp-left'
  | 'u-turn';

export type TripContextType = {
  isTracking: boolean;
  isPaused: boolean;
  isNavigating: boolean;
  elapsedSeconds: number;
  distanceNm: number;
  distanceToTargetNm: number | null;
  currentSpeedKnots: number;
  avgSpeedKnots: number;
  maxSpeedKnots: number;
  activePoints: TripPoint[];
  targetSpot: FishingSpot | null;
  targetBearing: number | null;
  userCompassHeading: number;
  relativeSteerAngle: number | null;
  steeringTurn: SteeringTurn;
  steeringInstruction: string;
  savedTrips: FishingTrip[];
  showSaveModal: boolean;
  pendingTripSummary: FishingTrip | null;
  startNavigation: (target?: FishingSpot | null) => void;
  startTripRecording: () => void;
  stopTripRecording: () => void;
  toggleTripRecording: () => void;
  startTracking: (target?: FishingSpot | null) => void;
  pauseTracking: () => void;
  resumeTracking: () => void;
  finishTracking: () => void;
  saveTrip: (name: string, notes?: string) => Promise<FishingTrip>;
  discardTrip: () => void;
  closeSaveModal: () => void;
  deleteTrip: (id: string) => Promise<boolean>;
  toggleTripVisibility: (id: string) => Promise<void>;
  viewTripOnMap: (trip: FishingTrip) => void;
  exitNavigation: () => void;
  selectedTripForMap: FishingTrip | null;
  clearSelectedTrip: () => void;
};

const TripContext = createContext<TripContextType | undefined>(undefined);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const { location, heading } = useUserLocation();

  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetSpot, setTargetSpot] = useState<FishingSpot | null>(null);

  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [distanceCoveredNm, setDistanceCoveredNm] = useState<number>(0);
  const [maxSpeedKnots, setMaxSpeedKnots] = useState<number>(0);
  const [activePoints, setActivePoints] = useState<TripPoint[]>([]);

  const [savedTrips, setSavedTrips] = useState<FishingTrip[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pendingTripSummary, setPendingTripSummary] = useState<FishingTrip | null>(null);
  const [selectedTripForMap, setSelectedTripForMap] = useState<FishingTrip | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);

  // Load saved trips on mount
  const refreshSavedTrips = useCallback(async () => {
    try {
      const trips = await tripRepository.getAll();
      setSavedTrips(trips);
    } catch (err) {
      console.error('Failed to load trips:', err);
    }
  }, []);

  useEffect(() => {
    void refreshSavedTrips();
  }, [refreshSavedTrips]);

  // Elapsed timer ticker
  useEffect(() => {
    if (isTracking && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((sec) => sec + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTracking, isPaused]);

  // Live speed in knots (m/s * 1.94384)
  const currentSpeedKnots =
    location?.speed != null && location.speed > 0
      ? Number((location.speed * 1.94384).toFixed(1))
      : 0;

  // Average speed in knots
  const avgSpeedKnots =
    elapsedSeconds > 10 && distanceCoveredNm > 0
      ? Number(((distanceCoveredNm / elapsedSeconds) * 3600).toFixed(1))
      : currentSpeedKnots;

  // Track location movement
  useEffect(() => {
    if (!isTracking || isPaused || !location) return;

    // Update max speed
    if (currentSpeedKnots > maxSpeedKnots) {
      setMaxSpeedKnots(currentSpeedKnots);
    }

    const currentCoord = { latitude: location.latitude, longitude: location.longitude };

    if (!lastLocationRef.current) {
      lastLocationRef.current = currentCoord;
      setActivePoints([
        {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: Date.now(),
          speedKnots: currentSpeedKnots,
          heading: heading ?? location.heading ?? undefined,
        },
      ]);
      return;
    }

    // Measure distance since last recorded point
    const stepNm = distanceNm(
      lastLocationRef.current.latitude,
      lastLocationRef.current.longitude,
      currentCoord.latitude,
      currentCoord.longitude,
    );

    // Filter minor GPS jitter (~10m is approx 0.0054 NM)
    if (stepNm >= 0.005) {
      setDistanceCoveredNm((prev) => prev + stepNm);
      lastLocationRef.current = currentCoord;
      setActivePoints((prev) => [
        ...prev,
        {
          latitude: currentCoord.latitude,
          longitude: currentCoord.longitude,
          timestamp: Date.now(),
          speedKnots: currentSpeedKnots,
          heading: heading ?? location.heading ?? undefined,
        },
      ]);
    }
  }, [location, isTracking, isPaused, currentSpeedKnots, maxSpeedKnots, heading]);

  // Distance to Target Spot in Nautical Miles
  const distanceToTargetNm =
    targetSpot && location
      ? Number(
          distanceNm(
            location.latitude,
            location.longitude,
            targetSpot.latitude,
            targetSpot.longitude,
          ).toFixed(2),
        )
      : null;

  // Target Bearing and Relative Compass Steering Angle
  const targetBearing =
    targetSpot && location
      ? bearingDegrees(
          location.latitude,
          location.longitude,
          targetSpot.latitude,
          targetSpot.longitude,
        )
      : null;

  // Compass-driven relative steer angle (-180 to +180)
  // Positive = Target is to the RIGHT (Steer Right!)
  // Negative = Target is to the LEFT (Steer Left!)
  const userCompassHeading = Math.round(heading ?? location?.heading ?? 0);

  let relativeSteerAngle: number | null = null;
  let steeringTurn: SteeringTurn = 'straight';
  let steeringInstruction = 'Keep Straight on Course';

  if (targetBearing != null) {
    let diff = (targetBearing - userCompassHeading + 540) % 360 - 180;
    relativeSteerAngle = Math.round(diff);

    const absDiff = Math.abs(relativeSteerAngle);

    if (absDiff <= 6) {
      steeringTurn = 'straight';
      steeringInstruction = `On Course • Steady ${Math.round(targetBearing)}°`;
    } else if (relativeSteerAngle > 6 && relativeSteerAngle <= 25) {
      steeringTurn = 'slight-right';
      steeringInstruction = `Steer Right ${absDiff}° to ${Math.round(targetBearing)}°`;
    } else if (relativeSteerAngle > 25 && relativeSteerAngle <= 80) {
      steeringTurn = 'right';
      steeringInstruction = `Turn Right ${absDiff}° to ${Math.round(targetBearing)}°`;
    } else if (relativeSteerAngle > 80 && relativeSteerAngle <= 140) {
      steeringTurn = 'sharp-right';
      steeringInstruction = `Hard Right ${absDiff}° to ${Math.round(targetBearing)}°`;
    } else if (relativeSteerAngle < -6 && relativeSteerAngle >= -25) {
      steeringTurn = 'slight-left';
      steeringInstruction = `Steer Left ${absDiff}° to ${Math.round(targetBearing)}°`;
    } else if (relativeSteerAngle < -25 && relativeSteerAngle >= -80) {
      steeringTurn = 'left';
      steeringInstruction = `Turn Left ${absDiff}° to ${Math.round(targetBearing)}°`;
    } else if (relativeSteerAngle < -80 && relativeSteerAngle >= -140) {
      steeringTurn = 'sharp-left';
      steeringInstruction = `Hard Left ${absDiff}° to ${Math.round(targetBearing)}°`;
    } else {
      steeringTurn = 'u-turn';
      steeringInstruction = `Turn Boat Around • Target Behind`;
    }
  } else if (isTracking) {
    steeringInstruction = `Tracking Route • Heading ${Math.round(userCompassHeading)}°`;
  }

  // Navigation without auto-recording
  const startNavigation = useCallback((target?: FishingSpot | null) => {
    setIsNavigating(true);
    setTargetSpot(target ?? null);
    setIsTracking(false);
    setIsPaused(false);
    setStartTime(0);
    setElapsedSeconds(0);
    setDistanceCoveredNm(0);
    setMaxSpeedKnots(0);
    setActivePoints([]);
    lastLocationRef.current = null;
  }, []);

  // Optional Trip Track Recording
  const startTripRecording = useCallback(() => {
    setIsTracking(true);
    setIsPaused(false);
    setStartTime(Date.now());
    setElapsedSeconds(0);
    setDistanceCoveredNm(0);
    setMaxSpeedKnots(currentSpeedKnots);
    if (location) {
      lastLocationRef.current = { latitude: location.latitude, longitude: location.longitude };
      setActivePoints([
        {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: Date.now(),
          speedKnots: currentSpeedKnots,
          heading: heading ?? location.heading ?? undefined,
        },
      ]);
    } else {
      setActivePoints([]);
      lastLocationRef.current = null;
    }
  }, [currentSpeedKnots, location, heading]);

  const finishTracking = useCallback(() => {
    setIsPaused(true);
    const summary: FishingTrip = {
      id: `trip_${Date.now()}`,
      name: targetSpot
        ? `Trip to ${targetSpot.name}`
        : `Marine Voyage - ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
      startTime: startTime || Date.now() - elapsedSeconds * 1000,
      endTime: Date.now(),
      durationSeconds: Math.max(elapsedSeconds, 1),
      distanceNm: Number(distanceCoveredNm.toFixed(2)),
      avgSpeedKnots: avgSpeedKnots,
      maxSpeedKnots: Number(maxSpeedKnots.toFixed(1)),
      targetSpotId: targetSpot?.id,
      targetSpotName: targetSpot?.name,
      color: '#00F0FF',
      visibleOnMap: true,
      points: [...activePoints],
    };

    setPendingTripSummary(summary);
    setShowSaveModal(true);
  }, [targetSpot, startTime, elapsedSeconds, distanceCoveredNm, avgSpeedKnots, maxSpeedKnots, activePoints]);

  const stopTripRecording = useCallback(() => {
    if (activePoints.length > 1 || distanceCoveredNm > 0.01) {
      finishTracking();
    } else {
      setIsTracking(false);
      setIsPaused(false);
      setElapsedSeconds(0);
      setDistanceCoveredNm(0);
      setActivePoints([]);
      lastLocationRef.current = null;
    }
  }, [activePoints.length, distanceCoveredNm, finishTracking]);

  const toggleTripRecording = useCallback(() => {
    if (isTracking) {
      stopTripRecording();
    } else {
      startTripRecording();
    }
  }, [isTracking, stopTripRecording, startTripRecording]);

  // Action Methods
  const startTracking = useCallback((target?: FishingSpot | null) => {
    setIsTracking(true);
    setIsPaused(false);
    setIsNavigating(true);
    setTargetSpot(target ?? null);
    setStartTime(Date.now());
    setElapsedSeconds(0);
    setDistanceCoveredNm(0);
    setMaxSpeedKnots(0);

    if (location) {
      lastLocationRef.current = { latitude: location.latitude, longitude: location.longitude };
      setActivePoints([
        {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: Date.now(),
          speedKnots: currentSpeedKnots,
          heading: heading ?? location.heading ?? undefined,
        },
      ]);
    } else {
      setActivePoints([]);
      lastLocationRef.current = null;
    }
  }, [location, currentSpeedKnots, heading]);

  const pauseTracking = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeTracking = useCallback(() => {
    setIsPaused(false);
  }, []);

  const saveTrip = useCallback(async (name: string, notes?: string) => {
    if (!pendingTripSummary) throw new Error('No pending trip to save');
    const finalTrip: FishingTrip = {
      ...pendingTripSummary,
      name: name.trim() || pendingTripSummary.name,
      notes: notes?.trim() || undefined,
    };

    const saved = await tripRepository.save(finalTrip);
    setSavedTrips((prev) => [saved, ...prev.filter((t) => t.id !== saved.id)]);

    // Reset tracking state
    setShowSaveModal(false);
    setPendingTripSummary(null);
    setIsTracking(false);
    setIsPaused(false);
    setIsNavigating(false);
    setTargetSpot(null);
    setActivePoints([]);
    setDistanceCoveredNm(0);
    setElapsedSeconds(0);
    lastLocationRef.current = null;

    return saved;
  }, [pendingTripSummary]);

  const discardTrip = useCallback(() => {
    setShowSaveModal(false);
    setPendingTripSummary(null);
    setIsTracking(false);
    setIsPaused(false);
    setIsNavigating(false);
    setTargetSpot(null);
    setActivePoints([]);
    setDistanceCoveredNm(0);
    setElapsedSeconds(0);
    lastLocationRef.current = null;
  }, []);

  const closeSaveModal = useCallback(() => {
    setShowSaveModal(false);
  }, []);

  const deleteTrip = useCallback(async (id: string) => {
    const success = await tripRepository.delete(id);
    if (success) {
      setSavedTrips((prev) => prev.filter((t) => t.id !== id));
      setSelectedTripForMap((prev) => (prev?.id === id ? null : prev));
    }
    return success;
  }, []);

  const toggleTripVisibility = useCallback(async (id: string) => {
    const updated = await tripRepository.toggleVisibility(id);
    setSavedTrips((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const viewTripOnMap = useCallback((trip: FishingTrip) => {
    setSelectedTripForMap(trip);
    setIsNavigating(false);
  }, []);

  const clearSelectedTrip = useCallback(() => {
    setSelectedTripForMap(null);
  }, []);

  const exitNavigation = useCallback(() => {
    if (isTracking && (activePoints.length > 1 || distanceCoveredNm > 0.01)) {
      finishTracking();
    } else {
      setIsNavigating(false);
      setTargetSpot(null);
      setIsTracking(false);
      setIsPaused(false);
      setActivePoints([]);
      setDistanceCoveredNm(0);
      setElapsedSeconds(0);
      lastLocationRef.current = null;
    }
  }, [isTracking, activePoints.length, distanceCoveredNm, finishTracking]);

  const value = useMemo(
    () => ({
      isTracking,
      isPaused,
      isNavigating,
      elapsedSeconds,
      distanceNm: Number(distanceCoveredNm.toFixed(2)),
      distanceToTargetNm,
      currentSpeedKnots,
      avgSpeedKnots,
      maxSpeedKnots,
      activePoints,
      targetSpot,
      targetBearing,
      userCompassHeading,
      relativeSteerAngle,
      steeringTurn,
      steeringInstruction,
      savedTrips,
      showSaveModal,
      pendingTripSummary,
      startNavigation,
      startTripRecording,
      stopTripRecording,
      toggleTripRecording,
      startTracking,
      pauseTracking,
      resumeTracking,
      finishTracking,
      saveTrip,
      discardTrip,
      closeSaveModal,
      deleteTrip,
      toggleTripVisibility,
      viewTripOnMap,
      exitNavigation,
      selectedTripForMap,
      clearSelectedTrip,
    }),
    [
      isTracking,
      isPaused,
      isNavigating,
      elapsedSeconds,
      distanceCoveredNm,
      distanceToTargetNm,
      currentSpeedKnots,
      avgSpeedKnots,
      maxSpeedKnots,
      activePoints,
      targetSpot,
      targetBearing,
      userCompassHeading,
      relativeSteerAngle,
      steeringTurn,
      steeringInstruction,
      savedTrips,
      showSaveModal,
      pendingTripSummary,
      startNavigation,
      startTripRecording,
      stopTripRecording,
      toggleTripRecording,
      startTracking,
      pauseTracking,
      resumeTracking,
      finishTracking,
      saveTrip,
      discardTrip,
      closeSaveModal,
      deleteTrip,
      toggleTripVisibility,
      viewTripOnMap,
      exitNavigation,
      selectedTripForMap,
      clearSelectedTrip,
    ]
  );

  return (
    <TripContext.Provider value={value}>
      {children}
    </TripContext.Provider>
  );
}

export function useTripTracking() {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTripTracking must be used within a TripProvider');
  }
  return context;
}
