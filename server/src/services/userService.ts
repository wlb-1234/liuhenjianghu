import { Pool } from 'pg';
import { loadEnv, getDbUrl } from 'coze-coding-dev-sdk';

// 加载环境变量
loadEnv();
const dbUrl = getDbUrl();

// 创建连接池
const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

// 测试连接
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

// 用户相关操作
export async function getUserByPhone(phone: string) {
  const { rows } = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
  return rows[0] || null;
}

export async function getUserById(id: number) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function createUser(userData: {
  phone: string;
  nickname: string;
  password_hash: string;
  province_code?: string;
  city_code?: string;
  district_code?: string;
  town_code?: string;
}) {
  const { rows } = await pool.query(
    `INSERT INTO users (phone, nickname, password_hash, province_code, city_code, district_code, town_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userData.phone, userData.nickname, userData.password_hash, 
     userData.province_code || null, userData.city_code || null,
     userData.district_code || null, userData.town_code || null]
  );
  return rows[0];
}

export async function updateUser(id: number, updates: Record<string, any>) {
  const keys = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
  
  const { rows } = await pool.query(
    `UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return rows[0];
}

// 留言相关操作
export async function createPost(postData: {
  user_id: number;
  content: string;
  images?: string[];
  region_code: string;
  region_level: number;
  expire_at: string;
}) {
  const { rows } = await pool.query(
    `INSERT INTO posts (user_id, content, images, region_code, region_level, expire_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [postData.user_id, postData.content, JSON.stringify(postData.images || []),
     postData.region_code, postData.region_level, postData.expire_at]
  );
  
  // 获取用户信息
  const user = await getUserById(postData.user_id);
  return { ...rows[0], users: { nickname: user.nickname, avatar: user.avatar } };
}

export async function getPosts(params: {
  region_code?: string;
  page?: number;
  limit?: number;
}) {
  const { region_code, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;
  
  let query = 'SELECT * FROM posts WHERE status = 1';
  const values: any[] = [];
  
  if (region_code) {
    query += ` AND (region_code LIKE $1 OR region_level = 1)`;
    values.push(`${region_code}%`);
  }
  
  query += ` ORDER BY is_pinned DESC, created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  values.push(limit, offset);
  
  const { rows } = await pool.query(query, values);
  
  // 获取用户信息
  const postsWithUsers = await Promise.all(
    rows.map(async (row) => {
      const user = await getUserById(row.user_id);
      return { ...row, users: { nickname: user?.nickname, avatar: user?.avatar } };
    })
  );
  
  return { posts: postsWithUsers, total: rows.length };
}

export async function getPostById(id: number) {
  const { rows } = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
  if (!rows[0]) return null;
  
  const user = await getUserById(rows[0].user_id);
  return { ...rows[0], users: { nickname: user?.nickname, avatar: user?.avatar } };
}

// 点赞操作
export async function toggleLike(userId: number, postId: number) {
  const { rows: existing } = await pool.query(
    'SELECT id FROM likes WHERE user_id = $1 AND post_id = $2',
    [userId, postId]
  );
  
  if (existing.length > 0) {
    await pool.query('DELETE FROM likes WHERE user_id = $1 AND post_id = $2', [userId, postId]);
    await pool.query('UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1', [postId]);
    return { liked: false };
  } else {
    await pool.query('INSERT INTO likes (user_id, post_id) VALUES ($1, $2)', [userId, postId]);
    await pool.query('UPDATE posts SET like_count = like_count + 1 WHERE id = $1', [postId]);
    return { liked: true };
  }
}

export async function isLiked(userId: number, postId: number) {
  const { rows } = await pool.query(
    'SELECT id FROM likes WHERE user_id = $1 AND post_id = $2',
    [userId, postId]
  );
  return rows.length > 0;
}

// 评论操作
export async function createComment(commentData: {
  post_id: number;
  user_id: number;
  content: string;
  parent_id?: number;
}) {
  const { rows } = await pool.query(
    `INSERT INTO comments (post_id, user_id, content, parent_id)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [commentData.post_id, commentData.user_id, commentData.content, commentData.parent_id || null]
  );
  
  await pool.query('UPDATE posts SET comment_count = comment_count + 1 WHERE id = $1', [commentData.post_id]);
  
  const user = await getUserById(commentData.user_id);
  return { ...rows[0], users: { nickname: user?.nickname, avatar: user?.avatar } };
}

export async function getComments(postId: number) {
  const { rows } = await pool.query(
    'SELECT * FROM comments WHERE post_id = $1 AND status = 1 ORDER BY created_at ASC',
    [postId]
  );
  
  const commentsWithUsers = await Promise.all(
    rows.map(async (row) => {
      const user = await getUserById(row.user_id);
      return { ...row, users: { nickname: user?.nickname, avatar: user?.avatar } };
    })
  );
  
  return commentsWithUsers;
}

// 关注操作
export async function toggleFollow(followerId: number, followingId: number) {
  const { rows: existing } = await pool.query(
    'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
    [followerId, followingId]
  );
  
  if (existing.length > 0) {
    await pool.query('DELETE FROM follows WHERE follower_id = $1 AND following_id = $2', [followerId, followingId]);
    return { followed: false };
  } else {
    await pool.query('INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)', [followerId, followingId]);
    return { followed: true };
  }
}

export async function getFollowers(userId: number) {
  const { rows } = await pool.query(
    'SELECT * FROM follows WHERE following_id = $1',
    [userId]
  );
  
  const followersWithUsers = await Promise.all(
    rows.map(async (row) => {
      const user = await getUserById(row.follower_id);
      return { ...row, users: { id: user?.id, nickname: user?.nickname, avatar: user?.avatar } };
    })
  );
  
  return followersWithUsers;
}

export async function getFollowings(userId: number) {
  const { rows } = await pool.query(
    'SELECT * FROM follows WHERE follower_id = $1',
    [userId]
  );
  
  const followingsWithUsers = await Promise.all(
    rows.map(async (row) => {
      const user = await getUserById(row.following_id);
      return { ...row, users: { id: user?.id, nickname: user?.nickname, avatar: user?.avatar } };
    })
  );
  
  return followingsWithUsers;
}

export async function isFollowing(followerId: number, followingId: number) {
  const { rows } = await pool.query(
    'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
    [followerId, followingId]
  );
  return rows.length > 0;
}

// 私信操作
export async function sendMessage(senderId: number, receiverId: number, content: string) {
  const { rows } = await pool.query(
    'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *',
    [senderId, receiverId, content]
  );
  return rows[0];
}

export async function getConversations(userId: number) {
  const { rows } = await pool.query(
    `SELECT * FROM messages WHERE sender_id = $1 OR receiver_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  
  const conversations = new Map<number, any>();
  for (const msg of rows) {
    const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
    if (!conversations.has(otherId)) {
      const otherUser = await getUserById(otherId);
      conversations.set(otherId, {
        user: { id: otherUser?.id, nickname: otherUser?.nickname, avatar: otherUser?.avatar },
        lastMessage: msg,
        unreadCount: 0
      });
    }
    if (msg.receiver_id === userId && !msg.is_read) {
      const conv = conversations.get(otherId);
      if (conv) conv.unreadCount++;
    }
  }
  
  return Array.from(conversations.values());
}

export async function getMessages(userId: number, otherUserId: number) {
  const { rows } = await pool.query(
    `SELECT * FROM messages 
     WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
     ORDER BY created_at ASC`,
    [userId, otherUserId]
  );
  
  await pool.query(
    'UPDATE messages SET is_read = true WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false',
    [userId, otherUserId]
  );
  
  const messagesWithSender = await Promise.all(
    rows.map(async (msg) => {
      const sender = await getUserById(msg.sender_id);
      return { ...msg, sender: { id: sender?.id, nickname: sender?.nickname, avatar: sender?.avatar } };
    })
  );
  
  return messagesWithSender;
}

export async function getUnreadCount(userId: number) {
  const { rows } = await pool.query(
    'SELECT COUNT(*) as count FROM messages WHERE receiver_id = $1 AND is_read = false',
    [userId]
  );
  return parseInt(rows[0].count);
}

// 举报操作
export async function createReport(reportData: {
  post_id?: number;
  user_id: number;
  reason: string;
}) {
  const { rows } = await pool.query(
    'INSERT INTO reports (post_id, user_id, reason) VALUES ($1, $2, $3) RETURNING *',
    [reportData.post_id || null, reportData.user_id, reportData.reason]
  );
  return rows[0];
}

// 关闭连接池
export async function closePool() {
  await pool.end();
}
