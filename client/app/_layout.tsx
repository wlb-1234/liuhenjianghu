import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
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

// 保持启动屏直到准备好
// SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(true);

  console.log('>>> 1. RootLayout 开始渲染，isReady:', isReady);

  useEffect(() => {
    console.log('>>> 2. useEffect 执行，开始初始化');
    // 初始化完成后隐藏启动屏
    const prepare = async () => {
      try {
        // 可以在这里做初始化操作，如加载字体、获取用户信息等
        console.log('>>> 3. prepare 函数开始执行');
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('>>> 4. prepare 函数执行完成');
      } catch (error) {
        console.error('>>> prepare 函数出错:', error);
      } finally {
        setIsReady(true);
        console.log('>>> 5. isReady 设置为 true');
        // await SplashScreen.hideAsync();
      }
    };

    prepare();
  }, []);

  if (!isReady) {
    console.log('>>> 6. isReady 为 false，返回 null');
    return null;
  }

  console.log('>>> 7. isReady 为 true，开始渲染 Provider');

  // 测试：只渲染 Stack，不渲染 Provider
  return (
    <ErrorBoundary>
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
        <Stack.Screen name="profile-edit" options={{ title: "" }} />
        <Stack.Screen name="setting" options={{ title: "" }} />
        <Stack.Screen name="vip" options={{ title: "" }} />
        <Stack.Screen name="orders" options={{ title: "" }} />
        <Stack.Screen name="balance" options={{ title: "" }} />
        <Stack.Screen name="favorites" options={{ title: "" }} />
        <Stack.Screen name="notifications" options={{ title: "" }} />
        <Stack.Screen name="feedback" options={{ title: "" }} />
        <Stack.Screen name="about" options={{ title: "" }} />
        <Stack.Screen name="admin" options={{ title: "" }} />
        <Stack.Screen name="+not-found" options={{ title: "" }} />
      </Stack>
      <Toast />
    </ErrorBoundary>
  );

  /*
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
          <Stack.Screen name="profile-edit" options={{ title: "" }} />
          <Stack.Screen name="setting" options={{ title: "" }} />
          <Stack.Screen name="vip" options={{ title: "" }} />
          <Stack.Screen name="orders" options={{ title: "" }} />
          <Stack.Screen name="balance" options={{ title: "" }} />
          <Stack.Screen name="favorites" options={{ title: "" }} />
          <Stack.Screen name="notifications" options={{ title: "" }} />
          <Stack.Screen name="feedback" options={{ title: "" }} />
          <Stack.Screen name="about" options={{ title: "" }} />
          <Stack.Screen name="admin" options={{ title: "" }} />
          <Stack.Screen name="+not-found" options={{ title: "" }} />
        </Stack>
        <Toast />
      </Provider>
    </ErrorBoundary>
  );
  */
}
