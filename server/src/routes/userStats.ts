import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getUserStats, getUserLeaderboard, getOperationStats, UserLevel } from '../services/userStatsService';

const router = Router();

// 获取当前用户统计
router.get('/me', authMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const stats = await getUserStats(userId);
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
router.get('/:userId', authMiddleware, async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const stats = await getUserStats(userId);
    
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
router.get('/leaderboard/:type', authMiddleware, async (req: any, res: any) => {
  try {
    const { type } = req.params;
    const { limit = 10 } = req.query;

    if (!['exp', 'posts', 'likes', 'followers'].includes(type)) {
      return res.status(400).json({ success: false, message: '无效的排行榜类型' });
    }

    const leaderboard = await getUserLeaderboard(type, parseInt(limit as string));

    res.json({ success: true, data: leaderboard });
  } catch (error: any) {
    console.error('获取排行榜失败:', error);
    res.status(500).json({ success: false, message: '获取排行榜失败' });
  }
});

// 获取运营数据概览（管理员）
router.get('/stats/overview', authMiddleware, async (req: any, res: any) => {
  try {
    const stats = await getOperationStats();
    
    if (!stats) {
      return res.status(500).json({ success: false, message: '获取运营数据失败' });
    }

    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('获取运营数据失败:', error);
    res.status(500).json({ success: false, message: '获取运营数据失败' });
  }
});

// 获取等级配置
router.get('/levels/config', (req: any, res: any) => {
  res.json({ success: true, data: UserLevel });
});

export default router;
