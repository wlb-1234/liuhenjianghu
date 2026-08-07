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
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRegionCode, setSelectedRegionCode] = useState<string>('');
  const [selectedRegionName, setSelectedRegionName] = useState<string>('');
  const [selectedRegionLevel, setSelectedRegionLevel] = useState<number>(4); // 1=省, 2=市, 3=县, 4=镇
  const [showRegionModal, setShowRegionModal] = useState(false);
  
  // 级联选择器状态
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [streets, setStreets] = useState<any[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<any>(null);
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<any>(null);
  const [selectedStreet, setSelectedStreet] = useState<any>(null);
  const categories = [
    { code: '', name: '全部' },
    { code: 'social', name: '社交' },
    { code: 'trade', name: '交易' },
    { code: 'help', name: '求助' },
    { code: 'share', name: '分享' },
    { code: 'other', name: '其他' },
  ];

  // 加载省份数据
  const loadProvinces = async () => {
    try {
      const { data } = await api.getProvinces();
      setProvinces(data);
    } catch (error) {
      console.error('加载省份失败:', error);
    }
  };

  // 加载城市数据
  const loadCities = async (provinceCode: string) => {
    try {
      const { data } = await api.getCities(provinceCode);
      setCities(data);
      setDistricts([]);
      setStreets([]);
      setSelectedCity(null);
      setSelectedDistrict(null);
      setSelectedStreet(null);
    } catch (error) {
      console.error('加载城市失败:', error);
    }
  };

  // 加载区县数据
  const loadDistricts = async (cityCode: string) => {
    try {
      const { data } = await api.getDistricts(cityCode);
      setDistricts(data);
      setStreets([]);
      setSelectedDistrict(null);
      setSelectedStreet(null);
    } catch (error) {
      console.error('加载区县失败:', error);
    }
  };

  // 加载乡镇数据
  const loadStreets = async (districtCode: string) => {
    try {
      const { data } = await api.getTowns(districtCode);
      setStreets(data);
      setSelectedStreet(null);
    } catch (error) {
      console.error('加载乡镇失败:', error);
    }
  };

  // 选择省份
  const handleProvinceSelect = (province: any) => {
    setSelectedProvince(province);
    loadCities(province.code);
  };

  // 选择城市
  const handleCitySelect = (city: any) => {
    setSelectedCity(city);
    loadDistricts(city.code);
  };

  // 选择区县
  const handleDistrictSelect = (district: any) => {
    setSelectedDistrict(district);
    loadStreets(district.code);
  };

  // 选择乡镇
  const handleStreetSelect = (street: any) => {
    setSelectedStreet(street);
  };

  // 确认选择区域
  const handleConfirmRegion = () => {
    if (selectedStreet) {
      setSelectedRegionCode(selectedStreet.code);
      setSelectedRegionName(selectedStreet.name);
      setSelectedRegionLevel(4);
    } else if (selectedDistrict) {
      setSelectedRegionCode(selectedDistrict.code);
      setSelectedRegionName(selectedDistrict.name);
      setSelectedRegionLevel(3);
    } else if (selectedCity) {
      setSelectedRegionCode(selectedCity.code);
      setSelectedRegionName(selectedCity.name);
      setSelectedRegionLevel(2);
    } else if (selectedProvince) {
      setSelectedRegionCode(selectedProvince.code);
      setSelectedRegionName(selectedProvince.name);
      setSelectedRegionLevel(1);
    }
    setShowRegionModal(false);
    // 重置选择
    setSelectedProvince(null);
    setSelectedCity(null);
    setSelectedDistrict(null);
    setSelectedStreet(null);
    setCities([]);
    setDistricts([]);
    setStreets([]);
  };

  // 初始化默认区域（根据会员等级）
  useEffect(() => {
    if (user) {
      // 会员等级：0=散人, 1=县帮, 2=市盟, 3=省派, 4=会主
      // 会员等级对应的区域级别：会员显示最高等级，非会员显示镇级
      let defaultRegionCode = '';
      let defaultRegionName = '';
      let defaultRegionLevel = 4; // 默认镇级

      if (user.member_level && user.member_level > 0) {
        // 会员：显示最高等级对应的区域
        if (user.member_level >= 4 && user.province_code) {
          defaultRegionCode = user.province_code;
          defaultRegionName = user.province_name || '';
          defaultRegionLevel = 1;
        } else if (user.member_level >= 3 && user.city_code) {
          defaultRegionCode = user.city_code;
          defaultRegionName = user.city_name || '';
          defaultRegionLevel = 2;
        } else if (user.member_level >= 2 && user.district_code) {
          defaultRegionCode = user.district_code;
          defaultRegionName = user.district_name || '';
          defaultRegionLevel = 3;
        } else if (user.member_level >= 1 && user.town_code) {
          defaultRegionCode = user.town_code;
          defaultRegionName = user.town_name || '';
          defaultRegionLevel = 4;
        }
      } else {
        // 非会员：显示镇级
        defaultRegionCode = user.town_code || '';
        defaultRegionName = user.town_name || '';
        defaultRegionLevel = 4;
      }

      setSelectedRegionCode(defaultRegionCode);
      setSelectedRegionName(defaultRegionName);
      setSelectedRegionLevel(defaultRegionLevel);
    }
  }, [user]);

  const loadPosts = async (refresh = false) => {
    try {
      const newPage = refresh ? 1 : page;
      const result = await api.getPosts(newPage, 20, selectedRegionCode);

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
    }, [selectedRegionCode])
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

      {/* 区域级别选择 */}
      <View style={styles.regionLevelContainer}>
        <View style={styles.regionLevelButtons}>
          {[
            { level: 0, name: '全国' },
            { level: 1, name: '省' },
            { level: 2, name: '市' },
            { level: 3, name: '县' },
            { level: 4, name: '镇' },
          ].map((item) => (
            <TouchableOpacity
              key={item.level}
              style={[
                styles.regionLevelButton,
                selectedRegionLevel === item.level && styles.regionLevelButtonActive,
              ]}
              onPress={() => {
                // 根据用户信息获取对应级别的区域代码
                let code = '';
                let name = '';
                if (item.level === 0) {
                  code = '0000000000';
                  name = '全国';
                } else if (item.level === 1 && user?.province_code) {
                  code = user.province_code;
                  name = user.province_name || '';
                } else if (item.level === 2 && user?.city_code) {
                  code = user.city_code;
                  name = user.city_name || '';
                } else if (item.level === 3 && user?.district_code) {
                  code = user.district_code;
                  name = user.district_name || '';
                } else if (item.level === 4 && user?.town_code) {
                  code = user.town_code;
                  name = user.town_name || '';
                }
                setSelectedRegionCode(code);
                setSelectedRegionName(name);
                setSelectedRegionLevel(item.level);
              }}
            >
              <Text
                style={[
                  styles.regionLevelText,
                  selectedRegionLevel === item.level && styles.regionLevelTextActive,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={styles.otherRegionButton}
          onPress={() => {
          setShowRegionModal(true);
          loadProvinces();
        }}
        >
          <Text style={styles.otherRegionText}>其他留言</Text>
        </TouchableOpacity>
      </View>

      {/* 当前区域显示 */}
      <View style={styles.currentRegionContainer}>
        <Text style={styles.currentRegionText}>
          当前查看：{selectedRegionName || '未选择区域'}
        </Text>
      </View>

      {/* 分类筛选 */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.code}
              style={[styles.categoryItem, selectedCategory === cat.code && styles.categoryItemActive]}
              onPress={() => setSelectedCategory(cat.code)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat.code && styles.categoryTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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

      {/* 区域选择 Modal - 级联选择器 */}
      {showRegionModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择区域</Text>
              <TouchableOpacity onPress={() => setShowRegionModal(false)}>
                <Text style={styles.modalClose}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {/* 全国选项 */}
              {user?.member_level >= 4 && (
                <TouchableOpacity
                  style={styles.cascadeOption}
                  onPress={() => {
                    setSelectedRegionCode('0000000000');
                    setSelectedRegionName('全国');
                    setSelectedRegionLevel(0);
                    setShowRegionModal(false);
                  }}
                >
                  <Text style={styles.cascadeOptionText}>全国</Text>
                </TouchableOpacity>
              )}

              {/* 省份选择 */}
              <Text style={styles.cascadeLabel}>选择省份</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cascadeScroll}>
                {provinces.map((province) => (
                  <TouchableOpacity
                    key={province.code}
                    style={[
                      styles.cascadeItem,
                      selectedProvince?.code === province.code && styles.cascadeItemSelected,
                    ]}
                    onPress={() => handleProvinceSelect(province)}
                  >
                    <Text style={[
                      styles.cascadeItemText,
                      selectedProvince?.code === province.code && styles.cascadeItemTextSelected,
                    ]}>
                      {province.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* 城市选择 */}
              {cities.length > 0 && (
                <>
                  <Text style={styles.cascadeLabel}>选择城市</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cascadeScroll}>
                    {cities.map((city) => (
                      <TouchableOpacity
                        key={city.code}
                        style={[
                          styles.cascadeItem,
                          selectedCity?.code === city.code && styles.cascadeItemSelected,
                        ]}
                        onPress={() => handleCitySelect(city)}
                      >
                        <Text style={[
                          styles.cascadeItemText,
                          selectedCity?.code === city.code && styles.cascadeItemTextSelected,
                        ]}>
                          {city.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* 区县选择 */}
              {districts.length > 0 && (
                <>
                  <Text style={styles.cascadeLabel}>选择区县</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cascadeScroll}>
                    {districts.map((district) => (
                      <TouchableOpacity
                        key={district.code}
                        style={[
                          styles.cascadeItem,
                          selectedDistrict?.code === district.code && styles.cascadeItemSelected,
                        ]}
                        onPress={() => handleDistrictSelect(district)}
                      >
                        <Text style={[
                          styles.cascadeItemText,
                          selectedDistrict?.code === district.code && styles.cascadeItemTextSelected,
                        ]}>
                          {district.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* 乡镇选择 */}
              {streets.length > 0 && (
                <>
                  <Text style={styles.cascadeLabel}>选择乡镇/街道</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cascadeScroll}>
                    {streets.map((street) => (
                      <TouchableOpacity
                        key={street.code}
                        style={[
                          styles.cascadeItem,
                          selectedStreet?.code === street.code && styles.cascadeItemSelected,
                        ]}
                        onPress={() => handleStreetSelect(street)}
                      >
                        <Text style={[
                          styles.cascadeItemText,
                          selectedStreet?.code === street.code && styles.cascadeItemTextSelected,
                        ]}>
                          {street.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* 已选区域显示 */}
              {(selectedProvince || selectedCity || selectedDistrict || selectedStreet) && (
                <View style={styles.selectedRegionDisplay}>
                  <Text style={styles.selectedRegionLabel}>已选区域：</Text>
                  <Text style={styles.selectedRegionText}>
                    {selectedProvince?.name || ''}
                    {selectedCity?.name ? ' ' + selectedCity.name : ''}
                    {selectedDistrict?.name ? ' ' + selectedDistrict.name : ''}
                    {selectedStreet?.name ? ' ' + selectedStreet.name : ''}
                  </Text>
                </View>
              )}

              {/* 确认按钮 */}
              {(selectedProvince || selectedCity || selectedDistrict || selectedStreet) && (
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirmRegion}
                >
                  <Text style={styles.confirmButtonText}>确认选择</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const cascadeStyles = {
  cascadeOption: {
    padding: 16,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  cascadeOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4AF37',
    textAlign: 'center',
  },
  cascadeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B7355',
    marginBottom: 8,
    marginTop: 16,
  },
  cascadeScroll: {
    marginBottom: 8,
  },
  cascadeItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(139,115,85,0.1)',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(139,115,85,0.2)',
  },
  cascadeItemSelected: {
    backgroundColor: 'rgba(212,175,55,0.2)',
    borderColor: '#D4AF37',
  },
  cascadeItemText: {
    fontSize: 14,
    color: '#8B7355',
  },
  cascadeItemTextSelected: {
    color: '#D4AF37',
    fontWeight: '600',
  },
  selectedRegionDisplay: {
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(212,175,55,0.05)',
    borderRadius: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectedRegionLabel: {
    fontSize: 13,
    color: '#8B7355',
    fontWeight: '500',
  },
  selectedRegionText: {
    fontSize: 13,
    color: '#D4AF37',
    fontWeight: '600',
  },
  confirmButton: {
    marginTop: 20,
    padding: 14,
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
};

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
  // 分类标签栏
  categoryContainer: {
    paddingVertical: 12,
    marginBottom: 8,
  },
  categoryScroll: {
    flexGrow: 0,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  categoryItemActive: {
    backgroundColor: '#C0392B',
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  categoryTabActive: {
    backgroundColor: '#C0392B',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
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
  regionSelectorContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  regionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E0D0',
  },
  regionSelectorIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  regionSelectorText: {
    flex: 1,
    fontSize: 15,
    color: '#2C2C2C',
    fontWeight: '500',
  },
  regionSelectorArrow: {
    fontSize: 12,
    color: '#8B7355',
  },
  regionLevelContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  regionLevelButtons: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E8E0D0',
  },
  regionLevelButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  regionLevelButtonActive: {
    backgroundColor: '#8B4513',
  },
  regionLevelText: {
    fontSize: 14,
    color: '#8B7355',
    fontWeight: '500',
  },
  regionLevelTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  otherRegionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F5F0E6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E0D0',
  },
  otherRegionText: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '500',
  },
  currentRegionContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  currentRegionText: {
    fontSize: 13,
    color: '#8B7355',
  },
  modalOverlay: {
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
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '85%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  modalClose: {
    fontSize: 28,
    color: '#8B7355',
    lineHeight: 28,
  },
  modalBody: {
    maxHeight: 400,
    paddingHorizontal: 8,
  },
  regionSection: {
    marginBottom: 16,
  },
  regionSectionTitle: {
    fontSize: 14,
    color: '#8B7355',
    fontWeight: '600',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  regionOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F9F6F0',
    borderRadius: 10,
    marginHorizontal: 4,
  },
  regionOptionActive: {
    backgroundColor: '#F5F0E6',
  },
  regionOptionText: {
    fontSize: 16,
    color: '#2C2C2C',
    flex: 1,
  },
  regionOptionTextActive: {
    color: '#8B4513',
    fontWeight: '600',
  },
  regionOptionConfirm: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F5F0E6',
    borderRadius: 6,
  },
  ...cascadeStyles,
});
