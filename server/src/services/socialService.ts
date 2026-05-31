import { Pool } from 'pg';
import { loadEnv, getDbUrl } from 'coze-coding-dev-sdk';

// 延迟初始化
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    loadEnv();
    const dbUrl = getDbUrl();
    pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

// 关注/取消关注
export async function toggleFollow(followerId: number, followingId: number) {
  const p = getPool();
  
  if (followerId === followingId) {
    throw new Error('不能关注自己');
  }
  
  const existing = await p.query(
    'SELECT * FROM follows WHERE follower_id = $1 AND following_id = $2',
    [followerId, followingId]
  );
  
  if (existing.rows.length > 0) {
    await p.query('DELETE FROM follows WHERE follower_id = $1 AND following_id = $2', [followerId, followingId]);
    return false;
  } else {
    await p.query(
      'INSERT INTO follows (follower_id, following_id, created_at) VALUES ($1, $2, NOW())',
      [followerId, followingId]
    );
    return true;
  }
}

// 获取粉丝列表
export async function getFollowers(userId: number, page = 1, pageSize = 20) {
  const p = getPool();
  const offset = (page - 1) * pageSize;
  const result = await p.query(`
    SELECT u.id, u.nickname, u.avatar_url, u.bio, u.member_level,
           EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = u.id) as is_following
    FROM users u
    JOIN follows f ON u.id = f.follower_id
    WHERE f.following_id = $2
    ORDER BY f.created_at DESC
    LIMIT $3 OFFSET $4
  `, [userId, userId, pageSize, offset]);
  return result.rows;
}

// 获取关注列表
export async function getFollowings(userId: number, page = 1, pageSize = 20) {
  const p = getPool();
  const offset = (page - 1) * pageSize;
  const result = await p.query(`
    SELECT u.id, u.nickname, u.avatar_url, u.bio, u.member_level,
           EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = u.id) as is_following
    FROM users u
    JOIN follows f ON u.id = f.following_id
    WHERE f.follower_id = $2
    ORDER BY f.created_at DESC
    LIMIT $3 OFFSET $4
  `, [userId, userId, pageSize, offset]);
  return result.rows;
}

// 检查是否关注
export async function isFollowing(followerId: number, followingId: number) {
  const p = getPool();
  const result = await p.query(
    'SELECT * FROM follows WHERE follower_id = $1 AND following_id = $2',
    [followerId, followingId]
  );
  return result.rows.length > 0;
}

// 获取会话列表
export async function getConversations(userId: number, page = 1, pageSize = 20) {
  const p = getPool();
  const offset = (page - 1) * pageSize;
  const result = await p.query(`
    WITH latest_messages AS (
      SELECT DISTINCT ON (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id))
             *,
             CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END as other_user_id
      FROM messages
      WHERE sender_id = $1 OR receiver_id = $1
      ORDER BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), created_at DESC
    )
    SELECT lm.*, u.nickname as other_user_nickname, u.avatar_url as other_user_avatar
    FROM latest_messages lm
    JOIN users u ON lm.other_user_id = u.id
    ORDER BY lm.created_at DESC
    LIMIT $2 OFFSET $3
  `, [userId, pageSize, offset]);
  return result.rows;
}

// 获取消息列表
export async function getMessages(userId: number, otherUserId: number, page = 1, pageSize = 50) {
  const p = getPool();
  const offset = (page - 1) * pageSize;
  const result = await p.query(`
    SELECT m.*, u.nickname as sender_nickname, u.avatar_url as sender_avatar
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE (m.sender_id = $1 AND m.receiver_id = $2) OR (m.sender_id = $2 AND m.receiver_id = $1)
    ORDER BY m.created_at DESC
    LIMIT $3 OFFSET $4
  `, [userId, otherUserId, pageSize, offset]);
  return result.rows;
}

// 发送消息
export async function sendMessage(senderId: number, receiverId: number, content: string) {
  const p = getPool();
  const result = await p.query(`
    INSERT INTO messages (sender_id, receiver_id, content, created_at)
    VALUES ($1, $2, $3, NOW())
    RETURNING *
  `, [senderId, receiverId, content]);
  return result.rows[0];
}

// 获取未读消息数
export async function getUnreadCount(userId: number) {
  const p = getPool();
  const result = await p.query(
    'SELECT COUNT(*) as count FROM messages WHERE receiver_id = $1 AND is_read = false',
    [userId]
  );
  return parseInt(result.rows[0].count);
}
