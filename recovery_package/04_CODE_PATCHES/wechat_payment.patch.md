# 微信支付功能补丁

## 概述
新增微信支付功能，支持余额充值、会员升级等场景。

## 文件清单

### 后端新增文件
- `server/src/config/wechat.ts` - 微信支付配置
- `server/src/utils/wechatPay.ts` - 微信支付工具函数
- `server/src/models/payment_order.sql` - 支付订单表结构
- `server/src/models/user_balance.sql` - 用户余额表结构
- `server/src/routes/payment.ts` - 支付路由

### 后端修改文件
- `server/src/index.ts` - 注册支付路由
- `server/public/admin.html` - 管理后台支付管理页面

## 数据库表

### payment_orders (支付订单表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| order_id | VARCHAR(64) | 系统订单号 |
| out_trade_no | VARCHAR(64) | 商户订单号 |
| user_id | INTEGER | 用户ID |
| total_fee | INTEGER | 金额（分） |
| order_type | VARCHAR(32) | 订单类型 |
| status | VARCHAR(32) | 状态 |
| ... | ... | ... |

### user_balances (用户余额表)
| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | INTEGER | 用户ID |
| balance | INTEGER | 当前余额（分） |
| total_recharged | INTEGER | 累计充值 |

## 环境变量
```
WX_MCHID=1114226626          # 商户号
WX_API_KEY=                  # API密钥（需从商户平台获取）
WX_APPID=                    # AppID（移动应用，审核中）
WX_PUBLIC_APPID=             # 公众号AppID（如有）
WX_NOTIFY_URL=https://your-domain.com/api/v1/payment/notify
```

## 关键配置

### 数据库连接
```
DATABASE_URL=postgresql://postgres.hmlqsbhbbclbzfuutrie:[密码]@13.114.6.6:5432/postgres?sslmode=disable
```

### 回调地址配置
部署后需要配置公网可访问的回调地址：
```
WX_NOTIFY_URL=https://你的域名/api/v1/payment/notify
```

## 待完成
- [ ] 获取 AppID（移动应用审核中）
- [ ] 获取 API密钥（从微信支付商户平台）
- [ ] 配置微信支付回调地址（需公网可访问）
