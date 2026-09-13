export type TripPoint = {
  latitude: number;
  longitude: number;
  timestamp: number;
  speedKnots?: number;
  heading?: number;
};

export type FishingTrip = {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  distanceNm: number;
  avgSpeedKnots: number;
  maxSpeedKnots: number;
  points: TripPoint[];
  targetSpotId?: string | null;
  targetSpotName?: string | null;
  color: string;
  visibleOnMap?: boolean;
  notes?: string;
};

/**
 * Realistic demo marine trips along the Gujarat fishing coastline
 * (Veraval Harbour, Porbandar, Okha Reefs)
 */
export const DEMO_TRIPS: FishingTrip[] = [
  {
    id: 'trip_demo_1',
    name: 'Morning Ghol Fish Expedition',
    startTime: Date.now() - 1000 * 60 * 60 * 26, // Yesterday morning
    endTime: Date.now() - 1000 * 60 * 60 * 22,
    durationSeconds: 14400, // 4 hours
    distanceNm: 18.6,
    avgSpeedKnots: 6.8,
    maxSpeedKnots: 11.4,
    color: '#00F0FF',
    visibleOnMap: true,
    targetSpotName: 'Ghol Spot (65m depth)',
    notes: 'Good catch near the shelf drop-off. Calm seas, light NW breeze.',
    points: [
      { latitude: 20.902, longitude: 70.368, timestamp: Date.now() - 1000 * 60 * 60 * 26, speedKnots: 4.5 },
      { latitude: 20.810, longitude: 70.440, timestamp: Date.now() - 1000 * 60 * 60 * 25, speedKnots: 8.2 },
      { latitude: 20.650, longitude: 70.600, timestamp: Date.now() - 1000 * 60 * 60 * 24, speedKnots: 7.5 },
      { latitude: 20.480, longitude: 70.750, timestamp: Date.now() - 1000 * 60 * 60 * 23, speedKnots: 6.9 },
      { latitude: 20.387, longitude: 70.878, timestamp: Date.now() - 1000 * 60 * 60 * 22, speedKnots: 3.1 },
    ],
  },
  {
    id: 'trip_demo_2',
    name: 'Veraval Deep Sea Tuna Run',
    startTime: Date.now() - 1000 * 60 * 60 * 74, // 3 days ago
    endTime: Date.now() - 1000 * 60 * 60 * 68,
    durationSeconds: 21600, // 6 hours
    distanceNm: 27.4,
    avgSpeedKnots: 7.9,
    maxSpeedKnots: 13.2,
    color: '#38BDF8',
    visibleOnMap: false,
    targetSpotName: 'Tuna Spot (120m depth)',
    notes: 'Long offshore run. High activity around midday.',
    points: [
      { latitude: 20.902, longitude: 70.368, timestamp: Date.now() - 1000 * 60 * 60 * 74, speedKnots: 5.0 },
      { latitude: 20.730, longitude: 70.480, timestamp: Date.now() - 1000 * 60 * 60 * 72, speedKnots: 9.1 },
      { latitude: 20.510, longitude: 70.580, timestamp: Date.now() - 1000 * 60 * 60 * 70, speedKnots: 8.8 },
      { latitude: 20.291, longitude: 70.652, timestamp: Date.now() - 1000 * 60 * 60 * 68, speedKnots: 4.2 },
    ],
  },
];
