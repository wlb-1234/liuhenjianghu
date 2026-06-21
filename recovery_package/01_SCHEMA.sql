-- ============================================
-- 流痕江湖 App 数据库结构
-- 版本: v1.7.0
-- 更新: 实名认证、意见反馈
-- ============================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(50) NOT NULL DEFAULT '',
  avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  gender VARCHAR(10) DEFAULT 'unknown',
  birthday DATE,
  region_code VARCHAR(20) DEFAULT '',
  role VARCHAR(20) DEFAULT 'user',  -- user/admin
  member_level_id INTEGER DEFAULT 1,
  balance DECIMAL(10,2) DEFAULT 0.00,
  is_verified BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active',  -- active/banned
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 漂流信(帖子)表
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  region_code VARCHAR(20) DEFAULT '',
  is_anonymous BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'published',  -- pending/published/deleted
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 实名认证表
CREATE TABLE IF NOT EXISTS realname_verifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  real_name VARCHAR(50) NOT NULL,
  id_card VARCHAR(18) NOT NULL,
  id_card_front TEXT,
  id_card_back TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',  -- pending/approved/rejected
  reject_reason TEXT,
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 意见反馈表
CREATE TABLE IF NOT EXISTS feedbacks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  type VARCHAR(32) NOT NULL DEFAULT 'suggestion',  -- suggestion/bug/other
  content TEXT NOT NULL,
  contact VARCHAR(100),
  status VARCHAR(32) NOT NULL DEFAULT 'pending',  -- pending/processed/rejected
  reply TEXT,
  replied_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 收藏表
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  post_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, post_id)
);

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  parent_id INTEGER DEFAULT 0,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'published',  -- pending/published/deleted
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 消息通知表
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type VARCHAR(32) NOT NULL,  -- like/comment/follow/system/mention
  title VARCHAR(100) NOT NULL,
  content TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 关注表
CREATE TABLE IF NOT EXISTS follows (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER NOT NULL,
  following_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id)
);

-- 余额表
CREATE TABLE IF NOT EXISTS user_balances (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0.00,
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  total_withdrawn DECIMAL(10,2) DEFAULT 0.00,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 余额变动表
CREATE TABLE IF NOT EXISTS balance_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type VARCHAR(32) NOT NULL,  -- recharge/withdraw/reward/consume/refund
  amount DECIMAL(10,2) NOT NULL,
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  description VARCHAR(255),
  order_no VARCHAR(64),
  status VARCHAR(20) DEFAULT 'completed',  -- pending/completed/failed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 会员等级表
CREATE TABLE IF NOT EXISTS member_levels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  price DECIMAL(10,2) DEFAULT 0.00,
  duration_days INTEGER DEFAULT 30,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type VARCHAR(32) NOT NULL,  -- member/vip/reward
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',  -- pending/paid/cancelled/refunded
  payment_method VARCHAR(32),
  transaction_id VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP
);

-- 内容审核表
CREATE TABLE IF NOT EXISTS content_reviews (
  id SERIAL PRIMARY KEY,
  post_id INTEGER,
  comment_id INTEGER,
  type VARCHAR(32) NOT NULL,  -- post/comment/report
  reason VARCHAR(255),
  result VARCHAR(32) DEFAULT 'pending',  -- pending/approved/rejected
  reviewed_by INTEGER,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 举报表
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  reporter_id INTEGER NOT NULL,
  reported_user_id INTEGER,
  post_id INTEGER,
  comment_id INTEGER,
  reason VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',  -- pending/processed/ignored
  handled_by INTEGER,
  handled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(50),
  role VARCHAR(20) DEFAULT 'admin',  -- admin/superadmin
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 管理员日志表
CREATE TABLE IF NOT EXISTS admin_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id INTEGER,
  detail JSONB DEFAULT '{}',
  ip VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 统计表
CREATE TABLE IF NOT EXISTS statistics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  new_users INTEGER DEFAULT 0,
  new_posts INTEGER DEFAULT 0,
  new_comments INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 支付配置表
CREATE TABLE IF NOT EXISTS payment_configs (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(50) UNIQUE NOT NULL,
  config_value TEXT,
  description VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 支付订单表
CREATE TABLE IF NOT EXISTS payment_orders (
  id SERIAL PRIMARY KEY,
  order_no VARCHAR(64) UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  type VARCHAR(32) NOT NULL,  -- recharge/withdraw/vip
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',  -- pending/paid/failed/cancelled
  payment_method VARCHAR(32),
  transaction_id VARCHAR(64),
  wx_prepay_id TEXT,
  wx_code_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP
);

-- 地区表
CREATE TABLE IF NOT EXISTS regions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  level INTEGER DEFAULT 1,  -- 1:省 2:市 3:区
  parent_code VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 敏感词表
CREATE TABLE IF NOT EXISTS sensitive_words (
  id SERIAL PRIMARY KEY,
  word VARCHAR(50) UNIQUE NOT NULL,
  level INTEGER DEFAULT 1,  -- 1:警告 2:替换 3:拦截
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户违规表
CREATE TABLE IF NOT EXISTS user_violations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type VARCHAR(32) NOT NULL,  -- spam/profanity/fraud/other
  description TEXT,
  penalty VARCHAR(32) DEFAULT 'warning',  -- warning/mute/ban
  expired_at TIMESTAMP,
  handled_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 短信验证码表
CREATE TABLE IF NOT EXISTS sms_codes (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(10) NOT NULL,
  type VARCHAR(20) DEFAULT 'login',
  used BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 朋友关系表
CREATE TABLE IF NOT EXISTS friends (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  friend_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',  -- pending/accepted/rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, friend_id)
);

-- 健康检查表
CREATE TABLE IF NOT EXISTS health_check (
  id SERIAL PRIMARY KEY,
  status VARCHAR(20) DEFAULT 'ok',
  message TEXT,
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_no ON payment_orders(order_no);
CREATE INDEX IF NOT EXISTS idx_realname_user ON realname_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_realname_status ON realname_verifications(status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_user ON feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_balance_user ON balance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_stats_date ON statistics(date);
