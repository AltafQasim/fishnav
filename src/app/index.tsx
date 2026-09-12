import React from 'react';
import { MarineMainScreen } from '@/components/marine-main-screen';

export default function IndexScreen() {
  // Default on app landing is the FULL INTERACTIVE MARINE MAP!
  return <MarineMainScreen initialTab={null} />;
}
