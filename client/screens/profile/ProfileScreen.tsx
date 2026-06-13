import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { buildAssetUrl } from '@/utils';

interface Props {
  onUpgrade: () => void;
  onLogout: () => void;
  onSettings: () => void;
}

export default function ProfileScreen({ onUpgrade, onSettings }: Props) {
  const { user, logout } = useAuth();
  const router = useSafeRouter();
  const [stats, setStats] = useState({
    total_posts: 0,
    total_likes: 0,
    followers_count: 0,
    following_count: 0,
  });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
    }, [])
  );

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('退出登录失败:', error);
    }
  };

  const getMemberInfo = (level: number) => {
    const info = [
      { name: '江湖散人', region: '本镇', daily: '10条/天', retention: '7天', price: '免费' },
      { name: '县帮帮主', region: '本县', daily: '30条/天', retention: '15天', price: '9元/月' },
      { name: '市盟盟主', region: '本市', daily: '80条/天', retention: '30天', price: '19元/月' },
      { name: '省派掌门', region: '本省', daily: '200条/天', retention: '60天', price: '39元/月' },
      { name: '天下会主', region: '全国', daily: '不限', retention: '90天+置顶', price: '69元/月' },
    ];
    return info[level] || info[0];
  };

  const memberInfo = getMemberInfo(user?.member_level || 0);
  const isVip = (user?.member_level || 0) > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 头部背景 */}
        <LinearGradient
          colors={['#8B4513', '#5C3D2E', '#3D2B1F']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Image
              source={{
                uri: user?.avatar
                  ? buildAssetUrl(user.avatar)
                  : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
              }}
              style={styles.avatar}
            />
            <Text style={styles.nickname}>{user?.nickname}</Text>
            <View style={[styles.memberBadge, isVip && styles.memberBadgeVip]}>
              <Text style={styles.memberName}>{memberInfo.name}</Text>
            </View>
            <Text style={styles.slogan}>人海为江湖，留言皆流痕</Text>
          </View>
        </LinearGradient>

        {/* 会员卡片 */}
        <TouchableOpacity style={styles.vipCard} onPress={onUpgrade}>
          <LinearGradient
            colors={isVip ? ['#C9A96E', '#A0522D'] : ['#D4C9B8', '#C4B8A8']}
            style={styles.vipGradient}
          >
            <View style={styles.vipHeader}>
              <Text style={styles.vipTitle}>
                {isVip ? '会员尊享' : '升级会员'}
              </Text>
              <View style={styles.vipBadge}>
                <Text style={styles.vipBadgeText}>
                  {isVip ? '已开通' : '限时优惠'}
                </Text>
              </View>
            </View>
            <View style={styles.vipInfo}>
              <View style={styles.vipItem}>
                <Text style={styles.vipItemLabel}>发布范围</Text>
                <Text style={styles.vipItemValue}>{memberInfo.region}</Text>
              </View>
              <View style={styles.vipItem}>
                <Text style={styles.vipItemLabel}>每日发布</Text>
                <Text style={styles.vipItemValue}>{memberInfo.daily}</Text>
              </View>
              <View style={styles.vipItem}>
                <Text style={styles.vipItemLabel}>留存时间</Text>
                <Text style={styles.vipItemValue}>{memberInfo.retention}</Text>
              </View>
            </View>
            {!isVip && (
              <Text style={styles.upgradeHint}>点击升级，解锁更多江湖特权</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* 会员等级说明 */}
        <View style={styles.levelSection}>
          <Text style={styles.sectionTitle}>江湖会员等级</Text>
          {[
            { level: 0, name: '江湖散人', price: '免费', features: ['本镇发布', '10条/天', '7天留存'] },
            { level: 1, name: '县帮帮主', price: '9元/月', features: ['本县发布', '30条/天', '15天留存'] },
            { level: 2, name: '市盟盟主', price: '19元/月', features: ['本市发布', '80条/天', '30天留存'] },
            { level: 3, name: '省派掌门', price: '39元/月', features: ['本省发布', '200条/天', '60天留存'] },
            { level: 4, name: '天下会主', price: '69元/月', features: ['全国发布', '不限条数', '90天留存+置顶'] },
          ].map(item => (
            <TouchableOpacity
              key={item.level}
              style={[styles.levelCard, item.level === user?.member_level && styles.levelCardActive]}
              onPress={() => item.level > (user?.member_level || 0) && onUpgrade()}
            >
              <View style={styles.levelInfo}>
                <Text style={[styles.levelName, item.level === 4 && styles.levelNameGold]}>
                  {item.name}
                </Text>
                <Text style={styles.levelPrice}>{item.price}</Text>
              </View>
              <View style={styles.levelFeatures}>
                {item.features.map((f, i) => (
                  <Text key={i} style={styles.levelFeature}>{f}</Text>
                ))}
              </View>
              {item.level > (user?.member_level || 0) && (
                <View style={styles.upgradeTag}>
                  <Text style={styles.upgradeTagText}>升级</Text>
                </View>
              )}
              {item.level === user?.member_level && (
                <View style={styles.currentTag}>
                  <Text style={styles.currentTagText}>当前</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* 数据统计 */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>江湖数据</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{loading ? '-' : stats.total_posts}</Text>
              <Text style={styles.statLabel}>发布</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{loading ? '-' : stats.total_likes}</Text>
              <Text style={styles.statLabel}>获赞</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{loading ? '-' : stats.followers_count}</Text>
              <Text style={styles.statLabel}>粉丝</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{loading ? '-' : stats.following_count}</Text>
              <Text style={styles.statLabel}>关注</Text>
            </View>
          </View>
        </View>

        {/* 操作菜单 */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>评</Text>
            <Text style={styles.menuText}>我的留言</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>赞</Text>
            <Text style={styles.menuText}>我的点赞</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => onSettings && onSettings()}>
            <Text style={styles.menuIcon}>设</Text>
            <Text style={styles.menuText}>设置</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 退出登录 */}
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: '#C0392B' }]} 
          onPress={() => {
            console.log('退出登录按钮被点击');
            handleLogout();
          }}
        >
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>流痕江湖 v1.0</Text>
          <Text style={styles.footerSubtext}>人海为江湖，留言皆流痕</Text>
          <Text style={styles.footerCopyright}>(C) 2024 流痕江湖 All Rights Reserved</Text>
          <Text style={styles.footerContact}>联系：156-1359-4588</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E6',
  },
  header: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#F5F0E6',
  },
  nickname: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FDFBF7',
    marginTop: 12,
  },
  memberBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  memberBadgeVip: {
    backgroundColor: '#C9A96E',
  },
  memberName: {
    fontSize: 13,
    color: '#FDFBF7',
    fontWeight: '600',
  },
  slogan: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    letterSpacing: 1,
  },
  vipCard: {
    marginHorizontal: 16,
    marginTop: -30,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  vipGradient: {
    padding: 16,
  },
  vipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vipTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FDFBF7',
  },
  vipBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  vipBadgeText: {
    fontSize: 11,
    color: '#FDFBF7',
    fontWeight: '600',
  },
  vipInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  vipItem: {
    alignItems: 'center',
  },
  vipItemLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  vipItemValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FDFBF7',
  },
  upgradeHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 12,
  },
  levelSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 12,
  },
  levelCard: {
    backgroundColor: '#FDFBF7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  levelCardActive: {
    borderColor: '#8B4513',
    backgroundColor: '#FFF8F0',
  },
  levelInfo: {
    marginRight: 16,
    width: 90,
  },
  levelName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C2C2C',
  },
  levelNameGold: {
    color: '#C9A96E',
  },
  levelPrice: {
    fontSize: 13,
    color: '#8B7355',
    marginTop: 2,
  },
  levelFeatures: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  levelFeature: {
    backgroundColor: '#F5F0E6',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    color: '#8B7355',
  },
  upgradeTag: {
    backgroundColor: '#C0392B',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  upgradeTagText: {
    fontSize: 12,
    color: '#FDFBF7',
    fontWeight: '600',
  },
  currentTag: {
    backgroundColor: '#8B4513',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  currentTagText: {
    fontSize: 12,
    color: '#FDFBF7',
    fontWeight: '600',
  },
  statsSection: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#FDFBF7',
    borderRadius: 16,
    padding: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#8B4513',
  },
  statLabel: {
    fontSize: 13,
    color: '#8B7355',
    marginTop: 4,
  },
  menuSection: {
    padding: 16,
    gap: 10,
  },
  menuItem: {
    backgroundColor: '#FDFBF7',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    color: '#2C2C2C',
  },
  menuArrow: {
    fontSize: 20,
    color: '#D4C9B8',
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#FDFBF7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E0D0',
  },
  logoutText: {
    fontSize: 15,
    color: '#C0392B',
  },
  footer: {
    alignItems: 'center',
    padding: 30,
  },
  footerText: {
    fontSize: 13,
    color: '#8B7355',
  },
  footerSubtext: {
    fontSize: 11,
    color: '#A89F91',
    marginTop: 4,
  },
  footerCopyright: {
    fontSize: 11,
    color: '#A89F91',
    marginTop: 8,
  },
  footerContact: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 4,
    fontWeight: '600',
  },
});
