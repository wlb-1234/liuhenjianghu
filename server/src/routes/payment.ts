/**
 * 微信支付路由
 */
import express, { Request, Response } from 'express';
import crypto from 'crypto';
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
import { ResultSetHeader } from 'mysql2/promise';

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

    let whereClause = '1=1';
    const params: any[] = [];

    // 如果有 token，说明是用户端请求，只查询该用户的订单
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // 从 token 获取 user_id（简化处理，直接查询）
      const token = authHeader.split(' ')[1];
      // TODO: 实际应该解析 JWT 获取 user_id
      // 这里先不做限制，允许查询所有订单用于管理后台
    }

    if (search) {
      whereClause += ' AND out_trade_no LIKE ?';
      params.push(`%${search}%`);
    }
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    // 查询总数
    const countResult = await query<any[]>(
      `SELECT COUNT(*) as total FROM payment_orders WHERE ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    // 查询列表
    const orders = await query<any[]>(
      `SELECT * FROM payment_orders WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.json({
      success: true,
      orders,
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
    const balances = await query<any[]>(
      `SELECT ub.*, u.phone 
       FROM user_balances ub 
       LEFT JOIN users u ON ub.user_id = u.id 
       WHERE ub.balance > 0 OR ub.total_recharged > 0
       ORDER BY ub.updated_at DESC
       LIMIT 100`
    );

    return res.json({
      success: true,
      data: balances
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
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { 
      userId,           // 用户ID
      totalFee,         // 金额（分）
      orderType,        // 订单类型：recharge/vip/gift
      body,             // 商品描述
      relatedId,        // 关联ID（会员ID等）
      openid,           // 微信openid（JSAPI支付需要）
    } = req.body;

    // 参数验证
    if (!userId || !totalFee || !orderType || !body) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少必要参数' 
      });
    }

    // 检查金额（最小1分，最大10万）
    if (totalFee < 1 || totalFee > 10000000) {
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
      body: body.substring(0, 128), // 限制长度
      out_trade_no: outTradeNo,
      total_fee: totalFee.toString(),
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

    // 保存订单到数据库
    await query<ResultSetHeader>(
      `INSERT INTO payment_orders 
       (order_id, out_trade_no, user_id, total_fee, order_type, related_id, status, trade_type, body, spbill_create_ip)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?)`,
      [generateOrderId(), outTradeNo, userId, totalFee, orderType, relatedId || null, tradeType, body, spbillCreateIp]
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
      return res.xml({ return_code: 'FAIL', return_msg: '签名失败' });
    }

    // 处理支付结果
    if (notifyData.result_code === 'SUCCESS') {
      const { out_trade_no, transaction_id, total_fee, time_end } = notifyData;

      // 更新订单状态
      await query(
        `UPDATE payment_orders 
         SET status = 'SUCCESS', 
             transaction_id = ?,
             notify_data = ?,
             notify_time = ?
         WHERE out_trade_no = ?`,
        [transaction_id, JSON.stringify(notifyData), new Date(), out_trade_no]
      );

      // 根据订单类型处理业务逻辑
      const order = await query<any[]>(
        'SELECT * FROM payment_orders WHERE out_trade_no = ?',
        [out_trade_no]
      );

      if (order.length > 0) {
        const orderData = order[0];
        
        // 会员充值处理
        if (orderData.order_type === 'vip') {
          await query(
            'UPDATE users SET member_level = ?, member_expire_at = ? WHERE id = ?',
            [orderData.related_id, new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), orderData.user_id]
          );
        }
        
        // 余额充值处理
        if (orderData.order_type === 'recharge') {
          await query(
            'UPDATE users SET balance = balance + ? WHERE id = ?',
            [parseInt(total_fee), orderData.user_id]
          );
        }
      }

      console.log('支付成功处理完成:', out_trade_no);
    }

    // 返回成功
    return res.xml({ return_code: 'SUCCESS', return_msg: 'OK' });

  } catch (error) {
    console.error('处理支付回调失败:', error);
    return res.xml({ return_code: 'FAIL', return_msg: '处理失败' });
  }
});

/**
 * 查询订单
 * GET /api/v1/payment/query/:orderId
 */
router.get('/query/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const orders = await query<any[]>(
      'SELECT * FROM payment_orders WHERE out_trade_no = ?',
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    return res.json({
      success: true,
      data: orders[0]
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
    const orders = await query<any[]>(
      'SELECT * FROM payment_orders WHERE out_trade_no = ?',
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    const order = orders[0];

    if (order.status !== 'SUCCESS') {
      return res.status(400).json({
        success: false,
        error: '订单未支付，无法退款'
      });
    }

    const refundFeeNum = refundFee || order.total_fee - order.refund_fee;

    if (refundFeeNum > order.total_fee - order.refund_fee) {
      return res.status(400).json({
        success: false,
        error: '退款金额超出可退金额'
      });
    }

    // 构造退款请求
    const nonceStr = generateNonceStr();
    const params: Record<string, string> = {
      appid: WECHAT_PAY_CONFIG.APPID,
      mch_id: WECHAT_PAY_CONFIG.MCHID,
      nonce_str: nonceStr,
      transaction_id: order.transaction_id,
      out_refund_no: `REFUND${generateOrderId()}`,
      total_fee: order.total_fee.toString(),
      refund_fee: refundFeeNum.toString(),
    };

    params.sign = generateSign(params, WECHAT_PAY_CONFIG.API_KEY);

    // 注意：退款需要使用证书，这里简化处理
    // 实际生产环境需要使用微信支付证书
    console.log('退款请求参数:', params);

    // 更新退款状态
    await query(
      `UPDATE payment_orders 
       SET refund_fee = refund_fee + ?, status = 'REFUND'
       WHERE out_trade_no = ?`,
      [refundFeeNum, orderId]
    );

    // 如果是余额充值退款
    if (order.order_type === 'recharge') {
      await query(
        'UPDATE users SET balance = balance - ? WHERE id = ?',
        [refundFeeNum, order.user_id]
      );
    }

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
