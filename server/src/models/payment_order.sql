-- 支付订单表
CREATE TABLE IF NOT EXISTS payment_orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(64) UNIQUE NOT NULL COMMENT '系统订单号',
  out_trade_no VARCHAR(64) UNIQUE NOT NULL COMMENT '商户订单号',
  transaction_id VARCHAR(64) COMMENT '微信交易号',
  
  -- 用户信息
  user_id INTEGER NOT NULL REFERENCES users(id),
  
  -- 订单金额（单位：分）
  total_fee INTEGER NOT NULL DEFAULT 0,
  refund_fee INTEGER DEFAULT 0 COMMENT '已退款金额',
  
  -- 订单类型
  order_type VARCHAR(32) NOT NULL COMMENT 'order:充值 order:vip:会员 charge:打赏',
  
  -- 关联ID（如会员ID、打赏目标用户ID等）
  related_id INTEGER COMMENT '关联的业务ID',
  
  -- 交易状态
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING:待支付 SUCCESS:已支付 REFUND:已退款 CLOSED:已关闭 FAILED:失败',
  
  -- 支付方式
  trade_type VARCHAR(32) COMMENT '支付类型：APP/NATIVE/JSAPI',
  bank_type VARCHAR(32) COMMENT '付款银行',
  
  -- 用户IP
  spbill_create_ip VARCHAR(64) COMMENT '用户支付IP',
  
  -- 商品信息
  body VARCHAR(256) COMMENT '商品描述',
  detail TEXT COMMENT '商品详情',
  
  -- 回调信息
  notify_data TEXT COMMENT '微信支付回调原始数据',
  notify_time TIMESTAMP COMMENT '支付成功回调时间',
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 索引
  UNIQUE(out_trade_no)
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_created ON payment_orders(created_at);
