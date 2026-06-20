import { Router } from 'express';
import { query } from '../config/database.js';

const router = Router();

/**
 * 获取当前用户消息列表
 * GET /api/v1/notifications
 * Query: page, limit, type (optional)
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const userId = req.headers['x-user-id'];
    const offset = (Number(page) - 1) * Number(limit);
    
    let whereClause = "(user_id IS NULL OR user_id = $1)";
    let params = [userId];
    
    if (type) {
      whereClause += ` AND type = $${params.length + 1}`;
      params.push(type);
    }
    
    const countResult = await query(
      `SELECT COUNT(*) FROM notifications WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);
    
    params.push(Number(limit), offset);
    const result = await query(
      `SELECT id, title, content, type, is_read, related_id, created_at
       FROM notifications 
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    
    res.json({
      success: true,
      data: {
        list: result.rows,
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('获取消息列表失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/**
 * 获取未读消息数量
 * GET /api/v1/notifications/unread-count
 */
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const result = await query(
      `SELECT COUNT(*) FROM notifications 
       WHERE (user_id IS NULL OR user_id = $1) AND is_read = FALSE`,
      [userId]
    );
    
    res.json({
      success: true,
      data: { count: parseInt(result.rows[0].count) }
    });
  } catch (error) {
    console.error('获取未读数量失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/**
 * 标记消息已读
 * POST /api/v1/notifications/:id/read
 */
router.post('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];
    
    await query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND (user_id IS NULL OR user_id = $2)`,
      [id, userId]
    );
    
    res.json({ success: true, message: '已标记已读' });
  } catch (error) {
    console.error('标记已读失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/**
 * 标记全部已读
 * POST /api/v1/notifications/read-all
 */
router.post('/read-all', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    await query(
      `UPDATE notifications SET is_read = TRUE WHERE (user_id IS NULL OR user_id = $1) AND is_read = FALSE`,
      [userId]
    );
    
    res.json({ success: true, message: '全部已标记已读' });
  } catch (error) {
    console.error('标记全部已读失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/**
 * 删除消息
 * DELETE /api/v1/notifications/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];
    
    await query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除消息失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/**
 * 发送系统公告（管理接口）
 * POST /api/v1/notifications/broadcast
 */
router.post('/broadcast', async (req, res) => {
  try {
    const { title, content, type = 'system' } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ success: false, message: '标题和内容不能为空' });
    }
    
    await query(
      `INSERT INTO notifications (user_id, title, content, type) VALUES (NULL, $1, $2, $3)`,
      [title, content, type]
    );
    
    res.json({ success: true, message: '公告已发布' });
  } catch (error) {
    console.error('发布公告失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/**
 * 发送订单通知给用户
 * POST /api/v1/notifications/send
 */
router.post('/send', async (req, res) => {
  try {
    const { userId, title, content, type = 'order', relatedId } = req.body;
    
    if (!userId || !title || !content) {
      return res.status(400).json({ success: false, message: '参数不完整' });
    }
    
    await query(
      `INSERT INTO notifications (user_id, title, content, type, related_id) VALUES ($1, $2, $3, $4, $5)`,
      [userId, title, content, type, relatedId]
    );
    
    res.json({ success: true, message: '通知已发送' });
  } catch (error) {
    console.error('发送通知失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/**
 * 获取所有公告列表（管理后台）
 * GET /api/v1/notifications/admin/list
 */
router.get('/admin/list', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    const countResult = await query(`SELECT COUNT(*) FROM notifications WHERE user_id IS NULL`);
    const total = parseInt(countResult.rows[0].count);
    
    const result = await query(
      `SELECT id, title, content, type, created_at
       FROM notifications 
       WHERE user_id IS NULL
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [Number(limit), offset]
    );
    
    res.json({
      success: true,
      data: {
        list: result.rows,
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('获取公告列表失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
