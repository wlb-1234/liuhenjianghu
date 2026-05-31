import { getPool } from '../config/database.js';

/**
 * 内容审核服务
 */

// 敏感词检测
export async function checkSensitiveWords(text: string): Promise<{ passed: boolean; words: string[] }> {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT word, level FROM sensitive_words');
    const sensitiveWords = result.rows;
    const foundWords: string[] = [];
    
    const lowerText = text.toLowerCase();
    
    for (const sw of sensitiveWords) {
      if (lowerText.includes(sw.word.toLowerCase())) {
        foundWords.push(sw.word);
      }
    }
    
    return {
      passed: foundWords.length === 0,
      words: foundWords
    };
  } catch (err) {
    console.error('敏感词检测错误:', err);
    return { passed: true, words: [] };
  }
}

// 检测广告链接
export function checkAdLinks(text: string): boolean {
  const adPatterns = [
    /http[s]?:\/\/[^\s]*\.(com\.cn|xyz|top|click|link|work|icu|cc|pro)/i,
    /[a-zA-Z0-9]{10,}\.(com|net|org|xyz|top|click|link)/i,
    /加微信|加QQ|联系我|联系电话|联系微信/i
  ];
  
  return adPatterns.some(pattern => pattern.test(text));
}

// 综合内容审核
export async function moderateContent(
  content: string,
  imageUrls?: string[]
): Promise<{ passed: boolean; violations: string[]; level: number }> {
  const results = {
    passed: true,
    violations: [] as string[],
    level: 0
  };
  
  // 文本审核
  if (content) {
    const sensitiveResult = await checkSensitiveWords(content);
    if (!sensitiveResult.passed) {
      results.passed = false;
      results.violations.push(`包含敏感词: ${sensitiveResult.words.join(', ')}`);
      results.level = 2;
    }
    
    if (checkAdLinks(content)) {
      results.passed = false;
      results.violations.push('可能包含广告链接');
      results.level = Math.max(results.level, 1);
    }
  }
  
  // 图片审核（简单检测URL格式）
  if (imageUrls && imageUrls.length > 0) {
    for (const url of imageUrls) {
      if (!url.startsWith('http')) {
        results.passed = false;
        results.violations.push('图片URL格式无效');
        results.level = Math.max(results.level, 1);
      }
    }
  }
  
  return results;
}
