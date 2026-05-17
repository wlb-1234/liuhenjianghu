import React from 'react';
import ProfileScreen from '@/screens/profile/ProfileScreen';

interface Props {
  onUpgrade: () => void;
  onLogout: () => void;
}

export default function ProfileTab({ onUpgrade, onLogout }: Props) {
  return (
    <ProfileScreen onUpgrade={onUpgrade} onLogout={onLogout} />
  );
}
