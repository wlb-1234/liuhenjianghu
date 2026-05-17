import React, { useState, useEffect } from 'react';
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

interface Region {
  code: string;
  name: string;
}

interface Props {
  onSwitchToLogin: () => void;
  onBack?: () => void;
}

export default function RegisterScreen({ onSwitchToLogin, onBack }: Props) {
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeCooldown, setCodeCooldown] = useState(0);
  
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
    if (codeCooldown > 0) {
      const timer = setTimeout(() => setCodeCooldown(codeCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [codeCooldown]);

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
          {/* Logo */}
          <View style={styles.logoSection}>
            <Text style={styles.appName}>流痕江湖</Text>
            <Text style={styles.slogan}>人海为江湖，留言皆流痕</Text>
          </View>

          {/* 表单 */}
          <View style={styles.formSection}>
            <LinearGradient
              colors={['rgba(255,248,240,0.95)', 'rgba(253,245,230,0.95)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.formGradient}
            >
              <Text style={styles.stepTitle}>
                {step === 1 ? '江湖注册' : '选择你的江湖'}
              </Text>

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
                      colors={['#D2691E', '#FF8C00', '#FFD700']}
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
                        colors={['#D2691E', '#FF8C00', '#FFD700']}
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
                <Text style={styles.switchLink}>立即登录</Text>
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
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#2C2C2C',
    letterSpacing: 6,
    marginBottom: 12,
  },
  slogan: {
    fontSize: 14,
    color: '#A0522D',
    letterSpacing: 4,
    fontStyle: 'italic',
    fontWeight: '300',
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
  stepTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#5D4037',
    textAlign: 'center',
    marginBottom: 28,
    letterSpacing: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    color: '#A0522D',
    marginBottom: 10,
    fontWeight: '500',
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
    fontSize: 18,
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
    color: '#8B4513',
  },
  switchLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF8C00',
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
