# 订单与余额功能补丁

## 概述
新增用户订单历史页面、余额明细页面，完善个人中心功能。

## 文件清单

### 前端新增页面
- `client/screens/orders/index.tsx` - 订单历史页面
- `client/screens/balance/index.tsx` - 余额明细页面
- `client/app/orders.tsx` - 订单路由
- `client/app/balance.tsx` - 余额路由

### 前端修改文件
- `client/screens/profile/ProfileScreen.tsx` - 添加余额显示入口

### 后端新增接口
- `GET /api/v1/payment/user/orders` - 用户订单列表
- `GET /api/v1/payment/user/balance` - 用户余额详情
- `GET /api/v1/payment/user/transactions` - 用户交易记录

## 页面说明

### 订单历史页面 (/orders)
- 显示用户所有充值订单
- 支持按状态筛选（全部/待支付/成功/已退款）
- 显示订单号、金额、状态、时间

### 余额明细页面 (/balance)
- 显示当前余额
- 交易记录列表（充值/消费）
- 支持按类型筛选

## 使用方式
1. 路由已自动注册
2. 从个人中心"我的余额"入口进入
