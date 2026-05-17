# Vercel Web 部署指南

本文档帮助你将「流痕江湖」App 部署到 Vercel，使其可以在浏览器中访问。

---

## 部署方式一：一键部署（推荐）

### 步骤 1：导入 GitHub 仓库

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Add New" → "Project"
3. 导入你的 GitHub 仓库
4. Vercel 会自动检测为 Expo 项目

### 步骤 2：配置环境变量

在 Vercel 项目设置中添加：

| 环境变量 | 值 | 说明 |
|---------|-----|------|
| `EXPO_PUBLIC_BACKEND_BASE_URL` | `https://你的后端域名.com` | 后端 API 地址 |
| `EXPO_PUBLIC_COZE_PROJECT_NAME` | `流痕江湖` | App 名称 |
| `EXPO_PUBLIC_COZE_PROJECT_ID` | 你的项目ID | 项目标识 |

### 步骤 3：部署

1. 点击 "Deploy"
2. 等待构建完成（约 2-5 分钟）
3. 获得免费域名：`https://你的项目.vercel.app`

---

## 部署方式二：CLI 部署

### 步骤 1：安装 Vercel CLI

```bash
npm install -g vercel
```

### 步骤 2：登录

```bash
vercel login
```

### 步骤 3：配置环境变量

创建 `client/.env.production`：

```bash
EXPO_PUBLIC_BACKEND_BASE_URL=https://api.liuhenjianghu.com
EXPO_PUBLIC_COZE_PROJECT_NAME=流痕江湖
```

### 步骤 4：部署

```bash
cd client
npx expo export:web
cd ..
vercel --prod
```

---

## 部署后配置

### 绑定自定义域名

1. 在 Vercel 项目设置 → Domains
2. 添加你的域名（如 `liuhenjianghu.com`）
3. 按要求配置 DNS 记录

### DNS 配置示例

| 类型 | 名称 | 值 |
|------|------|-----|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |
| CNAME | api | 你的后端服务器IP |

### 后端 API 部署

后端需要单独部署，推荐方案：

| 平台 | 免费额度 | 说明 |
|------|---------|------|
| Railway | 500小时/月 | 推荐，简单易用 |
| Render | 750小时/月 | 需要保持活跃 |
| 阿里云ECS | 按量付费 | 国内访问快 |

---

## 完整部署清单

### 1. 前端部署（Vercel）

- [ ] 注册 Vercel 账号
- [ ] 导入 GitHub 仓库
- [ ] 配置环境变量
- [ ] 部署成功
- [ ] 绑定自定义域名（可选）

### 2. 后端部署（Railway/阿里云）

- [ ] 注册 Railway 账号
- [ ] 连接 GitHub 仓库
- [ ] 配置环境变量
- [ ] 设置自定义域名
- [ ] 部署成功

### 3. 环境变量配置

#### Vercel 前端环境变量

```
EXPO_PUBLIC_BACKEND_BASE_URL=https://api.liuhenjianghu.com
EXPO_PUBLIC_COZE_PROJECT_NAME=流痕江湖
```

#### Railway 后端环境变量

```
DATABASE_URL=postgresql://用户名:密码@host:5432/数据库名?sslmode=require
JWT_SECRET=你的随机密钥
PORT=3000
```

---

## 更新部署

### 自动部署

连接 GitHub 后，每次 push 到 main 分支会自动部署。

### 手动部署

```bash
vercel --prod
```

### EAS Update（无需重新打包）

配置 EAS Update 后，可以不重新构建直接推送更新：

```bash
eas update --branch production --message "修复了xxx问题"
```

---

## 常见问题

### Q: 部署后页面空白？

检查环境变量 `EXPO_PUBLIC_BACKEND_BASE_URL` 是否正确配置。

### Q: API 请求失败？

1. 检查后端是否已部署
2. 检查 `EXPO_PUBLIC_BACKEND_BASE_URL` 是否正确
3. 检查后端 CORS 配置

### Q: 样式显示异常？

清除浏览器缓存，或检查是否有 CSS 加载问题。

---

## 部署架构图

```
┌─────────────────────────────────────────────────────────┐
│                     用户浏览器                           │
└─────────────────────┬───────────────────────────────────┘
                      │
         ┌─────────────┴─────────────┐
         ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│   Vercel        │         │   Railway       │
│   前端 Web       │  ───▶   │   后端 API      │
│   vercel.app     │         │   railway.app   │
└─────────────────┘         └─────────────────┘
         │                           │
         │                    ┌──────┴──────┐
         │                    ▼             ▼
         │              ┌──────────┐   ┌──────────┐
         │              │ Supabase │   │  Pinata  │
         │              │ 数据库    │   │  IPFS    │
         │              └──────────┘   └──────────┘
         │
         ▼
┌─────────────────┐
│  自定义域名      │
│  liuhenjianghu.com│
└─────────────────┘
```

---

## 联系支持

如有问题，请联系客服：156-1359-4588
