import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeRouter } from '@/hooks/useSafeRouter';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'https://liuhenjianghu.com';

type FeedbackType = 'suggestion' | 'bug' | 'other';

const typeLabels: Record<FeedbackType, string> = {
  suggestion: '功能建议',
  bug: '问题反馈',
  other: '其他',
};

interface FeedbackItem {
  id: number;
  type: FeedbackType;
  content: string;
  status: string;
  reply: string | null;
  created_at: string;
}

export default function FeedbackScreen() {
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('suggestion');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(false);

  const { session } = useAuth();
  const router = useSafeRouter();

  // 加载历史反馈
  const loadHistory = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/feedbacks/my`, {
        headers: { 'x-session': session },
      });
      const data = await res.json();
      if (data.data) {
        setHistory(data.data);
      }
    } catch (err) {
      console.error('加载历史失败', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'history') {
        loadHistory();
      }
    }, [activeTab, loadHistory])
  );

  // 提交反馈
  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('提示', '请输入反馈内容');
      return;
    }
    if (content.length > 1000) {
      Alert.alert('提示', '反馈内容不能超过1000字');
      return;
    }
    if (!session) {
      Alert.alert('提示', '请先登录');
      router.navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/feedbacks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session': session,
        },
        body: JSON.stringify({
          type: feedbackType,
          content: content.trim(),
          contact: contact.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('提交成功', '感谢您的反馈，我们会尽快处理！', [
          { text: '确定', onPress: () => {
            setContent('');
            setContact('');
            setFeedbackType('suggestion');
            setActiveTab('history');
          }},
        ]);
      } else {
        Alert.alert('提交失败', data.error || '请稍后重试');
      }
    } catch (err) {
      Alert.alert('提交失败', '网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const statusLabel: Record<string, { text: string; color: string }> = {
    pending: { text: '待处理', color: '#F59E0B' },
    processed: { text: '已回复', color: '#10B981' },
    rejected: { text: '已驳回', color: '#EF4444' },
  };

  return (
    <Screen title="意见反馈" canGoBack>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Tab 切换 */}
        <View style={styles.tabBar}>
          {(['submit', 'history'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'submit' ? '提交反馈' : '我的反馈'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'submit' ? (
          <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
            {/* 反馈类型 */}
            <Text style={styles.label}>反馈类型</Text>
            <View style={styles.typeRow}>
              {(Object.keys(typeLabels) as FeedbackType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeBtn, feedbackType === type && styles.typeBtnActive]}
                  onPress={() => setFeedbackType(type)}
                >
                  <Text style={[styles.typeBtnText, feedbackType === type && styles.typeBtnTextActive]}>
                    {typeLabels[type]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 反馈内容 */}
            <Text style={styles.label}>反馈内容 *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="请详细描述您的建议或遇到的问题..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={content}
              onChangeText={(text) => setContent(text.slice(0, 1000))}
            />
            <Text style={styles.charCount}>{content.length}/1000</Text>

            {/* 联系方式 */}
            <Text style={styles.label}>联系方式（选填）</Text>
            <TextInput
              style={styles.input}
              placeholder="手机号或邮箱，方便我们联系您"
              placeholderTextColor="#9CA3AF"
              value={contact}
              onChangeText={setContact}
            />

            {/* 提交按钮 */}
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitBtnText}>
                {submitting ? '提交中...' : '提交反馈'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <ScrollView style={styles.historyList}>
            {loading ? (
              <Text style={styles.emptyText}>加载中...</Text>
            ) : history.length === 0 ? (
              <Text style={styles.emptyText}>暂无反馈记录</Text>
            ) : (
              history.map((item) => {
                const statusInfo = statusLabel[item.status] || statusLabel.pending;
                return (
                  <View key={item.id} style={styles.historyItem}>
                    <View style={styles.historyHeader}>
                      <View style={[styles.typeTag, { backgroundColor: item.type === 'bug' ? '#FEE2E2' : item.type === 'suggestion' ? '#DBEAFE' : '#F3F4F6' }]}>
                        <Text style={[styles.typeTagText, { color: item.type === 'bug' ? '#DC2626' : item.type === 'suggestion' ? '#2563EB' : '#6B7280' }]}>
                          {typeLabels[item.type]}
                        </Text>
                      </View>
                      <Text style={[styles.statusText, { color: statusInfo.color }]}>
                        {statusInfo.text}
                      </Text>
                    </View>
                    <Text style={styles.historyContent}>{item.content}</Text>
                    {item.reply && (
                      <View style={styles.replyBox}>
                        <Text style={styles.replyLabel}>官方回复：</Text>
                        <Text style={styles.replyContent}>{item.reply}</Text>
                      </View>
                    )}
                    <Text style={styles.historyDate}>
                      {new Date(item.created_at).toLocaleDateString('zh-CN')}
                    </Text>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
  },
  tabText: {
    fontSize: 15,
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  typeBtnText: {
    fontSize: 13,
    color: '#6B7280',
  },
  typeBtnTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  submitBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  submitBtnDisabled: {
    backgroundColor: '#A5B4FC',
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  historyList: {
    flex: 1,
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 40,
  },
  historyItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  historyContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  replyBox: {
    marginTop: 12,
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
  historyDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 10,
  },
});
