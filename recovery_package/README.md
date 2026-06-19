# 流痕江湖 - 重建数据包

> 📦 本目录包含项目重建所需的所有配置和数据
> 
> **维护说明**：
> - 每次配置变更后请更新对应文件
> - 重要更新请在 CHANGELOG.md 中记录
> 
> **版本**：v1.0.0  
> **最后更新**：2026-06-19

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
│   ├── regions.json
│   └── stats.json
├── 04_CODE_PATCHES/      # 代码补丁
│   ├── admin_login.patch.ts
│   └── static_path.patch.ts
├── 05_DEPLOY/             # 部署配置
│   ├── railway.json
│   └── vercel.json
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
1. 复制 `00_ENV.md` 到项目根目录
2. 填写实际的 Supabase 连接信息
3. 在 Railway/Vercel 仪表板设置环境变量

### 步骤 3：创建数据库
```bash
# 连接 Supabase PostgreSQL
psql "postgresql://postgres:[密码]@db.hmlqsbhbbclbzfuutrie.supabase.co:5432/postgres"

# 执行表结构
\i server/sql/001_schema.sql

# 执行种子数据
\i server/sql/002_seed_data.sql
```

### 步骤 4：复制原始数据
```bash
cp -r recovery_package/03_REGION_DATA/* server/src/data/
```

### 步骤 5：应用代码补丁
如果 `server/src/index.ts` 中没有登录测试模式，执行：
```bash
# 查看补丁内容
cat recovery_package/04_CODE_PATCHES/admin_login.patch.ts
# 手动将代码添加到 server/src/index.ts 的登录路由中
```

### 步骤 6：部署
```bash
git push origin main
# Railway 会自动检测并重新部署
```

---

## 文件说明

### 00_ENV.md
环境变量配置，包含：
- Supabase 连接信息
- Railway 部署变量
- API 配置

### 01_SCHEMA.sql
数据库表结构定义，包含：
- users 表
- api_keys 表
- ip_whitelist 表
- member_levels 表
- user_levels 表
- points_shop 表
- posts 表
- comments 表
- likes 表
- collections 表
- conversations 表
- messages 表

### 02_SEED_DATA.sql
初始种子数据，包含：
- 会员等级配置（free, L1-L4）
- 用户等级配置（L0-L6）
- 积分商城商品

### 03_REGION_DATA/
行政区划原始 JSON 数据文件

### 04_CODE_PATCHES/
代码补丁，包含需要手动应用的代码片段：
- admin_login.patch.ts - 管理后台登录测试模式
- static_path.patch.ts - 静态文件路径修复

### 05_DEPLOY/
部署配置文件

### 06_TEST_DATA/
测试用户数据

---

## 联系方式

- **GitHub**：https://github.com/wlb-1234/liuhenjianghu
- **管理后台**：https://liuhenjianghu-production.up.railway.app/admin
- **Supabase**：https://supabase.com/dashboard

---

## 维护指南

### 添加新配置
1. 编辑对应的配置文件
2. 在 CHANGELOG.md 中记录变更

### 添加新表结构
1. 在 `01_SCHEMA.sql` 末尾添加
2. 在 CHANGELOG.md 中记录

### 添加新种子数据
1. 在 `02_SEED_DATA.sql` 末尾添加
2. 在 CHANGELOG.md 中记录

### 更新原始数据
1. 替换 `03_REGION_DATA/` 下对应的文件
2. 在 CHANGELOG.md 中记录
