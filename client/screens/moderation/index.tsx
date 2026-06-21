/**
 * 审核管理页面
 * 管理员审核内容
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import Screen from '@/components/Screen';

interface ReviewItem {
  id: number;
  type: 'post' | 'comment' | 'report';
  target_id: number;
  content: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: number;
  created_at: string;
}

interface Stats {
  pending: number;
  approved_today: number;
  rejected_today: number;
}

export default function ModerationScreen() {
  const [queue, setQueue] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, approved_today: 0, rejected_today: 0 });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('pending');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/moderation/queue?status=${filter}&limit=50`
      );
      const data = await res.json();
      if (data.success) {
        setQueue(data.data.items);
      }
    } catch (error) {
      console.error('获取审核队列失败:', error);
    }
  }, [filter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/moderation/stats`
      );
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('获取审核统计失败:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    await Promise.all([fetchQueue(), fetchStats()]);
  }, [fetchQueue, fetchStats]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleApprove = async (id: number) => {
    Alert.alert('确认通过', '确定要通过这条内容吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '通过',
        onPress: async () => {
          setActionLoading(id);
          try {
            const res = await fetch(
              `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/moderation/approve/${id}`,
              { method: 'PUT' }
            );
            const data = await res.json();
            if (data.success) {
              Alert.alert('成功', '审核已通过');
              fetchData();
            } else {
              Alert.alert('失败', data.message);
            }
          } catch (error) {
            Alert.alert('错误', '操作失败');
          }
          setActionLoading(null);
        },
      },
    ]);
  };

  const handleReject = async (id: number) => {
    Alert.alert('确认拒绝', '确定要拒绝这条内容吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '拒绝',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(id);
          try {
            const res = await fetch(
              `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/moderation/reject/${id}`,
              { method: 'PUT' }
            );
            const data = await res.json();
            if (data.success) {
              Alert.alert('成功', '内容已被删除');
              fetchData();
            } else {
              Alert.alert('失败', data.message);
            }
          } catch (error) {
            Alert.alert('错误', '操作失败');
          }
          setActionLoading(null);
        },
      },
    ]);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      post: '帖子',
      comment: '评论',
      report: '举报',
    };
    return labels[type] || type;
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 3) return '#FF4D4F';
    if (priority >= 2) return '#FAAD14';
    return '#52C41A';
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>内容审核</Text>
      </View>

      {/* 统计卡片 */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.pending}</Text>
          <Text style={styles.statLabel}>待审核</Text>
        </View>
        <View style={[styles.statCard, styles.statCardGreen]}>
          <Text style={[styles.statNumber, styles.textWhite]}>{stats.approved_today}</Text>
          <Text style={[styles.statLabel, styles.textWhite]}>今日通过</Text>
        </View>
        <View style={[styles.statCard, styles.statCardRed]}>
          <Text style={[styles.statNumber, styles.textWhite]}>{stats.rejected_today}</Text>
          <Text style={[styles.statLabel, styles.textWhite]}>今日拒绝</Text>
        </View>
      </View>

      {/* 筛选 */}
      <View style={styles.filterContainer}>
        {['pending', 'approved', 'rejected'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterBtn, filter === status && styles.filterBtnActive]}
            onPress={() => setFilter(status)}
          >
            <Text style={[styles.filterText, filter === status && styles.filterTextActive]}>
              {status === 'pending' ? '待审核' : status === 'approved' ? '已通过' : '已拒绝'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {queue.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无待审核内容</Text>
          </View>
        ) : (
          queue.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.tagRow}>
                  <View style={[styles.typeTag, { backgroundColor: '#E6F7FF' }]}>
                    <Text style={styles.typeTagText}>{getTypeLabel(item.type)}</Text>
                  </View>
                  <View style={[styles.priorityTag, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
                    <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                      优先级 {item.priority}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.contentText} numberOfLines={3}>
                {item.content}
              </Text>

              {item.reason && (
                <View style={styles.reasonContainer}>
                  <Text style={styles.reasonLabel}>举报原因：</Text>
                  <Text style={styles.reasonText}>{item.reason}</Text>
                </View>
              )}

              <Text style={styles.timeText}>
                提交时间：{new Date(item.created_at).toLocaleString('zh-CN')}
              </Text>

              {item.status === 'pending' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => handleApprove(item.id)}
                    disabled={actionLoading === item.id}
                  >
                    <Text style={styles.approveBtnText}>
                      {actionLoading === item.id ? '处理中...' : '通过'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleReject(item.id)}
                    disabled={actionLoading === item.id}
                  >
                    <Text style={styles.rejectBtnText}>
                      {actionLoading === item.id ? '处理中...' : '拒绝'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  statCardGreen: {
    backgroundColor: '#52C41A',
  },
  statCardRed: {
    backgroundColor: '#FF4D4F',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  textWhite: {
    color: '#fff',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
  },
  filterBtnActive: {
    backgroundColor: '#C9A96E',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  typeTagText: {
    fontSize: 12,
    color: '#1890FF',
  },
  priorityTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 12,
  },
  contentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  reasonContainer: {
    backgroundColor: '#FFF2F0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  reasonLabel: {
    fontSize: 12,
    color: '#FF4D4F',
    fontWeight: '500',
  },
  reasonText: {
    fontSize: 14,
    color: '#FF4D4F',
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: '#52C41A',
  },
  approveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  rejectBtn: {
    backgroundColor: '#FF4D4F',
  },
  rejectBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
