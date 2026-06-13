import React from 'react';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import { useSafeRouter } from '@/hooks/useSafeRouter';

export default function ProfileTab() {
  const router = useSafeRouter();

  const handleUpgrade = () => {
    router.push('/vip');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  return (
    <ProfileScreen onUpgrade={handleUpgrade} onSettings={handleSettings} />
  );
}
