import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { loadEnv, getDbUrl } from 'coze-coding-dev-sdk';

loadEnv();
const dbUrl = getDbUrl();
const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

import { authMiddleware, AuthRequest } from '../middleware/auth';
import { 
  createOrder, 
  getOrderByNo, 
  getUserOrders, 
  updateOrderStatus,
  simulatePayment,
  getMemberLevelConfig,
  PaymentMethod 
} from '../services/paymentService';
import { getUserById, updateUser } from '../services/userService';
import { getMemberLevel } from '../services/memberService';

const router = Router();

// 创建支付订单
router.post('/create', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { level } = req.body;
    const paymentMethod = req.body.method as PaymentMethod || 'test';

    // 验证会员等级
    if (level === undefined || level < 0 || level > 4) {
      return res.status(400).json({ error: '无效的会员等级' });
    }

    // 获取等级配置
    const levelConfig = await getMemberLevelConfig(level);
    if (!levelConfig) {
      return res.status(400).json({ error: '会员等级配置不存在' });
    }

    // 检查是否已购买更高等级
    const user = await getUserById(req.userId!);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    if (user.member_level >= level) {
      return res.status(400).json({ 
        error: '您已经拥有此等级或更高等级',
        currentLevel: user.member_level
      });
    }

    // 创建订单
    const order = await createOrder(
      req.userId!,
      level,
      levelConfig.price,
      paymentMethod
    );

    res.json({
      success: true,
      order: {
        order_no: order.order_no,
        amount: order.amount,
        member_level: order.member_level,
        member_name: levelConfig.name,
        expire_time: order.expire_time
      }
    });
  } catch (error) {
    console.error('创建订单错误:', error);
    res.status(500).json({ error: '创建订单失败' });
  }
});

// 获取订单列表
router.get('/orders', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await getUserOrders(req.userId!);
    
    res.json({
      orders: await Promise.all(orders.map(async (order) => {
        const levelConfig = await getMemberLevelConfig(order.member_level);
        return {
          order_no: order.order_no,
          member_level: order.member_level,
          member_name: levelConfig?.name || '未知',
          amount: order.amount,
          payment_method: order.payment_method,
          status: order.status,
          pay_time: order.pay_time,
          created_at: order.created_at
        };
      }))
    });
  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({ error: '获取订单列表失败' });
  }
});

// 模拟支付（测试用）
router.post('/pay/simulate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { order_no } = req.body;

    if (!order_no) {
      return res.status(400).json({ error: '订单号不能为空' });
    }

    const order = await getOrderByNo(order_no);
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.user_id !== req.userId) {
      return res.status(403).json({ error: '无权操作此订单' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: '订单状态不允许支付' });
    }

    // 模拟支付成功
    const success = await simulatePayment(order_no);
    if (!success) {
      return res.status(400).json({ error: '支付失败' });
    }

    // 更新用户会员等级
    const expireAt = new Date();
    expireAt.setMonth(expireAt.getMonth() + 1);

    await updateUser(req.userId!, {
      member_level: order.member_level,
      member_expire_at: expireAt,
      updated_at: new Date()
    });

    const levelConfig = await getMemberLevelConfig(order.member_level);

    res.json({
      success: true,
      message: '支付成功',
      member: {
        level: order.member_level,
        name: levelConfig?.name || '未知',
        expire_at: expireAt
      }
    });
  } catch (error) {
    console.error('模拟支付错误:', error);
    res.status(500).json({ error: '支付失败' });
  }
});

// 微信支付统一下单（预留接口）
router.post('/pay/wechat', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { order_no } = req.body;

    const order = await getOrderByNo(order_no);
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: '订单状态不允许支付' });
    }

    // 更新订单状态为等待支付
    await updateOrderStatus(order_no, 'unpaid');

    // 返回预支付信息（实际需要调用微信支付接口）
    res.json({
      success: true,
      prepay_id: `wx${Date.now()}${Math.random().toString(36).substring(2, 8)}`,
      message: '微信支付接口预留，需要商户号配置'
    });
  } catch (error) {
    console.error('微信支付错误:', error);
    res.status(500).json({ error: '支付失败' });
  }
});

// 支付宝支付（预留接口）
router.post('/pay/alipay', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { order_no } = req.body;

    const order = await getOrderByNo(order_no);
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: '订单状态不允许支付' });
    }

    // 更新订单状态为等待支付
    await updateOrderStatus(order_no, 'unpaid');

    // 返回预支付信息（实际需要调用支付宝接口）
    res.json({
      success: true,
      trade_no: `ali${Date.now()}${Math.random().toString(36).substring(2, 8)}`,
      message: '支付宝接口预留，需要商户号配置'
    });
  } catch (error) {
    console.error('支付宝支付错误:', error);
    res.status(500).json({ error: '支付失败' });
  }
});

// 支付回调（微信/支付宝）
router.post('/callback/:method', async (req: Request, res: Response) => {
  try {
    const { method } = req.params;
    const { order_no, transaction_id, status } = req.body;

    const order = await getOrderByNo(order_no);
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (status === 'success') {
      // 支付成功
      await updateOrderStatus(order_no, 'paid', transaction_id);

      // 更新用户会员等级
      const expireAt = new Date();
      expireAt.setMonth(expireAt.getMonth() + 1);

      await updateUser(order.user_id, {
        member_level: order.member_level,
        member_expire_at: expireAt,
        updated_at: new Date()
      });

      console.log(`支付成功: 订单 ${order_no}, 用户 ${order.user_id}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('支付回调错误:', error);
    res.status(500).json({ error: '处理失败' });
  }
});

// 获取会员等级列表
router.get('/levels', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT level, name, price, region_limit, daily_limit, retention_days, can_pin FROM member_levels ORDER BY level ASC'
    );
    
    res.json({ levels: rows });
  } catch (error) {
    console.error('获取会员等级错误:', error);
    res.status(500).json({ error: '获取会员等级失败' });
  }
});

export default router;
