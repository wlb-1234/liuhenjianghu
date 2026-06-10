import crypto from 'crypto';

/**
 * 内容相似度检测服务
 * 使用 SimHash 算法检测文本相似度
 */

// 中文字符处理
function tokenize(text: string): string[] {
  // 移除特殊字符，保留中文、英文、数字
  const cleanText = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ');
  
  // 分词（简单按空格和标点分词）
  const tokens = cleanText.split(/\s+/).filter(t => t.length >= 2);
  
  return tokens;
}

// 计算 SimHash
export function computeSimHash(text: string): string {
  const tokens = tokenize(text);
  console.log('[SimHash] 文本:', text, '分词结果:', tokens);
  
  // 如果没有有效分词，使用整体文本的hash
  if (tokens.length === 0) {
    const hash = crypto.createHash('md5').update(text).digest('hex');
    console.log('[SimHash] 无分词，使用整体hash:', hash);
    return hash;
  }
  
  const hashBits = 64;
  const v = new Array(hashBits).fill(0);
  
  for (const token of tokens) {
    // 计算 token 的 hash
    const hash = crypto.createHash('md5').update(token).digest('hex');
    const hashInt = BigInt('0x' + hash);
    
    // 累加每一位
    for (let i = 0; i < hashBits; i++) {
      const bit = (hashInt >> BigInt(i)) & 1n;
      v[i] += bit === 1n ? 1 : -1;
    }
  }
  
  // 生成 fingerprint
  let fingerprint = 0n;
  for (let i = 0; i < hashBits; i++) {
    if (v[i] > 0) {
      fingerprint |= 1n << BigInt(i);
    }
  }
  
  return fingerprint.toString(16);
}

// 计算两个 SimHash 的海明距离
function hammingDistance(hash1: string, hash2: string): number {
  const h1 = BigInt('0x' + hash1);
  const h2 = BigInt('0x' + hash2);
  let xor = h1 ^ h2;
  let distance = 0;
  
  while (xor > 0n) {
    distance += Number(xor & 1n);
    xor >>= 1n;
  }
  
  return distance;
}

// 计算相似度（0-1之间）
export function calculateSimilarity(hash1: string, hash2: string): number {
  const distance = hammingDistance(hash1, hash2);
  // 海明距离越小，相似度越高
  // 64位hash，最大距离64
  const similarity = 1 - (distance / 64);
  return Math.max(0, similarity);
}

// 检查内容是否相似（阈值：海明距离 <= 10 即相似度 >= 0.84）
export function isSimilarContent(hash1: string, hash2: string, maxDistance: number = 10): boolean {
  return hammingDistance(hash1, hash2) <= maxDistance;
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
  const newHash = computeSimHash(newContent);
  console.log('[内容限制] 新内容hash:', newHash);
  
  const today = new Date().toISOString().split('T')[0];
  
  // 筛选今天的内容
  const todayContents = existingContents.filter(c => {
    const contentDate = new Date(c.created_at).toISOString().split('T')[0];
    return contentDate === today;
  });
  
  console.log('[内容限制] 今日历史内容:', todayContents.length, '条');
  
  // 统计相似内容数量
  let similarCount = 0;
  for (const existing of todayContents) {
    const existingHash = computeSimHash(existing.content);
    const distance = hammingDistance(newHash, existingHash);
    const similar = distance <= 10;
    console.log(`[内容限制] 对比"${existing.content}"，海明距离:${distance}，相似:${similar}`);
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
  
  return { canPost: true, similarCount };
}

export default {
  computeSimHash,
  calculateSimilarity,
  isSimilarContent,
  checkContentLimit
};
