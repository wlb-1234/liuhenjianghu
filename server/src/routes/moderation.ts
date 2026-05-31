import { Router } from 'express';
import { Pool } from 'pg';
import { loadEnv, getDbUrl } from 'coze-coding-dev-sdk';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// 延迟初始化
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    loadEnv();
    const dbUrl = getDbUrl();
    pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

// 敏感词检测
async function checkSensitiveWords(text: string): Promise<{ passed: boolean; words: string[] }> {
  try {
    const p = getPool();
    const result = await p.query('SELECT word, level FROM sensitive_words');
    const sensitiveWords = result.rows;
    const foundWords: string[] = [];
    
    const lowerText = text.toLowerCase();
    for (const sw of sensitiveWords) {
      if (lowerText.includes(sw.word.toLowerCase())) {
        foundWords.push(sw.word);
      }
    }
    
    return { passed: foundWords.length === 0, words: foundWords };
  } catch (err) {
    console.error('敏感词检测错误:', err);
    return { passed: true, words: [] };
  }
}

// 检测广告链接
function checkAdLinks(text: string): boolean {
  const adPatterns = [
    /http[s]?:\/\/[^\s]*\.(com\.cn|xyz|top|click|link|work|icu|cc|pro)/i,
    /[a-zA-Z0-9]{10,}\.(com|net|org|xyz|top|click|link)/i,
    /加微信|加QQ|联系我|联系电话|联系微信/i
  ];
  
  return adPatterns.some(pattern => pattern.test(text));
}

// 内容审核
router.post('/check', async (req, res) => {
  try {
    const { type, content, imageUrls } = req.body;
    
    if (!content && (!imageUrls || imageUrls.length === 0)) {
      return res.json({ success: true, data: { passed: true } });
    }
    
    const results = {
      passed: true,
      violations: [] as string[],
      level: 0
    };
    
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
    
    if (imageUrls && imageUrls.length > 0) {
      for (const url of imageUrls) {
        if (!url.startsWith('http')) {
          results.passed = false;
          results.violations.push('图片URL格式无效');
          results.level = Math.max(results.level, 1);
        }
      }
    }
    
    res.json({ success: true, data: results });
  } catch (err) {
    console.error('内容审核错误:', err);
    res.status(500).json({ success: false, error: '审核服务错误' });
  }
});

export default router;
