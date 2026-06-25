import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  // 加载中，显示加载指示器
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 如果已登录，跳转到首页（tabs）
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  // 未登录，跳转到登录页
  return <Redirect href="/login" />;
}
