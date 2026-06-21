import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useFocusEffect } from 'expo-router';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'https://liuhenjianghu.com';

interface Order {
  id: number;
  order_id: string;
  out_trade_no: string;
  transaction_id: string | null;
  total_fee: number;
  order_type: string;
  status: string;
  body: string;
  created_at: string;
}

export default function OrdersScreen() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 获取订单列表
  const fetchOrders = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/v1/payment/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('获取订单失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // 过滤订单
  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  // 状态映射
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      PENDING: { label: '待支付', color: '#FF9800' },
      SUCCESS: { label: '已完成', color: '#4CAF50' },
      REFUNDED: { label: '已退款', color: '#9E9E9E' },
      FAILED: { label: '已失败', color: '#F44336' },
    };
    return statusMap[status] || { label: status, color: '#9E9E9E' };
  };

  // 订单类型映射
  const getOrderTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      vip: '会员充值',
      balance: '余额充值',
      content: '内容购买',
    };
    return typeMap[type] || type;
  };

  // 格式化金额（分转元）
  const formatAmount = (fee: number) => {
    return (fee / 100).toFixed(2);
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Screen style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#c9a96e" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      {/* 顶部标题 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>我的订单</Text>
      </View>

      {/* 状态筛选 */}
      <View style={styles.filterContainer}>
        {['all', 'PENDING', 'SUCCESS', 'REFUNDED'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterButton, statusFilter === status && styles.filterButtonActive]}
            onPress={() => setStatusFilter(status)}
          >
            <Text style={[styles.filterText, statusFilter === status && styles.filterTextActive]}>
              {status === 'all' ? '全部' : getStatusInfo(status).label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#c9a96e"
          />
        }
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>暂无订单记录</Text>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderType}>{getOrderTypeLabel(order.order_type)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>
                      {statusInfo.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderBody}>
                  <Text style={styles.orderTitle}>{order.body || '会员服务'}</Text>
                  <Text style={styles.orderAmount}>¥{formatAmount(order.total_fee)}</Text>
                </View>

                <View style={styles.orderFooter}>
                  <Text style={styles.orderTime}>{formatDate(order.created_at)}</Text>
                  <Text style={styles.orderNo}>订单号: {order.out_trade_no.slice(-12)}</Text>
                </View>

                {order.status === 'SUCCESS' && order.transaction_id && (
                  <View style={styles.transactionRow}>
                    <Text style={styles.transactionLabel}>微信交易号:</Text>
                    <Text style={styles.transactionNo}>{order.transaction_id}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#c9a96e',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
  },
  filterButtonActive: {
    backgroundColor: '#c9a96e',
  },
  filterText: {
    fontSize: 14,
    color: '#999',
  },
  filterTextActive: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  orderCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderTitle: {
    fontSize: 14,
    color: '#aaa',
    flex: 1,
  },
  orderAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#c9a96e',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTime: {
    fontSize: 12,
    color: '#666',
  },
  orderNo: {
    fontSize: 12,
    color: '#666',
  },
  transactionRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
    flexDirection: 'row',
  },
  transactionLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  transactionNo: {
    fontSize: 12,
    color: '#888',
    flex: 1,
  },
  bottomPadding: {
    height: 20,
  },
});
