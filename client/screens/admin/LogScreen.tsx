import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import adminService from '@/services/adminService';

interface LogItem {
  id: number;
  admin_id: number;
  admin_username: string;
  action: string;
  target_user_id: number | null;
  old_value: string | null;
  new_value: string | null;
  reason: string | null;
  created_at: string;
}

const actionLabels: Record<string, string> = {
  login: '登录',
  logout: '退出',
  adjust_level: '调整等级',
  ban_user: '封禁用户',
  unban_user: '解封用户',
  update_level_config: '更新等级配置',
};

export default function AdminLogsScreen() {
  const router = useSafeRouter();
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchLogs = useCallback(async (pageNum: number = 1) => {
    try {
      const res = await adminService.getLogs({ page: pageNum, limit: 20 });
      if (res.success && res.data) {
        if (pageNum === 1) {
          setLogs(res.data.logs);
        } else {
          setLogs(prev => [...prev, ...res.data!.logs]);
        }
        setHasMore(res.data.logs.length === 20);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setLoading(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchLogs(nextPage);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'login':
      case 'logout':
        return 'text-blue-500';
      case 'adjust_level':
        return 'text-amber-500';
      case 'ban_user':
        return 'text-rose-500';
      case 'unban_user':
        return 'text-emerald-500';
      case 'update_level_config':
        return 'text-purple-500';
      default:
        return 'text-stone-400';
    }
  };

  const renderLog = ({ item }: { item: LogItem }) => (
    <View className="bg-stone-800 rounded-xl p-4 mb-3 border border-stone-700">
      <View className="flex-row justify-between items-start mb-2">
        <View className={`px-2 py-0.5 rounded ${getActionColor(item.action).replace('text-', 'bg-').replace('500', '-500/20')}`}>
          <Text className={`text-sm font-medium ${getActionColor(item.action)}`}>
            {actionLabels[item.action] || item.action}
          </Text>
        </View>
        <Text className="text-stone-600 text-xs">
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>

      <Text className="text-stone-300">
        管理员 <Text className="text-amber-500">{item.admin_username}</Text>
        {item.action === 'login' ? ' 登录系统' : ''}
        {item.action === 'adjust_level' && item.target_user_id ? ` 修改用户 #${item.target_user_id} 的等级` : ''}
        {item.action === 'ban_user' && item.target_user_id ? ` 封禁用户 #${item.target_user_id}` : ''}
        {item.action === 'unban_user' && item.target_user_id ? ` 解封用户 #${item.target_user_id}` : ''}
      </Text>

      {item.reason && (
        <View className="mt-2 bg-stone-700/50 px-3 py-2 rounded-lg">
          <Text className="text-stone-500 text-xs">原因</Text>
          <Text className="text-stone-400 text-sm">{item.reason}</Text>
        </View>
      )}

      {(item.old_value || item.new_value) && (
        <View className="mt-2 flex-row">
          {item.old_value && (
            <Text className="text-stone-500 text-sm mr-2">
              从: <Text className="text-rose-400">{item.old_value}</Text>
            </Text>
          )}
          {item.new_value && (
            <Text className="text-stone-500 text-sm">
              到: <Text className="text-emerald-400">{item.new_value}</Text>
            </Text>
          )}
        </View>
      )}
    </View>
  );

  return (
    <Screen>
      <View className="flex-1 bg-stone-900">
        {/* Header */}
        <View className="bg-stone-800 px-4 py-3 border-b border-stone-700">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-amber-500">← 返回</Text>
            </TouchableOpacity>
            <Text className="text-stone-200 font-medium">操作日志</Text>
            <View className="w-12" />
          </View>
        </View>

        <FlatList
          data={logs}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderLog}
          contentContainerClassName="p-4"
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loading && logs.length > 0 ? (
              <ActivityIndicator className="py-4" color="#d97706" />
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View className="items-center py-10">
                <Text className="text-stone-500">暂无操作记录</Text>
              </View>
            ) : null
          }
          ListHeaderComponent={
            <View className="mb-4">
              <Text className="text-stone-500 text-sm">
                记录所有管理员的关键操作，包括登录、用户管理、配置修改等
              </Text>
            </View>
          }
        />
      </View>
    </Screen>
  );
}
