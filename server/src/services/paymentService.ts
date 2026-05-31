import { Pool } from 'pg';
import { loadEnv, getDbUrl } from 'coze-coding-dev-sdk';

// 延迟初始化
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    try {
      loadEnv();
      const dbUrl = getDbUrl();
      pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
      });
    } catch (e) {
      console.error('数据库初始化失败:', e);
      throw e;
    }
  }
  return pool;
}

// 订单状态
export type OrderStatus = 'pending' | 'unpaid' | 'paid' | 'cancelled' | 'refunded';

// 支付方式
export type PaymentMethod = 'wechat' | 'alipay' | 'test';

export interface PaymentOrder {
  id: number;
  order_no: string;
  user_id: number;
  member_level: number;
  amount: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  pay_time: Date | null;
  expire_time: Date;
  transaction_id: string | null;
  created_at: Date;
}

export async function getMemberLevelConfig(level: number) {
  const p = getPool();
  const result = await p.query(
    'SELECT * FROM member_levels WHERE level = $1',
    [level]
  );
  return result.rows[0];
}

export async function createOrder(
  userId: number,
  memberLevel: number,
  amount: number,
  paymentMethod: PaymentMethod
) {
  const p = getPool();
  const orderNo = `ORD${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const expireTime = new Date();
  expireTime.setMinutes(expireTime.getMinutes() + 30);

  const result = await p.query(
    `INSERT INTO payment_orders (order_no, user_id, member_level, amount, payment_method, status, expire_time, created_at)
     VALUES ($1, $2, $3, $4, $5, 'pending', $6, NOW())
     RETURNING *`,
    [orderNo, userId, memberLevel, amount, paymentMethod, expireTime]
  );
  return result.rows[0];
}

export async function getOrderByNo(orderNo: string) {
  const p = getPool();
  const result = await p.query(
    'SELECT * FROM payment_orders WHERE order_no = $1',
    [orderNo]
  );
  return result.rows[0];
}

export async function getUserOrders(userId: number) {
  const p = getPool();
  const result = await p.query(
    'SELECT * FROM payment_orders WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

export async function updateOrderStatus(
  orderNo: string,
  status: OrderStatus,
  transactionId?: string
) {
  const p = getPool();
  const result = await p.query(
    `UPDATE payment_orders SET status = $2, transaction_id = $3, pay_time = CASE WHEN $2 = 'paid' THEN NOW() ELSE pay_time END
     WHERE order_no = $1 RETURNING *`,
    [orderNo, status, transactionId || null]
  );
  return result.rows[0];
}

export async function simulatePayment(orderNo: string) {
  const p = getPool();
  const result = await p.query(
    `UPDATE payment_orders SET status = 'paid', pay_time = NOW(), transaction_id = 'TEST' || NOW()::text
     WHERE order_no = $1 AND status = 'pending' RETURNING *`,
    [orderNo]
  );
  return result.rows.length > 0;
}
