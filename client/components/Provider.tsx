import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/heroui/providers/toast';
import { type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function Provider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}

export {
  Provider,
}
