import { Router } from 'express';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWT_SECRET, ADMIN_LOGIN_LIMIT } from '../config/security.js';

const router = Router();

// Create single pool instance using environment variable
// 使用 .env 中的 DATABASE_URL（阿里云 RDS）
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error(' DATABASE_URL 环境变量未设置');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function query(text: string, params?: any[]) {
  const result = await pool.query(text, params);
  return result;
}

// Middleware to verify admin auth
const verifyAdmin = async (req: any, res: any, next: Function) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const adminId = decoded.adminId || decoded.userId;
    
    if (!adminId) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const admins = await query('SELECT * FROM admins WHERE id = $1', [adminId]);
    
    if (admins.rows.length === 0) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    req.admin = admins.rows[0];
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin login
// ==================== 登录安全：验证码 + 失败锁定 ====================
// 内存存储
const adminLoginAttempts = new Map<string, { count: number; lastAttempt: number; lockedUntil: number }>();
// 一次性验证码（key: 会话id，value: {code, expireAt}）
const adminCaptcha = new Map<string, { code: string; expireAt: number }>();

// 生成并缓存 admin 登录验证码（4位数字）
function issueAdminCaptcha(sessionId: string): string {
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  adminCaptcha.set(sessionId, { code, expireAt: Date.now() + 5 * 60 * 1000 });
  return code;
}

function verifyAdminCaptcha(sessionId: string, input: string): boolean {
  const entry = adminCaptcha.get(sessionId);
  if (!entry) return false;
  if (entry.expireAt < Date.now()) {
    adminCaptcha.delete(sessionId);
    return false;
  }
  const ok = entry.code === input;
  adminCaptcha.delete(sessionId);
  return ok;
}

// 获取客户端 IP
function clientIp(req: any): string {
  return req.headers['x-forwarded-for'] || req.ip || 'unknown';
}

// 检查是否被锁定
function adminIsLocked(ip: string): { locked: boolean; retryAfterSec: number } {
  const entry = adminLoginAttempts.get(ip);
  if (entry && entry.lockedUntil > Date.now()) {
    return { locked: true, retryAfterSec: Math.ceil((entry.lockedUntil - Date.now()) / 1000) };
  }
  if (entry && entry.lockedUntil <= Date.now() && entry.lockedUntil > 0) {
    // 锁定过期，重置
    adminLoginAttempts.delete(ip);
  }
  return { locked: false, retryAfterSec: 0 };
}

// 记录失败（达到阈值则锁定）
function adminRecordFailure(ip: string) {
  const entry = adminLoginAttempts.get(ip) || { count: 0, lastAttempt: Date.now(), lockedUntil: 0 };
  entry.count += 1;
  entry.lastAttempt = Date.now();
  if (entry.count >= ADMIN_LOGIN_LIMIT.failLimit) {
    entry.lockedUntil = Date.now() + ADMIN_LOGIN_LIMIT.lockDurationMs;
    entry.count = 0;
  }
  adminLoginAttempts.set(ip, entry);
}

// 清除失败记录（登录成功）
function adminClearFailure(ip: string) {
  adminLoginAttempts.delete(ip);
}

// 获取验证码（需先请求该接口）
router.get('/login/captcha', (req: any, res: any) => {
  try {
    const sessionId = `${clientIp(req)}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const code = issueAdminCaptcha(sessionId);
    // 生产环境不返回验证码（应接入短信/邮件），开发环境返回便于联调
    const isDev = process.env.NODE_ENV !== 'production';
    res.json({
      success: true,
      sessionId,
      message: '验证码已生成',
      ...(isDev ? { code } : {}),
    });
  } catch (error) {
    res.status(500).json({ error: '生成验证码失败' });
  }
});

router.post('/login', async (req: any, res: any) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    const sessionId = req.body.sessionId;
    const captcha = req.body.captcha;

    if (!username || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    const ip = clientIp(req);

    // 1. 校验失败锁定
    const lock = adminIsLocked(ip);
    if (lock.locked) {
      return res.status(429).json({
        error: `失败次数过多，账号已锁定，请在 ${lock.retryAfterSec} 秒后重试`,
        retryAfterSec: lock.retryAfterSec,
      });
    }

    // 2. 校验验证码（会话ID + 验证码）
    if (!sessionId || !captcha) {
      return res.status(400).json({ error: '请先获取并填写验证码' });
    }
    if (!verifyAdminCaptcha(sessionId, captcha)) {
      adminRecordFailure(ip);
      return res.status(401).json({ error: '验证码错误或已过期，请重新获取' });
    }

    // 查询管理员
    const result = await query('SELECT * FROM admins WHERE username = $1', [username]);
    const admin = result.rows[0];

    // 验证密码
    if (!admin || !await bcrypt.compare(password, admin.password_hash)) {
      adminRecordFailure(ip);
      const remain = ADMIN_LOGIN_LIMIT.failLimit - (adminLoginAttempts.get(ip)?.count || 0);
      return res.status(401).json({
        error: '用户名或密码错误',
        remainingAttempts: Math.max(remain, 0),
      });
    }

    // 登录成功，清除失败记录
    adminClearFailure(ip);

    // 生成 JWT token
    const token = jwt.sign(
      { adminId: admin.id, username: admin.username, role: admin.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 更新最后登录时间（失败不影响登录）
    query('UPDATE admins SET last_login = NOW() WHERE id = $1', [admin.id]).catch(() => {});

    // 记录登录日志（失败不影响登录）- 使用 try/catch 包装
    try {
      await query(
        'INSERT INTO admin_logs (admin_id, action, reason) VALUES ($1, $2, $3)',
        [admin.id, 'login', 'admin login']
      );
    } catch (e) {
      console.log('Admin log insert failed (ignored):', (e as Error).message);
    }

    res.json({
      success: true,
      token,
      admin: { id: admin.id, username: admin.username, role: admin.role }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== Statistics ====================

// Get dashboard stats
router.get('/stats', verifyAdmin, async (req, res) => {
  try {
    const totalUsers = await query('SELECT COUNT(*) as count FROM public.users WHERE id > 0');
    const todayUsers = await query(
      "SELECT COUNT(*) as count FROM public.users WHERE DATE(created_at) = CURRENT_DATE"
    );
    const monthUsers = await query(
      "SELECT COUNT(*) as count FROM public.users WHERE DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE)"
    );
    const totalPosts = await query('SELECT COUNT(*) as count FROM posts');
    const todayPosts = await query(
      "SELECT COUNT(*) as count FROM posts WHERE DATE(created_at) = CURRENT_DATE"
    );
    const activeUsers = await query(
      "SELECT COUNT(*) as count FROM public.users WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'"
    );
    const todayActiveUsers = await query(
      "SELECT COUNT(*) as count FROM public.users WHERE DATE(created_at) = CURRENT_DATE"
    );
    const totalEarnings = await query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM earnings'
    );
    const monthEarnings = await query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM earnings WHERE DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE)"
    );
    const todayEarnings = await query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM earnings WHERE DATE(created_at) = CURRENT_DATE"
    );
    const memberDistribution = await query(`
      SELECT ml.name, ml.level, COUNT(u.id) as user_count
      FROM member_levels ml
      LEFT JOIN users u ON u.member_level = ml.level
      GROUP BY ml.level, ml.name
      ORDER BY ml.level
    `);
    
    res.json({
      success: true,
      data: {
        users: {
          total: parseInt(totalUsers.rows[0].count),
          today: parseInt(todayUsers.rows[0].count),
          thisMonth: parseInt(monthUsers.rows[0].count),
          active: parseInt(activeUsers.rows[0].count),
          activeToday: parseInt(todayActiveUsers.rows[0].count)
        },
        posts: {
          total: parseInt(totalPosts.rows[0].count),
          today: parseInt(todayPosts.rows[0].count)
        },
        earnings: {
          total: parseFloat(totalEarnings.rows[0].total),
          thisMonth: parseFloat(monthEarnings.rows[0].total),
          today: parseFloat(todayEarnings.rows[0].total)
        },
        memberDistribution: memberDistribution.rows
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get trend data
router.get('/stats/trend', verifyAdmin, async (req: any, res) => {
  try {
    const days = req.query.days || '7';
    const daysNum = parseInt(days as string);
    
    const userTrend = await query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM public.users
      WHERE created_at >= CURRENT_DATE - ($1 || ' days')::interval
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [daysNum]);
    
    const postTrend = await query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM posts
      WHERE created_at >= CURRENT_DATE - ($1 || ' days')::interval
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [daysNum]);
    
    const earningTrend = await query(`
      SELECT DATE(created_at) as date, SUM(amount) as total
      FROM earnings
      WHERE created_at >= CURRENT_DATE - INTERVAL '${daysNum} days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    
    res.json({
      success: true,
      data: {
        userTrend: userTrend.rows,
        postTrend: postTrend.rows,
        earningTrend: earningTrend.rows
      }
    });
  } catch (error) {
    console.error('Trend error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== User Management ====================

// Get user list
router.get('/users', verifyAdmin, async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE u.id > 0';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (req.query.keyword) {
      whereClause += ` AND (u.phone ILIKE $${paramIndex} OR u.nickname ILIKE $${paramIndex})`;
      params.push(`%${req.query.keyword}%`);
      paramIndex++;
    }
    
    if (req.query.memberLevel) {
      whereClause += ` AND u.member_level = $${paramIndex}`;
      params.push(parseInt(req.query.memberLevel as string));
      paramIndex++;
    }
    
    if (req.query.status === 'banned') {
      whereClause += ` AND u.member_expire_at < NOW()`;
    }
    
    const countResult = await query(
      `SELECT COUNT(*) as total FROM public.users u ${whereClause}`,
      params
    );
    
    params.push(limit, offset);
    const users = await query(`
      SELECT u.id, u.phone, u.nickname, u.member_level, 
             u.created_at,
             ml.name as member_level_name,
             (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as post_count
      FROM public.users u
      LEFT JOIN member_levels ml ON u.member_level = ml.level
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, params);
    
    res.json({
      success: true,
      data: {
        users: users.rows,
        total: parseInt(countResult.rows[0].total),
        page,
        limit
      }
    });
  } catch (error) {
    console.error('User list error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single user detail
router.get('/users/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await query(`
      SELECT u.id, u.phone, u.nickname, u.member_level, u.member_expire_at,
             u.created_at,
             ml.name as member_level_name, ml.post_expire_hours, ml.max_posts_per_day
      FROM public.users u
      LEFT JOIN member_levels ml ON u.member_level = ml.level
      WHERE u.id = $1
    `, [id]);
    
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userStats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM posts WHERE user_id = $1) as post_count,
        (SELECT COUNT(*) FROM likes WHERE user_id = $1) as like_count
    `, [id]);
    
    res.json({
      success: true,
      data: {
        ...user.rows[0],
        stats: userStats.rows[0]
      }
    });
  } catch (error) {
    console.error('User detail error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== Post Management ====================

// Get all posts
router.get('/posts', verifyAdmin, async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    
    const countResult = await query('SELECT COUNT(*) as total FROM posts');
    const posts = await query(`
      SELECT p.*, u.nickname, u.phone
      FROM posts p
      LEFT JOIN public.users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    res.json({
      success: true,
      data: {
        posts: posts.rows,
        total: parseInt(countResult.rows[0].total),
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Post list error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete post
router.delete('/posts/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query('DELETE FROM posts WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== Admin Logs ====================

// Get admin logs
router.get('/logs', verifyAdmin, async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    
    const countResult = await query('SELECT COUNT(*) as total FROM admin_logs');
    const logs = await query(`
      SELECT l.*, a.username
      FROM admin_logs l
      LEFT JOIN admins a ON l.admin_id = a.id
      ORDER BY l.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    res.json({
      success: true,
      data: {
        logs: logs.rows,
        total: parseInt(countResult.rows[0].total),
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Log list error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
