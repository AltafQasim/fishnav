import React, { useState } from 'react';

import { MarineLoginScreen } from '@/components/auth/marine-login-screen';
import { MarineSplashScreen } from '@/components/auth/marine-splash-screen';
import { MarineMainScreen } from '@/components/marine-main-screen';
import { useAuth } from '@/context/auth-context';

export default function IndexScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const { isAuthenticated } = useAuth();

  // 1. Show the high-tech Marine Radar Splash Screen first
  if (showSplash) {
    return <MarineSplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // 2. If not authenticated, show the Marine Captain Login Screen
  if (!isAuthenticated) {
    return <MarineLoginScreen onLoginSuccess={() => {}} />;
  }

  // 3. Authenticated: Full Interactive Marine Chartplotter & Cockpit
  return <MarineMainScreen initialTab={null} />;
}
