# 中国行政区划API系统 - 数据结构参数配置总结

**生成时间**: 2026-06-15 14:30:00  
**版本**: v7.0.0

---

## 一、数据结构层级

```
┌─────────────────────────────────────────────────────────────┐
│  一级：省级（PROVINCE） - 34个                              │
│  ├── 二级：城市（CITY） - 333个                             │
│  │   └── 三级：区县（DISTRICT） - 2843个                   │
│  │       └── 四级：街道/乡镇（STREET） - 38721个           │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、编码规则

### 行政区划代码结构

| 级别 | 代码位数 | 说明 | 示例 |
|------|----------|------|------|
| **省级** | 2位 | 行政区划基本区划码 | `11`（北京市） |
| **城市** | 4位 | 省级代码+城市代码 | `1101`（市辖区） |
| **区县** | 6位 | 城市代码+区县代码 | `110101`（东城区） |
| **街道** | 9位 | 区县代码+街道序号 | `110101001`（东华门街道） |

### 编码范围

| 省级代码 | 范围 | 说明 |
|----------|------|------|
| `01-02` | 华北地区 | 北京、天津、河北、山西、内蒙古 |
| `03-07` | 东北地区 | 辽宁、吉林、黑龙江 |
| `08-16` | 华东地区 | 上海、江苏、浙江、安徽、福建、江西、山东 |
| `17-24` | 华中地区 | 河南、湖北、湖南 |
| `25-34` | 华南地区 | 广东、广西、海南 |
| `35-44` | 西南地区 | 重庆、四川、贵州、云南、西藏 |
| `45-54` | 西北地区 | 陕西、甘肃、青海、宁夏、新疆 |
| `71` | 台湾省 | 台湾省 |
| `81` | 香港特别行政区 | 香港 |
| `82` | 澳门特别行政区 | 澳门 |

---

## 三、数据模型

### 3.1 省级数据 (Province)

```typescript
interface Province {
  code: string;           // 省级代码（2位）| "11"
  name: string;           // 省级名称 | "北京市"
  type: string;           // 行政类型 | "直辖市"
  coordinates?: {         // 经纬度坐标
    lat: number;          // 纬度 | 39.9042
    lng: number;          // 经度 | 116.4074
  };
}
```

### 3.2 城市数据 (City)

```typescript
interface City {
  code: string;           // 城市代码（4位）| "1101"
  name: string;           // 城市名称 | "市辖区"
  provinceCode: string;   // 所属省级代码 | "11"
  type: string;           // 行政类型 | "市辖区"
  coordinates?: {         // 经纬度坐标
    lat: number;          // 纬度 | 39.9042
    lng: number;          // 经度 | 116.4074
  };
}
```

### 3.3 区县数据 (District)

```typescript
interface District {
  code: string;           // 区县代码（6位）| "110101"
  name: string;           // 区县名称 | "东城区"
  cityCode: string;       // 所属城市代码 | "1101"
  type: string;           // 行政类型 | "市辖区"
  coordinates?: {         // 经纬度坐标
    lat: number;          // 纬度（估算值）
    lng: number;          // 经度（估算值）
  };
}
```

### 3.4 街道数据 (Street)

```typescript
interface Street {
  code: string;           // 街道代码（9位）| "110101001"
  name: string;           // 街道名称 | "东华门街道"
  districtCode: string;   // 所属区县代码 | "110101"
  type: string;           // 行政类型 | "街道"
  coordinates?: {         // 经纬度坐标
    lat: number;          // 纬度（估算值）
    lng: number;          // 经度（估算值）
  };
}
```

---

## 四、API接口参数说明

### 4.1 健康检查接口

```
GET /api/v1/health
```

**参数**: 无

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "status": "ok",
    "timestamp": "2026-06-15T06:30:00.000Z",
    "uptime": 3600
  }
}
```

---

### 4.2 数据统计接口

```
GET /api/v1/regions/stats
```

**参数**: 无

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "provinces": 34,
    "cities": 333,
    "districts": 2843,
    "streets": 38721,
    "lastUpdated": "2025-12-31"
  }
}
```

---

### 4.3 省级列表接口

```
GET /api/v1/regions/provinces
```

**参数**: 无

**请求头**:
```
x-api-key: sk_dev_key_abc123
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "cached": true,
  "count": 34,
  "data": [
    {
      "code": "11",
      "name": "北京市",
      "type": "直辖市",
      "coordinates": { "lat": 39.9042, "lng": 116.4074 }
    }
  ]
}
```

---

### 4.4 城市列表接口

```
GET /api/v1/regions/cities/:code
```

**路径参数**:

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| code | string | 是 | 省级代码（2位） | `11` |

**请求头**:
```
x-api-key: sk_dev_key_abc123
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "cached": false,
  "count": 16,
  "data": [
    {
      "code": "1101",
      "name": "市辖区",
      "provinceCode": "11",
      "type": "市辖区",
      "coordinates": { "lat": 39.9042, "lng": 116.4074 }
    }
  ]
}
```

---

### 4.5 区县列表接口

```
GET /api/v1/regions/districts/:code
```

**路径参数**:

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| code | string | 是 | 城市代码（4位） | `1101` |

**请求头**:
```
x-api-key: sk_dev_key_abc123
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "cached": true,
  "count": 16,
  "data": [
    {
      "code": "110101",
      "name": "东城区",
      "cityCode": "1101",
      "type": "市辖区",
      "coordinates": { "lat": 39.9283, "lng": 116.4167 }
    }
  ]
}
```

---

### 4.6 街道列表接口

```
GET /api/v1/regions/streets/:code
```

**路径参数**:

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| code | string | 是 | 区县代码（6位） | `110101` |

**请求头**:
```
x-api-key: sk_dev_key_abc123
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "cached": true,
  "count": 17,
  "data": [
    {
      "code": "110101001",
      "name": "东华门街道",
      "districtCode": "110101",
      "type": "街道"
    }
  ]
}
```

---

### 4.7 下级区域查询接口

```
GET /api/v1/regions/children/:code
```

**路径参数**:

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| code | string | 是 | 行政区划代码（2/4/6位） | `11` |

**请求头**:
```
x-api-key: sk_dev_key_abc123
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "code": "1101",
      "name": "市辖区",
      "level": "city",
      "type": "市辖区"
    }
  ]
}
```

---

### 4.8 模糊搜索接口

```
GET /api/v1/regions/search?keyword=keyword&level=level&limit=limit
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 | 默认值 |
|------|------|------|------|--------|
| keyword | string | 是 | 搜索关键词 | - |
| level | string | 否 | 行政级别（province/city/district/street） | 全部 |
| limit | number | 否 | 返回数量限制 | 20 |

**请求头**:
```
x-api-key: sk_dev_key_abc123
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "count": 5,
  "data": [
    {
      "code": "11",
      "name": "北京市",
      "level": "province",
      "path": ["北京市"]
    }
  ]
}
```

---

### 4.9 完整路径查询接口

```
GET /api/v1/regions/path/:code
```

**路径参数**:

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| code | string | 是 | 行政区划代码（2-9位） | `110101001` |

**请求头**:
```
x-api-key: sk_dev_key_abc123
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "province": { "code": "11", "name": "北京市" },
    "city": { "code": "1101", "name": "市辖区" },
    "district": { "code": "110101", "name": "东城区" },
    "street": { "code": "110101001", "name": "东华门街道" }
  }
}
```

---

### 4.10 城市详情接口（含坐标）

```
GET /api/v1/regions/city/:code
```

**路径参数**:

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| code | string | 是 | 城市代码（4位） | `1101` |

**请求头**:
```
x-api-key: sk_dev_key_abc123
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "code": "1101",
    "name": "市辖区",
    "provinceCode": "11",
    "provinceName": "北京市",
    "type": "市辖区",
    "coordinates": { "lat": 39.9042, "lng": 116.4074 }
  }
}
```

---

### 4.11 区县详情接口（含坐标）

```
GET /api/v1/regions/district/:code
```

**路径参数**:

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| code | string | 是 | 区县代码（6位） | `110101` |

**请求头**:
```
x-api-key: sk_dev_key_abc123
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "code": "110101",
    "name": "东城区",
    "cityCode": "1101",
    "cityName": "市辖区",
    "provinceCode": "11",
    "provinceName": "北京市",
    "type": "市辖区",
    "coordinates": { "lat": 39.9283, "lng": 116.4167 }
  }
}
```

---

### 4.12 街道详情接口（含坐标）

```
GET /api/v1/regions/street/:code
```

**路径参数**:

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| code | string | 是 | 街道代码（9位） | `110101001` |

**请求头**:
```
x-api-key: sk_dev_key_abc123
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "code": "110101001",
    "name": "东华门街道",
    "districtCode": "110101",
    "districtName": "东城区",
    "cityCode": "1101",
    "cityName": "市辖区",
    "provinceCode": "11",
    "provinceName": "北京市",
    "type": "街道",
    "coordinates": { "lat": 39.9250, "lng": 116.4100 }
  }
}
```

---

### 4.13 缓存统计接口

```
GET /api/v1/cache/stats
```

**参数**: 无

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "keys": 50,
    "hits": 1523,
    "misses": 156,
    "hitRate": "90.7%",
    "ttl": {
      "provinces": "1天",
      "cities": "1小时",
      "districts": "1小时",
      "streets": "1小时"
    }
  }
}
```

---

### 4.14 缓存清空接口

```
POST /api/v1/cache/flush
DELETE /api/v1/cache/flush/:key
```

**参数**: 无

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": { "flushed": 50 }
}
```

---

### 4.15 统计汇总接口

```
GET /api/v1/stats/summary
```

**请求头**:
```
x-api-key: sk_dev_key_abc123
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalRequests": 1523,
    "avgTime": 5,
    "successRate": 99.8,
    "endpointCount": 12,
    "errorRate": 0.2
  }
}
```

---

### 4.16 接口统计接口

```
GET /api/v1/stats/endpoints
```

**请求头**:
```
x-api-key: sk_dev_key_abc123
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "endpoint": "/regions/provinces",
      "count": 523,
      "avgTime": 3,
      "successRate": 100
    }
  ]
}
```

---

### 4.17 实时监控接口

```
GET /api/v1/stats/realtime
```

**请求头**:
```
x-api-key: sk_dev_key_abc123
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "last1min": 45,
    "last5min": 198,
    "last15min": 567,
    "lastRequest": {
      "endpoint": "/regions/provinces",
      "method": "GET",
      "status": 200,
      "time": 2,
      "timestamp": "2026-06-15T06:29:58.000Z"
    }
  }
}
```

---

### 4.18 每日统计接口

```
GET /api/v1/stats/daily?days=days
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 | 默认值 |
|------|------|------|------|--------|
| days | number | 否 | 查询天数 | 7 |

**请求头**:
```
x-api-key: sk_dev_key_abc123
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "date": "2026-06-15",
      "requests": 523,
      "avgTime": 5,
      "successRate": 99.8
    }
  ]
}
```

---

### 4.19 请求日志接口

```
GET /api/v1/stats/logs?limit=limit&offset=offset
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 | 默认值 |
|------|------|------|------|--------|
| limit | number | 否 | 每页数量 | 50 |
| offset | number | 否 | 偏移量 | 0 |

**请求头**:
```
x-api-key: sk_dev_key_abc123
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 1523,
    "logs": [
      {
        "id": 1523,
        "endpoint": "/regions/provinces",
        "method": "GET",
        "status": 200,
        "time": 2,
        "timestamp": "2026-06-15T06:29:58.000Z"
      }
    ]
  }
}
```

---

## 五、响应状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | API密钥无效或缺失 |
| 403 | API密钥无权限 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁（限流） |
| 500 | 服务器内部错误 |

---

## 六、错误响应格式

```json
{
  "code": 400,
  "message": "error",
  "error": {
    "code": 400,
    "message": "Invalid code format",
    "detail": "Code must be 2, 4, 6, or 9 characters"
  }
}
```

---

## 七、认证说明

### 公开接口（无需认证）
- `GET /api/v1/health`
- `GET /api/v1/regions/stats`
- `GET /api/v1/cache/stats`
- `GET /api/v1/api-docs/*`

### 认证接口（需添加请求头）
```
x-api-key: sk_dev_key_abc123
```

### API密钥配置

| 环境 | 密钥 | 用途 |
|------|------|------|
| 开发环境 | `sk_dev_key_abc123` | 测试开发 |
| 生产环境 | `sk_prod_key_xyz789` | 正式上线 |

---

## 八、限流配置

| 限制类型 | 限制值 |
|----------|--------|
| 时间窗口 | 1分钟 |
| 最大请求数 | 100次 |
| 超限响应 | 429 Too Many Requests |

---

## 九、数据更新记录

| 日期 | 版本 | 更新内容 |
|------|------|----------|
| 2026-06-15 | v7.0.0 | 完成上线运营优化 |
| 2025-12-31 | v6.0.0 | 对接民政部最新数据 |
| 2025-01-01 | v1.0.0 | 初始版本发布 |

---

**文档生成时间**: 2026-06-15 14:30:00  
**文档版本**: v7.0.0
