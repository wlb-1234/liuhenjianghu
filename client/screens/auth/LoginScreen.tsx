import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeRouter } from '@/hooks/useSafeRouter';

export default function LoginScreen() {
  const router = useSafeRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      alert('请输入手机号和密码');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await response.json();
      if (response.ok) {
        router.replace('/');
      } else {
        alert(data.error || '登录失败');
      }
    } catch (error) {
      alert('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
      
      {/* 背景装饰 - 金色光点 */}
      <View style={styles.backgroundEffects}>
        <View style={[styles.goldDot, styles.dot1]} />
        <View style={[styles.goldDot, styles.dot2]} />
        <View style={[styles.goldDot, styles.dot3]} />
        <View style={[styles.goldDot, styles.dot4]} />
        <View style={[styles.goldDot, styles.dot5]} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 主标题 - 书法风格金色渐变 */}
          <LinearGradient
            colors={['#D4AF37', '#FFD700', '#D4AF37', '#B8860B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.titleGradient}
          >
            <Text style={styles.mainTitle}>流痕江湖</Text>
          </LinearGradient>

          {/* 副标题 - 国风宋体风格 */}
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitleArrow}>◀</Text>
            <Text style={styles.subtitleText}>人海为江湖，留言皆流痕</Text>
            <Text style={styles.subtitleArrow}>▶</Text>
          </View>

          {/* 登录卡片 */}
          <View style={styles.loginCard}>
            {/* 卡片标题 */}
            <Text style={styles.cardTitle}>江湖登录</Text>

            {/* 手机号输入 */}
            <View style={styles.inputContainer}>
              <View style={styles.inputLabel}>
                <Text style={styles.labelText}>手机号</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.input}
                  placeholder="请输入手机号"
                  placeholderTextColor="#666"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* 密码输入 */}
            <View style={styles.inputContainer}>
              <View style={styles.inputLabel}>
                <Text style={styles.labelText}>密码</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="请输入密码"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            {/* 登录按钮 */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#D4AF37', '#FFD700', '#B8860B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {loading ? '登录中...' : '进入江湖'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* 注册链接 */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>还没有账号？</Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.registerLink}>立即注册</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  backgroundEffects: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  goldDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D4AF37',
    opacity: 0.4,
  },
  dot1: { top: '10%', left: '15%' },
  dot2: { top: '25%', right: '20%' },
  dot3: { top: '45%', left: '8%' },
  dot4: { bottom: '35%', right: '12%' },
  dot5: { bottom: '20%', left: '25%' },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  titleGradient: {
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 8,
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(255, 215, 0, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    letterSpacing: 8,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
  subtitleArrow: {
    fontSize: 12,
    color: '#D4AF37',
    marginHorizontal: 8,
  },
  subtitleText: {
    fontSize: 14,
    color: '#D4AF37',
    letterSpacing: 2,
  },
  loginCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(30, 30, 35, 0.95)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 20,
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 6,
  },
  labelText: {
    fontSize: 12,
    color: '#888',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1F',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#FFF',
    padding: 0,
  },
  loginButton: {
    marginTop: 20,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1A1A1F',
    letterSpacing: 2,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 13,
    color: '#666',
  },
  registerLink: {
    fontSize: 13,
    color: '#D4AF37',
    marginLeft: 4,
    fontWeight: 'bold',
  },
});
