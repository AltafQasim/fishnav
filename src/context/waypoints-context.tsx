import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { FishingSpot } from '@/constants/fishing-spots';
import { waypointRepository } from '@/services/waypoint-storage';

type WaypointsContextType = {
  waypoints: FishingSpot[];
  loading: boolean;
  selectedSpotId: string | null;
  selectedSpot: FishingSpot | null;
  setSelectedSpotId: (id: string | null) => void;
  activeNavigationTarget: FishingSpot | null;
  setActiveNavigationTarget: (spot: FishingSpot | null) => void;
  addWaypoint: (spot: Omit<FishingSpot, 'id'>) => Promise<FishingSpot>;
  updateWaypoint: (id: string, updates: Partial<FishingSpot>) => Promise<FishingSpot>;
  deleteWaypoint: (id: string) => Promise<boolean>;
  toggleFavorite: (id: string) => Promise<FishingSpot>;
  resetWaypoints: () => Promise<void>;
  refreshWaypoints: () => Promise<void>;
};

const WaypointsContext = createContext<WaypointsContextType | undefined>(undefined);

export function WaypointsProvider({ children }: { children: React.ReactNode }) {
  const [waypoints, setWaypoints] = useState<FishingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [activeNavigationTarget, setActiveNavigationTarget] = useState<FishingSpot | null>(null);

  const refreshWaypoints = useCallback(async () => {
    try {
      const data = await waypointRepository.getAll();
      setWaypoints(data);
    } catch (err) {
      console.error('Failed to load waypoints:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshWaypoints();
  }, [refreshWaypoints]);

  const addWaypoint = async (spotData: Omit<FishingSpot, 'id'>) => {
    const created = await waypointRepository.create(spotData);
    setWaypoints((prev) => [created, ...prev]);
    return created;
  };

  const updateWaypoint = async (id: string, updates: Partial<FishingSpot>) => {
    const updated = await waypointRepository.update(id, updates);
    setWaypoints((prev) => prev.map((s) => (s.id === id ? updated : s)));
    if (activeNavigationTarget?.id === id) {
      setActiveNavigationTarget(updated);
    }
    return updated;
  };

  const deleteWaypoint = async (id: string) => {
    const success = await waypointRepository.delete(id);
    if (success) {
      setWaypoints((prev) => prev.filter((s) => s.id !== id));
      if (selectedSpotId === id) setSelectedSpotId(null);
      if (activeNavigationTarget?.id === id) setActiveNavigationTarget(null);
    }
    return success;
  };

  const toggleFavorite = async (id: string) => {
    const updated = await waypointRepository.toggleFavorite(id);
    setWaypoints((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  };

  const resetWaypoints = async () => {
    const defaults = await waypointRepository.resetToDefaults();
    setWaypoints(defaults);
    setSelectedSpotId(null);
    setActiveNavigationTarget(null);
  };

  const selectedSpot = waypoints.find((s) => s.id === selectedSpotId) ?? null;

  return (
    <WaypointsContext.Provider
      value={{
        waypoints,
        loading,
        selectedSpotId,
        selectedSpot,
        setSelectedSpotId,
        activeNavigationTarget,
        setActiveNavigationTarget,
        addWaypoint,
        updateWaypoint,
        deleteWaypoint,
        toggleFavorite,
        resetWaypoints,
        refreshWaypoints,
      }}
    >
      {children}
    </WaypointsContext.Provider>
  );
}

export function useWaypoints() {
  const ctx = useContext(WaypointsContext);
  if (!ctx) {
    throw new Error('useWaypoints must be used within a WaypointsProvider');
  }
  return ctx;
}
