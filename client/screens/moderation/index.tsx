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

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      post: '#3B82F6',
      comment: '#10B981',
      report: '#EF4444',
    };
    return colors[type] || '#6B7280';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#F59E0B',
      approved: '#10B981',
      rejected: '#EF4444',
    };
    return colors[status] || '#6B7280';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '待审核',
      approved: '已通过',
      rejected: '已拒绝',
    };
    return labels[status] || status;
  };

  return (
    <Screen>
      <ScrollView
        className="flex-1 bg-gray-50"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 统计卡片 */}
        <View className="p-4">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
              <Text className="text-2xl font-bold text-yellow-600">{stats.pending}</Text>
              <Text className="text-sm text-yellow-700">待审核</Text>
            </View>
            <View className="flex-1 bg-green-50 rounded-2xl p-4 border border-green-200">
              <Text className="text-2xl font-bold text-green-600">{stats.approved_today}</Text>
              <Text className="text-sm text-green-700">今日通过</Text>
            </View>
            <View className="flex-1 bg-red-50 rounded-2xl p-4 border border-red-200">
              <Text className="text-2xl font-bold text-red-600">{stats.rejected_today}</Text>
              <Text className="text-sm text-red-700">今日拒绝</Text>
            </View>
          </View>
        </View>

        {/* 筛选标签 */}
        <View className="px-4 pb-3">
          <View className="flex-row gap-2">
            {['pending', 'approved', 'rejected'].map((status) => (
              <TouchableOpacity
                key={status}
                className={`px-4 py-2 rounded-full ${
                  filter === status ? 'bg-blue-500' : 'bg-gray-200'
                }`}
                onPress={() => setFilter(status)}
              >
                <Text
                  className={`text-sm font-medium ${
                    filter === status ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {getStatusLabel(status)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 审核列表 */}
        <View className="px-4 pb-6">
          {queue.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center">
              <Text className="text-gray-400 text-lg">暂无待审核内容</Text>
            </View>
          ) : (
            queue.map((item) => (
              <View
                key={item.id}
                className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
              >
                {/* 头部 */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <View
                      className="px-2 py-1 rounded-md"
                      style={{ backgroundColor: getTypeColor(item.type) + '20' }}
                    >
                      <Text
                        className="text-xs font-medium"
                        style={{ color: getTypeColor(item.type) }}
                      >
                        {getTypeLabel(item.type)}
                      </Text>
                    </View>
                    <View
                      className="px-2 py-1 rounded-md"
                      style={{ backgroundColor: getStatusColor(item.status) + '20' }}
                    >
                      <Text
                        className="text-xs font-medium"
                        style={{ color: getStatusColor(item.status) }}
                      >
                        {getStatusLabel(item.status)}
                      </Text>
                    </View>
                    {item.priority > 0 && (
                      <View className="bg-red-100 px-2 py-1 rounded-md">
                        <Text className="text-xs font-medium text-red-600">高优先级</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs text-gray-400">
                    #{item.id}
                  </Text>
                </View>

                {/* 内容 */}
                {item.content && (
                  <Text className="text-gray-800 text-base mb-2 line-clamp-3">
                    {item.content}
                  </Text>
                )}

                {/* 原因 */}
                {item.reason && (
                  <View className="bg-red-50 rounded-lg p-2 mb-3">
                    <Text className="text-xs text-red-600">
                      <Text className="font-medium">举报原因：</Text>
                      {item.reason}
                    </Text>
                  </View>
                )}

                {/* 时间 */}
                <Text className="text-xs text-gray-400 mb-3">
                  提交时间：{new Date(item.created_at).toLocaleString('zh-CN')}
                </Text>

                {/* 操作按钮 */}
                {item.status === 'pending' && (
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      className="flex-1 bg-green-500 rounded-xl py-3 items-center"
                      onPress={() => handleApprove(item.id)}
                      disabled={actionLoading === item.id}
                    >
                      <Text className="text-white font-medium">
                        {actionLoading === item.id ? '处理中...' : '通过'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1 bg-red-500 rounded-xl py-3 items-center"
                      onPress={() => handleReject(item.id)}
                      disabled={actionLoading === item.id}
                    >
                      <Text className="text-white font-medium'>
                        {actionLoading === item.id ? '处理中...' : '拒绝'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
