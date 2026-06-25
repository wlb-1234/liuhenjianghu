import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import { Provider } from '@/components/Provider';
import { ErrorBoundary } from '@/components/ErrorBoundary';

import '../global.css';

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found",
  "shadow* style props are deprecated",
  "textShadow* style props are deprecated",
  "All themes must have the same variables",
  "Theme .* is missing variable",
]);

// 保持启动屏直到准备好
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 初始化完成后隐藏启动屏
    const prepare = async () => {
      try {
        // 可以在这里做初始化操作，如加载字体、获取用户信息等
        await new Promise(resolve => setTimeout(resolve, 100));
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    };

    prepare();
  }, []);

  if (!isReady) {
    return null;
  }

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
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ title: "" }} />
          <Stack.Screen name="register" options={{ title: "" }} />
          <Stack.Screen name="(tabs)" options={{ title: "" }} />
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
}
