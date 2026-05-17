import React from 'react';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import { useSafeRouter } from '@/hooks/useSafeRouter';

interface Props {
  onLogout: () => void;
}

export default function ProfileTab({ onLogout }: Props) {
  const router = useSafeRouter();

  const handleUpgrade = () => {
    router.push('/vip');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  return (
    <ProfileScreen onUpgrade={handleUpgrade} onLogout={onLogout} onSettings={handleSettings} />
  );
}
