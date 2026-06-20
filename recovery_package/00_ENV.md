# 环境变量配置

> 本文件记录所有需要的环境变量

---

## 一、数据库配置（Supabase）

> ⚠️ **重要**：沙箱环境必须使用直连 IPv4 地址，勿用域名！

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `DATABASE_URL` | PostgreSQL 直连地址（IPv4） | `postgresql://postgres:密码@13.114.6.6:5432/postgres?sslmode=disable` |

### 获取方式
1. 登录 https://supabase.com/dashboard
2. 进入项目 → Settings → Database
3. **不要**用 Connection string 中的域名
4. 使用直连 IP：`13.114.6.6:5432`
5. 密码是你的 Supabase PostgreSQL 密码

### 沙箱环境
```bash
# 必须使用这个格式（IPv4 直连）
DATABASE_URL="postgresql://postgres.[密码]@13.114.6.6:5432/postgres?sslmode=disable"
```

### Railway 环境
```bash
# Railway PostgreSQL 会自动设置
DATABASE_URL="postgresql://postgres:password@containers.usRailway-1.Railway-internal.com:5432/postgres"
```

---

## 二、Supabase 其他配置

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `SUPABASE_URL` | Supabase 项目地址 | `https://hmlqsbhbbclbzfuutrie.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase 匿名密钥 | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务密钥 | `eyJhbGc...` |

---

## 三、Railway 部署变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `PORT` | 服务端口 | `9091` |
| `NODE_ENV` | 运行环境 | `production` |

---
