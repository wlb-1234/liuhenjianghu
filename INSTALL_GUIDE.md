# 流痕江湖 - 安装部署指南

## 版本信息
- 版本号：v1.0
- 日期：2024年
- 技术栈：Expo 54 + React Native + Express.js

---

## 一、快速开始

### 1. 解压项目
```bash
cd 下载目录
tar -xzvf liuhen-jianghu-v1.0.tar.gz
cd liuhen-jianghu
```

### 2. 安装依赖
```bash
# 安装前端和后端依赖
pnpm install

# 或使用 npm
npm install
```

### 3. 启动开发服务
```bash
# 同时启动前端和后端
pnpm dev

# 或分别启动
pnpm client:dev    # 前端 (Expo)
pnpm server:dev     # 后端 (Express)
```

### 4. 访问应用
- Web 版：http://localhost:5000
- 管理后台：http://localhost:5000/admin
- 后端 API：http://localhost:9091

---

## 二、项目结构

```
liuhen-jianghu/
├── client/                 # 前端 (React Native / Expo)
│   ├── app/               # 路由配置
│   ├── screens/           # 页面组件
│   ├── components/        # 通用组件
│   ├── services/          # API 服务
│   ├── contexts/          # React Context
│   ├── hooks/             # 自定义 Hooks
│   └── assets/            # 静态资源
│
├── server/                # 后端 (Express.js)
│   ├── src/
│   │   ├── routes/        # API 路由
│   │   ├── services/      # 业务逻辑
│   │   ├── middleware/     # 中间件
│   │   ├── storage/       # 数据存储
│   │   └── config/        # 配置
│   ├── uploads/           # 上传文件
│   └── package.json
│
├── docs/                  # 文档
│   ├── OPERATION_GUIDE.md     # 运营指南
│   └── VERCEL_DEPLOY.md      # Vercel部署指南
│
└── package.json           # 项目配置
```

---

## 三、环境配置

### 1. 数据库配置
项目使用 Supabase PostgreSQL，需要创建数据库表：

1. 注册 Supabase：https://supabase.com
2. 创建新项目
3. 获取连接信息
4. 创建表结构（参考 server/src/storage/database/shared/schema.ts）

### 2. 后端环境变量
```bash
cd server
cp .env.example .env
# 编辑 .env，填写：
# DATABASE_URL=postgresql://xxx:xxx@xxx.supabase.co:5432/postgres
# JWT_SECRET=你的随机密钥
# PINATA_API_KEY=（可选，用于IPFS）
# PINATA_API_SECRET=（可选，用于IPFS）
```

### 3. 前端环境变量
```bash
cd client
# 编辑 .env.production 或在 Vercel 中配置：
EXPO_PUBLIC_BACKEND_BASE_URL=https://你的后端API地址
EXPO_PUBLIC_COZE_PROJECT_NAME=流痕江湖
```

---

## 四、部署到 Vercel (Web版)

### 1. 推送代码到 GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/liuhen-jianghu.git
git push -u origin main
```

### 2. Vercel 部署
1. 访问 https://vercel.com
2. 登录并点击 "Import Project"
3. 选择 GitHub 仓库
4. 配置：
   - Framework Preset: Expo
   - Root Directory: ./
   - Build Command: npx expo export
   - Output Directory: client/dist
5. 添加环境变量
6. 点击 Deploy

---

## 五、构建移动端安装包

### 1. 安装 EAS CLI
```bash
npm install -g eas-cli
eas login
```

### 2. 配置 Android
```bash
cd client
eas build --platform android --profile preview
```

### 3. 配置 iOS（需要 Mac）
```bash
eas build --platform ios --profile preview
```

详细步骤参考：`client/BUILD_GUIDE.md`

---

## 六、功能模块

| 模块 | 路径 | 说明 |
|------|------|------|
| 用户登录 | /login | 手机号登录 |
| 用户注册 | /register | 手机号注册 |
| 首页信息流 | / | 公共留言 |
| 社交 | /social | 好友/关注 |
| 个人中心 | /profile | 用户设置 |
| VIP会员 | /vip | 会员购买 |
| 隐私政策 | /privacy | 隐私条款 |
| 用户协议 | /agreement | 使用协议 |
| 管理后台 | /admin | 管理员入口 |

---

## 七、账号说明

### 测试账号
- 手机号：15613594588（开发者）
- 密码：123456
- 会员等级：L4（省派掌门）

### 管理后台
- 地址：/admin
- 账号：admin / admin123

---

## 八、运营准备

### 必做材料
- [ ] 隐私政策页面 ✓ 已完成
- [ ] 用户协议 ✓ 已完成
- [ ] 软件著作权（申请中）
- [ ] ICP备案（申请中）
- [ ] 微信支付商户
- [ ] 支付宝商户

详细指南参考：`docs/OPERATION_GUIDE.md`

---

## 九、技术支持

- 开发者手机：15613594588
- 客服邮箱：support@liuhenjianghu.com

---

## 十、许可证

本项目仅供学习和开发使用。
