/**
 * 敏感词检测服务
 * 用于前端文本输入时的敏感词实时检测
 */

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'https://server-production-d2bda.up.railway.app';

export interface SensitiveCheckResult {
  hasSensitive: boolean;
  words: string[];
  filtered: string;
}

// 敏感词检测结果缓存（避免频繁请求）
let cachedWords: string[] | null = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

/**
 * 检测文本是否包含敏感词
 */
export async function checkSensitiveWords(text: string): Promise<SensitiveCheckResult> {
  if (!text || text.trim().length === 0) {
    return { hasSensitive: false, words: [], filtered: text };
  }

  try {
    const response = await fetch(`${API_BASE}/api/v1/sensitive-words/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    const result = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    }
    
    return { hasSensitive: false, words: [], filtered: text };
  } catch (error) {
    console.error('敏感词检测失败:', error);
    // 检测失败时保守处理，不阻止用户提交
    return { hasSensitive: false, words: [], filtered: text };
  }
}

/**
 * 实时检测（带防抖）
 */
let debounceTimer: NodeJS.Timeout | null = null;

export function checkSensitiveWordsDebounced(
  text: string,
  onResult: (result: SensitiveCheckResult) => void,
  delay: number = 300
): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(async () => {
    const result = await checkSensitiveWords(text);
    onResult(result);
  }, delay);
}

/**
 * 本地快速检测（使用预加载的敏感词列表）
 * 需要先调用 loadSensitiveWords() 预加载
 */
export function checkSensitiveWordsLocal(text: string): SensitiveCheckResult {
  if (!text || text.trim().length === 0 || !cachedWords || cachedWords.length === 0) {
    return { hasSensitive: false, words: [], filtered: text };
  }

  const lowerText = text.toLowerCase();
  const found: string[] = [];

  for (const word of cachedWords) {
    if (lowerText.includes(word.toLowerCase())) {
      found.push(word);
    }
  }

  let filtered = text;
  found.forEach(word => {
    filtered = filtered.replace(new RegExp(word, 'gi'), '*'.repeat(word.length));
  });

  return {
    hasSensitive: found.length > 0,
    words: found,
    filtered
  };
}

/**
 * 预加载敏感词列表（可在 App 启动时调用）
 */
export async function loadSensitiveWords(): Promise<void> {
  const now = Date.now();
  
  if (cachedWords && now - cacheTime < CACHE_DURATION) {
    return; // 缓存未过期
  }

  try {
    const response = await fetch(`${API_BASE}/api/v1/sensitive-words`);
    
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        cachedWords = result.data.map((item: any) => item.word);
        cacheTime = now;
      }
    }
  } catch (error) {
    console.error('加载敏感词列表失败:', error);
    // 使用内置的基础敏感词
    cachedWords = [
      '毒品', '赌博', '诈骗', '黑客', '枪支',
      '暴力', '恐怖', '血腥', '色情', '低俗'
    ];
    cacheTime = now;
  }
}

/**
 * 获取敏感词分类的友好提示
 */
export function getSensitiveWarningMessage(words: string[]): string {
  if (words.length === 0) return '';
  
  const categories = new Map<string, number>();
  const categoryNames: Record<string, string> = {
    '违法犯罪': '违法相关内容',
    '敏感内容': '敏感内容',
    '不良内容': '不良内容',
    '虚假信息': '虚假信息',
    '侵权内容': '侵权内容',
    '自定义': '违规内容'
  };

  // 简单分类（实际应从后端获取分类信息）
  words.forEach(word => {
    const cat = '不良内容'; // 默认分类
    categories.set(cat, (categories.get(cat) || 0) + 1);
  });

  const messages = Array.from(categories.entries()).map(([cat, count]) => 
    `包含${count}个"${categoryNames[cat] || cat}"`
  );

  return `检测到敏感词：${words.join('、')}。${messages.join('，')}，请修改后提交。`;
}
