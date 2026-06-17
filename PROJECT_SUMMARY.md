# 流痕江湖 - 项目完整总结

> 最后更新时间：2026-06-17
> 版本：v3.0.0

---

## 一、项目概述

### 1.1 项目信息
- **项目名称**：流痕江湖
- **版本**：v3.0.0
- **技术栈**：Express.js + React Native (Expo) + Supabase
- **部署平台**：Railway
- **访问地址**：
  - API：`https://liuhenjianghu.com/api/v1`
  - 管理后台PC：`https://liuhenjianghu.com/admin`
  - 管理后台手机：`https://liuhenjianghu.com/admin-mobile`

### 1.2 目录结构

```
/workspace/projects/
├── client/                     # React Native 前端
│   ├── app/                    # Expo Router 路由
│   ├── screens/                # 页面实现
│   ├── components/             # 组件
│   ├── hooks/                  # 自定义Hooks
│   ├── contexts/               # Context状态管理
│   ├── utils/                  # 工具函数
│   └── global.css              # 全局样式
├── server/                     # Express.js 后端
│   ├── src/
│   │   ├── index.ts            # 主入口
│   │   ├── config/             # 配置
│   │   ├── routes/             # 路由（所有API在这里）
│   │   ├── middleware/         # 中间件
│   │   ├── services/           # 服务层
│   │   ├── utils/              # 工具
│   │   ├── public/             # 静态文件（后台HTML）
│   │   └── data/               # 静态数据（行政区划）
│   └── package.json
└── package.json
```

---

## 二、后端API完整清单

### 2.1 核心路由文件 (server/src/routes/)

| 文件名 | 功能 | 路由前缀 |
|--------|------|----------|
| regions.ts | 行政区划查询 | /api/v1/regions |
| geo.ts | 距离计算/反向编码 | /api/v1/geo |
| reverse.ts | 坐标转行政区划 | /api/v1/geo/reverse |
| apikeys.ts | API密钥管理 | /api/v1/apikeys |
| whitelist.ts | IP白名单 | /api/v1/whitelist |
| stats.ts | 统计接口 | /api/v1/stats |
| feedback.ts | 用户反馈 | /api/v1/feedback |
| moderation.ts | 图片审核 | /api/v1/moderation |
| cache.ts | 缓存管理 | /api/v1/cache |
| notifications.ts | 推送通知 | /api/v1/notifications |
| members.ts | 会员管理 | /api/v1/members |
| revenue.ts | 收益统计 | /api/v1/revenue |
| reports.ts | 内容举报 | /api/v1/reports |
| operationLogs.ts | 操作日志 | /api/v1/operation-logs |
| rateLimit.ts | API限流 | /api/v1/rate-limit |
| blacklist.ts | 黑名单 | /api/v1/blacklist |
| orders.ts | 订单查询 | /api/v1/orders |
| points.ts | 积分系统 | /api/v1/points |
| dailyTasks.ts | 每日任务 | /api/v1/tasks |
| share.ts | 内容分享 | /api/v1/share |
| search.ts | 内容搜索 | /api/v1/search |
| dataExport.ts | 数据导出 | /api/v1/export |
| social.ts | 关注系统 | /api/v1/social |
| scheduledPost.ts | 定时发布 | /api/v1/scheduled |
| contentModeration.ts | 内容管理 | /api/v1/admin |
| i18n.ts | 多语言 | /api/v1/i18n |
| theme.ts | 主题管理 | /api/v1/theme |
| webhook.ts | Webhook | /api/v1/webhook |
| swagger.ts | API文档 | /api-docs |

### 2.2 API端点详细列表

#### 行政区划
```
GET  /api/v1/regions/provinces     - 获取省份列表
GET  /api/v1/regions/cities/:provinceCode - 获取城市列表
GET  /api/v1/regions/areas/:cityCode - 获取区县列表
GET  /api/v1/regions/towns/:areaCode - 获取乡镇列表
GET  /api/v1/regions/stats        - 统计信息
```

#### 地理功能
```
GET  /api/v1/geo/distance         - 计算两点距离
GET  /api/v1/geo/reverse          - 坐标转行政区划
```

#### API管理
```
GET  /api/v1/apikeys              - API密钥列表
POST /api/v1/apikeys              - 创建密钥
DELETE /api/v1/apikeys/:id        - 删除密钥
```

#### 安全
```
GET  /api/v1/whitelist            - IP白名单
POST /api/v1/whitelist            - 添加IP
DELETE /api/v1/whitelist/:ip      - 移除IP
GET  /api/v1/rate-limit/status    - 限流状态
POST /api/v1/reports              - 提交举报
GET  /api/v1/reports              - 举报列表
GET  /api/v1/blacklist            - 黑名单
POST /api/v1/blacklist            - 添加黑名单
```

#### 会员系统
```
GET  /api/v1/members/config/levels - 会员等级配置
GET  /api/v1/members/             - 会员列表
PUT  /api/v1/members/:id/level    - 调整会员等级
```

#### 收益统计
```
GET  /api/v1/revenue/overview     - 收益概览
GET  /api/v1/revenue/trend        - 收益趋势
GET  /api/v1/revenue/members     - 会员收益
GET  /api/v1/revenue/transactions - 交易记录
```

#### 积分系统
```
GET  /api/v1/points/balance/:userId - 积分余额
POST /api/v1/points/checkin       - 每日签到
POST /api/v1/points/earn          - 获取积分
POST /api/v1/points/spend         - 消耗积分
GET  /api/v1/points/shop          - 积分商城
GET  /api/v1/points/history/:userId - 积分明细
```

#### 用户功能
```
GET  /api/v1/notifications        - 通知列表
PUT  /api/v1/notifications/:id/read - 标记已读
GET  /api/v1/orders               - 订单列表
GET  /api/v1/orders/:id           - 订单详情
GET  /api/v1/tasks/tasks          - 任务列表
POST /api/v1/tasks/checkin        - 签到
POST /api/v1/share/generate        - 生成分享
GET  /api/v1/share/stats          - 分享统计
```

#### 管理功能
```
GET  /api/v1/operation-logs       - 操作日志
GET  /api/v1/db/stats             - 数据库统计
GET  /api/v1/cache/advanced/stats  - 缓存统计
GET  /api/v1/export/              - 数据导出
GET  /api/v1/search/hot           - 热词列表
GET  /api/v1/i18n/locales         - 支持的语言
GET  /api/v1/theme                - 主题配置
```

---

## 三、会员等级配置

### 3.1 免费用户
- 覆盖范围：仅本人所在镇/乡
- 每日发布：10条
- 留言留存：7天
- 基础功能（私聊、加好友、浏览）永久免费

### 3.2 付费会员

| 等级 | 覆盖 | 每日发布 | 留存 | 月费 |
|------|------|----------|------|------|
| L1 县级 | 本县 | 30条 | 15天 | ¥9 |
| L2 市级 | 本市 | 80条 | 30天 | ¥50 |
| L3 省级 | 本省 | 200条 | 60天 | ¥200 |
| L4 全国级 | 全国 | 不限 | 90天+置顶 | ¥2000 |

---

## 四、积分系统

### 4.1 积分获取

| 方式 | 积分 |
|------|------|
| 每日签到 | +5分 |
| 连续7天签到 | +50分 |
| 连续30天签到 | +300分 |
| 留言被点赞 | +1分 |
| 分享内容 | +3分/次 |
| 新增关注 | +1分/个 |
| 完善资料 | +10分 |

### 4.2 积分消耗

| 商品 | 积分 |
|------|------|
| 1天会员 | 100分 |
| 7天会员 | 600分 |
| 置顶1次 | 500分 |
| 置顶3次 | 1200分 |
| 解锁地区 | 200分 |
| 专属标识 | 1000分 |
| 私信特权 | 300分 |

### 4.3 用户等级

| 等级 | 累计积分 | 称号 |
|------|----------|------|
| 路人 | 0 | 🍃 |
| 初入江湖 | 100 | 💧 |
| 小有名气 | 500 | 🌟 |
| 江湖高手 | 2000 | 🔥 |
| 一代宗师 | 10000 | 👑 |

---

## 五、后台管理页面

### 5.1 PC管理后台
- 文件：server/public/admin.html
- 路由：/admin
- 功能：完整的可视化管理系统

### 5.2 手机管理后台
- 文件：server/public/admin-mobile.html
- 路由：/admin-mobile
- 功能：移动端优化的管理界面

### 5.3 后台功能模块

| 模块 | 功能 |
|------|------|
| 数据概览 | 收益、用户、订单统计 |
| API管理 | 密钥管理、IP白名单 |
| 会员管理 | 会员列表、等级调整 |
| 内容管理 | 查看、置顶、加精、删除 |
| 收益统计 | 日/周/月报表 |
| 积分管理 | 积分配置、签到记录 |
| 安全设置 | 举报处理、黑名单 |

---

## 六、环境变量配置

### 6.1 Railway 环境变量

```
PORT=5000
NODE_ENV=production
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
API_RATE_LIMIT_WINDOW_MS=60000
API_RATE_LIMIT_MAX_REQUESTS=100
```

### 6.2 DNS配置

```
记录类型：CNAME
主机记录：@
记录值：liuhenjianghu-production.up.railway.app
```

---

## 七、第三方集成

### 7.1 已集成
- Supabase（数据库、认证）
- Railway（部署）
- Redis（缓存，备用）

### 7.2 待接入
- YunGouOS（支付平台，审核中）
- 短信服务（验证码登录）

---

## 八、快速部署命令

```bash
# 1. 安装依赖
cd server && pnpm install
cd ../client && npx expo install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 填入 Supabase 配置

# 3. 构建后端
cd server
pnpm run build

# 4. 启动服务
PORT=5000 node dist/index.js

# 5. 部署到 Railway
# 在 Railway 控制台连接 GitHub 仓库即可自动部署
```

---

## 九、注意事项

1. **ES Module**：服务端使用 `"type": "module"`，禁止 require()
2. **路由顺序**：静态路由必须在动态路由之前
3. **数据库**：使用 Supabase PostgreSQL，已配置连接池
4. **静态文件**：admin.html 和 admin-mobile.html 在 public 目录，构建时需复制到 dist
5. **端口**：Railway 默认 5000，本地开发用 8080

---

## 十、代码风格规范

- 路由文件：使用 `export default router`，默认导出
- 导入方式：`import router from './routes/xxx.js'`
- 命名规范：文件名用小写下划线，路由前缀用 kebab-case
- 错误处理：统一返回 `{ success: boolean, data/error: any }`

---

*文档生成时间：2026-06-17*
