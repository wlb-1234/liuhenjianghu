import crypto from 'crypto';

/**
 * 内容相似度检测服务
 * 使用字符级 N-gram + Jaccard 相似度算法
 * 适用于中文短文本检测
 */

// 停用词列表（常见无意义词）
const STOP_WORDS = new Set([
  '的', '了', '是', '在', '和', '有', '我', '你', '他', '她', '它',
  '这', '那', '就', '也', '都', '要', '会', '可以', '不', '吗',
  '啊', '吧', '呢', '哦', '嗯', '好', '很', '太', '真', '个', '一下'
]);

/**
 * 生成字符级 N-gram
 * @param text 文本
 * @param n gram大小，默认3
 */
function getNGrams(text: string, n: number = 3): Set<string> {
  // 移除特殊字符，保留中文、英文、数字
  const cleanText = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').toLowerCase();
  
  const ngrams = new Set<string>();
  
  for (let i = 0; i <= cleanText.length - n; i++) {
    const gram = cleanText.slice(i, i + n);
    // 过滤掉全是停用词的gram
    let isAllStopWords = true;
    for (const char of gram) {
      if (!STOP_WORDS.has(char)) {
        isAllStopWords = false;
        break;
      }
    }
    if (!isAllStopWords) {
      ngrams.add(gram);
    }
  }
  
  return ngrams;
}

/**
 * 计算 Jaccard 相似度
 * @param set1 集合1
 * @param set2 集合2
 */
function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 && set2.size === 0) return 1;
  if (set1.size === 0 || set2.size === 0) return 0;
  
  let intersection = 0;
  for (const item of set1) {
    if (set2.has(item)) {
      intersection++;
    }
  }
  
  const union = set1.size + set2.size - intersection;
  return intersection / union;
}

/**
 * 计算两个文本的相似度（0-1）
 * 使用字符级 3-gram + Jaccard
 */
export function calculateSimilarity(text1: string, text2: string): number {
  const ngrams1 = getNGrams(text1, 3);
  const ngrams2 = getNGrams(text2, 3);
  return jaccardSimilarity(ngrams1, ngrams2);
}

/**
 * 检测两个文本是否相似
 * @param text1 文本1
 * @param text2 文本2
 * @param threshold 相似度阈值，默认0.4
 */
export function isSimilarContent(text1: string, text2: string, threshold: number = 0.4): boolean {
  const similarity = calculateSimilarity(text1, text2);
  console.log(`[相似度] "${text1}" vs "${text2}" = ${similarity.toFixed(2)}`);
  return similarity >= threshold;
}

/**
 * 检测新内容是否与历史内容相似
 * @param newContent 新内容
 * @param existingContents 历史内容列表
 * @param maxSimilar 允许的最大相似内容数
 * @returns { canPost: boolean, similarCount: number, reason?: string }
 */
export function checkContentLimit(
  newContent: string,
  existingContents: Array<{ content: string; created_at: Date }>,
  maxSimilar: number = 3
): { canPost: boolean; similarCount: number; reason?: string } {
  const today = new Date().toISOString().split('T')[0];
  
  // 筛选今天的内容
  const todayContents = existingContents.filter(c => {
    const contentDate = new Date(c.created_at).toISOString().split('T')[0];
    return contentDate === today;
  });
  
  console.log('[内容限制] 新内容:', newContent);
  console.log('[内容限制] 今日历史内容:', todayContents.length, '条');
  
  // 统计相似内容数量
  let similarCount = 0;
  for (const existing of todayContents) {
    const similarity = calculateSimilarity(newContent, existing.content);
    const similar = similarity >= 0.4; // 40%相似度
    console.log(`[内容限制] 对比"${existing.content}"，相似度:${similarity.toFixed(2)}，相似:${similar}`);
    if (similar) {
      similarCount++;
    }
  }
  
  console.log('[内容限制] 相似内容数:', similarCount, '/', maxSimilar);
  
  if (similarCount >= maxSimilar) {
    return {
      canPost: false,
      similarCount,
      reason: `今日该区域已发布 ${similarCount} 条相似内容，请稍后再试`
    };
  }
  
  return {
    canPost: true,
    similarCount
  };
}
