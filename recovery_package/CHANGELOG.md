# 重建数据包变更记录

> 记录每次配置和数据的变更

---

## v1.1.0 (2026-06-19)

### 新增
- 添加 API 路由别名补丁 (api_aliases.patch.md)

### 修改
- 更新 admin_login.patch.md - 同步实际代码
- 更新 static_path.patch.md - 确认已修复
- 更新 00_ENV.md - 精简配置信息

### 说明
本次同步检查了以下内容：
- ✅ 后端登录测试模式代码（已存在）
- ✅ 静态文件路径（已修复）
- ✅ API 路由别名（revenue/stats, members/levels）
- ✅ 数据库表结构（21张表）

---

## v1.0.0 (2026-06-19)

### 新增
- 创建重建数据包目录
- 添加环境变量配置 (00_ENV.md)
- 添加数据库表结构 (01_SCHEMA.sql)
- 添加种子数据 (02_SEED_DATA.sql)
- 添加代码补丁 (04_CODE_PATCHES/)
  - admin_login.patch.md - 管理后台登录测试模式
  - static_path.patch.md - 静态文件路径修复
- 添加部署配置 (05_DEPLOY/railway.json)
- 添加测试数据 (06_TEST_DATA/test_users.json)

### 说明
初始版本，包含管理后台登录功能所需的所有配置和数据

---

## 变更模板

### vX.Y.Z (YYYY-MM-DD)

#### 新增
- xxx

#### 修改
- xxx

#### 删除
- xxx

---

## 维护指南

1. **每次配置变更后**，更新对应文件
2. **每次数据变更后**，在 CHANGELOG.md 中记录
3. **新增重要功能**时，更新 README.md 说明
4. **保持文件同步**，确保 recovery_package 与实际代码一致
5. **每次完成新功能后**，执行"更新重建数据包"

---

## 同步检查清单

- [x] 环境变量配置与 Railway 一致
- [x] 后端登录代码已同步
- [x] 静态路径已修复
- [x] API 路由别名已记录
- [ ] 数据库表结构待完整同步
- [ ] 种子数据待完整同步
