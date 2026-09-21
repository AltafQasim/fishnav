import React, { createContext, useContext, useEffect, useState } from 'react';

export type CaptainProfile = {
  id: string;
  name: string;
  emailOrPhone: string;
  avatarUrl?: string;
  vesselName: string;
  vesselType: string;
  callSign: string;
  homeHarbor: string;
  licenseNumber: string;
  boatLengthM?: string;
  boatDraftM?: string;
  cruiseSpeedKnots?: string;
  authProvider: 'phone' | 'google' | 'demo' | 'password';
  authMethodLabel: string;
  loginAt: string;
  sessionStatus: 'ACTIVE' | 'OFFLINE_VERIFIED';
};

const DEFAULT_DEMO_CAPTAIN: CaptainProfile = {
  id: 'cpt-007',
  name: 'Capt. Vikram Rathore',
  emailOrPhone: '+91 98765 43210',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=faces',
  vesselName: 'Sea Hunter II',
  vesselType: 'Deep Sea Trawler (42ft)',
  callSign: 'IND-GJ-8821',
  homeHarbor: 'Veraval Fishing Port, Gujarat',
  licenseNumber: 'IND-MF-2026-991',
  boatLengthM: '24.5',
  boatDraftM: '1.8',
  cruiseSpeedKnots: '12',
  authProvider: 'demo',
  authMethodLabel: 'Fleet Master Demo Bypass',
  loginAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  sessionStatus: 'ACTIVE',
};

type AuthContextType = {
  isAuthenticated: boolean;
  isAuthReady: boolean;
  captain: CaptainProfile | null;
  login: (credentials: {
    name?: string;
    identifier: string;
    vesselName?: string;
    password?: string;
  }) => Promise<boolean>;
  loginWithPhone: (phone: string, name?: string, vesselName?: string) => Promise<boolean>;
  loginWithGoogle: (googleUser?: { name?: string; email?: string }) => Promise<boolean>;
  loginAsDemo: () => void;
  logout: () => void;
  updateCaptain: (updates: Partial<CaptainProfile>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'fishnav_auth_captain_v2';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
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
    } finally {
      setIsAuthReady(true);
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
    const nowStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const profile: CaptainProfile = {
      id: `cpt-${Date.now()}`,
      name: credentials.name?.trim() || credentials.identifier.split('@')[0] || 'Vessel Master',
      emailOrPhone: credentials.identifier.trim(),
      vesselName: credentials.vesselName?.trim() || 'Ocean Scout I',
      vesselType: 'Commercial Fishing Vessel',
      callSign: `IND-FSH-${Math.floor(1000 + Math.random() * 9000)}`,
      homeHarbor: 'Veraval Deep Water Harbor',
      licenseNumber: `IND-LIC-${Math.floor(10000 + Math.random() * 90000)}`,
      authProvider: 'password',
      authMethodLabel: 'Captain ID & Access Key',
      loginAt: nowStr,
      sessionStatus: 'ACTIVE',
    };

    setCaptain(profile);
    setIsAuthenticated(true);
    saveToStorage(profile);
    return true;
  };

  const loginWithPhone = async (
    phone: string,
    name?: string,
    vesselName?: string,
  ): Promise<boolean> => {
    const digits = phone.replace(/\D/g, '');
    const last4 = digits.slice(-4) || '8821';
    const nowStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const formattedPhone = phone.startsWith('+') ? phone : `+91 ${phone}`;

    const profile: CaptainProfile = {
      id: `cpt-phone-${last4}`,
      name: name?.trim() || `Captain (+91 ${digits.slice(-10)})`,
      emailOrPhone: formattedPhone,
      vesselName: vesselName?.trim() || 'Sea Hunter II',
      vesselType: 'Deep Sea Trawler (42ft)',
      callSign: `IND-GJ-${last4}`,
      homeHarbor: 'Veraval Fishing Port, Gujarat',
      licenseNumber: `IND-MF-${last4}`,
      authProvider: 'phone',
      authMethodLabel: `Mobile OTP (${formattedPhone})`,
      loginAt: nowStr,
      sessionStatus: 'ACTIVE',
    };

    setCaptain(profile);
    setIsAuthenticated(true);
    saveToStorage(profile);
    return true;
  };

  const loginWithGoogle = async (googleUser?: {
    name?: string;
    email?: string;
  }): Promise<boolean> => {
    const nowStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const email = googleUser?.email || 'capt.vikram@gmail.com';
    const name = googleUser?.name || 'Capt. Vikram Rathore';

    const profile: CaptainProfile = {
      id: `cpt-google-${Date.now().toString().slice(-4)}`,
      name,
      emailOrPhone: email,
      vesselName: 'Sea Hunter II',
      vesselType: 'Deep Sea Trawler (42ft)',
      callSign: 'IND-GJ-8821',
      homeHarbor: 'Veraval Fishing Port, Gujarat',
      licenseNumber: 'IND-MF-2026-991',
      authProvider: 'google',
      authMethodLabel: 'Google OAuth 2.0 Account',
      loginAt: nowStr,
      sessionStatus: 'ACTIVE',
    };

    setCaptain(profile);
    setIsAuthenticated(true);
    saveToStorage(profile);
    return true;
  };

  const loginAsDemo = () => {
    const nowStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const demoProfile = {
      ...DEFAULT_DEMO_CAPTAIN,
      loginAt: nowStr,
    };
    setCaptain(demoProfile);
    setIsAuthenticated(true);
    saveToStorage(demoProfile);
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
        isAuthReady,
        captain,
        login,
        loginWithPhone,
        loginWithGoogle,
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
