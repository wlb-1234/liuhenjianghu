import React from 'react';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import { useSafeRouter } from '@/hooks/useSafeRouter';

interface Props {
  onUpgrade: () => void;
  onLogout: () => void;
}

export default function ProfileTab({ onUpgrade, onLogout }: Props) {
  const router = useSafeRouter();

  const handleSettings = () => {
    router.push('/settings');
  };

  return (
    <ProfileScreen onUpgrade={onUpgrade} onLogout={onLogout} onSettings={handleSettings} />
  );
}
