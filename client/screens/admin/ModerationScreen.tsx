import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { adminService } from '@/services/adminService';

interface Violation {
  id: number;
  user_id: number;
  post_id: number | null;
  violation_type: string;
  content: string;
  penalty: number;
  status: number;
  created_at: string;
}

const PENALTY_TEXT: Record<number, string> = {
  0: '警告',
  1: '删帖',
  2: '禁言',
  3: '封号'
};

const PENALTY_COLORS: Record<number, string> = {
  0: '#8B7355',
  1: '#C9A96E',
  2: '#B8860B',
  3: '#8B0000'
};

export default function ModerationScreen() {
  const [reports, setReports] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'reports' | 'violations'>('reports');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getReports();
      setReports(data.reports || []);
    } catch (error) {
      console.error('获取举报列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30秒刷新
    return () => clearInterval(interval);
  }, [fetchData]);

  const handlePenalty = async (id: number, penalty: number) => {
    Alert.alert(
      '确认处罚',
      `确定对该用户进行"${PENALTY_TEXT[penalty]}"处罚吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认',
          onPress: async () => {
            try {
              await adminService.handleReport(id, penalty);
              Alert.alert('操作成功', '处罚已执行');
              fetchData();
            } catch (error) {
              Alert.alert('操作失败', '请重试');
            }
          }
        }
      ]
    );
  };

  const handleIgnore = async (id: number) => {
    Alert.alert('忽略举报', '确定忽略该举报吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确认',
        onPress: async () => {
          try {
            await adminService.handleReport(id, -1); // -1表示忽略
            Alert.alert('操作成功', '举报已忽略');
            fetchData();
          } catch (error) {
            Alert.alert('操作失败', '请重试');
          }
        }
      }
    ]);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN');
  };

  const renderItem = ({ item }: { item: Violation }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {item.violation_type === 'spam' ? '垃圾广告' :
             item.violation_type === 'illegal' ? '违法内容' :
             item.violation_type === 'political' ? '政治敏感' :
             item.violation_type === 'porn' ? '淫秽内容' : '其他'}
          </Text>
        </View>
        <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
      </View>
      
      <Text style={styles.content} numberOfLines={3}>{item.content}</Text>
      
      {item.post_id && (
        <TouchableOpacity style={styles.linkBtn}>
          <Text style={styles.linkText}>查看原帖 #{item.post_id}</Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.ignoreBtn]}
          onPress={() => handleIgnore(item.id)}
        >
          <Text style={styles.ignoreText}>忽略</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.warnBtn]}
          onPress={() => handlePenalty(item.id, 0)}
        >
          <Text style={styles.warnText}>警告</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => handlePenalty(item.id, 1)}
        >
          <Text style={styles.deleteText}>删帖</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.banBtn]}
          onPress={() => handlePenalty(item.id, 3)}
        >
          <Text style={styles.banText}>封号</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>内容审核</Text>
        <Text style={styles.subtitle}>处理举报 · 维护社区</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
          onPress={() => setActiveTab('reports')}
        >
          <Text style={[styles.tabText, activeTab === 'reports' && styles.activeTabText]}>
            待处理 ({reports.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading && reports.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>加载中...</Text>
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>无事</Text>
          <Text style={styles.emptyText}>暂无待处理的举报</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={fetchData}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 115, 85, 0.2)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3D2914',
    fontFamily: 'serif',
  },
  subtitle: {
    fontSize: 14,
    color: '#8B7355',
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 115, 85, 0.2)',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 115, 85, 0.1)',
  },
  activeTab: {
    backgroundColor: '#3D2914',
  },
  tabText: {
    fontSize: 14,
    color: '#8B7355',
  },
  activeTabText: {
    color: '#FFF',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 115, 85, 0.2)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#C9A96E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: '#8B7355',
  },
  content: {
    fontSize: 15,
    color: '#3D2914',
    lineHeight: 22,
    marginBottom: 12,
  },
  linkBtn: {
    backgroundColor: 'rgba(139, 115, 85, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  linkText: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  ignoreBtn: {
    backgroundColor: 'rgba(139, 115, 85, 0.1)',
  },
  warnBtn: {
    backgroundColor: '#D4A574',
  },
  deleteBtn: {
    backgroundColor: '#B8860B',
  },
  banBtn: {
    backgroundColor: '#8B0000',
  },
  ignoreText: {
    fontSize: 13,
    color: '#8B7355',
    fontWeight: '600',
  },
  warnText: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '600',
  },
  deleteText: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '600',
  },
  banText: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    color: '#C9A96E',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#8B7355',
  },
});
