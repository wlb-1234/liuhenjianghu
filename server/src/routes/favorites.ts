import { Router } from 'express';
import { query } from '../config/database.js';

const router = Router();

/**
 * 获取收藏列表
 * GET /api/v1/favorites
 * Query: type (article/video), page, limit
 */
router.get('/', async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const userId = req.headers['x-user-id'];
    const offset = (Number(page) - 1) * Number(limit);
    
    let sql = `
      SELECT f.id, f.item_id, f.item_type, f.created_at,
             a.id as article_id, a.title as article_title, a.cover_image as article_cover,
             a.summary as article_summary, a.view_count as article_views,
             v.id as video_id, v.title as video_title, v.cover_url as video_cover,
             v.duration as video_duration
      FROM favorites f
      LEFT JOIN articles a ON f.item_type = 'article' AND f.item_id = a.id
      LEFT JOIN videos v ON f.item_type = 'video' AND f.item_id = v.id
      WHERE f.user_id = $1
    `;
    const params: any[] = [userId];
    
    if (type) {
      sql += ` AND f.item_type = $2`;
      params.push(type);
    }
    
    sql += ` ORDER BY f.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), offset);
    
    const result = await query(sql, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/**
 * 添加收藏
 * POST /api/v1/favorites
 * Body: itemId, itemType (article/video)
 */
router.post('/', async (req, res) => {
  try {
    const { itemId, itemType } = req.body;
    const userId = req.headers['x-user-id'];
    
    if (!itemId || !itemType) {
      return res.status(400).json({ success: false, message: '参数不完整' });
    }
    
    await query(
      `INSERT INTO favorites (user_id, item_id, item_type) VALUES ($1, $2, $3) 
       ON CONFLICT (user_id, item_id, item_type) DO NOTHING`,
      [userId, itemId, itemType]
    );
    
    res.json({ success: true, message: '收藏成功' });
  } catch (error) {
    console.error('添加收藏失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/**
 * 取消收藏
 * DELETE /api/v1/favorites/:itemId
 * Query: type (article/video)
 */
router.delete('/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { type } = req.query;
    const userId = req.headers['x-user-id'];
    
    await query(
      `DELETE FROM favorites WHERE user_id = $1 AND item_id = $2 AND item_type = $3`,
      [userId, itemId, type]
    );
    
    res.json({ success: true, message: '已取消收藏' });
  } catch (error) {
    console.error('取消收藏失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/**
 * 检查是否已收藏
 * GET /api/v1/favorites/check/:itemId
 * Query: type (article/video)
 */
router.get('/check/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { type } = req.query;
    const userId = req.headers['x-user-id'];
    
    const result = await query(
      `SELECT id FROM favorites WHERE user_id = $1 AND item_id = $2 AND item_type = $3`,
      [userId, itemId, type]
    );
    
    res.json({
      success: true,
      data: { isFavorited: result.rows.length > 0 }
    });
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/**
 * 批量检查收藏状态
 * POST /api/v1/favorites/batch-check
 * Body: itemIds: number[], itemType: string
 */
router.post('/batch-check', async (req, res) => {
  try {
    const { itemIds, itemType } = req.body;
    const userId = req.headers['x-user-id'];
    
    if (!itemIds || !itemType) {
      return res.status(400).json({ success: false, message: '参数不完整' });
    }
    
    const result = await query(
      `SELECT item_id FROM favorites WHERE user_id = $1 AND item_type = $2 AND item_id = ANY($3)`,
      [userId, itemType, itemIds]
    );
    
    const favoritedIds = result.rows.map(r => r.item_id);
    
    res.json({
      success: true,
      data: { favoritedIds }
    });
  } catch (error) {
    console.error('批量检查收藏状态失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
