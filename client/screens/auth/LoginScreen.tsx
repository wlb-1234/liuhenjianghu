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
      
      {/* 水墨背景效果 */}
      <View style={styles.inkBackground}>
        <LinearGradient
          colors={['rgba(20,20,30,0.9)', 'rgba(10,10,15,1)', 'rgba(5,5,10,1)']}
          style={styles.inkGradient}
        />
        {/* 金色墨点装饰 */}
        <View style={[styles.inkSplash, styles.splash1]} />
        <View style={[styles.inkSplash, styles.splash2]} />
        <View style={[styles.inkSplash, styles.splash3]} />
        <View style={[styles.inkSplash, styles.splash4]} />
        <View style={[styles.inkSplash, styles.splash5]} />
        <View style={[styles.inkSplash, styles.splash6]} />
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
          {/* 主标题 - 烫金色书法风格 */}
          <LinearGradient
            colors={['#B8860B', '#FFD700', '#D4AF37', '#B8860B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.titleGradient}
          >
            <Text style={styles.mainTitle}>流痕江湖</Text>
          </LinearGradient>

          {/* 副标题 - 国风风格 */}
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitleArrow}>◀</Text>
            <Text style={styles.subtitleText}>人海为江湖，留言皆流痕</Text>
            <Text style={styles.subtitleArrow}>▶</Text>
          </View>

          {/* 登录卡片 - 金色边框 */}
          <View style={styles.loginCard}>
            {/* 金色装饰边框 */}
            <View style={styles.cardBorder}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            
            {/* 卡片标题 */}
            <Text style={styles.cardTitle}>江湖登录</Text>

            {/* 手机号输入 */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIconPhone}>📱</Text>
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
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIconLock}>🔒</Text>
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

            {/* 登录按钮 - 金色发光 */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#B8860B', '#FFD700', '#D4AF37', '#B8860B']}
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
  inkBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  inkGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  inkSplash: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: '#D4AF37',
  },
  splash1: { width: 80, height: 80, top: '5%', left: '-5%', opacity: 0.08 },
  splash2: { width: 120, height: 120, top: '15%', right: '-8%', opacity: 0.06 },
  splash3: { width: 60, height: 60, top: '40%', left: '5%', opacity: 0.05 },
  splash4: { width: 100, height: 100, bottom: '25%', right: '0%', opacity: 0.07 },
  splash5: { width: 70, height: 70, bottom: '10%', left: '10%', opacity: 0.06 },
  splash6: { width: 90, height: 90, top: '60%', right: '5%', opacity: 0.04 },
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
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
  },
  mainTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(255, 215, 0, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 25,
    letterSpacing: 10,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 50,
  },
  subtitleArrow: {
    fontSize: 14,
    color: '#D4AF37',
    marginHorizontal: 12,
  },
  subtitleText: {
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 3,
    fontWeight: '300',
  },
  loginCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(20, 20, 28, 0.95)',
    borderRadius: 12,
    padding: 30,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 15,
  },
  cardBorder: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  corner: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderColor: '#D4AF37',
  },
  cornerTL: { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2 },
  cardTitle: {
    fontSize: 22,
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: 'bold',
    letterSpacing: 6,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15151A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B8860B',
    paddingHorizontal: 15,
    height: 52,
  },
  inputIconPhone: {
    fontSize: 20,
    marginRight: 12,
  },
  inputIconLock: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    padding: 0,
  },
  loginButton: {
    marginTop: 25,
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1F',
    letterSpacing: 4,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#888',
  },
  registerLink: {
    fontSize: 14,
    color: '#D4AF37',
    marginLeft: 5,
    fontWeight: 'bold',
  },
});
