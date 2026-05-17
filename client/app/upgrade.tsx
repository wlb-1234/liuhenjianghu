import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

const MEMBERS = [
  {
    level: 0,
    name: '江湖散人',
    price: 0,
    region: '本镇',
    daily: 10,
    retention: 7,
    canPin: false,
    features: ['本镇范围内发布', '每日10条留言', '7天留存'],
    color: '#9A9A9A',
  },
  {
    level: 1,
    name: '县帮帮主',
    price: 9,
    region: '本县',
    daily: 30,
    retention: 15,
    canPin: false,
    features: ['本县范围内发布', '每日30条留言', '15天留存'],
    color: '#C9A96E',
    popular: false,
  },
  {
    level: 2,
    name: '市盟盟主',
    price: 19,
    region: '本市',
    daily: 80,
    retention: 30,
    canPin: false,
    features: ['本市范围内发布', '每日80条留言', '30天留存'],
    color: '#D4B896',
    popular: true,
  },
  {
    level: 3,
    name: '省派掌门',
    price: 39,
    region: '本省',
    daily: 200,
    retention: 60,
    canPin: false,
    features: ['本省范围内发布', '每日200条留言', '60天留存'],
    color: '#E8D5B7',
  },
  {
    level: 4,
    name: '天下会主',
    price: 69,
    region: '全国',
    daily: 999,
    retention: 90,
    canPin: true,
    features: ['全国范围内发布', '不限条数', '90天留存', '留言置顶'],
    color: '#FFD700',
  },
];

export default function UpgradeScreen() {
  const router = useSafeRouter();
  const { user, refreshUser } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (selectedLevel <= (user?.member_level || 0)) {
      Alert.alert('提示', '您已拥有此等级或更高等级');
      return;
    }

    setLoading(true);
    try {
      // 模拟支付流程
      await new Promise(resolve => setTimeout(resolve, 1500));
      await api.upgradeMember(selectedLevel);
      await refreshUser();
      Alert.alert('升级成功', `恭喜成为${MEMBERS[selectedLevel].name}！`, [
        { text: '确定', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('升级失败', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>升级会员</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 当前等级 */}
        <View style={styles.currentLevel}>
          <Text style={styles.currentLabel}>当前等级</Text>
          <LinearGradient
            colors={[MEMBERS[user?.member_level || 0].color, '#8B4513']}
            style={styles.currentBadge}
          >
            <Text style={styles.currentName}>{MEMBERS[user?.member_level || 0].name}</Text>
          </LinearGradient>
        </View>

        {/* 会员卡片 */}
        <Text style={styles.sectionTitle}>选择会员等级</Text>
        {MEMBERS.map(member => {
          const isCurrent = member.level === user?.member_level;
          const isSelected = member.level === selectedLevel;
          const isUpgradable = member.level > (user?.member_level || 0);

          return (
            <TouchableOpacity
              key={member.level}
              style={[
                styles.memberCard,
                isSelected && styles.memberCardSelected,
                member.level === 4 && styles.memberCardGold,
              ]}
              onPress={() => isUpgradable && setSelectedLevel(member.level)}
              disabled={!isUpgradable}
            >
              {member.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>热门</Text>
                </View>
              )}
              {member.level === 4 && (
                <View style={styles.goldBadge}>
                  <Text style={styles.goldBadgeText}>最高级</Text>
                </View>
              )}
              
              <View style={styles.memberHeader}>
                <View>
                  <Text style={[styles.memberName, member.level === 4 && styles.goldText]}>
                    {member.name}
                  </Text>
                  <Text style={styles.memberRegion}>发布范围：{member.region}</Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={[styles.price, member.level === 4 && styles.goldText]}>
                    ¥{member.price}
                  </Text>
                  <Text style={styles.priceUnit}>/月</Text>
                </View>
              </View>

              <View style={styles.features}>
                {member.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Text style={styles.featureIcon}>✓</Text>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {isCurrent && (
                <View style={styles.currentTag}>
                  <Text style={styles.currentTagText}>当前</Text>
                </View>
              )}
              {!isUpgradable && !isCurrent && (
                <View style={styles.lockedTag}>
                  <Text style={styles.lockedTagText}>不可降级</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* 底部按钮 */}
      {selectedLevel > (user?.member_level || 0) && (
        <View style={styles.footer}>
          <View style={styles.footerInfo}>
            <Text style={styles.footerLabel}>升级至：</Text>
            <Text style={styles.footerValue}>{MEMBERS[selectedLevel].name}</Text>
          </View>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={handleUpgrade}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FDFBF7" />
            ) : (
              <LinearGradient colors={['#C9A96E', '#8B4513']} style={styles.buttonGradient}>
                <Text style={styles.buttonText}>
                  立即升级 ¥{MEMBERS[selectedLevel].price}/月
                </Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FDFBF7',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D0',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 28,
    color: '#8B7355',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  currentLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 12,
  },
  currentLabel: {
    fontSize: 14,
    color: '#8B7355',
  },
  currentBadge: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  currentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FDFBF7',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 16,
  },
  memberCard: {
    backgroundColor: '#FDFBF7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  memberCardSelected: {
    borderColor: '#8B4513',
    backgroundColor: '#FFF8F0',
  },
  memberCardGold: {
    backgroundColor: '#FFFEF5',
    borderColor: '#FFD700',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#C0392B',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  popularText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FDFBF7',
  },
  goldBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  goldBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5C3D2E',
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C2C2C',
  },
  goldText: {
    color: '#C9A96E',
  },
  memberRegion: {
    fontSize: 13,
    color: '#8B7355',
    marginTop: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: '#8B4513',
  },
  priceUnit: {
    fontSize: 12,
    color: '#8B7355',
  },
  features: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureIcon: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '700',
  },
  featureText: {
    fontSize: 14,
    color: '#5C5C5C',
  },
  currentTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#8B4513',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  currentTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FDFBF7',
  },
  lockedTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#D4C9B8',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  lockedTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B7355',
  },
  bottomPadding: {
    height: 100,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FDFBF7',
    borderTopWidth: 1,
    borderTopColor: '#E8E0D0',
    gap: 16,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 14,
    color: '#8B7355',
  },
  footerValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  upgradeButton: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FDFBF7',
  },
});
