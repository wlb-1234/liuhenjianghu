# 实名认证功能补丁

## 概述
为应用添加实名认证功能，用户可提交实名认证申请，管理员可审核认证申请。

## 文件变更

### 后端 (server/)

#### 新增文件
- `server/src/routes/realname.ts` - 实名认证API

#### 修改文件
- `server/src/index.ts` - 添加realname路由注册

### 前端 (client/)

#### 新增文件
- `client/screens/realname/index.tsx` - 实名认证页面
- `client/app/realname.tsx` - 实名认证路由
- `client/screens/admin/RealnameManageScreen.tsx` - 管理后台认证审核页面
- `client/app/admin/realname.tsx` - 管理后台认证审核路由

#### 修改文件
- `client/screens/profile/ProfileScreen.tsx` - 添加实名认证入口
- `client/screens/admin/DashboardScreen.tsx` - 添加实名认证管理入口
- `client/screens/post-detail/index.tsx` - 添加分享功能
- `client/screens/moderation/index.tsx` - 修复语法错误

## API接口

### 用户端
- `GET /api/v1/realname/status` - 获取认证状态
- `POST /api/v1/realname` - 提交认证申请

### 管理端
- `GET /api/v1/realname/admin/list` - 获取认证列表
- `PUT /api/v1/realname/admin/:id/review` - 审核认证申请

## 数据库变更
需要在数据库中执行以下SQL创建表：
```sql
CREATE TABLE IF NOT EXISTS realname_verifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  real_name VARCHAR(50) NOT NULL,
  id_card VARCHAR(18) NOT NULL,
  id_card_front TEXT,
  id_card_back TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  reject_reason TEXT,
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_realname_user ON realname_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_realname_status ON realname_verifications(status);
```

## 入口位置
- 用户端：个人中心 → 实名认证
- 管理端：管理后台 → 快捷入口 → 实名认证
