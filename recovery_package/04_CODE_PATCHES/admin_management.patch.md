# 管理后台功能补丁

## 概述
完善管理后台功能，新增支付管理和内容管理页面。

## 文件清单

### 前端新增
- `client/screens/admin/PaymentManageScreen.tsx` - 支付订单管理
- `client/screens/admin/ContentManageScreen.tsx` - 内容管理
- `client/app/admin/payment.tsx` - 支付管理路由
- `client/app/admin/content.tsx` - 内容管理路由

### 前端修改
- `client/app/admin/_layout.tsx` - 添加菜单项

## 页面说明

### 支付订单管理 (/admin/payment)
- 支付配置状态显示
- 订单查询（订单号、状态筛选）
- 用户余额管理
- 退款操作

### 内容管理 (/admin/content)
- 文章列表（标题、分类、状态）
- 新增/编辑文章
- 发布/下架操作
- 分类管理

## 路由说明
管理后台路由前缀: `/admin/`
- `/admin/payment` - 支付管理
- `/admin/content` - 内容管理
