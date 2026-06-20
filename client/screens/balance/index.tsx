import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useFocusEffect } from 'expo-router';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

interface Transaction {
  id: number;
  user_id: number;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  order_id: string;
  description: string;
  created_at: string;
}

export default function BalanceDetailScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      // 暂时使用静态数据，实际应从后端获取
      setTransactions([]);
    } catch (error) {
      console.error('获取消费记录失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [fetchTransactions])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  // 类型映射
  const getTypeInfo = (type: string) => {
    const typeMap: Record<string, { label: string; color: string; icon: string }> = {
      recharge: { label: '充值', color: '#4CAF50', icon: 'add-circle' },
      consume: { label: '消费', color: '#FF9800', icon: 'remove-circle' },
      refund: { label: '退款', color: '#2196F3', icon: 'refresh-circle' },
      vip: { label: '会员购买', color: '#9C27B0', icon: 'card' },
    };
    return typeMap[type] || { label: type, color: '#9E9E9E', icon: 'help-circle' };
  };

  // 格式化金额
  const formatAmount = (amount: number, isPositive: boolean) => {
    const prefix = isPositive ? '+' : '';
    return `${prefix}${(amount / 100).toFixed(2)}`;
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Screen style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#8B4513" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      {/* 顶部标题 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>余额明细</Text>
      </View>

      {/* 余额概览 */}
      <View style={styles.balanceOverview}>
        <Text style={styles.balanceLabel}>当前余额</Text>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceAmount}>0.00</Text>
          <Text style={styles.balanceUnit}>元</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8B4513"
          />
        }
      >
        {transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>暂无消费记录</Text>
            <Text style={styles.emptyHint}>您的每一笔消费都将显示在这里</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>全部记录</Text>
            {transactions.map((item) => {
              const typeInfo = getTypeInfo(item.type);
              const isPositive = item.amount > 0;
              return (
                <View key={item.id} style={styles.transactionCard}>
                  <View style={styles.transactionLeft}>
                    <View style={[styles.typeIcon, { backgroundColor: typeInfo.color + '20' }]}>
                      <Ionicons name={typeInfo.icon as any} size={20} color={typeInfo.color} />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>{typeInfo.label}</Text>
                      <Text style={styles.transactionTime}>{formatDate(item.created_at)}</Text>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={[styles.transactionAmount, { color: isPositive ? '#4CAF50' : '#FF9800' }]}>
                      {formatAmount(item.amount, isPositive)}
                    </Text>
                    <Text style={styles.balanceAfter}>余额: {(item.balance_after / 100).toFixed(2)}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E6',
  },
  header: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#FDFBF7',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCC8',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  balanceOverview: {
    backgroundColor: '#8B4513',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  balanceUnit: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 8,
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
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  emptyHint: {
    marginTop: 8,
    fontSize: 14,
    color: '#bbb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    justifyContent: 'center',
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  transactionTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  balanceAfter: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  bottomPadding: {
    height: 20,
  },
});
