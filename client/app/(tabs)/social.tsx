import React, { useState } from 'react';
import SocialScreen from '@/screens/social/SocialScreen';

interface Props {
  onChatPress: (userId: number, userName: string, userAvatar: string | null) => void;
  onUserPress: (userId: number) => void;
}

export default function SocialTab({ onChatPress, onUserPress }: Props) {
  return (
    <SocialScreen
      onChatPress={(userId) => onChatPress(userId, '', null)}
      onUserPress={onUserPress}
    />
  );
}
