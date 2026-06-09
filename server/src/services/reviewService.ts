/**
 * 审核服务
 * 处理内容审核队列
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.COZE_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';

// 直接使用 pg 连接（Railway 兼容）
import pg from 'pg';
const { Pool } = pg;

const pgConfig = {
  host: '13.114.6.6',
  port: 5432,
  database: 'postgres',
  user: 'postgres.hmlqsbhbbclbzfuutrie',
  password: 'Liuhen2026App',
  ssl: false,
};

let pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool(pgConfig);
  }
  return pool;
}

export interface ReviewItem {
  id: number;
  type: 'post' | 'comment' | 'report';
  target_id: number;
  content: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: number;
  reported_by: number | null;
  reported_user_id: number | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: number | null;
}

export interface ReviewStats {
  pending: number;
  approved_today: number;
  rejected_today: number;
}

/**
 * 获取审核队列
 */
export async function getReviewQueue(
  page: number = 1,
  limit: number = 20,
  status?: string,
  type?: string
): Promise<{ items: ReviewItem[]; total: number }> {
  const p = getPool();
  const offset = (page - 1) * limit;

  let query = `
    SELECT id, type, target_id, content, reason, status, priority,
           reported_by, reported_user_id, created_at, reviewed_at, reviewed_by
    FROM review_queue
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramIndex = 1;

  if (status) {
    query += ` AND status = $${paramIndex++}`;
    params.push(status);
  }

  if (type) {
    query += ` AND type = $${paramIndex++}`;
    params.push(type);
  }

  query += ` ORDER BY 
    CASE WHEN status = 'pending' THEN 0 ELSE 1 END,
    priority DESC,
    created_at DESC
  LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const countQuery = query.replace(/SELECT id.*FROM/, 'SELECT COUNT(*) FROM').replace(/ORDER BY.*/, '').replace(/LIMIT.*/, '');
  let total = 0;
  try {
    const countResult = await p.query(countQuery, params.slice(0, -2));
    total = parseInt(countResult.rows[0]?.count || '0');
  } catch (e) {
    console.log('Count query failed, continuing without total');
  }

  const result = await p.query(query, params);
  return { items: result.rows, total };
}

/**
 * 获取审核统计
 */
export async function getReviewStats(): Promise<ReviewStats> {
  const p = getPool();

  const today = new Date().toISOString().split('T')[0];

  const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
    p.query("SELECT COUNT(*) FROM review_queue WHERE status = 'pending'"),
    p.query("SELECT COUNT(*) FROM review_queue WHERE status = 'approved' AND DATE(reviewed_at) = $1", [today]),
    p.query("SELECT COUNT(*) FROM review_queue WHERE status = 'rejected' AND DATE(reviewed_at) = $1", [today]),
  ]);

  return {
    pending: parseInt(pendingRes.rows[0]?.count || '0'),
    approved_today: parseInt(approvedRes.rows[0]?.count || '0'),
    rejected_today: parseInt(rejectedRes.rows[0]?.count || '0'),
  };
}

/**
 * 审核通过
 */
export async function approveItem(
  id: number,
  reviewerId: number
): Promise<{ success: boolean; message: string }> {
  const p = getPool();

  // 获取待审核项
  const itemResult = await p.query(
    'SELECT * FROM review_queue WHERE id = $1 AND status = $2',
    [id, 'pending']
  );

  if (itemResult.rows.length === 0) {
    return { success: false, message: '审核项不存在或已处理' };
  }

  const item = itemResult.rows[0];

  // 根据类型处理
  if (item.type === 'post') {
    // 通过帖子
    await p.query(
      'UPDATE posts SET is_approved = true WHERE id = $1',
      [item.target_id]
    );
  } else if (item.type === 'comment') {
    // 通过评论
    await p.query(
      'UPDATE comments SET is_approved = true WHERE id = $1',
      [item.target_id]
    );
  } else if (item.type === 'report') {
    // 处理举报 - 封禁目标用户
    if (item.reported_user_id) {
      await p.query(
        'UPDATE users SET status = $1 WHERE id = $2',
        ['banned', item.reported_user_id]
      );
    }
  }

  // 更新审核状态
  await p.query(
    'UPDATE review_queue SET status = $1, reviewed_at = NOW(), reviewed_by = $2 WHERE id = $3',
    ['approved', reviewerId, id]
  );

  return { success: true, message: '审核通过' };
}

/**
 * 审核拒绝
 */
export async function rejectItem(
  id: number,
  reviewerId: number
): Promise<{ success: boolean; message: string }> {
  const p = getPool();

  const itemResult = await p.query(
    'SELECT * FROM review_queue WHERE id = $1 AND status = $2',
    [id, 'pending']
  );

  if (itemResult.rows.length === 0) {
    return { success: false, message: '审核项不存在或已处理' };
  }

  const item = itemResult.rows[0];

  // 根据类型处理
  if (item.type === 'post') {
    // 删除帖子
    await p.query('DELETE FROM posts WHERE id = $1', [item.target_id]);
  } else if (item.type === 'comment') {
    // 删除评论
    await p.query('DELETE FROM comments WHERE id = $1', [item.target_id]);
  }

  // 更新审核状态
  await p.query(
    'UPDATE review_queue SET status = $1, reviewed_at = NOW(), reviewed_by = $2 WHERE id = $3',
    ['rejected', reviewerId, id]
  );

  return { success: true, message: '审核拒绝' };
}

/**
 * 添加待审核项
 */
export async function addToReviewQueue(
  type: 'post' | 'comment' | 'report',
  targetId: number,
  content: string,
  reason: string,
  reportedBy?: number,
  reportedUserId?: number,
  priority: number = 0
): Promise<{ success: boolean; id?: number }> {
  const p = getPool();

  try {
    const result = await p.query(
      `INSERT INTO review_queue (type, target_id, content, reason, status, priority, reported_by, reported_user_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id`,
      [type, targetId, content, reason, 'pending', priority, reportedBy || null, reportedUserId || null]
    );

    return { success: true, id: result.rows[0].id };
  } catch (error: any) {
    if (error.code === '42P01') {
      // 表不存在，创建表
      await p.query(`
        CREATE TABLE IF NOT EXISTS review_queue (
          id SERIAL PRIMARY KEY,
          type VARCHAR(20) NOT NULL,
          target_id INTEGER NOT NULL,
          content TEXT,
          reason TEXT,
          status VARCHAR(20) DEFAULT 'pending',
          priority INTEGER DEFAULT 0,
          reported_by INTEGER,
          reported_user_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          reviewed_at TIMESTAMP,
          reviewed_by INTEGER
        )
      `);
      // 重试插入
      const result = await p.query(
        `INSERT INTO review_queue (type, target_id, content, reason, status, priority, reported_by, reported_user_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING id`,
        [type, targetId, content, reason, 'pending', priority, reportedBy || null, reportedUserId || null]
      );
      return { success: true, id: result.rows[0].id };
    }
    throw error;
  }
}

/**
 * 获取待审核内容详情
 */
export async function getReviewItemDetail(id: number): Promise<ReviewItem | null> {
  const p = getPool();

  const result = await p.query(
    'SELECT * FROM review_queue WHERE id = $1',
    [id]
  );

  return result.rows[0] || null;
}
