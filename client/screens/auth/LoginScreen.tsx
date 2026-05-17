import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

interface Props {
  onSwitchToRegister: () => void;
}

// 七彩渐变颜色元组（液体流动感）
const RAINBOW_COLORS: [string, string, string, string, string, string, string, string, string] = [
  '#FF6B6B', // 红
  '#FF8E53', // 橙红
  '#FFA500', // 橙色
  '#FFD700', // 金色
  '#9ACD32', // 黄绿
  '#00CED1', // 青色
  '#1E90FF', // 蓝色
  '#9370DB', // 紫色
  '#FF69B4', // 粉色
];

export default function LoginScreen({ onSwitchToRegister }: Props) {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 流动动画
  const flowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 创建无限流动的动画
    const animation = Animated.loop(
      Animated.timing(flowAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: false,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const handleLogin = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert('提示', '密码至少6位');
      return;
    }

    setLoading(true);
    try {
      await login(phone, password);
    } catch (error: any) {
      Alert.alert('登录失败', error.message || '请检查手机号和密码');
    } finally {
      setLoading(false);
    }
  };

  // 计算流动渐变偏移
  const flowOffset = flowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo 区域 - 液体七彩标题 */}
          <View style={styles.logoSection}>
            <View style={styles.titleContainer}>
              <Animated.View
                style={[
                  styles.flowGradientBg,
                  {
                    transform: [{ translateX: flowOffset }],
                  },
                ]}
              >
                <LinearGradient
                  colors={RAINBOW_COLORS}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.flowGradient}
                />
              </Animated.View>
              <Text style={styles.appName}>流痕江湖</Text>
              {/* 覆盖层增强液体效果 */}
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shineOverlay}
              />
            </View>
            <Text style={styles.slogan}>人海为江湖，留言皆流痕</Text>
          </View>

          {/* 登录表单 - 玻璃拟态卡片 */}
          <View style={styles.formSection}>
            <LinearGradient
              colors={['rgba(255,248,240,0.95)', 'rgba(253,245,230,0.95)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.formGradient}
            >
              {/* 登录标题 - 七彩液体流动效果 */}
              <View style={styles.loginTitleContainer}>
                <Animated.View
                  style={[
                    styles.flowGradientBgSmall,
                    {
                      transform: [{ translateX: flowOffset }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={RAINBOW_COLORS}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.flowGradientSmall}
                  />
                </Animated.View>
                <Text style={styles.loginTitleText}>江湖登录</Text>
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.shineOverlaySmall}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>手机号</Text>
                <TextInput
                  style={styles.input}
                  placeholder="请输入手机号"
                  placeholderTextColor="rgba(205,133,63,0.7)"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={11}
                  autoComplete="tel"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>密码</Text>
                <TextInput
                  style={styles.input}
                  placeholder="请输入密码"
                  placeholderTextColor="rgba(205,133,63,0.7)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                />
              </View>

              {/* 渐变按钮 */}
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#FF8E53', '#FFA500', '#FFD700', '#00CED1', '#1E90FF', '#9370DB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>进入江湖</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* 注册链接 */}
              <TouchableOpacity
                style={styles.switchButton}
                onPress={onSwitchToRegister}
              >
                <Text style={styles.switchText}>
                  还没有江湖身份？
                </Text>
                <LinearGradient
                  colors={['#FF8E53', '#FFD700']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.switchLink}>立即注册</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* 底部提示 */}
          <Text style={styles.footerHint}>网页端建议优先使用移动端体验更佳</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E6',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 50,
  },
  titleContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: '#2C2C2C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  flowGradientBg: {
    position: 'absolute',
    top: 0,
    left: -100,
    right: 0,
    bottom: 0,
  },
  flowGradient: {
    width: 300,
    height: '100%',
  },
  shineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 80,
  },
  appName: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: 8,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  slogan: {
    fontSize: 18,
    fontWeight: '300',
    fontStyle: 'italic',
    letterSpacing: 3,
    color: '#8B4513',
    marginTop: 12,
  },
  formSection: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  formGradient: {
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  loginTitleContainer: {
    position: 'relative',
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 16,
    marginBottom: 28,
  },
  flowGradientBgSmall: {
    position: 'absolute',
    top: 0,
    left: -100,
    right: 0,
    bottom: 0,
  },
  flowGradientSmall: {
    width: 250,
    height: '100%',
  },
  shineOverlaySmall: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 60,
  },
  loginTitleText: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 6,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '400',
    color: '#A0522D',
    marginBottom: 10,
    textShadowColor: 'rgba(255,215,0,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
  },
  input: {
    backgroundColor: 'rgba(237,232,220,0.8)',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#5D4037',
    borderWidth: 1,
    borderColor: 'rgba(205,133,63,0.2)',
  },
  loginButton: {
    marginTop: 20,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 28,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 4,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  switchButton: {
    marginTop: 28,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  switchText: {
    fontSize: 14,
    color: '#8B4513',
  },
  switchLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textDecorationLine: 'underline',
    textDecorationColor: '#FFD700',
  },
  footerHint: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(160,82,45,0.6)',
    fontWeight: '300',
  },
});
