import { Router, Request, Response } from 'express';
import { getPool } from '../config/database';
const pool = getPool();
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /api/v1/collections
 * 收藏帖子
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { postId } = req.body;

  if (!postId) {
    return res.status(400).json({ error: '缺少帖子ID' });
  }

  try {
    // 检查帖子是否存在
    const postCheck = await pool.query('SELECT id FROM posts WHERE id = $1', [postId]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: '帖子不存在' });
    }

    // 检查是否已收藏
    const existCheck = await pool.query(
      'SELECT id FROM collections WHERE user_id = $1 AND post_id = $2',
      [userId, postId]
    );

    if (existCheck.rows.length > 0) {
      return res.status(400).json({ error: '已收藏过该帖子' });
    }

    // 添加收藏
    const result = await pool.query(
      'INSERT INTO collections (user_id, post_id) VALUES ($1, $2) RETURNING *',
      [userId, postId]
    );

    res.status(201).json({ 
      success: true, 
      message: '收藏成功',
      data: result.rows[0] 
    });
  } catch (error) {
    console.error('收藏失败:', error);
    res.status(500).json({ error: '收藏失败' });
  }
});

/**
 * DELETE /api/v1/collections/:postId
 * 取消收藏
 */
router.delete('/:postId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const postId = parseInt(req.params.postId);

  if (isNaN(postId)) {
    return res.status(400).json({ error: '无效的帖子ID' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM collections WHERE user_id = $1 AND post_id = $2 RETURNING id',
      [userId, postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '收藏记录不存在' });
    }

    res.json({ success: true, message: '取消收藏成功' });
  } catch (error) {
    console.error('取消收藏失败:', error);
    res.status(500).json({ error: '取消收藏失败' });
  }
});

/**
 * GET /api/v1/collections
 * 获取我的收藏列表
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const offset = (page - 1) * pageSize;

  try {
    // 获取收藏列表
    const result = await pool.query(`
      SELECT c.id as collection_id, c.created_at as collected_at,
             p.id as post_id, p.content, p.images, p.like_count, p.comment_count,
             p.created_at as post_created_at,
             u.id as user_id, u.nickname, u.avatar_url
      FROM collections c
      JOIN posts p ON c.post_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, pageSize, offset]);

    // 获取总数
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM collections WHERE user_id = $1',
      [userId]
    );
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    res.status(500).json({ error: '获取收藏列表失败' });
  }
});

/**
 * GET /api/v1/collections/check/:postId
 * 检查是否已收藏
 */
router.get('/check/:postId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const postId = parseInt(req.params.postId);

  if (isNaN(postId)) {
    return res.status(400).json({ error: '无效的帖子ID' });
  }

  try {
    const result = await pool.query(
      'SELECT id FROM collections WHERE user_id = $1 AND post_id = $2',
      [userId, postId]
    );

    res.json({ 
      success: true, 
      isCollected: result.rows.length > 0 
    });
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    res.status(500).json({ error: '检查收藏状态失败' });
  }
});

export default router;
