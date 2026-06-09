import { getPool } from '../config/database';

interface UserRecord {
  id: number;
  phone: string;
  nickname: string;
  avatar: string | null;
  exp: number;
  member_level: number;
  password: string | null;
  created_at: Date;
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
  const pool = await getPool();
  if (!pool) return null;

  const result = await pool.query<UserRecord>(
    'SELECT id, phone, nickname, avatar, exp, member_level FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) return null;

  const user = result.rows[0];

  // 获取帖子数量
  const postCountResult = await pool.query(
    'SELECT COUNT(*) as count FROM posts WHERE user_id = $1',
    [userId]
  );

  // 获取评论数量
  const commentCountResult = await pool.query(
    'SELECT COUNT(*) as count FROM comments WHERE user_id = $1',
    [userId]
  );

  const postCount = parseInt(postCountResult.rows[0]?.count || '0');
  const commentCount = parseInt(commentCountResult.rows[0]?.count || '0');

  return {
    userId: user.id.toString(),
    username: user.nickname || user.phone,
    avatar: user.avatar || undefined,
    exp: user.exp || 0,
    level: getUserLevel(user.exp || 0),
    postCount,
    commentCount,
    likeCount: 0,
    followerCount: 0,
    followingCount: 0,
    vipStatus: user.member_level > 0,
    activeDays: 1,
  };
};

// 获取排行榜
export const getUserLeaderboard = async (type: string = 'exp', limit: number = 20): Promise<any[]> => {
  const pool = await getPool();
  if (!pool) return [];

  let orderBy = 'exp DESC';
  if (type === 'posts') orderBy = 'post_count DESC';
  if (type === 'logins') orderBy = 'last_login DESC';

  const result = await pool.query(
    `SELECT id, phone, nickname, avatar, exp, member_level, created_at 
     FROM users ORDER BY ${orderBy} LIMIT $1`,
    [limit]
  );

  return result.rows.map((user, index) => ({
    rank: index + 1,
    userId: user.id,
    username: user.nickname || user.phone,
    avatar: user.avatar,
    exp: user.exp || 0,
    level: getUserLevel(user.exp || 0),
    memberLevel: user.member_level,
  }));
};

// 获取运营统计
export const getOperationStats = async () => {
  const pool = await getPool();
  if (!pool) {
    return {
      totalUsers: 0,
      totalPosts: 0,
      totalComments: 0,
      activeUsers: 0,
      todayNewUsers: 0,
      todayNewPosts: 0,
    };
  }

  try {
    const [
      userCountResult,
      postCountResult,
      commentCountResult,
      todayResult,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM posts'),
      pool.query('SELECT COUNT(*) as count FROM comments'),
      pool.query("SELECT COUNT(*) as count FROM users WHERE created_at >= CURRENT_DATE"),
    ]);

    return {
      totalUsers: parseInt(userCountResult.rows[0]?.count || '0'),
      totalPosts: parseInt(postCountResult.rows[0]?.count || '0'),
      totalComments: parseInt(commentCountResult.rows[0]?.count || '0'),
      activeUsers: parseInt(userCountResult.rows[0]?.count || '0'),
      todayNewUsers: parseInt(todayResult.rows[0]?.count || '0'),
      todayNewPosts: 0,
    };
  } catch (error) {
    console.error('获取运营统计失败:', error);
    return {
      totalUsers: 0,
      totalPosts: 0,
      totalComments: 0,
      activeUsers: 0,
      todayNewUsers: 0,
      todayNewPosts: 0,
    };
  }
};
