import { DEMO_TRIPS, type FishingTrip } from '@/constants/trips';

export interface ITripRepository {
  getAll(): Promise<FishingTrip[]>;
  getById(id: string): Promise<FishingTrip | null>;
  save(trip: FishingTrip): Promise<FishingTrip>;
  delete(id: string): Promise<boolean>;
  toggleVisibility(id: string): Promise<FishingTrip>;
  resetToDefaults(): Promise<FishingTrip[]>;
}

/** In-memory storage cache */
let memoryTrips: FishingTrip[] = [...DEMO_TRIPS];

class LocalTripRepository implements ITripRepository {
  async getAll(): Promise<FishingTrip[]> {
    return [...memoryTrips];
  }

  async getById(id: string): Promise<FishingTrip | null> {
    const trip = memoryTrips.find((t) => t.id === id);
    return trip ? { ...trip } : null;
  }

  async save(trip: FishingTrip): Promise<FishingTrip> {
    const index = memoryTrips.findIndex((t) => t.id === trip.id);
    if (index >= 0) {
      memoryTrips[index] = { ...trip };
    } else {
      memoryTrips = [trip, ...memoryTrips];
    }
    return trip;
  }

  async delete(id: string): Promise<boolean> {
    const initialLen = memoryTrips.length;
    memoryTrips = memoryTrips.filter((t) => t.id !== id);
    return memoryTrips.length < initialLen;
  }

  async toggleVisibility(id: string): Promise<FishingTrip> {
    const trip = memoryTrips.find((t) => t.id === id);
    if (!trip) {
      throw new Error(`Trip with ID "${id}" not found.`);
    }
    trip.visibleOnMap = !trip.visibleOnMap;
    return { ...trip };
  }

  async resetToDefaults(): Promise<FishingTrip[]> {
    memoryTrips = [...DEMO_TRIPS];
    return [...memoryTrips];
  }
}

export const tripRepository: ITripRepository = new LocalTripRepository();
