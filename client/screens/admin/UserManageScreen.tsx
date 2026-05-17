import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput, FlatList } from 'react-native';
import { Screen } from '@/components/Screen';
import adminService from '@/services/adminService';

interface User {
  id: number;
  phone: string;
  nickname: string;
  member_level: number;
  member_expire_at: string | null;
  created_at: string;
}

const MEMBER_LEVELS = [
  { level: 0, name: '江湖散人', price: 0 },
  { level: 1, name: '县帮帮主', price: 9 },
  { level: 2, name: '市盟盟主', price: 19 },
  { level: 3, name: '省派掌门', price: 39 },
  { level: 4, name: '天下会主', price: 69 },
];

export default function UserManageScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({ keyword: searchKeyword, limit: 50 });
      if (res.code === 200 && res.data) {
        setUsers(res.data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [searchKeyword]);

  const handleUpdateLevel = async (userId: number, newLevel: number) => {
    Alert.alert(
      '确认调整',
      `确定要将该用户调整为 L${newLevel} (${MEMBER_LEVELS[newLevel].name}) 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            try {
              const res = await adminService.adjustLevel(userId, newLevel);
              if (res.code === 200) {
                Alert.alert('成功', '会员等级已更新');
                setSelectedUser(null);
                fetchUsers();
              } else {
                Alert.alert('失败', res.message || '操作失败');
              }
            } catch (error) {
              Alert.alert('失败', '网络错误');
            }
          },
        },
      ]
    );
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      className="bg-stone-800 rounded-xl p-4 mb-3 border border-stone-700"
      onPress={() => setSelectedUser(item)}
    >
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <Text className="text-white font-bold">{item.nickname || '未设置昵称'}</Text>
          <Text className="text-stone-400 text-sm mt-1">{item.phone}</Text>
        </View>
        <View className="items-end">
          <View className={`px-3 py-1 rounded-full ${item.member_level > 0 ? 'bg-amber-600/20 border border-amber-600' : 'bg-stone-700'}`}>
            <Text className={item.member_level > 0 ? 'text-amber-400 text-sm font-bold' : 'text-stone-400 text-sm'}>
              L{item.member_level} {MEMBER_LEVELS[item.member_level]?.name || ''}
            </Text>
          </View>
          {item.member_expire_at && (
            <Text className="text-stone-500 text-xs mt-1">
              到期: {new Date(item.member_expire_at).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderLevelSelector = () => (
    <View className="fixed bottom-0 left-0 right-0 bg-stone-800 rounded-t-2xl p-4 border-t border-stone-700">
      <Text className="text-white font-bold text-lg mb-4 text-center">选择会员等级</Text>
      {MEMBER_LEVELS.map((level) => (
        <TouchableOpacity
          key={level.level}
          className={`p-4 mb-2 rounded-xl ${selectedUser?.member_level === level.level ? 'bg-amber-600' : 'bg-stone-700'}`}
          onPress={() => handleUpdateLevel(selectedUser!.id, level.level)}
        >
          <View className="flex-row justify-between items-center">
            <View>
              <Text className={`font-bold ${selectedUser?.member_level === level.level ? 'text-white' : 'text-white'}`}>
                L{level.level} {level.name}
              </Text>
              {level.price > 0 && (
                <Text className="text-stone-400 text-sm mt-1">{level.price}元/月</Text>
              )}
            </View>
            {selectedUser?.member_level === level.level && (
              <Text className="text-white font-bold">当前</Text>
            )}
          </View>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        className="mt-4 py-3 rounded-xl bg-stone-700"
        onPress={() => setSelectedUser(null)}
      >
        <Text className="text-white text-center">取消</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Screen>
      <View className="flex-1 bg-stone-900">
        {/* 搜索框 */}
        <View className="p-4">
          <View className="flex-row">
            <TextInput
              className="flex-1 bg-stone-800 text-white rounded-xl px-4 py-3 border border-stone-700"
              placeholder="搜索用户手机号或昵称"
              placeholderTextColor="#6b7280"
              value={searchKeyword}
              onChangeText={setSearchKeyword}
            />
            <TouchableOpacity
              className="ml-3 bg-amber-600 px-5 rounded-xl justify-center"
              onPress={fetchUsers}
            >
              <Text className="text-white font-bold">搜索</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 用户列表 */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#d97706" />
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={
              <View className="items-center py-10">
                <Text className="text-stone-500">暂无用户，点击搜索获取</Text>
              </View>
            }
          />
        )}

        {/* 等级选择器 */}
        {selectedUser && renderLevelSelector()}
      </View>
    </Screen>
  );
}
