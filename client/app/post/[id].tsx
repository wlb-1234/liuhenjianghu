import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '@/services/api';
import { ShareButton } from '@/components/Share';

const { width } = Dimensions.get('window');

interface Post {
  id: number;
  title: string;
  content: string;
  images: string[];
  author: {
    id: number;
    name: string;
    avatar: string;
  };
  like_count: number;
  comment_count: number;
  created_at: string;
  is_liked?: boolean;
}

export default function SharedPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      const data = await apiRequest(`/posts/${id}`);
      setPost(data);
    } catch (error) {
      console.error('获取帖子失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    try {
      const res = await apiRequest(`/posts/${post.id}/like`, {
        method: 'POST',
      });
      setPost({
        ...post,
        is_liked: res.is_liked,
        like_count: res.is_liked ? post.like_count + 1 : post.like_count - 1,
      });
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#C9A96E" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>帖子不存在或已被删除</Text>
        <TouchableOpacity style={styles.homeBtn} onPress={() => window.location.href = '/'}>
          <Text style={styles.homeBtnText}>返回首页</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: '帖子详情',
          headerStyle: { backgroundColor: '#1a1a1a' },
          headerTintColor: '#C9A96E',
        }}
      />
      <ScrollView style={styles.container}>
        {/* 作者信息 */}
        <View style={styles.authorRow}>
          <Image
            source={{ uri: post.author.avatar || 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{post.author.name}</Text>
            <Text style={styles.postDate}>{formatDate(post.created_at)}</Text>
          </View>
        </View>

        {/* 标题 */}
        {post.title && <Text style={styles.title}>{post.title}</Text>}

        {/* 内容 */}
        <Text style={styles.content}>{post.content}</Text>

        {/* 图片 */}
        {post.images && post.images.length > 0 && (
          <View style={styles.images}>
            {post.images.map((img, index) => (
              <Image
                key={index}
                source={{ uri: img }}
                style={styles.image}
                resizeMode="cover"
              />
            ))}
          </View>
        )}

        {/* 操作栏 */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionItem} onPress={handleLike}>
            <Ionicons
              name={post.is_liked ? 'heart' : 'heart-outline'}
              size={24}
              color={post.is_liked ? '#E74C3C' : '#666'}
            />
            <Text style={styles.actionText}>{post.like_count}</Text>
          </TouchableOpacity>

          <View style={styles.actionItem}>
            <Ionicons name="chatbubble-outline" size={24} color="#666" />
            <Text style={styles.actionText}>{post.comment_count}</Text>
          </View>

          <ShareButton postId={post.id} title={post.title} size={24} color="#666" />
        </View>

        {/* 底部提示 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>来自「流痕江湖」</Text>
          <TouchableOpacity onPress={() => window.location.href = '/'}>
            <Text style={styles.openApp}>打开 App 查看更多</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  errorText: {
    color: '#999',
    fontSize: 16,
    marginBottom: 20,
  },
  homeBtn: {
    backgroundColor: '#C9A96E',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  homeBtnText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: '600',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorInfo: {
    marginLeft: 12,
  },
  authorName: {
    color: '#C9A96E',
    fontSize: 16,
    fontWeight: '600',
  },
  postDate: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    padding: 15,
    paddingBottom: 5,
  },
  content: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 26,
    padding: 15,
    paddingTop: 5,
  },
  images: {
    padding: 15,
    paddingTop: 5,
  },
  image: {
    width: width - 30,
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    gap: 30,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    color: '#666',
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    padding: 30,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    marginTop: 20,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 10,
  },
  openApp: {
    color: '#C9A96E',
    fontSize: 16,
    fontWeight: '600',
  },
});
