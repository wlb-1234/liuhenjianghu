import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

// 撤回消息
router.post('/messages/:id/recall', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: '缺少用户ID' });
    }

    // 查询消息
    const msgResult = await query(
      'SELECT * FROM messages WHERE id = $1',
      [id]
    );

    if (msgResult.rows.length === 0) {
      return res.status(404).json({ error: '消息不存在' });
    }

    const message = msgResult.rows[0];

    // 检查是否是消息作者
    if (message.user_id !== userId) {
      return res.status(403).json({ error: '只能撤回自己的消息' });
    }

    // 检查是否超过撤回时限（5分钟内）
    const messageTime = new Date(message.created_at).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (now - messageTime > fiveMinutes) {
      return res.status(400).json({ error: '消息已超过5分钟，无法撤回' });
    }

    if (message.is_recalled) {
      return res.status(400).json({ error: '消息已被撤回' });
    }

    // 执行撤回
    await query(
      'UPDATE messages SET is_recalled = true, recalled_at = NOW() WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: '消息已撤回',
      data: {
        messageId: id,
        recalledAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('消息撤回错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取撤回消息列表
router.get('/messages/recalled', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: '缺少用户ID' });
    }

    const result = await query(
      `SELECT id, content, recalled_at FROM messages 
       WHERE user_id = $1 AND is_recalled = true 
       ORDER BY recalled_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows || []
    });

  } catch (error) {
    console.error('查询撤回消息错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
