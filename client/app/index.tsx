import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useRootNavigationState, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import HomeTab from './(tabs)/index';
import SocialTab from './(tabs)/social';
import ProfileTab from './(tabs)/profile';
import { ChatScreenProps, default as ChatPage } from '@/screens/social/ChatScreen';
import PostDetailPage from './post-detail';
import LoginScreen from '@/screens/auth/LoginScreen';
import RegisterScreen from '@/screens/auth/RegisterScreen';

type MainTab = 'home' | 'social' | 'profile';

export default function MainIndex() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useSafeRouter();
  const segments = useSegments();
  const rootState = useRootNavigationState();

  const [currentTab, setCurrentTab] = useState<MainTab>('home');
  const [showChat, setShowChat] = useState(false);
  const [chatParams, setChatParams] = useState<{ userId: number; userName: string; userAvatar: string | null }>({ userId: 0, userName: '', userAvatar: null });
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [postDetailId, setPostDetailId] = useState<number>(0);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // 路由控制
  useEffect(() => {
    if (!rootState?.key || isLoading) return;

    const inAuthRoute = segments.includes('login') || segments.includes('register');

    if (!isAuthenticated && !inAuthRoute) {
      // 延迟设置登录弹窗，避免在 effect 中同步调用 setState
      const timer = setTimeout(() => setShowLogin(true), 0);
      return () => clearTimeout(timer);
    } else if (isAuthenticated && inAuthRoute) {
      router.replace('/');
    }
  }, [rootState?.key, isAuthenticated, isLoading, segments]);

  const handleLoginSuccess = () => {
    setShowLogin(false);
    setShowRegister(false);
  };

  const handleLogout = () => {
    setShowLogin(true);
  };

  const handleChatPress = (userId: number, userName: string, userAvatar: string | null) => {
    setChatParams({ userId, userName, userAvatar });
    setShowChat(true);
  };

  const handleChatClose = () => {
    setShowChat(false);
  };

  const handlePostPress = (postId: number) => {
    setPostDetailId(postId);
    setShowPostDetail(true);
  };

  const handlePostDetailClose = () => {
    setShowPostDetail(false);
  };

  const handleUserPress = (userId: number) => {
    // 可以跳转到用户详情页
    console.log('User pressed:', userId);
  };

  if (isLoading || !rootState?.key) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B4513" />
      </View>
    );
  }

  // 未登录状态
  if (!isAuthenticated) {
    if (showRegister) {
      return (
        <RegisterScreen
          onBack={() => setShowRegister(false)}
          onSwitchToLogin={() => setShowRegister(false)}
        />
      );
    }
    return (
      <LoginScreen
        onSwitchToRegister={() => setShowRegister(true)}
      />
    );
  }

  // 主页面内容
  const renderMainContent = () => {
    switch (currentTab) {
      case 'home':
        return <HomeTab onPostPress={handlePostPress} />;
      case 'social':
        return <SocialTab onChatPress={handleChatPress} onUserPress={handleUserPress} />;
      case 'profile':
        return <ProfileTab onLogout={handleLogout} />;
      default:
        return <HomeTab onPostPress={handlePostPress} />;
    }
  };

  return (
    <View style={styles.container}>
      {renderMainContent()}

      {/* 底部 Tab 切换 */}
      <View style={styles.tabBar}>
        <View
          style={[
            styles.tabItem,
            currentTab === 'home' && styles.tabItemActive,
          ]}
          onTouchEnd={() => setCurrentTab('home')}
        >
          <View style={styles.tabIcon}>
            <View style={currentTab === 'home' ? styles.homeIconActive : styles.homeIcon} />
          </View>
        </View>
        <View
          style={[
            styles.tabItem,
            currentTab === 'social' && styles.tabItemActive,
          ]}
          onTouchEnd={() => setCurrentTab('social')}
        >
          <View style={styles.tabIcon}>
            <View style={currentTab === 'social' ? styles.socialIconActive : styles.socialIcon} />
          </View>
        </View>
        <View
          style={[
            styles.tabItem,
            currentTab === 'profile' && styles.tabItemActive,
          ]}
          onTouchEnd={() => setCurrentTab('profile')}
        >
          <View style={styles.tabIcon}>
            <View style={currentTab === 'profile' ? styles.profileIconActive : styles.profileIcon} />
          </View>
        </View>
      </View>

      {/* 聊天页面 */}
      {showChat && chatParams.userId > 0 && (
        <Modal visible={showChat} animationType="slide">
          <ChatPage
            userId={chatParams.userId}
            userName={chatParams.userName}
            userAvatar={chatParams.userAvatar}
            onBack={handleChatClose}
          />
        </Modal>
      )}

      {/* 帖子详情 */}
      {showPostDetail && postDetailId > 0 && (
        <Modal visible={showPostDetail} animationType="slide">
          <PostDetailPage
            postId={postDetailId}
            onBack={handlePostDetailClose}
            onUserPress={handleUserPress}
          />
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F0E6',
  },
  tabBar: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FDFBF7',
    borderTopWidth: 1,
    borderTopColor: '#E8E0D0',
    paddingBottom: 20,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabItemActive: {},
  tabIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#A89F91',
  },
  homeIconActive: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#8B4513',
    borderWidth: 2,
    borderColor: '#8B4513',
  },
  socialIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#A89F91',
  },
  socialIconActive: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#8B4513',
    borderWidth: 2,
    borderColor: '#8B4513',
  },
  profileIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#A89F91',
  },
  profileIconActive: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#8B4513',
    borderWidth: 2,
    borderColor: '#8B4513',
  },
});
