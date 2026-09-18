import { getPool } from '../config/database';

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
    SELECT u.id, u.nickname, u.avatar, u.member_level,
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
    SELECT u.id, u.nickname, u.avatar, u.member_level,
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

// ============ 好友相关 ============

// 发送好友申请（若已双向确认则直接成为好友）
export async function addFriend(fromUserId: number, toUserId: number) {
  const p = getPool();
  if (fromUserId === toUserId) {
    throw new Error('不能添加自己为好友');
  }
  // 检查是否已是好友
  const existing = await p.query(
    `SELECT * FROM friends
     WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
    [fromUserId, toUserId]
  );
  if (existing.rows.length > 0) {
    const row = existing.rows[0];
    if (row.status === 1) {
      throw new Error('你们已经是好友');
    }
    // 存在待处理申请：若对方申请过，则此操作即确认
    await p.query(
      'UPDATE friends SET status = 1 WHERE id = $1',
      [row.id]
    );
    return { success: true, status: 1, message: '好友添加成功' };
  }
  // 新建申请（status 0 = 待确认）
  const result = await p.query(
    'INSERT INTO friends (user_id, friend_id, status, created_at) VALUES ($1, $2, 0, NOW()) RETURNING *',
    [fromUserId, toUserId]
  );
  return { success: true, status: 0, message: '好友申请已发送', record: result.rows[0] };
}

// 接受好友申请
export async function acceptFriend(ownerId: number, applicantId: number) {
  const p = getPool();
  const existing = await p.query(
    `SELECT * FROM friends
     WHERE user_id = $1 AND friend_id = $2`,
    [applicantId, ownerId]
  );
  if (existing.rows.length === 0) {
    throw new Error('没有找到该好友申请');
  }
  const row = existing.rows[0];
  if (row.status === 1) {
    return { success: true, status: 1, message: '你们已经是好友' };
  }
  await p.query('UPDATE friends SET status = 1, updated_at = NOW() WHERE id = $1', [row.id]);
  return { success: true, status: 1, message: '已接受好友申请' };
}

// 删除好友
export async function removeFriend(userId: number, friendUserId: number) {
  const p = getPool();
  await p.query(
    `DELETE FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
    [userId, friendUserId]
  );
  return { success: true };
}

// 获取已通过的好友列表（status=1），含未读消息数与最后一条消息
export async function getFriendList(userId: number, page = 1, pageSize = 50) {
  const p = getPool();
  const offset = (page - 1) * pageSize;
  const result = await p.query(
    `SELECT f.id,
            CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END AS user_id,
            u.nickname, u.avatar, u.member_level,
            f.created_at AS friend_since,
            (SELECT COUNT(*) FROM messages m
              WHERE m.sender_id = (CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END)
                AND m.receiver_id = $1 AND m.is_read = false) AS unread_count,
            (SELECT m.content FROM messages m
              WHERE (m.sender_id = $1 AND m.receiver_id = (CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END))
                 OR (m.sender_id = (CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END) AND m.receiver_id = $1)
              ORDER BY m.created_at DESC LIMIT 1) AS last_message,
            (SELECT m.created_at FROM messages m
              WHERE (m.sender_id = $1 AND m.receiver_id = (CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END))
                 OR (m.sender_id = (CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END) AND m.receiver_id = $1)
              ORDER BY m.created_at DESC LIMIT 1) AS last_message_at
     FROM friends f
     JOIN users u ON u.id = (CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END)
     WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 1
     ORDER BY last_message_at DESC NULLS LAST, f.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, pageSize, offset]
  );
  return result.rows;
}

// 获取待处理的好友申请（别人发给我的）
export async function getFriendRequests(userId: number) {
  const p = getPool();
  const result = await p.query(
    `SELECT f.id, f.user_id AS applicant_id, u.nickname, u.avatar, f.created_at
     FROM friends f
     JOIN users u ON u.id = f.user_id
     WHERE f.friend_id = $1 AND f.status = 0
     ORDER BY f.created_at DESC`,
    [userId]
  );
  return result.rows;
}

// ============ 会话与消息 ============

// 获取会话列表（兼容聊天Tab与社交Tab两种前端字段期望）
export async function getConversations(userId: number, page = 1, pageSize = 50) {
  const p = getPool();
  const offset = (page - 1) * pageSize;
  const result = await p.query(
    `WITH latest_messages AS (
       SELECT DISTINCT ON (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id))
              *,
              CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END as other_id
       FROM messages
       WHERE sender_id = $1 OR receiver_id = $1
       ORDER BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), created_at DESC
     ),
     unread_counts AS (
       SELECT sender_id, receiver_id, COUNT(*) AS unread_count
       FROM messages
       WHERE receiver_id = $1 AND is_read = false
       GROUP BY sender_id, receiver_id
     )
     SELECT lm.*, lm.other_id,
            u.nickname, u.avatar, u.member_level,
            COALESCE(uc.unread_count, 0) AS unread_count,
            (uc.unread_count IS NULL OR uc.unread_count = 0) as is_read
     FROM latest_messages lm
     JOIN users u ON u.id = lm.other_id
     LEFT JOIN unread_counts uc ON uc.sender_id = lm.other_id AND uc.receiver_id = $1
     ORDER BY lm.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, pageSize, offset]
  );
  // 同时补全聊天Tab需要的 camelCase 字段
  return result.rows.map((r: any) => ({
    id: r.other_id,
    userId: r.other_id,
    other_id: r.other_id,
    nickname: r.nickname,
    avatar: r.avatar,
    member_level: r.member_level,
    updatedAt: r.created_at,
    created_at: r.created_at,
    last_message: r.content,
    last_message_at: r.created_at,
    latestMessage: r.content ? { content: r.content, createdAt: r.created_at } : null,
    unreadCount: Number(r.unread_count || 0),
    unread_count: Number(r.unread_count || 0),
    is_read: !!r.is_read,
    content: r.content || '',
  }));
}

// 获取消息列表
export async function getMessages(userId: number, otherUserId: number, page = 1, pageSize = 50) {
  const p = getPool();
  const offset = (page - 1) * pageSize;
  const result = await p.query(
    `SELECT m.id, m.sender_id, m.receiver_id, m.content, m.created_at, m.is_read
     FROM messages m
     WHERE (m.sender_id = $1 AND m.receiver_id = $2) OR (m.sender_id = $2 AND m.receiver_id = $1)
     ORDER BY m.created_at DESC
     LIMIT $3 OFFSET $4`,
    [userId, otherUserId, pageSize, offset]
  );
  return result.rows
    .map((m: any) => ({
      id: m.id,
      content: m.content,
      sender_id: m.sender_id,
      receiver_id: m.receiver_id,
      created_at: m.created_at,
      is_read: m.is_read,
      senderId: m.sender_id,
      receiverId: m.receiver_id,
      createdAt: m.created_at,
      isRead: m.is_read,
      type: 'text',
    }))
    .reverse();
}

// 发送消息
export async function sendMessage(senderId: number, receiverId: number, content: string) {
  const p = getPool();
  if (senderId === receiverId) {
    throw new Error('不能给自己发消息');
  }
  const result = await p.query(
    `INSERT INTO messages (sender_id, receiver_id, content, created_at)
     VALUES ($1, $2, $3, NOW())
     RETURNING id, sender_id, receiver_id, content, created_at, is_read`,
    [senderId, receiverId, content]
  );
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

// 标记与某用户的消息为已读
export async function markMessagesRead(userId: number, otherUserId: number) {
  const p = getPool();
  await p.query(
    'UPDATE messages SET is_read = true WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false',
    [userId, otherUserId]
  );
  return true;
}

// 取消关注
export async function unfollow(followerId: number, followingId: number) {
  const p = getPool();
  await p.query(
    'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
    [followerId, followingId]
  );
  return true;
}