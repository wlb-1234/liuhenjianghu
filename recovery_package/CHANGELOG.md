# 变更日志

## v1.5.0 (2026-06-20)
### 新增功能
- App启动屏和图标配置 - Expo Splash Screen 集成
- 深色模式 - 设置页面主题切换
- 评论功能 - 文章/视频评论、回复、点赞

### 新增补丁
- `04_CODE_PATCHES/comments.patch.md` - 评论功能

---

## v1.4.0 (2026-06-20)
### 新增功能
- 消息通知系统 `/notifications` - 系统公告、订单通知
- 收藏功能 `/favorites` - 收藏文章/视频
- 首页优化 - 分类筛选、公告轮播
- 数据统计 `/api/v1/statistics` - 访问量、用户、帖子统计
- 管理后台数据统计入口

### 新增补丁
- `04_CODE_PATCHES/notification_favorite.patch.md` - 通知与收藏功能

---

## v1.3.0 (2026-06-20)
### 新增功能
- 订单历史页面 `/orders` - 用户查看充值订单
- 余额明细页面 `/balance` - 用户查看余额和交易记录
- 管理后台支付管理 `/admin/payment` - 支付订单管理
- 管理后台内容管理 `/admin/content` - 文章内容管理
- 个人中心余额显示入口

### 新增补丁
- `04_CODE_PATCHES/order_balance.patch.md` - 订单与余额功能
- `04_CODE_PATCHES/admin_management.patch.md` - 管理后台功能

---

## v1.2.1 (2026-06-20)
### 修复
- 数据库连接改用 IPv4 直连 `13.114.6.6`
- 解决 DNS 解析到 IPv6 导致连接失败问题

### 补丁更新
- `00_ENV.md` - DATABASE_URL 改为 IPv4 直连
- `04_CODE_PATCHES/wechat_payment.patch.md` - 添加数据库连接说明

---

## v1.2.0 (2026-06-20)
### 新增功能
- 微信支付功能
- 支付订单表 payment_orders
- 用户余额表 user_balances
- 交易记录表 balance_transactions
- 支付配置表 payment_configs

### 新增补丁
- `04_CODE_PATCHES/wechat_payment.patch.md`

---

## v1.1.0 (2026-06-19)
### 新增功能
- 管理后台登录（账号: 15613594588, 密码: admin123）
- API 路由别名支持

### 新增补丁
- `04_CODE_PATCHES/admin_login.patch.md`
- `04_CODE_PATCHES/api_aliases.patch.md`

---

## v1.0.0 (2026-06-18)
### 初始版本
- 基础框架
- 用户认证
- 文章系统
- 会员系统

### 初始文件
- `00_ENV.md` - 环境变量配置
- `01_SCHEMA.sql` - 数据库表结构
- `02_SEED_DATA.sql` - 初始数据
- `04_CODE_PATCHES/static_path.patch.md` - 静态文件服务
