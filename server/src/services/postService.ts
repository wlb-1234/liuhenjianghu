import { Pool } from 'pg';

// 延迟初始化
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL not configured');
    }
    pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

// 获取帖子列表
export async function getPosts(options: {
  region_code?: string;
  userId?: number;
  page?: number;
  pageSize?: number;
}) {
  const p = getPool();
  const { region_code, userId, page = 1, pageSize = 20 } = options;
  const offset = (page - 1) * pageSize;
  
  let query = `
    SELECT p.*, u.nickname as author_nickname, u.avatar as author_avatar
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.status = 1 AND p.expire_at > NOW()
  `;
  
  const params: any[] = [];
  let idx = 1;
  
  if (region_code) {
    query += ` AND p.region_code = $${idx++}`;
    params.push(region_code);
  }
  
  if (userId) {
    query += ` AND p.user_id = $${idx++}`;
    params.push(userId);
  }
  
  query += ` ORDER BY p.is_pinned DESC, p.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(pageSize, offset);
  
  const result = await p.query(query, params);
  return { posts: result.rows };
}

// 获取单个帖子
export async function getPostById(postId: number) {
  const p = getPool();
  const result = await p.query(`
    SELECT p.*, u.nickname as author_nickname, u.avatar as author_avatar
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = $1
  `, [postId]);
  return result.rows[0];
}

// 创建帖子 - 带区域权限检查
export async function createPost(data: {
  userId: number;
  region_code: string;
  region_level: number;
  content: string;
  images?: any[];
}) {
  const p = getPool();
  
  // 获取用户信息及区域
  const userResult = await p.query(`
    SELECT u.*, ml.level as member_level, ml.region_limit
    FROM users u
    LEFT JOIN member_levels ml ON u.level = ml.level
    WHERE u.id = $1
  `, [data.userId]);
  
  if (userResult.rows.length === 0) {
    throw new Error('用户不存在');
  }
  
  const user = userResult.rows[0];
  const regionLimit = user.region_limit || 1;
  
  // region_level: 1=镇, 2=县, 3=市, 4=省
  if (data.region_level > regionLimit) {
    throw new Error(`您的会员等级(可访问${regionLimit}级区域)无法在此区域(${data.region_level}级)发帖`);
  }
  
  // 计算过期时间
  const expireAt = new Date();
  expireAt.setHours(expireAt.getHours() + 24);
  
  const result = await p.query(`
    INSERT INTO posts (user_id, content, images, region_code, region_level, status, expire_at, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, 1, $6, NOW(), NOW())
    RETURNING *
  `, [data.userId, data.content, JSON.stringify(data.images || []), data.region_code, data.region_level, expireAt]);
  
  // 更新用户发帖计数
  await p.query(`
    UPDATE users SET total_posts = total_posts + 1, today_post_count = today_post_count + 1, last_post_date = CURRENT_DATE
    WHERE id = $1
  `, [data.userId]);
  
  return result.rows[0];
}

// 点赞/取消点赞
export async function toggleLike(userId: number, postId: number) {
  const p = getPool();
  
  // 检查是否已点赞
  const existing = await p.query(
    'SELECT id FROM likes WHERE user_id = $1 AND post_id = $2',
    [userId, postId]
  );
  
  if (existing.rows.length > 0) {
    // 取消点赞
    await p.query('DELETE FROM likes WHERE user_id = $1 AND post_id = $2', [userId, postId]);
    await p.query('UPDATE posts SET like_count = like_count - 1 WHERE id = $1', [postId]);
    return false;
  } else {
    // 添加点赞
    await p.query('INSERT INTO likes (user_id, post_id) VALUES ($1, $2)', [userId, postId]);
    await p.query('UPDATE posts SET like_count = like_count + 1 WHERE id = $1', [postId]);
    return true;
  }
}

// 检查是否点赞
export async function isLiked(userId: number, postId: number) {
  const p = getPool();
  const result = await p.query(
    'SELECT id FROM likes WHERE user_id = $1 AND post_id = $2',
    [userId, postId]
  );
  return result.rows.length > 0;
}

// 获取评论
export async function getComments(postId: number) {
  const p = getPool();
  const result = await p.query(`
    SELECT c.*, u.nickname as author_nickname, u.avatar as author_avatar
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = $1 AND c.status = 1
    ORDER BY c.created_at ASC
  `, [postId]);
  return result.rows;
}

// 创建评论
export async function createComment(data: {
  postId: number;
  userId: number;
  content: string;
  parentId?: number;
}) {
  const p = getPool();
  const result = await p.query(`
    INSERT INTO comments (post_id, user_id, content, parent_id, created_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING *
  `, [data.postId, data.userId, data.content, data.parentId || null]);
  
  // 更新评论计数
  await p.query('UPDATE posts SET comment_count = comment_count + 1 WHERE id = $1', [data.postId]);
  
  return result.rows[0];
}

// 创建举报
export async function createReport(data: {
  postId?: number;
  commentId?: number;
  userId: number;
  reason: string;
}) {
  const p = getPool();
  const result = await p.query(`
    INSERT INTO reports (post_id, comment_id, user_id, reason, created_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING *
  `, [data.postId || null, data.commentId || null, data.userId, data.reason]);
  return result.rows[0];
}

// 删除帖子
export async function deletePost(postId: number) {
  const p = getPool();
  await p.query('DELETE FROM likes WHERE post_id = $1', [postId]);
  await p.query('DELETE FROM comments WHERE post_id = $1', [postId]);
  await p.query('DELETE FROM posts WHERE id = $1', [postId]);
}
