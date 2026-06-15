# 中国行政区划API系统 - 完整数据配置文档

> 更新时间：2026-06-15 22:15:00
> 版本：v2.0.0
> 状态：生产就绪

---

## 一、系统概述

### 1.1 项目背景
中国行政区划API系统提供完整的中华人民共和国行政区划数据，支持四级联动查询（省→市→区县→街道），包含港澳台地区数据。

### 1.2 技术架构
- **后端框架**：Express.js + TypeScript
- **模块系统**：ES Module
- **端口配置**：PORT 环境变量（默认8080）
- **Node版本**：Node.js 20+

---

## 二、数据统计

### 2.1 行政区划数据（民政部2025年标准）

| 级别 | 数量 | 说明 |
|------|------|------|
| 省级 | 34个 | 23省+5自治区+4直辖市+2特别行政区 |
| 地级 | 333个 | 293地级市+7地区+30自治州+3盟 |
| 区县 | 2843个 | 含市辖区、县级市、县等 |
| 乡级 | 38721个 | 街道+镇+乡+民族乡+苏木 |

### 2.2 乡级数据明细

| 类型 | 数量 |
|------|------|
| 街道 | 9,148个 |
| 镇 | 21,554个 |
| 乡 | 6,910个 |
| 民族乡 | 955个 |
| 苏木/民族苏木 | 154个 |

### 2.3 港澳台数据

| 地区 | 城市/区 | 区县/区 |
|------|---------|---------|
| 台湾省 | 20个 | 333个 |
| 香港特别行政区 | 1个 | 18个区 |
| 澳门特别行政区 | 1个 | 8个区 |

---

## 三、编码规则

### 3.1 代码结构

```
省级（2位）：  11    → 北京市
地级（4位）：  1101  → 北京市辖区
区县（6位）：  110101 → 东城区
乡级（9位）：  110101001 → 东华门街道
```

### 3.2 省级代码范围

| 代码范围 | 地区 |
|----------|------|
| 11-15 | 华北地区（北京、天津、河北、山西、内蒙古） |
| 21-23 | 东北地区（辽宁、吉林、黑龙江） |
| 31-37 | 华东地区（上海、江苏、浙江、安徽、福建、江西、山东） |
| 41-46 | 华中地区（河南、湖北、湖南、广东、广西、海南） |
| 50-54 | 西南地区（重庆、四川、贵州、云南、西藏） |
| 61-65 | 西北地区（陕西、甘肃、青海、宁夏、新疆） |
| 71 | 台湾省 |
| 81 | 香港特别行政区 |
| 82 | 澳门特别行政区 |

---

## 四、数据结构

### 4.1 省级数据模型

```typescript
interface Province {
  code: string;        // 省级代码（2位）
  name: string;       // 省级名称
  lat?: number;       // 纬度
  lng?: number;       // 经度
}
```

### 4.2 地级数据模型

```typescript
interface City {
  code: string;       // 地级代码（4位）
  name: string;       // 地级名称
  provinceCode: string; // 所属省份代码
  lat?: number;       // 纬度
  lng?: number;       // 经度
}
```

### 4.3 区县数据模型

```typescript
interface District {
  code: string;       // 区县代码（6位）
  name: string;       // 区县名称
  cityCode: string;   // 所属城市代码
  provinceCode: string; // 所属省份代码
}
```

### 4.4 街道数据模型

```typescript
interface Street {
  code: string;       // 街道代码（9位）
  name: string;       // 街道名称
  districtCode: string; // 所属区县代码
  cityCode: string;   // 所属城市代码
  provinceCode: string; // 所属省份代码
}
```

### 4.5 响应格式

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  cached?: boolean;
  timestamp?: string;
  message?: string;
}
```

---

## 五、API接口文档

### 5.1 健康与统计

#### GET /api/v1/health
健康检查

**响应示例**：
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-06-15T14:10:00.000Z",
    "uptime": 3600
  }
}
```

#### GET /api/v1/regions/stats
数据统计

**响应示例**：
```json
{
  "success": true,
  "data": {
    "provinces": 34,
    "cities": 333,
    "districts": 2843,
    "streets": 38721,
    "hkMacauTaiwan": {
      "taiwan": { "cities": 20, "districts": 333 },
      "hongKong": { "districts": 18 },
      "macau": { "districts": 8 }
    }
  }
}
```

---

### 5.2 行政区划查询

#### GET /api/v1/regions/provinces
获取所有省级行政区

**认证**：API Key

**响应示例**：
```json
{
  "success": true,
  "cached": true,
  "data": [
    { "code": "11", "name": "北京市", "lat": 39.9042, "lng": 116.4074 },
    { "code": "12", "name": "天津市", "lat": 39.1256, "lng": 117.1909 }
  ]
}
```

#### GET /api/v1/regions/cities/:code
获取省级下所有城市

**参数**：
- `code`：省级代码（2位）

**示例**：`GET /api/v1/regions/cities/44`（广东省）

#### GET /api/v1/regions/districts/:code
获取城市下所有区县

**参数**：
- `code`：城市代码（4位）

**示例**：`GET /api/v1/regions/districts/4401`（广州市）

#### GET /api/v1/regions/streets/:code
获取区县下所有街道

**参数**：
- `code`：区县代码（6位）

**示例**：`GET /api/v1/regions/streets/440103`（越秀区）

#### GET /api/v1/regions/children/:code
通用下级查询

**参数**：
- `code`：行政区代码

**说明**：自动根据code位数返回下级数据

#### GET /api/v1/regions/search?keyword=
模糊搜索

**参数**：
- `keyword`：搜索关键词

**示例**：`GET /api/v1/regions/search?keyword=广州`

#### GET /api/v1/regions/path/:code
获取完整路径

**参数**：
- `code`：任意级别行政区代码

**示例**：`GET /api/v1/regions/path/440103001`

**响应**：
```json
{
  "success": true,
  "data": {
    "province": { "code": "44", "name": "广东省" },
    "city": { "code": "4401", "name": "广州市" },
    "district": { "code": "440103", "name": "越秀区" },
    "street": { "code": "440103001", "name": "北京街道" }
  }
}
```

---

### 5.3 GeoJSON边界数据

#### GET /api/v1/geojson/provinces
获取所有省级边界

#### GET /api/v1/geojson/provinces/:code
获取单个省级边界

**响应格式**：
```json
{
  "success": true,
  "data": {
    "code": "11",
    "name": "北京市",
    "center": { "lat": 39.9042, "lng": 116.4074 }
  }
}
```

---

### 5.4 API Key管理

#### GET /api/v1/apikeys/keys
获取所有API Key

#### POST /api/v1/apikeys/keys
创建新API Key

**请求体**：
```json
{
  "name": "密钥名称",
  "rateLimit": 100
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "key": "sk_xxxxxxxxxxxx",
    "name": "密钥名称",
    "rateLimit": 100,
    "active": true,
    "createdAt": "2026-06-15T14:10:00.000Z"
  }
}
```

#### PATCH /api/v1/apikeys/keys/:key
更新API Key状态

**请求体**：
```json
{
  "active": false
}
```

#### DELETE /api/v1/apikeys/keys/:key
删除API Key

#### GET /api/v1/apikeys/stats
获取API Key使用统计

---

### 5.5 监控与日志

#### GET /metrics
Prometheus指标端点

**指标说明**：
- `http_requests_total`：HTTP请求总数
- `http_request_duration_seconds`：请求响应时间
- `cache_hits_total`：缓存命中次数
- `cache_misses_total`：缓存未命中次数
- `api_calls_total`：API调用次数（按端点）

#### GET /api/v1/cache/stats
缓存统计

#### GET /api/v1/logs/stats
日志统计

#### GET /api/v1/logs/recent
最近请求日志

#### GET /api/v1/logs/alerts
告警信息

---

## 六、认证配置

### 6.1 API Key认证

**请求头**：
```
x-api-key: sk_dev_key_abc123
```

### 6.2 公开接口（无需认证）

| 接口 | 说明 |
|------|------|
| GET /api/v1/health | 健康检查 |
| GET /api/v1/regions/stats | 数据统计 |
| GET /metrics | Prometheus指标 |
| GET /api/v1/cache/stats | 缓存统计 |
| GET /api/v1/logs/* | 日志接口 |

### 6.3 认证接口

| 接口 | 说明 |
|------|------|
| GET /api/v1/regions/* | 所有行政区划接口 |
| GET /api/v1/geojson/* | GeoJSON边界接口 |
| GET /api/v1/apikeys/* | API Key管理接口 |

---

## 七、限流配置

### 7.1 默认配置

- **全局限制**：100次/分钟
- **响应头**：`X-RateLimit-Remaining`, `X-RateLimit-Reset`

### 7.2 响应状态码

| 状态码 | 说明 |
|--------|------|
| 429 | 请求过于频繁 |

---

## 八、错误响应

### 8.1 错误格式

```json
{
  "success": false,
  "message": "错误描述",
  "code": "ERROR_CODE"
}
```

### 8.2 错误码列表

| 错误码 | 说明 |
|--------|------|
| 40000 | 无效的行政区代码 |
| 40100 | 缺少API Key |
| 40101 | 无效的API Key |
| 40102 | API Key已被禁用 |
| 42900 | 请求频率超限 |

---

## 九、监控告警

### 9.1 告警类型

| 类型 | 阈值 | 说明 |
|------|------|------|
| HIGH_ERROR_RATE | 10% | 错误率超过10% |
| SLOW_RESPONSE | 5000ms | 平均响应时间超过5秒 |

### 9.2 告警格式

```json
{
  "success": true,
  "data": {
    "count": 1,
    "alerts": [
      {
        "timestamp": "2026-06-15T14:00:00.000Z",
        "type": "HIGH_ERROR_RATE",
        "message": "错误率过高: 15.00%",
        "details": {
          "errorRate": 15,
          "threshold": 10
        }
      }
    ]
  }
}
```

---

## 十、日志配置

### 10.1 日志级别

| 级别 | 说明 |
|------|------|
| error | 错误日志 |
| warn | 警告日志 |
| info | 信息日志 |
| http | HTTP请求日志 |

### 10.2 日志格式

```json
{
  "timestamp": "2026-06-15T14:10:00.000Z",
  "level": "info",
  "message": "请求处理完成",
  "method": "GET",
  "path": "/api/v1/regions/provinces",
  "statusCode": 200,
  "responseTime": 5
}
```

---

## 十一、文件结构

```
server/
├── src/
│   ├── index.ts                 # 应用入口
│   ├── data/
│   │   ├── regions.ts          # 行政区划数据
│   │   ├── coordinates.ts      # 经纬度坐标数据
│   │   └── geojson.ts          # GeoJSON边界数据
│   ├── routes/
│   │   ├── regions.ts          # 行政区划路由
│   │   ├── geojson.ts          # GeoJSON路由
│   │   └── stats.ts            # 统计路由
│   └── middleware/
│       ├── apiKeyAuth.ts       # API Key认证
│       ├── apiKeyManager.ts    # API Key管理
│       ├── cache.ts            # 缓存中间件
│       ├── logger.ts           # 日志中间件
│       ├── logPersistence.ts    # 日志持久化
│       ├── prometheus.ts       # Prometheus指标
│       └── errorHandler.ts     # 错误处理
├── dist/                        # 编译输出
└── package.json
```

---

## 十二、部署配置

### 12.1 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| PORT | 服务端口 | 8080 |
| NODE_ENV | 运行环境 | production |

### 12.2 Docker配置

- **基础镜像**：node:20-slim
- **暴露端口**：8080
- **工作目录**：/app

---

## 十三、更新记录

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2026-06-15 22:15 | v2.0.0 | 完成四项优化：监控、API Key管理、GeoJSON、日志告警 |
| 2026-06-15 21:50 | v1.5.0 | 添加经纬度坐标、内存缓存 |
| 2026-06-15 21:30 | v1.0.0 | 基础功能上线：四级行政区划API |

---

## 十四、下一步优化方向

1. **Redis分布式缓存**：支持多实例共享缓存
2. **PostgreSQL数据存储**：持久化存储，支持复杂查询
3. **WebSocket实时推送**：数据更新时主动推送
4. **SDK自动生成**：Java/Python/Go SDK
5. **历史数据支持**：查询历史行政区划

---

*文档生成时间：2026-06-15 22:15:00*
