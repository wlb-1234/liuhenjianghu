import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeRouter } from '@/hooks/useSafeRouter';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

interface MemberLevel {
  level: number;
  name: string;
  price: number;
  region_limit: number;
  daily_limit: number;
  retention_days: number;
  can_pin: boolean;
}

export default function VipScreen() {
  const router = useSafeRouter();
  const { user, token, refreshUser } = useAuth();
  const [levels, setLevels] = useState<MemberLevel[]>([]);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<MemberLevel | null>(null);
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay' | 'test'>('test');

  // 获取会员等级列表
  const fetchLevels = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/payment/levels`);
      const data = await response.json();
      if (data.levels) {
        setLevels(data.levels);
      }
    } catch (error) {
      console.error('获取会员等级失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLevels();
    if (user) {
      setCurrentLevel(user.member_level || 0);
    }
  }, [user, fetchLevels]);

  // 选择支付
  const handleSelectVip = (level: MemberLevel) => {
    if (level.price === 0) {
      Alert.alert('提示', '该等级无需购买');
      return;
    }
    setSelectedLevel(level);
    setPayModalVisible(true);
  };

  // 创建订单并支付
  const handlePay = async () => {
    if (!selectedLevel || !token) return;

    setPaying(true);
    try {
      // 1. 创建订单
      const createRes = await fetch(`${API_BASE}/api/v1/payment/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          level: selectedLevel.level,
          method: paymentMethod,
        }),
      });
      const createData = await createRes.json();

      if (!createData.success) {
        Alert.alert('创建订单失败', createData.error);
        return;
      }

      const orderNo = createData.order.order_no;

      // 2. 模拟支付
      if (paymentMethod === 'test') {
        const payRes = await fetch(`${API_BASE}/api/v1/payment/pay/simulate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ order_no: orderNo }),
        });
        const payData = await payRes.json();

        if (payData.success) {
          Alert.alert('支付成功', `恭喜成为${payData.member.name}！`, [
            {
              text: '确定',
              onPress: async () => {
                await refreshUser();
                setPayModalVisible(false);
                setCurrentLevel(selectedLevel.level);
              },
            },
          ]);
        } else {
          Alert.alert('支付失败', payData.error);
        }
      } else {
        // 微信/支付宝支付（预留）
        Alert.alert('支付提示', `${paymentMethod === 'wechat' ? '微信' : '支付宝'}支付接口预留中，请使用测试支付`);
      }
    } catch (error) {
      console.error('支付错误:', error);
      Alert.alert('支付失败', '网络错误，请重试');
    } finally {
      setPaying(false);
    }
  };

  const getLevelBadge = (level: number) => {
    const badges = ['散人', '镇帮', '县帮', '市盟', '省派'];
    return badges[level] || '';
  };

  const getLevelColor = (level: number) => {
    const colors = ['#8B7355', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800'];
    return colors[level] || '#8B7355';
  };

  if (loading) {
    return (
      <Screen style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#c9a96e" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 当前会员状态 */}
        <View style={styles.currentCard}>
          <Text style={styles.currentLabel}>当前身份</Text>
          <View style={styles.currentInfo}>
            <Text style={[styles.currentLevel, { color: getLevelColor(currentLevel) }]}>
              {levels.find(l => l.level === currentLevel)?.name || '江湖散人'}
            </Text>
            {user?.member_expire_at && (
              <Text style={styles.expireText}>
                到期: {new Date(user.member_expire_at).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>

        {/* 会员等级列表 */}
        <Text style={styles.sectionTitle}>选择江湖身份</Text>
        {levels.filter(l => l.price > 0).map((level) => (
          <TouchableOpacity
            key={level.level}
            style={[
              styles.levelCard,
              currentLevel >= level.level && styles.levelCardOwned,
            ]}
            onPress={() => handleSelectVip(level)}
            activeOpacity={0.8}
          >
            <View style={styles.levelHeader}>
              <View style={[styles.levelBadge, { backgroundColor: getLevelColor(level.level) }]}>
                <Text style={styles.levelBadgeText}>{getLevelBadge(level.level)}</Text>
              </View>
              <Text style={styles.levelName}>{level.name}</Text>
              {currentLevel >= level.level && (
                <Text style={styles.ownedTag}>已拥有</Text>
              )}
            </View>

            <View style={styles.levelPrice}>
              <Text style={styles.priceSymbol}>¥</Text>
              <Text style={styles.priceValue}>{level.price}</Text>
              <Text style={styles.priceUnit}>/月</Text>
            </View>

            <View style={styles.levelBenefits}>
              <View style={styles.benefitItem}>
                <Ionicons name="location-outline" size={16} color="#c9a96e" />
                <Text style={styles.benefitText}>
                  可在{level.region_limit === 1 ? '1省' : level.region_limit === 2 ? '1市' : level.region_limit === 3 ? '1县' : '1镇'}发布
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="create-outline" size={16} color="#c9a96e" />
                <Text style={styles.benefitText}>
                  每日发布{level.daily_limit}条
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="time-outline" size={16} color="#c9a96e" />
                <Text style={styles.benefitText}>
                  内容留存{level.retention_days}天
                </Text>
              </View>
              {level.can_pin && (
                <View style={styles.benefitItem}>
                  <Ionicons name="pin-outline" size={16} color="#c9a96e" />
                  <Text style={styles.benefitText}>置顶功能</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.buyButton,
                currentLevel >= level.level && styles.buyButtonDisabled,
              ]}
              disabled={currentLevel >= level.level}
            >
              <Text style={styles.buyButtonText}>
                {currentLevel >= level.level ? '已拥有' : '立即购买'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {/* 提示信息 */}
        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>温馨提示</Text>
          <Text style={styles.tipsText}>• 会员到期后自动降级为江湖散人</Text>
          <Text style={styles.tipsText}>• 支付安全由支付宝/微信支付保障</Text>
          <Text style={styles.tipsText}>• 如有问题请联系客服</Text>
        </View>
      </ScrollView>

      {/* 支付弹窗 */}
      <Modal
        visible={payModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPayModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPayModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity activeOpacity={1}>
              <Text style={styles.modalTitle}>选择支付方式</Text>
              <Text style={styles.modalSubtitle}>
                购买 {selectedLevel?.name} - ¥{selectedLevel?.price}
              </Text>

              <View style={styles.paymentMethods}>
                <TouchableOpacity
                  style={[
                    styles.paymentItem,
                    paymentMethod === 'test' && styles.paymentItemActive,
                  ]}
                  onPress={() => setPaymentMethod('test')}
                >
                  <Ionicons name="wallet-outline" size={28} color="#c9a96e" />
                  <Text style={styles.paymentName}>测试支付</Text>
                  <Text style={styles.paymentDesc}>模拟支付</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentItem,
                    paymentMethod === 'wechat' && styles.paymentItemActive,
                  ]}
                  onPress={() => setPaymentMethod('wechat')}
                >
                  <Ionicons name="logo-wechat" size={28} color="#4CAF50" />
                  <Text style={styles.paymentName}>微信支付</Text>
                  <Text style={styles.paymentDesc}>微信安全支付</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentItem,
                    paymentMethod === 'alipay' && styles.paymentItemActive,
                  ]}
                  onPress={() => setPaymentMethod('alipay')}
                >
                  <Ionicons name="logo-alipay" size={28} color="#1677FF" />
                  <Text style={styles.paymentName}>支付宝</Text>
                  <Text style={styles.paymentDesc}>支付宝安全支付</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handlePay}
                disabled={paying}
              >
                {paying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    确认支付 ¥{selectedLevel?.price}
                  </Text>
                )}
              </TouchableOpacity>

              <Text style={styles.payNote}>
                点击确认即表示您同意《支付协议》
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  currentCard: {
    backgroundColor: 'rgba(201, 169, 110, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.3)',
    marginBottom: 24,
  },
  currentLabel: {
    fontSize: 14,
    color: '#c9a96e',
    marginBottom: 8,
  },
  currentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentLevel: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  expireText: {
    fontSize: 12,
    color: '#888',
  },
  sectionTitle: {
    fontSize: 18,
    color: '#c9a96e',
    marginBottom: 16,
    fontWeight: '600',
  },
  levelCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.2)',
  },
  levelCardOwned: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  levelBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  levelName: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    flex: 1,
  },
  ownedTag: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  levelPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  priceSymbol: {
    fontSize: 16,
    color: '#c9a96e',
    fontWeight: 'bold',
  },
  priceValue: {
    fontSize: 32,
    color: '#c9a96e',
    fontWeight: 'bold',
    marginLeft: 2,
  },
  priceUnit: {
    fontSize: 14,
    color: '#888',
    marginLeft: 4,
  },
  levelBenefits: {
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#aaa',
  },
  buyButton: {
    backgroundColor: '#c9a96e',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buyButtonDisabled: {
    backgroundColor: '#4CAF50',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tips: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(201, 169, 110, 0.05)',
    borderRadius: 12,
    marginBottom: 32,
  },
  tipsTitle: {
    fontSize: 14,
    color: '#c9a96e',
    marginBottom: 8,
    fontWeight: '600',
  },
  tipsText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#2a2a3e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#c9a96e',
    textAlign: 'center',
    marginBottom: 24,
  },
  paymentMethods: {
    marginBottom: 24,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentItemActive: {
    borderColor: '#c9a96e',
    backgroundColor: 'rgba(201, 169, 110, 0.1)',
  },
  paymentName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    flex: 1,
  },
  paymentDesc: {
    fontSize: 12,
    color: '#888',
  },
  confirmButton: {
    backgroundColor: '#c9a96e',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  payNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
