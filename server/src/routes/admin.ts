import { Router } from 'express';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'liuhen-jianghu-secret-key-2024';

// Create single pool instance using environment variable
// 使用 Supabase 主库（Railway PostgreSQL 插件会覆盖 DATABASE_URL）
const dbPassword = process.env.SUPABASE_DB_PASSWORD || 'Liuhen2026App';
const dbHost = '13.114.6.6'; // Supabase 直连 IP
const dbUrl = `postgresql://postgres:${dbPassword}@${dbHost}:5432/postgres`;

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
router.post('/login', async (req: any, res: any) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }
    
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const admins = await query(
      'SELECT id, username, role FROM admins WHERE username = $1 AND password = $2',
      [username, passwordHash]
    );
    
    if (admins.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const admin = admins.rows[0];
    
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
      WHERE created_at >= CURRENT_DATE - INTERVAL '${daysNum} days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    
    const postTrend = await query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM posts
      WHERE created_at >= CURRENT_DATE - INTERVAL '${daysNum} days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    
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
