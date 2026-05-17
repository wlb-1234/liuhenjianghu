import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import adminService from '@/services/adminService';

export default function AdminLoginScreen() {
  const router = useSafeRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('提示', '请输入用户名和密码');
      return;
    }

    setLoading(true);
    try {
      const res = await adminService.login(username, password);
      if (res.code === 200) {
        router.replace('/admin/dashboard');
      } else {
        Alert.alert('登录失败', res.message || '用户名或密码错误');
      }
    } catch (error) {
      Alert.alert('登录失败', '网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View className="flex-1 justify-center px-6 bg-stone-900">
        {/* Logo */}
        <View className="items-center mb-10">
          <Text className="text-4xl font-bold text-amber-500 mb-2">流痕江湖</Text>
          <Text className="text-lg text-stone-400">管理后台</Text>
        </View>

        {/* 表单 */}
        <View className="bg-stone-800 rounded-2xl p-6 border border-stone-700">
          <Text className="text-stone-300 mb-2">管理员账号</Text>
          <TextInput
            className="bg-stone-700 text-white rounded-xl px-4 py-3 mb-4 border border-stone-600"
            placeholder="请输入用户名"
            placeholderTextColor="#6b7280"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <Text className="text-stone-300 mb-2">登录密码</Text>
          <TextInput
            className="bg-stone-700 text-white rounded-xl px-4 py-3 mb-6 border border-stone-600"
            placeholder="请输入密码"
            placeholderTextColor="#6b7280"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            className="bg-amber-600 rounded-xl py-4 items-center"
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">登 录</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 底部提示 */}
        <Text className="text-center text-stone-500 mt-6 text-sm">
          仅限管理员访问
        </Text>
      </View>
    </Screen>
  );
}
