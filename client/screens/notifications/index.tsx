import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Screen } from '@/components/Screen';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface Notification {
  id: number;
  title: string;
  content: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const { session } = useAuth();

  const fetchNotifications = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (!session?.user) return;
    
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/notifications?page=${pageNum}&limit=20`,
        {
          headers: {
            'x-session': session.access_token || '',
            'x-user-id': String(session.user.id)
          }
        }
      );
      const data = await response.json();
      
      if (data.success) {
        if (isRefresh) {
          setNotifications(data.data.list);
        } else {
          setNotifications(prev => [...prev, ...data.data.list]);
        }
        setTotal(data.data.total);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('获取消息失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications(1, true);
    }, [fetchNotifications])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(1, true);
  };

  const markAsRead = async (id: number) => {
    try {
      await fetch(
        `${API_BASE}/api/v1/notifications/${id}/read`,
        {
          method: 'POST',
          headers: {
            'x-session': session?.access_token || '',
            'x-user-id': String(session?.user?.id)
          }
        }
      );
      setNotifications(prev =>
        prev.map(item =>
          item.id === id ? { ...item, is_read: true } : item
        )
      );
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(
        `${API_BASE}/api/v1/notifications/read-all`,
        {
          method: 'POST',
          headers: {
            'x-session': session?.access_token || '',
            'x-user-id': String(session?.user?.id)
          }
        }
      );
      setNotifications(prev => prev.map(item => ({ ...item, is_read: true })));
    } catch (error) {
      console.error('标记全部已读失败:', error);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      system: '系统',
      order: '订单',
      activity: '活动'
    };
    return labels[type] || '通知';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      system: '#666',
      order: '#007AFF',
      activity: '#FF9500'
    };
    return colors[type] || '#666';
  };

  const formatTime = (time: string) => {
    const date = new Date(time);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${Math.floor(diff / 86400000)}天前`;
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.item, !item.is_read && styles.unread]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: getTypeColor(item.type) }]}>
          <Text style={styles.badgeText}>{getTypeLabel(item.type)}</Text>
        </View>
        <Text style={styles.time}>{formatTime(item.created_at)}</Text>
      </View>
      <Text style={[styles.title, !item.is_read && styles.unreadTitle]}>{item.title}</Text>
      <Text style={styles.content} numberOfLines={2}>{item.content}</Text>
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>消息通知</Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead}>
              <Text style={styles.markAllText}>全部已读</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>暂无消息</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
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
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  markAllText: {
    fontSize: 14,
    color: '#007AFF'
  },
  list: {
    padding: 12
  },
  item: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  },
  unread: {
    backgroundColor: '#F0F7FF'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  badgeText: {
    fontSize: 12,
    color: '#FFF'
  },
  time: {
    fontSize: 12,
    color: '#999'
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6
  },
  unreadTitle: {
    fontWeight: '600'
  },
  content: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20
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
