import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from '@/hooks/useSafeRouter';
import { apiService } from '@/services/api';
import { useAuthStore } from '@/contexts/AuthContext';
import { FontAwesome } from '@expo/vector-icons';

interface PostDetailScreenProps {
  postId: string;
}

export default function PostDetailScreen({ postId }: PostDetailScreenProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPostDetail = useCallback(async () => {
    try {
      const data = await apiService.getPost(parseInt(postId));
      setPost(data.post);
      setComments(data.comments || []);
    } catch (error: any) {
      Alert.alert('加载失败', error.message);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPostDetail();
  }, [fetchPostDetail]);

  const handleLike = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    try {
      await apiService.likePost(parseInt(postId));
      setPost(prev => prev ? {
        ...prev,
        is_liked: !prev.is_liked,
        like_count: prev.is_liked ? prev.like_count - 1 : prev.like_count + 1,
      } : null);
    } catch (error: any) {
      Alert.alert('操作失败', error.message);
    }
  };

  const handleComment = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      await apiService.createComment(parseInt(postId), commentText);
      const newComment = {
        id: Date.now(),
        post_id: parseInt(postId),
        user_id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        content: commentText,
        created_at: new Date().toISOString(),
        parent_id: null,
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

  const handleMessage = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    router.push(`/chat/${post.user_id}`);
  };

  const handleShare = async () => {
    const shareContent = `${post.nickname}的漂流信：${post.content.substring(0, 50)}${post.content.length > 50 ? '...' : ''}`;
    const shareUrl = `liuhenjianghu.com/post/${post.id}`;
    
    try {
      await Share.share({
        message: `${shareContent}\n\n🔗 ${shareUrl}`,
        title: '漂流信 - 来自江湖的你',
      });
    } catch (error: any) {
      // 如果内置分享失败，使用剪贴板
      try {
        await Clipboard.setStringAsync(`${shareContent}\n\n${shareUrl}`);
        Alert.alert('已复制', '分享链接已复制到剪贴板');
      } catch {
        Alert.alert('分享失败', '请稍后重试');
      }
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
          <ActivityIndicator size="large" color="#C9A96E" />
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>留言详情</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 帖子内容 */}
          <View style={styles.postCard}>
            <View style={styles.userInfoRow}>
              <TouchableOpacity style={styles.userInfo} onPress={() => router.push(`/user/${post.user_id}`)}>
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
              </TouchableOpacity>
              {/* 发私信按钮 */}
              {user && user.id !== post.user_id && (
                <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
                  <FontAwesome name="comment" size={14} color="#C9A96E" />
                  <Text style={styles.messageButtonText}>私信</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.postContent}>{post.content}</Text>

            {images.length > 0 && (
              <View style={styles.imagesContainer}>
                {images.map((img: string, index: number) => (
                  <Image
                    key={index}
                    source={{ uri: img }}
                    style={styles.postImage}
                    resizeMode="cover"
                  />
                ))}
              </View>
            )}

            <View style={styles.remainDays}>
              <Text style={styles.remainDaysText}>剩余 {daysRemaining} 天</Text>
            </View>

            <View style={styles.actionBar}>
              <TouchableOpacity style={styles.actionItem} onPress={handleLike}>
                <FontAwesome name={post.is_liked ? 'heart' : 'heart-o'} size={20} color="#DC2626" />
                <Text style={styles.actionText}>{post.like_count} 赞</Text>
              </TouchableOpacity>
              <View style={styles.actionItem}>
                <Text style={styles.actionIcon}>评</Text>
                <Text style={styles.actionText}>{post.comment_count} 评论</Text>
              </View>
              <TouchableOpacity style={styles.actionItem} onPress={handleShare}>
                <FontAwesome name="share" size={20} color="#C9A96E" />
                <Text style={styles.actionText}>分享</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 评论区 */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>评论 ({comments.length})</Text>
            {comments.map(comment => (
              <View key={comment.id} style={styles.commentItem}>
                <TouchableOpacity onPress={() => router.push(`/user/${comment.user_id}`)}>
                  <Image
                    source={{
                      uri: comment.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
                    }}
                    style={styles.commentAvatar}
                  />
                </TouchableOpacity>
                <View style={styles.commentContent}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentNickname}>{comment.nickname}</Text>
                    {user && user.id !== comment.user_id && (
                      <TouchableOpacity
                        style={styles.replyButton}
                        onPress={() => router.push(`/chat/${comment.user_id}`)}
                      >
                        <FontAwesome name="comment" size={12} color="#C9A96E" />
                        <Text style={styles.replyButtonText}>私信</Text>
                      </TouchableOpacity>
                    )}
                  </View>
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
      </KeyboardAvoidingView>
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
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF8F0',
    borderWidth: 1,
    borderColor: '#C9A96E',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  messageButtonText: {
    fontSize: 12,
    color: '#C9A96E',
    marginLeft: 4,
  },
  remainDays: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5F0E6',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  remainDaysText: {
    fontSize: 12,
    color: '#8B7355',
  },
  postContent: {
    fontSize: 16,
    color: '#2C2C2C',
    lineHeight: 24,
    marginBottom: 12,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  postImage: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    marginRight: '3%',
    marginBottom: 8,
  },
  actionBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E8E0D0',
    paddingTop: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionIcon: {
    fontSize: 16,
    color: '#8B7355',
    marginRight: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#8B7355',
    marginLeft: 4,
  },
  commentsSection: {
    backgroundColor: '#FDFBF7',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
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
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentNickname: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF8F0',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  replyButtonText: {
    fontSize: 11,
    color: '#C9A96E',
    marginLeft: 3,
  },
  commentText: {
    fontSize: 14,
    color: '#4A4A4A',
    marginTop: 4,
    lineHeight: 20,
  },
  commentTime: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 4,
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: 24,
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
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F5F0E6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#2C2C2C',
  },
  submitButton: {
    backgroundColor: '#C9A96E',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginLeft: 10,
  },
  submitDisabled: {
    backgroundColor: '#D4C4A8',
  },
  submitText: {
    color: '#FDFBF7',
    fontSize: 15,
    fontWeight: '600',
  },
});
