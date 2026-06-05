import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, TextInput, Modal, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import adminService, { UserInfo, MemberLevel } from '@/services/adminService';

export default function UserManageScreen() {
  const router = useSafeRouter();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [levels, setLevels] = useState<MemberLevel[]>([]);

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [selectedLevel, setSelectedLevel] = useState(0);

  const limit = 20;

  const fetchUsers = useCallback(async (pageNum: number = 1, searchKeyword: string = keyword) => {
    try {
      const res = await adminService.getUsers({
        page: pageNum,
        limit,
        keyword: searchKeyword || undefined,
      });
      if (res.success && res.data) {
        if (pageNum === 1) {
          setUsers(res.data.users);
        } else {
          setUsers(prev => [...prev, ...res.data!.users]);
        }
        setTotal(res.data.total);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  const fetchLevels = useCallback(async () => {
    try {
      const res = await adminService.getMemberLevels();
      if (res.success && res.data) {
        setLevels(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch levels:', error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchLevels();
  }, [fetchUsers, fetchLevels]);

  const handleSearch = () => {
    setPage(1);
    setLoading(true);
    fetchUsers(1, keyword);
  };

  const handleLoadMore = () => {
    if (!loading && users.length < total) {
      setLoading(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchUsers(nextPage, keyword);
    }
  };

  const handleEditLevel = (user: UserInfo) => {
    setSelectedUser(user);
    setSelectedLevel(user.member_level);
    setEditModalVisible(true);
  };

  const handleSaveLevel = async () => {
    if (!selectedUser) return;

    try {
      const res = await adminService.adjustLevel(selectedUser.id, selectedLevel);
      if (res.success) {
        Alert.alert('成功', '会员等级已更新');
        setEditModalVisible(false);
        fetchUsers(1, keyword);
      } else {
        Alert.alert('错误', res.message || '更新失败');
      }
    } catch (error) {
      Alert.alert('错误', '请求失败');
    }
  };

  const renderUser = ({ item }: { item: UserInfo }) => (
    <View className="bg-stone-800 rounded-xl p-4 mb-3 border border-stone-700">
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-stone-200 font-medium">{item.nickname || '未设置昵称'}</Text>
          <Text className="text-stone-500 text-sm mt-1">手机号: {item.phone}</Text>
          <View className="flex-row mt-2 items-center">
            <View className={`px-2 py-0.5 rounded ${item.member_level > 0 ? 'bg-amber-500/20' : 'bg-stone-700'}`}>
              <Text className={`text-xs ${item.member_level > 0 ? 'text-amber-500' : 'text-stone-400'}`}>
                {item.member_level_name || '江湖散人'}
              </Text>
            </View>
            <Text className="text-stone-500 text-xs ml-3">帖子: {item.post_count || 0}</Text>
          </View>
          <Text className="text-stone-600 text-xs mt-2">
            注册时间: {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity
          className="bg-amber-600 px-3 py-1.5 rounded-lg"
          onPress={() => handleEditLevel(item)}
        >
          <Text className="text-stone-900 text-sm font-medium">调整等级</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Screen>
      <View className="flex-1 bg-stone-900">
        {/* Header */}
        <View className="bg-stone-800 px-4 py-3 border-b border-stone-700">
          <View className="flex-row items-center justify-between mb-3">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-amber-500">← 返回</Text>
            </TouchableOpacity>
            <Text className="text-stone-200 font-medium">用户管理</Text>
            <View className="w-12" />
          </View>

          {/* Search */}
          <View className="flex-row">
            <TextInput
              className="flex-1 bg-stone-700 text-stone-200 px-3 py-2 rounded-lg mr-2"
              placeholder="搜索用户..."
              placeholderTextColor="#78716c"
              value={keyword}
              onChangeText={setKeyword}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity
              className="bg-amber-600 px-4 py-2 rounded-lg"
              onPress={handleSearch}
            >
              <Text className="text-stone-900 font-medium">搜索</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View className="px-4 py-2 bg-stone-800/50">
          <Text className="text-stone-500 text-sm">
            共 {total} 位用户
          </Text>
        </View>

        {/* User List */}
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderUser}
          contentContainerClassName="p-4"
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loading && users.length > 0 ? (
              <ActivityIndicator className="py-4" color="#d97706" />
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View className="items-center py-10">
                <Text className="text-stone-500">暂无用户</Text>
              </View>
            ) : null
          }
        />

        {/* Edit Level Modal */}
        <Modal
          visible={editModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View className="flex-1 bg-black/60 justify-center items-center px-4">
            <View className="bg-stone-800 rounded-xl p-6 w-full max-w-sm">
              <Text className="text-xl font-bold text-stone-200 mb-4">调整会员等级</Text>

              {selectedUser && (
                <View className="mb-4">
                  <Text className="text-stone-400 text-sm">用户: {selectedUser.nickname}</Text>
                  <Text className="text-stone-500 text-xs">手机: {selectedUser.phone}</Text>
                </View>
              )}

              <Text className="text-stone-300 mb-2">选择等级</Text>
              <View className="flex-row flex-wrap -mx-1 mb-4">
                {levels.map((level) => (
                  <TouchableOpacity
                    key={level.id}
                    className={`px-3 py-2 rounded-lg m-1 ${
                      selectedLevel === level.level ? 'bg-amber-600' : 'bg-stone-700'
                    }`}
                    onPress={() => setSelectedLevel(level.level)}
                  >
                    <Text className={`${selectedLevel === level.level ? 'text-stone-900' : 'text-stone-300'}`}>
                      {level.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View className="flex-row justify-end">
                <TouchableOpacity
                  className="px-4 py-2 mr-2"
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text className="text-stone-400">取消</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-amber-600 px-4 py-2 rounded-lg"
                  onPress={handleSaveLevel}
                >
                  <Text className="text-stone-900 font-medium">保存</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Screen>
  );
}
