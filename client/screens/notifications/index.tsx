/**
 * 消息通知页面
 * 用户查看和管理消息通知
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeRouter } from '@/hooks/useSafeRouter';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'https://liuhenjianghu-production.up.railway.app';

interface Notification {
  id: number;
  type: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const messageTypeIcons: Record<string, string> = {
  system: '📢',
  comment: '💬',
  like: '❤️',
  follow: '👤',
  reply: '↩️',
  achievement: '🏆',
  activity: '🎉',
  check_in: '📅',
};

const messageTypeLabels: Record<string, string> = {
  system: '系统通知',
  comment: '评论',
  like: '点赞',
  follow: '关注',
  reply: '回复',
  achievement: '成就',
  activity: '活动',
  check_in: '签到',
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { session } = useAuth();
  const router = useSafeRouter();

  const fetchNotifications = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
    if (!session?.token) return;

    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/notifications?page=${pageNum}&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${session.token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        if (refresh) {
          setNotifications(data.data.notifications);
        } else {
          setNotifications(prev => [...prev, ...data.data.notifications]);
        }
        setUnreadCount(data.data.unreadCount);
        setHasMore(data.data.notifications.length === 20);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('获取通知失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.token]);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications(1, true);
    }, [fetchNotifications])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    if (!session?.token) return;

    try {
      await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/notifications/${id}/read`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.token}`,
          },
        }
      );

      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const handleMarkAllRead = async () => {
    if (!session?.token) return;

    try {
      await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/notifications/read-all`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.token}`,
          },
        }
      );

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('标记全部已读失败:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!session?.token) return;

    try {
      await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/notifications/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.token}`,
          },
        }
      );

      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('删除通知失败:', error);
    }
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.is_read && styles.unreadItem,
      ]}
      onPress={() => handleMarkAsRead(item.id)}
      onLongPress={() => handleDelete(item.id)}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>
          {messageTypeIcons[item.type] || '📬'}
        </Text>
        {!item.is_read && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, !item.is_read && styles.unreadTitle]}>
            {item.title}
          </Text>
          <Text style={styles.typeTag}>
            {messageTypeLabels[item.type] || item.type}
          </Text>
        </View>
        <Text style={styles.content} numberOfLines={2}>
          {item.content}
        </Text>
        <Text style={styles.time}>{formatTime(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyText}>暂无消息通知</Text>
      <Text style={styles.emptySubtext}>收到评论、点赞等会有通知哦</Text>
    </View>
  );

  if (loading && notifications.length === 0) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>消息通知</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllRead}>全部已读</Text>
          </TouchableOpacity>
        )}
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadText}>有 {unreadCount} 条未读消息</Text>
        </View>
      )}

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  markAllRead: {
    fontSize: 14,
    color: '#6366F1',
  },
  unreadBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  unreadText: {
    fontSize: 13,
    color: '#D97706',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  unreadItem: {
    backgroundColor: '#F0F9FF',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  icon: {
    fontSize: 20,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#fff',
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    color: '#666',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  typeTag: {
    fontSize: 11,
    color: '#999',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  content: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#999',
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
  emptyText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});
