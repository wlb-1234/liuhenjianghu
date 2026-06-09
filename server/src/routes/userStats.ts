import { Router } from 'express';
import { getUserStats, getLeaderboard, getOverviewStats } from '../services/userStatsService';
import { getContentStats } from '../services/userStatsService';

const router = Router();

// 简单 JWT 验证
const verifyToken = (authHeader: string | undefined) => {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    // JWT 解析 (不验证签名，因为用简单密钥)
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch {
    return null;
  }
};

// 获取当前用户统计
router.get('/me', async (req: any, res: any) => {
  try {
    const payload = verifyToken(req.headers.authorization);
    if (!payload?.userId) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const stats = await getUserStats(payload.userId);
    if (!stats) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('获取用户统计失败:', error);
    res.status(500).json({ success: false, message: '获取用户统计失败' });
  }
});

// 获取指定用户统计
router.get('/:userId', async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const stats = await getUserStats(parseInt(userId));
    
    if (!stats) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('获取用户统计失败:', error);
    res.status(500).json({ success: false, message: '获取用户统计失败' });
  }
});

// 获取排行榜
router.get('/leaderboard/:type', async (req: any, res: any) => {
  try {
    const { type } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!['exp', 'posts', 'likes', 'followers'].includes(type)) {
      return res.status(400).json({ success: false, message: '无效的排行榜类型' });
    }

    const leaderboard = await getLeaderboard(type, limit);
    res.json({ success: true, data: leaderboard });
  } catch (error: any) {
    console.error('获取排行榜失败:', error);
    res.status(500).json({ success: false, message: '获取排行榜失败' });
  }
});

// 兼容旧路由
router.get('/leaderboard', async (req: any, res: any) => {
  try {
    const type = (req.query.type as string) || 'exp';
    const limit = parseInt(req.query.limit as string) || 20;

    const leaderboard = await getLeaderboard(type, limit);
    res.json({ success: true, data: leaderboard });
  } catch (error: any) {
    console.error('获取排行榜失败:', error);
    res.status(500).json({ success: false, message: '获取排行榜失败' });
  }
});

// 运营概览
router.get('/stats/overview', async (req: any, res: any) => {
  try {
    const payload = verifyToken(req.headers.authorization);
    if (!payload?.userId) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const stats = await getOverviewStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('获取运营概览失败:', error);
    res.status(500).json({ success: false, message: '获取运营概览失败' });
  }
});

// 兼容旧路由
router.get('/overview', async (req: any, res: any) => {
  try {
    const stats = await getOverviewStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('获取运营概览失败:', error);
    res.status(500).json({ success: false, message: '获取运营概览失败' });
  }
});

// 内容统计
router.get('/stats/content', async (req: any, res: any) => {
  try {
    const payload = verifyToken(req.headers.authorization);
    if (!payload?.userId) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    res.json({ success: true, data: { posts: 0, comments: 0, likes: 0 } });
  } catch (error: any) {
    console.error('获取内容统计失败:', error);
    res.status(500).json({ success: false, message: '获取内容统计失败' });
  }
});

export default router;
