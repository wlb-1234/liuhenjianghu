import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';

export default function AboutScreen() {
  const router = useSafeRouter();

  const handleContact = (type: 'phone' | 'email' | 'wechat') => {
    switch (type) {
      case 'phone':
        Linking.openURL('tel:400-888-8888');
        break;
      case 'email':
        Linking.openURL('mailto:support@liuhenjianghu.com');
        break;
      case 'wechat':
        // 微信公众号
        break;
    }
  };

  return (
    <Screen title="关于我们" canGoBack>
      <ScrollView style={styles.container}>
        {/* Logo 区域 */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>江湖</Text>
          </View>
          <Text style={styles.appName}>流痕江湖</Text>
          <Text style={styles.version}>版本 1.0.0</Text>
          <Text style={styles.slogan}>人海为江湖，留言皆流痕</Text>
        </View>

        {/* 简介 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>应用简介</Text>
          <Text style={styles.descText}>
            流痕江湖是一款基于地理位置的江湖信息发布平台。用户可以根据自己所在的行政区划（省/市/县）发布江湖信息，与同区域的江湖人士交流互动。
          </Text>
          <Text style={styles.descText}>
            我们致力于打造一个真实、有趣、互助的社区空间，让每一位江湖人士都能找到属于自己的归属感。
          </Text>
        </View>

        {/* 功能特点 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>功能特点</Text>
          {[
            { title: '按区域发布', desc: '根据地理位置精准匹配发布范围' },
            { title: '会员特权', desc: '不同等级享受不同发布范围和权限' },
            { title: '互动交流', desc: '点赞、收藏、评论，畅所欲言' },
            { title: '消息通知', desc: '第一时间获取互动反馈' },
          ].map((item, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureDot} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{item.title}</Text>
                <Text style={styles.featureDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 会员服务 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>会员服务</Text>
          <View style={styles.vipCard}>
            <Text style={styles.vipTitle}>江湖会员体系</Text>
            <View style={styles.vipList}>
              {[
                { name: '江湖散人', desc: '免费体验，本镇发布' },
                { name: '县帮帮主', desc: '本县范围，9元/月' },
                { name: '市盟盟主', desc: '本市范围，19元/月' },
                { name: '省派掌门', desc: '本省范围，39元/月' },
                { name: '天下会主', desc: '全国范围，69元/月' },
              ].map((item, index) => (
                <View key={index} style={styles.vipItem}>
                  <Text style={styles.vipName}>{item.name}</Text>
                  <Text style={styles.vipDesc}>{item.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 联系方式 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>联系我们</Text>
          <TouchableOpacity style={styles.contactItem} onPress={() => handleContact('phone')}>
            <View style={styles.contactIcon}>
              <Ionicons name="call-outline" size={22} color="#4F46E5" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>客服电话</Text>
              <Text style={styles.contactValue}>400-888-8888</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactItem} onPress={() => handleContact('email')}>
            <View style={styles.contactIcon}>
              <Ionicons name="mail-outline" size={22} color="#4F46E5" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>电子邮箱</Text>
              <Text style={styles.contactValue}>support@liuhenjianghu.com</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactItem}>
            <View style={styles.contactIcon}>
              <Ionicons name="chatbubble-outline" size={22} color="#4F46E5" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>微信公众号</Text>
              <Text style={styles.contactValue}>搜索「流痕江湖」</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 协议链接 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>法律声明</Text>
          <TouchableOpacity style={styles.linkItem}>
            <Text style={styles.linkText}>用户服务协议</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkItem}>
            <Text style={styles.linkText}>隐私政策</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 底部信息 */}
        <View style={styles.footer}>
          <Text style={styles.copyright}>(C) 2024 流痕江湖</Text>
          <Text style={styles.icp}>京ICP备12345678号-1</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  appName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  version: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  slogan: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  descText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
    marginTop: 6,
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
  vipCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  vipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 14,
  },
  vipList: {},
  vipItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  vipName: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  vipDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  contactIcon: {
    fontSize: 20,
    marginRight: 14,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 15,
    color: '#111827',
  },
  menuArrow: {
    fontSize: 20,
    color: '#D1D5DB',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  linkText: {
    fontSize: 15,
    color: '#111827',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  copyright: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  icp: {
    fontSize: 12,
    color: '#D1D5DB',
  },
});
