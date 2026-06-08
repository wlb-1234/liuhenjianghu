// 用户统计服务
import { supabase } from './supabase';

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
  lastActiveTime: string;
  createdAt: string;
}

// 获取用户统计
export const getUserStats = async (userId: string): Promise<UserStats | null> => {
  try {
    // 获取用户基本信息
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) return null;

    // 获取用户发帖数
    const { count: postCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('userId', userId);

    // 获取用户评论数
    const { count: commentCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('userId', userId);

    // 获取用户获赞数（所有帖子的点赞总和）
    const { data: posts } = await supabase
      .from('posts')
      .select('likeCount')
      .eq('userId', userId);
    const likeCount = posts?.reduce((sum, p) => sum + (p.likeCount || 0), 0) || 0;

    // 获取粉丝数
    const { count: followerCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('followingId', userId);

    // 获取关注数
    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('followerId', userId);

    // 计算活跃天数
    const { data: activities } = await supabase
      .from('activities')
      .select('date')
      .eq('userId', userId);
    
    const uniqueDays = new Set(activities?.map(a => a.date));
    const activeDays = uniqueDays.size;

    // 获取 VIP 状态
    const { data: vipData } = await supabase
      .from('user_vips')
      .select('*')
      .eq('userId', userId)
      .single();

    const exp = (postCount || 0) * 10 + (commentCount || 0) * 2 + (likeCount || 0) * 1;
    const level = getUserLevel(exp);

    return {
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      exp,
      level,
      postCount: postCount || 0,
      commentCount: commentCount || 0,
      likeCount,
      followerCount: followerCount || 0,
      followingCount: followingCount || 0,
      vipStatus: vipData?.status === 'active',
      vipExpireTime: vipData?.expireTime,
      activeDays,
      lastActiveTime: user.lastActiveTime || user.createdAt,
      createdAt: user.createdAt,
    };
  } catch (error) {
    console.error('获取用户统计失败:', error);
    return null;
  }
};

// 获取用户排行榜
export const getUserLeaderboard = async (type: 'exp' | 'posts' | 'likes' | 'followers' = 'exp', limit: number = 10) => {
  try {
    const { data: users } = await supabase
      .from('users')
      .select('id, username, avatar, exp, createdAt')
      .order('exp', { ascending: false })
      .limit(100);

    if (!users) return [];

    // 获取每个用户的详细统计
    const leaderboard = await Promise.all(
      users.slice(0, limit * 2).map(async (user) => {
        const stats = await getUserStats(user.id);
        return stats ? {
          userId: user.id,
          username: user.username,
          avatar: user.avatar,
          exp: stats.exp,
          level: stats.level,
          postCount: stats.postCount,
          likeCount: stats.likeCount,
          followerCount: stats.followerCount,
        } : null;
      })
    );

    const validStats = leaderboard.filter(Boolean);

    // 按类型排序
    switch (type) {
      case 'posts':
        return validStats.sort((a, b) => b!.postCount - a!.postCount).slice(0, limit);
      case 'likes':
        return validStats.sort((a, b) => b!.likeCount - a!.likeCount).slice(0, limit);
      case 'followers':
        return validStats.sort((a, b) => b!.followerCount - a!.followerCount).slice(0, limit);
      default:
        return validStats.sort((a, b) => b!.exp - a!.exp).slice(0, limit);
    }
  } catch (error) {
    console.error('获取排行榜失败:', error);
    return [];
  }
};

// 获取运营数据概览
export const getOperationStats = async () => {
  try {
    // 总用户数
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // 今日新增用户
    const today = new Date().toISOString().split('T')[0];
    const { count: todayUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('createdAt', today);

    // 活跃用户数（最近7天有活动的）
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('lastActiveTime', sevenDaysAgo);

    // 总帖子数
    const { count: totalPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    // 今日发帖数
    const { count: todayPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('createdAt', today);

    // 总评论数
    const { count: totalComments } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true });

    // 总点赞数
    const { data: posts } = await supabase
      .from('posts')
      .select('likeCount');
    const totalLikes = posts?.reduce((sum, p) => sum + (p.likeCount || 0), 0) || 0;

    // VIP 用户数
    const { count: vipUsers } = await supabase
      .from('user_vips')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    return {
      users: {
        total: totalUsers || 0,
        today: todayUsers || 0,
        active: activeUsers || 0,
      },
      content: {
        posts: totalPosts || 0,
        todayPosts: todayPosts || 0,
        comments: totalComments || 0,
        likes: totalLikes,
      },
      vip: {
        total: vipUsers || 0,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('获取运营数据失败:', error);
    return null;
  }
};
