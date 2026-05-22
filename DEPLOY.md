# 流痕江湖 - Railway 部署指南

## 前置准备

### 1. 基础设施确认
- [x] Railway 账号 (railway.app)
- [x] Supabase 项目已创建（数据库已初始化）
- [x] 阿里云 OSS Bucket 已创建（liuhenjianghu）
- [x] 域名已购买（liuhenjianghu.com）

### 2. 准备 RAM 子账号 AccessKey
1. 登录阿里云 RAM 控制台
2. 创建子账号，授予 OSS 管理权限
3. 创建 AccessKey，保存 AccessKeyId 和 AccessKeySecret

---

## Railway 部署步骤

### 第一步：连接 GitHub 仓库

1. 访问 [railway.app](https://railway.app)
2. 点击 "New Project" → "Deploy from GitHub repo"
3. 选择你的仓库
4. Railway 会自动检测 Dockerfile 或 railway.json

### 第二步：配置环境变量

在 Railway 控制台 → 你的项目 → Variables，添加以下环境变量：

```
# Supabase 数据库（从 Supabase 控制台获取）
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# OSS 配置
OSS_REGION=oss-cn-beijing
OSS_ACCESS_KEY_ID=你的RAM子账号AccessKeyId
OSS_ACCESS_KEY_SECRET=你的RAM子账号AccessKeySecret
OSS_BUCKET=liuhenjianghu

# JWT 密钥（生成随机字符串）
JWT_SECRET=你的随机JWT密钥（至少32位）

# API 地址（ Railway 会自动分配）
BASE_URL=https://你的railway-app.railway.app
```

### 第三步：自定义域名（可选）

1. 在 Railway 控制台 → 你的项目 → Settings → Networking
2. 点击 "Create Custom Domain"
3. 添加你的域名：`api.liuhenjianghu.com`
4. 配置 DNS 记录（Railway 会提供 CNAME）

DNS 配置示例：
```
记录类型: CNAME
主机记录: api
记录值: your-railway-app.up.railway.app
```

### 第四步：部署验证

1. 等待构建完成（约 3-5 分钟）
2. 点击部署日志查看状态
3. 访问 `https://your-railway-app.railway.app/api/v1/health` 验证

预期响应：
```json
{"status":"ok","message":"流痕江湖 API 服务运行中","timestamp":"..."}
```

---

## 获取环境变量

### Supabase DATABASE_URL

1. 登录 [Supabase](https://supabase.com)
2. 选择你的项目 → Settings → Database
3. 找到 "Connection string" 部分
4. 复制 "URI" 格式的连接字符串
5. 将 `[YOUR-PASSWORD]` 替换为你的数据库密码

### Railway 分配的域名

部署后，Railway 会自动分配一个域名，格式为：
```
https://your-project-name.up.railway.app
```

这个域名用于：
- 前端 API 调用
- Webhook 回调地址

---

## 常见问题

### Q: 构建失败怎么办？
A: 查看 Railway 部署日志，常见原因：
- 环境变量缺失
- 依赖安装超时
- 构建脚本错误

### Q: 数据库连接失败？
A: 检查：
1. DATABASE_URL 是否正确
2. Supabase 是否允许直接连接（Settings → Database → Allow IP addresses）

### Q: OSS 上传失败？
A: 检查：
1. AccessKey 是否有效
2. Bucket 名称是否正确
3. RAM 子账号是否有 OSS 权限

---

## 下一步

API 部署完成后，需要：
1. 配置前端 `EXPO_PUBLIC_BACKEND_BASE_URL`
2. 使用 `expo prebuild` 生成原生项目
3. 使用 EAS Build 构建 App
