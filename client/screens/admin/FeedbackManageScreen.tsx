import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'https://liuhenjianghu.com';

interface FeedbackItem {
  id: number;
  type: string;
  content: string;
  contact: string | null;
  status: string;
  reply: string | null;
  replied_at: string | null;
  created_at: string;
  user_nickname: string | null;
  user_avatar: string | null;
}

type StatusFilter = 'all' | 'pending' | 'processed' | 'rejected';

export default function FeedbackManageScreen() {
  const router = useSafeRouter();
  const [list, setList] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // 回复弹窗
  const [replyModal, setReplyModal] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyStatus, setReplyStatus] = useState<'processed' | 'rejected'>('processed');
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async (p = 1, status = statusFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' });
      if (status !== 'all') params.append('status', status);
      const res = await fetch(`${API_BASE}/api/v1/feedbacks/admin/list?${params}`, {
        headers: { 'x-admin-token': 'admin_token_dev' },
      });
      const data = await res.json();
      if (data.data) {
        setList(p === 1 ? data.data : [...list, ...data.data]);
        setTotal(data.pagination?.total || 0);
        setPage(p);
      }
    } catch (err) {
      console.error('加载反馈列表失败', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useFocusEffect(
    useCallback(() => {
      loadData(1, statusFilter);
    }, [statusFilter])
  );

  const handleFilter = (status: StatusFilter) => {
    setStatusFilter(status);
    setList([]);
  };

  const handleReply = (item: FeedbackItem) => {
    setCurrentId(item.id);
    setReplyContent(item.reply || '');
    setReplyStatus(item.status === 'rejected' ? 'rejected' : 'processed');
    setReplyModal(true);
  };

  const handleSubmitReply = async () => {
    if (!currentId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/feedbacks/admin/${currentId}/reply`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': 'admin_token_dev',
        },
        body: JSON.stringify({ reply: replyContent, status: replyStatus }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('操作成功', '回复已更新');
        setReplyModal(false);
        loadData(1, statusFilter);
      } else {
        Alert.alert('操作失败', data.error || '请重试');
      }
    } catch (err) {
      Alert.alert('操作失败', '网络错误');
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: '待处理', color: '#F59E0B', bg: '#FEF3C7' },
    processed: { label: '已回复', color: '#10B981', bg: '#D1FAE5' },
    rejected: { label: '已驳回', color: '#EF4444', bg: '#FEE2E2' },
  };

  const typeLabels: Record<string, string> = {
    suggestion: '功能建议',
    bug: '问题反馈',
    other: '其他',
  };

  return (
    <Screen title="意见反馈管理" canGoBack>
      {/* 状态筛选 */}
      <View style={styles.filterBar}>
        {(['all', 'pending', 'processed', 'rejected'] as StatusFilter[]).map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterBtn, statusFilter === status && styles.filterBtnActive]}
            onPress={() => handleFilter(status)}
          >
            <Text style={[styles.filterText, statusFilter === status && styles.filterTextActive]}>
              {status === 'all' ? '全部' : statusConfig[status].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.container}
        onScrollEndDrag={(e) => {
          const bottom = e.nativeEvent.contentOffset.y + e.nativeEvent.layoutMeasurement.height >= e.nativeEvent.contentSize.height - 100;
          if (bottom && !loading && list.length < total) {
            loadData(page + 1, statusFilter);
          }
        }}
      >
        {loading && list.length === 0 ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : list.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>暂无反馈记录</Text>
          </View>
        ) : (
          list.map((item) => {
            const statusInfo = statusConfig[item.status] || statusConfig.pending;
            return (
              <View key={item.id} style={styles.item}>
                <View style={styles.itemHeader}>
                  <View style={[styles.typeTag, { backgroundColor: item.type === 'bug' ? '#FEE2E2' : item.type === 'suggestion' ? '#DBEAFE' : '#F3F4F6' }]}>
                    <Text style={[styles.typeTagText, { color: item.type === 'bug' ? '#DC2626' : item.type === 'suggestion' ? '#2563EB' : '#6B7280' }]}>
                      {typeLabels[item.type] || '其他'}
                    </Text>
                  </View>
                  <View style={[styles.statusTag, { backgroundColor: statusInfo.bg }]}>
                    <Text style={[styles.statusTagText, { color: statusInfo.color }]}>
                      {statusInfo.label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.content}>{item.content}</Text>

                {item.contact && (
                  <Text style={styles.contact}>联系方式：{item.contact}</Text>
                )}

                {item.reply && (
                  <View style={styles.replyBox}>
                    <Text style={styles.replyLabel}>官方回复：</Text>
                    <Text style={styles.replyContent}>{item.reply}</Text>
                  </View>
                )}

                <View style={styles.itemFooter}>
                  <Text style={styles.userInfo}>
                    {item.user_nickname ? `用户: ${item.user_nickname}` : '游客'}
                  </Text>
                  <Text style={styles.date}>
                    {new Date(item.created_at).toLocaleDateString('zh-CN')}
                  </Text>
                </View>

                <TouchableOpacity style={styles.replyBtn} onPress={() => handleReply(item)}>
                  <Text style={styles.replyBtnText}>回复 / 处理</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* 回复弹窗 */}
      <Modal visible={replyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>回复反馈</Text>

            <Text style={styles.label}>处理状态</Text>
            <View style={styles.statusRow}>
              <TouchableOpacity
                style={[styles.statusOption, replyStatus === 'processed' && styles.statusOptionActive]}
                onPress={() => setReplyStatus('processed')}
              >
                <Text style={[styles.statusOptionText, replyStatus === 'processed' && styles.statusOptionTextActive]}>
                  已回复
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusOption, replyStatus === 'rejected' && styles.statusOptionActive]}
                onPress={() => setReplyStatus('rejected')}
              >
                <Text style={[styles.statusOptionText, replyStatus === 'rejected' && styles.statusOptionTextActive]}>
                  驳回
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>回复内容</Text>
            <TextInput
              style={styles.textArea}
              placeholder="请输入回复内容..."
              multiline
              numberOfLines={4}
              value={replyContent}
              onChangeText={setReplyContent}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setReplyModal(false)}>
                <Text style={styles.cancelBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSubmitReply}
                disabled={submitting}
              >
                <Text style={styles.submitBtnText}>{submitting ? '提交中...' : '提交'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  filterBtnActive: {
    backgroundColor: '#EEF2FF',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loading: {
    paddingTop: 60,
    alignItems: 'center',
  },
  empty: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  item: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  typeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 22,
    marginBottom: 8,
  },
  contact: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  replyBox: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  replyLabel: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 4,
  },
  replyContent: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  userInfo: {
    fontSize: 12,
    color: '#6B7280',
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  replyBtn: {
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    alignItems: 'center',
  },
  replyBtnText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  statusOptionActive: {
    backgroundColor: '#4F46E5',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlignVertical: 'top',
  },
  modalBtns: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    color: '#6B7280',
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#A5B4FC',
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
