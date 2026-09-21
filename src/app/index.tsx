import React from 'react';

import { MarineMainScreen } from '@/components/marine-main-screen';

export default function IndexScreen() {
  // Authentication & Splash gating is handled globally by ProtectedAuthGate in _layout.tsx
  return <MarineMainScreen initialTab={null} />;
}
