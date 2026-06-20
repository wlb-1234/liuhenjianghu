import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { useFocusEffect, Link } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface FavoriteItem {
  id: number;
  item_id: number;
  item_type: string;
  created_at: string;
  article_id: number | null;
  article_title: string | null;
  article_cover: string | null;
  article_summary: string | null;
  article_views: number | null;
  video_id: number | null;
  video_title: string | null;
  video_cover: string | null;
  video_duration: string | null;
}

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'article' | 'video'>('all');
  const { session } = useAuth();

  const fetchFavorites = useCallback(async (isRefresh = false) => {
    if (!session?.user) return;
    
    try {
      const typeParam = activeTab === 'all' ? '' : `&type=${activeTab}`;
      const response = await fetch(
        `${API_BASE}/api/v1/favorites?page=1&limit=50${typeParam}`,
        {
          headers: {
            'x-session': session.access_token || '',
            'x-user-id': String(session.user.id)
          }
        }
      );
      const data = await response.json();
      
      if (data.success) {
        setFavorites(data.data || []);
      }
    } catch (error) {
      console.error('获取收藏失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session, activeTab]);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites(true);
    }, [fetchFavorites])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchFavorites(true);
  };

  const handleUnfavorite = async (itemId: number, itemType: string) => {
    try {
      await fetch(
        `${API_BASE}/api/v1/favorites/${itemId}?type=${itemType}`,
        {
          method: 'DELETE',
          headers: {
            'x-session': session?.access_token || '',
            'x-user-id': String(session?.user?.id)
          }
        }
      );
      setFavorites(prev => prev.filter(item => item.item_id !== itemId));
      Alert.alert('提示', '已取消收藏');
    } catch (error) {
      console.error('取消收藏失败:', error);
    }
  };

  const formatTime = (time: string) => {
    const date = new Date(time);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 86400000) return '今天';
    if (diff < 172800000) return '昨天';
    return `${Math.floor(diff / 86400000)}天前`;
  };

  const renderItem = ({ item }: { item: FavoriteItem }) => {
    const isArticle = item.item_type === 'article';
    const title = isArticle ? item.article_title : item.video_title;
    const cover = isArticle ? item.article_cover : item.video_cover;
    
    return (
      <View style={styles.card}>
        <Image 
          source={{ uri: cover || 'https://via.placeholder.com/120x80' }}
          style={styles.cover}
        />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{title || '未知内容'}</Text>
          <View style={styles.meta}>
            <View style={[styles.badge, isArticle ? styles.articleBadge : styles.videoBadge]}>
              <Text style={styles.badgeText}>{isArticle ? '文章' : '视频'}</Text>
            </View>
            <Text style={styles.time}>{formatTime(item.created_at)}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.removeBtn}
          onPress={() => handleUnfavorite(item.item_id, item.item_type)}
        >
          <Text style={styles.removeText}>取消</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>我的收藏</Text>
        </View>

        <View style={styles.tabs}>
          {(['all', 'article', 'video'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'all' ? '全部' : tab === 'article' ? '文章' : '视频'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        ) : favorites.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>暂无收藏</Text>
          </View>
        ) : (
          <FlatList
            data={favorites}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingBottom: 12
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 12,
    borderRadius: 16
  },
  activeTab: {
    backgroundColor: '#007AFF'
  },
  tabText: {
    fontSize: 14,
    color: '#666'
  },
  activeTabText: {
    color: '#FFF'
  },
  list: {
    padding: 12
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12
  },
  cover: {
    width: 80,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#EEE'
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between'
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    lineHeight: 20
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8
  },
  articleBadge: {
    backgroundColor: '#E8F5E9'
  },
  videoBadge: {
    backgroundColor: '#FFF3E0'
  },
  badgeText: {
    fontSize: 10,
    color: '#666'
  },
  time: {
    fontSize: 12,
    color: '#999'
  },
  removeBtn: {
    justifyContent: 'center',
    paddingLeft: 12
  },
  removeText: {
    fontSize: 14,
    color: '#FF3B30'
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 14,
    color: '#999'
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: '#999'
  }
});
