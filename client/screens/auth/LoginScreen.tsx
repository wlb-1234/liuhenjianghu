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
      
      {/* 深色背景 + 金色光点 */}
      <View style={styles.background}>
        <LinearGradient
          colors={['#0D0D15', '#0A0A10', '#080810']}
          style={styles.gradient}
        />
        {/* 金色飞溅点 */}
        <View style={[styles.splash, styles.splash1]} />
        <View style={[styles.splash, styles.splash2]} />
        <View style={[styles.splash, styles.splash3]} />
        <View style={[styles.splash, styles.splash4]} />
        <View style={[styles.splash, styles.splash5]} />
        <View style={[styles.splash, styles.splash6]} />
        <View style={[styles.splash, styles.splash7]} />
        <View style={[styles.splash, styles.splash8]} />
        {/* 金色光斑 */}
        <View style={[styles.glow, styles.glow1]} />
        <View style={[styles.glow, styles.glow2]} />
        <View style={[styles.glow, styles.glow3]} />
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
          {/* 主标题 - 横排显示 */}
          <View style={styles.titleContainer}>
            <Text style={styles.mainTitle}>流痕江湖</Text>
          </View>

          {/* 副标题 - 一行显示 */}
          <View style={styles.subtitleContainer}>
            <Text style={styles.arrow}>◀</Text>
            <Text style={styles.subtitleText}>人海为江湖，留言皆流痕</Text>
            <Text style={styles.arrow}>▶</Text>
          </View>

          {/* 登录框 - 金色边框 */}
          <View style={styles.loginBox}>
            <LinearGradient
              colors={['#D4AF37', '#FFD700', '#D4AF37']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.goldenBorder}
            >
              <View style={styles.innerBox}>
                {/* 标题 - 江湖登录 */}
                <Text style={styles.boxTitle}>江湖登录</Text>

                {/* 手机号输入 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>手机号</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.icon}>📱</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="请输入手机号"
                      placeholderTextColor="#666"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      autoComplete="tel"
                    />
                  </View>
                </View>

                {/* 密码输入 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>密码</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.icon}>🔒</Text>
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
                    colors={['#D4AF37', '#FFD700', '#DAA520']}
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
                <View style={styles.registerRow}>
                  <Text style={styles.registerText}>还没有账号？</Text>
                  <TouchableOpacity onPress={() => router.push('/register')}>
                    <Text style={styles.registerLink}>立即注册</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
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
  background: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  splash: {
    position: 'absolute',
    backgroundColor: '#D4AF37',
    borderRadius: 100,
  },
  splash1: { width: 6, height: 6, top: '8%', left: '15%', opacity: 0.6 },
  splash2: { width: 4, height: 4, top: '12%', right: '20%', opacity: 0.5 },
  splash3: { width: 8, height: 8, top: '25%', left: '8%', opacity: 0.4 },
  splash4: { width: 5, height: 5, top: '35%', right: '10%', opacity: 0.55 },
  splash5: { width: 7, height: 7, bottom: '30%', left: '12%', opacity: 0.5 },
  splash6: { width: 4, height: 4, bottom: '25%', right: '18%', opacity: 0.6 },
  splash7: { width: 6, height: 6, bottom: '15%', left: '25%', opacity: 0.45 },
  splash8: { width: 5, height: 5, bottom: '20%', right: '8%', opacity: 0.5 },
  glow: {
    position: 'absolute',
    backgroundColor: '#D4AF37',
    borderRadius: 100,
  },
  glow1: { width: 150, height: 150, top: '-30%', right: '-20%', opacity: 0.04 },
  glow2: { width: 200, height: 200, bottom: '-40%', left: '-30%', opacity: 0.05 },
  glow3: { width: 100, height: 100, top: '50%', left: '60%', opacity: 0.03 },
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
    paddingHorizontal: 40,
    paddingVertical: 10,
    marginBottom: 5,
  },
  titleContainer: {
    marginTop: 60,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    letterSpacing: 2,
    includeFontPadding: false,
    textShadowColor: 'rgba(255, 215, 0, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 25,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 50,
  },
  arrow: {
    fontSize: 10,
    color: '#D4AF37',
    marginHorizontal: 8,
  },
  subtitleText: {
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    fontWeight: '300',
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
  },
  registerText: {
    fontSize: 14,
    color: '#666',
  },
  registerLink: {
    fontSize: 14,
    color: '#D4AF37',
    marginLeft: 6,
    fontWeight: 'bold',
  },
});
