import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faHeart as faHeartFilled } from '@fortawesome/free-solid-svg-icons';
import { faHeart } from '@fortawesome/free-regular-svg-icons';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { buildAssetUrl } from '@/utils';

interface Post {
  id: number;
  user_id: number;
  content: string;
  images: string[];
  region_code: string;
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

interface Props {
  onPostPress: (post: Post) => void;
}

// 滚动公告栏组件
function RollingAnnouncement({ posts }: { posts: Post[] }) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 只显示最新的3条动态
  const recentPosts = posts.slice(0, 3);

  useEffect(() => {
    if (recentPosts.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => {
          const next = (prev + 1) % recentPosts.length;
          scrollViewRef.current?.scrollTo({
            x: next * 300,
            animated: true,
          });
          return next;
        });
      }, 3000);

      return () => clearInterval(timer);
    }
  }, [recentPosts.length]);

  if (recentPosts.length === 0) return null;

  return (
    <View style={styles.announcementContainer}>
      <View style={styles.announcementBadge}>
        <Text style={styles.announcementBadgeText}>最新</Text>
      </View>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.announcementScroll}
      >
        {recentPosts.map((post, index) => (
          <View key={post.id} style={styles.announcementItem}>
            <Text style={styles.announcementText} numberOfLines={1}>
              <Text style={styles.announcementHighlight}>{post.nickname}</Text>
              {' 发布了新动态'}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// 新帖子提示组件
function NewPostAlert({ onPress }: { onPress: () => void }) {
  const translateY = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    // 从顶部滑入
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    // 3秒后自动隐藏
    const timer = setTimeout(() => {
      Animated.timing(translateY, {
        toValue: -60,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 5000);

    return () => clearTimeout(timer);
  }, [translateY]);

  return (
    <Animated.View
      style={[
        styles.newPostAlert,
        { transform: [{ translateY }] },
      ]}
    >
      <TouchableOpacity
        style={styles.newPostAlertContent}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <Text style={styles.newPostAlertText}>发现新动态，点击查看</Text>
        <Text style={styles.newPostAlertArrow}>↓</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// 漂流瓶帖子卡片
function FloatingPostCard({
  item,
  onPress,
  onLike,
  likeLoading,
  index,
  totalCount,
}: {
  item: Post;
  onPress: () => void;
  onLike: () => void;
  likeLoading: boolean;
  index: number;
  totalCount: number;
}) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const images = typeof item.images === 'string' ? JSON.parse(item.images) : item.images || [];

  // 根据索引创建不同的浮动动画
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000 + index * 500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000 + index * 500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [floatAnim, index]);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8], // 上下浮动8像素
  });

  const opacity = floatAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.95, 1],
  });

  const daysRemaining = Math.ceil(
    (new Date(item.expire_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

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
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  return (
    <Animated.View
      style={[
        styles.postCard,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.95}>
        {/* 置顶标识 */}
        {item.is_pinned && (
          <View style={styles.pinnedBadge}>
            <Text style={styles.pinnedText}>置顶</Text>
          </View>
        )}

        {/* 用户信息 */}
        <View style={styles.userInfo}>
          <Image
            source={{
              uri: item.avatar
                ? buildAssetUrl(item.avatar)
                : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
            }}
            style={styles.avatar}
          />
          <View style={styles.userDetail}>
            <View style={styles.nameRow}>
              <Text style={styles.nickname}>{item.nickname}</Text>
              <View style={[styles.memberBadge, { backgroundColor: getMemberColor(item.member_level) }]}>
                <Text style={styles.memberText}>{getMemberBadge(item.member_level)}</Text>
              </View>
            </View>
            <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
          </View>
          <View style={styles.remainDays}>
            <Text style={styles.remainDaysText}>剩余</Text>
            <Text style={styles.remainDaysNumber}>{daysRemaining}</Text>
            <Text style={styles.remainDaysText}>天</Text>
          </View>
        </View>

        {/* 内容 */}
        <Text style={styles.content} numberOfLines={5}>
          {item.content}
        </Text>

        {/* 图片 */}
        {images.length > 0 && (
          <View style={styles.imagesContainer}>
            {images.slice(0, 4).map((img: string, idx: number) => (
              <Image
                key={idx}
                source={{ uri: buildAssetUrl(img) }}
                style={[
                  styles.postImage,
                  images.length === 1 && styles.singleImage,
                ]}
              />
            ))}
          </View>
        )}

        {/* 操作栏 */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={onLike}
            disabled={likeLoading}
          >
            {likeLoading ? (
              <ActivityIndicator size="small" color="#C0392B" />
            ) : (
              <FontAwesomeIcon
                icon={item.is_liked ? faHeartFilled : faHeart}
                size={20}
                color={item.is_liked ? '#C0392B' : '#8B7355'}
              />
            )}
            <Text style={[styles.actionText, item.is_liked && styles.actionTextActive]}>
              {item.like_count}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={onPress}>
            <Text style={styles.actionIcon}>评</Text>
            <Text style={styles.actionText}>{item.comment_count}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => Alert.alert('举报', '确定要举报这条留言吗？')}
          >
            <Text style={styles.actionIcon}>举</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen({ onPostPress }: Props) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [likeLoading, setLikeLoading] = useState<number | null>(null);
  const [showNewPostAlert, setShowNewPostAlert] = useState(false);
  const [newPostCount, setNewPostCount] = useState(0);
  const prevPostsCount = useRef(0);

  const loadPosts = async (refresh = false) => {
    try {
      const newPage = refresh ? 1 : page;
      const result = await api.getPosts(newPage, 20);

      if (refresh) {
        // 检查是否有新帖子
        if (posts.length > 0 && result.posts.length > posts.length) {
          setNewPostCount(result.posts.length - posts.length);
          setShowNewPostAlert(true);
        }
        setPosts(result.posts);
        setPage(2);
      } else {
        setPosts((prev) => [...prev, ...result.posts]);
        setPage(newPage + 1);
      }
      setHasMore(result.page < result.totalPages);
    } catch (error: any) {
      Alert.alert('加载失败', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPosts(true);
    }, [])
  );

  // 检测新帖子
  useEffect(() => {
    if (posts.length > prevPostsCount.current && prevPostsCount.current > 0) {
      const newCount = posts.length - prevPostsCount.current;
      setNewPostCount(newCount);
      setShowNewPostAlert(true);
    }
    prevPostsCount.current = posts.length;
  }, [posts.length]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadPosts(true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadPosts();
    }
  };

  const handleLike = async (postId: number) => {
    setLikeLoading(postId);
    try {
      const result = await api.toggleLike(postId);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, is_liked: result.liked, like_count: result.like_count }
            : post
        )
      );
    } catch (error: any) {
      Alert.alert('操作失败', error.message);
    } finally {
      setLikeLoading(null);
    }
  };

  const handleNewPostPress = () => {
    setShowNewPostAlert(false);
    handleRefresh();
  };

  const renderItem = ({ item, index }: { item: Post; index: number }) => (
    <FloatingPostCard
      item={item}
      onPress={() => onPostPress(item)}
      onLike={() => handleLike(item.id)}
      likeLoading={likeLoading === item.id}
      index={index}
      totalCount={posts.length}
    />
  );

  const renderHeader = () => (
    <View>
      {/* 标题区域 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>流痕江湖</Text>
        <Text style={styles.headerSlogan}>人海为江湖，留言皆流痕</Text>
      </View>

      {/* 滚动公告栏 */}
      <RollingAnnouncement posts={posts} />
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>江</Text>
      <Text style={styles.emptyTitle}>江湖寂寞</Text>
      <Text style={styles.emptyText}>还没有留言，来发一条吧</Text>
    </View>
  );

  if (loading && posts.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>江湖正在加载...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 新帖子提示 */}
      {showNewPostAlert && (
        <NewPostAlert onPress={handleNewPostPress} />
      )}

      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#8B4513"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
      />
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
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#8B7355',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2C2C2C',
    letterSpacing: 4,
  },
  headerSlogan: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 4,
    letterSpacing: 2,
  },
  // 滚动公告栏样式
  announcementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 69, 19, 0.1)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  announcementBadge: {
    backgroundColor: '#C0392B',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  announcementBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  announcementScroll: {
    flex: 1,
    marginLeft: 8,
  },
  announcementItem: {
    width: 280,
    paddingRight: 16,
  },
  announcementText: {
    fontSize: 13,
    color: '#5D4E37',
  },
  announcementHighlight: {
    color: '#8B4513',
    fontWeight: '600',
  },
  // 新帖子提示样式
  newPostAlert: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 44, // 安全区
  },
  newPostAlertContent: {
    backgroundColor: '#C0392B',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 40,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  newPostAlertText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  newPostAlertArrow: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  // 帖子卡片样式
  postCard: {
    backgroundColor: '#FDFBF7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  pinnedBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#C0392B',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 1,
  },
  pinnedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
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
    borderRadius: 10,
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
    alignItems: 'center',
    backgroundColor: 'rgba(139, 69, 19, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  remainDaysText: {
    fontSize: 10,
    color: '#8B7355',
  },
  remainDaysNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#8B4513',
  },
  content: {
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
  singleImage: {
    width: '60%',
    aspectRatio: 1,
    alignSelf: 'center',
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
  actionIconActive: {
    color: '#C0392B',
  },
  actionText: {
    fontSize: 14,
    color: '#8B7355',
  },
  actionTextActive: {
    color: '#C0392B',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8B7355',
  },
});
