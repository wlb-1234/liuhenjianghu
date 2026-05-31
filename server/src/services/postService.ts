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

// 获取帖子列表
export async function getPosts(options: {
  regionId?: number;
  userId?: number;
  page?: number;
  pageSize?: number;
  sortBy?: 'latest' | 'hot';
}) {
  const p = getPool();
  const { regionId, userId, page = 1, pageSize = 20, sortBy = 'latest' } = options;
  const offset = (page - 1) * pageSize;
  
  let query = `
    SELECT p.*, u.nickname as author_nickname, u.avatar_url as author_avatar,
           r.name as region_name,
           (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
           (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN regions r ON p.region_id = r.id
    WHERE p.status = 'published'
  `;
  
  const params: any[] = [];
  let idx = 1;
  
  if (regionId) {
    query += ` AND p.region_id = $${idx++}`;
    params.push(regionId);
  }
  
  if (userId) {
    query += ` AND p.user_id = $${idx++}`;
    params.push(userId);
  }
  
  if (sortBy === 'latest') {
    query += ' ORDER BY p.created_at DESC';
  } else {
    query += ' ORDER BY like_count DESC, p.created_at DESC';
  }
  
  query += ` LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(pageSize, offset);
  
  const result = await p.query(query, params);
  return result.rows;
}

// 获取单个帖子
export async function getPostById(postId: number) {
  const p = getPool();
  const result = await p.query(`
    SELECT p.*, u.nickname as author_nickname, u.avatar_url as author_avatar,
           r.name as region_name,
           (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
           (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN regions r ON p.region_id = r.id
    WHERE p.id = $1
  `, [postId]);
  return result.rows[0];
}

// 创建帖子
export async function createPost(data: {
  userId: number;
  regionId?: number;
  title?: string;
  content: string;
  images?: string[];
  tags?: string[];
}) {
  const p = getPool();
  const result = await p.query(`
    INSERT INTO posts (user_id, region_id, title, content, images, tags, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, 'published', NOW(), NOW())
    RETURNING *
  `, [data.userId, data.regionId, data.title, data.content, data.images || [], data.tags || []]);
  return result.rows[0];
}

// 点赞/取消点赞
export async function toggleLike(userId: number, postId: number) {
  const p = getPool();
  
  // 检查是否已点赞
  const existing = await p.query(
    'SELECT * FROM likes WHERE user_id = $1 AND post_id = $2',
    [userId, postId]
  );
  
  if (existing.rows.length > 0) {
    // 取消点赞
    await p.query('DELETE FROM likes WHERE user_id = $1 AND post_id = $2', [userId, postId]);
    return false;
  } else {
    // 添加点赞
    await p.query(
      'INSERT INTO likes (user_id, post_id, created_at) VALUES ($1, $2, NOW())',
      [userId, postId]
    );
    return true;
  }
}

// 检查是否点赞
export async function isLiked(userId: number, postId: number) {
  const p = getPool();
  const result = await p.query(
    'SELECT * FROM likes WHERE user_id = $1 AND post_id = $2',
    [userId, postId]
  );
  return result.rows.length > 0;
}

// 获取评论列表
export async function getComments(postId: number, page = 1, pageSize = 20) {
  const p = getPool();
  const offset = (page - 1) * pageSize;
  const result = await p.query(`
    SELECT c.*, u.nickname as author_nickname, u.avatar_url as author_avatar
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = $1 AND c.parent_id IS NULL
    ORDER BY c.created_at DESC
    LIMIT $2 OFFSET $3
  `, [postId, pageSize, offset]);
  return result.rows;
}

// 创建评论
export async function createComment(data: {
  userId: number;
  postId: number;
  parentId?: number;
  content: string;
}) {
  const p = getPool();
  const result = await p.query(`
    INSERT INTO comments (user_id, post_id, parent_id, content, created_at, updated_at)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
    RETURNING *
  `, [data.userId, data.postId, data.parentId || null, data.content]);
  return result.rows[0];
}

// 创建举报
export async function createReport(data: {
  userId: number;
  targetType: 'post' | 'comment';
  targetId: number;
  reason: string;
  description?: string;
}) {
  const p = getPool();
  const result = await p.query(`
    INSERT INTO reports (user_id, target_type, target_id, reason, description, status, created_at)
    VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
    RETURNING *
  `, [data.userId, data.targetType, data.targetId, data.reason, data.description || '']);
  return result.rows[0];
}
