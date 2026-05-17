import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import Toast from 'react-native-toast-message';
import { Provider } from '@/components/Provider';

import '../global.css';

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found",
]);

export default function RootLayout() {
  return (
    <Provider>
      <StatusBar style="dark" />
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
        <Stack.Screen name="upgrade" options={{ title: "" }} />
      </Stack>
      <Toast />
    </Provider>
  );
}
