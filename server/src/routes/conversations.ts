import express from 'express';
import { authMiddleware as authenticate } from '../middleware/auth';
import * as social from '../services/socialService.js';

const router = express.Router();

// 获取当前用户的会话列表（聊天Tab与社交Tab共用）
router.get('/conversations', authenticate, async (req: any, res) => {
  try {
    const myId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const data = await social.getConversations(myId, page);
    res.json({ conversations: data });
  } catch (error: any) {
    console.error('获取会话列表失败:', error.message);
    res.status(500).json({ error: '获取会话列表失败' });
  }
});

export default router;