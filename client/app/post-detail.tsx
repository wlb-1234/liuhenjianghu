import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import api from '@/services/api';
import { buildAssetUrl } from '@/utils';

interface Post {
  id: number;
  user_id: number;
  content: string;
  images: string[];
  like_count: number;
  comment_count: number;
  is_pinned: boolean;
  is_liked: boolean;
  expire_at: string;
  created_at: string;
  nickname: string;
  avatar: string | null;
  member_level: number;
}

interface Comment {
  id: number;
  content: string;
  created_at: string;
  nickname: string;
  avatar: string | null;
  parent_id: number | null;
  replies?: Comment[];
}

interface Props {
  postId: number;
  onBack: () => void;
  onUserPress: (userId: number) => void;
}

export default function PostDetailScreen({ postId, onBack, onUserPress }: Props) {
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [postId])
  );

  const loadData = async () => {
    try {
      const [postResult, commentsResult] = await Promise.all([
        api.getPost(postId),
        api.getComments(postId),
      ]);
      setPost(postResult.post);
      setComments(commentsResult.comments);
    } catch (error: any) {
      Alert.alert('加载失败', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    try {
      const result = await api.toggleLike(postId);
      setPost(prev => prev ? { ...prev, is_liked: result.liked, like_count: result.like_count } : null);
    } catch (error: any) {
      Alert.alert('操作失败', error.message);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const result = await api.addComment(postId, commentText.trim());
      const newComment: Comment = { 
        id: result.comment_id, 
        content: commentText.trim(), 
        created_at: new Date().toISOString(),
        nickname: '我',
        avatar: null,
        parent_id: null
      };
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      setPost(prev => prev ? { ...prev, comment_count: prev.comment_count + 1 } : null);
    } catch (error: any) {
      Alert.alert('评论失败', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getDaysRemaining = (expireAt: string) => {
    const expire = new Date(expireAt);
    const now = new Date();
    return Math.ceil((expire.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getMemberBadge = (level: number) => {
    const badges = ['散人', '县帮', '市盟', '省派', '会主'];
    return badges[level] || '散人';
  };

  const getMemberColor = (level: number) => {
    const colors = ['#9A9A9A', '#C9A96E', '#D4B896', '#E8D5B7', '#FFD700'];
    return colors[level] || colors[0];
  };

  const formatTime = (time: string) => {
    const date = new Date(time);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading || !post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
        </View>
      </SafeAreaView>
    );
  }

  const images = typeof post.images === 'string' ? JSON.parse(post.images) : post.images || [];
  const daysRemaining = getDaysRemaining(post.expire_at);

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>留言详情</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 帖子内容 */}
        <View style={styles.postCard}>
          <TouchableOpacity style={styles.userInfo} onPress={() => onUserPress(post.user_id)}>
            <Image
              source={{
                uri: post.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
              }}
              style={styles.avatar}
            />
            <View style={styles.userDetail}>
              <View style={styles.nameRow}>
                <Text style={styles.nickname}>{post.nickname}</Text>
                <View style={[styles.memberBadge, { backgroundColor: getMemberColor(post.member_level) }]}>
                  <Text style={styles.memberText}>{getMemberBadge(post.member_level)}</Text>
                </View>
              </View>
              <Text style={styles.timeText}>{formatTime(post.created_at)}</Text>
            </View>
            <View style={styles.remainDays}>
              <Text style={styles.remainDaysText}>剩余 {daysRemaining} 天</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.postContent}>{post.content}</Text>

          {images.length > 0 && (
            <View style={styles.imagesContainer}>
              {images.map((img: string, index: number) => (
                <Image
                  key={index}
                  source={{ uri: buildAssetUrl(img) }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              ))}
            </View>
          )}

          <View style={styles.actionBar}>
            <TouchableOpacity style={styles.actionItem} onPress={handleLike}>
              <FontAwesome name={post.is_liked ? 'heart' : 'heart-o'} size={20} color="#DC2626" />
              <Text style={styles.actionText}>{post.like_count} 赞</Text>
            </TouchableOpacity>
            <View style={styles.actionItem}>
              <Text style={styles.actionIcon}>评</Text>
              <Text style={styles.actionText}>{post.comment_count} 评论</Text>
            </View>
          </View>
        </View>

        {/* 评论区 */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>评论 ({comments.length})</Text>
          {comments.map(comment => (
            <View key={comment.id} style={styles.commentItem}>
              <TouchableOpacity onPress={() => onUserPress(post.user_id)}>
                <Image
                  source={{
                    uri: comment.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
                  }}
                  style={styles.commentAvatar}
                />
              </TouchableOpacity>
              <View style={styles.commentContent}>
                <Text style={styles.commentNickname}>{comment.nickname}</Text>
                <Text style={styles.commentText}>{comment.content}</Text>
                <Text style={styles.commentTime}>{formatTime(comment.created_at)}</Text>
              </View>
            </View>
          ))}
          {comments.length === 0 && (
            <View style={styles.emptyComments}>
              <Text style={styles.emptyText}>暂无评论，快来抢沙发吧</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 评论输入 */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="写下你的评论..."
          placeholderTextColor="#A89F91"
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={200}
        />
        <TouchableOpacity
          style={[styles.submitButton, (!commentText.trim() || submitting) && styles.submitDisabled]}
          onPress={handleComment}
          disabled={!commentText.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FDFBF7" />
          ) : (
            <Text style={styles.submitText}>发送</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 32,
    color: '#8B4513',
    fontWeight: '300',
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
  },
  postCard: {
    backgroundColor: '#FDFBF7',
    margin: 16,
    borderRadius: 16,
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#F5F0E6',
  },
  userDetail: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nickname: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  memberBadge: {
    marginLeft: 8,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  memberText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  timeText: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 2,
  },
  remainDays: {
    backgroundColor: 'rgba(139, 69, 19, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  remainDaysText: {
    fontSize: 12,
    color: '#8B4513',
    fontWeight: '500',
  },
  postContent: {
    fontSize: 15,
    color: '#2C2C2C',
    lineHeight: 24,
    marginBottom: 12,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  postImage: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  actionBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0EBE0',
    paddingTop: 12,
    marginTop: 4,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionIcon: {
    fontSize: 18,
    marginRight: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#8B7355',
  },
  commentsSection: {
    padding: 16,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: '#FDFBF7',
    borderRadius: 12,
    padding: 12,
  },
  commentNickname: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#2C2C2C',
    lineHeight: 20,
  },
  commentTime: {
    fontSize: 11,
    color: '#8B7355',
    marginTop: 6,
  },
  emptyComments: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#8B7355',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#FDFBF7',
    borderTopWidth: 1,
    borderTopColor: '#E8E0D0',
    gap: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F5F0E6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#2C2C2C',
    maxHeight: 80,
  },
  submitButton: {
    backgroundColor: '#8B4513',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  submitDisabled: {
    backgroundColor: '#D4C9B8',
  },
  submitText: {
    color: '#FDFBF7',
    fontSize: 15,
    fontWeight: '600',
  },
});
