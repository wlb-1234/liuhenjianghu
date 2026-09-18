import React from 'react';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import SocialScreen from '@/screens/social/SocialScreen';

export default function SocialTab() {
  const router = useSafeRouter();

  const handleChat = (userId: number) => {
    router.push('/chat', { userId, userName: '', userAvatar: null });
  };

  return (
    <SocialScreen
      onChatPress={handleChat}
      onUserPress={(userId: number) => handleChat(userId)}
    />
  );
}