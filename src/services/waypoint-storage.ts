import { FISHING_SPOTS, FishingSpot } from '@/constants/fishing-spots';
import { persistentStorage } from './persistent-storage';

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

const WAYPOINTS_STORAGE_KEY = 'fishnav_waypoints';
let memoryWaypoints: FishingSpot[] | null = null;

async function ensureWaypointsLoaded(): Promise<FishingSpot[]> {
  if (memoryWaypoints !== null) {
    return memoryWaypoints;
  }

  try {
    const saved = await persistentStorage.getJSON<FishingSpot[] | null>(WAYPOINTS_STORAGE_KEY, null);
    if (Array.isArray(saved) && saved.length > 0) {
      memoryWaypoints = saved;
      return memoryWaypoints;
    }
  } catch (err) {
    console.warn('[WaypointStorage] Failed to read stored waypoints:', err);
  }

  memoryWaypoints = [...FISHING_SPOTS];
  void persistentStorage.setJSON(WAYPOINTS_STORAGE_KEY, memoryWaypoints);
  return memoryWaypoints;
}

/**
 * Local storage implementation.
 * Keeps data synchronized in memory and persistently stored for 100% offline usage.
 */
class LocalWaypointRepository implements IWaypointRepository {
  async getAll(): Promise<FishingSpot[]> {
    const spots = await ensureWaypointsLoaded();
    return [...spots];
  }

  async getById(id: string): Promise<FishingSpot | null> {
    const spots = await ensureWaypointsLoaded();
    const spot = spots.find((s) => s.id === id);
    return spot ? { ...spot } : null;
  }

  async create(newSpotData: Omit<FishingSpot, 'id'>): Promise<FishingSpot> {
    const spots = await ensureWaypointsLoaded();
    const created: FishingSpot = {
      ...newSpotData,
      id: `wp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    };
    memoryWaypoints = [created, ...spots];
    await persistentStorage.setJSON(WAYPOINTS_STORAGE_KEY, memoryWaypoints);
    return created;
  }

  async update(id: string, updates: Partial<FishingSpot>): Promise<FishingSpot> {
    const spots = await ensureWaypointsLoaded();
    const index = spots.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Waypoint with ID "${id}" not found.`);
    }

    const updated: FishingSpot = {
      ...spots[index],
      ...updates,
    };
    const nextList = [...spots];
    nextList[index] = updated;
    memoryWaypoints = nextList;
    await persistentStorage.setJSON(WAYPOINTS_STORAGE_KEY, memoryWaypoints);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const spots = await ensureWaypointsLoaded();
    const initialLen = spots.length;
    memoryWaypoints = spots.filter((s) => s.id !== id);
    const didDelete = memoryWaypoints.length < initialLen;
    if (didDelete) {
      await persistentStorage.setJSON(WAYPOINTS_STORAGE_KEY, memoryWaypoints);
    }
    return didDelete;
  }

  async toggleFavorite(id: string): Promise<FishingSpot> {
    const spots = await ensureWaypointsLoaded();
    const spot = spots.find((s) => s.id === id);
    if (!spot) throw new Error(`Waypoint "${id}" not found.`);
    const updated = { ...spot, favorite: !spot.favorite };
    return this.update(id, updated);
  }

  async resetToDefaults(): Promise<FishingSpot[]> {
    memoryWaypoints = [...FISHING_SPOTS];
    await persistentStorage.setJSON(WAYPOINTS_STORAGE_KEY, memoryWaypoints);
    return [...memoryWaypoints];
  }
}

/** Active repository instance */
export const waypointRepository: IWaypointRepository = new LocalWaypointRepository();
