import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

// 全文搜索
router.get('/search', async (req, res) => {
  try {
    const { 
      q,
      type = 'all',
      page = 1,
      pageSize = 20
    } = req.query;

    if (!q || (q as string).trim().length === 0) {
      return res.status(400).json({ error: '请输入搜索关键词' });
    }

    const keyword = (q as string).trim();
    const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const results: any = { keyword, page: parseInt(page as string), pageSize: parseInt(pageSize as string) };

    // 搜索用户
    if (type === 'all' || type === 'users') {
      const usersResult = await query(
        `SELECT id, username, nickname, avatar_url, bio FROM users 
         WHERE username ILIKE $1 OR nickname ILIKE $1 LIMIT 10`,
        [`%${keyword}%`]
      );
      results.users = usersResult.rows || [];
    }

    // 搜索内容
    if (type === 'all' || type === 'contents') {
      const contentsResult = await query(
        `SELECT c.id, c.content, c.image_urls, c.created_at,
                u.id as user_id, u.username, u.nickname, u.avatar_url
         FROM contents c
         LEFT JOIN users u ON c.user_id = u.id
         WHERE c.is_deleted = false AND c.content ILIKE $1
         ORDER BY c.created_at DESC
         LIMIT $2 OFFSET $3`,
        [`%${keyword}%`, parseInt(pageSize as string), offset]
      );
      results.contents = contentsResult.rows || [];
    }

    // 搜索评论
    if (type === 'all' || type === 'comments') {
      const commentsResult = await query(
        `SELECT cm.id, cm.content, cm.created_at,
                u.id as user_id, u.username, u.nickname, u.avatar_url
         FROM comments cm
         LEFT JOIN users u ON cm.user_id = u.id
         WHERE cm.is_deleted = false AND cm.content ILIKE $1
         ORDER BY cm.created_at DESC LIMIT 20`,
        [`%${keyword}%`]
      );
      results.comments = commentsResult.rows || [];
    }

    res.json({ success: true, data: results });

  } catch (error) {
    console.error('搜索错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 热门搜索
router.get('/hot', async (req, res) => {
  try {
    // 返回默认热词（实际可接入Redis缓存）
    res.json({
      success: true,
      data: [
        { keyword: '江湖', count: 156 },
        { keyword: '流痕', count: 98 },
        { keyword: '留言', count: 76 },
        { keyword: '交友', count: 54 },
        { keyword: '故事', count: 32 }
      ]
    });
  } catch (error) {
    console.error('热门搜索错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 搜索建议
router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || (q as string).trim().length === 0) {
      return res.json({ success: true, data: [] });
    }

    const result = await query(
      `SELECT DISTINCT LEFT(content, 30) as suggestion FROM contents 
       WHERE content ILIKE $1 AND is_deleted = false LIMIT 5`,
      [`%${q}%`]
    );

    res.json({
      success: true,
      data: result.rows.map(r => r.suggestion + '...')
    });
  } catch (error) {
    res.json({ success: true, data: [] });
  }
});

export default router;
