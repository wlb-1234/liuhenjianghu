# 流痕江湖 - 重建数据包

> 📦 本目录包含项目重建所需的所有配置和数据
> 
> **维护说明**：
> - 每次完成新功能后请说"更新重建数据包"
> - 重要更新请在 CHANGELOG.md 中记录
> 
> **版本**：v1.2.0  
> **最后更新**：2026-06-20

---

## 目录结构

```
recovery_package/
├── README.md              # 本文件
├── CHANGELOG.md           # 变更记录
├── 00_ENV.md              # 环境变量配置
├── 01_SCHEMA.sql          # 数据库表结构
├── 02_SEED_DATA.sql       # 种子数据
├── 03_REGION_DATA/        # 行政区划原始数据
│   ├── provinces.json
│   └── regions.json
├── 04_CODE_PATCHES/       # 代码补丁
│   ├── admin_login.patch.md
│   ├── static_path.patch.md
│   ├── api_aliases.patch.md
│   └── wechat_payment.patch.md
├── 05_DEPLOY/             # 部署配置
│   └── railway.json
└── 06_TEST_DATA/          # 测试数据
    └── test_users.json
```

---

## 快速重建步骤

### 步骤 1：克隆代码
```bash
git clone https://github.com/wlb-1234/liuhenjianghu
cd liuhenjianghu
```

### 步骤 2：配置环境变量
1. 参考 `00_ENV.md` 配置
2. 在 Railway 仪表板设置环境变量

### 步骤 3：创建数据库
```bash
psql "postgresql://postgres:[密码]@db.hmlqsbhbbclbzfuutrie.supabase.co:5432/postgres"
\i recovery_package/01_SCHEMA.sql
\i recovery_package/02_SEED_DATA.sql
```

### 步骤 4：复制原始数据
```bash
cp -r recovery_package/03_REGION_DATA/* server/src/data/
```

### 步骤 5：部署
```bash
git push origin main
```

---

## 关键功能

### 管理后台登录
- **地址**: https://liuhenjianghu-production.up.railway.app/admin
- **账号**: 15613594588
- **密码**: admin123

### 微信支付功能
- **商户号**: 1114226626 (已入驻)
- **AppID**: 待配置（移动应用审核中）
- **API密钥**: 待从微信支付商户平台获取
- **回调地址**: https://liuhenjianghu-production.up.railway.app/api/v1/payment/notify

### API 路由别名
- `/api/v1/revenue/stats` → `/api/v1/revenue/overview`
- `/api/v1/members/levels` → `/api/v1/members/config/levels`

### 支付相关接口
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/payment/config` | GET | 获取支付配置 |
| `/api/v1/payment/create` | POST | 创建支付订单 |
| `/api/v1/payment/notify` | POST | 支付回调 |
| `/api/v1/payment/orders` | GET | 订单列表 |
| `/api/v1/payment/balances` | GET | 用户余额 |

---

## 维护指南

### 触发更新
每次完成新功能后，说"更新重建数据包"即可自动同步。

### 手动更新
1. 编辑对应的配置文件
2. 更新 `CHANGELOG.md`
3. 提交：`git add -A && git commit -m "chore: 更新重建数据包" && git push`

---

## 部署信息

| 项目 | 地址 |
|------|------|
| 后端 API | https://liuhenjianghu-production.up.railway.app |
| 管理后台 | https://liuhenjianghu-production.up.railway.app/admin |
| Git 仓库 | https://github.com/wlb-1234/liuhenjianghu |
