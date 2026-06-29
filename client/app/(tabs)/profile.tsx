import React from 'react';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileTab() {
  const router = useSafeRouter();
  const { logout } = useAuth();

  const handleUpgrade = () => {
    router.push('/vip');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <ProfileScreen 
      onUpgrade={handleUpgrade} 
      onSettings={handleSettings}
      onLogout={handleLogout}
    />
  );
}
