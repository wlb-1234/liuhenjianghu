import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Modal,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';

interface ShareButtonProps {
  postId: number;
  title?: string;
  size?: number;
  color?: string;
}

export function ShareButton({ postId, title, size = 24, color }: ShareButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const shareUrl = `https://expo-app-production-c11a.up.railway.app/post/${postId}`;
  const shareText = title ? `${title}\n${shareUrl}` : shareUrl;

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(shareUrl);
    setModalVisible(false);
    Alert.alert('已复制', '链接已复制到剪贴板');
  };

  const handleShare = async () => {
    if (Platform.OS === 'web') {
      // Web 平台：复制链接
      handleCopyLink();
    } else {
      // 原生平台：使用分享
      try {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          // 使用 Alert 模拟分享（实际应用中可集成更多分享方式）
          Alert.alert('分享', `分享链接: ${shareUrl}`, [
            { text: '取消', style: 'cancel' },
            { text: '复制链接', onPress: handleCopyLink },
          ]);
        } else {
          handleCopyLink();
        }
      } catch (error) {
        handleCopyLink();
      }
    }
    setModalVisible(false);
  };

  const handleOpenBrowser = () => {
    Linking.openURL(shareUrl);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Ionicons name="share-outline" size={size} color={color} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.sheet}>
            <Text style={styles.title}>分享到</Text>
            
            <View style={styles.options}>
              <TouchableOpacity style={styles.option} onPress={handleShare}>
                <View style={[styles.iconBg, { backgroundColor: '#07C160' }]}>
                  <Ionicons name="chatbubble" size={24} color="#fff" />
                </View>
                <Text style={styles.optionText}>微信</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.option} onPress={handleShare}>
                <View style={[styles.iconBg, { backgroundColor: '#FF9500' }]}>
                  <Ionicons name="logo-snapchat" size={24} color="#fff" />
                </View>
                <Text style={styles.optionText}>朋友圈</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.option} onPress={handleShare}>
                <View style={[styles.iconBg, { backgroundColor: '#12B7F5' }]}>
                  <Ionicons name="logo-twitter" size={24} color="#fff" />
                </View>
                <Text style={styles.optionText}>微博</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.option} onPress={handleCopyLink}>
                <View style={[styles.iconBg, { backgroundColor: '#07C160' }]}>
                  <Ionicons name="link" size={24} color="#fff" />
                </View>
                <Text style={styles.optionText}>复制链接</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  option: {
    alignItems: 'center',
  },
  iconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionText: {
    color: '#fff',
    fontSize: 12,
  },
  cancelBtn: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
  },
});
