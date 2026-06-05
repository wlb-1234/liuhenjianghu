import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import adminService, { MemberLevel } from '@/services/adminService';

export default function MemberLevelScreen() {
  const router = useSafeRouter();
  const [levels, setLevels] = useState<MemberLevel[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<MemberLevel | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    price: '',
    region_limit: 0,
    daily_limit: 0,
    retention_days: 0,
    can_pin: false,
  });

  const fetchLevels = useCallback(async () => {
    try {
      const res = await adminService.getMemberLevels();
      if (res.success && res.data) {
        setLevels(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch levels:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  const handleEdit = (level: MemberLevel) => {
    setSelectedLevel(level);
    setEditForm({
      name: level.name,
      price: level.price,
      region_limit: level.region_limit,
      daily_limit: level.daily_limit,
      retention_days: level.retention_days,
      can_pin: level.can_pin,
    });
    setEditModalVisible(true);
  };

  const handleSave = async () => {
    if (!selectedLevel) return;

    try {
      const res = await adminService.updateMemberLevel(selectedLevel.id, {
        ...editForm,
        price: parseFloat(editForm.price) || 0,
        region_limit: parseInt(String(editForm.region_limit)) || 0,
        daily_limit: parseInt(String(editForm.daily_limit)) || 0,
        retention_days: parseInt(String(editForm.retention_days)) || 0,
      });
      if (res.success) {
        Alert.alert('成功', '等级配置已更新');
        setEditModalVisible(false);
        fetchLevels();
      } else {
        Alert.alert('错误', res.message || '更新失败');
      }
    } catch (error) {
      Alert.alert('错误', '请求失败');
    }
  };

  const renderLevel = ({ item }: { item: MemberLevel }) => (
    <View className="bg-stone-800 rounded-xl p-4 mb-3 border border-stone-700">
      <View className="flex-row justify-between items-start mb-3">
        <View>
          <View className="flex-row items-center">
            <Text className="text-xl font-bold text-amber-500">{item.name}</Text>
            {item.can_pin && (
              <View className="ml-2 bg-rose-500/20 px-2 py-0.5 rounded">
                <Text className="text-rose-500 text-xs">可置顶</Text>
              </View>
            )}
          </View>
          <Text className="text-stone-400 text-sm mt-1">
            ¥{parseFloat(item.price).toFixed(2)} / {item.retention_days}天
          </Text>
        </View>
        <View className="bg-stone-700 px-3 py-1 rounded-lg">
          <Text className="text-amber-500 font-bold">{item.user_count}</Text>
          <Text className="text-stone-500 text-xs">用户</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap -mx-2">
        <View className="px-2 mb-2">
          <Text className="text-stone-500 text-xs">区域限制</Text>
          <Text className="text-stone-300">
            {item.region_limit === 0 ? '无限制' : `${item.region_limit}个区域`}
          </Text>
        </View>
        <View className="px-2 mb-2">
          <Text className="text-stone-500 text-xs">每日发帖</Text>
          <Text className="text-stone-300">
            {item.daily_limit === 0 ? '无限制' : `${item.daily_limit}篇`}
          </Text>
        </View>
        <View className="px-2 mb-2">
          <Text className="text-stone-500 text-xs">保留天数</Text>
          <Text className="text-stone-300">{item.retention_days}天</Text>
        </View>
      </View>

      <TouchableOpacity
        className="mt-3 bg-stone-700 py-2 rounded-lg items-center"
        onPress={() => handleEdit(item)}
      >
        <Text className="text-stone-300">编辑配置</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center bg-stone-900">
          <ActivityIndicator size="large" color="#d97706" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="flex-1 bg-stone-900">
        {/* Header */}
        <View className="bg-stone-800 px-4 py-3 border-b border-stone-700">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-amber-500">← 返回</Text>
            </TouchableOpacity>
            <Text className="text-stone-200 font-medium">会员等级管理</Text>
            <View className="w-12" />
          </View>
        </View>

        <FlatList
          data={levels}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderLevel}
          contentContainerClassName="p-4"
          ListHeaderComponent={
            <View className="mb-4">
              <Text className="text-stone-400 text-sm">
                配置各等级会员的权限和价格，设置后将影响用户升级体验
              </Text>
            </View>
          }
        />

        {/* Edit Modal */}
        <Modal
          visible={editModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View className="flex-1 bg-black/60 justify-end">
            <View className="bg-stone-800 rounded-t-2xl p-6 max-h-4/5">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-stone-200">编辑等级配置</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <Text className="text-stone-400">✕</Text>
                </TouchableOpacity>
              </View>

              <View className="mb-4">
                <Text className="text-stone-400 text-sm mb-1">等级名称</Text>
                <TextInput
                  className="bg-stone-700 text-stone-200 px-3 py-2 rounded-lg"
                  value={editForm.name}
                  onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                />
              </View>

              <View className="mb-4">
                <Text className="text-stone-400 text-sm mb-1">价格 (元/月)</Text>
                <TextInput
                  className="bg-stone-700 text-stone-200 px-3 py-2 rounded-lg"
                  value={editForm.price}
                  onChangeText={(text) => setEditForm({ ...editForm, price: text })}
                  keyboardType="decimal-pad"
                />
              </View>

              <View className="flex-row -mx-2 mb-4">
                <View className="flex-1 px-2">
                  <Text className="text-stone-400 text-sm mb-1">区域限制</Text>
                  <TextInput
                    className="bg-stone-700 text-stone-200 px-3 py-2 rounded-lg"
                    value={String(editForm.region_limit)}
                    onChangeText={(text) => setEditForm({ ...editForm, region_limit: parseInt(text) || 0 })}
                    keyboardType="number-pad"
                  />
                </View>
                <View className="flex-1 px-2">
                  <Text className="text-stone-400 text-sm mb-1">每日发帖</Text>
                  <TextInput
                    className="bg-stone-700 text-stone-200 px-3 py-2 rounded-lg"
                    value={String(editForm.daily_limit)}
                    onChangeText={(text) => setEditForm({ ...editForm, daily_limit: parseInt(text) || 0 })}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-stone-400 text-sm mb-1">保留天数</Text>
                <TextInput
                  className="bg-stone-700 text-stone-200 px-3 py-2 rounded-lg"
                  value={String(editForm.retention_days)}
                  onChangeText={(text) => setEditForm({ ...editForm, retention_days: parseInt(text) || 0 })}
                  keyboardType="number-pad"
                />
              </View>

              <TouchableOpacity
                className="bg-amber-600 py-3 rounded-lg items-center mt-4"
                onPress={handleSave}
              >
                <Text className="text-stone-900 font-bold">保存配置</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Screen>
  );
}
