import { AuthProvider } from '@/contexts/AuthContext';
import { type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function Provider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {children}
      </GestureHandlerRootView>
    </AuthProvider>
  );
}

export {
  Provider,
}
