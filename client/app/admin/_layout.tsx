import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeRouter, usePathname } from '@/hooks/useSafeRouter';

const menuItems = [
  { name: '仪表盘', path: '/admin/dashboard', icon: 'grid' },
  { name: '用户', path: '/admin/users', icon: 'people' },
  { name: '内容', path: '/admin/content', icon: 'document-text' },
  { name: '审核', path: '/admin/moderation', icon: 'shield-checkmark' },
  { name: '举报', path: '/admin/reports', icon: 'flag' },
  { name: '反馈', path: '/admin/feedbacks', icon: 'chatbox-ellipses' },
  { name: '会员', path: '/admin/members', icon: 'diamond' },
  { name: '支付', path: '/admin/payment', icon: 'wallet' },
];

export default function AdminLayout() {
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const pathname = usePathname();

  return (
    <View className="flex-1 bg-stone-900">
      <StatusBar style="light" />
      
      {/* 顶部标题栏 */}
      <View 
        className="bg-stone-800 border-b border-stone-700"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="px-4 pb-3 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-lg bg-amber-600 items-center justify-center mr-3">
              <Ionicons name="shield" size={18} color="white" />
            </View>
            <View>
              <Text className="text-amber-500 font-bold text-lg">流痕江湖</Text>
              <Text className="text-stone-500 text-xs">管理后台</Text>
            </View>
          </View>
          <TouchableOpacity 
            className="w-10 h-10 rounded-full bg-stone-700 items-center justify-center"
            onPress={() => router.push('/')}
          >
            <Ionicons name="exit-outline" size={20} color="#a8a29e" />
          </TouchableOpacity>
        </View>

        {/* 顶部 Tab 导航 */}
        <View className="flex-row px-2 pb-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path || pathname === item.path + '/';
            return (
              <TouchableOpacity
                key={item.path}
                className={`flex-1 py-2 items-center rounded-lg mx-1 ${
                  isActive ? 'bg-amber-600' : ''
                }`}
                onPress={() => router.push(item.path)}
              >
                <Ionicons 
                  name={(isActive ? item.icon : `${item.icon}-outline`) as any} 
                  size={18} 
                  color={isActive ? 'white' : '#78716c'} 
                />
                <Text 
                  className={`text-xs mt-1 ${isActive ? 'text-white' : 'text-stone-500'}`}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 内容区域 */}
      <Stack 
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1c1917' },
        }}
      />
    </View>
  );
}
