import { useEffect } from 'react';
import { useSegments, useRootNavigationState } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeRouter } from '@/hooks/useSafeRouter';

/**
 * 认证守卫组件
 * 未登录时自动跳转到登录页面
 */
export function AuthGuard() {
  const router = useSafeRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const rootState = useRootNavigationState();

  useEffect(() => {
    // 1. 待机检测：导航未挂载 或 鉴权正在加载中，直接返回
    if (!rootState?.key || isLoading) return;

    // 2. 路径检测：确认当前不在登录页 (防止死循环)
    const inLoginRoute = segments.includes('login') || segments.includes('register');

    // 3. 未登录保护：未登录且不在登录页 → 跳转登录页
    if (!isAuthenticated && !inLoginRoute) {
      router.replace('/login');
    }
  }, [rootState?.key, isAuthenticated, isLoading, segments]);

  return null;
}
