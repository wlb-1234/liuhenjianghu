import { useEffect } from 'react';
import { View, Text } from 'react-native';

export default function Index() {
  useEffect(() => {
    // 使用 localStorage 检测 token（Web 端）
    let token = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token') || sessionStorage.getItem('token');
    }
    console.log('>>> [根入口] 检测到 token:', token);
    if (!token) {
      console.log('>>> [根入口] 无 token，立即跳转到登录页');
      // 使用 window.location.href 直接跳转（Web 端）
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } else {
      console.log('>>> [根入口] 已登录，跳转到首页');
      if (typeof window !== 'undefined') {
        window.location.href = '/(tabs)';
      }
    }
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>加载中...</Text>
    </View>
  );
}
