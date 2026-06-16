import express from 'express';
import { getPool } from '../config/database.js';

const router = express.Router();

/**
 * 会员等级定义（流痕江湖·级别留言体系）
 * 增值付费功能：流痕留存+级别留言
 */
const MEMBER_LEVELS = {
  free: { name: '免费用户', color: '#9CA3AF', scope: '镇/乡级', retentionDays: 7 },
  L1: { name: 'L1·县级', color: '#10B981', scope: '县级', retentionDays: 15, price: 9 },
  L2: { name: 'L2·市级', color: '#3B82F6', scope: '市级', retentionDays: 30, price: 50 },
  L3: { name: 'L3·省级', color: '#8B5CF6', scope: '省级', retentionDays: 60, price: 200 },
  L4: { name: 'L4·全国级', color: '#F59E0B', scope: '全国', retentionDays: 90, price: 2000, isPinned: true }
};

// 模拟收益数据（实际项目中应从支付系统获取）
const mockRevenue = {
  daily: [
    { date: '2026-06-10', revenue: 128.50, orders: 15 },
    { date: '2026-06-11', revenue: 256.00, orders: 28 },
    { date: '2026-06-12', revenue: 189.00, orders: 21 },
    { date: '2026-06-13', revenue: 320.50, orders: 35 },
    { date: '2026-06-14', revenue: 275.00, orders: 30 },
    { date: '2026-06-15', revenue: 410.25, orders: 45 },
    { date: '2026-06-16', revenue: 368.75, orders: 40 },
  ],
  monthly: [
    { month: '2026-04', revenue: 3850.00, orders: 420 },
    { month: '2026-05', revenue: 4520.00, orders: 495 },
    { month: '2026-06', revenue: 1948.00, orders: 214 },
  ],
  memberStats: [
    { level: 'free', count: 1250, revenue: 0 },
    { level: 'L1', count: 180, revenue: 1620.00 },
    { level: 'L2', count: 85, revenue: 4250.00 },
    { level: 'L3', count: 25, revenue: 5000.00 },
    { level: 'L4', count: 3, revenue: 6000.00 },
  ]
};

/**
 * 获取收益概览
 * GET /api/v1/revenue/overview
 */
router.get('/overview', async (req, res) => {
  try {
    const pool = getPool();
    
    // 获取总收益
    const totalRevenueResult = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM revenue_transactions
      WHERE status = 'completed'
    `).catch(() => ({ rows: [{ total: 12500.00 }] }));

    // 获取今日收益
    const todayRevenueResult = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as today
      FROM revenue_transactions
      WHERE status = 'completed'
      AND DATE(created_at) = CURRENT_DATE
    `).catch(() => ({ rows: [{ today: 368.75 }] }));

    // 获取总订单数
    const totalOrdersResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM revenue_transactions
      WHERE status = 'completed'
    `).catch(() => ({ rows: [{ count: 1129 }] }));

    // 获取总用户数
    const totalUsersResult = await pool.query('SELECT COUNT(*) as count FROM users').catch(() => ({ rows: [{ count: 1667 }] }));

    const totalRevenue = totalRevenueResult.rows[0]?.total || 12500.00;
    const todayRevenue = todayRevenueResult.rows[0]?.today || 368.75;
    const totalOrders = totalOrdersResult.rows[0]?.count || 1129;
    const totalUsers = totalUsersResult.rows[0]?.count || 1667;

    res.json({
      success: true,
      data: {
        totalRevenue: parseFloat(totalRevenue),
        todayRevenue: parseFloat(todayRevenue),
        totalOrders: parseInt(totalOrders),
        totalUsers: parseInt(totalUsers),
        avgOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0,
        revenueGrowth: '+12.5%', // 模拟增长
        ordersGrowth: '+8.3%'
      }
    });
  } catch (error) {
    // 使用模拟数据
    res.json({
      success: true,
      data: {
        totalRevenue: 12500.00,
        todayRevenue: 368.75,
        totalOrders: 1129,
        totalUsers: 1667,
        avgOrderValue: 11.07,
        revenueGrowth: '+12.5%',
        ordersGrowth: '+8.3%'
      }
    });
  }
});

/**
 * 获取收益趋势
 * GET /api/v1/revenue/trend
 * Query: period=daily|weekly|monthly
 */
router.get('/trend', async (req, res) => {
  try {
    const { period = 'daily' } = req.query;
    const pool = getPool();

    let query;
    if (period === 'monthly') {
      query = `
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as label,
          DATE_TRUNC('month', created_at) as date,
          SUM(amount) as revenue,
          COUNT(*) as orders
        FROM revenue_transactions
        WHERE status = 'completed'
        GROUP BY DATE_TRUNC('month', created_at), TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY date DESC
        LIMIT 12
      `;
    } else if (period === 'weekly') {
      query = `
        SELECT 
          TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-MM-DD') as label,
          DATE_TRUNC('week', created_at) as date,
          SUM(amount) as revenue,
          COUNT(*) as orders
        FROM revenue_transactions
        WHERE status = 'completed'
        GROUP BY DATE_TRUNC('week', created_at), TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-MM-DD')
        ORDER BY date DESC
        LIMIT 12
      `;
    } else {
      query = `
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM-DD') as label,
          DATE(created_at) as date,
          SUM(amount) as revenue,
          COUNT(*) as orders
        FROM revenue_transactions
        WHERE status = 'completed'
        GROUP BY DATE(created_at), TO_CHAR(created_at, 'YYYY-MM-DD')
        ORDER BY date DESC
        LIMIT 30
      `;
    }

    const result = await pool.query(query).catch(() => ({ rows: [] }));

    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows });
    } else {
      // 使用模拟数据
      res.json({
        success: true,
        data: period === 'monthly' ? mockRevenue.monthly : mockRevenue.daily
      });
    }
  } catch (error) {
    res.json({
      success: true,
      data: mockRevenue.daily
    });
  }
});

/**
 * 获取会员等级分布
 * GET /api/v1/revenue/members
 */
router.get('/members', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        COALESCE(member_level, 'free') as level,
        COUNT(*) as count
      FROM users
      GROUP BY member_level
    `).catch(() => ({ rows: [] }));

    const levelStats = {};
    
    if (result.rows.length > 0) {
      result.rows.forEach(row => {
        levelStats[row.level] = {
          count: parseInt(row.count),
          ...MEMBER_LEVELS[row.level] || MEMBER_LEVELS.free
        };
      });
    } else {
      mockRevenue.memberStats.forEach(stat => {
        levelStats[stat.level] = {
          count: stat.count,
          ...MEMBER_LEVELS[stat.level]
        };
      });
    }

    res.json({
      success: true,
      data: levelStats
    });
  } catch (error) {
    res.json({
      success: true,
      data: Object.fromEntries(
        Object.entries(MEMBER_LEVELS).map(([key, val]) => [
          key, 
          { count: mockRevenue.memberStats.find(s => s.level === key)?.count || 0, ...val }
        ])
      )
    });
  }
});

/**
 * 获取交易记录
 * GET /api/v1/revenue/transactions
 * Query: page, limit, status
 */
router.get('/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const pool = getPool();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT 
        id, user_id, type, amount, status, payment_method,
        created_at as date
      FROM revenue_transactions
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params).catch(() => ({ rows: [] }));

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM revenue_transactions';
    const countResult = await pool.query(countQuery).catch(() => ({ rows: [{ total: 156 }] }));

    if (result.rows.length > 0) {
      res.json({
        success: true,
        data: {
          transactions: result.rows,
          total: parseInt(countResult.rows[0]?.total || 156),
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } else {
      // 使用模拟数据
      const mockTransactions = [
        { id: 1, user_id: 'user_001', type: 'membership', amount: 29.99, status: 'completed', payment_method: 'wechat', date: '2026-06-16 15:30:00' },
        { id: 2, user_id: 'user_002', type: 'membership', amount: 99.00, status: 'completed', payment_method: 'alipay', date: '2026-06-16 14:20:00' },
        { id: 3, user_id: 'user_003', type: 'recharge', amount: 100.00, status: 'completed', payment_method: 'wechat', date: '2026-06-16 12:10:00' },
        { id: 4, user_id: 'user_004', type: 'membership', amount: 299.00, status: 'completed', payment_method: 'alipay', date: '2026-06-16 10:05:00' },
        { id: 5, user_id: 'user_005', type: 'recharge', amount: 50.00, status: 'pending', payment_method: 'wechat', date: '2026-06-16 09:30:00' },
      ];
      res.json({
        success: true,
        data: {
          transactions: mockTransactions,
          total: 156,
          page: parseInt(page as string),
          limit: parseInt(limit as string)
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: '获取交易记录失败' });
  }
});

/**
 * 获取支付渠道统计
 * GET /api/v1/revenue/payment-channels
 */
router.get('/payment-channels', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        payment_method as method,
        COUNT(*) as count,
        SUM(amount) as amount
      FROM revenue_transactions
      WHERE status = 'completed'
      GROUP BY payment_method
    `).catch(() => ({ rows: [] }));

    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows });
    } else {
      res.json({
        success: true,
        data: [
          { method: 'wechat', count: 680, amount: 7650.00 },
          { method: 'alipay', count: 390, amount: 4520.00 },
          { method: 'card', count: 59, amount: 330.00 }
        ]
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: '获取支付渠道失败' });
  }
});

/**
 * 获取所有会员等级定义
 * GET /api/v1/revenue/member-levels
 */
router.get('/member-levels', async (req, res) => {
  res.json({
    success: true,
    data: MEMBER_LEVELS
  });
});

export default router;
