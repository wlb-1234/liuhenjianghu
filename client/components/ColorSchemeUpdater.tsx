import { Fragment, useEffect, useState } from 'react';
import { ColorSchemeName, Platform } from 'react-native';
import { Uniwind } from 'uniwind'

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:8080';

// system: 跟随系统变化
// light: 固定为 light 主题
// dark: 固定为 dark 主题
const DEFAULT_THEME: 'system' | 'light' | 'dark' = 'system'

const WebOnlyColorSchemeUpdater = function () {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    loadThemeFromServer();
  }, []);

  // 从服务器加载主题设置
  const loadThemeFromServer = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/theme`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const themeMode = data.data.mode || 'system';
          Uniwind.setTheme(themeMode);
        } else {
          Uniwind.setTheme(DEFAULT_THEME);
        }
      } else {
        Uniwind.setTheme(DEFAULT_THEME);
      }
    } catch (error) {
      console.log('加载主题失败，使用默认主题');
      Uniwind.setTheme(DEFAULT_THEME);
    }
    setInitialized(true);
  };

  useEffect(() => {
    function handleMessage(e: MessageEvent<{ event: string; colorScheme: ColorSchemeName; } | undefined>) {
      if (e.data?.event === 'coze.workbench.colorScheme') {
        const cs = e.data.colorScheme;
        if (typeof cs === 'string') {
          Uniwind.setTheme(cs);
        }
      }
    }

    if (Platform.OS === 'web') {
      window.addEventListener('message', handleMessage, false);
    }

    return () => {
      if (Platform.OS === 'web') {
        window.removeEventListener('message', handleMessage, false);
      }
    }
  }, []);

  // Web端跟随浏览器系统主题
  useEffect(() => {
    if (Platform.OS === 'web') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        // 只有在"跟随系统"模式下才响应系统变化
        loadThemeFromServer();
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  return null;
};

export {
  WebOnlyColorSchemeUpdater,
}
