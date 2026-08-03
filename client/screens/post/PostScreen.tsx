import React, { useState } from 'react';
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

      // 使用用户的注册区域（自动从用户信息中获取）
      // region_level: 1=镇, 2=县, 3=市, 4=省（与后端保持一致）
      const regionCode = user.town_code || user.district_code || user.city_code || user.province_code || '';
      const regionLevel = user.town_code ? 1 : user.district_code ? 2 : user.city_code ? 3 : 4;

      await api.createPost({
        content: content.trim(),
        images: uploadedImages,
        region_code: regionCode,
        region_level: regionLevel,
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

          {/* 区域显示（只读，显示用户的注册区域） */}
          <View style={styles.regionSection}>
            <Text style={styles.sectionTitle}>发布区域</Text>
            <View style={styles.regionDisplay}>
              <Text style={styles.regionText}>
                {user.town_name || user.district_name || user.city_name || user.province_name || '未设置区域'}
              </Text>
            </View>
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
});
