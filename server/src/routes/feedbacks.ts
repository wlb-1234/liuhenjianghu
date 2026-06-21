import { Router } from 'express';
import { query } from '../config/database.js';
import { optionalAuth } from '../middleware/auth.js';
import { verifyAdmin } from '../middleware/admin.js';

const router = Router();

// 提交反馈（用户）
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { type, content, contact } = req.body;
    const userId = req.user?.id || null;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: '请输入反馈内容' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: '反馈内容不能超过1000字' });
    }

    const result = await query(
      `INSERT INTO feedbacks (user_id, type, content, contact) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, type, content, contact, status, created_at`,
      [userId, type || 'suggestion', content.trim(), contact || null]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('提交反馈失败:', error);
    res.status(500).json({ error: '提交失败，请稍后重试' });
  }
});

// 获取用户自己的反馈列表
router.get('/my', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '请先登录' });
    }

    const result = await query(
      `SELECT id, type, content, contact, status, reply, replied_at, created_at 
       FROM feedbacks WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({ data: result.rows });
  } catch (error) {
    console.error('获取反馈列表失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

// 管理端：获取所有反馈（分页）
router.get('/admin/list', verifyAdmin, async (req, res) => {
  try {
    const listResult = await query(`SELECT * FROM feedbacks ORDER BY created_at DESC LIMIT 20`);
    const countResult = await query(`SELECT COUNT(*) as total FROM feedbacks`);

    res.json({
      data: listResult.rows,
      pagination: {
        page: 1,
        limit: 20,
        total: parseInt(countResult.rows[0].total)
      }
    });
  } catch (error) {
    console.error('获取反馈列表失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

// 管理端：回复反馈
router.put('/admin/:id/reply', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reply, status } = req.body;

    const result = await query(
      `UPDATE feedbacks SET reply = $1, status = $2, replied_at = CURRENT_TIMESTAMP 
       WHERE id = $3 RETURNING *`,
      [reply, status || 'processed', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '反馈不存在' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('回复反馈失败:', error);
    res.status(500).json({ error: '回复失败' });
  }
});

export default router;
