import { Router } from 'express';
import { getPool } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const pool = getPool();

const router = Router();

/**
 * 内容审核接口
 * POST /api/v1/moderation/check
 * Body: { type: 'post'|'comment', content: string, imageUrls?: string[] }
 */

// 敏感词检测
async function checkSensitiveWords(text: string): Promise<{ passed: boolean; words: string[] }> {
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
    
    // 文本审核
    if (content) {
      // 敏感词检测
      const sensitiveResult = await checkSensitiveWords(content);
      if (!sensitiveResult.passed) {
        results.passed = false;
        results.violations.push(`包含敏感词: ${sensitiveResult.words.join(', ')}`);
        results.level = 2;
      }
      
      // 广告链接检测
      if (checkAdLinks(content)) {
        results.passed = false;
        results.violations.push('可能包含广告链接');
        results.level = Math.max(results.level, 1);
      }
    }
    
    // 图片审核（简单检测URL是否存在）
    if (imageUrls && imageUrls.length > 0) {
      // 这里可以集成第三方图片审核API
      // 目前仅做URL有效性检查
      for (const url of imageUrls) {
        if (!url.startsWith('http')) {
          results.passed = false;
          results.violations.push('图片URL格式无效');
          results.level = Math.max(results.level, 1);
        }
      }
    }
    
    res.json({
      success: true,
      data: results
    });
  } catch (err) {
    console.error('内容审核错误:', err);
    res.status(500).json({ success: false, error: '审核服务错误' });
  }
});

/**
 * 获取敏感词列表（管理员）
 */
router.get('/sensitive-words', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM sensitive_words ORDER BY level DESC, created_at DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('获取敏感词错误:', err);
    res.status(500).json({ success: false, error: '获取失败' });
  }
});

/**
 * 添加敏感词（管理员）
 */
router.post('/sensitive-words', async (req, res) => {
  try {
    const { word, level = 1, category } = req.body;
    
    if (!word) {
      return res.status(400).json({ success: false, error: '敏感词不能为空' });
    }
    
    const result = await pool.query(
      'INSERT INTO sensitive_words (word, level, category) VALUES ($1, $2, $3) RETURNING *',
      [word, level, category]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('添加敏感词错误:', err);
    res.status(500).json({ success: false, error: '添加失败' });
  }
});

/**
 * 删除敏感词（管理员）
 */
router.delete('/sensitive-words/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM sensitive_words WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('删除敏感词错误:', err);
    res.status(500).json({ success: false, error: '删除失败' });
  }
});

/**
 * 获取用户处罚状态
 */
router.get('/user-penalty/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM user_violations 
       WHERE user_id = $1 AND status = 0 AND (expire_at IS NULL OR expire_at > NOW())
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    
    if (result.rows.length > 0) {
      const penalty = result.rows[0];
      res.json({
        success: true,
        data: {
          isPenalized: true,
          penalty: penalty.penalty,  // 0=警告 1=删帖 2=禁言 3=封号
          reason: penalty.violation_type,
          expireAt: penalty.expire_at
        }
      });
    } else {
      res.json({
        success: true,
        data: { isPenalized: false }
      });
    }
  } catch (err) {
    console.error('获取用户处罚状态错误:', err);
    res.status(500).json({ success: false, error: '获取失败' });
  }
});

/**
 * 处罚用户（管理员）
 */
router.post('/penalize', async (req, res) => {
  try {
    const { userId, postId, violationType, penalty, reason, days } = req.body;
    
    // 检查处罚类型
    if (penalty === 2) {  // 禁言
      const expireAt = new Date();
      expireAt.setDate(expireAt.getDate() + (days || 7));
      
      await pool.query(
        `INSERT INTO user_violations (user_id, post_id, violation_type, content, penalty, expire_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, postId, violationType, reason, penalty, expireAt]
      );
    } else if (penalty === 3) {  // 封号
      await pool.query(
        `INSERT INTO user_violations (user_id, post_id, violation_type, content, penalty)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, postId, violationType, reason, penalty]
      );
      
      // 直接封禁用户
      await pool.query(
        'UPDATE users SET status = 0 WHERE id = $1',
        [userId]
      );
    } else {
      // 警告或删帖
      await pool.query(
        `INSERT INTO user_violations (user_id, post_id, violation_type, content, penalty)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, postId, violationType, reason, penalty]
      );
    }
    
    // 如果是删帖，删除帖子
    if (penalty >= 1 && postId) {
      await pool.query('UPDATE posts SET status = 0 WHERE id = $1', [postId]);
    }
    
    res.json({ success: true, message: '处罚已执行' });
  } catch (err) {
    console.error('处罚用户错误:', err);
    res.status(500).json({ success: false, error: '操作失败' });
  }
});

/**
 * 举报列表（管理员）
 */
router.get('/reports', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    let whereClause = '';
    const params: any[] = [];
    
    if (status !== undefined) {
      whereClause = 'WHERE r.status = $1';
      params.push(status);
    }
    
    const result = await pool.query(
      `SELECT r.*, u.nickname as reporter_nickname, p.content as post_content, p.images
       FROM reports r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN posts p ON r.post_id = p.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM reports r ${whereClause}`,
      params
    );
    
    res.json({
      success: true,
      data: {
        reports: result.rows,
        total: Number(countResult.rows[0].count)
      }
    });
  } catch (err) {
    console.error('获取举报列表错误:', err);
    res.status(500).json({ success: false, error: '获取失败' });
  }
});

/**
 * 处理举报（管理员）
 */
router.post('/reports/:id/handle', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;  // action: pass/dismiss/remove/penalize
    
    const reportResult = await pool.query('SELECT * FROM reports WHERE id = $1', [id]);
    if (reportResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: '举报不存在' });
    }
    
    const report = reportResult.rows[0];
    
    if (action === 'pass') {
      // 忽略举报
      await pool.query('UPDATE reports SET status = 2 WHERE id = $1', [id]);
    } else if (action === 'dismiss') {
      // 驳回举报
      await pool.query('UPDATE reports SET status = 1 WHERE id = $1', [id]);
    } else if (action === 'remove') {
      // 删除内容
      await pool.query('UPDATE posts SET status = 0 WHERE id = $1', [report.post_id]);
      await pool.query('UPDATE reports SET status = 1 WHERE id = $1', [id]);
    } else if (action === 'penalize') {
      // 删除内容并处罚用户
      await pool.query('UPDATE posts SET status = 0 WHERE id = $1', [report.post_id]);
      await pool.query('UPDATE reports SET status = 1 WHERE id = $1', [id]);
      
      // 处罚用户
      await pool.query(
        `INSERT INTO user_violations (user_id, post_id, violation_type, content, penalty, expire_at)
         VALUES ($1, $2, 'report', $3, 1, NOW() + INTERVAL '7 days')`,
        [report.post_id ? (await pool.query('SELECT user_id FROM posts WHERE id = $1', [report.post_id])).rows[0]?.user_id : null, report.post_id, reason || '被举报']
      );
    }
    
    res.json({ success: true, message: '处理成功' });
  } catch (err) {
    console.error('处理举报错误:', err);
    res.status(500).json({ success: false, error: '处理失败' });
  }
});

/**
 * 获取违规记录（管理员）
 */
router.get('/violations', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    const result = await pool.query(
      `SELECT v.*, u.nickname, u.phone
       FROM user_violations v
       LEFT JOIN users u ON v.user_id = u.id
       ORDER BY v.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('获取违规记录错误:', err);
    res.status(500).json({ success: false, error: '获取失败' });
  }
});

export default router;
