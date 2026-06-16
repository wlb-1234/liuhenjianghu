// 主题配置 - 暗黑模式
export interface ThemeColors {
  primary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

// 亮色主题
export const lightTheme: ThemeColors = {
  primary: '#2563eb',       // 蓝色
  background: '#ffffff',    // 白色
  surface: '#f5f5f5',       // 浅灰
  text: '#1f2937',          // 深灰
  textSecondary: '#6b7280', // 中灰
  border: '#e5e7eb',        // 边框灰
  success: '#10b981',       // 绿色
  warning: '#f59e0b',       // 橙色
  error: '#ef4444',         // 红色
};

// 暗色主题
export const darkTheme: ThemeColors = {
  primary: '#60a5fa',       // 亮蓝色
  background: '#111827',   // 深黑
  surface: '#1f2937',       // 深灰
  text: '#f9fafb',          // 白色
  textSecondary: '#9ca3af', // 浅灰
  border: '#374151',        // 边框灰
  success: '#34d399',       // 亮绿
  warning: '#fbbf24',       // 亮橙
  error: '#f87171',         // 亮红
};

// 跟随系统
export const systemTheme = {
  light: lightTheme,
  dark: darkTheme,
};

// 主题类型
export type ThemeMode = 'light' | 'dark' | 'system';

// 主题配置
export interface ThemeConfig {
  mode: ThemeMode;
  colors: ThemeColors;
}

// 获取主题配置
export function getTheme(mode: ThemeMode, systemIsDark: boolean = false): ThemeColors {
  switch (mode) {
    case 'light':
      return lightTheme;
    case 'dark':
      return darkTheme;
    case 'system':
      return systemIsDark ? darkTheme : lightTheme;
    default:
      return lightTheme;
  }
}

// 检测系统主题偏好
export function detectSystemTheme(secChUa: string | undefined, secChUaMobile: string | undefined): boolean {
  // 简化检测：检查user-agent中是否包含dark模式标识
  if (!secChUa) return false;
  
  // 检查是否 prefers-color-schema: dark
  // 实际应该从CSS媒体查询获取，这里做简化处理
  const ua = secChUa.toLowerCase();
  return ua.includes('mac os') || ua.includes('windows');
}

// CSS变量模板
export function generateCSSVariables(colors: ThemeColors): string {
  return `
    :root {
      --color-primary: ${colors.primary};
      --color-background: ${colors.background};
      --color-surface: ${colors.surface};
      --color-text: ${colors.text};
      --color-text-secondary: ${colors.textSecondary};
      --color-border: ${colors.border};
      --color-success: ${colors.success};
      --color-warning: ${colors.warning};
      --color-error: ${colors.error};
    }
  `;
}

export default {
  lightTheme,
  darkTheme,
  systemTheme,
  getTheme,
  detectSystemTheme,
  generateCSSVariables,
};
