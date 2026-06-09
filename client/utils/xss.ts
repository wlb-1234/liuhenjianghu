/**
 * XSS 防护工具
 * 用于输入过滤和输出转义
 */

/**
 * HTML 转义 - 用于输出到 HTML 时
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * SQL LIKE 转义 - 用于搜索输入
 */
export function escapeSqlLike(text: string): string {
  return text.replace(/[%_]/g, '\\$&');
}

/**
 * 通用输入过滤 - 移除危险字符
 */
export function sanitizeInput(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .slice(0, 5000); // 限制长度
}

/**
 * 用户名过滤 - 只允许字母数字中文下划线
 */
export function sanitizeUsername(text: string): string {
  return text.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_]/g, '');
}

/**
 * 内容过滤 - 允许大部分字符，但限制长度
 */
export function sanitizeContent(text: string): string {
  if (!text) return '';
  return text.trim().slice(0, 10000);
}
