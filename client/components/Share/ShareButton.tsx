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
import * as Linking from 'expo-linking';

interface ShareButtonProps {
  postId: number;
  title?: string;
  size?: number;
  color?: string;
}

export function ShareButton({ postId, title, size = 24, color }: ShareButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);

  // 使用环境变量构建分享链接，兜底使用自定义域名
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://liuhenjianghu.com';
  const shareUrl = `${baseUrl}/post/${postId}`;
  const shareText = title ? `${title}\n${shareUrl}` : shareUrl;

  const handleCopyLink = async () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.navigator) {
      // Web 平台：使用原生 Clipboard API
      await window.navigator.clipboard.writeText(shareUrl);
    }
    setModalVisible(false);
    Alert.alert('已复制', '链接已复制到剪贴板');
  };

  const handleShare = async () => {
    // Web 平台：复制链接
    handleCopyLink();
  };

  const handleShareToWechat = () => {
    const wechatShareUrl = `https://api.uomg.com/api/qrcode?url=${encodeURIComponent(shareUrl)}`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(wechatShareUrl, '_blank');
    }
    setModalVisible(false);
  };

  const handleShareToWeibo = () => {
    const weiboShareUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title || '流痕江湖')}`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(weiboShareUrl, '_blank');
    }
    setModalVisible(false);
  };

  const handleShareToQQ = () => {
    const qqShareUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title || '流痕江湖')}`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(qqShareUrl, '_blank');
    }
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
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>分享到</Text>

            <View style={styles.shareOptions}>
              <TouchableOpacity style={styles.shareOption} onPress={handleShareToWechat}>
                <View style={[styles.shareIcon, { backgroundColor: '#07C160' }]}>
                  <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
                </View>
                <Text style={styles.shareLabel}>微信</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareOption} onPress={handleShareToWechat}>
                <View style={[styles.shareIcon, { backgroundColor: '#07C160' }]}>
                  <Ionicons name="people" size={24} color="#fff" />
                </View>
                <Text style={styles.shareLabel}>朋友圈</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareOption} onPress={handleShareToWeibo}>
                <View style={[styles.shareIcon, { backgroundColor: '#E6162D' }]}>
                  <Ionicons name="logo-sina-weibo" size={24} color="#fff" />
                </View>
                <Text style={styles.shareLabel}>微博</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareOption} onPress={handleShareToQQ}>
                <View style={[styles.shareIcon, { backgroundColor: '#1296DB' }]}>
                  <Ionicons name="chatbox-ellipses" size={24} color="#fff" />
                </View>
                <Text style={styles.shareLabel}>QQ</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareOption} onPress={handleCopyLink}>
                <View style={[styles.shareIcon, { backgroundColor: '#8B8B8B' }]}>
                  <Ionicons name="link" size={24} color="#fff" />
                </View>
                <Text style={styles.shareLabel}>复制链接</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 20,
  },
  shareOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  shareOption: {
    alignItems: 'center',
    width: '25%',
    marginBottom: 20,
  },
  shareIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  shareLabel: {
    fontSize: 12,
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#fff',
  },
});

export default ShareButton;
