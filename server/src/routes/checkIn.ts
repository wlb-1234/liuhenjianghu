/**
 * 签到路由
 * 用户每日签到获取经验值
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { CheckInService } from '../services/checkInService';

const router = Router();

/**
 * POST /api/v1/check-in
 * 用户签到
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const result = await CheckInService.checkIn(userId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error: any) {
    console.error('签到错误:', error);
    res.status(500).json({ success: false, message: '签到失败' });
  }
});

/**
 * GET /api/v1/check-in/status
 * 获取签到状态
 */
router.get('/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const status = await CheckInService.getCheckInStatus(userId);
    res.json({ success: true, data: status });
  } catch (error: any) {
    console.error('获取签到状态错误:', error);
    res.status(500).json({ success: false, message: '获取签到状态失败' });
  }
});

/**
 * GET /api/v1/check-in/calendar
 * 获取签到日历
 * Query: year, month
 */
router.get('/calendar', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    
    const calendar = await CheckInService.getCheckInCalendar(userId, year, month);
    res.json({ success: true, data: { year, month, dates: calendar } });
  } catch (error: any) {
    console.error('获取签到日历错误:', error);
    res.status(500).json({ success: false, message: '获取签到日历失败' });
  }
});

/**
 * GET /api/v1/check-in/leaderboard
 * 获取签到排行榜
 * Query: limit
 */
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const leaderboard = await CheckInService.getCheckInLeaderboard(limit);
    res.json({ success: true, data: leaderboard });
  } catch (error: any) {
    console.error('获取签到排行榜错误:', error);
    res.status(500).json({ success: false, message: '获取签到排行榜失败' });
  }
});

/**
 * GET /api/v1/check-in/rewards
 * 获取签到奖励规则
 */
router.get('/rewards', async (req: Request, res: Response) => {
  const rewards = {
    baseExp: 10,
    streakBonus: 5,
    maxStreakBonus: 50,
    achievements: [
      { days: 7, name: '连续签到7天', bonus: 50 },
      { days: 30, name: '连续签到30天', bonus: 200 }
    ],
    description: '每日签到可获得基础经验值，连续签到可获得额外奖励，连续7天和30天可获得成就奖励'
  };
  
  res.json({ success: true, data: rewards });
});

export default router;
