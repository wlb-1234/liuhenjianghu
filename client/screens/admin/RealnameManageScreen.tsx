import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { useFocusEffect } from 'expo-router';
import { useSafeRouter } from '@/hooks/useSafeRouter';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
const ADMIN_TOKEN = 'admin_token_dev';

export default function RealnameManageScreen() {
  const router = useSafeRouter();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [replyText, setReplyText] = useState('');

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const url = `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/realname/admin/list?page=${page}${statusFilter ? `&status=${statusFilter}` : ''}`;
      const response = await fetch(url, {
        headers: { 'x-admin-token': ADMIN_TOKEN },
      });
      const data = await response.json();
      if (data.list) {
        setList(data.list);
        setTotal(data.total);
      }
    } catch (error: any) {
      Alert.alert('获取列表失败', error.message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useFocusEffect(
    useCallback(() => {
      fetchList();
    }, [fetchList])
  );

  const handleApprove = async (item: any) => {
    Alert.alert('确认通过', `确认通过 ${item.real_name} 的实名认证？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '通过',
        onPress: async () => {
          try {
            const response = await fetch(
              `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/realname/admin/${item.id}/review`,
              {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'x-admin-token': ADMIN_TOKEN,
                },
                body: JSON.stringify({ status: 'approved' }),
              }
            );
            if (response.ok) {
              Alert.alert('操作成功', '已通过认证');
              fetchList();
            }
          } catch (error: any) {
            Alert.alert('操作失败', error.message);
          }
        },
      },
    ]);
  };

  const handleReject = (item: any) => {
    setCurrentItem(item);
    setReplyText('');
    Alert.prompt(
      '拒绝原因',
      '请输入拒绝原因',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '拒绝',
          style: 'destructive',
          onPress: async (reason) => {
            try {
              const response = await fetch(
                `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/realname/admin/${item.id}/review`,
                {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': ADMIN_TOKEN,
                  },
                  body: JSON.stringify({ status: 'rejected', rejectReason: reason || '信息有误' }),
                }
              );
              if (response.ok) {
                Alert.alert('操作成功', '已拒绝认证');
                fetchList();
              }
            } catch (error: any) {
              Alert.alert('操作失败', error.message);
            }
          },
        },
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Text style={styles.statusPending}>待审核</Text>;
      case 'approved':
        return <Text style={styles.statusApproved}>已通过</Text>;
      case 'rejected':
        return <Text style={styles.statusRejected}>已拒绝</Text>;
      default:
        return <Text style={styles.statusDefault}>{status}</Text>;
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '-';
    return new Date(time).toLocaleString('zh-CN');
  };

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>实名认证管理</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* 筛选 */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterBtn, !statusFilter && styles.filterBtnActive]}
          onPress={() => setStatusFilter('')}
        >
          <Text style={[styles.filterText, !statusFilter && styles.filterTextActive]}>全部</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, statusFilter === 'pending' && styles.filterBtnActive]}
          onPress={() => setStatusFilter('pending')}
        >
          <Text style={[styles.filterText, statusFilter === 'pending' && styles.filterTextActive]}>待审核</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, statusFilter === 'approved' && styles.filterBtnActive]}
          onPress={() => setStatusFilter('approved')}
        >
          <Text style={[styles.filterText, statusFilter === 'approved' && styles.filterTextActive]}>已通过</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, statusFilter === 'rejected' && styles.filterBtnActive]}
          onPress={() => setStatusFilter('rejected')}
        >
          <Text style={[styles.filterText, statusFilter === 'rejected' && styles.filterTextActive]}>已拒绝</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#C9A96E" style={{ marginTop: 40 }} />
        ) : list.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无数据</Text>
          </View>
        ) : (
          list.map(item => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.userName}>{item.real_name}</Text>
                {getStatusBadge(item.status)}
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>用户：</Text>
                <Text style={styles.value}>{item.nickname || '未知'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>身份证：</Text>
                <Text style={styles.value}>
                  {item.id_card ? `${item.id_card.slice(0, 6)}********${item.id_card.slice(-4)}` : '-'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>申请时间：</Text>
                <Text style={styles.value}>{formatTime(item.created_at)}</Text>
              </View>
              {item.reject_reason && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>拒绝原因：</Text>
                  <Text style={[styles.value, { color: '#FF4D4F' }]}>{item.reject_reason}</Text>
                </View>
              )}
              {item.status === 'pending' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => handleApprove(item)}
                  >
                    <Text style={styles.approveBtnText}>通过</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleReject(item)}
                  >
                    <Text style={styles.rejectBtnText}>拒绝</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* 分页 */}
      {total > 10 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
            onPress={() => page > 1 && setPage(p => p - 1)}
          >
            <Text style={styles.pageBtnText}>上一页</Text>
          </TouchableOpacity>
          <Text style={styles.pageText}>
            {page} / {Math.ceil(total / 10)}
          </Text>
          <TouchableOpacity
            style={[styles.pageBtn, page >= Math.ceil(total / 10) && styles.pageBtnDisabled]}
            onPress={() => page < Math.ceil(total / 10) && setPage(p => p + 1)}
          >
            <Text style={styles.pageBtnText}>下一页</Text>
          </TouchableOpacity>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backText: {
    fontSize: 16,
    color: '#C9A96E',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  filterBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusPending: {
    fontSize: 12,
    color: '#FAAD14',
    backgroundColor: '#FFF7E6',
    padding: 4,
    borderRadius: 4,
  },
  statusApproved: {
    fontSize: 12,
    color: '#52C41A',
    backgroundColor: '#F6FFED',
    padding: 4,
    borderRadius: 4,
  },
  statusRejected: {
    fontSize: 12,
    color: '#FF4D4F',
    backgroundColor: '#FFF2F0',
    padding: 4,
    borderRadius: 4,
  },
  statusDefault: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#F5F5F5',
    padding: 4,
    borderRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    width: 80,
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingTop: 12,
  },
  actionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 12,
  },
  approveBtn: {
    backgroundColor: '#52C41A',
  },
  approveBtnText: {
    color: '#fff',
    fontSize: 14,
  },
  rejectBtn: {
    backgroundColor: '#FF4D4F',
  },
  rejectBtnText: {
    color: '#fff',
    fontSize: 14,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  pageBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#C9A96E',
    borderRadius: 6,
  },
  pageBtnDisabled: {
    backgroundColor: '#E8E8E8',
  },
  pageBtnText: {
    color: '#fff',
    fontSize: 14,
  },
  pageText: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 16,
  },
});
