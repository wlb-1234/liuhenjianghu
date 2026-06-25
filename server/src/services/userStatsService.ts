import pg from 'pg';
const { Pool } = pg;

// 使用与 auth 相同的数据库连接
const pool = new Pool({
  host: 'db.hmlqsbhbbclbzfuutrie.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Liuhen2026App@',
  ssl: false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// 用户等级配置（基于注册时间）
export const UserLevel = {
  NEWBIE: { name: '初出茅庐', minDays: 0, color: '#9CA3AF' },
  APPRENTICE: { name: '江湖学徒', minDays: 7, color: '#10B981' },
  MARTIAL_HERO: { name: '武林高手', minDays: 30, color: '#3B82F6' },
  SECT_MASTER: { name: '宗门掌门', minDays: 90, color: '#8B5CF6' },
  LEGEND: { name: '江湖传说', minDays: 365, color: '#F59E0B' },
};

// 获取用户等级
export const getUserLevel = (days: number) => {
  const levels = Object.values(UserLevel).sort((a, b) => b.minDays - a.minDays);
  for (const level of levels) {
    if (days >= level.minDays) return level;
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

// 计算活跃天数
const getActiveDays = (createdAt: Date): number => {
  const now = new Date();
  const diff = now.getTime() - createdAt.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

// 计算经验值（基于活跃天数和发帖数）
const calculateExp = (activeDays: number, postCount: number): number => {
  return activeDays * 10 + postCount * 50;
};

// 获取用户统计
export const getUserStats = async (userId: number): Promise<UserStats | null> => {
  try {
    // 不依赖 exp 列，使用 created_at 和其他字段计算
    const result = await pool.query(
      `SELECT id, phone, nickname, avatar, member_level, created_at 
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) return null;

    const user = result.rows[0];
    const createdAt = new Date(user.created_at);
    const activeDays = getActiveDays(createdAt);
    const postCount = 0; // 简化处理

    return {
      userId: user.id.toString(),
      username: user.nickname || user.phone,
      avatar: user.avatar || undefined,
      exp: calculateExp(activeDays, postCount),
      level: getUserLevel(activeDays),
      postCount,
      commentCount: 0,
      likeCount: 0,
      followerCount: 0,
      followingCount: 0,
      vipStatus: false,
      activeDays,
    };
  } catch (error: any) {
    console.error('获取用户统计失败:', error.message);
    return null;
  }
};

// 获取用户排行榜
export const getLeaderboard = async (type: string = 'exp', limit: number = 20) => {
  try {
    // 基于 created_at 计算经验值进行排行
    const result = await pool.query(
      `SELECT id, phone, nickname, avatar, member_level, created_at,
              EXTRACT(DAY FROM NOW() - created_at)::integer as active_days
       FROM users 
       ORDER BY created_at DESC 
       LIMIT $1`,
      [limit]
    );

    return result.rows.map((user, index) => {
      const activeDays = user.active_days || 0;
      return {
        rank: index + 1,
        userId: user.id,
        username: user.nickname || user.phone,
        avatar: user.avatar,
        exp: calculateExp(activeDays, 0),
        level: getUserLevel(activeDays),
        memberLevel: user.member_level || 1,
      };
    });
  } catch (error: any) {
    console.error('获取排行榜失败:', error.message);
    return [];
  }
};

// 获取运营数据概览
export const getOverviewStats = async () => {
  try {
    const usersResult = await pool.query('SELECT COUNT(*) as total FROM users');
    const postsResult = await pool.query('SELECT COUNT(*) as total FROM posts');
    const commentsResult = await pool.query('SELECT COUNT(*) as total FROM comments');

    const usersCount = parseInt(usersResult.rows[0]?.total || '0');
    const postsCount = parseInt(postsResult.rows[0]?.total || '0');
    const commentsCount = parseInt(commentsResult.rows[0]?.total || '0');

    return {
      totalUsers: usersCount,
      totalPosts: postsCount,
      totalComments: commentsCount,
      newUsersToday: 0,
      activeUsers: usersCount,
      vipUsers: 0,
    };
  } catch (error: any) {
    console.error('获取运营概览失败:', error.message);
    return {
      totalUsers: 0,
      totalPosts: 0,
      totalComments: 0,
      newUsersToday: 0,
      activeUsers: 0,
      vipUsers: 0,
    };
  }
};

// 获取内容统计
export const getContentStats = async () => {
  try {
    const result = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM posts) as total_posts,
        (SELECT COUNT(*) FROM comments) as total_comments,
        (SELECT COUNT(*) FROM likes) as total_likes`
    );

    const row = result.rows[0] || {};
    return {
      totalPosts: parseInt(row.total_posts || '0'),
      totalComments: parseInt(row.total_comments || '0'),
      totalLikes: parseInt(row.total_likes || '0'),
      postsToday: 0,
      commentsToday: 0,
    };
  } catch (error: any) {
    console.error('获取内容统计失败:', error.message);
    return {
      totalPosts: 0,
      totalComments: 0,
      totalLikes: 0,
      postsToday: 0,
      commentsToday: 0,
    };
  }
};
