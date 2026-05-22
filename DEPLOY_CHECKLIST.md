# 流痕江湖 - 部署检查清单

## 基础设施确认

### 必选服务
- [ ] Railway 账号 (railway.app)
- [ ] Supabase 项目 (supabase.com)
- [ ] 阿里云 OSS Bucket (liuhenjianghu)
- [ ] 域名 (liuhenjianghu.com)

### 可选服务
- [ ] 短信服务（阿里云/腾讯云）
- [ ] 邮件服务（SendGrid/AWS SES）

---

## Railway 部署步骤

### 1. 连接 GitHub
- [ ] 将代码推送到 GitHub 仓库
- [ ] 在 Railway 创建新项目，选择 "Deploy from GitHub"
- [ ] 授权 Railway 访问你的仓库

### 2. 配置环境变量
在 Railway 控制台 → 项目 → Variables 中添加：

| 变量名 | 值 | 来源 |
|--------|-----|------|
| `DATABASE_URL` | `postgresql://...` | Supabase Dashboard |
| `JWT_SECRET` | `随机64位字符串` | 使用命令生成 |
| `OSS_REGION` | `oss-cn-beijing` | 阿里云 OSS |
| `OSS_ACCESS_KEY_ID` | `LTAI5t...` | RAM 子账号 |
| `OSS_ACCESS_KEY_SECRET` | `...` | RAM 子账号 |
| `OSS_BUCKET` | `liuhenjianghu` | 阿里云 OSS |
| `BASE_URL` | `https://api.liuhenjianghu.com` | 自定义域名 |
| `PORT` | `5000` | Railway 端口 |
| `NODE_ENV` | `production` | - |

### 3. 部署验证
- [ ] 构建状态显示 "Success"
- [ ] 访问 `/api/v1/health` 返回正常
- [ ] 查看日志无错误

### 4. 配置自定义域名（可选）
- [ ] 在 Railway 添加域名 `api.liuhenjianghu.com`
- [ ] 在域名商配置 CNAME 记录
- [ ] SSL 证书自动生成

---

## Supabase 配置

### 数据库初始化
- [ ] 登录 Supabase Dashboard
- [ ] 进入 SQL Editor
- [ ] 执行 `server/migrations/001_init.sql`
- [ ] 验证表已创建

### 连接白名单
- [ ] 如果 Supabase 有 IP 白名单，添加 Railway IP
- [ ] 或设置为 "Allow all IPs"

---

## 阿里云 OSS 配置

### RAM 子账号
- [ ] 创建 RAM 用户
- [ ] 授予 `AliyunOSSFullAccess` 权限
- [ ] 创建 AccessKey 并保存

### Bucket 跨域配置
- [ ] 进入 OSS 控制台
- [ ] 选择 `liuhenjianghu` Bucket
- [ ] 配置 CORS 规则：
  - 允许来源：`*`（或你的前端域名）
  - 允许方法：GET, POST, PUT, DELETE
  - 允许头：`*`
  - 过期时间：3600

---

## 前端配置

### Expo 环境变量
在 `client/.env` 中配置：

```bash
EXPO_PUBLIC_BACKEND_BASE_URL=https://api.liuhenjianghu.com
```

### 构建原生 App
```bash
cd client
npx expo prebuild
eas build --platform ios
eas build --platform android
```

---

## 测试验证清单

### API 测试
- [ ] `GET /api/v1/health` → 200 OK
- [ ] `POST /api/v1/auth/register` → 注册成功
- [ ] `POST /api/v1/auth/login` → 登录成功，获取 Token
- [ ] `POST /api/v1/upload/images` → 图片上传成功
- [ ] `GET /api/v1/posts` → 获取帖子列表

### 功能测试
- [ ] 注册/登录流程
- [ ] 发布帖子（带图片）
- [ ] 查看帖子列表
- [ ] 点赞/评论
- [ ] 个人中心

---

## 常见问题

### Q: Railway 部署失败
**解决**：
1. 查看部署日志
2. 检查环境变量是否完整
3. 检查 DATABASE_URL 格式

### Q: 数据库连接失败
**解决**：
1. 确认 DATABASE_URL 正确
2. 检查 Supabase 是否允许外部连接
3. 查看 Supabase 连接日志

### Q: OSS 上传失败
**解决**：
1. 确认 AccessKey 有效
2. 检查 Bucket 名称
3. 验证 CORS 配置

### Q: 图片无法显示
**解决**：
1. 检查签名 URL 是否正确
2. 确认 CORS 配置
3. 查看浏览器控制台错误

---

## 部署后维护

### 监控
- [ ] 设置 Railway 告警
- [ ] 配置 Supabase 监控
- [ ] 开启 OSS 日志

### 备份
- [ ] Supabase 自动每日备份
- [ ] OSS 开启版本控制
- [ ] 定期导出敏感数据
