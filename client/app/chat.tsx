import React, { useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import ChatScreen from '@/screens/social/ChatScreen';
import { useSafeSearchParams, useSafeRouter } from '@/hooks/useSafeRouter';

export default function ChatPage() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ userId: string; userName?: string; userAvatar?: string }>();
  
  const userId = parseInt(params.userId || '0', 10);
  const userName = params.userName || '江湖好友';
  const userAvatar = params.userAvatar || null;

  const handleBack = () => {
    router.back();
  };

  if (!userId) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ChatScreen
        userId={userId}
        userName={userName}
        userAvatar={userAvatar}
        onBack={handleBack}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E6',
  },
});
