import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import api from '@/services/api';

export default function ForgotPasswordScreen() {
  const router = useSafeRouter();
  const [step, setStep] = useState<'phone' | 'reset'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeCooldown, setCodeCooldown] = useState(0);

  useEffect(() => {
    if (codeCooldown <= 0) return;
    const timer = setTimeout(() => setCodeCooldown(codeCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [codeCooldown]);

  const handleSendCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }

    setCodeLoading(true);
    try {
      await api.sendCode(phone);
      Alert.alert('提示', '验证码已发送');
      setCodeCooldown(60);
      setStep('reset');
    } catch (error: any) {
      Alert.alert('发送失败', error.message || '请稍后重试');
    } finally {
      setCodeLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code || code.length !== 6) {
      Alert.alert('提示', '请输入6位验证码');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('提示', '密码至少6位');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('提示', '两次密码不一致');
      return;
    }

    setLoading(true);
    try {
      /**
       * 服务端文件：server/src/routes/auth.ts
       * 接口：POST /api/v1/auth/forgot-password
       * Body 参数：phone: string, code: string, newPassword: string
       */
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '密码重置失败');
      }

      Alert.alert('成功', '密码重置成功，请重新登录', [
        { text: '确定', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('失败', error.message || '密码重置失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0D0D15', '#0A0A10', '#080810']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.background}
      >
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* 标题 */}
              <View style={styles.titleContainer}>
                <Text style={styles.mainTitle}>重置密码</Text>
              </View>

              {/* 登录框 */}
              <View style={styles.loginBox}>
                <LinearGradient
                  colors={['#D4AF37', '#FFD700', '#D4AF37']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.goldenBorder}
                >
                  <View style={styles.innerBox}>
                    {step === 'phone' ? (
                      <>
                        <Text style={styles.boxTitle}>验证手机号</Text>

                        {/* 手机号输入 */}
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>手机号</Text>
                          <View style={styles.inputWrapper}>
                            <Text style={styles.icon}>📱</Text>
                            <TextInput
                              style={styles.input}
                              placeholder="请输入注册时的手机号"
                              placeholderTextColor="#666"
                              value={phone}
                              onChangeText={setPhone}
                              keyboardType="phone-pad"
                            />
                          </View>
                        </View>

                        {/* 发送验证码按钮 */}
                        <TouchableOpacity
                          style={styles.loginButton}
                          onPress={handleSendCode}
                          disabled={codeLoading}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={['#D4AF37', '#FFD700', '#DAA520']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.buttonGradient}
                          >
                            <Text style={styles.buttonText}>
                              {codeLoading ? '发送中...' : '获取验证码'}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <Text style={styles.boxTitle}>设置新密码</Text>

                        {/* 验证码输入 */}
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>验证码</Text>
                          <View style={styles.inputWrapper}>
                            <Text style={styles.icon}>🔑</Text>
                            <TextInput
                              style={styles.input}
                              placeholder="请输入6位验证码"
                              placeholderTextColor="#666"
                              value={code}
                              onChangeText={setCode}
                              keyboardType="number-pad"
                              maxLength={6}
                            />
                          </View>
                        </View>

                        {/* 新密码输入 */}
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>新密码</Text>
                          <View style={styles.inputWrapper}>
                            <Text style={styles.icon}>🔒</Text>
                            <TextInput
                              style={styles.input}
                              placeholder="请输入新密码（至少6位）"
                              placeholderTextColor="#666"
                              value={newPassword}
                              onChangeText={setNewPassword}
                              secureTextEntry
                            />
                          </View>
                        </View>

                        {/* 确认密码输入 */}
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>确认密码</Text>
                          <View style={styles.inputWrapper}>
                            <Text style={styles.icon}>🔒</Text>
                            <TextInput
                              style={styles.input}
                              placeholder="请再次输入新密码"
                              placeholderTextColor="#666"
                              value={confirmPassword}
                              onChangeText={setConfirmPassword}
                              secureTextEntry
                            />
                          </View>
                        </View>

                        {/* 重置密码按钮 */}
                        <TouchableOpacity
                          style={styles.loginButton}
                          onPress={handleResetPassword}
                          disabled={loading}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={['#D4AF37', '#FFD700', '#DAA520']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.buttonGradient}
                          >
                            <Text style={styles.buttonText}>
                              {loading ? '重置中...' : '确认重置'}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>

                        {/* 重新发送验证码 */}
                        <View style={styles.resendRow}>
                          {codeCooldown > 0 ? (
                            <Text style={styles.resendText}>
                              {codeCooldown}秒后可重新发送
                            </Text>
                          ) : (
                            <TouchableOpacity onPress={handleSendCode}>
                              <Text style={styles.resendLink}>重新发送验证码</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </>
                    )}

                    {/* 返回登录 */}
                    <View style={styles.registerRow}>
                      <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.registerLink}>返回登录</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 30,
  },
  titleContainer: {
    marginTop: 40,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 215, 0, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 25,
  },
  loginBox: {
    width: '100%',
    maxWidth: 340,
  },
  goldenBorder: {
    padding: 2,
    borderRadius: 14,
  },
  innerBox: {
    backgroundColor: 'rgba(15, 15, 22, 0.98)',
    borderRadius: 12,
    padding: 28,
  },
  boxTitle: {
    fontSize: 22,
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: 'bold',
    letterSpacing: 6,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    color: '#D4AF37',
    marginBottom: 8,
    letterSpacing: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A22',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#B8860B',
    paddingHorizontal: 16,
    height: 50,
  },
  icon: {
    fontSize: 18,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    padding: 0,
  },
  loginButton: {
    marginTop: 26,
    marginBottom: 22,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 12,
  },
  buttonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A0A10',
    letterSpacing: 6,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  registerLink: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -10,
    marginBottom: 10,
  },
  resendText: {
    fontSize: 13,
    color: '#666',
  },
  resendLink: {
    fontSize: 13,
    color: '#B8860B',
  },
});
