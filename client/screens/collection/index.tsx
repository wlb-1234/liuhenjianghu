import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';

interface CollectionItem {
  collection_id: number;
  collected_at: string;
  post_id: number;
  content: string;
  images: string[];
  like_count: number;
  comment_count: number;
  post_created_at: string;
  user_id: number;
  nickname: string;
  avatar_url: string;
}

export default function CollectionScreen() {
  const { token } = useAuth();
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchCollections = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (!token) return;
    
    try {
      const response = await apiService.getCollections(pageNum, 20);
      if (isRefresh) {
        setCollections(response.data);
      } else {
        setCollections(prev => [...prev, ...response.data]);
      }
      setHasMore(pageNum < response.pagination.totalPages);
      setPage(pageNum);
    } catch (error: any) {
      Alert.alert('错误', error.message || '获取收藏列表失败');
    }
  }, [token]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCollections(1, true);
    setRefreshing(false);
  }, [fetchCollections]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      setLoading(true);
      fetchCollections(page + 1).finally(() => setLoading(false));
    }
  }, [loading, hasMore, page, fetchCollections]);

  const handleRemove = useCallback(async (postId: number) => {
    Alert.alert('提示', '确定取消收藏吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: async () => {
          try {
            await apiService.removeCollection(postId);
            setCollections(prev => prev.filter(item => item.post_id !== postId));
          } catch (error: any) {
            Alert.alert('错误', error.message || '取消收藏失败');
          }
        },
      },
    ]);
  }, []);

  const renderItem = ({ item }: { item: CollectionItem }) => {
    const images = item.images ? JSON.parse(item.images) : [];
    
    return (
      <View style={styles.card}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: item.avatar_url || 'https://picsum.photos/100' }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.nickname}>{item.nickname}</Text>
            <Text style={styles.time}>
              {new Date(item.post_created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        
        <Text style={styles.content} numberOfLines={3}>
          {item.content}
        </Text>
        
        {images.length > 0 && (
          <View style={styles.imagesGrid}>
            {images.slice(0, 3).map((img: string, index: number) => (
              <Image
                key={index}
                source={{ uri: img }}
                style={styles.image}
              />
            ))}
          </View>
        )}
        
        <View style={styles.footer}>
          <View style={styles.stats}>
            <Text style={styles.statText}>❤️ {item.like_count}</Text>
            <Text style={styles.statText}>💬 {item.comment_count}</Text>
          </View>
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => handleRemove(item.post_id)}
          >
            <Text style={styles.removeBtnText}>取消收藏</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📚</Text>
      <Text style={styles.emptyTitle}>暂无收藏</Text>
      <Text style={styles.emptyDesc}>收藏喜欢的帖子，随时查看</Text>
    </View>
  );

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>我的收藏</Text>
        <Text style={styles.count}>{collections.length} 条收藏</Text>
      </View>
      
      <FlatList
        data={collections}
        keyExtractor={(item) => item.collection_id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  count: {
    fontSize: 14,
    color: '#888',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  nickname: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  time: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  content: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 22,
    marginBottom: 12,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 12,
  },
  stats: {
    flexDirection: 'row',
  },
  statText: {
    fontSize: 14,
    color: '#888',
    marginRight: 16,
  },
  removeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  removeBtnText: {
    fontSize: 13,
    color: '#FFD700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#888',
  },
});
