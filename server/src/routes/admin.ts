import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from '../config/database';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'admin-secret-key';

// 获取连接池
let pool: ReturnType<typeof getPool> | null = null;

function getPoolInstance() {
  if (!pool) pool = getPool();
  return pool;
}

// 管理员登录
router.post('/login', async (req: Request, res: Response) => {
  try {
    console.log('Admin login request:', req.body);
    const { username, password } = req.body;

    if (!username || !password) {
      res.json({ code: 400, message: '用户名和密码不能为空' });
      return;
    }

    const p = getPoolInstance();
    console.log('Pool:', !!p);
    
    const result = await p.query(
      'SELECT * FROM admins WHERE username = $1',
      [username]
    );
    console.log('Query result:', result.rows.length);

    if (result.rows.length === 0) {
      res.json({ code: 401, message: '用户名或密码错误' });
      return;
    }

    const admin = result.rows[0];
    console.log('Admin found:', admin.username);
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      res.json({ code: 401, message: '用户名或密码错误' });
      return;
    }

    const token = jwt.sign(
      { adminId: admin.id, role: admin.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          nickname: admin.nickname,
          role: admin.role,
        },
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.json({ code: 500, message: '服务器错误: ' + (error as Error).message });
  }
});

// 验证管理员token
const verifyAdmin = async (req: Request, res: Response, next: Function) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      res.json({ code: 401, message: '未登录' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { adminId: number; role: string };
    (req as any).adminId = decoded.adminId;
    (req as any).adminRole = decoded.role;
    next();
  } catch (error) {
    res.json({ code: 401, message: 'Token无效' });
  }
};

// 获取收益统计
router.get('/stats', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const params: any[] = [];

    if (startDate && endDate) {
      dateFilter = 'WHERE created_at >= $1 AND created_at <= $2';
      params.push(startDate, endDate);
    } else if (startDate) {
      dateFilter = 'WHERE created_at >= $1';
      params.push(startDate);
    } else if (endDate) {
      dateFilter = 'WHERE created_at <= $1';
      params.push(endDate);
    }

    // 总收益
    const totalResult = await getPoolInstance().query(
      `SELECT 
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(platform_amount), 0) as total_platform,
        COALESCE(SUM(creator_amount), 0) as total_creator,
        COUNT(*) as total_orders
       FROM earnings ${dateFilter}`,
      params
    );

    // 按等级统计
    const byLevelResult = await getPoolInstance().query(
      `SELECT 
        level,
        COUNT(*) as orders,
        COALESCE(SUM(amount), 0) as amount,
        COALESCE(SUM(platform_amount), 0) as platform_amount,
        COALESCE(SUM(creator_amount), 0) as creator_amount
       FROM earnings ${dateFilter}
       GROUP BY level ORDER BY level`,
      params
    );

    // 按月统计
    const byMonthResult = await getPoolInstance().query(
      `SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as orders,
        COALESCE(SUM(amount), 0) as amount,
        COALESCE(SUM(platform_amount), 0) as platform_amount,
        COALESCE(SUM(creator_amount), 0) as creator_amount
       FROM earnings ${dateFilter}
       GROUP BY TO_CHAR(created_at, 'YYYY-MM')
       ORDER BY month DESC
       LIMIT 12`,
      params
    );

    // 今日收益
    const todayResult = await getPoolInstance().query(
      `SELECT 
        COALESCE(SUM(amount), 0) as today_amount,
        COUNT(*) as today_orders
       FROM earnings
       WHERE DATE(created_at) = CURRENT_DATE`
    );

    // 本月收益
    const monthResult = await getPoolInstance().query(
      `SELECT 
        COALESCE(SUM(amount), 0) as month_amount,
        COUNT(*) as month_orders
       FROM earnings
       WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`
    );

    res.json({
      code: 200,
      data: {
        total: totalResult.rows[0],
        today: todayResult.rows[0],
        month: monthResult.rows[0],
        byLevel: byLevelResult.rows,
        byMonth: byMonthResult.rows,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.json({ code: 500, message: '服务器错误' });
  }
});

// 获取用户列表
router.get('/users', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, keyword, level } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (keyword) {
      whereClause += `WHERE (u.phone LIKE $${paramIndex} OR u.nickname LIKE $${paramIndex})`;
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (level !== undefined) {
      whereClause += whereClause ? ' AND' : 'WHERE';
      whereClause += ` u.member_level = $${paramIndex}`;
      params.push(Number(level));
      paramIndex++;
    }

    const countResult = await getPoolInstance().query(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      params
    );

    params.push(Number(limit), offset);
    const result = await getPoolInstance().query(
      `SELECT 
        u.id, u.phone, u.nickname, u.avatar, u.member_level,
        u.member_expire_at, u.total_posts, u.total_likes,
        u.created_at,
        ml.name as level_name
       FROM users u
       LEFT JOIN member_levels ml ON ml.level = u.member_level
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({
      code: 200,
      data: {
        list: result.rows,
        total: parseInt(countResult.rows[0].total),
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.json({ code: 500, message: '服务器错误' });
  }
});

// 调整用户会员等级
router.post('/adjust-level', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const { userId, level, reason } = req.body;
    const adminId = (req as any).adminId;

    if (!userId || level === undefined) {
      res.json({ code: 400, message: '参数不完整' });
      return;
    }

    // 获取用户当前信息
    const userResult = await getPoolInstance().query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      res.json({ code: 404, message: '用户不存在' });
      return;
    }

    const user = userResult.rows[0];
    const oldLevel = user.member_level;

    // 更新用户等级
    let expireAt = null;
    if (level > 0) {
      // 设置过期时间（默认1个月）
      expireAt = new Date();
      expireAt.setMonth(expireAt.getMonth() + 1);
    }

    await getPoolInstance().query(
      `UPDATE users 
       SET member_level = $1, member_expire_at = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [level, expireAt, userId]
    );

    // 记录操作日志
    await getPoolInstance().query(
      `INSERT INTO admin_logs (admin_id, action, target_user_id, old_value, new_value, reason)
       VALUES ($1, 'adjust_level', $2, $3, $4, $5)`,
      [adminId, userId, oldLevel, level, reason || '管理员调整']
    );

    res.json({
      code: 200,
      message: '调整成功',
      data: {
        userId,
        oldLevel,
        newLevel: level,
      },
    });
  } catch (error) {
    console.error('Adjust level error:', error);
    res.json({ code: 500, message: '服务器错误' });
  }
});

// 获取订单列表
router.get('/orders', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status, userId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (status !== undefined) {
      whereClause += `WHERE o.status = $${paramIndex}`;
      params.push(Number(status));
      paramIndex++;
    }

    if (userId) {
      whereClause += whereClause ? ' AND' : 'WHERE';
      whereClause += ` o.user_id = $${paramIndex}`;
      params.push(Number(userId));
      paramIndex++;
    }

    const countResult = await getPoolInstance().query(
      `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
      params
    );

    params.push(Number(limit), offset);
    const result = await getPoolInstance().query(
      `SELECT 
        o.*, u.nickname, u.phone,
        ml.name as level_name
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       LEFT JOIN member_levels ml ON ml.level = o.level
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({
      code: 200,
      data: {
        list: result.rows,
        total: parseInt(countResult.rows[0].total),
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.json({ code: 500, message: '服务器错误' });
  }
});

// 创建订单（模拟支付）
router.post('/create-order', async (req: Request, res: Response) => {
  try {
    const { userId, level, months = 1 } = req.body;

    const levelResult = await getPoolInstance().query(
      'SELECT * FROM member_levels WHERE level = $1',
      [level]
    );

    if (levelResult.rows.length === 0) {
      res.json({ code: 404, message: '会员等级不存在' });
      return;
    }

    const memberLevel = levelResult.rows[0];
    const price = memberLevel.price * months;
    const transactionId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 创建订单
    const orderResult = await getPoolInstance().query(
      `INSERT INTO orders (user_id, level, price, months, status, transaction_id)
       VALUES ($1, $2, $3, $4, 1, $5) RETURNING *`,
      [userId, level, price, months, transactionId]
    );

    // 计算分成
    const platformRatio = 0.30;
    const creatorRatio = 0.70;
    const platformAmount = price * platformRatio;
    const creatorAmount = price * creatorRatio;

    // 记录收益
    await getPoolInstance().query(
      `INSERT INTO earnings (order_id, amount, platform_ratio, creator_ratio, platform_amount, creator_amount, level)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [orderResult.rows[0].id, price, platformRatio, creatorRatio, platformAmount, creatorAmount, level]
    );

    // 更新用户会员等级
    const expireAt = new Date();
    expireAt.setMonth(expireAt.getMonth() + months);

    await getPoolInstance().query(
      `UPDATE users SET member_level = $1, member_expire_at = $2 WHERE id = $3`,
      [level, expireAt, userId]
    );

    res.json({
      code: 200,
      message: '订单创建成功',
      data: orderResult.rows[0],
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.json({ code: 500, message: '服务器错误' });
  }
});

// 获取平台分成比例
router.get('/platform-config', verifyAdmin, async (req: Request, res: Response) => {
  try {
    res.json({
      code: 200,
      data: {
        platformRatio: 0.30,
        creatorRatio: 0.70,
        description: '平台收取30%服务费，创作者获得70%收益',
      },
    });
  } catch (error) {
    res.json({ code: 500, message: '服务器错误' });
  }
});

export default router;
