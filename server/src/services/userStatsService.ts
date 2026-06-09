import pg from 'pg';
const { Pool } = pg;

// 使用与 auth 相同的数据库连接
const pool = new Pool({
  host: '13.114.6.6',
  port: 5432,
  database: 'postgres',
  user: 'postgres.hmlqsbhbbclbzfuutrie',
  password: 'Liuhen2026App',
  ssl: false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

interface UserRecord {
  id: number;
  phone: string;
  nickname: string;
  avatar: string | null;
  exp: number;
  member_level: number;
}

// 用户等级配置
export const UserLevel = {
  NEWBIE: { name: '初出茅庐', minExp: 0, color: '#9CA3AF' },
  APPRENTICE: { name: '江湖学徒', minExp: 100, color: '#10B981' },
  MARTIAL_HERO: { name: '武林高手', minExp: 500, color: '#3B82F6' },
  SECT_MASTER: { name: '宗门掌门', minExp: 1000, color: '#8B5CF6' },
  LEGEND: { name: '江湖传说', minExp: 5000, color: '#F59E0B' },
};

// 获取用户等级
export const getUserLevel = (exp: number) => {
  const levels = Object.values(UserLevel).sort((a, b) => b.minExp - a.minExp);
  for (const level of levels) {
    if (exp >= level.minExp) return level;
  }
  return UserLevel.NEWBIE;
};

// 用户统计
export interface UserStats {
  userId: string;
  username: string;
  avatar?: string;
  exp: number;
  level: { name: string; color: string };
  postCount: number;
  commentCount: number;
  likeCount: number;
  followerCount: number;
  followingCount: number;
  vipStatus: boolean;
  vipExpireTime?: string;
  activeDays: number;
}

// 获取用户统计
export const getUserStats = async (userId: number): Promise<UserStats | null> => {
  try {
    const result = await pool.query<UserRecord>(
      'SELECT id, phone, nickname, avatar, exp, member_level FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) return null;

    const user = result.rows[0];
    return {
      userId: user.id.toString(),
      username: user.nickname || user.phone,
      avatar: user.avatar || undefined,
      exp: user.exp || 0,
      level: getUserLevel(user.exp || 0),
      postCount: 0,
      commentCount: 0,
      likeCount: 0,
      followerCount: 0,
      followingCount: 0,
      vipStatus: user.member_level > 0,
      activeDays: 0,
    };
  } catch (error) {
    console.error('userStatsService.getUserStats error:', error);
    return null;
  }
};

// 获取用户排行榜
export const getUserLeaderboard = async (type: string, limit: number = 20) => {
  try {
    let orderColumn = 'exp';
    if (type === 'posts') orderColumn = 'member_level';
    
    const result = await pool.query<UserRecord>(
      `SELECT id, phone, nickname, avatar, exp, member_level 
       FROM users 
       ORDER BY ${orderColumn} DESC NULLS LAST 
       LIMIT $1`,
      [limit]
    );

    return result.rows.map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      username: user.nickname || user.phone,
      avatar: user.avatar,
      exp: user.exp || 0,
      level: getUserLevel(user.exp || 0),
    }));
  } catch (error) {
    console.error('userStatsService.getUserLeaderboard error:', error);
    return [];
  }
};

// 获取运营概览
export const getOperationStats = async () => {
  try {
    const [userCount, memberCount] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM users WHERE member_level > 0'),
    ]);

    return {
      totalUsers: parseInt(userCount.rows[0].count),
      activeUsers: parseInt(userCount.rows[0].count),
      totalMembers: parseInt(memberCount.rows[0].count),
      totalPosts: 0,
      totalComments: 0,
      todayActiveUsers: parseInt(userCount.rows[0].count),
    };
  } catch (error) {
    console.error('userStatsService.getOperationStats error:', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalMembers: 0,
      totalPosts: 0,
      totalComments: 0,
      todayActiveUsers: 0,
    };
  }
};
