import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { useAuthStore } from '@/contexts/AuthContext';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

export default function RealnameScreen() {
  const { user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState<any>(null);
  const [realName, setRealName] = useState('');
  const [idCard, setIdCard] = useState('');

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/realname/status`, {
        headers: {
          'x-session': user?.session_token || '',
        },
      });
      const data = await response.json();
      setStatus(data);
    } catch (error: any) {
      console.error('检查认证状态失败:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      Alert.alert('提示', '请先登录');
      return;
    }

    if (!realName.trim()) {
      Alert.alert('错误', '请输入真实姓名');
      return;
    }

    if (!idCard.trim()) {
      Alert.alert('错误', '请输入身份证号');
      return;
    }

    // 简单验证
    if (!/^\d{17}[\dXx]$/.test(idCard)) {
      Alert.alert('错误', '身份证格式不正确');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/realname`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session': user?.session_token || '',
        },
        body: JSON.stringify({
          realName: realName.trim(),
          idCard: idCard.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '提交失败');
      }

      Alert.alert('提交成功', '您的实名认证申请已提交，请等待审核', [
        { text: '确定', onPress: checkStatus },
      ]);
      setRealName('');
      setIdCard('');
    } catch (error: any) {
      Alert.alert('提交失败', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C9A96E" />
        </View>
      </Screen>
    );
  }

  // 已认证状态
  if (status?.verified) {
    return (
      <Screen>
        <ScrollView style={styles.container}>
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>✓</Text>
            </View>
            <Text style={styles.successTitle}>已实名认证</Text>
            <Text style={styles.successSubtitle}>
              姓名：{status.real_name}
            </Text>
            <Text style={styles.successNote}>
              您已完成实名认证，享有更多权益
            </Text>
          </View>

          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>实名认证权益</Text>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>发布漂流信更易被回复</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>参与江湖活动资格</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>提升账号可信度</Text>
            </View>
          </View>
        </ScrollView>
      </Screen>
    );
  }

  // 待审核状态
  if (status?.status === 'pending') {
    return (
      <Screen>
        <ScrollView style={styles.container}>
          <View style={styles.pendingCard}>
            <View style={styles.pendingIcon}>
              <Text style={styles.pendingIconText}>⏳</Text>
            </View>
            <Text style={styles.pendingTitle}>审核中</Text>
            <Text style={styles.pendingSubtitle}>
              您的实名认证申请正在审核中，请耐心等待
            </Text>
            <Text style={styles.pendingNote}>
              通常审核需要1-3个工作日
            </Text>
          </View>

          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>审核须知</Text>
            <Text style={styles.tipText}>1. 请确保填写的姓名与身份证信息一致</Text>
            <Text style={styles.tipText}>2. 审核结果将通过站内消息通知</Text>
            <Text style={styles.tipText}>3. 如有疑问请联系客服</Text>
          </View>
        </ScrollView>
      </Screen>
    );
  }

  // 被拒绝状态
  if (status?.status === 'rejected') {
    return (
      <Screen>
        <ScrollView style={styles.container}>
          <View style={styles.rejectedCard}>
            <View style={styles.rejectedIcon}>
              <Text style={styles.rejectedIconText}>✗</Text>
            </View>
            <Text style={styles.rejectedTitle}>认证被拒绝</Text>
            <Text style={styles.rejectedSubtitle}>
              原因：{status.reject_reason || '信息填写有误'}
            </Text>
            <Text style={styles.rejectedNote}>
              您可以重新提交认证申请
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>重新认证</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>真实姓名</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入真实姓名"
                value={realName}
                onChangeText={setRealName}
                autoCapitalize="characters"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>身份证号</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入18位身份证号"
                value={idCard}
                onChangeText={setIdCard}
                keyboardType="numeric"
                maxLength={18}
              />
            </View>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>重新提交</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Screen>
    );
  }

  // 未认证 - 显示认证表单
  return (
    <Screen>
      <ScrollView style={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>实名认证</Text>
          <Text style={styles.headerSubtitle}>
            完成实名认证，享有更多江湖权益
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>真实姓名</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入真实姓名"
              value={realName}
              onChangeText={setRealName}
              autoCapitalize="characters"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>身份证号</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入18位身份证号"
              value={idCard}
              onChangeText={setIdCard}
              keyboardType="numeric"
              maxLength={18}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>提交认证</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>认证须知</Text>
          <Text style={styles.tipText}>1. 您的个人信息将受到严格保护</Text>
          <Text style={styles.tipText}>2. 认证信息仅用于身份验证</Text>
          <Text style={styles.tipText}>3. 审核通常需要1-3个工作日</Text>
          <Text style={styles.tipText}>4. 认证成功后可在江湖中展示身份</Text>
        </View>

        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>认证权益</Text>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>发布漂流信更易被回复</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>参与江湖活动资格</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>提升账号可信度</Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  headerCard: {
    backgroundColor: '#1E3A5F',
    padding: 24,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  formCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: -20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  submitButton: {
    backgroundColor: '#C9A96E',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 24,
  },
  benefitsCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitIcon: {
    color: '#52C41A',
    fontSize: 16,
    marginRight: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#666',
  },
  // 成功状态
  successCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#52C41A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successIconText: {
    color: '#fff',
    fontSize: 32,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#52C41A',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  successNote: {
    fontSize: 14,
    color: '#666',
  },
  // 待审核状态
  pendingCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  pendingIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FAAD14',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  pendingIconText: {
    fontSize: 32,
  },
  pendingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FAAD14',
    marginBottom: 8,
  },
  pendingSubtitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  pendingNote: {
    fontSize: 14,
    color: '#666',
  },
  // 被拒绝状态
  rejectedCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  rejectedIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF4D4F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  rejectedIconText: {
    color: '#fff',
    fontSize: 32,
  },
  rejectedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF4D4F',
    marginBottom: 8,
  },
  rejectedSubtitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  rejectedNote: {
    fontSize: 14,
    color: '#666',
  },
});
