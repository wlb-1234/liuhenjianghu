import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeRouter } from '@/hooks/useSafeRouter';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:8080';

const themeOptions = [
  { value: 'light', label: '亮色模式', icon: '☀️', desc: '经典白底界面' },
  { value: 'dark', label: '暗黑模式', icon: '🌙', desc: '深色背景，省电护眼' },
  { value: 'system', label: '跟随系统', icon: '📱', desc: '自动匹配手机设置' },
];

export default function SettingsScreen() {
  const router = useSafeRouter();
  const [showAgreement, setShowAgreement] = useState(false);
  const [agreementType, setAgreementType] = useState<'user' | 'privacy'>('user');
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('system');
  const [loading, setLoading] = useState(false);

  // 加载主题设置
  useEffect(() => {
    loadThemeSetting();
  }, []);

  const loadThemeSetting = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/theme`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setCurrentTheme(data.data.mode || 'system');
        }
      }
    } catch (error) {
      console.log('加载主题设置失败', error);
    }
  };

  const handleThemeChange = async (theme: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/theme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: theme }),
      });
      if (response.ok) {
        setCurrentTheme(theme);
        setShowThemeModal(false);
      }
    } catch (error) {
      console.log('保存主题失败', error);
    }
    setLoading(false);
  };

  const getCurrentThemeLabel = () => {
    const theme = themeOptions.find(t => t.value === currentTheme);
    return theme ? theme.label : '跟随系统';
  };

  const handleAgreement = (type: 'user' | 'privacy') => {
    setAgreementType(type);
    setShowAgreement(true);
  };

  const renderAgreementContent = () => {
    if (agreementType === 'user') {
      return `**流痕江湖用户协议**

一、服务条款的确认和接纳
「流痕江湖」APP所有权和运营权归开发者所有。用户在使用本应用服务时，应遵守以下条款。

二、服务内容
1. 公共留言功能：用户可发布文字、图片等内容
2. 社交功能：关注、私聊等社交功能
3. 会员服务：付费会员可享受更多权限

三、用户行为规范
1. 禁止发布违法、违规内容
2. 禁止侮辱、诽谤他人
3. 禁止传播虚假信息
4. 禁止侵犯他人合法权益

四、违规处理
违规内容将被删除，严重违规者将被禁言或封禁账号。

五、免责声明
用户自行承担使用本应用的风险，开发者不对用户发布内容承担责任。

六、协议更新
开发者有权随时更新本协议，更新后的协议在APP内公布即生效。`;
    } else {
      return `**流痕江湖隐私政策**

一、信息收集
1. 注册信息：手机号码（用于账号注册和登录）
2. 位置信息：省市区街道四级区域（用于内容分发）
3. 发布内容：您主动发布的文字、图片等内容
4. 使用信息：登录时间、操作记录等

二、信息使用
1. 手机号用于账号验证和联系
2. 位置信息用于内容区域分发
3. 发布内容公开展示给其他用户

三、信息保护
1. 我们重视您的个人信息安全
2. 采取技术措施保护数据安全
3. 不向第三方出售用户信息

四、联系我们
如有任何隐私问题，请联系：15613594588`;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 头部 */}
      <LinearGradient
        colors={['#8B4513', '#5C3D2E', '#3D2B1F']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>设置</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* 主题设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>显示设置</Text>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => setShowThemeModal(true)}
          >
            <Text style={styles.menuIcon}>🌙</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuText}>深色模式</Text>
              <View style={styles.menuRight}>
                <Text style={styles.menuValue}>{getCurrentThemeLabel()}</Text>
                <Text style={styles.menuArrow}>›</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* 关于我们 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>关于我们</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>版</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuText}>当前版本</Text>
              <Text style={styles.menuValue}>v1.0.0</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => handleAgreement('user')}
          >
            <Text style={styles.menuIcon}>协</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuText}>用户协议</Text>
              <Text style={styles.menuArrow}>›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => handleAgreement('privacy')}
          >
            <Text style={styles.menuIcon}>私</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuText}>隐私政策</Text>
              <Text style={styles.menuArrow}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 联系我们 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>联系我们</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
            <Text style={styles.menuIcon}>电</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuText}>联系电话</Text>
              <Text style={styles.menuValue}>请联系客服</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 版权信息 */}
        <View style={styles.copyrightSection}>
          <Text style={styles.copyrightTitle}>流痕江湖</Text>
          <Text style={styles.copyrightSlogan}>人海为江湖，留言皆流痕</Text>
          <Text style={styles.copyrightText}>(C) 2024 流痕江湖 All Rights Reserved</Text>
          <Text style={styles.copyrightText}>版权所有 · 保留一切权利</Text>
        </View>
      </ScrollView>

      {/* 主题选择弹窗 */}
      <Modal
        visible={showThemeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowThemeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.themeModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>深色模式</Text>
              <TouchableOpacity onPress={() => setShowThemeModal(false)}>
                <Text style={styles.modalClose}>关闭</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.themeList}>
              {themeOptions.map((theme) => (
                <TouchableOpacity
                  key={theme.value}
                  style={[
                    styles.themeItem,
                    currentTheme === theme.value && styles.themeItemActive,
                  ]}
                  onPress={() => handleThemeChange(theme.value)}
                  disabled={loading}
                >
                  <Text style={styles.themeIcon}>{theme.icon}</Text>
                  <View style={styles.themeInfo}>
                    <Text style={[
                      styles.themeLabel,
                      currentTheme === theme.value && styles.themeLabelActive,
                    ]}>
                      {theme.label}
                    </Text>
                    <Text style={styles.themeDesc}>{theme.desc}</Text>
                  </View>
                  {currentTheme === theme.value && (
                    <Text style={styles.themeCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 协议弹窗 */}
      <Modal
        visible={showAgreement}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAgreement(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {agreementType === 'user' ? '用户协议' : '隐私政策'}
              </Text>
              <TouchableOpacity onPress={() => setShowAgreement(false)}>
                <Text style={styles.modalClose}>关闭</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.agreementText}>
                {renderAgreementContent()}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E6',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#FDFBF7',
    fontSize: 16,
  },
  headerTitle: {
    color: '#FDFBF7',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#8B4513',
    color: '#FDFBF7',
    textAlign: 'center',
    lineHeight: 36,
    fontSize: 14,
    fontWeight: '600',
    overflow: 'hidden',
  },
  menuContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 12,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    color: '#3D2B1F',
  },
  menuValue: {
    fontSize: 14,
    color: '#8B7355',
    marginRight: 8,
  },
  menuArrow: {
    fontSize: 18,
    color: '#C9B896',
  },
  copyrightSection: {
    marginTop: 60,
    marginBottom: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  copyrightTitle: {
    fontSize: 20,
    color: '#8B4513',
    fontWeight: '700',
    letterSpacing: 2,
  },
  copyrightSlogan: {
    fontSize: 12,
    color: '#C9A96E',
    marginTop: 8,
    letterSpacing: 1,
  },
  copyrightText: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  themeModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '60%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE3',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3D2B1F',
  },
  modalClose: {
    fontSize: 16,
    color: '#8B4513',
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  agreementText: {
    fontSize: 14,
    color: '#3D2B1F',
    lineHeight: 24,
  },
  themeList: {
    padding: 16,
  },
  themeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9F7F4',
    borderRadius: 12,
    marginBottom: 10,
  },
  themeItemActive: {
    backgroundColor: '#F5EDE3',
    borderWidth: 2,
    borderColor: '#8B4513',
  },
  themeIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  themeInfo: {
    flex: 1,
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D2B1F',
  },
  themeLabelActive: {
    color: '#8B4513',
  },
  themeDesc: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 4,
  },
  themeCheck: {
    fontSize: 20,
    color: '#8B4513',
    fontWeight: '700',
  },
});
