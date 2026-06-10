import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import Toast from 'react-native-toast-message';
import { Provider } from '@/components/Provider';
import { useFonts } from 'expo-font';

import '../global.css';

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found",
]);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Calligraphy': require('../assets/fonts/calligraphy.ttf'),
    'NotoSerif': require('../assets/fonts/NotoSerifKR.otf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
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
        <Stack.Screen name="upgrade" options={{ title: "" }} />
        <Stack.Screen name="settings" options={{ title: "" }} />
        <Stack.Screen name="admin" options={{ title: "" }} />
        <Stack.Screen name="admin/dashboard" options={{ title: "" }} />
        <Stack.Screen name="admin/users" options={{ title: "" }} />
        <Stack.Screen name="admin/moderation" options={{ title: "" }} />
        <Stack.Screen name="admin/members" options={{ title: "" }} />
        <Stack.Screen name="admin/logs" options={{ title: "" }} />
      </Stack>
      <Toast />
    </Provider>
  );
}
