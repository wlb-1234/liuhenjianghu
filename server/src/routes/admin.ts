import { Router } from 'express';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const router = Router();

// Create single pool instance using environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'liuhen-secret-key') as any;
    
    const admins = await query('SELECT * FROM admins WHERE id = $1', [decoded.adminId || decoded.userId]);
    
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
      'SELECT id, username, role FROM admins WHERE username = $1 AND password_hash = $2',
      [username, passwordHash]
    );
    
    if (admins.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const admin = admins.rows[0];
    
    // 生成 JWT token
    const token = jwt.sign(
      { adminId: admin.id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET || 'liuhen-secret-key',
      { expiresIn: '7d' }
    );

    // 更新最后登录时间（失败不影响登录）
    query('UPDATE admins SET last_login = NOW() WHERE id = $1', [admin.id]).catch(() => {});

    // 记录登录日志（失败不影响登录）
    query(
      'INSERT INTO admin_logs (admin_id, action, reason) VALUES ($1, $2, $3)',
      [admin.id, 'login', 'admin login']
    ).catch((e: any) => console.log('Admin log insert failed:', e?.message));

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
      "SELECT COUNT(*) as count FROM public.users WHERE updated_at >= CURRENT_DATE - INTERVAL '7 days'"
    );
    const todayActiveUsers = await query(
      "SELECT COUNT(*) as count FROM public.users WHERE DATE(updated_at) = CURRENT_DATE"
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
             u.created_at, u.updated_at,
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
             u.created_at, u.updated_at,
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

// Update user member level
router.put('/users/:id/level', verifyAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const level = req.body.level;
    
    if (level === undefined) {
      return res.status(400).json({ error: 'Missing level' });
    }
    
    const levelCheck = await query('SELECT * FROM member_levels WHERE level = $1', [level]);
    if (levelCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid level' });
    }
    
    await query(
      'UPDATE users SET member_level = $1, updated_at = NOW() WHERE id = $2',
      [level, id]
    );
    
    await query(
      'INSERT INTO admin_logs (admin_id, action, target_user_id, reason) VALUES ($1, $2, $3, $4)',
      [req.admin.id, 'change_level', parseInt(id), JSON.stringify({ newLevel: level })]
    );
    
    res.json({ success: true, message: 'Level updated' });
  } catch (error) {
    console.error('Update level error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Ban/unban user
router.put('/users/:id/status', verifyAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const banned = req.body.banned;
    const reason = req.body.reason || '';
    
    // member_expire_at: null or past = normal, future date = member active
    // For ban: set member_expire_at to past date
    const memberExpireAt = banned ? new Date(Date.now() - 24 * 60 * 60 * 1000) : null;
    
    await query(
      'UPDATE public.users SET member_expire_at = $1, updated_at = NOW() WHERE id = $2',
      [memberExpireAt, id]
    );
    
    await query(
      'INSERT INTO admin_logs (admin_id, action, target_user_id, reason) VALUES ($1, $2, $3, $4)',
      [req.admin.id, banned ? 'ban_user' : 'unban_user', parseInt(id), reason]
    );
    
    res.json({ success: true, message: banned ? 'User banned' : 'User unbanned' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== Member Levels ====================

// Get member levels list
router.get('/member-levels', verifyAdmin, async (req, res) => {
  try {
    const levels = await query(`
      SELECT ml.*, 
             (SELECT COUNT(*) FROM public.users WHERE member_level = ml.level) as user_count
      FROM member_levels ml
      ORDER BY ml.level
    `);
    
    res.json({ success: true, data: levels.rows });
  } catch (error) {
    console.error('Member levels error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update member level config
router.put('/member-levels/:level', verifyAdmin, async (req: any, res: any) => {
  try {
    const level = req.params.level;
    const body = req.body;
    
    await query(`
      UPDATE member_levels 
      SET name = COALESCE($1, name),
          post_expire_hours = COALESCE($2, post_expire_hours),
          max_posts_per_day = COALESCE($3, max_posts_per_day),
          can_use_ai = COALESCE($4, can_use_ai),
          monthly_price = COALESCE($5, monthly_price),
          annual_price = COALESCE($6, annual_price),
          updated_at = NOW()
      WHERE level = $7
    `, [
      body.name, 
      body.post_expire_hours, 
      body.max_posts_per_day, 
      body.can_use_ai, 
      body.monthly_price, 
      body.annual_price,
      level
    ]);
    
    await query(
      'INSERT INTO admin_logs (admin_id, action, reason) VALUES ($1, $2, $3)',
      [req.admin.id, 'update_member_level', JSON.stringify(body)]
    );
    
    res.json({ success: true, message: 'Level config updated' });
  } catch (error) {
    console.error('Update member level error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== Earnings ====================

// Get earnings records
router.get('/earnings', verifyAdmin, async (req: any, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (req.query.type) {
      whereClause += ` AND e.type = $${paramIndex}`;
      params.push(req.query.type);
      paramIndex++;
    }
    
    if (req.query.startDate) {
      whereClause += ` AND DATE(e.created_at) >= $${paramIndex}`;
      params.push(req.query.startDate);
      paramIndex++;
    }
    
    if (req.query.endDate) {
      whereClause += ` AND DATE(e.created_at) <= $${paramIndex}`;
      params.push(req.query.endDate);
      paramIndex++;
    }
    
    const countResult = await query(
      `SELECT COUNT(*) as total FROM earnings e ${whereClause}`,
      params
    );
    
    params.push(limit, offset);
    const earnings = await query(`
      SELECT e.*
      FROM earnings e
      ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, params);
    
    res.json({
      success: true,
      data: {
        earnings: earnings.rows,
        total: parseInt(countResult.rows[0].total),
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Earnings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== Admin Logs ====================

// Get admin logs
router.get('/logs', verifyAdmin, async (req: any, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    
    const logs = await query(`
      SELECT al.*, a.username as admin_username
      FROM admin_logs al
      LEFT JOIN admins a ON al.admin_id = a.id
      ORDER BY al.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    const countResult = await query('SELECT COUNT(*) as total FROM admin_logs');
    
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
    console.error('Logs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
