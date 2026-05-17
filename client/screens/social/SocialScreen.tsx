import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import api from '@/services/api';
import { buildAssetUrl } from '@/utils';

interface User {
  id: number;
  nickname: string;
  avatar: string | null;
  member_level: number;
  is_following: boolean;
  followed_at?: string;
}

interface Conversation {
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
  is_read: boolean;
  other_id: number;
  nickname: string;
  avatar: string | null;
}

interface Props {
  onChatPress: (userId: number) => void;
  onUserPress: (userId: number) => void;
}

export default function SocialScreen({ onChatPress, onUserPress }: Props) {
  const [activeTab, setActiveTab] = useState<'followers' | 'following' | 'friends' | 'chats'>('following');
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [activeTab])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'following') {
        const { following: data } = await api.getFollowing();
        setFollowing(data);
      } else if (activeTab === 'followers') {
        const { followers: data } = await api.getFollowers();
        setFollowers(data);
      } else if (activeTab === 'friends') {
        const { friends: data } = await api.getFriends();
        setFriends(data);
      } else if (activeTab === 'chats') {
        const { conversations: data } = await api.getConversations();
        setConversations(data);
      }
    } catch (error: any) {
      Alert.alert('加载失败', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      Alert.alert('提示', '请输入至少2个字符');
      return;
    }
    setSearching(true);
    try {
      const { users } = await api.searchUsers(searchQuery);
      setSearchResults(users);
    } catch (error: any) {
      Alert.alert('搜索失败', error.message);
    } finally {
      setSearching(false);
    }
  };

  const handleFollow = async (userId: number, isCurrentlyFollowing: boolean) => {
    try {
      if (isCurrentlyFollowing) {
        await api.unfollowUser(userId);
      } else {
        await api.followUser(userId);
      }
      loadData();
      setSearchResults(prev =>
        prev.map(u => u.id === userId ? { ...u, is_following: !isCurrentlyFollowing } : u)
      );
    } catch (error: any) {
      Alert.alert('操作失败', error.message);
    }
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
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.userItem} onPress={() => onUserPress(item.id)}>
      <Image
        source={{
          uri: item.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
        }}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.nickname}>{item.nickname}</Text>
          <View style={[styles.memberBadge, { backgroundColor: getMemberColor(item.member_level) }]}>
            <Text style={styles.memberText}>{getMemberBadge(item.member_level)}</Text>
          </View>
        </View>
        <Text style={styles.timeText}>
          {item.followed_at ? `关注于 ${formatTime(item.followed_at)}` : ''}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.followButton, item.is_following && styles.followingButton]}
        onPress={() => handleFollow(item.id, item.is_following)}
      >
        <Text style={[styles.followText, item.is_following && styles.followingText]}>
          {item.is_following ? '已关注' : '关注'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderFriendItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.userItem} onPress={() => onChatPress(item.id)}>
      <View style={styles.avatarContainer}>
        <Image
          source={{
            uri: item.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
          }}
          style={styles.avatar}
        />
        {item.unread_count > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unread_count > 99 ? '99+' : item.unread_count}</Text>
          </View>
        )}
      </View>
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.nickname}>{item.nickname}</Text>
          {item.last_message_at && (
            <Text style={styles.timeText}>{formatTime(item.last_message_at)}</Text>
          )}
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.last_message || '开始聊天吧'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity style={styles.userItem} onPress={() => onChatPress(item.other_id)}>
      <View style={styles.avatarContainer}>
        <Image
          source={{
            uri: item.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
          }}
          style={styles.avatar}
        />
        {!item.is_read && (
          <View style={styles.unreadDot} />
        )}
      </View>
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.nickname}>{item.nickname}</Text>
          <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
        </View>
        <Text style={[styles.lastMessage, !item.is_read && styles.unreadMessage]} numberOfLines={1}>
          {item.content}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderSearchResults = () => (
    <View style={styles.searchResults}>
      {searchResults.map(user => (
        <View key={user.id} style={styles.userItem}>
          <Image
            source={{
              uri: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
            }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.nickname}>{user.nickname}</Text>
              <View style={[styles.memberBadge, { backgroundColor: getMemberColor(user.member_level) }]}>
                <Text style={styles.memberText}>{getMemberBadge(user.member_level)}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.followButton, user.is_following && styles.followingButton]}
            onPress={() => handleFollow(user.id, user.is_following)}
          >
            <Text style={[styles.followText, user.is_following && styles.followingText]}>
              {user.is_following ? '已关注' : '关注'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
        </View>
      );
    }

    const data = activeTab === 'followers' ? followers
      : activeTab === 'following' ? following
      : activeTab === 'friends' ? friends
      : conversations;

    if (searchResults.length > 0) {
      return renderSearchResults();
    }

    if (data.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>
            {activeTab === 'followers' ? '粉' : activeTab === 'following' ? '关' : activeTab === 'friends' ? '友' : '消'}
          </Text>
          <Text style={styles.emptyText}>
            {activeTab === 'followers' ? '还没有粉丝' 
              : activeTab === 'following' ? '还没有关注任何人' 
              : activeTab === 'friends' ? '还没有好友' 
              : '还没有私信'}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={data as any}
        renderItem={activeTab === 'chats' ? renderConversationItem as any
          : activeTab === 'friends' ? renderFriendItem as any
          : renderUserItem as any}
        keyExtractor={item => (item as any).id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#8B4513" />
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>江湖社交</Text>
      </View>

      {/* 搜索栏 */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索江湖好友..."
          placeholderTextColor="#A89F91"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={searching}>
          {searching ? (
            <ActivityIndicator size="small" color="#8B4513" />
          ) : (
            <Text style={styles.searchButtonText}>搜索</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 清空搜索 */}
      {searchResults.length > 0 && (
        <TouchableOpacity style={styles.clearSearch} onPress={() => setSearchResults([])}>
          <Text style={styles.clearSearchText}>清空搜索结果</Text>
        </TouchableOpacity>
      )}

      {/* 标签页 */}
      <View style={styles.tabs}>
        {[
          { key: 'following', label: '关注' },
          { key: 'followers', label: '粉丝' },
          { key: 'friends', label: '好友' },
          { key: 'chats', label: '私信' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => {
              setActiveTab(tab.key as any);
              setSearchResults([]);
            }}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E6',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C2C2C',
    letterSpacing: 2,
  },
  searchBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#FDFBF7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2C2C2C',
  },
  searchButton: {
    backgroundColor: '#8B4513',
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#FDFBF7',
    fontSize: 14,
    fontWeight: '600',
  },
  clearSearch: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  clearSearchText: {
    color: '#8B7355',
    fontSize: 14,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#FDFBF7',
  },
  tabActive: {
    backgroundColor: '#8B4513',
  },
  tabText: {
    fontSize: 14,
    color: '#8B7355',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FDFBF7',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  searchResults: {
    paddingHorizontal: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDFBF7',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#F5F0E6',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#C0392B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#C0392B',
    borderWidth: 2,
    borderColor: '#F5F0E6',
  },
  userInfo: {
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
  lastMessage: {
    fontSize: 13,
    color: '#8B7355',
    marginTop: 4,
  },
  unreadMessage: {
    color: '#2C2C2C',
    fontWeight: '500',
  },
  followButton: {
    borderWidth: 1,
    borderColor: '#8B4513',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  followingButton: {
    backgroundColor: '#8B4513',
  },
  followText: {
    fontSize: 13,
    color: '#8B4513',
    fontWeight: '500',
  },
  followingText: {
    color: '#FDFBF7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#8B7355',
  },
});
