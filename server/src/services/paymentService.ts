import { Pool } from 'pg';
import { loadEnv, getDbUrl } from 'coze-coding-dev-sdk';

// 加载环境变量
loadEnv();
const dbUrl = getDbUrl();

// 创建连接池
const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

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
  updated_at: Date;
}

// 生成订单号
function generateOrderNo(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `LJ${timestamp}${random}`.toUpperCase();
}

// 创建订单
export async function createOrder(
  userId: number,
  memberLevel: number,
  amount: number,
  paymentMethod: PaymentMethod
): Promise<PaymentOrder> {
  const orderNo = generateOrderNo();
  const expireTime = new Date();
  expireTime.setMinutes(expireTime.getMinutes() + 30); // 30分钟过期

  const { rows } = await pool.query(
    `INSERT INTO payment_orders 
     (order_no, user_id, member_level, amount, payment_method, status, expire_time) 
     VALUES ($1, $2, $3, $4, $5, 'pending', $6) 
     RETURNING *`,
    [orderNo, userId, memberLevel, amount, paymentMethod, expireTime]
  );

  return rows[0];
}

// 获取订单
export async function getOrderByNo(orderNo: string): Promise<PaymentOrder | null> {
  const { rows } = await pool.query(
    'SELECT * FROM payment_orders WHERE order_no = $1',
    [orderNo]
  );
  return rows.length > 0 ? rows[0] : null;
}

// 获取用户订单列表
export async function getUserOrders(userId: number): Promise<PaymentOrder[]> {
  const { rows } = await pool.query(
    'SELECT * FROM payment_orders WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return rows;
}

// 更新订单状态
export async function updateOrderStatus(
  orderNo: string,
  status: OrderStatus,
  transactionId?: string
): Promise<PaymentOrder | null> {
  let query = 'UPDATE payment_orders SET status = $1, updated_at = NOW()';
  const params: any[] = [status];

  if (status === 'paid') {
    query += ', pay_time = NOW()';
  }

  if (transactionId) {
    query += ', transaction_id = $2';
    params.push(transactionId);
  }

  query += ' WHERE order_no = $' + (params.length + 1) + ' RETURNING *';
  params.push(orderNo);

  const { rows } = await pool.query(query, params);
  return rows.length > 0 ? rows[0] : null;
}

// 模拟支付（用于测试）
export async function simulatePayment(orderNo: string): Promise<boolean> {
  const order = await getOrderByNo(orderNo);
  if (!order || order.status !== 'pending') {
    return false;
  }

  const transactionId = `SIM${Date.now()}${Math.random().toString(36).substring(2, 6)}`.toUpperCase();
  await updateOrderStatus(orderNo, 'paid', transactionId);
  return true;
}

// 获取会员等级配置
export async function getMemberLevelConfig(level: number): Promise<{ name: string; price: number } | null> {
  const { rows } = await pool.query(
    'SELECT name, price FROM member_levels WHERE level = $1',
    [level]
  );
  return rows.length > 0 ? rows[0] : null;
}
