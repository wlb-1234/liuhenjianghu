import React, { useState } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

interface Props {
  onSwitchToRegister: () => void;
}

export default function LoginScreen({ onSwitchToRegister }: Props) {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
          {/* Logo 区域 - 渐变彩色标题 */}
          <View style={styles.logoSection}>
            <LinearGradient
              colors={['#FF8C00', '#FFD700', '#CD853F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.titleGradient}
            >
              <Text style={styles.titleShadow}>流痕江湖</Text>
            </LinearGradient>
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
              {/* 登录标题 - 渐变彩色 */}
              <LinearGradient
                colors={['#FF7F50', '#FFD700']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginTitleGradient}
              >
                <Text style={styles.loginTitleText}>江湖登录</Text>
              </LinearGradient>
              
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
                  colors={['#D2691E', '#FF8C00', '#FFD700']}
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
                  colors={['#FF8C00', '#FFD700']}
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
  titleGradient: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  titleShadow: {
    fontSize: 48,
    fontWeight: '400',
    letterSpacing: 8,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  slogan: {
    fontSize: 20,
    fontWeight: '300',
    fontStyle: 'italic',
    letterSpacing: 4,
    color: '#8B4513',
    marginTop: 8,
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
  loginTitleGradient: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 28,
  },
  loginTitleText: {
    fontSize: 32,
    fontWeight: '400',
    letterSpacing: 6,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 28,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '500',
    letterSpacing: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
