import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { adminService } from '@/services/adminService';

interface Stats {
  totalUsers: number;
  totalPosts: number;
  totalOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
}

interface RecentOrder {
  id: number;
  user_nickname: string;
  level: number;
  price: string;
  created_at: string;
}

export default function AdminDashboardScreen() {
  const router = useSafeRouter();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPosts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    monthRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = useCallback(async () => {
    try {
      const res = await adminService.getStats();
      if (res.code === 200) {
        setStats(res.data);
        setRecentOrders(res.data.recentOrders || []);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

        {/* Tab 切换 */}
        <View className="flex-row bg-stone-800 px-4 pb-2">
          <TouchableOpacity
            className={`px-4 py-2 mr-2 rounded-t-lg ${activeTab === 'overview' ? 'bg-amber-600' : 'bg-stone-700'}`}
            onPress={() => setActiveTab('overview')}
          >
            <Text className={activeTab === 'overview' ? 'text-white font-bold' : 'text-stone-400'}>总览</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-4 py-2 mr-2 rounded-t-lg ${activeTab === 'users' ? 'bg-amber-600' : 'bg-stone-700'}`}
            onPress={() => setActiveTab('users')}
          >
            <Text className={activeTab === 'users' ? 'text-white font-bold' : 'text-stone-400'}>用户管理</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-4 py-2 rounded-t-lg ${activeTab === 'members' ? 'bg-amber-600' : 'bg-stone-700'}`}
            onPress={() => setActiveTab('members')}
          >
            <Text className={activeTab === 'members' ? 'text-white font-bold' : 'text-stone-400'}>会员管理</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 p-4">
          {activeTab === 'overview' && (
            <>
              {/* 收益统计 */}
              <View className="mb-4">
                <Text className="text-lg font-bold text-white mb-3">收益概览</Text>
                <View className="flex-row flex-wrap">
                  <View className="w-1/2 pr-2 mb-3">
                    <View className="bg-amber-900/30 rounded-xl p-4 border border-amber-700/50">
                      <Text className="text-amber-400 text-2xl font-bold">{stats.totalRevenue.toFixed(2)}</Text>
                      <Text className="text-stone-400 mt-1">累计收益 (元)</Text>
                    </View>
                  </View>
                  <View className="w-1/2 pl-2 mb-3">
                    <View className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-700/50">
                      <Text className="text-emerald-400 text-2xl font-bold">{stats.todayRevenue.toFixed(2)}</Text>
                      <Text className="text-stone-400 mt-1">今日收益 (元)</Text>
                    </View>
                  </View>
                  <View className="w-1/2 pr-2">
                    <View className="bg-blue-900/30 rounded-xl p-4 border border-blue-700/50">
                      <Text className="text-blue-400 text-2xl font-bold">{stats.monthRevenue.toFixed(2)}</Text>
                      <Text className="text-stone-400 mt-1">本月收益 (元)</Text>
                    </View>
                  </View>
                  <View className="w-1/2 pl-2">
                    <View className="bg-purple-900/30 rounded-xl p-4 border border-purple-700/50">
                      <Text className="text-purple-400 text-2xl font-bold">{stats.totalOrders}</Text>
                      <Text className="text-stone-400 mt-1">总订单数</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* 平台统计 */}
              <View className="mb-4">
                <Text className="text-lg font-bold text-white mb-3">平台统计</Text>
                <View className="flex-row flex-wrap">
                  <View className="w-1/2 pr-2 mb-3">
                    <View className="bg-stone-800 rounded-xl p-4 border border-stone-700">
                      <Text className="text-stone-400 text-2xl font-bold">{stats.totalUsers}</Text>
                      <Text className="text-stone-500 mt-1">注册用户</Text>
                    </View>
                  </View>
                  <View className="w-1/2 pl-2 mb-3">
                    <View className="bg-stone-800 rounded-xl p-4 border border-stone-700">
                      <Text className="text-stone-400 text-2xl font-bold">{stats.totalPosts}</Text>
                      <Text className="text-stone-500 mt-1">总留言数</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* 近期订单 */}
              <View>
                <Text className="text-lg font-bold text-white mb-3">近期订单</Text>
                <View className="bg-stone-800 rounded-xl border border-stone-700">
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order, index) => (
                      <View
                        key={order.id}
                        className={`p-4 ${index < recentOrders.length - 1 ? 'border-b border-stone-700' : ''}`}
                      >
                        <View className="flex-row justify-between items-center">
                          <View>
                            <Text className="text-white">{order.user_nickname || '用户'}</Text>
                            <Text className="text-stone-500 text-sm mt-1">
                              L{order.level} · {order.price}元
                            </Text>
                          </View>
                          <Text className="text-stone-500 text-sm">
                            {new Date(order.created_at).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View className="p-4 items-center">
                      <Text className="text-stone-500">暂无订单</Text>
                    </View>
                  )}
                </View>
              </View>
            </>
          )}

          {activeTab === 'users' && (
            <View className="items-center justify-center py-20">
              <Text className="text-stone-400 mb-4">用户列表功能开发中</Text>
              <Text className="text-stone-500 text-sm">可在下方搜索用户</Text>
            </View>
          )}

          {activeTab === 'members' && (
            <View className="items-center justify-center py-20">
              <Text className="text-stone-400 mb-4">会员管理功能开发中</Text>
              <Text className="text-stone-500 text-sm">可在下方调整用户等级</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}
