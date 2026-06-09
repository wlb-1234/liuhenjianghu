# 流痕江湖 - 项目文档

## 项目概述

江湖社交平台，支持帖子发布、会员系统、用户运营等核心功能。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React Native (Expo 54) + Expo Router |
| 后端 | Express.js (Node.js) |
| 数据库 | PostgreSQL (Supabase) |
| 部署 | Railway + GitHub 自动部署 |

## 数据库结构

### 核心表

#### users - 用户表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| phone | VARCHAR | 手机号（唯一） |
| nickname | VARCHAR | 昵称 |
| avatar | VARCHAR | 头像 URL |
| password_hash | VARCHAR | 密码哈希 |
| province_code | VARCHAR | 省份编码 |
| city_code | VARCHAR | 城市编码 |
| district_code | VARCHAR | 区县编码 |
| member_level | INTEGER | 会员等级 (0=普通) |
| member_expire_at | TIMESTAMP | 会员到期时间 |
| today_post_count | INTEGER | 今日发帖数 |
| last_post_date | DATE | 最后发帖日期 |
| total_likes | INTEGER | 总获赞数 |
| total_posts | INTEGER | 总发帖数 |
| created_at | TIMESTAMP | 创建时间 |
| last_sign_in_at | TIMESTAMP | 最后签到时间 |

#### posts - 帖子表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| user_id | INTEGER | 发帖用户 |
| content | TEXT | 帖子内容 |
| images | JSONB | 图片列表 |
| region_code | VARCHAR | 地区编码 |
| region_level | INTEGER | 地区级别 (1=省,2=市,3=区) |
| like_count | INTEGER | 点赞数 |
| comment_count | INTEGER | 评论数 |
| is_pinned | BOOLEAN | 是否置顶 |
| status | INTEGER | 状态 (1=正常,0=待审核) |
| expire_at | TIMESTAMP | 过期时间 |
| view_count | INTEGER | 浏览数 |
| created_at | TIMESTAMP | 创建时间 |

#### comments - 评论表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| post_id | INTEGER | 所属帖子 |
| user_id | INTEGER | 评论用户 |
| parent_id | INTEGER | 父评论 (回复) |
| content | TEXT | 评论内容 |
| status | INTEGER | 状态 (1=正常) |
| created_at | TIMESTAMP | 创建时间 |

#### likes - 点赞表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| user_id | INTEGER | 点赞用户 |
| post_id | INTEGER | 被赞帖子 |
| created_at | TIMESTAMP | 点赞时间 |

#### follows - 关注表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| follower_id | INTEGER | 关注者 |
| following_id | INTEGER | 被关注者 |
| created_at | TIMESTAMP | 关注时间 |

### 会员系统

#### member_levels - 会员等级表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| level | INTEGER | 等级 (1,2,3...) |
| name | VARCHAR | 等级名称 |
| price | NUMERIC | 价格 |
| region_limit | INTEGER | 可发帖地区数 |
| daily_limit | INTEGER | 每日发帖限制 |
| retention_days | INTEGER | 保留天数 |
| can_pin | BOOLEAN | 是否可置顶 |

#### orders - 订单表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| user_id | INTEGER | 购买用户 |
| level | INTEGER | 会员等级 |
| price | NUMERIC | 支付金额 |
| months | INTEGER | 月数 |
| payment_method | VARCHAR | 支付方式 |
| status | INTEGER | 状态 (0=待支付,1=已支付) |
| transaction_id | VARCHAR | 交易流水 |
| created_at | TIMESTAMP | 创建时间 |

#### payment_orders - 支付订单表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| order_no | VARCHAR | 订单号 |
| user_id | INTEGER | 用户 |
| member_level | INTEGER | 会员等级 |
| amount | NUMERIC | 金额 |
| payment_method | VARCHAR | 支付方式 |
| status | VARCHAR | pending/success/failed |
| expire_time | TIMESTAMP | 过期时间 |
| transaction_id | VARCHAR | 交易流水 |

#### earnings - 收益表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| order_id | INTEGER | 关联订单 |
| amount | NUMERIC | 总金额 |
| platform_ratio | NUMERIC | 平台比例 (0.30) |
| creator_ratio | NUMERIC | 创作者比例 (0.70) |
| platform_amount | NUMERIC | 平台收益 |
| creator_amount | NUMERIC | 创作者收益 |
| level | INTEGER | 会员等级 |

### 内容安全

#### sensitive_words - 敏感词表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| word | VARCHAR | 敏感词 |
| level | INTEGER | 级别 (1=轻度,2=中度,3=重度) |
| category | VARCHAR | 分类 |
| created_at | TIMESTAMP | 创建时间 |

#### reports - 举报表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| post_id | INTEGER | 被举报帖子 |
| user_id | INTEGER | 举报用户 |
| reason | VARCHAR | 举报原因 |
| status | INTEGER | 状态 (0=待处理,1=已处理) |
| created_at | TIMESTAMP | 举报时间 |

#### user_violations - 用户违规表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| user_id | INTEGER | 违规用户 |
| post_id | INTEGER | 关联帖子 |
| violation_type | VARCHAR | 违规类型 |
| content | TEXT | 违规内容 |
| penalty | INTEGER | 处罚类型 |
| expire_at | TIMESTAMP | 处罚到期时间 |
| status | INTEGER | 状态 |
| created_at | TIMESTAMP | 创建时间 |

#### content_reviews - 内容审核表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| content_type | VARCHAR | 内容类型 (post/comment) |
| content_id | INTEGER | 内容 ID |
| user_id | INTEGER | 发布用户 |
| text_content | TEXT | 文本内容 |
| image_urls | JSONB | 图片列表 |
| status | INTEGER | 状态 (0=待审核,1=通过,2=拒绝) |
| review_result | VARCHAR | 审核结果 |
| reviewer_id | INTEGER | 审核员 |
| created_at | TIMESTAMP | 创建时间 |
| reviewed_at | TIMESTAMP | 审核时间 |

### 运营系统

#### check_ins - 签到表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| user_id | INTEGER | 签到用户 |
| sign_date | DATE | 签到日期 |
| reward_exp | INTEGER | 奖励经验 |
| created_at | TIMESTAMP | 签到时间 |

#### notifications - 通知表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| user_id | INTEGER | 接收用户 |
| type | VARCHAR | 类型 (like/comment/follow/system) |
| title | VARCHAR | 标题 |
| content | TEXT | 内容 |
| data | JSONB | 扩展数据 |
| is_read | BOOLEAN | 是否已读 |
| created_at | TIMESTAMP | 创建时间 |

### 系统表

#### regions - 地区表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| code | VARCHAR | 地区编码 |
| name | VARCHAR | 地区名称 |
| parent_code | VARCHAR | 父级编码 |
| level | INTEGER | 级别 (1=省,2=市,3=区) |

#### admins - 管理员表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| username | VARCHAR | 用户名 |
| password_hash | VARCHAR | 密码哈希 |
| nickname | VARCHAR | 昵称 |
| role | VARCHAR | 角色 (admin/super_admin) |
| last_login | TIMESTAMP | 最后登录 |

#### admin_logs - 管理员日志表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| admin_id | INTEGER | 管理员 ID |
| action | VARCHAR | 操作 |
| target_user_id | INTEGER | 目标用户 |
| old_value | TEXT | 旧值 |
| new_value | TEXT | 新值 |
| reason | TEXT | 原因 |
| created_at | TIMESTAMP | 操作时间 |

#### sms_codes - 短信验证码表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| phone | VARCHAR | 手机号 |
| code | VARCHAR | 验证码 |
| expire_at | TIMESTAMP | 过期时间 |
| used | BOOLEAN | 是否已使用 |

## API 接口列表

### 基础信息
- Base URL: `https://liuhenjianghu-production.up.railway.app/api/v1`
- 认证方式: `Authorization: Bearer <token>`

### 认证相关 `/auth`
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /auth/register | 用户注册 | 否 |
| POST | /auth/login | 用户登录 | 否 |
| POST | /auth/logout | 登出 | 是 |
| GET | /auth/me | 获取当前用户 | 是 |

### 用户相关 `/users`
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /users/:id | 获取用户信息 | 否 |
| PUT | /users/profile | 更新个人资料 | 是 |

### 帖子相关 `/posts`
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /posts | 获取帖子列表 | 否 |
| POST | /posts | 发布帖子 | 是 |
| GET | /posts/:id | 获取帖子详情 | 否 |
| DELETE | /posts/:id | 删除帖子 | 是 |
| POST | /posts/:id/like | 点赞 | 是 |
| DELETE | /posts/:id/like | 取消点赞 | 是 |

### 评论相关 `/comments`
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /comments/post/:postId | 获取评论列表 | 否 |
| POST | /comments | 添加评论 | 是 |
| DELETE | /comments/:id | 删除评论 | 是 |

### 会员相关 `/members`
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /members/levels | 获取会员等级列表 | 否 |
| POST | /members/upgrade | 升级会员 | 是 |
| GET | /members/status | 获取会员状态 | 是 |

### 地区相关 `/regions`
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /regions | 获取地区列表 | 否 |
| GET | /regions/:code | 获取地区详情 | 否 |

### 敏感词 `/sensitive-words`
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /sensitive-words | 获取敏感词列表 | 是 |
| POST | /sensitive-words | 添加敏感词 | 是 |
| POST | /sensitive-words/check | 检测内容 | 是 |
| DELETE | /sensitive-words/:id | 删除敏感词 | 是 |

### 签到 `/check-in`
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /check-in/status | 获取签到状态 | 是 |
| POST | /check-in/sign | 签到 | 是 |
| GET | /check-in/calendar | 获取签到日历 | 是 |

### 通知 `/notifications`
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /notifications | 获取通知列表 | 是 |
| GET | /notifications/unread-count | 未读数量 | 是 |
| PUT | /notifications/:id/read | 标记已读 | 是 |
| PUT | /notifications/read-all | 全部已读 | 是 |
| DELETE | /notifications/:id | 删除通知 | 是 |

### 用户统计 `/user-stats`
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /user-stats/stats/overview | 运营概览 | 否 |
| GET | /user-stats/stats/content | 内容统计 | 否 |
| GET | /user-stats/leaderboard | 用户排行榜 | 否 |
| GET | /user-stats/me | 我的统计 | 是 |
| GET | /user-stats/:userId | 指定用户统计 | 是 |

### 审核 `/review`
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /review/queue | 获取审核队列 | 是 |
| POST | /review/:id/approve | 通过审核 | 是 |
| POST | /review/:id/reject | 拒绝审核 | 是 |

### 管理后台 `/admin`
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /admin/login | 管理员登录 | 否 |
| GET | /admin/users | 用户列表 | 是 |
| GET | /admin/users/:id | 用户详情 | 是 |
| POST | /admin/users/:id/ban | 封禁用户 | 是 |
| POST | /admin/users/:id/unban | 解封用户 | 是 |
| GET | /admin/posts | 帖子列表 | 是 |
| DELETE | /admin/posts/:id | 删除帖子 | 是 |
| GET | /admin/reports | 举报列表 | 是 |
| POST | /admin/reports/:id/handle | 处理举报 | 是 |
| GET | /admin/stats | 运营统计 | 是 |
| GET | /admin/logs | 操作日志 | 是 |

## 环境变量

### 后端必需
```env
NODE_ENV=production
PORT=8080

# Supabase 配置
COZE_SUPABASE_URL=https://hmlqsbhbbclbzfuutrie.supabase.co
COZE_SUPABASE_ANON_KEY=<your-anon-key>
COZE_SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Supabase 直连 IP (Railway 部署用)
# 主机: 13.114.6.6
# 数据库: postgres
# 用户: postgres.hmlqsbhbbclbzfuutrie
# 密码: Liuhen2026App

# JWT
JWT_SECRET=<your-jwt-secret>

# 跳过 SSL 验证
NODE_TLS_REJECT_UNAUTHORIZED=0
```

### 前端必需
```env
EXPO_PUBLIC_BACKEND_BASE_URL=https://liuhenjianghu-production.up.railway.app
```

## 部署配置

### Railway
- 项目: https://railway.app/project/liuhenjianghu
- 域名: https://liuhenjianghu-production.up.railway.app
- 区域: US West (California)

### 构建配置
- Builder: Dockerfile
- Start Command: `node dist/index.js`
- Root Directory: (空，使用项目根目录)

### 重要说明
1. Railway 项目级 PostgreSQL 插件会覆盖 DATABASE_URL
2. 需要在代码中硬编码 Supabase 直连 IP
3. 当前使用 IP: `13.114.6.6` (sslmode=disable)

## 前端页面结构

```
client/
├── app/
│   ├── _layout.tsx          # 根布局
│   ├── index.tsx            # 首页
│   ├── (tabs)/              # Tab 导航
│   │   ├── _layout.tsx
│   │   ├── index.tsx        # 首页
│   │   ├── explore.tsx      # 发现
│   │   └── profile.tsx      # 我的
│   ├── login.tsx            # 登录
│   ├── register.tsx         # 注册
│   ├── post/[id].tsx        # 帖子详情
│   ├── publish.tsx          # 发布帖子
│   ├── notifications.tsx    # 通知
│   ├── checkIn.tsx          # 签到
│   ├── sensitiveCheck.tsx   # 敏感词检测
│   └── moderation.tsx       # 审核管理
└── screens/
    ├── home/                # 首页
    ├── explore/            # 发现
    ├── profile/            # 个人中心
    ├── sensitiveCheck/      # 敏感词检测
    ├── checkIn/            # 签到
    ├── notifications/     # 通知
    └── moderation/         # 审核
```

## 经验值系统

### 等级表
| 等级 | 名称 | 经验范围 | 颜色 |
|------|------|----------|------|
| 1 | 初出茅庐 | 0-99 | #9CA3AF |
| 2 | 小有名气 | 100-499 | #22C55E |
| 3 | 江湖侠士 | 500-999 | #3B82F6 |
| 4 | 一代宗师 | 1000-4999 | #A855F7 |
| 5 | 武林盟主 | 5000+ | #F59E0B |

### 经验获取
| 行为 | 经验 |
|------|------|
| 每日签到 | 5-20 (递增) |
| 发帖被点赞 | 2 |
| 发帖被评论 | 3 |

## 会员等级

| 等级 | 名称 | 价格 | 地区限制 | 每日发帖 |
|------|------|------|----------|----------|
| 0 | 普通用户 | 免费 | 1 | 3 |
| 1 | 江湖弟子 | ¥30/月 | 3 | 10 |
| 2 | 江湖侠客 | ¥80/月 | 10 | 30 |
| 3 | 江湖豪杰 | ¥150/月 | 不限 | 不限 |

## 待完善功能

1. 图片内容审核（需集成第三方 API）
2. Redis 缓存
3. 前端错误上报（Sentry）
4. 推送通知
5. 用户反馈入口
6. 数据库索引优化
