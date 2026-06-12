import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, RefreshControl, Modal, ActivityIndicator } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Ionicons } from '@expo/vector-icons';
import adminService from '@/services/adminService';

interface ReportInfo {
  id: number;
  reporter_id: number;
  target_type: number;
  target_id: number;
  reason: string;
  content: string;
  status: number;
  created_at: string;
}

const statusMap: Record<number, { text: string; color: string; bgColor: string }> = {
  1: { text: '待处理', color: 'text-amber-500', bgColor: 'bg-amber-600' },
  2: { text: '已处理', color: 'text-emerald-500', bgColor: 'bg-emerald-600' },
  3: { text: '已驳回', color: 'text-stone-400', bgColor: 'bg-stone-600' },
};

const targetTypeMap: Record<number, string> = {
  1: '帖子',
  2: '评论',
  3: '用户',
};

export default function ReportsScreen() {
  const router = useSafeRouter();
  const [reports, setReports] = useState<ReportInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<number | undefined>(undefined); // undefined = 全部
  const [selectedReport, setSelectedReport] = useState<ReportInfo | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      const res = await adminService.getReports({ status: filter });
      if (res.success && res.data) {
        setReports(res.data.reports || []);
      }
    } catch (error) {
      console.error('获取举报列表失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const handleUpdateStatus = async (id: number, action: 'dismiss' | 'delete' | 'ban') => {
    setActionLoading(true);
    try {
      const res = await adminService.handleReport(id, action);
      if (res.success) {
        Alert.alert('成功', '操作成功');
        setSelectedReport(null);
        fetchReports();
      } else {
        Alert.alert('失败', res.message || '操作失败');
      }
    } catch (error) {
      Alert.alert('错误', '网络错误，请重试');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (time: string) => {
    const date = new Date(time);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <Screen>
      <View className="flex-1 bg-stone-900">
        {/* 筛选标签 */}
        <View className="flex-row px-4 py-3 bg-stone-800 border-b border-stone-700">
          <TouchableOpacity
            className={`px-4 py-2 rounded-full mr-2 ${filter === undefined ? 'bg-amber-600' : 'bg-stone-700'}`}
            onPress={() => setFilter(undefined)}
          >
            <Text className={`text-sm ${filter === undefined ? 'text-white' : 'text-stone-400'}`}>全部</Text>
          </TouchableOpacity>
          {[1, 2, 3].map((item) => (
            <TouchableOpacity
              key={item}
              className={`px-4 py-2 rounded-full mr-2 ${filter === item ? 'bg-amber-600' : 'bg-stone-700'}`}
              onPress={() => setFilter(item)}
            >
              <Text className={`text-sm ${filter === item ? 'text-white' : 'text-stone-400'}`}>
                {statusMap[item].text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#d97706"
            />
          }
        >
          {loading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#d97706" />
            </View>
          ) : reports.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="checkmark-circle" size={64} color="#57534e" />
              <Text className="text-stone-500 mt-4">暂无举报</Text>
            </View>
          ) : (
            reports.map((report) => (
              <TouchableOpacity
                key={report.id}
                className="mx-4 mt-4 bg-stone-800 rounded-xl p-4 border border-stone-700"
                onPress={() => setSelectedReport(report)}
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-row items-center">
                    <View className={`px-2 py-1 rounded ${statusMap[report.status]?.bgColor}`}>
                      <Text className="text-white text-xs">{statusMap[report.status]?.text}</Text>
                    </View>
                    <Text className="text-stone-400 text-xs ml-3">
                      {targetTypeMap[report.target_type]}
                    </Text>
                  </View>
                  <Text className="text-stone-500 text-xs">{formatTime(report.created_at)}</Text>
                </View>

                <Text className="text-stone-300 mt-3 text-sm">{report.content || '无详细描述'}</Text>

                <View className="flex-row mt-3 pt-3 border-t border-stone-700">
                  <View className="flex-row items-center">
                    <Ionicons name="flag" size={14} color="#78716c" />
                    <Text className="text-stone-500 text-xs ml-1">举报原因: {report.reason}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
          <View className="h-20" />
        </ScrollView>

        {/* 详情弹窗 */}
        <Modal
          visible={!!selectedReport}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedReport(null)}
        >
          <View className="flex-1 bg-black/60 justify-end">
            <TouchableOpacity 
              className="flex-1" 
              onPress={() => setSelectedReport(null)}
            />
            <View className="bg-stone-800 rounded-t-2xl p-6 border-t border-stone-700">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-stone-200">举报详情</Text>
                <TouchableOpacity onPress={() => setSelectedReport(null)}>
                  <Ionicons name="close" size={24} color="#a8a29e" />
                </TouchableOpacity>
              </View>

              {selectedReport && (
                <>
                  <View className="mb-4">
                    <Text className="text-stone-500 text-sm mb-1">举报类型</Text>
                    <Text className="text-stone-200">
                      {targetTypeMap[selectedReport.target_type]}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-stone-500 text-sm mb-1">举报原因</Text>
                    <Text className="text-stone-200">{selectedReport.reason}</Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-stone-500 text-sm mb-1">详细描述</Text>
                    <Text className="text-stone-200">
                      {selectedReport.content || '无'}
                    </Text>
                  </View>

                  <View className="mb-6">
                    <Text className="text-stone-500 text-sm mb-1">目标ID</Text>
                    <Text className="text-stone-200 font-mono text-sm">
                      {selectedReport.target_id}
                    </Text>
                  </View>

                  {selectedReport.status === 1 && (
                    <View className="flex-row -mx-2">
                      <TouchableOpacity
                        className="flex-1 mx-2 py-3 rounded-xl bg-emerald-600 items-center"
                        onPress={() => handleUpdateStatus(selectedReport.id, 'delete')}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <Text className="text-white font-bold">删除内容</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-1 mx-2 py-3 rounded-xl bg-stone-700 items-center"
                        onPress={() => handleUpdateStatus(selectedReport.id, 'dismiss')}
                        disabled={actionLoading}
                      >
                        <Text className="text-stone-300 font-bold">驳回举报</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </Screen>
  );
}
