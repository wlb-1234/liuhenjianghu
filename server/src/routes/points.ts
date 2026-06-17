/**
 * 积分系统 - 完整实现
 * 
 * 功能：
 * - 积分获取（签到、点赞、分享、被关注）
 * - 积分消耗（兑换会员、置顶、解锁地区）
 * - 积分商城
 * - 用户等级计算
 */

import { Router } from 'express';
import { getPool } from '../config/database.js';

const router = Router();

/**
 * 积分规则配置
 */
const POINTS_RULES = {
  // 获取积分
  DAILY_CHECKIN: { points: 5, type: 'earn' },
  CONTINUOUS_CHECKIN_7: { points: 50, type: 'earn', condition: '连续签到7天' },
  CONTINUOUS_CHECKIN_30: { points: 300, type: 'earn', condition: '连续签到30天' },
  CONTENT_LIKED: { points: 1, type: 'earn', condition: '留言被点赞' },
  CONTENT_SHARED: { points: 3, type: 'earn', condition: '分享内容' },
  NEW_FOLLOWER: { points: 1, type: 'earn', condition: '新增关注' },
  PROFILE_COMPLETE: { points: 10, type: 'earn', condition: '完善资料' },
  
  // 消耗积分
  REDEEM_VIP_1DAY: { points: 100, type: 'spend', reward: '延长1天会员' },
  REDEEM_TOP_POST: { points: 500, type: 'spend', reward: '1次置顶机会' },
  REDEEM_UNLOCK_REGION: { points: 200, type: 'spend', reward: '解锁1个地区' },
  REDEEM_BADGE: { points: 1000, type: 'spend', reward: '专属标识' },
  REDEEM_PRIVATE_MSG: { points: 300, type: 'spend', reward: '私信特权' },
};

// 用户等级配置
const USER_LEVELS = [
  { level: 1, name: '路人', minPoints: 0, title: '🍃', benefits: ['基础功能'] },
  { level: 2, name: '初入江湖', minPoints: 100, title: '💧', benefits: ['解锁私信'] },
  { level: 3, name: '小有名气', minPoints: 500, title: '🌟', benefits: ['专属表情'] },
  { level: 4, name: '江湖高手', minPoints: 2000, title: '🔥', benefits: ['置顶折扣'] },
  { level: 5, name: '一代宗师', minPoints: 10000, title: '👑', benefits: ['VIP外观'] },
];

// 积分商城商品
const POINTS_SHOP = [
  { id: 'vip_1day', name: '1天会员', points: 100, type: 'vip', value: 1 },
  { id: 'vip_7days', name: '7天会员', points: 600, type: 'vip', value: 7 },
  { id: 'top_post_1', name: '置顶1次', points: 500, type: 'feature', value: 1 },
  { id: 'top_post_3', name: '置顶3次', points: 1200, type: 'feature', value: 3 },
  { id: 'unlock_region', name: '解锁地区', points: 200, type: 'region', value: 1 },
  { id: 'exclusive_badge', name: '专属标识', points: 1000, type: 'badge', value: 1 },
  { id: 'private_msg_10', name: '私信10次', points: 300, type: 'msg', value: 10 },
];

/**
 * 获取用户积分和等级
 */
router.get('/balance/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const pool = getPool();
    
    // 获取用户积分
    const userResult = await pool.query(
      `SELECT id, points, total_points, level, continuous_checkin_days 
       FROM users WHERE id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const user = userResult.rows[0];
    const currentLevel = calculateLevel(user.total_points || 0);
    
    // 获取今日签到状态
    const todayCheckin = await pool.query(
      `SELECT 1 FROM points_transactions 
       WHERE user_id = $1 AND action = 'daily_checkin' 
       AND created_at >= CURRENT_DATE`,
      [userId]
    );
    
    // 获取积分历史（最近10条）
    const history = await pool.query(
      `SELECT action, points, description, created_at 
       FROM points_transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC LIMIT 10`,
      [userId]
    );
    
    res.json({
      success: true,
      data: {
        userId,
        points: user.points || 0,
        totalPoints: user.total_points || 0,
        level: currentLevel,
        continuousCheckinDays: user.continuous_checkin_days || 0,
        checkedInToday: todayCheckin.rows.length > 0,
        recentHistory: history.rows,
      }
    });
  } catch (error) {
    console.error('获取积分失败:', error);
    res.status(500).json({ error: '获取积分失败' });
  }
});

/**
 * 签到
 */
router.post('/checkin', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId不能为空' });
    }
    
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 检查今日是否已签到
      const todayCheck = await client.query(
        `SELECT 1 FROM points_transactions 
         WHERE user_id = $1 AND action = 'daily_checkin' 
         AND created_at >= CURRENT_DATE`,
        [userId]
      );
      
      if (todayCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false, 
          error: '今日已签到',
          message: '明天再来签到吧！'
        });
      }
      
      // 获取用户连续签到天数
      const userResult = await client.query(
        `SELECT points, total_points, continuous_checkin_days 
         FROM users WHERE id = $1`,
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: '用户不存在' });
      }
      
      const user = userResult.rows[0];
      let pointsEarned = POINTS_RULES.DAILY_CHECKIN.points;
      let bonusDesc = '';
      
      // 计算新的连续签到天数
      const newContinuousDays = (user.continuous_checkin_days || 0) + 1;
      
      // 检查连续签到奖励
      if (newContinuousDays === 7) {
        pointsEarned += POINTS_RULES.CONTINUOUS_CHECKIN_7.points;
        bonusDesc = ' + 连续7天奖励50分';
      } else if (newContinuousDays === 30) {
        pointsEarned += POINTS_RULES.CONTINUOUS_CHECKIN_30.points;
        bonusDesc = ' + 连续30天奖励300分';
      }
      
      // 更新用户积分
      const newPoints = (user.points || 0) + pointsEarned;
      const newTotalPoints = (user.total_points || 0) + pointsEarned;
      const newLevel = calculateLevel(newTotalPoints);
      
      await client.query(
        `UPDATE users SET 
          points = $1, 
          total_points = $2, 
          level = $3,
          continuous_checkin_days = $4
         WHERE id = $5`,
        [newPoints, newTotalPoints, newLevel.level, newContinuousDays, userId]
      );
      
      // 记录积分变动
      await client.query(
        `INSERT INTO points_transactions (user_id, action, points, description)
         VALUES ($1, 'daily_checkin', $2, $3)`,
        [userId, pointsEarned, `每日签到+${pointsEarned}分${bonusDesc}`]
      );
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        data: {
          pointsEarned,
          totalPoints: newPoints,
          continuousDays: newContinuousDays,
          newLevel: newLevel,
          message: `签到成功！+${pointsEarned}分${bonusDesc}`,
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('签到失败:', error);
    res.status(500).json({ error: '签到失败' });
  }
});

/**
 * 积分商城 - 获取商品列表
 */
router.get('/shop', async (req, res) => {
  res.json({
    success: true,
    data: {
      items: POINTS_SHOP,
      rules: POINTS_RULES,
    }
  });
});

/**
 * 积分商城 - 兑换商品
 */
router.post('/redeem', async (req, res) => {
  try {
    const { userId, itemId } = req.body;
    
    if (!userId || !itemId) {
      return res.status(400).json({ error: '参数不完整' });
    }
    
    const item = POINTS_SHOP.find(i => i.id === itemId);
    if (!item) {
      return res.status(404).json({ error: '商品不存在' });
    }
    
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 获取用户积分
      const userResult = await client.query(
        `SELECT points FROM users WHERE id = $1`,
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: '用户不存在' });
      }
      
      const userPoints = userResult.rows[0].points || 0;
      
      if (userPoints < item.points) {
        await client.query('ROLLBACK');
        return res.json({
          success: false,
          error: '积分不足',
          needPoints: item.points,
          currentPoints: userPoints,
        });
      }
      
      // 扣除积分
      await client.query(
        `UPDATE users SET points = points - $1 WHERE id = $2`,
        [item.points, userId]
      );
      
      // 记录兑换
      await client.query(
        `INSERT INTO points_transactions (user_id, action, points, description)
         VALUES ($1, 'redeem', $2, $3)`,
        [userId, -item.points, `兑换${item.name}`]
      );
      
      // 根据商品类型执行相应操作
      let extraResult = null;
      switch (item.type) {
        case 'vip':
          // 延长会员时间
          await client.query(
            `UPDATE users SET 
              vip_expires_at = COALESCE(vip_expires_at, CURRENT_DATE) + INTERVAL '${item.value} day'
             WHERE id = $1`,
            [userId]
          );
          extraResult = { type: 'vip', days: item.value };
          break;
          
        case 'feature':
          // 添加置顶次数
          await client.query(
            `UPDATE users SET pin_credits = pin_credits + $1 WHERE id = $2`,
            [item.value, userId]
          );
          extraResult = { type: 'pin_credits', count: item.value };
          break;
          
        case 'badge':
          // 解锁专属标识
          extraResult = { type: 'badge_unlocked', name: item.name };
          break;
          
        case 'msg':
          // 增加私信次数
          extraResult = { type: 'private_msg_credits', count: item.value };
          break;
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        data: {
          redeemed: item,
          remainingPoints: userPoints - item.points,
          extra: extraResult,
          message: `兑换成功！${item.name}`,
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('兑换失败:', error);
    res.status(500).json({ error: '兑换失败' });
  }
});

/**
 * 积分记录
 */
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const pool = getPool();
    
    const [historyResult, countResult] = await Promise.all([
      pool.query(
        `SELECT action, points, description, created_at 
         FROM points_transactions 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*) FROM points_transactions WHERE user_id = $1`,
        [userId]
      )
    ]);
    
    res.json({
      success: true,
      data: {
        list: historyResult.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      }
    });
    
  } catch (error) {
    console.error('获取历史失败:', error);
    res.status(500).json({ error: '获取历史失败' });
  }
});

/**
 * 获取用户等级配置
 */
router.get('/levels', async (req, res) => {
  res.json({
    success: true,
    data: {
      levels: USER_LEVELS,
      currentPrice: {
        recharge: '1元 = 100积分',
        withdraw: '1000积分 = 5元',
      }
    }
  });
});

/**
 * 添加积分（被其他功能调用）
 */
router.post('/add', async (req, res) => {
  try {
    const { userId, action, points, description } = req.body;
    
    if (!userId || !action || !points) {
      return res.status(400).json({ error: '参数不完整' });
    }
    
    const pool = getPool();
    
    // 更新用户积分
    await pool.query(
      `UPDATE users SET 
        points = points + $1,
        total_points = total_points + $1
       WHERE id = $2`,
      [points, userId]
    );
    
    // 记录
    await pool.query(
      `INSERT INTO points_transactions (user_id, action, points, description)
       VALUES ($1, $2, $3, $4)`,
      [userId, action, points, description]
    );
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('添加积分失败:', error);
    res.status(500).json({ error: '添加积分失败' });
  }
});

/**
 * 计算用户等级
 */
function calculateLevel(totalPoints) {
  for (let i = USER_LEVELS.length - 1; i >= 0; i--) {
    if (totalPoints >= USER_LEVELS[i].minPoints) {
      return USER_LEVELS[i];
    }
  }
  return USER_LEVELS[0];
}

export default router;
