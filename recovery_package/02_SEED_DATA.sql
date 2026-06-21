-- ============================================
-- 流痕江湖 App 初始数据
-- 版本: v1.7.0
-- ============================================

-- 插入会员等级
INSERT INTO member_levels (name, price, duration_days, features, is_active) VALUES
('免费用户', 0, 0, '{"max_posts": 5, "max_images": 3, "can_vip": true}', true),
('月度会员', 9.90, 30, '{"max_posts": 50, "max_images": 9, "can_vip": false}', true),
('年度会员', 99.00, 365, '{"max_posts": -1, "max_images": 20, "can_vip": false}', true)
ON CONFLICT DO NOTHING;

-- 插入管理员账号 (密码: admin123)
INSERT INTO admins (username, password_hash, nickname, role) VALUES
('admin', '$2b$10$rQZ8K.wJqYrPQJZ5Bx5K6uKJQXZ0B8A0B5K6uKJQXZ0B8A0B5K6uK', '系统管理员', 'superadmin')
ON CONFLICT (username) DO NOTHING;

-- 插入地区数据
INSERT INTO regions (code, name, level, parent_code) VALUES
('110000', '北京市', 1, NULL),
('110100', '北京市', 2, '110000'),
('110101', '东城区', 3, '110100'),
('110102', '西城区', 3, '110100'),
('310000', '上海市', 1, NULL),
('310100', '上海市', 2, '310000'),
('310101', '黄浦区', 3, '310100'),
('310104', '徐汇区', 3, '310100'),
('440000', '广东省', 1, NULL),
('440100', '广州市', 2, '440000'),
('440103', '荔湾区', 3, '440100'),
('440104', '越秀区', 3, '440100'),
('440300', '深圳市', 2, '440000'),
('440306', '宝安区', 3, '440300')
ON CONFLICT (code) DO NOTHING;

-- 插入测试用户 (密码: 123456)
INSERT INTO users (phone, password_hash, nickname, avatar_url, bio, region_code, role, balance) VALUES
('13800138000', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZyMRiAR6W5e5Q5Z5Z5Z5Z', '小明', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', '热爱生活的旅行者', '110101', 'user', 100.00),
('13800138001', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZyMRiAR6W5e5Q5Z5Z5Z5Z', '小红', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', '喜欢摄影的文艺青年', '310101', 'user', 50.00),
('13800138002', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZyMRiAR6W5e5Q5Z5Z5Z5Z', '测试用户', '', '测试账号', '110102', 'user', 0.00)
ON CONFLICT (phone) DO NOTHING;

-- 插入测试漂流信
INSERT INTO posts (user_id, title, content, images, region_code, is_anonymous, likes_count, comments_count) VALUES
(1, '第一次来这里', '大家好，我是新来的小明，希望在这里认识更多朋友！', '{"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"}', '110101', false, 10, 3),
(2, '周末出游', '今天去了颐和园，天气特别好，拍了一些照片给大家看看。', '{"https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=800", "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800"}', '110101', false, 25, 8),
(1, '随手拍', '下班路上看到的晚霞，很美。', '{}', '310101', true, 5, 1)
ON CONFLICT DO NOTHING;

-- 初始化用户余额
INSERT INTO user_balances (user_id, balance) VALUES
(1, 100.00),
(2, 50.00),
(3, 0.00)
ON CONFLICT (user_id) DO NOTHING;

-- 插入敏感词
INSERT INTO sensitive_words (word, level) VALUES
('广告', 1),
('微信', 1),
('QQ', 1),
('电话', 1),
('赚钱', 2),
('赌博', 3),
('诈骗', 3)
ON CONFLICT (word) DO NOTHING;

-- 健康检查初始化
INSERT INTO health_check (status, message) VALUES ('ok', 'Database connected')
ON CONFLICT DO NOTHING;
