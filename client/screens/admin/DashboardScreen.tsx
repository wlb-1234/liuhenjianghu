import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import adminService, { AdminStats } from '@/services/adminService';

export default function AdminDashboardScreen() {
  const router = useSafeRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminService.getStats();
      if (res.success && res.data) {
        setStats(res.data);
      } else if (res.error) {
        Alert.alert('错误', res.error);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, [fetchStats]);

  const handleLogout = async () => {
    Alert.alert(
      '确认退出',
      '确定要退出管理后台吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            await adminService.logout();
            router.replace('/admin');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center bg-stone-900">
          <ActivityIndicator size="large" color="#d97706" />
          <Text className="text-stone-400 mt-3">加载中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="flex-1 bg-stone-900">
        {/* 顶部导航 */}
        <View className="bg-stone-800 px-4 py-4 border-b border-stone-700">
          <View className="flex-row justify-between items-center">
            <Text className="text-xl font-bold text-amber-500">流痕江湖 · 管理后台</Text>
            <TouchableOpacity onPress={handleLogout} className="px-3 py-1">
              <Text className="text-stone-400">退出</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          className="flex-1 p-4"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#d97706"
            />
          }
        >
          {/* 统计卡片 */}
          <View className="mb-4">
            <Text className="text-lg font-bold text-stone-200 mb-3">数据概览</Text>
            <View className="flex-row flex-wrap -mx-2">
              {/* 用户统计 */}
              <View className="w-1/2 px-2 mb-4">
                <View className="bg-stone-800 rounded-xl p-4 border border-stone-700">
                  <Text className="text-stone-400 text-sm">用户总数</Text>
                  <Text className="text-3xl font-bold text-amber-500 mt-1">
                    {stats?.users.total || 0}
                  </Text>
                  <View className="flex-row mt-2">
                    <Text className="text-stone-500 text-xs">今日 +{stats?.users.today || 0}</Text>
                    <Text className="text-stone-500 text-xs ml-4">本月 +{stats?.users.thisMonth || 0}</Text>
                  </View>
                </View>
              </View>

              {/* 帖子统计 */}
              <View className="w-1/2 px-2 mb-4">
                <View className="bg-stone-800 rounded-xl p-4 border border-stone-700">
                  <Text className="text-stone-400 text-sm">帖子总数</Text>
                  <Text className="text-3xl font-bold text-emerald-500 mt-1">
                    {stats?.posts.total || 0}
                  </Text>
                  <View className="flex-row mt-2">
                    <Text className="text-stone-500 text-xs">今日 +{stats?.posts.today || 0}</Text>
                  </View>
                </View>
              </View>

              {/* 活跃用户 */}
              <View className="w-1/2 px-2 mb-4">
                <View className="bg-stone-800 rounded-xl p-4 border border-stone-700">
                  <Text className="text-stone-400 text-sm">活跃用户（7日）</Text>
                  <Text className="text-3xl font-bold text-blue-500 mt-1">
                    {stats?.users.active || 0}
                  </Text>
                  <View className="flex-row mt-2">
                    <Text className="text-stone-500 text-xs">今日活跃 {stats?.users.activeToday || 0}</Text>
                  </View>
                </View>
              </View>

              {/* 收入统计 */}
              <View className="w-1/2 px-2 mb-4">
                <View className="bg-stone-800 rounded-xl p-4 border border-stone-700">
                  <Text className="text-stone-400 text-sm">总收入</Text>
                  <Text className="text-3xl font-bold text-rose-500 mt-1">
                    ¥{(stats?.earnings.total || 0).toFixed(2)}
                  </Text>
                  <View className="flex-row mt-2">
                    <Text className="text-stone-500 text-xs">本月 ¥{(stats?.earnings.thisMonth || 0).toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* 会员分布 */}
          <View className="mb-4">
            <Text className="text-lg font-bold text-stone-200 mb-3">会员分布</Text>
            <View className="bg-stone-800 rounded-xl p-4 border border-stone-700">
              {stats?.memberDistribution.map((item, index) => (
                <View key={index} className="flex-row justify-between items-center py-2 border-b border-stone-700 last:border-b-0">
                  <Text className="text-stone-300">{item.name}</Text>
                  <View className="flex-row items-center">
                    <Text className="text-amber-500 font-bold mr-2">{item.user_count}</Text>
                    <Text className="text-stone-500 text-sm">人</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 快捷入口 */}
          <View className="mb-4">
            <Text className="text-lg font-bold text-stone-200 mb-3">快捷入口</Text>
            <View className="flex-row -mx-2">
              <TouchableOpacity
                className="flex-1 mx-2 bg-stone-800 rounded-xl p-4 border border-stone-700"
                onPress={() => router.push('/admin/users')}
              >
                <Text className="text-2xl mb-2">👥</Text>
                <Text className="text-stone-200 font-medium">用户管理</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 mx-2 bg-stone-800 rounded-xl p-4 border border-stone-700"
                onPress={() => router.push('/admin/members')}
              >
                <Text className="text-2xl mb-2">👑</Text>
                <Text className="text-stone-200 font-medium">会员等级</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row -mx-2 mt-4">
              <TouchableOpacity
                className="flex-1 mx-2 bg-stone-800 rounded-xl p-4 border border-stone-700"
                onPress={() => router.push('/admin/logs')}
              >
                <Text className="text-2xl mb-2">📋</Text>
                <Text className="text-stone-200 font-medium">操作日志</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 mx-2 bg-stone-800 rounded-xl p-4 border border-stone-700"
                onPress={() => router.push('/admin/moderation')}
              >
                <Text className="text-2xl mb-2">🛡️</Text>
                <Text className="text-stone-200 font-medium">内容审核</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}
