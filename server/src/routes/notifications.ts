import express from 'express';
import { getPool } from '../config/database.js';

const router = express.Router();

// 获取通知列表
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const { userId, type, page = 1, pageSize = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    
    let whereClause = '1=1';
    const params: any[] = [];
    
    if (userId) {
      whereClause += ' AND user_id = $' + (params.length + 1);
      params.push(userId);
    }
    
    if (type) {
      whereClause += ' AND type = $' + (params.length + 1);
      params.push(type);
    }
    
    // 查询通知
    const result = await pool.query(`
      SELECT id, user_id, type, title, content, related_id, is_read, created_at
      FROM notifications
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, Number(pageSize), offset]);
    
    // 统计总数
    const countResult = await pool.query(`
      SELECT COUNT(*) as total FROM notifications WHERE ${whereClause}
    `, params);
    
    // 统计未读数
    const unreadResult = await pool.query(`
      SELECT COUNT(*) as unread FROM notifications WHERE user_id = $1 AND is_read = false
    `, userId ? [userId] : []);
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: result.rows,
        total: parseInt(countResult.rows[0].total),
        unreadCount: parseInt(unreadResult.rows[0]?.unread || 0),
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  } catch (error) {
    console.error('[Notification] Query error:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取未读通知数
router.get('/unread-count', async (req, res) => {
  try {
    const pool = getPool();
    const { userId } = req.query;
    
    if (!userId) {
      res.json({ code: 200, data: { count: 0 } });
      return;
    }
    
    const result = await pool.query(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = $1 AND is_read = false
    `, [userId]);
    
    res.json({ code: 200, data: { count: parseInt(result.rows[0].count) } });
  } catch (error) {
    console.error('[Notification] Unread count error:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 标记已读
router.put('/:id/read', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    
    await pool.query(`
      UPDATE notifications SET is_read = true, read_at = NOW()
      WHERE id = $1
    `, [id]);
    
    res.json({ code: 200, message: '标记已读成功' });
  } catch (error) {
    console.error('[Notification] Mark read error:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 标记全部已读
router.put('/read-all', async (req, res) => {
  try {
    const pool = getPool();
    const { userId } = req.body;
    
    if (!userId) {
      res.status(400).json({ code: 400, message: '缺少用户ID' });
      return;
    }
    
    await pool.query(`
      UPDATE notifications SET is_read = true, read_at = NOW()
      WHERE user_id = $1 AND is_read = false
    `, [userId]);
    
    res.json({ code: 200, message: '全部已读成功' });
  } catch (error) {
    console.error('[Notification] Mark all read error:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 删除通知
router.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    
    await pool.query('DELETE FROM notifications WHERE id = $1', [id]);
    
    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('[Notification] Delete error:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 发送通知（内部调用）
router.post('/send', async (req, res) => {
  try {
    const pool = getPool();
    const { userId, type, title, content, relatedId } = req.body;
    
    if (!userId || !type || !title) {
      res.status(400).json({ code: 400, message: '缺少必要参数' });
      return;
    }
    
    const result = await pool.query(`
      INSERT INTO notifications (user_id, type, title, content, related_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, type, title, content || '', relatedId || null]);
    
    res.json({ code: 200, message: '发送成功', data: result.rows[0] });
  } catch (error) {
    console.error('[Notification] Send error:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 通知类型统计
router.get('/stats/types', async (req, res) => {
  try {
    const pool = getPool();
    const { userId } = req.query;
    
    let whereClause = '';
    const params: any[] = [];
    
    if (userId) {
      whereClause = 'WHERE user_id = $1';
      params.push(userId);
    }
    
    const result = await pool.query(`
      SELECT type, COUNT(*) as count 
      FROM notifications 
      ${whereClause}
      GROUP BY type
    `, params);
    
    res.json({ code: 200, data: result.rows });
  } catch (error) {
    console.error('[Notification] Stats error:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

export default router;
