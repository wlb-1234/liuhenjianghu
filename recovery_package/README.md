# 重建数据包

## 版本
**v1.6.0** (2026-06-21)

## 概述
包含应用完整的数据结构、配置、代码补丁，可快速重建应用。

## 文件结构

```
recovery_package/
├── README.md              # 本文件
├── CHANGELOG.md           # 变更日志
├── 00_ENV.md              # 环境变量配置
├── 01_SCHEMA.sql          # 数据库表结构
├── 02_SEED_DATA.sql       # 初始数据
└── 04_CODE_PATCHES/       # 代码补丁
    ├── static_path.patch.md       # 静态文件服务
    ├── admin_login.patch.md       # 管理后台登录
    ├── api_aliases.patch.md       # API 路由别名
    ├── wechat_payment.patch.md    # 微信支付功能
    ├── order_balance.patch.md     # 订单与余额功能
    ├── admin_management.patch.md  # 管理后台功能
    ├── comments.patch.md          # 评论功能
    └── feedback.patch.md          # 意见反馈功能
```

## 重建步骤

### 1. 环境配置
复制 `00_ENV.md` 中的环境变量到 `server/.env`

### 2. 数据库初始化
```bash
# 创建表
psql $DATABASE_URL < 01_SCHEMA.sql

# 初始化数据
psql $DATABASE_URL < 02_SEED_DATA.sql
```

### 3. 应用补丁
按顺序应用 `04_CODE_PATCHES/` 中的补丁

### 4. 启动服务
```bash
cd server && pnpm run dev
```

## 核心配置

### 数据库
- 使用 Supabase PostgreSQL
- 直连地址: `13.114.6.6:5432`
- 连接字符串见 `00_ENV.md`

### 管理后台
- 入口: `http://localhost:8080/admin`
- 账号: `15613594588`
- 密码: `admin123`

### API 前缀
- 所有 API 使用 `/api/v1` 前缀
- 路由别名支持（无需完整路径）

## 功能清单

| 功能 | 状态 | 说明 |
|------|------|------|
| 用户认证 | ✅ | 邮箱/手机登录 |
| 文章系统 | ✅ | 分类、内容管理 |
| 会员系统 | ✅ | VIP 升级 |
| 微信支付 | ✅ | 待 AppID 配置 |
| 订单管理 | ✅ | 用户订单历史 |
| 余额系统 | ✅ | 余额充值消费 |
| 意见反馈 | ✅ | 用户提交反馈 |
| 关于我们 | ✅ | APP介绍页面 |
| 管理后台 | ✅ | 用户/支付/内容/反馈管理 |

## 注意事项

1. **数据库连接**: 必须使用 IPv4 直连 `13.114.6.6`，不要用域名
2. **微信支付**: 需要配置商户号、AppID、API密钥
3. **管理后台**: 首次使用需要初始化管理员账号
