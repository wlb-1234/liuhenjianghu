import { Router } from 'express';
import { query } from '../config/database.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';

const router = Router();

// 获取评论列表
router.get('/item/:itemId/:itemType', optionalAuth, async (req, res) => {
  try {
    const { itemId, itemType } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // 获取评论（只查主评论，不含回复）
    const comments = await query(`
      SELECT c.id, c.user_id, c.item_id, c.item_type, c.content, c.parent_id, c.likes, c.created_at, c.updated_at, 
        (SELECT COALESCE(nickname, '用户') FROM users WHERE id = c.user_id) as username, 
        (SELECT avatar FROM users WHERE id = c.user_id) as avatar,
        (SELECT COUNT(*) FROM comments WHERE parent_id = c.id) as reply_count
      FROM comments c
      WHERE c.item_id = $1 AND c.item_type = $2 AND c.parent_id IS NULL
      ORDER BY c.created_at DESC
      LIMIT $3 OFFSET $4
    `, [itemId, itemType, limit, offset]);

    // 获取总数
    const totalResult = await query(
      'SELECT COUNT(*) FROM comments WHERE item_id = $1 AND item_type = $2 AND parent_id IS NULL',
      [itemId, itemType]
    );
    const total = Number(totalResult[0].count);

    res.json({
      success: true,
      data: comments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('获取评论失败:', error);
    res.status(500).json({ success: false, message: '获取评论失败' });
  }
});

// 获取评论回复
router.get('/replies/:parentId', optionalAuth, async (req, res) => {
  try {
    const { parentId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const replies = await query(`
      SELECT c.*, 
        (SELECT COALESCE(nickname, '用户') FROM users WHERE id = c.user_id) as username,
        (SELECT avatar FROM users WHERE id = c.user_id) as avatar,
        (SELECT COALESCE(nickname, '用户') FROM users WHERE id = c.reply_to_user_id) as reply_to_username
      FROM comments c
      WHERE c.parent_id = $1
      ORDER BY c.created_at ASC
      LIMIT $2 OFFSET $3
    `, [parentId, limit, offset]);

    res.json({ success: true, data: replies });
  } catch (error) {
    console.error('获取回复失败:', error);
    res.status(500).json({ success: false, message: '获取回复失败' });
  }
});

// 发送评论（需要登录）
router.post('/', async (req, res) => {
  try {
    const { item_id, item_type, content, parent_id, reply_to_user_id } = req.body;
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }

    if (!item_id || !item_type || !content) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ success: false, message: '评论内容过长' });
    }

    const result = await query(`
      INSERT INTO comments (user_id, item_id, item_type, content, parent_id, reply_to_user_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [userId, item_id, item_type, content, parent_id || null, reply_to_user_id || null]);

    // 获取用户信息
    const userInfo = await query(
      'SELECT nickname as username, avatar FROM users WHERE id = $1',
      [userId]
    );

    res.json({
      success: true,
      data: { ...result[0], ...(userInfo[0] || {}) }
    });
  } catch (error) {
    console.error('发送评论失败:', error);
    res.status(500).json({ success: false, message: '发送评论失败' });
  }
});

// 删除评论
router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const comment = await query(
      'SELECT user_id FROM comments WHERE id = $1',
      [id]
    );

    if (comment.length === 0) {
      return res.status(404).json({ success: false, message: '评论不存在' });
    }

    if (comment[0].user_id !== userId) {
      return res.status(403).json({ success: false, message: '无权删除此评论' });
    }

    await query('DELETE FROM comments WHERE id = $1', [id]);

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({ success: false, message: '删除评论失败' });
  }
});

// 点赞评论
router.post('/:id/like', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    await query(
      'UPDATE comments SET likes = likes + 1 WHERE id = $1',
      [id]
    );

    res.json({ success: true, message: '点赞成功' });
  } catch (error) {
    console.error('点赞失败:', error);
    res.status(500).json({ success: false, message: '点赞失败' });
  }
});

export default router;

// 调试：检查 users 表结构
router.get('/debug/users', async (req, res) => {
  try {
    const result = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    res.json({ success: true, columns: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
