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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  onSwitchToRegister: () => void;
}

export default function LoginScreen({ onSwitchToRegister }: Props) {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
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
    <View style={{ flex: 1, backgroundColor: '#0D0D0F' }}>
      {/* 左上角水纹标志 */}
      <View style={[styles.logoCorner, { top: insets.top + 10, left: 16 }]}>
        <Image
          source={require('@/assets/logo-water.png')}
          style={styles.logoCornerImage}
          resizeMode="contain"
        />
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo 区域 */}
          <View style={styles.logoSection}>
            <Text style={styles.appName}>流痕江湖</Text>
            <Text style={styles.slogan}>人海为江湖，留言皆流痕</Text>
          </View>

          {/* 登录表单 */}
          <View style={styles.formSection}>
            <View
              style={{
                borderRadius: 28,
                padding: 28,
                borderWidth: 1.5,
                borderColor: 'rgba(212,175,55,0.4)',
                backgroundColor: 'rgba(26,26,31,0.98)',
              }}
            >
              <Text style={styles.loginTitle}>江湖登录</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>手机号</Text>
                <TextInput
                  style={{
                    backgroundColor: 'rgba(31,31,36,0.9)',
                    borderRadius: 16,
                    padding: 16,
                    fontSize: 16,
                    color: '#E8E4DC',
                    borderWidth: 1,
                    borderColor: 'rgba(212,175,55,0.3)',
                  }}
                  placeholder="请输入手机号"
                  placeholderTextColor="rgba(138,133,128,0.7)"
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
                  style={{
                    backgroundColor: 'rgba(31,31,36,0.9)',
                    borderRadius: 16,
                    padding: 16,
                    fontSize: 16,
                    color: '#E8E4DC',
                    borderWidth: 1,
                    borderColor: 'rgba(212,175,55,0.3)',
                  }}
                  placeholder="请输入密码"
                  placeholderTextColor="rgba(138,133,128,0.7)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                />
              </View>

              {/* 按钮 */}
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#B8960C', '#D4AF37', '#E8C97D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 18,
                    alignItems: 'center',
                    borderRadius: 28,
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="#0D0D0F" />
                  ) : (
                    <Text style={{ color: '#0D0D0F', fontSize: 22, fontWeight: '700', letterSpacing: 4 }}>进入江湖</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchButton}
                onPress={onSwitchToRegister}
              >
                <Text style={styles.switchText}>还没有江湖身份？</Text>
                <Text style={styles.switchLink}>立即注册</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.footerHint}>网页端建议优先使用移动端体验更佳</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  logoCorner: {
    position: 'absolute',
    zIndex: 10,
  },
  logoCornerImage: {
    width: 80,
    height: 40,
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
  appName: {
    fontSize: 48,
    fontWeight: '800',
    color: '#D4AF37',  // 黄金色
    letterSpacing: 6,
    marginBottom: 12,
    textShadowColor: 'rgba(212,175,55,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  slogan: {
    fontSize: 14,
    color: '#8A8580',  // 暗灰文字
    letterSpacing: 4,
    fontStyle: 'italic',
    fontWeight: '300',
  },
  formSection: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  formGradient: {
    borderRadius: 28,
    padding: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.4)',  // 金色边框
    backgroundColor: 'rgba(26,26,31,0.95)',  // 深灰背景
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#D4AF37',  // 黄金色
    textAlign: 'center',
    marginBottom: 28,
    letterSpacing: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    color: '#E8C97D',  // 浅金色
    marginBottom: 10,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(31,31,36,0.8)',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#E8E4DC',  // 月白文字
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',  // 金色边框
  },
  loginButton: {
    marginTop: 20,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#D4AF37',
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
    color: '#0D0D0F',  // 墨黑色
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
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
    fontSize: 12,
    color: '#8A8580',  // 暗灰
  },
  switchLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D4AF37',  // 黄金色
  },
  footerHint: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(138,133,128,0.6)',  // 暗灰
    fontWeight: '300',
  },
});
