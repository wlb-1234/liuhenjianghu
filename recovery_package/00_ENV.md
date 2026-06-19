# 环境变量配置

> 本文件记录所有需要的环境变量

---

## 一、Supabase 配置

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接地址 | `postgresql://postgres:xxx@db.hmlqsbhbbclbzfuutrie.supabase.co:5432/postgres` |
| `SUPABASE_URL` | Supabase 项目地址 | `https://hmlqsbhbbclbzfuutrie.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase 匿名密钥 | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务密钥 | `eyJhbGc...` |

### 获取方式
1. 登录 https://supabase.com/dashboard
2. 进入项目 → Settings → Database
3. 查看 Connection string
4. Settings → API 查看 ANON_KEY 和 SERVICE_ROLE_KEY

---

## 二、Railway 部署变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `PORT` | 服务端口 | `9091` |
| `NODE_ENV` | 运行环境 | `production` |

### Railway 健康检查配置
- **路径**：`/api/v1/health`
- **端口**：`9091`

---

## 三、后端配置

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `API_VERSION` | API 版本 | `v1` |
| `CACHE_TTL` | 缓存 TTL（秒） | `3600` |

---

## 四、客户端配置

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `EXPO_PUBLIC_BACKEND_BASE_URL` | 后端 API 地址 | `https://liuhenjianghu-production.up.railway.app` |

---

## 五、部署信息

| 项目 | 地址 |
|------|------|
| **后端 API** | https://liuhenjianghu-production.up.railway.app |
| **管理后台** | https://liuhenjianghu-production.up.railway.app/admin |
| **Git 仓库** | https://github.com/wlb-1234/liuhenjianghu |
| **Supabase** | https://supabase.com/dashboard/project/hmlqsbhbbclbzfuutrie |

---

## 六、安全注意事项

⚠️ **不要提交以下文件到 Git**
- `.env`
- `.env.local`
- `.env.production`

⚠️ **不要在代码中硬编码敏感信息**
