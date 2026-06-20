import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import Toast from 'react-native-toast-message';
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

export default function RootLayout() {
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
          <Stack.Screen name="login" options={{ title: "" }} />
          <Stack.Screen name="register" options={{ title: "" }} />
          <Stack.Screen name="(tabs)" options={{ title: "" }} />
          <Stack.Screen name="post" options={{ title: "" }} />
          <Stack.Screen name="chat" options={{ title: "" }} />
          <Stack.Screen name="post-detail" options={{ title: "" }} />
          <Stack.Screen name="profile-edit" options={{ title: "" }} />
          <Stack.Screen name="setting" options={{ title: "" }} />
          <Stack.Screen name="+not-found" options={{ title: "" }} />
        </Stack>
        <Toast />
      </Provider>
    </ErrorBoundary>
  );
}
