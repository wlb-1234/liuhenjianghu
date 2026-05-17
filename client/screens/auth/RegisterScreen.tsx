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

interface Region {
  code: string;
  name: string;
}

interface Props {
  onSwitchToLogin: () => void;
  onBack?: () => void;
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

export default function RegisterScreen({ onSwitchToLogin, onBack }: Props) {
  const { register } = useAuth();
  const [step, setStep] = useState(1); // 1: 基础信息  2: 区域选择
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeCooldown, setCodeCooldown] = useState(0);
  
  // 流动动画
  const flowAnim = useRef(new Animated.Value(0)).current;
  
  // 区域选择
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [cities, setCities] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [towns, setTowns] = useState<Region[]>([]);
  
  const [selectedProvince, setSelectedProvince] = useState<Region | null>(null);
  const [selectedCity, setSelectedCity] = useState<Region | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<Region | null>(null);
  const [selectedTown, setSelectedTown] = useState<Region | null>(null);

  useEffect(() => {
    loadProvinces();
  }, []);

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

  useEffect(() => {
    if (codeCooldown > 0) {
      const timer = setTimeout(() => setCodeCooldown(codeCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [codeCooldown]);

  // 计算流动渐变偏移
  const flowOffset = flowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });

  const loadProvinces = async () => {
    try {
      const { data } = await api.getProvinces();
      setProvinces(data);
    } catch (error) {
      console.error('加载省份失败:', error);
    }
  };

  const loadCities = async (provinceCode: string) => {
    try {
      const { data } = await api.getCities(provinceCode);
      setCities(data);
    } catch (error) {
      console.error('加载城市失败:', error);
    }
  };

  const loadDistricts = async (cityCode: string) => {
    try {
      const { data } = await api.getDistricts(cityCode);
      setDistricts(data);
    } catch (error) {
      console.error('加载区县失败:', error);
    }
  };

  const loadTowns = async (districtCode: string) => {
    try {
      const { data } = await api.getTowns(districtCode);
      setTowns(data);
    } catch (error) {
      console.error('加载乡镇失败:', error);
    }
  };

  const handleSendCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }

    setCodeLoading(true);
    try {
      const result = await api.sendCode(phone);
      if (result.code) {
        Alert.alert('验证码', `验证码: ${result.code}`);
      }
      setCodeCooldown(60);
    } catch (error: any) {
      Alert.alert('发送失败', error.message);
    } finally {
      setCodeLoading(false);
    }
  };

  const validateStep1 = () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      Alert.alert('提示', '请输入正确的手机号');
      return false;
    }
    if (!code || code.length !== 6) {
      Alert.alert('提示', '请输入6位验证码');
      return false;
    }
    if (!password || password.length < 6) {
      Alert.alert('提示', '密码至少6位');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('提示', '两次密码不一致');
      return false;
    }
    if (!nickname || nickname.length < 2 || nickname.length > 20) {
      Alert.alert('提示', '昵称长度为2-20个字符');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleRegister = async () => {
    if (!selectedTown && !selectedDistrict) {
      Alert.alert('提示', '请至少选择区县');
      return;
    }

    setLoading(true);
    try {
      await register({
        phone,
        code,
        password,
        nickname,
        province_code: selectedProvince?.code,
        city_code: selectedCity?.code,
        district_code: selectedDistrict?.code,
        town_code: selectedTown?.code,
      });
    } catch (error: any) {
      Alert.alert('注册失败', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProvinceSelect = (province: Region) => {
    setSelectedProvince(province);
    setSelectedCity(null);
    setSelectedDistrict(null);
    setSelectedTown(null);
    setCities([]);
    setDistricts([]);
    setTowns([]);
    loadCities(province.code);
  };

  const handleCitySelect = (city: Region) => {
    setSelectedCity(city);
    setSelectedDistrict(null);
    setSelectedTown(null);
    setDistricts([]);
    setTowns([]);
    loadDistricts(city.code);
  };

  const handleDistrictSelect = (district: Region) => {
    setSelectedDistrict(district);
    setSelectedTown(null);
    setTowns([]);
    loadTowns(district.code);
  };

  const handleTownSelect = (town: Region) => {
    setSelectedTown(town);
  };

  const renderPicker = (
    title: string,
    items: Region[],
    selected: Region | null,
    onSelect: (item: Region) => void,
    placeholder: string
  ) => (
    <View style={styles.pickerSection}>
      <Text style={styles.label}>{title}</Text>
      <View style={styles.pickerScrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
          <TouchableOpacity
            style={[styles.pickerItem, !selected && styles.pickerItemActive]}
            disabled
          >
          <Text style={[styles.pickerText, !selected && styles.pickerTextActive]}>
            {selected ? selected.name : placeholder}
          </Text>
        </TouchableOpacity>
        {items.map((item) => (
          <TouchableOpacity
            key={item.code}
            style={[
              styles.pickerItem,
              selected?.code === item.code && styles.pickerItemActive,
            ]}
            onPress={() => onSelect(item)}
          >
            <Text
              style={[
                styles.pickerText,
                selected?.code === item.code && styles.pickerTextActive,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      </View>
    </View>
  );

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
          {/* Logo - 七彩液体标题 */}
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
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shineOverlay}
              />
            </View>
            <Text style={styles.slogan}>人海为江湖，留言皆流痕</Text>
          </View>

          {/* 表单 - 玻璃拟态卡片 */}
          <View style={styles.formSection}>
            <LinearGradient
              colors={['rgba(255,248,240,0.95)', 'rgba(253,245,230,0.95)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.formGradient}
            >
              {/* 标题 - 七彩液体流动效果 */}
              <View style={styles.stepTitleContainer}>
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
                <Text style={styles.stepTitleText}>
                  {step === 1 ? '江湖注册' : '选择你的江湖'}
                </Text>
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.shineOverlaySmall}
                />
              </View>

              {step === 1 ? (
                <>
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
                    <Text style={styles.label}>验证码</Text>
                    <View style={styles.codeRow}>
                      <TextInput
                        style={[styles.input, styles.codeInput]}
                        placeholder="请输入验证码"
                        placeholderTextColor="rgba(205,133,63,0.7)"
                        value={code}
                        onChangeText={setCode}
                        keyboardType="number-pad"
                        maxLength={6}
                      />
                      <TouchableOpacity
                        style={styles.codeButton}
                        onPress={handleSendCode}
                        disabled={codeLoading || codeCooldown > 0}
                      >
                        {codeLoading ? (
                          <ActivityIndicator color="#8B4513" size="small" />
                        ) : (
                          <Text style={styles.codeButtonText}>
                            {codeCooldown > 0 ? `${codeCooldown}s` : '获取验证码'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>昵称</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="江湖名号（2-20字）"
                      placeholderTextColor="rgba(205,133,63,0.7)"
                      value={nickname}
                      onChangeText={setNickname}
                      maxLength={20}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>密码</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="设置密码（至少6位）"
                      placeholderTextColor="rgba(205,133,63,0.7)"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>确认密码</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="再次输入密码"
                      placeholderTextColor="rgba(205,133,63,0.7)"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.nextButton}
                    onPress={handleNextStep}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#FF6B6B', '#FF8E53', '#FFA500', '#FFD700', '#00CED1', '#1E90FF', '#9370DB']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.buttonText}>下一步</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {renderPicker(
                    '省份',
                    provinces,
                    selectedProvince,
                    handleProvinceSelect,
                    '请选择省份'
                  )}
                  {cities.length > 0 &&
                    renderPicker(
                      '城市',
                      cities,
                      selectedCity,
                      handleCitySelect,
                      '请选择城市'
                    )}
                  {districts.length > 0 &&
                    renderPicker(
                      '区县',
                      districts,
                      selectedDistrict,
                      handleDistrictSelect,
                      '请选择区县'
                    )}
                  {towns.length > 0 &&
                    renderPicker(
                      '乡镇/街道',
                      towns,
                      selectedTown,
                      handleTownSelect,
                      '请选择乡镇'
                    )}

                  <View style={styles.selectedRegion}>
                    <Text style={styles.label}>已选区域</Text>
                    <View style={styles.regionTags}>
                      {selectedProvince && (
                        <View style={styles.regionTag}>
                          <Text style={styles.regionTagText}>{selectedProvince.name}</Text>
                        </View>
                      )}
                      {selectedCity && (
                        <View style={styles.regionTag}>
                          <Text style={styles.regionTagText}>{selectedCity.name}</Text>
                        </View>
                      )}
                      {selectedDistrict && (
                        <View style={styles.regionTag}>
                          <Text style={styles.regionTagText}>{selectedDistrict.name}</Text>
                        </View>
                      )}
                      {selectedTown && (
                        <View style={styles.regionTag}>
                          <Text style={styles.regionTagText}>{selectedTown.name}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => setStep(1)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.backButtonText}>返回</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.registerButton}
                      onPress={handleRegister}
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
                          <Text style={styles.buttonText}>创建江湖身份</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              <TouchableOpacity
                style={styles.switchButton}
                onPress={onSwitchToLogin}
              >
                <Text style={styles.switchText}>已有江湖身份？</Text>
                <LinearGradient
                  colors={['#FF8E53', '#FFD700']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.switchLink}>立即登录</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
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
    marginBottom: 40,
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
    fontSize: 42,
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
  stepTitleContainer: {
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
    width: 280,
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
  stepTitleText: {
    fontSize: 28,
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
    marginBottom: 16,
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
  codeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  codeInput: {
    flex: 1,
  },
  codeButton: {
    backgroundColor: 'rgba(237,232,220,0.9)',
    borderRadius: 16,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(205,133,63,0.3)',
  },
  codeButtonText: {
    color: '#8B4513',
    fontSize: 14,
    fontWeight: '600',
  },
  nextButton: {
    marginTop: 20,
    borderRadius: 28,
    overflow: 'hidden',
  },
  registerButton: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
  },
  pickerScrollContainer: {
    flexGrow: 0,
    paddingVertical: 8,
  },
  backButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(139,69,19,0.3)',
    marginRight: 12,
    backgroundColor: 'rgba(237,232,220,0.5)',
  },
  backButtonText: {
    color: '#8B4513',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 28,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
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
  pickerSection: {
    marginBottom: 16,
  },
  pickerScroll: {
    flexDirection: 'row',
  },
  pickerItem: {
    backgroundColor: 'rgba(237,232,220,0.8)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(205,133,63,0.2)',
  },
  pickerItemActive: {
    backgroundColor: '#8B4513',
    borderColor: '#A0522D',
  },
  pickerText: {
    color: '#8B4513',
    fontSize: 14,
  },
  pickerTextActive: {
    color: '#FDFBF7',
  },
  selectedRegion: {
    marginTop: 8,
    marginBottom: 16,
  },
  regionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  regionTag: {
    backgroundColor: 'rgba(139, 69, 19, 0.15)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(205,133,63,0.3)',
  },
  regionTagText: {
    color: '#8B4513',
    fontSize: 13,
    fontWeight: '500',
  },
});
