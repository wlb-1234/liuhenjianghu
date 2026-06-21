-- =============================================
-- 流痕江湖 - 数据库表结构
-- 版本：v3.0.0
-- 创建时间：2026-06-17
-- =============================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE,
    nickname VARCHAR(50) NOT NULL,
    avatar VARCHAR(500),
    bio TEXT,
    region_code VARCHAR(12), -- 行政区划代码
    region_name VARCHAR(100), -- 行政区划名称
    member_level VARCHAR(20) DEFAULT 'free', -- free, L1, L2, L3, L4
    member_expire_at TIMESTAMP WITH TIME ZONE, -- 会员过期时间
    points_balance INTEGER DEFAULT 0, -- 积分余额
    user_rank VARCHAR(20) DEFAULT '路人', -- 用户称号
    user_rank_level INTEGER DEFAULT 0, -- 用户等级Level
    total_points INTEGER DEFAULT 0, -- 累计积分
    is_blocked BOOLEAN DEFAULT FALSE,
    blocked_at TIMESTAMP WITH TIME ZONE,
    blocked_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户索引
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_region ON users(region_code);
CREATE INDEX idx_users_member_level ON users(member_level);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- 2. API密钥表
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_name VARCHAR(100) NOT NULL,
    api_key VARCHAR(64) UNIQUE NOT NULL,
    permissions JSONB DEFAULT '{"read": true, "write": false}',
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_keys_key ON api_keys(api_key);
CREATE INDEX idx_api_keys_user ON api_keys(user_id);

-- 3. IP白名单表
CREATE TABLE IF NOT EXISTS ip_whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address VARCHAR(45) NOT NULL,
    description VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ip_whitelist_ip ON ip_whitelist(ip_address);

-- 4. API调用日志表
CREATE TABLE IF NOT EXISTS api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(id),
    endpoint VARCHAR(200) NOT NULL,
    method VARCHAR(10) NOT NULL,
    params JSONB,
    response_status INTEGER,
    response_time INTEGER, -- 毫秒
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_logs_endpoint ON api_logs(endpoint);
CREATE INDEX idx_api_logs_created_at ON api_logs(created_at DESC);
CREATE INDEX idx_api_logs_api_key ON api_logs(api_key_id);

-- 5. 会员等级配置表
CREATE TABLE IF NOT EXISTS member_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level_code VARCHAR(20) UNIQUE NOT NULL, -- free, L1, L2, L3, L4
    level_name VARCHAR(50) NOT NULL,
    level_name_en VARCHAR(50),
    price DECIMAL(10,2) DEFAULT 0,
    coverage VARCHAR(100), -- 覆盖范围描述
    coverage_level VARCHAR(20), -- town, county, city, province, national
    daily_limit INTEGER, -- 每日发布限制，NULL表示不限
    retention_days INTEGER, -- 留存天数
    has_pin BOOLEAN DEFAULT FALSE, -- 是否有置顶权限
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 会员订阅表
CREATE TABLE IF NOT EXISTS member_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    level_code VARCHAR(20) NOT NULL,
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expire_at TIMESTAMP WITH TIME ZONE NOT NULL,
    auto_renew BOOLEAN DEFAULT FALSE,
    source VARCHAR(20) DEFAULT 'purchase', -- purchase, gift, admin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON member_subscriptions(user_id);
CREATE INDEX idx_subscriptions_expire ON member_subscriptions(expire_at);

-- 7. 支付订单表
CREATE TABLE IF NOT EXISTS payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no VARCHAR(64) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'CNY',
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid, cancelled, refunded
    payment_method VARCHAR(20), -- wechat, alipay
    payment_channel VARCHAR(50), -- yungouos, stripe
    out_trade_no VARCHAR(100), -- 第三方支付订单号
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_order_no ON payment_orders(order_no);
CREATE INDEX idx_orders_user ON payment_orders(user_id);
CREATE INDEX idx_orders_status ON payment_orders(status);
CREATE INDEX idx_orders_created_at ON payment_orders(created_at DESC);

-- 8. 积分表（用户积分汇总）
CREATE TABLE IF NOT EXISTS user_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 积分变动记录表
CREATE TABLE IF NOT EXISTS points_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- earn, spend
    action VARCHAR(50) NOT NULL, -- checkin, like, share, purchase, redeem
    points INTEGER NOT NULL, -- 正数表示获得，负数表示消耗
    balance_before INTEGER,
    balance_after INTEGER,
    description VARCHAR(200),
    related_id UUID, -- 关联ID（如订单ID、签到ID等）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_points_history_user ON points_history(user_id);
CREATE INDEX idx_points_history_action ON points_history(action);
CREATE INDEX idx_points_history_created ON points_history(created_at DESC);

-- 10. 积分商城表
CREATE TABLE IF NOT EXISTS points_shop (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    description TEXT,
    points_cost INTEGER NOT NULL,
    type VARCHAR(30) NOT NULL, -- membership, pin, badge, privilege
    value_json JSONB, -- 存储具体价值如 {"days": 1, "level": "L1"}
    stock INTEGER, -- NULL表示无限
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. 内容表（留言/帖子）
CREATE TABLE IF NOT EXISTS contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    images JSONB, -- 图片URL数组
    region_code VARCHAR(12), -- 发布的行政区划
    region_name VARCHAR(100),
    scope_level VARCHAR(20), -- 发布时的覆盖范围
    is_pinned BOOLEAN DEFAULT FALSE, -- 是否置顶
    is_featured BOOLEAN DEFAULT FALSE, -- 是否加精
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    retention_days INTEGER, -- 留存天数
    expire_at TIMESTAMP WITH TIME ZONE, -- 过期时间
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contents_user ON contents(user_id);
CREATE INDEX idx_contents_region ON contents(region_code);
CREATE INDEX idx_contents_pinned ON contents(is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX idx_contents_featured ON contents(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_contents_created ON contents(created_at DESC);
CREATE INDEX idx_contents_expire ON contents(expire_at) WHERE expire_at IS NOT NULL;

-- 12. 评论表
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- 回复
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_comments_content ON comments(content_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_created ON comments(created_at DESC);

-- 13. 点赞表
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, content_id),
    UNIQUE(user_id, comment_id)
);

CREATE INDEX idx_likes_content ON likes(content_id);
CREATE INDEX idx_likes_user ON likes(user_id);

-- 14. 关注表
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- 15. 通知表
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL, -- comment, like, follow, system, member_expire
    title VARCHAR(200) NOT NULL,
    content TEXT,
    data JSONB, -- 附加数据
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- 16. 举报表
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
    reason VARCHAR(50) NOT NULL, -- spam, abuse, illegal, other
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, reviewed, resolved, rejected
    handled_by UUID REFERENCES users(id),
    handled_at TIMESTAMP WITH TIME ZONE,
    result TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created ON reports(created_at DESC);

-- 17. 黑名单表
CREATE TABLE IF NOT EXISTS blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id UUID REFERENCES users(id) ON DELETE CASCADE,
    blocked_by UUID REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(target_id)
);

-- 18. 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID REFERENCES users(id),
    operator_name VARCHAR(50),
    action VARCHAR(100) NOT NULL, -- create, update, delete, login, logout
    target_type VARCHAR(50), -- user, content, member, order
    target_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_operation_logs_operator ON operation_logs(operator_id);
CREATE INDEX idx_operation_logs_action ON operation_logs(action);
CREATE INDEX idx_operation_logs_created ON operation_logs(created_at DESC);

-- 19. 每日签到表
CREATE TABLE IF NOT EXISTS daily_signs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sign_date DATE NOT NULL,
    points_earned INTEGER DEFAULT 5,
    consecutive_days INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, sign_date)
);

CREATE INDEX idx_daily_signs_user ON daily_signs(user_id);
CREATE INDEX idx_daily_signs_date ON daily_signs(sign_date DESC);

-- 20. 分享记录表
CREATE TABLE IF NOT EXISTS shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content_id UUID REFERENCES contents(id) ON DELETE SET NULL,
    platform VARCHAR(20) NOT NULL, -- wechat, weibo, qq, copy
    share_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shares_user ON shares(user_id);
CREATE INDEX idx_shares_content ON shares(content_id);
CREATE INDEX idx_shares_created ON shares(created_at DESC);

-- 21. 用户等级表
CREATE TABLE IF NOT EXISTS user_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level_code VARCHAR(20) UNIQUE NOT NULL,
    level_name VARCHAR(50) NOT NULL,
    level_name_en VARCHAR(50),
    icon VARCHAR(50), -- 称号图标
    min_points INTEGER DEFAULT 0,
    max_points INTEGER, -- NULL表示无上限
    privileges JSONB, -- 权限列表
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 22. 搜索热词表
CREATE TABLE IF NOT EXISTS search_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword VARCHAR(100) NOT NULL,
    search_count INTEGER DEFAULT 0,
    is_hot BOOLEAN DEFAULT FALSE,
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_search_keywords_hot ON search_keywords(is_hot) WHERE is_hot = TRUE;
CREATE INDEX idx_search_keywords_count ON search_keywords(search_count DESC);

-- 23. Webhook配置表
CREATE TABLE IF NOT EXISTS webhook_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    events JSONB NOT NULL, -- ["alert", "payment"]
    secret VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 24. 缓存配置表
CREATE TABLE IF NOT EXISTS cache_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_name VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    ttl INTEGER, -- 秒
    description VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 25. 预约发布表
CREATE TABLE IF NOT EXISTS scheduled_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    images JSONB,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    region_code VARCHAR(12),
    status VARCHAR(20) DEFAULT 'pending', -- pending, published, cancelled
    published_content_id UUID, -- 发布后的内容ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scheduled_user ON scheduled_posts(user_id);
CREATE INDEX idx_scheduled_time ON scheduled_posts(scheduled_at) WHERE status = 'pending';

-- =============================================
-- 函数和触发器
-- =============================================

-- 自动更新updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 用户表自动更新
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- 内容表自动更新
CREATE TRIGGER contents_updated_at
    BEFORE UPDATE ON contents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- 订单表自动更新
CREATE TRIGGER orders_updated_at
    BEFORE UPDATE ON payment_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- 积分表自动更新
CREATE TRIGGER points_updated_at
    BEFORE UPDATE ON user_points
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- 积分商城表自动更新
CREATE TRIGGER shop_updated_at
    BEFORE UPDATE ON points_shop
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =============================================
-- 权限设置
-- =============================================

-- 启用RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_signs ENABLE ROW LEVEL SECURITY;

-- 允许服务端角色访问所有数据
CREATE POLICY "service_role_all" ON users FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON contents FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON comments FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON likes FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON follows FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON notifications FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON points_history FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON user_points FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON daily_signs FOR ALL TO service_role USING (true);

-- 允许匿名用户注册（仅insert）
CREATE POLICY "anon_insert" ON users FOR INSERT TO anon WITH CHECK (true);

-- 允许认证用户查看自己的数据
CREATE POLICY "user_own_data" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "user_own_notifications" ON notifications FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_own_points" ON user_points FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_own_points_history" ON points_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_own_signs" ON daily_signs FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 19. 意见反馈表
CREATE TABLE IF NOT EXISTS feedbacks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    type VARCHAR(32) NOT NULL DEFAULT 'suggestion',  -- suggestion/bug/other
    content TEXT NOT NULL,
    contact VARCHAR(100),  -- 联系方式
    status VARCHAR(32) NOT NULL DEFAULT 'pending',  -- pending/processed/rejected
    reply TEXT,  -- 回复内容
    replied_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_user ON feedbacks(user_id);

-- =============================================
-- 完成
-- =============================================
