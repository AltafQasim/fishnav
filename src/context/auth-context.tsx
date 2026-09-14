import React, { createContext, useContext, useEffect, useState } from 'react';

export type CaptainProfile = {
  id: string;
  name: string;
  emailOrPhone: string;
  vesselName: string;
  vesselType: string;
  callSign: string;
  homeHarbor: string;
  licenseNumber: string;
};

const DEFAULT_DEMO_CAPTAIN: CaptainProfile = {
  id: 'cpt-007',
  name: 'Capt. Vikram Rathore',
  emailOrPhone: 'capt.vikram@fishnav.pro',
  vesselName: 'Sea Hunter II',
  vesselType: 'Deep Sea Trawler (42ft)',
  callSign: 'IND-GJ-8821',
  homeHarbor: 'Veraval Fishing Port, Gujarat',
  licenseNumber: 'IND-MF-2024-991',
};

type AuthContextType = {
  isAuthenticated: boolean;
  captain: CaptainProfile | null;
  login: (credentials: {
    name?: string;
    identifier: string;
    vesselName?: string;
    password?: string;
  }) => Promise<boolean>;
  loginAsDemo: () => void;
  logout: () => void;
  updateCaptain: (updates: Partial<CaptainProfile>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'fishnav_auth_captain_v1';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [captain, setCaptain] = useState<CaptainProfile | null>(null);

  // Restore stored session if running in web or persistent environment
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setCaptain(parsed);
          setIsAuthenticated(true);
        }
      }
    } catch {
      // Storage unavailable or disabled
    }
  }, []);

  const saveToStorage = (profile: CaptainProfile | null) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (profile) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // Ignore storage errors
    }
  };

  const login = async (credentials: {
    name?: string;
    identifier: string;
    vesselName?: string;
    password?: string;
  }): Promise<boolean> => {
    // Simulated authentication with client persistence
    const profile: CaptainProfile = {
      id: `cpt-${Date.now()}`,
      name: credentials.name?.trim() || credentials.identifier.split('@')[0] || 'Vessel Master',
      emailOrPhone: credentials.identifier.trim(),
      vesselName: credentials.vesselName?.trim() || 'Ocean Scout I',
      vesselType: 'Commercial Fishing Vessel',
      callSign: `IND-FSH-${Math.floor(1000 + Math.random() * 9000)}`,
      homeHarbor: 'Veraval Deep Water Harbor',
      licenseNumber: `IND-LIC-${Math.floor(10000 + Math.random() * 90000)}`,
    };

    setCaptain(profile);
    setIsAuthenticated(true);
    saveToStorage(profile);
    return true;
  };

  const loginAsDemo = () => {
    setCaptain(DEFAULT_DEMO_CAPTAIN);
    setIsAuthenticated(true);
    saveToStorage(DEFAULT_DEMO_CAPTAIN);
  };

  const logout = () => {
    setCaptain(null);
    setIsAuthenticated(false);
    saveToStorage(null);
  };

  const updateCaptain = (updates: Partial<CaptainProfile>) => {
    setCaptain((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      saveToStorage(updated);
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        captain,
        login,
        loginAsDemo,
        logout,
        updateCaptain,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
