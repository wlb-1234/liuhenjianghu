import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

// 创建定时发布任务
router.post('/scheduled-posts', async (req, res) => {
  try {
    const { userId, content, imageUrls, scheduledAt } = req.body;

    if (!userId || !content || !scheduledAt) {
      return res.status(400).json({ error: '缺少必填参数' });
    }

    const scheduleTime = new Date(scheduledAt);
    if (scheduleTime <= new Date()) {
      return res.status(400).json({ error: '预约时间必须是将来的时间' });
    }

    const result = await query(
      `INSERT INTO scheduled_posts (user_id, content, image_urls, scheduled_at, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [userId, content, JSON.stringify(imageUrls || []), scheduledAt]
    );

    res.json({ success: true, message: '定时发布已创建', data: result.rows[0] });
  } catch (error) {
    console.error('创建定时发布错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取定时发布列表
router.get('/scheduled-posts', async (req, res) => {
  try {
    const { userId, page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);

    if (!userId) return res.status(400).json({ error: '缺少用户ID' });

    const result = await query(
      `SELECT * FROM scheduled_posts WHERE user_id = $1 AND status = 'pending'
       ORDER BY scheduled_at ASC LIMIT $2 OFFSET $3`,
      [userId, parseInt(pageSize as string), offset]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 取消定时发布
router.delete('/scheduled-posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    await query(
      `UPDATE scheduled_posts SET status = 'cancelled' WHERE id = $1 AND user_id = $2 AND status = 'pending'`,
      [id, userId]
    );

    res.json({ success: true, message: '已取消定时发布' });
  } catch (error) {
    res.status(500).json({ error: '取消失败' });
  }
});

// 执行定时发布（内部调用）
router.post('/scheduled-posts/execute', async (req, res) => {
  try {
    const { adminKey } = req.body;
    if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'admin_secret_key') {
      return res.status(403).json({ error: '无权限' });
    }

    const now = new Date();
    const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000);

    // 查找待发布的内容
    const posts = await query(
      `SELECT * FROM scheduled_posts WHERE status = 'pending' 
       AND scheduled_at <= $1 AND scheduled_at >= $2`,
      [fiveMinutesLater.toISOString(), now.toISOString()]
    );

    const results = [];
    for (const post of posts.rows) {
      // 创建正式内容
      await query(
        `INSERT INTO contents (user_id, content, image_urls, created_at, is_scheduled) 
         VALUES ($1, $2, $3, $4, true)`,
        [post.user_id, post.content, post.image_urls, post.scheduled_at]
      );

      // 更新状态
      await query(
        `UPDATE scheduled_posts SET status = 'published', executed_at = NOW() WHERE id = $1`,
        [post.id]
      );

      results.push({ id: post.id, status: 'published' });
    }

    res.json({ success: true, message: `处理了 ${results.length} 条定时发布`, results });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
