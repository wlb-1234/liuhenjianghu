import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { isAuthenticated } = useAuth();

  // 如果已登录，跳转到首页（tabs）
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  // 未登录，跳转到登录页
  return <Redirect href="/login" />;
}
