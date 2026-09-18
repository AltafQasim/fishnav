import { DEMO_TRIPS, type FishingTrip } from '@/constants/trips';
import { persistentStorage } from './persistent-storage';

export interface ITripRepository {
  getAll(): Promise<FishingTrip[]>;
  getById(id: string): Promise<FishingTrip | null>;
  save(trip: FishingTrip): Promise<FishingTrip>;
  delete(id: string): Promise<boolean>;
  toggleVisibility(id: string): Promise<FishingTrip>;
  resetToDefaults(): Promise<FishingTrip[]>;
}

const TRIPS_STORAGE_KEY = 'fishnav_trips';
let memoryTrips: FishingTrip[] | null = null;

async function ensureTripsLoaded(): Promise<FishingTrip[]> {
  if (memoryTrips !== null) {
    return memoryTrips;
  }

  try {
    const saved = await persistentStorage.getJSON<FishingTrip[] | null>(TRIPS_STORAGE_KEY, null);
    if (Array.isArray(saved) && saved.length > 0) {
      memoryTrips = saved;
      return memoryTrips;
    }
  } catch (err) {
    console.warn('[TripStorage] Failed to read stored trips:', err);
  }

  memoryTrips = [...DEMO_TRIPS];
  void persistentStorage.setJSON(TRIPS_STORAGE_KEY, memoryTrips);
  return memoryTrips;
}

class LocalTripRepository implements ITripRepository {
  async getAll(): Promise<FishingTrip[]> {
    const trips = await ensureTripsLoaded();
    return [...trips];
  }

  async getById(id: string): Promise<FishingTrip | null> {
    const trips = await ensureTripsLoaded();
    const trip = trips.find((t) => t.id === id);
    return trip ? { ...trip } : null;
  }

  async save(trip: FishingTrip): Promise<FishingTrip> {
    const trips = await ensureTripsLoaded();
    const index = trips.findIndex((t) => t.id === trip.id);
    let nextList: FishingTrip[];
    if (index >= 0) {
      nextList = [...trips];
      nextList[index] = { ...trip };
    } else {
      nextList = [trip, ...trips];
    }
    memoryTrips = nextList;
    await persistentStorage.setJSON(TRIPS_STORAGE_KEY, memoryTrips);
    return trip;
  }

  async delete(id: string): Promise<boolean> {
    const trips = await ensureTripsLoaded();
    const initialLen = trips.length;
    memoryTrips = trips.filter((t) => t.id !== id);
    const didDelete = memoryTrips.length < initialLen;
    if (didDelete) {
      await persistentStorage.setJSON(TRIPS_STORAGE_KEY, memoryTrips);
    }
    return didDelete;
  }

  async toggleVisibility(id: string): Promise<FishingTrip> {
    const trips = await ensureTripsLoaded();
    const index = trips.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Trip with ID "${id}" not found.`);
    }
    const updated = { ...trips[index], visibleOnMap: !trips[index].visibleOnMap };
    const nextList = [...trips];
    nextList[index] = updated;
    memoryTrips = nextList;
    await persistentStorage.setJSON(TRIPS_STORAGE_KEY, memoryTrips);
    return updated;
  }

  async resetToDefaults(): Promise<FishingTrip[]> {
    memoryTrips = [...DEMO_TRIPS];
    await persistentStorage.setJSON(TRIPS_STORAGE_KEY, memoryTrips);
    return [...memoryTrips];
  }
}

export const tripRepository: ITripRepository = new LocalTripRepository();
