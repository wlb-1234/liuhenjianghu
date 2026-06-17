-- =============================================
-- 流痕江湖 - 初始化数据
-- 版本：v3.0.0
-- 创建时间：2026-06-17
-- =============================================

-- 1. 会员等级配置
INSERT INTO member_levels (level_code, level_name, level_name_en, price, coverage, coverage_level, daily_limit, retention_days, has_pin, sort_order, is_active) VALUES
('free', '免费用户', 'Free', 0, '仅所在镇/乡', 'town', 10, 7, false, 0, true),
('L1', '县级会员', 'County VIP', 9.00, '覆盖本县', 'county', 30, 15, false, 1, true),
('L2', '市级会员', 'City VIP', 50.00, '覆盖本市', 'city', 80, 30, false, 2, true),
('L3', '省级会员', 'Province VIP', 200.00, '覆盖本省', 'province', 200, 60, false, 3, true),
('L4', '全国级会员', 'National VIP', 2000.00, '覆盖全国', 'national', NULL, 90, true, 4, true)
ON CONFLICT (level_code) DO UPDATE SET
    level_name = EXCLUDED.level_name,
    price = EXCLUDED.price,
    coverage = EXCLUDED.coverage,
    coverage_level = EXCLUDED.coverage_level,
    daily_limit = EXCLUDED.daily_limit,
    retention_days = EXCLUDED.retention_days,
    has_pin = EXCLUDED.has_pin;

-- 2. 用户等级配置
INSERT INTO user_levels (level_code, level_name, level_name_en, icon, min_points, max_points, privileges, sort_order) VALUES
('L0', '路人', 'Passerby', '👤', 0, 99, '{"color": "#999999"}', 0),
('L1', '新秀', 'Rookie', '🌱', 100, 499, '{"color": "#00C853"}', 1),
('L2', '小卒', 'Soldier', '🎖️', 500, 1999, '{"color": "#2196F3"}', 2),
('L3', '侠客', 'Knight', '⚔️', 2000, 4999, '{"color": "#9C27B0"}', 3),
('L4', '大侠', 'Hero', '🏆', 5000, 9999, '{"color": "#FF9800"}', 4),
('L5', '宗师', 'Master', '👑', 10000, 49999, '{"color": "#F44336"}', 5),
('L6', '传说', 'Legend', '🌟', 50000, NULL, '{"color": "#FFD700"}', 6)
ON CONFLICT (level_code) DO UPDATE SET
    level_name = EXCLUDED.level_name,
    min_points = EXCLUDED.min_points,
    max_points = EXCLUDED.max_points;

-- 3. 积分商城配置
INSERT INTO points_shop (name, name_en, description, points_cost, type, value_json, stock, is_active, sort_order) VALUES
-- 会员类
('县级会员(1天)', 'County VIP (1 Day)', '解锁县级会员权限1天', 50, 'membership', '{"level": "L1", "days": 1}', NULL, true, 1),
('县级会员(7天)', 'County VIP (7 Days)', '解锁县级会员权限7天', 300, 'membership', '{"level": "L1", "days": 7}', NULL, true, 2),
('县级会员(30天)', 'County VIP (30 Days)', '解锁县级会员权限30天', 1000, 'membership', '{"level": "L1", "days": 30}', NULL, true, 3),
('市级会员(1天)', 'City VIP (1 Day)', '解锁市级会员权限1天', 100, 'membership', '{"level": "L2", "days": 1}', NULL, true, 4),
('市级会员(7天)', 'City VIP (7 Days)', '解锁市级会员权限7天', 600, 'membership', '{"level": "L2", "days": 7}', NULL, true, 5),
('市级会员(30天)', 'City VIP (30 Days)', '解锁市级会员权限30天', 2000, 'membership', '{"level": "L2", "days": 30}', NULL, true, 6),
('省级会员(1天)', 'Province VIP (1 Day)', '解锁省级会员权限1天', 200, 'membership', '{"level": "L3", "days": 1}', NULL, true, 7),
-- 置顶类
('置顶1小时', 'Pin 1 Hour', '内容置顶展示1小时', 50, 'pin', '{"hours": 1}', NULL, true, 10),
('置顶6小时', 'Pin 6 Hours', '内容置顶展示6小时', 250, 'pin', '{"hours": 6}', NULL, true, 11),
('置顶24小时', 'Pin 24 Hours', '内容置顶展示24小时', 800, 'pin', '{"hours": 24}', NULL, true, 12),
('置顶7天', 'Pin 7 Days', '内容置顶展示7天', 3000, 'pin', '{"hours": 168}', NULL, true, 13),
-- 称号类
('新秀称号', 'Rookie Badge', '展示新秀称号7天', 100, 'badge', '{"level": "L1", "days": 7}', NULL, true, 20),
('侠客称号', 'Knight Badge', '展示侠客称号7天', 500, 'badge', '{"level": "L3", "days": 7}', NULL, true, 21),
('大宗师称号', 'Master Badge', '展示大宗师称号7天', 2000, 'badge', '{"level": "L5", "days": 7}', NULL, true, 22),
-- 表情包
('专属表情包A', 'Special Emotes A', '解锁专属表情包系列A', 500, 'privilege', '{"emotes": "A"}', NULL, true, 30),
('专属表情包B', 'Special Emotes B', '解锁专属表情包系列B', 500, 'privilege', '{"emotes": "B"}', NULL, true, 31)
ON CONFLICT DO NOTHING;

-- 4. 搜索热词（示例）
INSERT INTO search_keywords (keyword, search_count, is_hot) VALUES
('附近美食', 1500, true),
('租房信息', 1200, true),
('求职招聘', 1000, true),
('二手交易', 900, true),
('拼车出行', 800, true),
('同城活动', 700, true),
('便民服务', 600, true),
('旅游攻略', 500, false),
('宠物领养', 400, false),
('家教兼职', 350, false)
ON CONFLICT DO NOTHING;

-- 5. 缓存配置（初始值）
INSERT INTO cache_configs (key_name, value, ttl, description) VALUES
('daily_sign_points', '5', 86400, '每日签到积分'),
('checkin_bonus_7days', '10', 86400, '连续签到7天额外奖励'),
('like_points', '2', 3600, '被点赞获得积分'),
('share_points', '5', 3600, '分享内容获得积分'),
('max_daily_sign_points', '50', 86400, '单日签到积分上限')
ON CONFLICT (key_name) DO UPDATE SET
    value = EXCLUDED.value,
    ttl = EXCLUDED.ttl;

-- 6. Webhook配置（占位，需要用户配置实际URL）
INSERT INTO webhook_configs (name, url, events, is_active) VALUES
('告警通知', 'https://your-webhook-url.com/alerts', '["alert"]', false),
('支付通知', 'https://your-webhook-url.com/payments', '["payment_paid"]', false)
ON CONFLICT DO NOTHING;

-- =============================================
-- 管理员账号（默认密码: admin123）
-- phone: 15600000000
-- 注意：生产环境请立即修改密码！
-- =============================================

INSERT INTO users (phone, nickname, avatar, bio, region_code, region_name, member_level, member_expire_at, user_rank, user_rank_level, total_points, points_balance) VALUES
('15600000000', '系统管理员', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop', '流痕江湖管理员账号', '110000', '北京市', 'L4', '2030-12-31 23:59:59', '传说', 6, 99999, 99999);

-- 获取刚创建的管理员ID并设置关联的user_points记录
DO $$
DECLARE
    admin_id UUID;
BEGIN
    SELECT id INTO admin_id FROM users WHERE phone = '15600000000';
    
    INSERT INTO user_points (user_id, balance, total_earned, total_spent)
    VALUES (admin_id, 99999, 99999, 0)
    ON CONFLICT (user_id) DO NOTHING;
END $$;

-- =============================================
-- 测试用户（用于开发测试）
-- phone: 13800138000 ~ 13800138004
-- 默认密码: test123
-- =============================================

DO $$
DECLARE
    i INTEGER;
    test_phone VARCHAR(20);
    test_nickname VARCHAR(50);
    test_id UUID;
BEGIN
    FOR i IN 0..4 LOOP
        test_phone := '13800138' || LPAD(i::TEXT, 3, '0');
        test_nickname := '测试用户' || (i + 1);
        
        INSERT INTO users (phone, nickname, region_code, region_name, member_level)
        VALUES (test_phone, test_nickname, '310000', '上海市', 'free')
        ON CONFLICT (phone) DO NOTHING;
        
        -- 获取用户ID并创建积分记录
        SELECT id INTO test_id FROM users WHERE phone = test_phone;
        IF test_id IS NOT NULL THEN
            INSERT INTO user_points (user_id, balance, total_earned, total_spent)
            VALUES (test_id, 100, 100, 0)
            ON CONFLICT (user_name) DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- =============================================
-- 完成
-- =============================================

-- 返回统计信息
SELECT 
    (SELECT COUNT(*) FROM member_levels) as member_levels_count,
    (SELECT COUNT(*) FROM user_levels) as user_levels_count,
    (SELECT COUNT(*) FROM points_shop) as shop_items_count,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM search_keywords) as hot_keywords_count;
