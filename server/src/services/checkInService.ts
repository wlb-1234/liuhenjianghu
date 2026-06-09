/**
 * 签到服务
 * 用户每日签到获取经验值和积分
 */

import pg from 'pg';
const { Pool } = pg;

// 创建连接池
const pool = new Pool({
  host: '13.114.6.6',
  port: 5432,
  database: 'postgres',
  user: 'postgres.hmlqsbhbbclbzfuutrie',
  password: 'Liuhen2026App',
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

interface CheckInResult {
  success: boolean;
  message: string;
  data?: {
    consecutiveDays: number;
    expGained: number;
    totalExp: number;
    streak: number;
    rewards?: {
      type: string;
      amount: number;
    }[];
  };
}

interface CheckInRecord {
  id: number;
  user_id: number;
  check_in_date: string;
  exp_gained: number;
  streak: number;
  created_at: Date;
}

export class CheckInService {
  // 签到配置
  private static readonly BASE_EXP = 10; // 基础经验
  private static readonly STREAK_BONUS = 5; // 连续签到奖励
  private static readonly MAX_STREAK_BONUS = 50; // 最大连续签到奖励

  /**
   * 用户签到
   */
  static async checkIn(userId: number): Promise<CheckInResult> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      // 检查今天是否已签到
      const todayCheck = await pool.query(
        'SELECT id FROM check_ins WHERE user_id = $1 AND check_in_date = $2',
        [userId, today]
      );

      if (todayCheck.rows.length > 0) {
        return {
          success: false,
          message: '今日已签到'
        };
      }

      // 获取昨天的日期
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // 检查是否连续签到
      const yesterdayCheck = await pool.query(
        'SELECT streak FROM check_ins WHERE user_id = $1 AND check_in_date = $2',
        [userId, yesterdayStr]
      );

      let streak = 1;
      if (yesterdayCheck.rows.length > 0) {
        streak = yesterdayCheck.rows[0].streak + 1;
      }

      // 计算获得的经验值
      const streakBonus = Math.min(streak * this.STREAK_BONUS, this.MAX_STREAK_BONUS);
      const expGained = this.BASE_EXP + streakBonus;

      // 插入签到记录
      await pool.query(
        `INSERT INTO check_ins (user_id, check_in_date, exp_gained, streak) 
         VALUES ($1, $2, $3, $4)`,
        [userId, today, expGained, streak]
      );

      // 更新用户经验值
      await pool.query(
        'UPDATE users SET exp = exp + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [expGained, userId]
      );

      // 获取用户总经验值
      const userResult = await pool.query(
        'SELECT exp FROM users WHERE id = $1',
        [userId]
      );
      const totalExp = userResult.rows[0]?.exp || 0;

      // 计算奖励
      const rewards: { type: string; amount: number }[] = [
        { type: '经验', amount: expGained }
      ];
      
      if (streak > 1) {
        rewards.push({ type: '连续签到奖励', amount: streakBonus });
      }

      // 检查是否达成成就
      if (streak === 7) {
        rewards.push({ type: '成就奖励(连续7天)', amount: 50 });
      } else if (streak === 30) {
        rewards.push({ type: '成就奖励(连续30天)', amount: 200 });
      }

      return {
        success: true,
        message: streak > 1 
          ? `签到成功！连续签到 ${streak} 天，获得 ${expGained} 经验` 
          : `签到成功！获得 ${expGained} 经验`,
        data: {
          consecutiveDays: streak,
          expGained,
          totalExp,
          streak,
          rewards
        }
      };
    } catch (error: any) {
      console.error('签到失败:', error);
      return {
        success: false,
        message: '签到失败: ' + error.message
      };
    }
  }

  /**
   * 获取用户签到状态
   */
  static async getCheckInStatus(userId: number): Promise<{
    checkedIn: boolean;
    currentStreak: number;
    totalCheckIns: number;
    lastCheckIn: string | null;
    canClaimReward: boolean;
  }> {
    const today = new Date().toISOString().split('T')[0];

    try {
      // 获取今天的签到状态
      const todayCheck = await pool.query(
        'SELECT id FROM check_ins WHERE user_id = $1 AND check_in_date = $2',
        [userId, today]
      );

      // 获取总签到次数
      const totalCheck = await pool.query(
        'SELECT COUNT(*) as count, MAX(check_in_date) as last_date FROM check_ins WHERE user_id = $1',
        [userId]
      );

      // 获取当前连续签到天数
      let streak = 0;
      let checkDate = new Date();
      
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const check = await pool.query(
          'SELECT id FROM check_ins WHERE user_id = $1 AND check_in_date = $2',
          [userId, dateStr]
        );
        
        if (check.rows.length > 0) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      return {
        checkedIn: todayCheck.rows.length > 0,
        currentStreak: streak,
        totalCheckIns: parseInt(totalCheck.rows[0]?.count || '0'),
        lastCheckIn: totalCheck.rows[0]?.last_date || null,
        canClaimReward: todayCheck.rows.length === 0
      };
    } catch (error: any) {
      console.error('获取签到状态失败:', error);
      return {
        checkedIn: false,
        currentStreak: 0,
        totalCheckIns: 0,
        lastCheckIn: null,
        canClaimReward: false
      };
    }
  }

  /**
   * 获取签到日历（本月签到情况）
   */
  static async getCheckInCalendar(userId: number, year: number, month: number): Promise<string[]> {
    
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      
      const result = await pool.query(
        `SELECT check_in_date FROM check_ins 
         WHERE user_id = $1 AND check_in_date >= $2 AND check_in_date <= $3
         ORDER BY check_in_date`,
        [userId, startDate, endDate]
      );

      return result.rows.map(row => row.check_in_date);
    } catch (error: any) {
      console.error('获取签到日历失败:', error);
      return [];
    }
  }

  /**
   * 获取签到排行榜
   */
  static async getCheckInLeaderboard(limit: number = 10): Promise<{
    rank: number;
    userId: number;
    username: string;
    streak: number;
    totalCheckIns: number;
  }[]> {
    
    try {
      const result = await pool.query(
        `SELECT 
           u.id as user_id,
           COALESCE(u.username, u.nickname, u.phone) as username,
           MAX(c.streak) as streak,
           COUNT(c.id) as total_check_ins
         FROM check_ins c
         JOIN users u ON c.user_id = u.id
         WHERE c.check_in_date >= date_trunc('month', CURRENT_DATE)
         GROUP BY u.id, username
         ORDER BY total_check_ins DESC, streak DESC
         LIMIT $1`,
        [limit]
      );

      return result.rows.map((row, index) => ({
        rank: index + 1,
        userId: row.user_id,
        username: row.username,
        streak: parseInt(row.streak) || 0,
        totalCheckIns: parseInt(row.total_check_ins) || 0
      }));
    } catch (error: any) {
      console.error('获取签到排行榜失败:', error);
      return [];
    }
  }
}
