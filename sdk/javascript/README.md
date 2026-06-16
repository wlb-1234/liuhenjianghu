# 中国行政区划API JavaScript/TypeScript SDK

[![npm](https://img.shields.io/npm/v/@liuhenjianghu/regions-api.svg)](https://www.npmjs.com/package/@liuhenjianghu/regions-api)

中国行政区划API的官方JavaScript/TypeScript SDK，支持Node.js和浏览器环境。

## 特性

- 🌲 **完整行政区划** - 34省/333城市/2843区县/38721街道
- 📍 **经纬度支持** - 省市级中心点坐标
- 🗺️ **GeoJSON边界** - 地图可视化支持
- 📏 **距离计算** - 两点距离/方位角/坐标转换
- 🔄 **反向地理编码** - 根据坐标获取行政区划
- 📊 **监控统计** - 缓存/请求量/错误率
- 🔑 **API Key管理** - 创建/禁用/删除
- 🔔 **Webhook告警** - 钉钉/企业微信/飞书

## 安装

```bash
npm install @liuhenjianghu/regions-api
```

或

```bash
yarn add @liuhenjianghu/regions-api
```

或

```bash
pnpm add @liuhenjianghu/regions-api
```

## 快速开始

```typescript
import { RegionsAPI } from '@liuhenjianghu/regions-api';

// 初始化客户端
const api = new RegionsAPI({
  baseURL: 'https://your-api-url.com', // 可选，默认 http://localhost:8080
  apiKey: 'your-api-key',              // 可选
});

// 获取所有省份
const { data: provinces } = await api.getProvinces();
console.log(provinces);

// 获取省份下的城市
const { data: cities } = await api.getCities('44'); // 广东省
console.log(cities);

// 搜索行政区划
const { data: results } = await api.search('广州');
console.log(results);

// 计算距离
const { data: distance } = await api.calculateDistance(
  39.9042, 116.4074,  // 北京
  31.2304, 121.4737,  // 上海
  'km'
);
console.log(distance.humanReadable); // "1067.31公里"
```

## API 文档

### 行政区划

```typescript
// 数据统计
api.getStats();

// 省份
api.getProvinces();
api.getProvince('11'); // 北京

// 城市
api.getCities('44'); // 广东省下所有城市
api.getCity('4401'); // 广州

// 区县
api.getDistricts('4401'); // 广州市下所有区县
api.getDistrict('440103'); // 越秀区

// 街道
api.getStreets('440103'); // 越秀区下所有街道
api.getStreet('440103001'); // 街道详情

// 通用下级查询
api.getChildren('44'); // 自动识别级别，返回城市列表

// 搜索
api.search('广州'); // 搜索包含"广州"的行政区划

// 完整路径
api.getPath('440103001'); // 返回 广东省 > 广州市 > 越秀区 > xxx街道
```

### 地理计算

```typescript
// 两点距离
api.calculateDistance(lat1, lng1, lat2, lng2, 'km');

// 方位角
api.calculateBearing(lat1, lng1, lat2, lng2);

// 坐标转换
api.convertCoordinate(39.9042, 116.4074);

// 批量距离
api.batchCalculateDistance([
  { lat: 39.9042, lng: 116.4074, name: '北京' },
  { lat: 31.2304, lng: 121.4737, name: '上海' },
]);
```

### GeoJSON边界

```typescript
// 所有省份边界
const { data } = await api.getProvincesGeoJSON();

// 单个省份边界
const { data } = await api.getProvinceGeoJSON('11');
```

### 反向地理编码

```typescript
// 根据经纬度获取行政区划
const { data } = await api.reverseGeocode(39.9042, 116.4074);
// 返回: { province, city, district, nearestStreet, distance }
```

### 监控统计

```typescript
// 缓存统计
api.getCacheStats();

// Prometheus指标
const metrics = await api.getMetrics();

// 汇总统计
api.getMetricsSummary();

// 实时监控
api.getRealtimeStats();
```

### API Key管理

```typescript
// 获取所有Key
api.getAPIKeys();

// 创建Key
const { data } = await api.createAPIKey('我的应用');

// 删除Key
api.deleteAPIKey('key-id');

// 使用统计
api.getAPIKeyStats();
```

### Webhook管理

```typescript
// 获取所有Webhook
api.getWebhooks();

// 添加Webhook
api.addWebhook({
  id: 'dingtalk',
  url: 'https://oapi.dingtalk.com/robot/send?access_token=xxx',
  type: 'dingtalk',
  enabled: true,
});

// 删除Webhook
api.deleteWebhook('dingtalk');
```

## 类型定义

SDK提供完整的TypeScript类型定义：

```typescript
import type {
  Province,
  City,
  District,
  Street,
  RegionPath,
  RegionStats,
  SearchResult,
  DistanceResult,
  GeoJSONFeature,
  ApiResponse,
} from '@liuhenjianghu/regions-api';
```

## 错误处理

```typescript
import { RegionsAPI } from '@liuhenjianghu/regions-api';

const api = new RegionsAPI({ apiKey: 'xxx' });

try {
  const { data } = await api.getProvinces();
  console.log(data);
} catch (error) {
  if (error.message.includes('401')) {
    console.error('API Key无效');
  } else if (error.message.includes('429')) {
    console.error('请求过于频繁');
  } else {
    console.error('请求失败:', error.message);
  }
}
```

## 配置选项

```typescript
const api = new RegionsAPI({
  baseURL: 'https://api.example.com',  // API地址
  apiKey: 'your-api-key',              // API密钥
  timeout: 30000,                      // 超时时间(ms)
  retry: 3,                             // 重试次数
});
```

## License

MIT
