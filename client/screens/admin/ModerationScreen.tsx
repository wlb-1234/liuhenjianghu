import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Screen } from '@/components/Screen';
import adminService, {
  ReportInfo,
  ModerationStats,
  SensitiveWord,
} from '@/services/adminService';

const REPORT_TYPE_NAMES: Record<number, string> = {
  1: '帖子',
  2: '评论',
  3: '用户',
};

const REPORT_REASON_NAMES: Record<number, string> = {
  1: '垃圾广告',
  2: '色情低俗',
  3: '暴力血腥',
  4: '诈骗欺诈',
  5: '侵权抄袭',
  99: '其他',
};

const REPORT_STATUS_NAMES: Record<number, { text: string; color: string }> = {
  1: { text: '待处理', color: '#FF9800' },
  2: { text: '已处理', color: '#4CAF50' },
  3: { text: '已驳回', color: '#9E9E9E' },
};

export default function ModerationScreen() {
  const [activeTab, setActiveTab] = useState<'reports' | 'words'>('reports');
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [reports, setReports] = useState<ReportInfo[]>([]);
  const [sensitiveWords, setSensitiveWords] = useState<SensitiveWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filterStatus, setFilterStatus] = useState<number | undefined>(undefined);
  const [newWord, setNewWord] = useState('');

  // 加载统计数据
  const loadStats = async () => {
    const result = await adminService.getModerationStats();
    if (result.success && result.data) {
      setStats(result.data);
    }
  };

  // 加载举报列表
  const loadReports = async (reset = false) => {
    const newPage = reset ? 1 : page;
    const result = await adminService.getReports({
      page: newPage,
      limit: 10,
      status: filterStatus,
    });

    if (result.success && result.data) {
      if (reset) {
        setReports(result.data.reports);
        setPage(2);
      } else {
        setReports(prev => [...prev, ...result.data!.reports]);
        setPage(newPage + 1);
      }
      setHasMore(result.data.reports.length === 10);
    }
    setLoading(false);
    setRefreshing(false);
  };

  // 加载敏感词列表
  const loadSensitiveWords = async () => {
    const result = await adminService.getSensitiveWords();
    if (result.success && result.data) {
      setSensitiveWords(result.data.words);
    }
    setLoading(false);
    setRefreshing(false);
  };

  // 刷新
  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'reports') {
      await loadReports(true);
    } else {
      await loadSensitiveWords();
    }
    await loadStats();
  };

  // 加载更多
  const onLoadMore = async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    await loadReports(false);
  };

  // 初始加载
  useEffect(() => {
    loadStats();
    loadReports(true);
  }, []);

  // 切换 Tab
  useEffect(() => {
    setLoading(true);
    if (activeTab === 'reports') {
      loadReports(true);
    } else {
      loadSensitiveWords();
    }
  }, [activeTab, filterStatus]);

  // 处理举报
  const handleReport = async (report: ReportInfo, action: 'dismiss' | 'delete' | 'ban') => {
    const actionNames = { dismiss: '驳回', delete: '删除内容', ban: '封禁用户' };
    const confirmActions: Record<string, string> = {
      dismiss: '确定要驳回这条举报吗？',
      delete: '确定要删除该内容吗？',
      ban: '确定要封禁该用户吗？',
    };

    Alert.alert(
      `处理举报 - ${actionNames[action]}`,
      confirmActions[action],
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: action === 'ban' ? 'destructive' : 'default',
          onPress: async () => {
            const result = await adminService.handleReport(report.id, action);
            if (result.success) {
              Alert.alert('成功', '处理成功');
              onRefresh();
            } else {
              Alert.alert('失败', result.error || '处理失败');
            }
          },
        },
      ]
    );
  };

  // 添加敏感词
  const addSensitiveWord = async () => {
    if (!newWord.trim()) {
      Alert.alert('提示', '请输入敏感词');
      return;
    }
    const result = await adminService.addSensitiveWord(newWord.trim());
    if (result.success) {
      setNewWord('');
      loadSensitiveWords();
      loadStats();
      Alert.alert('成功', '敏感词已添加');
    } else {
      Alert.alert('失败', result.error || '添加失败');
    }
  };

  // 删除敏感词
  const deleteSensitiveWord = async (word: SensitiveWord) => {
    Alert.alert(
      '确认删除',
      `确定要删除敏感词"${word.word}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            const result = await adminService.deleteSensitiveWord(word.id);
            if (result.success) {
              loadSensitiveWords();
              loadStats();
              Alert.alert('成功', '敏感词已删除');
            } else {
              Alert.alert('失败', result.error || '删除失败');
            }
          },
        },
      ]
    );
  };

  // 渲染统计卡片
  const renderStats = () => {
    if (!stats) return null;
    return (
      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={[styles.statCard, filterStatus === 1 && styles.statCardActive]}
          onPress={() => setFilterStatus(filterStatus === 1 ? undefined : 1)}
        >
          <Text style={styles.statNumber}>{stats.pendingReports}</Text>
          <Text style={styles.statLabel}>待处理举报</Text>
        </TouchableOpacity>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.todayReports}</Text>
          <Text style={styles.statLabel}>今日举报</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.weekReports}</Text>
          <Text style={styles.statLabel}>本周举报</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.sensitiveWordsCount}</Text>
          <Text style={styles.statLabel}>敏感词库</Text>
        </View>
      </View>
    );
  };

  // 渲染举报列表项
  const renderReportItem = (report: ReportInfo) => {
    const statusInfo = REPORT_STATUS_NAMES[report.status] || { text: '未知', color: '#999' };
    return (
      <View key={report.id} style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <View style={styles.reportType}>
            <Text style={styles.reportTypeText}>{REPORT_TYPE_NAMES[report.type] || '未知'}</Text>
            <Text style={[styles.reportStatus, { color: statusInfo.color }]}>{statusInfo.text}</Text>
          </View>
          <Text style={styles.reportTime}>
            {new Date(report.created_at).toLocaleDateString()}
          </Text>
        </View>

        <Text style={styles.reportReason}>
          举报原因：{REPORT_REASON_NAMES[report.reason] || report.reason_text || '未知'}
        </Text>

        {report.reason_text && report.reason === 99 && (
          <Text style={styles.reportDetail}>详细说明：{report.reason_text}</Text>
        )}

        {report.content && (
          <View style={styles.reportContent}>
            <Text style={styles.reportContentLabel}>被举报内容：</Text>
            <Text style={styles.reportContentText} numberOfLines={3}>
              {report.content}
            </Text>
          </View>
        )}

        {report.reporter_phone && (
          <Text style={styles.reportReporter}>举报人：{report.reporter_phone}</Text>
        )}

        {report.status === 1 && (
          <View style={styles.reportActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.dismissBtn]}
              onPress={() => handleReport(report, 'dismiss')}
            >
              <Text style={styles.dismissBtnText}>驳回</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => handleReport(report, 'delete')}
            >
              <Text style={styles.deleteBtnText}>删除内容</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.banBtn]}
              onPress={() => handleReport(report, 'ban')}
            >
              <Text style={styles.banBtnText}>封禁用户</Text>
            </TouchableOpacity>
          </View>
        )}

        {report.status !== 1 && (
          <View style={styles.reportResult}>
            <Text style={styles.reportResultText}>
              处理结果：{report.handle_result === 'dismissed' ? '已驳回' : report.handle_result === 'deleted' ? '已删除内容' : '已封禁用户'}
            </Text>
            {report.handle_reason && (
              <Text style={styles.reportResultReason}>原因：{report.handle_reason}</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  // 渲染敏感词管理
  const renderSensitiveWords = () => (
    <View style={styles.wordsContainer}>
      <View style={styles.wordInputContainer}>
        <View style={styles.wordInput}>
          <TextInput
            style={styles.wordInputField}
            placeholder="输入敏感词"
            value={newWord}
            onChangeText={setNewWord}
            autoCapitalize="none"
          />
        </View>
        <TouchableOpacity style={styles.addWordBtn} onPress={addSensitiveWord}>
          <Text style={styles.addWordBtnText}>添加</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.wordsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {sensitiveWords.map(word => (
          <View key={word.id} style={styles.wordItem}>
            <View style={styles.wordInfo}>
              <Text style={styles.wordText}>{word.word}</Text>
              <Text style={styles.wordLevel}>
                {word.level === 1 ? '敏感' : word.level === 2 ? '违规' : '严重'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.deleteWordBtn}
              onPress={() => deleteSensitiveWord(word)}
            >
              <Text style={styles.deleteWordBtnText}>删除</Text>
            </TouchableOpacity>
          </View>
        ))}
        {sensitiveWords.length === 0 && (
          <Text style={styles.emptyText}>暂无敏感词</Text>
        )}
      </ScrollView>
    </View>
  );

  return (
    <Screen>
      <View style={styles.container}>
        {/* 统计卡片 */}
        {renderStats()}

        {/* Tab 切换 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reports' && styles.tabActive]}
            onPress={() => setActiveTab('reports')}
          >
            <Text style={[styles.tabText, activeTab === 'reports' && styles.tabTextActive]}>
              举报管理
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'words' && styles.tabActive]}
            onPress={() => setActiveTab('words')}
          >
            <Text style={[styles.tabText, activeTab === 'words' && styles.tabTextActive]}>
              敏感词库
            </Text>
          </TouchableOpacity>
        </View>

        {/* 内容 */}
        {activeTab === 'reports' ? (
          <FlatList
            data={reports}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => renderReportItem(item)}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            onEndReached={onLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loading && reports.length > 0 ? (
                <ActivityIndicator style={styles.loadingMore} />
              ) : null
            }
            ListEmptyComponent={
              !loading ? <Text style={styles.emptyText}>暂无举报</Text> : null
            }
            contentContainerStyle={styles.listContent}
          />
        ) : (
          renderSensitiveWords()
        )}

        {loading && reports.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90D9" />
          </View>
        )}
      </View>
    </Screen>
  );
}

import { FlatList, TextInput } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFF',
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
    marginHorizontal: 4,
  },
  statCardActive: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#4A90D9',
  },
  tabText: {
    fontSize: 15,
    color: '#666',
  },
  tabTextActive: {
    color: '#4A90D9',
    fontWeight: '600',
  },
  listContent: {
    padding: 12,
  },
  reportCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reportType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 10,
  },
  reportStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  reportTime: {
    fontSize: 12,
    color: '#999',
  },
  reportReason: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  reportDetail: {
    fontSize: 13,
    color: '#888',
    marginBottom: 6,
  },
  reportContent: {
    backgroundColor: '#F8F8F8',
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
  },
  reportContentLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  reportContentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  reportReporter: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  reportActions: {
    flexDirection: 'row',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 14,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  dismissBtn: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  dismissBtnText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteBtn: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  deleteBtnText: {
    color: '#F57C00',
    fontSize: 14,
    fontWeight: '500',
  },
  banBtn: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#EF9A9A',
  },
  banBtnText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '500',
  },
  reportResult: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  reportResultText: {
    fontSize: 13,
    color: '#4CAF50',
  },
  reportResultReason: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  wordsContainer: {
    flex: 1,
    padding: 16,
  },
  wordInputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  wordInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    marginRight: 10,
  },
  wordInputField: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  addWordBtn: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addWordBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  wordsList: {
    flex: 1,
  },
  wordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
  },
  wordInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  wordLevel: {
    fontSize: 12,
    color: '#F57C00',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 10,
  },
  deleteWordBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#FFEBEE',
  },
  deleteWordBtnText: {
    color: '#D32F2F',
    fontSize: 13,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 40,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  loadingMore: {
    paddingVertical: 20,
  },
});
