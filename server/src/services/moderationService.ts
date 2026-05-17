import { getPool } from '../config/database.js';

const pool = getPool();

/**
 * 内容审核服务
 */

// 敏感词检测
export async function checkSensitiveWords(text: string): Promise<{ passed: boolean; words: string[] }> {
  try {
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
  } catch (error) {
    console.error('敏感词检测失败:', error);
    return { passed: true, words: [] }; // 出错时放行
  }
}

// 内容综合审核
export async function moderateContent(
  type: 'post' | 'comment',
  userId: number,
  textContent: string,
  imageUrls: string[] = []
): Promise<{ passed: boolean; reason?: string }> {
  try {
    // 1. 敏感词检测
    const sensitiveResult = await checkSensitiveWords(textContent);
    if (!sensitiveResult.passed) {
      return {
        passed: false,
        reason: `包含敏感词: ${sensitiveResult.words.join(', ')}`
      };
    }
    
    // 2. 记录审核日志
    await pool.query(
      `INSERT INTO content_reviews (content_type, content_id, user_id, text_content, image_urls, status, review_result)
       VALUES ($1, 0, $2, $3, $4, 1, '系统自动审核通过')`,
      [type, userId, textContent, JSON.stringify(imageUrls)]
    );
    
    return { passed: true };
  } catch (error) {
    console.error('内容审核失败:', error);
    return { passed: true }; // 出错时放行
  }
}

// 处理用户违规
export async function handleUserViolation(
  userId: number,
  postId: number | null,
  violationType: string,
  content: string,
  penalty: number,
  expireAt: Date | null
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO user_violations (user_id, post_id, violation_type, content, penalty, expire_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, postId, violationType, content, penalty, expireAt]
    );
    
    // 如果是封号，直接禁用用户
    if (penalty >= 3) {
      await pool.query('UPDATE users SET status = 0 WHERE id = $1', [userId]);
    }
  } catch (error) {
    console.error('处理用户违规失败:', error);
  }
}

// 检查用户是否被禁言
export async function isUserMuted(userId: number): Promise<boolean> {
  try {
    const result = await pool.query(
      `SELECT expire_at FROM user_violations 
       WHERE user_id = $1 AND penalty = 2 AND status = 0 
       AND (expire_at IS NULL OR expire_at > NOW())`,
      [userId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('检查用户禁言状态失败:', error);
    return false;
  }
}
