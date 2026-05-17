import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getUserById, updateUser } from '../services/userService';
import { getAllMemberLevels, getMemberLevel } from '../services/memberService';

const router = Router();

// 获取会员等级列表
router.get('/levels', async (req: Request, res: Response) => {
  try {
    const levels = await getAllMemberLevels();
    
    res.json({
      levels: levels.map(level => ({
        level: level.level,
        name: level.name,
        price: level.price,
        region_limit: level.region_limit,
        daily_limit: level.daily_limit,
        retention_days: level.retention_days,
        can_pin: level.can_pin
      }))
    });
  } catch (error) {
    console.error('获取会员等级错误:', error);
    res.status(500).json({ error: '获取会员等级失败' });
  }
});

// 升级会员（模拟支付）
router.post('/upgrade', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { level } = req.body;
    
    if (level === undefined || level < 0 || level > 4) {
      return res.status(400).json({ error: '无效的会员等级' });
    }
    
    const targetLevel = await getMemberLevel(level);
    
    // 检查是否已购买更高等级
    if (req.user!.member_level >= level) {
      return res.status(400).json({ error: '您已经拥有此等级或更高等级' });
    }
    
    // 计算过期时间（一个月）
    const expireAt = new Date();
    expireAt.setMonth(expireAt.getMonth() + 1);
    
    // 更新用户会员等级
    const user = await updateUser(req.userId!, {
      member_level: level,
      member_expire_at: expireAt,
      updated_at: new Date()
    });
    
    res.json({
      success: true,
      message: `恭喜！您已成功升级为${targetLevel.name}`,
      member: {
        level: user.member_level,
        name: targetLevel.name,
        expire_at: user.member_expire_at
      }
    });
  } catch (error) {
    console.error('升级会员错误:', error);
    res.status(500).json({ error: '升级失败' });
  }
});

// 获取当前会员状态
router.get('/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await getUserById(req.userId!);
    const memberLevel = await getMemberLevel(user!.member_level);
    
    res.json({
      level: user!.member_level,
      name: memberLevel.name,
      price: memberLevel.price,
      region_limit: memberLevel.region_limit,
      daily_limit: memberLevel.daily_limit,
      retention_days: memberLevel.retention_days,
      can_pin: memberLevel.can_pin,
      expire_at: user!.member_expire_at,
      today_post_count: user!.today_post_count,
      total_likes: user!.total_likes,
      total_posts: user!.total_posts
    });
  } catch (error) {
    console.error('获取会员状态错误:', error);
    res.status(500).json({ error: '获取会员状态失败' });
  }
});

export default router;
