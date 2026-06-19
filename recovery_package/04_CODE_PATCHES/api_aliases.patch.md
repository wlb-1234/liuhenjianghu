# API 路由别名配置

> 本文件记录已添加的 API 路由别名，用于兼容旧版前端调用

---

## 1. 收入统计别名

**文件**: `server/src/routes/revenue.ts`

**别名路由**:
```typescript
router.get('/stats', getRevenueStats);  // GET /api/v1/revenue/stats
```

**主路由**:
```typescript
router.get('/overview', getRevenueStats);  // GET /api/v1/revenue/overview
```

**说明**: `/stats` 是 `/overview` 的别名，功能完全相同

---

## 2. 会员等级别名

**文件**: `server/src/routes/members.ts`

**别名路由**:
```typescript
router.get('/levels', (req, res) => { ... });  // GET /api/v1/members/levels
```

**主路由**:
```typescript
router.get('/config/levels', getMemberLevels);  // GET /api/v1/members/config/levels
```

**说明**: `/levels` 是 `/config/levels` 的别名，功能完全相同

---

## 使用方式

前端可以直接使用别名路由，无需关心具体实现：

```javascript
// 两种方式都可以
fetch('/api/v1/revenue/stats')
fetch('/api/v1/revenue/overview')

fetch('/api/v1/members/levels')
fetch('/api/v1/members/config/levels')
```
