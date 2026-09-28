/**
 * 微信支付路由
 */
import express, { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import WECHAT_PAY_CONFIG from '../config/wechat';
import { 
  generateNonceStr, 
  generateOrderId, 
  generateSign, 
  xmlToObject, 
  objectToXml,
  generateAppPayParams 
} from '../utils/wechatPay';
import { query } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requireVerified } from '../middleware/requireRealname';
import { NotificationService, MessagePriority } from '../services/notificationService.js';
import { JWT_SECRET } from '../config/security.js';

const router = express.Router();

/**
 * 获取支付配置（供前端使用）
 * GET /api/v1/payment/config
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    return res.json({
      success: true,
      data: {
        // 返回 AppID（敏感信息不返回密钥）
        appId: WECHAT_PAY_CONFIG.PUBLIC_APPID || WECHAT_PAY_CONFIG.APPID,
        // 商户号
        mchId: WECHAT_PAY_CONFIG.MCHID,
        // 支付环境检测
        isConfigured: !!(WECHAT_PAY_CONFIG.APPID && WECHAT_PAY_CONFIG.API_KEY),
      }
    });
  } catch (error) {
    console.error('获取支付配置失败:', error);
    return res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

/**
 * 获取会员等级列表（充值/VIP 购买页使用）
 * GET /api/v1/payment/levels
 */
router.get('/levels', async (req: Request, res: Response) => {
  try {
    const levels = await query(
      'SELECT level, name, price, region_limit, daily_limit, retention_days, can_pin FROM member_levels ORDER BY level ASC'
    );
    const data = (levels.rows || []).map((lv: any) => ({
      level: parseInt(lv.level, 10),
      name: lv.name,
      price: Math.round(Number(lv.price)), // numeric 以元返回（前端展示），下单时后端自动换分为分
      region_limit: parseInt(lv.region_limit, 10) || 0,
      daily_limit: parseInt(lv.daily_limit, 10) || 0,
      retention_days: parseInt(lv.retention_days, 10) || 0,
      can_pin: !!lv.can_pin,
    }));
    return res.json({ success: true, data });
  } catch (error) {
    console.error('获取会员等级失败:', error);
    return res.status(500).json({ success: false, error: '服务器错误' });
  }
});

/**
 * 查询订单列表（管理后台）
 * GET /api/v1/payment/orders
 */
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const authHeader = req.headers.authorization;

    // 动态查询条件（PG 参数化，$n）
    const conds: string[] = [];
    const params: any[] = [];
    let whereClause = '';

    // 如果有 token，说明是用户端请求，只查询该用户的订单
    let userIdFromToken: number | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { userId?: number; adminId?: number };
        // 优先使用 userId，如果是管理员则使用 adminId
        userIdFromToken = decoded.userId || decoded.adminId || null;
      } catch (error) {
        // token 无效，忽略
      }
    }

    // 如果不是管理员（没有 adminId），则只查询该用户的订单
    const isAdmin = authHeader && authHeader.startsWith('Bearer ') && (() => {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { adminId?: number };
        return !!decoded.adminId;
      } catch {
        return false;
      }
    })();

    if (!isAdmin && userIdFromToken) {
      params.push(userIdFromToken);
      conds.push(`user_id = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      conds.push(`order_no LIKE $${params.length}`);
    }
    if (status) {
      params.push(status);
      conds.push(`status = $${params.length}`);
    }
    whereClause = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

    // 查询总数
    const countResult = await query(
      `SELECT COUNT(*) as total FROM payment_orders ${whereClause}`,
      params
    );
    const total = countResult.rows?.[0]?.total || 0;

    // 查询列表
    const listParams = [...params, limit, offset];
    const orders = await query(
      `SELECT * FROM payment_orders ${whereClause} ORDER BY created_at DESC LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
      listParams
    );

    return res.json({
      success: true,
      orders: (orders as any).rows || [],
      total,
      page,
      limit
    });
  } catch (error: any) {
    console.error('查询订单列表失败:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || '服务器错误'
    });
  }
});

/**
 * 查询用户余额列表（管理后台）
 * GET /api/v1/payment/balances
 */
router.get('/balances', async (req: Request, res: Response) => {
  try {
    const balances = await query(
      `SELECT ub.*, u.phone 
       FROM user_balances ub 
       LEFT JOIN users u ON ub.user_id = u.id 
       WHERE ub.balance > 0 OR ub.total_recharged > 0
       ORDER BY ub.updated_at DESC
       LIMIT 100`
    );

    return res.json({
      success: true,
      data: (balances as any).rows || balances
    });
  } catch (error) {
    console.error('查询余额列表失败:', error);
    return res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

/**
 * 统一下单接口
 * POST /api/v1/payment/create
 */
router.post('/create', authMiddleware, requireVerified, async (req: AuthRequest, res: Response) => {
  try {
    const { 
      totalFee,         // 金额（分）—— 会员购买可省略，由 level 自动计算
      orderType,        // 订单类型：recharge/vip/gift —— 会员购买传 level 时自动为 vip
      body,             // 商品描述
      relatedId,        // 关联ID（会员等级等）
      openid,           // 微信openid（JSAPI支付需要）
      level,            // 会员等级（前端 VipScreen 购买会员时传，1~4 对应可付费等级）
      method,           // 支付方式：wechat/alipay（预留），当前仅微信；用于日志/告警，不影响下单
    } = req.body;
    const userId = req.userId; // 从登录态获取用户ID（已通过实名认证校验）

    // 统一契约：会员购买（前端传 level）自动计算金额/订单类型/关联ID
    let finalTotalFee = totalFee;
    let finalOrderType = orderType;
    let finalBody = body;
    let finalRelatedId = relatedId;

    if (level !== undefined) {
      const levelNum = parseInt(level, 10);
      if (isNaN(levelNum) || levelNum <= 0) {
        return res.status(400).json({ success: false, error: '无效的会员等级' });
      }
      // 从会员等级表读取价格（numeric，元）
      const lvResult = await query(
        'SELECT name, price FROM member_levels WHERE level = $1',
        [levelNum]
      );
      const lv = (lvResult.rows || [])[0];
      if (!lv) {
        return res.status(400).json({ success: false, error: '会员等级不存在' });
      }
      const priceYuan = Number(lv.price);
      if (!(priceYuan > 0)) {
        return res.status(400).json({ success: false, error: '该等级无需购买' });
      }
      finalTotalFee = Math.round(priceYuan * 100); // 元 → 分
      finalOrderType = 'vip';
      finalBody = `${lv.name}会员`;
      finalRelatedId = levelNum;
    }

    // 参数验证（会员购买已自动补齐；其余场景需显式传参）
    if (!finalTotalFee || !finalOrderType || !finalBody) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少必要参数' 
      });
    }

    const totalFeeToUse = finalTotalFee;
    const orderTypeToUse = finalOrderType;
    const bodyToUse = finalBody;
    const relatedIdToUse = finalRelatedId;

    // 检查金额（最小1分，最大10万）
    if (totalFeeToUse < 1 || totalFeeToUse > 10000000) {
      return res.status(400).json({
        success: false,
        error: '金额超出允许范围'
      });
    }

    // 生成订单号
    const outTradeNo = generateOrderId();
    const nonceStr = generateNonceStr();
    const spbillCreateIp = req.ip || '127.0.0.1';

    // 判断交易类型
    const tradeType = openid ? 'JSAPI' : 'APP';

    // 构造请求参数
    const params: Record<string, string> = {
      appid: openid ? WECHAT_PAY_CONFIG.PUBLIC_APPID : WECHAT_PAY_CONFIG.APPID,
      mch_id: WECHAT_PAY_CONFIG.MCHID,
      nonce_str: nonceStr,
      sign_type: 'MD5',
      body: bodyToUse.substring(0, 128), // 限制长度
      out_trade_no: outTradeNo,
      total_fee: totalFeeToUse.toString(),
      spbill_create_ip: spbillCreateIp,
      notify_url: WECHAT_PAY_CONFIG.NOTIFY_URL,
      trade_type: tradeType,
    };

    // JSAPI需要传入openid
    if (openid) {
      params.openid = openid;
    }

    // 生成签名
    params.sign = generateSign(params, WECHAT_PAY_CONFIG.API_KEY);

    // 转换为XML
    const xmlData = objectToXml(params);

    // 调用微信统一下单接口
    const response = await fetch(WECHAT_PAY_CONFIG.UNIFIED_ORDER_URL, {
      method: 'POST',
      body: xmlData,
      headers: {
        'Content-Type': 'text/xml',
      },
    });

    const resultXml = await response.text();
    const result = xmlToObject(resultXml);

    // 检查返回结果
    if (result.return_code === 'FAIL') {
      console.error('微信统一下单失败:', result.return_msg);
      return res.status(500).json({
        success: false,
        error: result.return_msg || '下单失败'
      });
    }

    if (result.result_code === 'FAIL') {
      console.error('微信下单业务失败:', result.err_code, result.err_code_des);
      return res.status(400).json({
        success: false,
        error: result.err_code_des || result.err_code
      });
    }

    // 保存订单到数据库（真实 payment_orders 表，order_no 即微信 out_trade_no）
    const expireTime = new Date();
    expireTime.setMinutes(expireTime.getMinutes() + 30);
    await query(
      `INSERT INTO payment_orders 
       (order_no, user_id, member_level, amount, payment_method, status, expire_time, created_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6, NOW())`,
      [outTradeNo, userId, relatedIdToUse ?? 0, totalFeeToUse, (method === 'test' ? 'test' : 'wechat'), expireTime]
    );

    // 生成App端调起支付的参数
    const payParams = {
      prepayId: result.prepay_id,
      ...generateAppPayParams(result.prepay_id),
    };

    return res.json({
      success: true,
      data: {
        orderId: outTradeNo,
        payParams: tradeType === 'APP' ? payParams : {
          prepayId: result.prepay_id,
        },
        tradeType,
      }
    });

  } catch (error) {
    console.error('创建订单失败:', error);
    return res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

/**
 * 支付回调接口
 * POST /api/v1/payment/notify
 */
router.post('/notify', async (req: Request, res: Response) => {
  try {
    // 微信支付通知是XML格式
    const xmlData = req.body.xml || req.body;
    
    // 如果是字符串，转换为对象
    let notifyData: Record<string, string>;
    if (typeof xmlData === 'string') {
      notifyData = xmlToObject(xmlData);
    } else {
      notifyData = xmlData;
    }

    console.log('收到微信支付回调:', notifyData);

    // 验证签名
    const sign = notifyData.sign;
    delete notifyData.sign;
    const calculatedSign = generateSign(notifyData, WECHAT_PAY_CONFIG.API_KEY);

    if (calculatedSign !== sign) {
      console.error('签名验证失败');
      return res.type('application/xml').send(objectToXml({ return_code: 'FAIL', return_msg: '签名失败' }));
    }

    // 处理支付结果
    if (notifyData.result_code === 'SUCCESS') {
      const { out_trade_no, transaction_id, total_fee, time_end } = notifyData;

      // 根据订单号（微信 out_trade_no 即 order_no）查找订单
      const order = await query(
        'SELECT * FROM payment_orders WHERE order_no = $1',
        [out_trade_no]
      );
      const orderRows = (order as any).rows || [];

      if (orderRows.length > 0) {
        const orderData = orderRows[0];

        // 更新订单状态为已支付（幂等：仅 pending → paid）
        const upd = await query(
          `UPDATE payment_orders 
           SET status = 'paid', transaction_id = $1, pay_time = COALESCE(pay_time, NOW())
           WHERE order_no = $2 AND status = 'pending' RETURNING *`,
          [transaction_id || null, out_trade_no]
        );
        const updatedRows = (upd as any).rows || [];
        const effective = updatedRows.length > 0 ? updatedRows[0] : orderData;

        // 会员购买处理：升级会员等级（member_level 即目标等级）
        const levelTarget = parseInt(effective.member_level, 10) || 0;
        if (levelTarget > 0) {
          // 会员有效期：永久开通（或按需换算），给予足够长有效期
          await query(
            'UPDATE users SET member_level = $1, member_expire_at = $2 WHERE id = $3',
            [levelTarget, new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000), effective.user_id]
          );
        }

        // 发送开通成功通知
        try {
          const amountYuan = (parseInt(total_fee, 10) / 100).toFixed(2);
          const title = '会员开通成功';
          const expireDate = new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000);
          const content = `您已成为${effective.member_level ? '更高级别' : ''}江湖身份，感谢您的支持！`;
          await NotificationService.sendSystemMessage(
            effective.user_id,
            title,
            content,
            { type: 'vip', orderId: out_trade_no, amount: amountYuan },
            MessagePriority.HIGH
          );
        } catch (notifError: any) {
          console.error('发送开通通知失败(不影响支付流程):', notifError.message);
        }
      }

      console.log('支付成功处理完成:', out_trade_no);
    }

    // 返回成功
    return res.type('application/xml').send(objectToXml({ return_code: 'SUCCESS', return_msg: 'OK' }));

  } catch (error) {
    console.error('处理支付回调失败:', error);
    return res.type('application/xml').send(objectToXml({ return_code: 'FAIL', return_msg: '处理失败' }));
  }
});

/**
 * 查询订单
 * GET /api/v1/payment/query/:orderId
 */
router.get('/query/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const orders = await query(
      'SELECT * FROM payment_orders WHERE order_no = $1',
      [orderId]
    );
    const rows = (orders as any).rows || [];

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    return res.json({
      success: true,
      data: rows[0]
    });

  } catch (error) {
    console.error('查询订单失败:', error);
    return res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

/**
 * 申请退款
 * POST /api/v1/payment/refund
 */
router.post('/refund', async (req: Request, res: Response) => {
  try {
    const { orderId, refundFee, reason } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: '缺少订单号'
      });
    }

    // 查询原订单
    const orders = await query(
      'SELECT * FROM payment_orders WHERE order_no = $1',
      [orderId]
    );
    const rows = (orders as any).rows || [];

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    const order = rows[0];

    if (order.status !== 'paid') {
      return res.status(400).json({
        success: false,
        error: '订单未支付，无法退款'
      });
    }

    const refundFeeNum = refundFee ? Math.round(Number(refundFee)) : Math.round(Number(order.amount) || 0);

    // 构造退款请求
    const nonceStr = generateNonceStr();
    const params: Record<string, string> = {
      appid: WECHAT_PAY_CONFIG.APPID,
      mch_id: WECHAT_PAY_CONFIG.MCHID,
      nonce_str: nonceStr,
      transaction_id: order.transaction_id || '',
      out_refund_no: `REFUND${generateOrderId()}`,
      total_fee: String(order.amount || 0),
      refund_fee: String(refundFeeNum),
    };

    params.sign = generateSign(params, WECHAT_PAY_CONFIG.API_KEY);

    // 注意：退款需要使用证书，这里简化处理
    // 实际生产环境需要使用微信支付证书
    console.log('退款请求参数:', params);

    // 更新退款状态（真实表无 refund_fee 列，以 status 标记）
    await query(
      `UPDATE payment_orders 
       SET status = 'refunded'
       WHERE order_no = $1`,
      [orderId]
    );

    return res.json({
      success: true,
      message: '退款申请已提交'
    });

  } catch (error) {
    console.error('申请退款失败:', error);
    return res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

export default router;
