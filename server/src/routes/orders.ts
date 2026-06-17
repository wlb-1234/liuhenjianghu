import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// 模拟订单数据（生产环境从数据库读取）
const orders = new Map();

// 创建订单
router.post('/', async (req, res) => {
  try {
    const { userId, levelId, levelName, amount, paymentMethod } = req.body;

    if (!userId || !levelId || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少必要参数' 
      });
    }

    const orderId = `ORD${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const order = {
      orderId,
      userId,
      levelId,
      levelName: levelName || '会员',
      amount,
      paymentMethod: paymentMethod || 'pending',
      status: 'pending',
      createdAt: new Date().toISOString(),
      paidAt: null,
      expiredAt: null
    };

    orders.set(orderId, order);

    res.json({
      success: true,
      data: order,
      message: '订单创建成功'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建订单失败' });
  }
});

// 获取用户订单列表
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userOrders = Array.from(orders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalSpent = userOrders
      .filter(o => o.status === 'paid')
      .reduce((sum, o) => sum + o.amount, 0);

    res.json({
      success: true,
      data: {
        orders: userOrders,
        totalOrders: userOrders.length,
        totalSpent
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取订单失败' });
  }
});

// 获取订单详情
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = orders.get(orderId);

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        error: '订单不存在' 
      });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取订单失败' });
  }
});

// 支付回调（模拟）
router.post('/:orderId/pay', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = orders.get(orderId);

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        error: '订单不存在' 
      });
    }

    if (order.status === 'paid') {
      return res.json({ 
        success: true, 
        message: '订单已支付',
        data: order 
      });
    }

    // 模拟支付成功
    order.status = 'paid';
    order.paidAt = new Date().toISOString();
    
    // 计算会员到期时间
    const months = getMonthsFromAmount(order.amount);
    const expireDate = new Date();
    expireDate.setMonth(expireDate.getMonth() + months);
    order.expiredAt = expireDate.toISOString();

    orders.set(orderId, order);

    res.json({
      success: true,
      message: '支付成功',
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '支付失败' });
  }
});

// 取消订单
router.delete('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = orders.get(orderId);

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        error: '订单不存在' 
      });
    }

    if (order.status === 'paid') {
      return res.status(400).json({ 
        success: false, 
        error: '已支付订单无法取消' 
      });
    }

    orders.delete(orderId);

    res.json({ success: true, message: '订单已取消' });
  } catch (error) {
    res.status(500).json({ success: false, error: '取消订单失败' });
  }
});

// 管理员：获取所有订单
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let allOrders = Array.from(orders.values());

    if (status) {
      allOrders = allOrders.filter(o => o.status === status);
    }

    allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const start = (Number(page) - 1) * Number(limit);
    const pagedOrders = allOrders.slice(start, start + Number(limit));

    res.json({
      success: true,
      data: {
        orders: pagedOrders,
        total: allOrders.length,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取订单列表失败' });
  }
});

// 管理员：订单统计
router.get('/stats/summary', async (req, res) => {
  try {
    const allOrders = Array.from(orders.values());
    const paidOrders = allOrders.filter(o => o.status === 'paid');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = paidOrders.filter(o => new Date(o.paidAt) >= today);

    const stats = {
      totalOrders: allOrders.length,
      paidOrders: paidOrders.length,
      pendingOrders: allOrders.length - paidOrders.length,
      totalRevenue: paidOrders.reduce((sum, o) => sum + o.amount, 0),
      todayOrders: todayOrders.length,
      todayRevenue: todayOrders.reduce((sum, o) => sum + o.amount, 0),
      averageOrderValue: paidOrders.length > 0 
        ? paidOrders.reduce((sum, o) => sum + o.amount, 0) / paidOrders.length 
        : 0
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取统计失败' });
  }
});

// 根据金额计算月数
function getMonthsFromAmount(amount) {
  if (amount >= 2000) return 12; // 年费VIP
  if (amount >= 200) return 1;   // 省级月度
  if (amount >= 50) return 1;    // 市级月度
  if (amount >= 9) return 1;     // 县级月度
  return 1;
}

export default router;
