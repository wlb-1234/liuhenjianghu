# 流痕江湖 - 项目文档

**最后更新：2026-07-23 10:30 (北京时间)**

## 项目概述

江湖社交平台，支持帖子发布、会员系统、用户运营等核心功能。

---

## 快速开始

> 新会话开始时，复制以下信息即可快速了解项目状态。

### 关键地址

| 项目 | 地址 |
|------|------|
| **GitHub 仓库** | https://github.com/wlb-1234/liuhenjianghu |
| **项目文档** | `/workspace/projects/PROJECT_DOC.md` |
| **前端访问** | https://liuhenjianghu.com |
| **API 地址** | https://liuhenjianghu.com/api/v1 |
| **健康检查** | https://liuhenjianghu.com/api/v1/health |

### 服务器信息

| 项目 | 配置 |
|------|------|
| **服务器 IP** | 47.116.142.121 |
| **登录方式** | `ssh root@47.116.142.121` |
| **项目路径** | `/opt/liuhenjianghu` |
| **服务名称** | `liuhen-api` (PM2) |

### 常用命令

```bash
# 手动部署（SSH 登录后执行）
deploy

# 查看服务状态
pm2 status

# 重启服务
pm2 restart liuhen-api

# 查看日志
pm2 logs liuhen-api
```

### 自动部署

推送代码到 GitHub `main` 分支，GitHub Actions 自动部署到服务器。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React Native (Expo 54) + Expo Router |
| 后端 | Express.js (Node.js) |
| 数据库 | PostgreSQL (阿里云 RDS) |
| 缓存 | Redis (阿里云 Redis) |
| 对象存储 | 阿里云 OSS |
| 短信服务 | 阿里云 SMS |
| 服务器 | 阿里云 ECS (CentOS 8) |
| Web 服务器 | Nginx 1.24 |
| 进程管理 | PM2 |
| 域名 | liuhenjianghu.com |
| SSL 证书 | WoSign RSA_2048 (2026-07-21 ~ 2027-02-05) |

## 国内平台部署配置

### 服务器信息

| 项目 | 配置 |
|------|------|
| 云服务器 | 阿里云 ECS |
| 操作系统 | CentOS 8 |
| 公网 IP | 47.116.142.121 |
| 内网 IP | 172.17.212.20 |
| 域名 | liuhenjianghu.com / www.liuhenjianghu.com |
| SSL 证书 | WoSign RSA_2048 |
| 证书有效期 | 2026-07-21 ~ 2027-02-05 |
| Web 服务器 | Nginx 1.24 |
| 应用端口 | 8080 (HTTP) |
| HTTPS 端口 | 443 |
| 进程管理 | PM2 |
| 项目路径 | /opt/liuhenjianghu |

### 数据库配置 (阿里云 RDS PostgreSQL)

| 项目 | 配置 |
|------|------|
| 数据库类型 | PostgreSQL 14 |
| 主机 | pgm-uf6sc0v55a1p3r7m.pg.rds.aliyuncs.com |
| 端口 | 5432 |
| 数据库名 | liuhenjianghu |
| 用户名 | liuhenjianghu |
| 连接池 | 已配置 |
| SSL 模式 | disable |

### Redis 配置 (阿里云 Redis)

| 项目 | 配置 |
|------|------|
| 主机 | r-uf61g3n5d2vxfnqtj1.redis.rds.aliyuncs.com |
| 端口 | 6379 |
| 密码 | 已配置 (环境变量) |
| 连接状态 | ✅ 已连接 |
| 缓存类型 | 分布式缓存 |

### 对象存储配置 (阿里云 OSS)

| 项目 | 配置 |
|------|------|
| 服务 | 阿里云 OSS |
| Bucket | 已配置 |
| 访问域名 | 已配置 |
| 用途 | 图片、文件存储 |

### 短信服务配置 (阿里云 SMS)

| 项目 | 配置 |
|------|------|
| 服务 | 阿里云 SMS |
| 签名 | 已配置 |
| 模板 | 验证码模板已配置 |

### Nginx 配置

**配置文件：** `/etc/nginx/conf.d/liuhen.conf`

```nginx
# HTTP 自动跳转 HTTPS
server {
    listen 80;
    server_name liuhenjianghu.com www.liuhenjianghu.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS 配置
server {
    listen 443 ssl;
    server_name liuhenjianghu.com www.liuhenjianghu.com;
    
    ssl_certificate /etc/nginx/ssl/liuhenjianghu.com.pem;
    ssl_certificate_key /etc/nginx/ssl/liuhenjianghu.com.key;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### PM2 配置

**配置文件：** `/opt/liuhenjianghu/server/ecosystem.config.cjs`

```javascript
module.exports = {
  apps: [{
    name: 'liuhen-api',
    script: './dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env_file: './.env',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    }
  }]
};
```

### 环境变量配置

**配置文件：** `/opt/liuhenjianghu/server/.env`

```env
# 数据库
DATABASE_URL=postgresql://liuhenjianghu:****@pgm-uf6sc0v55a1p3r7m.pg.rds.aliyuncs.com:5432/liuhenjianghu?sslmode=disable

# Redis
REDIS_HOST=r-uf61g3n5d2vxfnqtj1.redis.rds.aliyuncs.com
REDIS_PORT=6379
REDIS_PASSWORD=****

# JWT
JWT_SECRET=****

# 阿里云 OSS
OSS_ACCESS_KEY_ID=****
OSS_ACCESS_KEY_SECRET=****
OSS_BUCKET=****
OSS_ENDPOINT=****

# 阿里云 SMS
SMS_ACCESS_KEY_ID=****
SMS_ACCESS_KEY_SECRET=****
SMS_SIGN_NAME=****
SMS_TEMPLATE_CODE=****
```

---

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
- Base URL: `https://server-production-64d28.up.railway.app/api/v1`
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

**说明**: 提供完整的四级行政区划数据（省/市/区县/街道），支持模糊搜索、路径查询等功能。

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /regions/provinces | 省级列表 | 是 |
| GET | /regions/cities/:code | 城市列表 | 是 |
| GET | /regions/districts/:code | 区县列表 | 是 |
| GET | /regions/streets/:code | 街道列表 | 是 |
| GET | /regions/children/:code | 通用下级查询 | 是 |
| GET | /regions/search?keyword= | 模糊搜索 | 是 |
| GET | /regions/path/:code | 完整路径查询 | 是 |
| GET | /regions/stats | 数据统计 | 否 |
| GET | /regions/city/:code | 城市详情(含坐标) | 是 |
| GET | /regions/district/:code | 区县详情 | 是 |
| GET | /regions/street/:code | 街道详情 | 是 |

**详细API文档**: 见下方「行政区划API」章节

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

## Railway 连接 Supabase 主库（IPv6 方案）

### 问题背景
Railway 容器默认禁用 Outbound IPv6，无法连接 Supabase 主库（IPv6 only）。

### 解决方案
1. **Railway 控制台**：Settings → Networking → Enable Outbound IPv6 → ON
2. **代码配置**：使用 Supabase 直连域名

### Railway IPv6 配置步骤（2026-06-25 更新）

#### 步骤 1：启用 Outbound IPv6
1. 登录 Railway 控制台
2. 进入 **server** 项目（后端）
3. 点击 **Settings** 标签
4. 找到 **Networking** 部分
5. 将 **Enable Outbound IPv6** 开关设为 **ON**
6. 点击 **Redeploy** 重新部署服务

#### 步骤 2：配置数据库连接
数据库连接字符串格式：
```
postgresql://postgres:<密码>@db.hmlqsbhbbclbzfuutrie.supabase.co:5432/postgres
```

当前配置：
- 主机：`db.hmlqsbhbbclbzfuutrie.supabase.co`
- 端口：`5432`
- 用户名：`postgres`
- 数据库：`postgres`

### Railway 部署数据库配置（2026-06-25 更新）

```typescript
// server/src/config/database.ts
import { Pool } from 'pg';

function getDatabaseUrl(): string {
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || 'Liuhen2026App';
  
  // Supabase 直连地址（IPv6 已启用）
  const supabaseHost = 'db.hmlqsbhbbclbzfuutrie.supabase.co';
  
  // Supabase 用户名是 "postgres"
  return `postgresql://postgres:${dbPassword}@${supabaseHost}:5432/postgres?sslmode=require`;
}
```

### Railway 环境变量

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | `postgresql://postgres:Liuhen2026App@db.hmlqsbhbbclbzfuutrie.supabase.co:5432/postgres` | 完整数据库连接字符串 |
| `SUPABASE_DB_PASSWORD` | `Liuhen2026App` | 数据库密码（可选，代码中有默认值） |

### ⚠️ 重要注意事项

1. **Railway IPv6 配置**
   - Settings → Networking → Enable Outbound IPv6 = ON
   - 启用后需要 Redeploy 服务才能生效
   - 配置位置：server 项目的 Settings 页面

2. **Railway 静态出口 IP（可选）**
   - 可启用 Static Outbound IPs 获得固定 IP
   - 适用于需要 IP 白名单的场景

3. **PostgreSQL vs MySQL 语法**
   - 参数占位符：`$1, $2`（不是 `?`）
   - 结果访问：`result.rows[0]`（不是 `result[0]`）
   - `pooler.supabase.com` → 需要用 IP `13.114.6.6`
   - `db.hmlqsbhbbclbzfuutrie.supabase.co` → 需要启用 IPv6

4. **数据库字段差异**
   - 主库（通过 exec_sql 访问）和 Railway 读副本字段可能不同
   - 当前代码已适配 Railway 数据库（使用 `password` 而非 `password_hash`，无 `exp` 列）

### 本地开发数据库连接

本地开发环境直接使用 Supabase Pooler：

```typescript
// 使用 Supabase 官方客户端
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### 恢复数据库表结构

如果需要在新 Supabase 项目初始化表结构，执行：

```sql
-- users 表（基础字段）
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  nickname VARCHAR(50),
  avatar VARCHAR(500),
  password VARCHAR(255),
  region_code VARCHAR(10),
  vip_level INTEGER DEFAULT 0,
  vip_expires_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 其他表结构参考 PROJECT_DOC.md 完整列表
```

---

## 安全机制 (2024-06-10)

### 已实现的安全措施

| 安全项 | 实现方式 | 说明 |
|--------|----------|------|
| 密码加密 | bcrypt | 密码使用 bcrypt 哈希存储 |
| SQL 注入防护 | 参数化查询 | 所有 SQL 使用 `$1, $2` 参数 |
| XSS 防护 | 输入过滤 + HTML转义 | `client/utils/xss.ts` |
| CSRF 防护 | CSRF Token | POST/PUT/DELETE 需验证 |
| 越权访问 | 认证中间件 | 敏感接口需登录 |
| 日志脱敏 | 敏感字段屏蔽 | password/token 显示为 `***` |

### 安全配置

```typescript
// 后端 CSRF 中间件
// server/src/middleware/csrfProtection.ts

// 前端 XSS 防护
// client/utils/xss.ts
```

---

### 内容反垃圾

**更新时间**: 2026-06-10 14:45

#### 相似内容频率限制

**功能说明**: 同一用户在同城、同一天发布的相似广告内容不得超过2条，用于防止刷屏广告。

**实现方案**:
- 字符级 N-gram 分词 (3-gram)
- Jaccard 相似度算法
- 相似度阈值: 30%

**文件位置**:
- 服务端: `server/src/services/contentSimilarityService.ts`
- 调用位置: `server/src/routes/posts.ts`

**API 逻辑**:
```typescript
// 发帖前检查
const limitCheck = checkContentLimit(content, existingPosts, 2);
// 超过阈值返回错误
{
  "error": "今日该区域已发布 2 条相似内容，请稍后再试",
  "similarCount": 2,
  "maxSimilar": 3
}
```

**检测规则**:
- 区域范围: 按 region_code 匹配
- 时间范围: 当天 (00:00 - 23:59)
- 相似度计算: Jaccard(交集/并集) ≥ 0.30

---

## 部署配置

### Railway
- 项目: https://railway.app/project/liuhenjianghu
- 域名: https://server-production-64d28.up.railway.app
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
2. ~~Redis 缓存~~ ✅ 已配置 (2026-07-22)
3. 前端错误上报（Sentry）
4. 推送通知
5. 用户反馈入口
6. 数据库索引优化

---

## 部署配置 (2026-07-22 更新)

### 部署方式

#### 方式 1：GitHub Actions 自动部署（推荐）

**触发条件**：推送代码到 main 分支

**工作流文件**：`.github/workflows/deploy.yml`

**配置 Secrets**（GitHub → Settings → Secrets and variables → Actions）：

| Secret 名称 | 值 | 说明 |
|------------|-----|------|
| SSH_HOST | 47.116.142.121 | 服务器 IP |
| SSH_USER | root | 登录用户 |
| SSH_KEY | -----BEGIN OPENSSH PRIVATE KEY-----... | SSH 私钥 |
| DEPLOY_PATH | /opt/liuhenjianghu | 项目路径 |

**部署流程**：
1. 开发者推送代码到 GitHub main 分支
2. GitHub Actions 自动触发
3. SSH 连接服务器
4. 执行 `git pull` → `pnpm install` → `pnpm run build` → `pm2 restart`
5. 部署完成

**优点**：全自动，无需人工干预

---

#### 方式 2：手动部署（备用）

**适用场景**：GitHub 访问异常时

**部署命令**：
```bash
ssh root@47.116.142.121
cd /opt/liuhenjianghu
deploy
```

**部署脚本**：`/opt/liuhenjianghu/deploy.sh`

```bash
#!/bin/bash
echo "=== 开始部署 ==="
cd /opt/liuhenjianghu
git pull origin main || echo "⚠️ Git pull 失败，使用现有代码继续部署"
cd server
pnpm install
pnpm run build
pm2 restart liuhen-api
echo "=== 部署完成 $(date) ==="
```

**优点**：简单直接，一条命令搞定

---

### 服务器环境

| 项目 | 配置 |
|------|------|
| 操作系统 | CentOS 8 |
| Node.js | 24.x |
| pnpm | 最新版 |
| PM2 | 最新版 |
| Nginx | 1.24 |
| 项目路径 | /opt/liuhenjianghu |
| 服务名称 | liuhen-api |

---

### PM2 管理命令

```bash
# 查看状态
pm2 status

# 重启服务
pm2 restart liuhen-api

# 查看日志
pm2 logs liuhen-api

# 停止服务
pm2 stop liuhen-api

# 开机自启
pm2 startup
pm2 save
```

---

### Nginx 配置

**配置文件**：`/etc/nginx/conf.d/liuhen.conf`

- HTTP (80) → 自动跳转 HTTPS
- HTTPS (443) → 反向代理到 localhost:8080
- SSL 证书：`/etc/nginx/ssl/liuhenjianghu.com.pem`

---

### 部署历史

| 日期 | 操作 | 说明 |
|------|------|------|
| 2026-07-23 10:30 | 补全镇级数据 | 补充 306 个区县镇级数据，实现全国全覆盖 |
| 2026-07-23 09:46 | 修复短信服务 | 环境变量名称兼容 SMS_ACCESS_KEY_ID |
| 2026-07-22 | 配置 GitHub Actions | 自动部署工作流 |
| 2026-07-22 | 配置手动部署脚本 | deploy 命令 |
| 2026-07-22 | 配置 Redis 缓存 | 阿里云 Redis |
| 2026-07-22 | 配置 HTTPS | SSL 证书 |
| 2026-07-21 | 国内平台部署 | 阿里云 ECS + RDS |

---

# 中国行政区划API

**文档更新时间**: 2026-06-15 15:00:00

## 一、数据概览

| 级别 | 数量 | 数据来源 |
|------|------|----------|
| 省级 | 34个 | 中华人民共和国民政部标准 |
| 城市 | 364个 | 中华人民共和国民政部标准 |
| 区县 | 2843个 | 中华人民共和国民政部标准 |
| 乡级 | 38721个 | 中华人民共和国民政部标准 |

### 乡级数据明细
| 类型 | 数量 |
|------|------|
| 街道 | 9,148个 |
| 镇 | 21,554个 |
| 乡 | 6,910个 |
| 民族乡 | 955个 |
| 苏木 | 154个 |

### 港澳台数据
| 地区 | 城市/区 | 区县/区 |
|------|---------|----------|
| 台湾省 | 20个城市 | 333个区县 |
| 香港特别行政区 | 1个城市 | 18个区 |
| 澳门特别行政区 | 1个城市 | 8个区 |

---

## 二、编码规则

### 行政区划代码结构
```
省级(2位) + 城市(2位) + 区县(2位) + 街道(3位)
  11        01        01        001
  ↑         ↑         ↑         ↑
  北京市   北京市    东城区    东华门街道
```

### 省级代码范围
| 范围 | 地区 |
|------|------|
| 11-15 | 华北地区（北京、天津、河北、山西、内蒙古） |
| 21-23 | 东北地区（辽宁、吉林、黑龙江） |
| 31-37 | 华东地区（上海、江苏、浙江、安徽、福建、江西、山东） |
| 41-46 | 华中地区（河南、湖北、湖南） + 华南地区（广东、广西、海南） |
| 50-54 | 西南地区（重庆、四川、贵州、云南、西藏） |
| 61-65 | 西北地区（陕西、甘肃、青海、宁夏、新疆） |
| 71 | 台湾省 |
| 81 | 香港特别行政区 |
| 82 | 澳门特别行政区 |

---

## 三、数据模型

### Province (省级)
```typescript
interface Province {
  code: string;        // 2位代码，如 "11"
  name: string;        // 名称，如 "北京市"
  lat?: number;       // 纬度 (仅省级有)
  lng?: number;       // 经度 (仅省级有)
}
```

### City (城市)
```typescript
interface City {
  code: string;       // 4位代码，如 "1101"
  name: string;       // 名称，如 "市辖区"
  provinceCode: string; // 所属省份，如 "11"
  lat?: number;       // 纬度
  lng?: number;       // 经度
}
```

### District (区县)
```typescript
interface District {
  code: string;       // 6位代码，如 "110101"
  name: string;        // 名称，如 "东城区"
  cityCode: string;    // 所属城市，如 "1101"
}
```

### Street (街道)
```typescript
interface Street {
  code: string;        // 9位代码，如 "110101001"
  name: string;        // 名称，如 "东华门街道"
  districtCode: string; // 所属区县，如 "110101"
}
```

---

## 四、API接口详情

### 基础信息
- **Base URL**: `http://localhost:9091/api/v1` (本地)
- **认证方式**: `x-api-key: sk_dev_key_abc123`
- **限流**: 100次/分钟

### 4.1 省级列表
```
GET /regions/provinces
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "code": "11",
      "name": "北京市",
      "lat": 39.9042,
      "lng": 116.4074
    },
    {
      "code": "71",
      "name": "台湾省",
      "lat": 23.6978,
      "lng": 120.9605
    }
  ],
  "cached": false
}
```

### 4.2 城市列表
```
GET /regions/cities/:code
```

**参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| code | string | 省级代码（2位） |

**示例**: `GET /regions/cities/44` (广东省)

### 4.3 区县列表
```
GET /regions/districts/:code
```

**参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| code | string | 城市代码（4位） |

**示例**: `GET /regions/districts/4401` (广州市)

### 4.4 街道列表
```
GET /regions/streets/:code
```

**参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| code | string | 区县代码（6位） |

**示例**: `GET /regions/streets/440103` (越秀区)

### 4.5 通用下级查询
```
GET /regions/children/:code
```

**功能**: 根据任意code自动查询下级数据

**示例**:
- `GET /regions/children/11` → 返回北京市下级城市
- `GET /regions/children/1101` → 返回北京市辖区列表
- `GET /regions/children/4401` → 返回广州市辖区列表
- `GET /regions/children/440103` → 返回越秀区街道列表
- `GET /regions/children/71` → 返回台湾省城市列表
- `GET /regions/children/81` → 返回香港特别行政区区列表

### 4.6 模糊搜索
```
GET /regions/search?keyword=<关键词>
```

**参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| keyword | string | 搜索关键词 |

**响应示例**:
```json
{
  "success": true,
  "keyword": "广州",
  "data": [
    { "code": "4401", "name": "广州市", "level": 2 },
    { "code": "440103", "name": "越秀区", "level": 3 },
    { "code": "440104", "name": "海珠区", "level": 3 }
  ],
  "total": 3
}
```

### 4.7 完整路径查询
```
GET /regions/path/:code
```

**功能**: 查询任意code的完整上级路径

**示例**: `GET /regions/path/440103001`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "code": "440103001",
    "name": "洪桥街道",
    "level": 4,
    "path": [
      { "code": "44", "name": "广东省", "level": 1 },
      { "code": "4401", "name": "广州市", "level": 2 },
      { "code": "440103", "name": "越秀区", "level": 3 },
      { "code": "440103001", "name": "洪桥街道", "level": 4 }
    ]
  }
}
```

### 4.8 数据统计
```
GET /regions/stats
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "provinces": 34,
    "cities": 364,
    "districts": 2843,
    "streets": 38721,
    "total": 41962,
    "hkMacauTaiwan": {
      "taiwan": { "cities": 20, "districts": 333 },
      "hongKong": { "districts": 18 },
      "macau": { "districts": 8 }
    }
  },
  "cached": true
}
```

---

## 五、响应状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 缺少API密钥 |
| 403 | API密钥无效 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

### 错误响应格式
```json
{
  "success": false,
  "error": "错误信息",
  "code": "ERROR_CODE"
}
```

---

## 六、认证说明

### 公开接口（无需认证）
| 接口 | 说明 |
|------|------|
| `GET /regions/stats` | 数据统计 |
| `GET /health` | 健康检查 |
| `GET /api-docs` | Swagger文档 |

### 认证接口
除公开接口外，其他接口需要在请求头中携带:
```
x-api-key: sk_dev_key_abc123
```

### 密钥配置
开发/生产环境可配置不同的API密钥，详见 `server/src/middleware/apiKeyAuth.ts`

---

## 七、限流配置

- **限制**: 100次/分钟
- **窗口**: 滑动窗口
- **响应头**:
  - `X-RateLimit-Limit`: 100
  - `X-RateLimit-Remaining`: 剩余次数
  - `X-RateLimit-Reset`: 重置时间戳

### 限流响应
```json
{
  "success": false,
  "error": "请求过于频繁，请稍后再试",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

---

## 八、数据更新记录

| 日期 | 版本 | 更新内容 |
|------|------|----------|
| 2026-06-15 | v1.0 | 初始版本，包含完整四级行政区划数据 |
| 2026-06-15 | v1.1 | 添加经纬度坐标支持 |
| 2026-06-15 | v1.2 | 匹配民政部2025年12月统计数据 |

---

## 九、文件结构

```
server/
├── src/
│   ├── routes/
│   │   └── regions.ts        # 行政区划路由与数据
│   ├── middleware/
│   │   ├── apiKeyAuth.ts    # API密钥认证
│   │   ├── rateLimiter.ts   # 接口限流
│   │   ├── cache.ts         # 缓存管理
│   │   ├── stats.ts         # 统计中间件
│   │   └── logger.ts        # 请求日志
│   ├── config/
│   │   └── swagger.ts       # Swagger配置
│   └── data/
│       └── coordinates.ts   # 经纬度坐标数据
└── package.json
```

---

## 十、测试文件

| 文件 | 说明 |
|------|------|
| `test_results/regions_api_test_report_final.md` | 完整测试报告 |
| `test_results/regions_api_data_structure.md` | 数据结构文档 |

---

## 变更日志

### 2026-06-28

#### 前端白屏问题修复 (15:49)

| 时间 | 变更内容 | 文件 |
|------|----------|------|
| 15:30 | 修正后端 API 地址从前端域名改为真正的后端服务地址 | client/Dockerfile, client/components/ColorSchemeUpdater.tsx |
| 15:35 | 简化 Provider 组件，移除 HeroUINativeProvider 等导致渲染失败的组件 | client/components/Provider.tsx |
| 15:40 | 删除 app/index.tsx，让 (tabs)/index.tsx 作为首页 | client/app/index.tsx |
| 15:45 | 移除 app.config.ts 中的 "output": "single" 配置 | client/app.config.ts |
| 15:49 | 登录页面恢复正常显示 | - |

**问题根因：**
1. `EXPO_PUBLIC_BACKEND_BASE_URL` 环境变量错误地指向了前端网站域名 `https://liuhenjianghu.com`，导致 API 请求被前端路由拦截
2. `Provider` 组件中的 `HeroUINativeProvider` 导致了渲染失败

**修复方案：**
1. 将 `EXPO_PUBLIC_BACKEND_BASE_URL` 改为后端服务地址 `https://server-production-d2bda.up.railway.app`
2. 简化 `Provider` 组件，只保留 `AuthProvider` 和 `GestureHandlerRootView`

### 2025-06-11

#### UI/前端优化

| 时间 | 变更内容 | 文件 |
|------|----------|------|
| 21:30 | 登录页面黑金武侠风格改造完成 | screens/auth/LoginScreen.tsx |
| 21:45 | 添加金色渐变和发光效果 | screens/auth/LoginScreen.tsx |
| 21:50 | 添加水墨金点背景装饰效果 | screens/auth/LoginScreen.tsx |
| 22:00 | 添加左上角水纹装饰（SVG波浪线） | screens/auth/LoginScreen.tsx |
| 22:15 | 调整字号确保文字横排显示 | screens/auth/LoginScreen.tsx |
| 22:30 | 优化输入框、按钮金色效果 | screens/auth/LoginScreen.tsx |

#### Railway 前端部署修复 (23:41)

| 时间 | 变更内容 | 文件 |
|------|----------|------|
| 23:00 | 移除 package.json 的 packageManager 字段避免 pnpm 版本锁定 | client/package.json |
| 23:05 | 修改 Dockerfile 使用 npm 替代 pnpm | client/Dockerfile |
| 23:10 | 添加 build 脚本用于 Railway 构建 | client/package.json |
| 23:35 | 修复 nginx.conf root 路径从 /app 改为 /usr/share/nginx/html | client/nginx.conf |
| 23:38 | 修复 nginx.conf 端口从 8080 改为 80 | client/nginx.conf |
| 23:40 | 更新 railway.json 配置 | client/railway.json |

#### Railway Settings 配置

| 配置项 | 值 | 说明 |
|--------|-----|------|
| Root Directory | client | 代码根目录 |
| Builder | DOCKERFILE | 使用 Dockerfile 构建 |
| Dockerfile Path | Dockerfile | Dockerfile 路径 |
| Custom Build Command | npm install && npm run build | 构建命令 |
| Custom Start Command | nginx -g 'daemon off;' | 启动命令 |
| Teardown | 启用 | 新部署时终止旧部署 |

#### 前端访问地址

| 环境 | 域名 | 状态 |
|------|------|------|
| 生产 | https://expo-app-production-c11a.up.railway.app | ✅ 正常 |

#### 设计方案

| 版本 | 日期 | 内容 |
|------|------|------|
| 方案D | 2025-06-11 | 黑金武侠风格：毛笔书法烫金色标题 + 水墨纹理背景 + 金色边框输入框 + 渐变金色按钮 |

---

## 2026-06-16 功能完善

### Web管理后台完成 (16:00)

| 功能 | 状态 | 说明 |
|------|------|------|
| JavaScript/TypeScript SDK | ✅ | npm包一键集成 |
| 反向地理编码API | ✅ | 根据经纬度返回行政区划 |
| IP白名单功能 | ✅ | 限制API访问IP |
| Web管理后台 | ✅ | 可视化管理界面 |

### 新增文件

| 文件 | 功能 |
|------|------|
| `sdk/javascript/` | NPM SDK包 |
| `server/public/admin.html` | Web管理后台 |
| `server/src/routes/reverse.ts` | 反向地理编码 |
| `server/src/middleware/ipWhitelist.ts` | IP白名单中间件 |
| `server/src/routes/whitelist.ts` | 白名单管理API |

### Web管理后台功能

- **仪表盘**: API统计、缓存状态、告警信息
- **API密钥管理**: 创建、禁用、删除API密钥
- **IP白名单管理**: 添加、删除允许访问的IP
- **调用日志**: 查看API调用记录
- **缓存管理**: 查看/清理缓存
- **告警配置**: Webhook配置、告警历史

### API路由清单

| 路由 | 功能 |
|------|------|
| `GET /api/v1/stats` | 系统统计 |
| `GET /api/v1/apikeys` | API密钥列表 |
| `POST /api/v1/apikeys` | 创建密钥 |
| `DELETE /api/v1/apikeys/:id` | 删除密钥 |
| `GET /api/v1/logs` | 调用日志 |
| `GET /api/v1/cache` | 缓存状态 |
| `POST /api/v1/cache/clear` | 清理缓存 |
| `GET /api/v1/whitelist` | IP白名单 |
| `POST /api/v1/whitelist` | 添加IP |
| `DELETE /api/v1/whitelist/:ip` | 删除IP |
| `GET /api/v1/geo/reverse` | 反向地理编码 |
| `GET /api/v1/alerts` | 告警统计 |

### 访问地址

| 服务 | 地址 | 状态 |
|------|------|------|
| Web管理后台 | http://localhost:8080/admin | ✅ 本地运行 |
| API服务 | http://localhost:8080/api/v1 | ✅ 本地运行 |
| Swagger文档 | http://localhost:8080/api-docs | ✅ 本地运行 |

---

## 2026-06-12 新增功能开发

### 功能开发记录

| 时间 | 功能 | 文件 |
|------|------|------|
| 22:38 | 完善管理后台 - 添加顶部导航栏、举报管理入口 | client/app/admin/_layout.tsx, screens/admin/ReportsScreen.tsx |
| 22:45 | 添加举报管理页面（查看/处理用户举报） | client/screens/admin/ReportsScreen.tsx, app/admin/reports.tsx |
| 22:50 | 开发收藏功能 - 后端 API | server/src/routes/collections.ts |
| 22:55 | 添加收藏数据库表结构 | server/src/storage/database/shared/schema.ts |
| 23:00 | 开发收藏前端页面 | client/screens/collection/index.tsx, app/(tabs)/collection.tsx |
| 23:10 | 开发分享功能 - ShareButton组件 | client/components/Share/ShareButton.tsx |
| 23:15 | 添加分享落地页 | client/app/post/[id].tsx |
| 23:20 | 修复 app/index.tsx 路由冲突 | client/app/index.tsx (已删除) |
| 23:30 | 开发聊天功能 - 后端 API | server/src/routes/messages.ts |
| 23:35 | 添加聊天数据库表结构（conversations/messages） | server/src/storage/database/shared/schema.ts |
| 23:40 | 开发聊天前端页面（会话列表、私信） | client/screens/chat/index.tsx, [userId]/index.tsx |
| 23:50 | 添加帖子详情私信入口 | client/app/post-detail/index.tsx |
| 23:55 | 开发搜索功能 - 后端 API | server/src/routes/search.ts |
| 24:00 | 开发搜索前端页面 | client/screens/search/index.tsx, app/(tabs)/search.tsx |
| 24:10 | 添加后端 Railway 部署配置 | server/Dockerfile, server/railway.json |
| 24:15 | 修复后端构建错误（导入路径、重复定义） | server/src/storage/database/shared/schema.ts |

### 新增页面

| 页面 | 路径 | 功能 |
|------|------|------|
| 收藏 | /collection | 我的收藏列表 |
| 聊天列表 | /chat | 会话列表 |
| 私信 | /chat/[userId] | 与用户一对一聊天 |
| 搜索 | /search | 搜索用户和帖子 |
| 举报管理 | /admin/reports | 管理用户举报 |

### 新增 API

| API | 方法 | 功能 |
|-----|------|------|
| /api/v1/collections | GET/POST/DELETE | 收藏列表、添加/取消收藏 |
| /api/v1/messages/conversations | GET | 获取会话列表 |
| /api/v1/messages/:userId | GET | 获取聊天记录 |
| /api/v1/messages | POST | 发送消息 |
| /api/v1/search/users | GET | 搜索用户 |
| /api/v1/search/posts | GET | 搜索帖子 |

### 新增数据库表

#### collections (收藏表)
```sql
CREATE TABLE collections (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, post_id)
);
```

#### conversations (会话表)
```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  user_id_1 INTEGER NOT NULL,
  user_id_2 INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### messages (消息表)
```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 服务部署状态

| 服务 | 域名 | 状态 | 说明 |
|------|------|------|------|
| 前端 | https://expo-app-production-c11a.up.railway.app | ✅ 正常 | Web 应用 |
| 后端 | https://server-production-64d28.up.railway.app | ✅ 正常 | API 服务 |

### 功能清单

| 功能 | 状态 | 说明 |
|------|------|------|
| 登录/注册 | ✅ | 手机号登录/注册 |
| 首页帖子 | ✅ | 帖子列表、点赞、评论 |
| 发帖 | ✅ | 发布图文帖子 |
| 收藏 | ✅ | 收藏/取消收藏帖子 |
| 聊天 | ✅ | 私信功能 |
| 搜索 | ✅ | 搜索用户/帖子 |
| 分享 | ✅ | 分享帖子链接 |
| 个人中心 | ✅ | 头像、昵称、设置 |
| 管理后台 | ✅ | 仪表盘、用户管理、内容审核、举报管理 |

---

## 2026-06-16 变更记录

### 完成的功能（5项）

#### 1. 图片内容审核
- **服务文件**：`server/src/services/imageModerationService.ts`
- **路由文件**：`server/src/routes/imageModeration.ts`
- **API端点**：
  - `GET /api/v1/moderation/status` - 获取审核状态
  - `POST /api/v1/moderation/image` - 审核单张图片
  - `POST /api/v1/moderation/batch` - 批量审核

#### 2. Redis缓存
- **服务文件**：`server/src/services/advancedCacheService.ts`
- **路由文件**：`server/src/routes/advancedCache.ts`
- **API端点**：
  - `GET /api/v1/cache/advanced/stats` - 缓存统计
  - `POST /api/v1/cache/advanced/set` - 设置缓存
  - `GET /api/v1/cache/advanced/get` - 获取缓存
  - `DELETE /api/v1/cache/advanced/key` - 删除缓存
  - `POST /api/v1/cache/advanced/clear` - 清空缓存

#### 3. 推送通知
- **服务文件**：`server/src/services/pushNotificationService.ts`
- **路由文件**：`server/src/routes/pushNotifications.ts`
- **API端点**：
  - `GET /api/v1/notifications/` - 获取通知列表
  - `GET /api/v1/notifications/unread-count` - 未读数量
  - `PUT /api/v1/notifications/:id/read` - 标记已读
  - `POST /api/v1/notifications/send` - 发送通知
  - `GET /api/v1/notifications/poll` - 轮询新通知

#### 4. 用户反馈
- **路由文件**：`server/src/routes/feedback.ts`
- **API端点**：
  - `POST /api/v1/feedback` - 提交反馈
  - `GET /api/v1/feedback` - 获取反馈列表
  - `GET /api/v1/feedback/:id` - 获取反馈详情
  - `DELETE /api/v1/feedback/:id` - 删除反馈
  - `GET /api/v1/feedback/stats/types` - 反馈统计

#### 5. 数据库优化
- **路由文件**：`server/src/routes/databaseOptimization.ts`
- **API端点**：
  - `GET /api/v1/db/stats` - 数据库统计
  - `GET /api/v1/db/indexes` - 索引信息
  - `POST /api/v1/db/optimize` - 执行优化
  - `GET /api/v1/db/slow-queries` - 慢查询
  - `GET /api/v1/db/recommendations` - 优化建议

### 新增文件
```
server/src/services/imageModerationService.ts
server/src/services/advancedCacheService.ts
server/src/services/pushNotificationService.ts
server/src/routes/imageModeration.ts
server/src/routes/advancedCache.ts
server/src/routes/pushNotifications.ts
server/src/routes/feedback.ts
server/src/routes/databaseOptimization.ts
```

---

## 2026-06-16 变更记录（第二批）

### 完成的功能（8项）

#### 1. 消息撤回
- **路由文件**：`server/src/routes/messageRecall.ts`
- **API端点**：
  - `GET /api/v1/messages/recalled` - 获取撤回消息列表
  - `POST /api/v1/messages/recall` - 撤回消息
  - `DELETE /api/v1/messages/permanent/:id` - 永久删除

#### 2. 内容搜索
- **路由文件**：`server/src/routes/search.ts`
- **API端点**：
  - `GET /api/v1/search/` - 搜索内容
  - `GET /api/v1/search/hot` - 热词列表
  - `POST /api/v1/search/keywords` - 添加热词
  - `DELETE /api/v1/search/keywords/:keyword` - 删除热词

#### 3. 数据导出
- **路由文件**：`server/src/routes/dataExport.ts`
- **API端点**：
  - `POST /api/v1/export/` - 创建导出任务
  - `GET /api/v1/export/` - 获取导出任务列表
  - `GET /api/v1/export/:id` - 获取导出详情
  - `GET /api/v1/export/:id/download` - 下载导出文件

#### 4. 关注系统优化
- **路由文件**：`server/src/routes/social.ts`
- **API端点**：
  - `GET /api/v1/social/following` - 获取关注列表
  - `GET /api/v1/social/followers` - 获取粉丝列表
  - `POST /api/v1/social/follow/:userId` - 关注用户
  - `DELETE /api/v1/social/follow/:userId` - 取消关注
  - `GET /api/v1/social/mutual` - 互关列表

#### 5. 内容置顶/加精
- **路由文件**：`server/src/routes/contentModeration.ts`
- **API端点**：
  - `GET /api/v1/admin/pinned` - 获取置顶内容
  - `POST /api/v1/admin/pin/:id` - 置顶内容
  - `DELETE /api/v1/admin/pin/:id` - 取消置顶
  - `GET /api/v1/admin/featured` - 获取加精内容
  - `POST /api/v1/admin/feature/:id` - 加精内容
  - `DELETE /api/v1/admin/feature/:id` - 取消加精

#### 6. 定时发布
- **路由文件**：`server/src/routes/scheduledPost.ts`
- **API端点**：
  - `GET /api/v1/scheduled/` - 获取预约列表
  - `POST /api/v1/scheduled/` - 创建预约
  - `PUT /api/v1/scheduled/:id` - 更新预约
  - `DELETE /api/v1/scheduled/:id` - 删除预约

#### 7. 多语言支持
- **工具文件**：`server/src/utils/i18n.ts`
- **路由文件**：`server/src/routes/i18n.ts`
- **API端点**：
  - `GET /api/v1/i18n/locales` - 获取支持的语言
  - `GET /api/v1/i18n/translations/:locale` - 获取翻译文件

#### 8. 暗黑模式
- **工具文件**：`server/src/utils/theme.ts`
- **路由文件**：`server/src/routes/theme.ts`
- **API端点**：
  - `GET /api/v1/theme` - 获取用户主题
  - `POST /api/v1/theme` - 设置主题
  - `GET /api/v1/theme/css` - 获取主题CSS
  - `GET /api/v1/theme/previews` - 主题预览

### 新增文件
```
server/src/routes/messageRecall.ts
server/src/routes/search.ts
server/src/routes/dataExport.ts
server/src/routes/social.ts
server/src/routes/contentModeration.ts
server/src/routes/scheduledPost.ts
server/src/routes/i18n.ts
server/src/routes/theme.ts
server/src/utils/i18n.ts
server/src/utils/theme.ts
```

---

## 2026-06-17 变更记录

### 完成的功能

#### 1. 收益统计
- **路由文件**：`server/src/routes/revenue.ts`
- **API端点**：
  - `GET /api/v1/revenue/overview` - 收益概览（总收入、今日收益、订单数）
  - `GET /api/v1/revenue/trend` - 收益趋势
  - `GET /api/v1/revenue/members` - 会员收益
  - `GET /api/v1/revenue/transactions` - 交易记录
  - `GET /api/v1/revenue/payment-channels` - 支付渠道
  - `GET /api/v1/revenue/member-levels` - 会员等级配置

#### 2. 会员等级管理
- **路由文件**：`server/src/routes/members.ts`
- **API端点**：
  - `GET /api/v1/members/` - 会员列表
  - `GET /api/v1/members/:id` - 会员详情
  - `PUT /api/v1/members/:id/level` - 调整会员等级
  - `PUT /api/v1/members/batch-level` - 批量调整会员等级
  - `GET /api/v1/members/config/levels` - 会员等级配置
  - `GET /api/v1/members/stats/summary` - 会员统计
  - `GET /api/v1/members/export/list` - 导出会员列表

#### 3. 后台管理页面更新
- 新增「收益统计」模块
- 新增「会员管理」模块

### 会员等级设置
| 等级 | 价格 | 功能 |
|------|------|------|
| 免费用户 | ¥0 | 基础功能，每日100次API调用 |
| 基础会员 | ¥29.9/月 | 每日1000次API调用，邮件支持 |
| 高级会员 | ¥99/月 | 每日10000次API调用，优先支持 |
| VIP会员 | ¥299/月 | 全部功能，无限API调用，专属客服 |

### 新增文件
```
server/src/routes/revenue.ts
server/src/routes/members.ts
```

---

### 会员等级配置（2026-06-17 更新）

#### 免费用户基础规则
| 项目 | 配置 |
|------|------|
| 覆盖范围 | 仅本人所在镇/乡 |
| 每日发布 | 10条 |
| 留言留存 | 7天 |
| 基础功能 | 私聊、加好友、浏览 - **永久免费** |

#### 付费会员·级别留言体系

| 等级 | 覆盖范围 | 每日发布 | 留存天数 | 月费 |
|------|----------|----------|----------|------|
| L1 县级 | 本县 | 30条 | 15天 | ¥9 |
| L2 市级 | 本市 | 80条 | 30天 | ¥50 |
| L3 省级 | 本省 | 200条 | 60天 | ¥200 |
| L4 全国级 | 全国 | 不限 | 90天+置顶 | ¥2000 |

#### 增值付费功能
- **流痕留存+级别留言**：按等级覆盖不同范围，留言留存时间不同
- L4全国级额外享有：内容置顶展示

---

### 手机管理后台（2026-06-17 新增）
- **访问地址**：`https://liuhenjianghu.com/admin-mobile`
- **功能模块**：
  - 数据概览（收益、用户、订单统计）
  - 会员管理（查看会员列表、调整会员等级）
  - 内容管理（查看、删除内容）
  - 收益报表（日/周/月收益）
- **特点**：响应式设计，专为手机屏幕优化

---

### 新增安全与管理功能（2026-06-17）

#### 1. 内容举报
- **路由**：`server/src/routes/reports.ts`
- **功能**：用户可举报违规内容
- **API**：
  - `POST /api/v1/reports` - 提交举报
  - `GET /api/v1/reports` - 举报列表
  - `PUT /api/v1/reports/:id/handle` - 处理举报

#### 2. 操作日志
- **路由**：`server/src/routes/operationLogs.ts`
- **功能**：记录管理员所有操作
- **API**：
  - `GET /api/v1/operation-logs` - 操作日志列表
  - `GET /api/v1/operation-logs/stats` - 操作统计

#### 3. API限流
- **路由**：`server/src/routes/rateLimit.ts`
- **功能**：防止恶意刷接口
- **API**：
  - `GET /api/v1/rate-limit/status` - 限流状态
  - `GET /api/v1/rate-limit/check` - 检查限流

#### 4. 黑名单管理
- **路由**：`server/src/routes/blacklist.ts`
- **功能**：屏蔽用户
- **API**：
  - `GET /api/v1/blacklist` - 黑名单列表
  - `POST /api/v1/blacklist` - 添加黑名单
  - `DELETE /api/v1/blacklist/:targetId` - 移除黑名单

---

### 新增用户功能（2026-06-17 第二批）

#### 1. 通知系统
- **路由**：`server/src/routes/notifications.ts`
- **功能**：用户消息通知（评论、点赞、会员到期等）
- **API**：
  - `GET /api/v1/notifications` - 通知列表
  - `PUT /api/v1/notifications/:id/read` - 标记已读
  - `POST /api/v1/notifications/send` - 发送通知

#### 2. 订单查询
- **路由**：`server/src/routes/orders.ts`
- **功能**：用户查看购买记录
- **API**：
  - `GET /api/v1/orders` - 订单列表
  - `GET /api/v1/orders/:id` - 订单详情

#### 3. 每日任务/签到
- **路由**：`server/src/routes/dailyTasks.ts`
- **功能**：签到奖励，提升DAU
- **API**：
  - `GET /api/v1/tasks/tasks` - 任务列表
  - `POST /api/v1/tasks/checkin` - 签到

#### 4. 内容分享
- **路由**：`server/src/routes/share.ts`
- **功能**：生成分享链接和海报
- **API**：
  - `POST /api/v1/share/generate` - 生成分享
  - `GET /api/v1/share/stats` - 分享统计

#### 5. 用户等级/积分
- **路由**：`server/src/routes/userLevels.ts`
- **功能**：用户等级系统，增加粘性
- **API**：
  - `GET /api/v1/user-levels` - 等级列表
  - `GET /api/v1/user-levels/:userId` - 用户等级
  - `POST /api/v1/user-levels/:userId/upgrade` - 升级

---

## 积分系统完整设计（2026-06-17）

### 一、积分获取方式

| 方式 | 积分 | 说明 |
|------|------|------|
| 每日签到 | +5分 | 连续签到翻倍 |
| 连续签到7天 | +50分 | 第7天额外奖励 |
| 连续签到30天 | +300分 | 月度大奖励 |
| 留言被点赞 | +1分 | 每赞+1分 |
| 分享内容 | +3分/次 | 每天最多3次 |
| 新增关注 | +1分/个 | 粉丝给积分 |
| 完善资料 | +10分 | 头像+简介 |

### 二、积分消耗（积分商城）

| 商品 | 积分 | 说明 |
|------|------|------|
| 1天会员 | 100分 | 延长1天会员时长 |
| 7天会员 | 600分 | 延长7天会员时长 |
| 置顶1次 | 500分 | 内容置顶展示 |
| 置顶3次 | 1200分 | 置顶3次 |
| 解锁地区 | 200分 | 突破发布限制 |
| 专属标识 | 1000分 | 头像加特效 |
| 私信特权 | 300分 | 给陌生人发消息 |

### 三、用户等级

| 等级 | 累计积分 | 称号 | 权益 |
|------|----------|------|------|
| 路人 | 0 | 🍃 | 基础功能 |
| 初入江湖 | 100 | 💧 | 解锁私信 |
| 小有名气 | 500 | 🌟 | 专属表情 |
| 江湖高手 | 2000 | 🔥 | 置顶折扣 |
| 一代宗师 | 10000 | 👑 | VIP外观 |

### 四、API接口

| 接口 | 说明 |
|------|------|
| `GET /api/v1/points/balance/:userId` | 获取用户积分余额 |
| `POST /api/v1/points/checkin` | 每日签到 |
| `POST /api/v1/points/earn` | 获取积分（点赞/分享等） |
| `POST /api/v1/points/spend` | 消耗积分兑换 |
| `GET /api/v1/points/shop` | 积分商城商品列表 |
| `GET /api/v1/points/history/:userId` | 积分变动记录 |

### 五、积分价值换算

| 换算 | 比例 |
|------|------|
| 充值 | 1元 = 100积分 |
| 变现 | 1000积分 = 5元（待开通） |

---

## 部署问题排查记录

### 2026-06-26 16:30 - 前端白屏问题修复

#### 问题现象
- 访问 https://expo-app-production-31ad.up.railway.app/ 显示空白页面
- 浏览器控制台无报错
- HTML/JS/CSS 文件都能正常加载

#### 排查过程
1. **后端 API 检查**：✅ 正常
   - https://server-production-d2bda.up.railway.app/api/v1/health 返回正常
   - https://server-production-d2bda.up.railway.app/api/v1/posts 返回数据正常

2. **前端文件检查**：✅ 正常
   - HTML 文件正常返回
   - JavaScript 文件正常加载
   - CSS 文件正常加载
   - 后端 URL 配置正确

3. **代码检查**：❌ 发现问题
   - `app/(tabs)/index.tsx` 中调用了未定义的 `onPostPress` 函数
   - 导致 JavaScript 运行时错误，页面白屏

#### 根本原因
```tsx
// 错误代码
<HomeScreen onPostPress={(post) => onPostPress(post.id)} />
// onPostPress 函数未定义！
```

#### 修复方案
```tsx
// 修复后
<HomeScreen onPostPress={(post) => router.push(`/post/${post.id}`)} />
```

#### 涉及文件
- `client/app/(tabs)/index.tsx`

#### 系统架构说明
```
用户 → 前端（Web/App） → 后端 API → 数据库/存储
                ↓
        第三方服务（支付/消息/认证）
                ↓
        基础设施（部署/域名/CDN）
                ↓
        开发运维（代码/CI/监控）
```

**交互机制**：
1. 前端通过 `EXPO_PUBLIC_BACKEND_BASE_URL` 环境变量获取后端地址
2. 前端使用 `fetch` 调用后端 API
3. 后端处理请求并返回数据
4. 前端渲染数据到页面

**影响因素**：
- 环境变量配置是否正确
- 网络连通性是否正常
- 代码是否有运行时错误

---

## 认证与路由配置

> 更新时间：2026-06-29 21:30

### 路由守卫规则

| 场景 | 行为 | 实现位置 |
|------|------|----------|
| **未登录时访问网站** | 自动跳转到登录页面 | `client/app/_layout.tsx` |
| **登录后访问网站** | 显示首页（Tabs） | 正常路由 |
| **退出登录后** | 跳转回登录页面 | `client/contexts/AuthContext.tsx` |

### 实现细节

#### 1. 未登录跳转逻辑
```tsx
// client/app/_layout.tsx
useEffect(() => {
  if (!isReady) return;
  
  // 使用与 AuthContext 相同的 key
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  const isLoginRoute = segments.includes('login');
  const isRegisterRoute = segments.includes('register');

  // 如果当前不在登录页或注册页，且没有 token，则跳转
  if (!token && !isLoginRoute && !isRegisterRoute) {
    setTimeout(() => {
      router.replace('/login');
    }, 50);
  }
}, [isReady, segments]);
```

#### 2. Token 存储
- **存储方式**：`AsyncStorage`（Web 端自动映射到 `localStorage`）
- **Token Key**：`auth_token`
- **User Key**：`auth_user`

#### 3. 退出登录逻辑
```tsx
// client/contexts/AuthContext.tsx
const logout = async () => {
  setToken(null);
  setUser(null);
  api.setToken(null);
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
};
```

### 注意事项
1. **Token Key 一致性**：`_layout.tsx` 和 `AuthContext.tsx` 必须使用相同的 key（`auth_token`）
2. **注册页豁免**：注册页不需要跳转，避免死循环
3. **路由就绪检查**：使用 `segments.length > 0` 确保路由已挂载
- CORS 配置是否正确

---

## 上架前检查清单

> 更新时间：2026-06-29 22:00

### 一、内容审核 ✅

| 项目 | 状态 | 说明 |
|------|------|------|
| 隐私政策 | ✅ 已完成 | 包含信息收集、使用、存储、用户权利等章节 |
| 用户协议 | ✅ 已完成 | 包含服务条款、内容规范、会员退款政策等 |
| 会员退款政策 | ✅ 已完成 | 明确24小时冷静期和使用后不退款规则 |
| 未成年人保护 | ✅ 已完成 | 用户协议和隐私政策均包含相关条款 |
| 更新日期 | ✅ 已更新 | 隐私政策和用户协议更新日期为 2026-06-29 |

### 二、账号注销功能 ✅

| 项目 | 状态 | 说明 |
|------|------|------|
| 前端页面 | ✅ 已完成 | `client/screens/accountDeletion/index.tsx` |
| 后端 API | ✅ 已完成 | `server/src/routes/accountDeletion.ts` |
| 注销流程 | ✅ 已完成 | 申请注销 → 7天冷静期 → 自动注销 |
| 撤销注销 | ✅ 已完成 | 冷静期内可撤销注销申请 |

### 三、应用商店审核材料

| 项目 | 状态 | 说明 |
|------|------|------|
| 应用图标 | ✅ 已完成 | `assets/app-store/icon/app-icon-1024.png` |
| 矢量图标 | ✅ 已完成 | `assets/app-store/icon/流痕江湖-标准图标.svg`（用于实体制作） |
| 隐私政策链接 | ✅ 已完成 | 应用内已包含隐私政策页面 |
| 软著-源代码文档 | ✅ 已完成 | `assets/software-copyright/源代码文档.txt` |
| 软著-软件说明书 | ✅ 已完成 | `assets/software-copyright/软件说明书.md` |
| 应用截图 | ⏳ 待准备 | 需要在手机上截图 3-5 张 |
| 应用描述 | ⏳ 待准备 | 应用商店展示的描述文案 |
| 关键词 | ⏳ 待准备 | 应用商店搜索关键词 |
| 年龄分级 | ⏳ 待确定 | 根据内容确定年龄分级 |

### 三.一、ICP 备案（待办理）

| 项目 | 状态 | 说明 |
|------|------|------|
| 域名购买 | ⏳ 待购买 | 阿里云/腾讯云购买域名 |
| 国内服务器 | ⏳ 待购买 | 阿里云 ECS 等国内服务器 |
| ICP 备案提交 | ⏳ 待提交 | 通过服务商后台提交备案 |
| 备案审核 | ⏳ 待审核 | 预计 15-20 个工作日 |

### 三.二、短信服务状态

| 项目 | 状态 | 说明 |
|------|------|------|
| 阿里云短信服务 | ✅ 已配置 | AccessKey、模板已配置 |
| 短信签名 | ⏳ 已报备待验证 | 等待运营商审核通过 |
| 短信验证码功能 | ⏳ 待签名审核 | 审核通过后可正常使用 |

### 四、其他检查项

| 项目 | 状态 | 说明 |
|------|------|------|
| 未登录跳转 | ✅ 已完成 | 未登录自动跳转到登录页 |
| 退出登录跳转 | ✅ 已完成 | 退出登录后跳转到登录页 |
| 路由警告修复 | ✅ 已完成 | 移除不必要的路由声明 |

---

### 应用商店审核建议

1. **截图建议**：
   - 首页展示（帖子列表）
   - 发布页面（展示发布功能）
   - 会员页面（展示会员等级）
   - 个人中心（展示用户信息）

2. **描述建议**：
   ```
   流痕江湖 - 记录你的生活足迹
   
   在这里，你可以：
   • 发布江湖故事，分享生活点滴
   • 浏览同城动态，发现身边精彩
   • 升级会员，享受更多特权
   • 与志同道合的朋友互动交流
   
   让我们一起，留下生活的痕迹！
   ```

3. **注意事项**：
   - 确保应用内容符合应用商店审核指南
   - 避免使用虚假宣传或误导性描述
   - 确保所有功能正常运行

---

## 更新记录

> 最后更新：2026-07-18 21:15

### v1.0.18 (2026-07-18 21:15)

**注册页面修复：**

1. **省市区选择器修复**
   - 问题：前端 API 端点 `/regions/towns/:code` 与后端 `/regions/streets/:code` 不匹配，导致选择区县后无法加载乡镇/街道
   - 修复：将前端 `api.getTowns()` 端点从 `/regions/towns/` 改为 `/regions/streets/`
   - 文件：`client/services/api.ts`

2. **创建按钮无响应修复**
   - 问题：`Alert.alert()` 在 Web 端不会显示弹窗，导致表单校验失败时用户看不到任何提示
   - 修复：替换所有 `Alert.alert()` 为内联错误/成功消息显示组件
   - 新增 `errorMsg` 和 `successMsg` 状态，4秒后自动消失
   - 文件：`client/screens/auth/RegisterScreen.tsx`

3. **生产环境 API 地址修复**
   - 问题：`EXPO_PUBLIC_BACKEND_BASE_URL` 为空时回退到 `http://localhost:9091`，导致生产环境 API 调用失败
   - 修复：将默认值改为空字符串（相对路径），通过 server.js 代理 `/api/*` 到后端
   - 文件：`client/services/api.ts`

4. **Railway 部署问题记录**
   - 问题：Railway 前端服务（liuhenjianghu）Redeploy 只重启 Nginx 容器，不重新构建前端代码
   - 表现：JS 文件哈希不变，用户访问的仍是旧版本
   - 影响：代码修复无法生效，用户注册流程无法正常使用
   - 解决方案：迁移到国内 ECS 服务器，配置 GitHub Actions 自动构建部署

### 迁移到国内服务器（2026-07-18 决定）

**迁移原因：**
1. Railway 前端构建不可控（只重启容器，不重新打包）
2. 国内访问速度慢（服务器在国外）
3. 已 ICP 备案，可合法运营
4. 长期成本更低，配置更灵活

**配置变更：**

| 配置项 | 变更前 | 变更后 | 说明 |
|--------|--------|--------|------|
| `API_BASE` 默认值 | `http://localhost:9091` | `''`（空字符串） | 生产环境使用相对路径，通过 server.js 代理 |
| 地区选择器端点 | `/regions/towns/:code` | `/regions/streets/:code` | 与后端端点保持一致 |
| 表单校验提示 | `Alert.alert()` | 内联错误消息组件 | Web 端兼容 |

**部署配置：**

```
前端服务：liuhenjianghu（Nginx + Expo 静态文件）
后端服务：server（Node.js + Express）
API 代理：server.js 将 /api/* 代理到后端服务
环境变量：EXPO_PUBLIC_BACKEND_BASE_URL（构建时注入，生产环境为空）
```

### 迁移到国内服务器（2026-07-18 21:30 决定）

**迁移原因：**
1. Railway 前端构建不可控（只重启容器，不重新打包）
2. 国内访问速度慢（服务器在国外）
3. 已 ICP 备案，可合法运营
4. 长期成本更低，配置更灵活

**目标架构配置：**

| 产品 | 配置 | 月费 |
|------|------|------|
| ECS 云服务器 | 2 核 4G + 40GB ESSD + 3Mbps | ~¥200-250 |
| RDS PostgreSQL | 1 核 1G + 20GB ESSD | ~¥60-80 |
| Redis（可选） | 1GB 内存版 | ~¥40-50 |
| **合计** | - | **~¥310-400/月** |

**网络配置要求：**
- 所有产品使用同一 VPC 专有网络
- 同一地域（推荐华北 2 北京或华东 2 上海）
- 安全组配置内网互通规则

**自动部署方案：**
- GitHub Actions 触发构建
- 构建前端（expo export）+ 构建后端（pnpm build）
- 自动部署到 ECS（Nginx + Node.js）

### v1.0.17 (2026-07-16 22:55)

**短信服务配置完成：**

1. **环境变量配置**
   - `ALIYUN_ACCESS_KEY_ID`: 已配置（Railway Variables）
   - `ALIYUN_ACCESS_KEY_SECRET`: 已配置（Railway Variables）
   - `SMS_SIGN_NAME`: `迁安市建昌营镇流痕营软件`
   - `SMS_TEMPLATE_CODE`: `SMS_335900024`

2. **RAM 权限配置**
   - 用户：`liuhhen-oss-user`（注意拼写错误，但不影响使用）
   - 权限：`AliyunDysmsFullAccess`（短信服务完全访问权限）

3. **短信模板**
   - 模板代码：`SMS_335900024`
   - 模板内容：`您的验证码为：${code}，请勿泄露于他人！`
   - 变量：`${code}`（仅数字）

4. **签名状态**
   - 签名名称：`迁安市建昌营镇流痕营软件`
   - 状态：可用-正常
   - 运营商报备：移动/联通/电信 全部成功

5. **测试结果**
   - 验证码发送成功 ✅
   - 用户收到验证码 ✅

### v1.0.16 (2026-07-11 17:12)

**忘记密码功能：**

1. **后端接口**
   - `POST /api/v1/auth/forgot-password`
   - 参数：`phone: string`, `code: string`, `newPassword: string`
   - 验证短信验证码后重置密码
   - 重置成功后发送密码修改通知

2. **前端页面**
   - 登录页新增"忘记密码？"链接
   - 新增 ForgotPasswordScreen 忘记密码页面
   - 两步流程：验证手机号 → 设置新密码
   - 路由：`/forgot-password`（无需登录即可访问）

3. **使用流程**
   ```
   登录页 → 点击"忘记密码？" → 输入手机号 → 获取验证码 
   → 输入验证码和新密码 → 重置成功 → 返回登录
   ```

### v1.0.15 (2026-07-09 08:49)

**应用图标 & 软著材料准备：**

1. **应用图标确定**
   - 使用登录页截图作为应用图标
   - 设计：深色背景 + 金黄色"流痕江湖"文字 + 发光效果
   - 文件位置：`assets/app-store/icon/app-icon-1024.png`
   - 已上传到阿里云 OSS：`app-store/icon/app-icon-1024.png`

2. **标准矢量图标（用于实体制作）**
   - 文件：`assets/app-store/icon/流痕江湖-标准图标.svg`
   - 可无损缩放到任意尺寸（招牌、名片、T恤等）
   - 制作说明：`assets/app-store/icon/制作说明.md`

3. **软著申请材料**
   - 源代码文档：`assets/software-copyright/源代码文档.txt`（前60页+后60页）
   - 软件说明书：`assets/software-copyright/软件说明书.md`
   - 生成脚本：`assets/software-copyright/generate-source-doc.mjs`

4. **ICP 备案说明**
   - 需要购买域名（阿里云/腾讯云）
   - 需要国内服务器（阿里云 ECS 等）
   - 通过服务商后台提交备案
   - 预计审核时间：15-20 个工作日

5. **短信签名状态**
   - 状态：✅ 已通过（移动/联通/电信 全部报备成功）
   - 签名名称：`迁安市建昌营镇流痕营软件`
   - 模板代码：`SMS_335900024`

### v1.0.14 (2026-07-08 15:30)

**消息通知系统 - 第二批 & 第三批功能：**

1. **系统维护通知**
   - 管理员接口 `POST /api/v1/admin/maintenance-notify`
   - 支持设置维护时间范围
   - 广播给所有用户

2. **违规通知**
   - 用户被加入黑名单时自动发送违规通知
   - 区分封禁和警告两种类型

3. **新设备登录提醒**
   - 记录用户已知设备指纹
   - 检测到新设备登录时发送提醒
   - 显示设备类型和IP地址

4. **密码修改通知**
   - 新增 `PUT /api/v1/auth/password` 接口
   - 修改密码成功后发送站内通知

5. **版本更新提醒**
   - 新增 `app_versions` 数据表
   - 客户端检查更新 `GET /api/v1/version/check`
   - 管理员发布版本 `POST /api/v1/admin/version/publish`
   - 支持强制更新和可选更新

6. **账号异常提醒**
   - 记录登录失败次数
   - 超过5次失败发送账号异常提醒

**新建文件：**
- `server/src/services/securityNotificationService.ts` - 安全通知服务
- `server/src/services/versionService.ts` - 版本管理服务

**数据库变更：**
- 新增 `app_versions` 表
- `users` 表新增 `known_devices` 字段

### v1.0.14 (2026-07-08 15:30)

**OSS 对象存储配置完成**

| 配置项 | 值 |
|--------|-----|
| Bucket 名称 | `liuhenjianghu` |
| 区域 | `oss-cn-beijing` |
| 读写权限 | 私有 |
| RAM 用户 | `liuhen-oss-user` |
| 权限策略 | `Liuhenjianghu-OSS-Min-Permission` |

### v1.0.11 (2026-06-30 17:00)

**消息通知系统完善：**
- 充值到账通知、会员到期提醒、新私信提醒
- 系统维护通知、违规通知、新设备登录提醒
- 密码修改通知、版本更新提醒、账号异常提醒

### v1.0.10 (2026-06-30 16:00)

**短信服务集成：**
- 集成阿里云短信服务（HTTP API）
- 环境变量：`ALIYUN_ACCESS_KEY_ID`、`ALIYUN_ACCESS_KEY_SECRET`、`SMS_SIGN_NAME`、`SMS_TEMPLATE_CODE`

### v1.0.2 ~ v1.0.9 (2026-06-29 ~ 2026-06-30)

- 账号注销功能、隐私政策、用户协议、实名认证
- 认证路由修复、TypeScript 错误修复
- 合规完善（会员退款政策）

### v1.0.1 (2026-06-29 19:00)

**初始版本：**
- 用户认证（登录/注册）
- 首页帖子列表、发布留言、点赞/评论
- 会员系统、个人中心


---

## 阿里云基础设施配置

> 更新时间：2026-07-20 21:00

### 一、服务器配置

#### ECS 云服务器
| 配置项 | 值 |
|--------|-----|
| **实例 ID** | i-uf6j7tyxwbxf5695eoul |
| **公网 IP** | 47.116.142.121 |
| **内网 IP** | 172.29.17.179 |
| **规格** | 2 核 4GiB |
| **系统盘** | 40GB ESSD |
| **地域** | 华东 2（上海） |
| **可用区** | 上海 C |
| **操作系统** | Ubuntu 22.04 LTS |
| **VPC** | vpc-uf6y1l0uofp9o638g6gk6 |
| **安全组** | sg-uf6hn4hb74v3ynxzaax4 |
| **购买时间** | 2026-07-20 |
| **到期时间** | 2027-07-21 |
| **自动续费** | 关闭 |

#### RDS PostgreSQL
| 配置项 | 值 |
|--------|-----|
| **实例 ID** | pgm-uf6sc0v55a1p3r7m |
| **内网地址** | pgm-uf6sc0v55a1p3r7m.pg.rds.aliyuncs.com |
| **端口** | 5432 |
| **数据库名** | liuhenjianghu |
| **账号** | liuhenjianghu |
| **密码** | Liuhen2026App |
| **规格** | 通用型 pg.n1e.2c.1m（2 核 2GB） |
| **存储空间** | 20GB ESSD |
| **地域** | 华东 2（上海） |
| **可用区** | 上海 C |
| **VPC** | vpc-uf6y1l0uofp9o638g6gk6 |
| **白名单** | 172.29.17.179（ECS 内网 IP） |
| **购买时间** | 2026-07-20 |
| **到期时间** | 2027-07-21 |
| **自动续费** | 关闭 |

#### Redis 缓存
| 配置项 | 值 |
|--------|-----|
| **实例 ID** | r-uf61g3n5d2vxfnqtj1 |
| **实例名称** | liuhen-jianghu-redis |
| **内网地址** | r-uf61g3n5d2vxfnqtj1.redis.rds.aliyuncs.com |
| **端口** | 6379 |
| **密码** | Liuhen2026App |
| **版本** | Redis 7.0 (7.0.2.14) |
| **规格** | 1GB 内存版 |
| **架构** | 标准版（主从，不启用集群） |
| **地域** | 华东 2（上海） |
| **可用区** | 上海 C |
| **VPC** | vpc-uf6y1l0uofp9o638g6gk6 |
| **白名单** | 172.29.17.179（ECS 内网 IP） |
| **购买时间** | 2026-07-20 |
| **到期时间** | 2027-07-21 |
| **自动续费** | 关闭 |

### 二、网络配置

#### VPC 专有网络
| 配置项 | 值 |
|--------|-----|
| **VPC ID** | vpc-uf6y1l0uofp9o638g6gk6 |
| **地域** | 华东 2（上海） |
| **网段** | 172.29.0.0/16 |

#### 安全组规则
| 方向 | 协议 | 端口 | 源/目标 | 说明 |
|------|------|------|---------|------|
| 入方向 | TCP | 22 | 0.0.0.0/0 | SSH 远程连接 |
| 入方向 | TCP | 80 | 0.0.0.0/0 | HTTP 访问 |
| 入方向 | TCP | 443 | 0.0.0.0/0 | HTTPS 访问 |
| 出方向 | 全部 | 全部 | 0.0.0.0/0 | 允许所有出站 |

### 三、域名配置

| 配置项 | 值 |
|--------|-----|
| **域名** | liuhenjianghu.com |
| **DNS 解析** | 待配置 |
| **A 记录** | 47.116.142.121 |
| **SSL 证书** | 待配置 |
| **ICP 备案** | 已完成 |

### 四、部署架构

```
用户 → 域名 (liuhenjianghu.com)
         ↓
      Nginx (80/443)
         ↓
    ┌────────┐
    ↓         ↓
前端静态文件  反向代理 /api/*
              ↓
         Node.js (8080)
              ↓
    ┌────────────────┐
    ↓        ↓        ↓
  RDS     Redis     OSS
 PostgreSQL  缓存   对象存储
```

### 五、环境变量配置

#### 后端环境变量（ECS 部署时配置）
```env
NODE_ENV=production
PORT=8080

# 数据库配置
DATABASE_URL=postgresql://liuhenjianghu:Liuhen2026App@pgm-uf6sc0v55a1p3r7m.pg.rds.aliyuncs.com:5432/liuhenjianghu

# Redis 配置
REDIS_HOST=r-uf61g3n5d2vxfnqtj1.redis.rds.aliyuncs.com
REDIS_PORT=6379
REDIS_PASSWORD=Liuhen2026App

# Supabase 配置（保留用于本地开发）
COZE_SUPABASE_URL=https://hmlqsbhbbclbzfuutrie.supabase.co
COZE_SUPABASE_ANON_KEY=<your-anon-key>
COZE_SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# 阿里云 OSS
ALIYUN_ACCESS_KEY_ID=<your-access-key-id>
ALIYUN_ACCESS_KEY_SECRET=<your-access-key-secret>
OSS_BUCKET=liuhenjianghu
OSS_REGION=oss-cn-beijing

# 阿里云短信
SMS_SIGN_NAME=迁安市建昌营镇流痕营软件
SMS_TEMPLATE_CODE=SMS_335900024

# JWT
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRES_IN=7d
```

#### 前端环境变量（构建时注入）
```env
EXPO_PUBLIC_BACKEND_BASE_URL=
```

### 六、自动部署配置

#### GitHub Actions 工作流
```yaml
# .github/workflows/deploy.yml
name: Deploy to ECS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '24'
      
      - name: Install pnpm
        uses: pnpm/action-setup@v4
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build frontend
        run: cd client && pnpm build
      
      - name: Build backend
        run: cd server && pnpm build
      
      - name: Deploy to ECS
        uses: appleboy/ssh-action@v1
        with:
          host: 47.116.142.121
          username: root
          key: ${{ secrets.ECS_SSH_KEY }}
          script: |
            cd /opt/liuhenjianghu
            git pull origin main
            pnpm install
            pnpm build
            pm2 restart all
```

### 七、费用明细

| 产品 | 规格 | 年费 | 月均 |
|------|------|------|------|
| ECS 云服务器 | 2 核 4G + 40GB ESSD + 3Mbps | ~¥2,400 | ~¥200 |
| RDS PostgreSQL | 2 核 2GB + 20GB ESSD | ~¥403 | ~¥34 |
| Redis 缓存 | 1GB 内存版 | ~¥554 | ~¥46 |
| **合计** | - | **~¥3,357** | **~¥280** |

### 八、运维计划

#### 日常维护
- [ ] 每日检查服务状态
- [ ] 每周查看日志和性能指标
- [ ] 每月备份数据库

#### 监控告警
- [ ] 配置 CPU/内存使用率告警（>80%）
- [ ] 配置磁盘空间告警（>85%）
- [ ] 配置服务可用性监控

#### 安全加固
- [ ] 配置 SSH 密钥登录（禁用密码）
- [ ] 配置防火墙规则
- [ ] 定期更新系统补丁
- [ ] 配置 SSL 证书（HTTPS）

### 九、迁移检查清单

#### 数据库迁移（Supabase → RDS）
- [ ] 导出 Supabase 数据库结构
- [ ] 导出 Supabase 数据
- [ ] 在 RDS 创建数据库
- [ ] 导入数据库结构
- [ ] 导入数据
- [ ] 验证数据完整性
- [ ] 更新后端数据库连接配置

#### 应用部署
- [ ] 配置 ECS 环境（Node.js 24、Nginx）
- [ ] 配置 PM2 进程管理
- [ ] 配置 Nginx 反向代理
- [ ] 部署前端静态文件
- [ ] 部署后端服务
- [ ] 配置环境变量
- [ ] 测试 API 接口
- [ ] 测试前端访问

#### 域名配置
- [ ] 添加 A 记录（liuhenjianghu.com → 47.116.142.121）
- [ ] 添加 www A 记录（www.liuhenjianghu.com → 47.116.142.121）
- [ ] 配置 SSL 证书
- [ ] 配置 HTTPS 重定向

#### 切换流量
- [ ] 测试新环境功能
- [ ] 切换 DNS 解析
- [ ] 验证生产环境
- [ ] 停止 Railway 服务
