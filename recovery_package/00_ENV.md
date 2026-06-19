# 环境变量配置

> 本文件记录所有需要的环境变量，实际使用时请从 Railway/Vercel 仪表板获取真实值

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
| `RAILWAY_STATIC_URL` | Railway 静态 URL | 自动生成 |

### Railway 健康检查配置
- **路径**：`/api/v1/health`
- **端口**：`9091`

---

## 三、后端配置

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `API_VERSION` | API 版本 | `v1` |
| `CACHE_TTL` | 缓存 TTL（秒） | `3600` |
| `MAX_POSTS_PER_DAY` | 每日最大发帖数 | `10` |

---

## 四、客户端配置

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `EXPO_PUBLIC_BACKEND_BASE_URL` | 后端 API 地址 | `https://liuhenjianghu-production.up.railway.app` |

### 开发环境
```bash
# client/.env.development
EXPO_PUBLIC_BACKEND_BASE_URL=http://localhost:9091
```

### 生产环境
```bash
# client/.env.production
EXPO_PUBLIC_BACKEND_BASE_URL=https://liuhenjianghu-production.up.railway.app
```

---

## 五、Redis 配置（可选）

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `REDIS_URL` | Redis 连接地址 | `redis://localhost:6379` |

> 注意：如未配置 REDIS_URL，系统将使用内存缓存

---

## 六、部署平台配置

### Railway
```toml
# railway.toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
numReplicas = 1
healthcheckPath = "/api/v1/health"
healthcheckPort = 9091
```

### Vercel (客户端)
```json
// vercel.json
{
  "buildCommand": "expo export:web",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://liuhenjianghu-production.up.railway.app/api/$1" }
  ]
}
```

---

## 七、本地开发环境变量

```bash
# 创建 .env 文件
cd /workspace/projects

# 后端
cp server/.env.example server/.env
# 编辑 server/.env 填写实际值

# 前端
cp client/.env.example client/.env
# 编辑 client/.env 填写实际值
```

---

## 八、安全注意事项

⚠️ **不要提交以下文件到 Git**
- `.env`
- `.env.local`
- `.env.production`

⚠️ **不要在代码中硬编码敏感信息**

---

## 九、配置检查清单

- [ ] DATABASE_URL 已配置
- [ ] SUPABASE_URL 已配置
- [ ] SUPABASE_ANON_KEY 已配置
- [ ] SUPABASE_SERVICE_ROLE_KEY 已配置
- [ ] PORT 设置为 9091
- [ ] NODE_ENV 设置为 production
- [ ] EXPO_PUBLIC_BACKEND_BASE_URL 指向正确的后端地址
