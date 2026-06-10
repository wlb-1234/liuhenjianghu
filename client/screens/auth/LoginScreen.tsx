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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeRouter } from '@/hooks/useSafeRouter';

export default function LoginScreen() {
  const router = useSafeRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // 登录逻辑
    router.replace('/(tabs)');
  };

  const handleRegister = () => {
    router.push('/register');
  };

  return (
    <View style={styles.container}>
      {/* 背景装饰 - 金色光点 */}
      <View style={styles.glowContainer}>
        <View style={styles.glowOrb1} />
        <View style={styles.glowOrb2} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* 标题区域 */}
          <View style={styles.header}>
            {/* 流痕江湖 - 书法金色渐变 */}
            <LinearGradient
              colors={['#D4AF37', '#FFD700', '#B8860B', '#FFD700']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.titleGradient}
            >
              <Text style={styles.titleShadow}>流痕江湖</Text>
              <Text style={styles.title}>流痕江湖</Text>
            </LinearGradient>

            {/* 副标题 */}
            <Text style={styles.subtitle}>人海为江湖，留言皆流痕</Text>
          </View>

          {/* 登录卡片 */}
          <View style={styles.card}>
            <View style={styles.cardBorder}>
              <View style={styles.cardInner}>
                {/* 江湖登录标题 */}
                <LinearGradient
                  colors={['#D4AF37', '#FFD700']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.cardTitleGradient}
                >
                  <Text style={styles.cardTitleShadow}>江湖登录</Text>
                  <Text style={styles.cardTitle}>江湖登录</Text>
                </LinearGradient>

                {/* 手机号输入 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>手机号</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputIcon}>🎤</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="请输入手机号"
                      placeholderTextColor="#8B8B8B"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* 密码输入 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>密码</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputIcon}>🔐</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="请输入密码"
                      placeholderTextColor="#8B8B8B"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>
                </View>

                {/* 进入江湖按钮 */}
                <LinearGradient
                  colors={['#D4AF37', '#FFD700', '#B8860B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleLogin}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buttonText}>进入江湖</Text>
                  </TouchableOpacity>
                </LinearGradient>

                {/* 注册链接 */}
                <TouchableOpacity
                  style={styles.registerLink}
                  onPress={handleRegister}
                >
                  <Text style={styles.registerText}>
                    还没有账号？<Text style={styles.registerHighlight}>立即注册</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  glowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  glowOrb1: {
    position: 'absolute',
    top: 80,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    opacity: 0.5,
  },
  glowOrb2: {
    position: 'absolute',
    bottom: 150,
    right: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    opacity: 0.4,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  titleGradient: {
    position: 'relative',
  },
  titleShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    fontSize: 44,
    fontWeight: '900',
    color: 'rgba(0, 0, 0, 0.3)',
  },
  title: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFD700',
    textShadowColor: 'rgba(212, 175, 55, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    letterSpacing: 8,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 14,
    color: '#CCCCCC',
    letterSpacing: 2,
  },
  card: {
    width: '100%',
    maxWidth: 360,
  },
  cardBorder: {
    borderWidth: 2,
    borderColor: '#D4AF37',
    borderRadius: 20,
    padding: 2,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  cardInner: {
    backgroundColor: '#1A1A1F',
    borderRadius: 18,
    padding: 28,
  },
  cardTitleGradient: {
    alignSelf: 'center',
    marginBottom: 28,
  },
  cardTitleShadow: {
    position: 'absolute',
    top: 1,
    left: 1,
    fontSize: 22,
    fontWeight: '700',
    color: 'rgba(0, 0, 0, 0.2)',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 4,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    color: '#D4AF37',
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D0D12',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    paddingVertical: 0,
  },
  buttonGradient: {
    borderRadius: 12,
    marginTop: 12,
    overflow: 'hidden',
  },
  button: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1F',
    letterSpacing: 2,
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 13,
    color: '#888888',
  },
  registerHighlight: {
    color: '#D4AF37',
    fontWeight: '600',
  },
});
