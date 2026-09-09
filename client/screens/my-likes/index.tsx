import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import api from '@/services/api';

export default function MyLikesScreen() {
  const router = useSafeRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      let cancelled = false;
      (async () => {
        try {
          // 服务端文件：server/src/routes/posts.ts
          // 接口：GET /api/v1/posts/my-liked  （鉴权，返回我点赞过的帖子）
          const data = await api.getMyLikedPosts();
          if (cancelled) return;
          setPosts(data.posts || []);
        } catch (error) {
          console.error('获取我的点赞失败:', error);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#C9A96E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: '我的点赞',
          headerShown: true,
          headerStyle: { backgroundColor: '#1a1a1a' },
          headerTintColor: '#C9A96E',
        }}
      />
      <ScrollView contentContainerStyle={styles.list}>
        {posts.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>暂无点赞</Text>
          </View>
        ) : (
          posts.map((p: any) => (
            <TouchableOpacity
              key={p.id}
              style={styles.card}
              onPress={() => router.push(`/post-detail/${p.id}`)}
            >
              <Text style={styles.poster}>{p.author_nickname || '我'}</Text>
              <Text style={styles.content}>{p.content}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>赞 {p.like_count}</Text>
                <Text style={styles.metaText}>评 {p.comment_count}</Text>
                <Text style={styles.metaDate}>
                  {new Date(p.created_at).toLocaleDateString('zh-CN')}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  list: {
    padding: 12,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  poster: {
    color: '#C9A96E',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  content: {
    color: '#ddd',
    fontSize: 15,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 16,
  },
  metaText: {
    color: '#888',
    fontSize: 13,
  },
  metaDate: {
    color: '#666',
    fontSize: 12,
    marginLeft: 'auto',
  },
  empty: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
});