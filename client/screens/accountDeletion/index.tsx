import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeRouter } from '@/hooks/useSafeRouter';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:8080';

export default function AccountDeletionScreen() {
  const { user, logout, token } = useAuth();
  const router = useSafeRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleRequestDeletion = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/account/request-deletion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
      });
      const data = await res.json();
      
      if (data.success) {
        Alert.alert(
          '申请已提交',
          '您的账户注销申请已提交。账号将在7天后自动永久注销，届时所有数据将无法恢复。',
          [{ text: '确定' }]
        );
      } else {
        Alert.alert('操作失败', data.message || '请稍后重试');
      }
    } catch (error) {
      Alert.alert('错误', '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDeletion = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/account/cancel-deletion`, {
        method: 'POST',
        headers: {
          'x-session': session || '',
        },
      });
      const data = await res.json();
      
      if (data.success) {
        Alert.alert('已撤销', '账户注销申请已撤销，您的账号恢复正常使用。', [
          { text: '确定', onPress: () => setStep(1) },
        ]);
      } else {
        Alert.alert('操作失败', data.message || '请稍后重试');
      }
    } catch (error) {
      Alert.alert('错误', '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmLogout = async () => {
    Alert.alert(
      '确认注销',
      '注销后您的账号将在7天内被永久删除。确定要退出登录吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '确认退出', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        },
      ]
    );
  };

  return (
    <Screen>
      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>账户注销说明</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>一、注销条件</Text>
            <Text style={styles.text}>• 账户已完成注册并处于正常使用状态</Text>
            <Text style={styles.text}>• 账户内没有未完成的交易或纠纷</Text>
            <Text style={styles.text}>• 账户余额已清零或已完成退款</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>二、注销后果</Text>
            <Text style={styles.text}>• 您的个人资料、历史发布内容将被永久删除</Text>
            <Text style={styles.text}>• 账户无法恢复，所有权益将自动失效</Text>
            <Text style={styles.text}>• 注销后相同手机号需等待30天才能重新注册</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>三、注销流程</Text>
            <Text style={styles.text}>1. 点击下方「申请注销」按钮</Text>
            <Text style={styles.text}>2. 确认退出登录</Text>
            <Text style={styles.text}>3. 账户进入7天冷静期</Text>
            <Text style={styles.text}>4. 冷静期结束后自动永久注销</Text>
          </View>
        </View>

        <View style={styles.warningCard}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningTitle}>重要提示</Text>
          <Text style={styles.warningText}>
            注销申请提交后，在7天冷静期内如未取消，账户将自动被永久删除，届时所有数据将无法恢复，请谨慎操作。
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          {step === 1 ? (
            <>
              <TouchableOpacity
                style={styles.dangerButton}
                onPress={() => setStep(2)}
                disabled={loading}
              >
                <Text style={styles.dangerButtonText}>
                  {loading ? '处理中...' : '申请注销'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.warningButton}
                onPress={handleRequestDeletion}
                disabled={loading}
              >
                <Text style={styles.warningButtonText}>
                  {loading ? '处理中...' : '确认申请注销'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setStep(1)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>返回</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 4,
  },
  warningCard: {
    backgroundColor: '#FFF7E6',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#795548',
    lineHeight: 22,
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  dangerButton: {
    backgroundColor: '#dc3545',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  warningButton: {
    backgroundColor: '#dc3545',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  warningButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  backButton: {
    padding: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
});
