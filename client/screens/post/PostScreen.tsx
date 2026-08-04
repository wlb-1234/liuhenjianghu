import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import api from '@/services/api';
import { createFormDataFile } from '@/utils';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function PostScreen({ onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 区域选择状态
  // 会员等级对应的可发布区域：
  // 0=散人: 只能发布到镇级(1)
  // 1=镇派: 只能发布到镇级(1)
  // 2=县派: 可发布到镇级(1)、县级(2)
  // 3=市派: 可发布到镇级(1)、县级(2)、市级(3)
  // 4=省派: 可发布到镇级(1)、县级(2)、市级(3)、省级(4)
  
  // 计算可选区域列表
  const availableRegions = useMemo(() => {
    const maxLevel = user?.member_level || 0;
    const regions: { level: number; name: string; code: string; displayName: string }[] = [];
    
    // 始终包含镇级
    if (user?.town_code) {
      regions.push({
        level: 1,
        name: '镇级',
        code: user.town_code,
        displayName: user.town_name || '镇级',
      });
    }
    
    // 县派及以上可以发布到县级
    if (maxLevel >= 2 && user?.district_code) {
      regions.push({
        level: 2,
        name: '县级',
        code: user.district_code,
        displayName: user.district_name || '县级',
      });
    }
    
    // 市派及以上可以发布到市级
    if (maxLevel >= 3 && user?.city_code) {
      regions.push({
        level: 3,
        name: '市级',
        code: user.city_code,
        displayName: user.city_name || '市级',
      });
    }
    
    // 省派可以发布到省级
    if (maxLevel >= 4 && user?.province_code) {
      regions.push({
        level: 4,
        name: '省级',
        code: user.province_code,
        displayName: user.province_name || '省级',
      });
    }
    
    // 全国派可以发布到全国
    if (maxLevel >= 5) {
      regions.push({
        level: 0,
        name: '全国',
        code: '0000000000',
        displayName: '全国',
      });
    }
    
    return regions;
  }, [user]);
  
  // 默认选择最高等级区域
  const [selectedRegionLevel, setSelectedRegionLevel] = useState(() => {
    const maxLevel = user?.member_level || 0;
    if (maxLevel >= 5) return 0;  // 全国派默认全国
    if (maxLevel >= 4 && user?.province_code) return 4;
    if (maxLevel >= 3 && user?.city_code) return 3;
    if (maxLevel >= 2 && user?.district_code) return 2;
    return 1;
  });
  
  // 当前选中的区域
  const selectedRegion = useMemo(() => {
    return availableRegions.find(r => r.level === selectedRegionLevel) || availableRegions[0];
  }, [selectedRegionLevel, availableRegions]);
  
  // 显示区域选择器
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  const handleSelectImage = async () => {
    if (images.length >= 9) {
      Alert.alert('提示', '最多只能上传9张图片');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages(prev => [...prev, result.assets[0].uri]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('提示', '请输入留言内容');
      return;
    }

    if (!selectedRegion) {
      Alert.alert('提示', '请选择发布区域');
      return;
    }

    setLoading(true);
    try {
      // 上传图片
      let uploadedImages: string[] = [];
      if (images.length > 0) {
        const formData = new FormData();
        for (const imageUri of images) {
          const file = await createFormDataFile(imageUri, 'image.jpg', 'image/jpeg');
          formData.append('images', file as any);
        }
        const uploadResult = await api.uploadImages(formData);
        uploadedImages = uploadResult.files.map((f: any) => f.url);
      }

      // 使用用户选择的区域
      await api.createPost({
        content: content.trim(),
        images: uploadedImages,
        region_code: selectedRegion.code,
        region_level: selectedRegion.level,
      });

      Alert.alert('成功', '留言已发布');
      onSuccess();
    } catch (error: any) {
      Alert.alert('发布失败', error.message);
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
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>发布留言</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            style={styles.submitButton}
            disabled={loading || !content.trim()}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#8B4513" />
            ) : (
              <LinearGradient
                colors={['#8B4513', '#A0522D']}
                style={styles.submitGradient}
              >
                <Text style={styles.submitText}>发布</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 内容输入 */}
          <TextInput
            style={styles.textInput}
            placeholder="在此留下你的江湖留言..."
            placeholderTextColor="#A89F91"
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={2000}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{content.length}/2000</Text>

          {/* 图片上传 */}
          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>添加图片</Text>
            <View style={styles.imageScrollContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.imagesContainer}>
                {images.map((uri, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image source={{ uri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveImage(index)}
                    >
                      <Text style={styles.removeText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {images.length < 9 && (
                  <TouchableOpacity style={styles.addImageButton} onPress={handleSelectImage}>
                    <Text style={styles.addImageIcon}>+</Text>
                    <Text style={styles.addImageText}>添加图片</Text>
                  </TouchableOpacity>
                )}
              </View>
              </ScrollView>
              </View>
            </View>

          {/* 区域选择 */}
          <View style={styles.regionSection}>
            <Text style={styles.sectionTitle}>发布区域</Text>
            <TouchableOpacity
              style={styles.regionSelector}
              onPress={() => setShowRegionPicker(true)}
              disabled={availableRegions.length <= 1}
            >
              <Text style={styles.regionSelectorText}>
                {selectedRegion?.displayName || '未设置区域'}
              </Text>
              {availableRegions.length > 1 && (
                <Text style={styles.regionSelectorArrow}>▼</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.regionHint}>
              {user.member_level >= 5 ? '全国派会员' :
               user.member_level >= 4 ? '省派会员' : 
               user.member_level >= 3 ? '市派会员' :
               user.member_level >= 2 ? '县派会员' : '镇派/散人会员'}
              ，可在 {availableRegions.length} 个级别区域发布
            </Text>
          </View>
          
          {/* 区域选择弹窗 */}
          {showRegionPicker && (
            <View style={styles.regionPickerOverlay}>
              <View style={styles.regionPickerModal}>
                <View style={styles.regionPickerHeader}>
                  <Text style={styles.regionPickerTitle}>选择发布区域</Text>
                  <TouchableOpacity onPress={() => setShowRegionPicker(false)}>
                    <Text style={styles.regionPickerClose}>✕</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.regionPickerContent}>
                  {availableRegions.map((region) => (
                    <TouchableOpacity
                      key={region.level}
                      style={[
                        styles.regionPickerItem,
                        selectedRegionLevel === region.level && styles.regionPickerItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedRegionLevel(region.level);
                        setShowRegionPicker(false);
                      }}
                    >
                      <Text style={[
                        styles.regionPickerItemText,
                        selectedRegionLevel === region.level && styles.regionPickerItemTextSelected,
                      ]}>
                        {region.displayName}
                      </Text>
                      <Text style={styles.regionPickerItemLevel}>
                        {region.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D0',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 16,
    color: '#8B7355',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  submitButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  submitGradient: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  submitText: {
    color: '#FDFBF7',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  textInput: {
    backgroundColor: '#FDFBF7',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#2C2C2C',
    minHeight: 150,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#8B7355',
    marginTop: 4,
    marginBottom: 16,
  },
  imageSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#8B7355',
    fontWeight: '500',
    marginBottom: 12,
  },
  imagesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  imageWrapper: {
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#C0392B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D4C9B8',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageIcon: {
    fontSize: 32,
    color: '#D4C9B8',
  },
  addImageText: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 4,
  },
  imageScrollContainer: {
    flexGrow: 0,
  },
  regionSection: {
    marginBottom: 20,
  },
  regionSelector: {
    backgroundColor: '#FDFBF7',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  regionText: {
    fontSize: 16,
    color: '#2C2C2C',
  },
  regionPlaceholder: {
    color: '#A89F91',
  },
  arrow: {
    fontSize: 12,
    color: '#8B7355',
  },
  regionPicker: {
    backgroundColor: '#FDFBF7',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  pickerRow: {
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 8,
    fontWeight: '500',
  },
  pickerItem: {
    backgroundColor: '#EDE8DC',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  pickerItemActive: {
    backgroundColor: '#8B4513',
  },
  pickerContainer: {
    backgroundColor: '#FDFBF7',
    borderRadius: 12,
    marginBottom: 12,
  },
  regionScrollView: {
    flexGrow: 0,
    paddingVertical: 8,
  },
  pickerText: {
    fontSize: 14,
    color: '#8B7355',
  },
  pickerTextActive: {
    color: '#FDFBF7',
  },
  pickerScrollContainer: {
    flexGrow: 0,
    paddingVertical: 8,
  },
  regionSelectorText: {
    fontSize: 16,
    color: '#2C2C2C',
    fontWeight: '500',
  },
  regionSelectorArrow: {
    fontSize: 12,
    color: '#8B7355',
    marginLeft: 8,
  },
  regionHint: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 8,
  },
  regionPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  regionPickerModal: {
    backgroundColor: '#FDFBF7',
    borderRadius: 16,
    width: '85%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  regionPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D0',
  },
  regionPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  regionPickerClose: {
    fontSize: 20,
    color: '#8B7355',
    padding: 4,
  },
  regionPickerContent: {
    padding: 16,
  },
  regionPickerItem: {
    backgroundColor: '#EDE8DC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  regionPickerItemSelected: {
    backgroundColor: '#8B4513',
  },
  regionPickerItemText: {
    fontSize: 16,
    color: '#2C2C2C',
    fontWeight: '500',
  },
  regionPickerItemTextSelected: {
    color: '#FDFBF7',
  },
  regionPickerItemLevel: {
    fontSize: 13,
    color: '#8B7355',
  },
});
