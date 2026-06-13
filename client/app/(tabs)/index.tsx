import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import HomeScreen from '@/screens/home/HomeScreen';
import PostScreen from '@/screens/post/PostScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeRouter } from '@/hooks/useSafeRouter';

interface Post {
  id: number;
  user_id: number;
  content: string;
  images: string[];
  region_code: string;
  like_count: number;
  comment_count: number;
  is_pinned: boolean;
  is_liked: boolean;
  expire_at: string;
  created_at: string;
  nickname: string;
  avatar: string | null;
  member_level: number;
}

interface Props {
  onPostPress: (postId: number) => void;
}

export default function HomeTab({ onPostPress }: Props) {
  const { isAuthenticated } = useAuth();
  const router = useSafeRouter();
  const [showPostModal, setShowPostModal] = useState(false);

  const handlePostSuccess = () => {
    setShowPostModal(false);
  };

  const handleOpenPost = () => {
    if (!isAuthenticated) {
      Alert.alert('提示', '请先登录后再发布留言', [
        { text: '取消', style: 'cancel' },
        { text: '去登录', onPress: () => {
          router.push('/login');
        }}
      ]);
      return;
    }
    setShowPostModal(true);
  };

  return (
    <View style={styles.container}>
      <HomeScreen onPostPress={(post) => onPostPress(post.id)} />
      
      {/* 发布按钮 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleOpenPost}
        activeOpacity={0.8}
      >
        <View style={styles.fabInner}>
          <View style={styles.fabIcon}>
            <View style={styles.fabIconLine} />
            <View style={styles.fabIconLine} />
          </View>
        </View>
      </TouchableOpacity>

      {/* 发布Modal */}
      <Modal
        visible={showPostModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPostModal(false)}
      >
        <PostScreen
          onClose={() => setShowPostModal(false)}
          onSuccess={handlePostSuccess}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8B4513',
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIcon: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  fabIconLine: {
    width: 24,
    height: 3,
    backgroundColor: '#FDFBF7',
    borderRadius: 2,
  },
});
