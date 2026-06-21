import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'https://liuhenjianghu.com';

interface PaymentOrder {
  id: number;
  order_id: string;
  out_trade_no: string;
  transaction_id: string | null;
  user_id: number;
  total_fee: number;
  order_type: string;
  status: string;
  body: string;
  created_at: string;
}

interface PaymentConfig {
  appId: string;
  mchId: string;
  isConfigured: boolean;
}

export default function PaymentManageScreen() {
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const limit = 20;

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/payment/config`);
      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
      }
    } catch (error) {
      console.error('获取配置失败:', error);
    }
  }, []);

  const fetchOrders = useCallback(async (pageNum: number = 1, search: string = keyword) => {
    try {
      let url = `${API_BASE}/api/v1/payment/orders?page=${pageNum}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.success || data.orders) {
        const orderList = data.orders || data.data?.orders || [];
        if (pageNum === 1) {
          setOrders(orderList);
        } else {
          setOrders(prev => [...prev, ...orderList]);
        }
        setTotal(data.total || data.data?.total || 0);
      }
    } catch (error) {
      console.error('获取订单失败:', error);
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter]);

  useEffect(() => {
    fetchConfig();
    fetchOrders();
  }, [fetchConfig, fetchOrders]);

  const handleSearch = () => {
    setPage(1);
    setLoading(true);
    fetchOrders(1, keyword);
  };

  const handleFilterChange = (status: string) => {
    setStatusFilter(status);
    setPage(1);
    setLoading(true);
    fetchOrders(1, keyword);
  };

  // 状态映射
  const getStatusInfo = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      PENDING: { label: '待支付', color: '#FF9800' },
      SUCCESS: { label: '已完成', color: '#4CAF50' },
      REFUNDED: { label: '已退款', color: '#9E9E9E' },
      FAILED: { label: '已失败', color: '#F44336' },
    };
    return map[status] || { label: status, color: '#9E9E9E' };
  };

  // 格式化金额
  const formatAmount = (fee: number) => (fee / 100).toFixed(2);

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const renderOrder = ({ item }: { item: PaymentOrder }) => {
    const statusInfo = getStatusInfo(item.status);
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNo}>{item.out_trade_no.slice(-12)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        </View>
        <View style={styles.orderBody}>
          <Text style={styles.orderTitle}>{item.body || '会员充值'}</Text>
          <Text style={styles.orderAmount}>¥{formatAmount(item.total_fee)}</Text>
        </View>
        <View style={styles.orderFooter}>
          <Text style={styles.orderTime}>{formatDate(item.created_at)}</Text>
          <Text style={styles.orderUser}>用户ID: {item.user_id}</Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-stone-900">
      {/* 配置状态卡片 */}
      <View style={styles.configCard}>
        <Text style={styles.configTitle}>支付配置状态</Text>
        <View style={styles.configRow}>
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>商户号</Text>
            <Text style={styles.configValue}>{config?.mchId || '未配置'}</Text>
          </View>
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>AppID</Text>
            <Text style={styles.configValue}>{config?.appId ? '已配置' : '未配置'}</Text>
          </View>
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>状态</Text>
            <View style={[styles.statusDot, { backgroundColor: config?.isConfigured ? '#4CAF50' : '#FF9800' }]} />
            <Text style={[styles.configValue, { color: config?.isConfigured ? '#4CAF50' : '#FF9800' }]}>
              {config?.isConfigured ? '已就绪' : '待配置'}
            </Text>
          </View>
        </View>
      </View>

      {/* 搜索和筛选 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="搜索订单号..."
            placeholderTextColor="#666"
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>搜索</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.filterRow}>
          {[
            { key: '', label: '全部' },
            { key: 'PENDING', label: '待支付' },
            { key: 'SUCCESS', label: '已完成' },
            { key: 'REFUNDED', label: '已退款' },
          ].map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterButton, statusFilter === filter.key && styles.filterButtonActive]}
              onPress={() => handleFilterChange(filter.key)}
            >
              <Text style={[styles.filterText, statusFilter === filter.key && styles.filterTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 统计信息 */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>总订单数</Text>
          <Text style={styles.statValue}>{total}</Text>
        </View>
      </View>

      {/* 订单列表 */}
      {loading && orders.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#c9a96e" />
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无订单记录</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  configCard: {
    backgroundColor: '#292524',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  configTitle: {
    fontSize: 14,
    color: '#a8a29e',
    marginBottom: 12,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  configItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  configLabel: {
    fontSize: 12,
    color: '#78716c',
    marginRight: 8,
  },
  configValue: {
    fontSize: 14,
    color: '#fff',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#292524',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: '#c9a96e',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginLeft: 8,
  },
  searchButtonText: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#292524',
  },
  filterButtonActive: {
    backgroundColor: '#c9a96e',
  },
  filterText: {
    fontSize: 12,
    color: '#a8a29e',
  },
  filterTextActive: {
    color: '#1a1a1a',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  statItem: {
    backgroundColor: '#292524',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#78716c',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#c9a96e',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  orderCard: {
    backgroundColor: '#292524',
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
  orderNo: {
    fontSize: 14,
    color: '#a8a29e',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#c9a96e',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderTime: {
    fontSize: 12,
    color: '#78716c',
  },
  orderUser: {
    fontSize: 12,
    color: '#78716c',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
});
