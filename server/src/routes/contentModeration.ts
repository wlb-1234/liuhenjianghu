import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

// 置顶内容
router.post('/contents/:id/pin', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminKey } = req.body;

    if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'admin_secret_key') {
      return res.status(403).json({ error: '无权限' });
    }

    await query('UPDATE contents SET is_pinned = false WHERE is_pinned = true');
    await query('UPDATE contents SET is_pinned = true, pinned_at = NOW() WHERE id = $1', [id]);

    res.json({ success: true, message: '内容已置顶' });
  } catch (error) {
    res.status(500).json({ error: '置顶失败' });
  }
});

// 取消置顶
router.post('/contents/:id/unpin', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminKey } = req.body;
    if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'admin_secret_key') {
      return res.status(403).json({ error: '无权限' });
    }
    await query('UPDATE contents SET is_pinned = false, pinned_at = NULL WHERE id = $1', [id]);
    res.json({ success: true, message: '已取消置顶' });
  } catch (error) {
    res.status(500).json({ error: '取消置顶失败' });
  }
});

// 加精内容
router.post('/contents/:id/feature', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminKey } = req.body;
    if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'admin_secret_key') {
      return res.status(403).json({ error: '无权限' });
    }
    await query('UPDATE contents SET is_featured = true, featured_at = NOW() WHERE id = $1', [id]);
    res.json({ success: true, message: '内容已加精' });
  } catch (error) {
    res.status(500).json({ error: '加精失败' });
  }
});

// 取消加精
router.post('/contents/:id/unfeature', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminKey } = req.body;
    if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'admin_secret_key') {
      return res.status(403).json({ error: '无权限' });
    }
    await query('UPDATE contents SET is_featured = false, featured_at = NULL WHERE id = $1', [id]);
    res.json({ success: true, message: '已取消加精' });
  } catch (error) {
    res.status(500).json({ error: '取消加精失败' });
  }
});

// 获取置顶内容
router.get('/contents/pinned', async (req, res) => {
  try {
    const result = await query(
      `SELECT c.id, c.content, c.image_urls, c.created_at, c.is_pinned, c.is_featured,
              u.id as user_id, u.username, u.nickname, u.avatar_url
       FROM contents c LEFT JOIN users u ON c.user_id = u.id
       WHERE c.is_deleted = false AND c.is_pinned = true`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: '查询失败' });
  }
});

// 获取加精内容
router.get('/contents/featured', async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const result = await query(
      `SELECT c.id, c.content, c.image_urls, c.created_at, c.is_pinned, c.is_featured,
              u.id as user_id, u.username, u.nickname, u.avatar_url
       FROM contents c LEFT JOIN users u ON c.user_id = u.id
       WHERE c.is_deleted = false AND c.is_featured = true
       ORDER BY c.featured_at DESC LIMIT $1 OFFSET $2`,
      [parseInt(pageSize as string), offset]
    );
    res.json({ success: true, data: result.rows, page: parseInt(page as string), pageSize: parseInt(pageSize as string) });
  } catch (error) {
    res.status(500).json({ error: '查询失败' });
  }
});

export default router;
