import { FISHING_SPOTS, FishingSpot } from '@/constants/fishing-spots';

/**
 * Interface for Waypoint Data Repository.
 *
 * NOTE FOR FUTURE BACKEND / DATABASE INTEGRATION:
 * To migrate from local memory/storage to a remote database (e.g. Supabase, Firebase, PostgreSQL, REST API):
 * 1. Implement this interface in a new file (e.g. `supabase-waypoint-service.ts`).
 * 2. Swap the active service instance exported at the bottom of this file.
 * The entire UI and Context layer will continue to function without any changes!
 */
export interface IWaypointRepository {
  getAll(): Promise<FishingSpot[]>;
  getById(id: string): Promise<FishingSpot | null>;
  create(spot: Omit<FishingSpot, 'id'>): Promise<FishingSpot>;
  update(id: string, updates: Partial<FishingSpot>): Promise<FishingSpot>;
  delete(id: string): Promise<boolean>;
  toggleFavorite(id: string): Promise<FishingSpot>;
  resetToDefaults(): Promise<FishingSpot[]>;
}

/** In-memory storage cache */
let memoryWaypoints: FishingSpot[] = [...FISHING_SPOTS];

/**
 * Local storage implementation.
 * Keeps data synchronized in memory and ready for persistence.
 */
class LocalWaypointRepository implements IWaypointRepository {
  async getAll(): Promise<FishingSpot[]> {
    // In future: Replace with `const { data } = await supabase.from('waypoints').select('*')`
    return [...memoryWaypoints];
  }

  async getById(id: string): Promise<FishingSpot | null> {
    const spot = memoryWaypoints.find((s) => s.id === id);
    return spot ? { ...spot } : null;
  }

  async create(newSpotData: Omit<FishingSpot, 'id'>): Promise<FishingSpot> {
    const created: FishingSpot = {
      ...newSpotData,
      id: `wp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    };
    memoryWaypoints = [created, ...memoryWaypoints];
    return created;
  }

  async update(id: string, updates: Partial<FishingSpot>): Promise<FishingSpot> {
    const index = memoryWaypoints.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Waypoint with ID "${id}" not found.`);
    }

    const updated: FishingSpot = {
      ...memoryWaypoints[index],
      ...updates,
    };
    memoryWaypoints[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const initialLen = memoryWaypoints.length;
    memoryWaypoints = memoryWaypoints.filter((s) => s.id !== id);
    return memoryWaypoints.length < initialLen;
  }

  async toggleFavorite(id: string): Promise<FishingSpot> {
    const spot = memoryWaypoints.find((s) => s.id === id);
    if (!spot) throw new Error(`Waypoint "${id}" not found.`);
    const updated = { ...spot, favorite: !spot.favorite };
    return this.update(id, updated);
  }

  async resetToDefaults(): Promise<FishingSpot[]> {
    memoryWaypoints = [...FISHING_SPOTS];
    return [...memoryWaypoints];
  }
}

/** Active repository instance */
export const waypointRepository: IWaypointRepository = new LocalWaypointRepository();
