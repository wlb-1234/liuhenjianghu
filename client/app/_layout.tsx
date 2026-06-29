// 强制重建 - 2026-06-29 20:40 - 优化跳转逻辑
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { Provider } from '@/components/Provider';
import { ErrorBoundary } from '@/components/ErrorBoundary';

import '../global.css';

// 全局未处理 Promise 错误捕获（仅 Web 端）
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    console.error('全局捕获未处理 Promise 错误：', event.reason);
  });
}

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found",
  "shadow* style props are deprecated",
  "textShadow* style props are deprecated",
  "All themes must have the same variables",
  "Theme .* is missing variable",
]);

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);

  console.log('>>> 1. RootLayout 开始渲染，isReady:', isReady);

  // 等待路由就绪
  useEffect(() => {
    if (segments.length > 0) {
      setIsReady(true);
      console.log('>>> 路由就绪，segments:', segments);
    }
  }, [segments]);

  // 登录状态检查
  useEffect(() => {
    if (!isReady) return; // 路由未就绪，不执行跳转

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const isLoginRoute = segments.includes('login');

      console.log('>>> [Layout] 当前路由:', segments);
      console.log('>>> [Layout] token:', token);
      console.log('>>> [Layout] isLoginRoute:', isLoginRoute);

      if (!token && !isLoginRoute) {
        console.log('>>> [Layout] 无 token，跳转到登录页');
        // 使用 setTimeout 确保在渲染周期后跳转
        setTimeout(() => {
          router.replace('/login');
        }, 50);
      }
    }
  }, [isReady, segments]);

  useEffect(() => {
    console.log('>>> 2. useEffect 执行，开始初始化');
    const prepare = async () => {
      try {
        console.log('>>> 3. prepare 函数开始执行');
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('>>> 4. prepare 函数执行完成');
      } catch (error) {
        console.error('>>> prepare 函数出错:', error);
      }
    };
    prepare();
  }, []);

  if (!isReady) {
    console.log('>>> 5. isReady 为 false，返回 null');
    return null;
  }

  console.log('>>> 6. isReady 为 true，开始渲染 Provider');

  return (
    <ErrorBoundary>
      <Provider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            animation: 'slide_from_right',
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            headerShown: false,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ title: "" }} />
          <Stack.Screen name="login" options={{ title: "" }} />
          <Stack.Screen name="register" options={{ title: "" }} />
          <Stack.Screen name="post" options={{ title: "" }} />
          <Stack.Screen name="chat" options={{ title: "" }} />
          <Stack.Screen name="post-detail" options={{ title: "" }} />
          <Stack.Screen name="settings" options={{ title: "" }} />
          <Stack.Screen name="vip" options={{ title: "" }} />
          <Stack.Screen name="orders" options={{ title: "" }} />
          <Stack.Screen name="balance" options={{ title: "" }} />
          <Stack.Screen name="favorites" options={{ title: "" }} />
          <Stack.Screen name="notifications" options={{ title: "" }} />
          <Stack.Screen name="feedback" options={{ title: "" }} />
          <Stack.Screen name="about" options={{ title: "" }} />
          <Stack.Screen name="account-deletion" options={{ title: "" }} />
          <Stack.Screen name="admin" options={{ title: "" }} />
          <Stack.Screen name="+not-found" options={{ title: "" }} />
        </Stack>
        <Toast />
      </Provider>
    </ErrorBoundary>
  );
}
