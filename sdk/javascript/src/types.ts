/**
 * 中国行政区划API SDK
 * 类型定义
 */

// 行政区划基础信息
export interface RegionBase {
  code: string;
  name: string;
  fullName?: string;
}

// 省级信息
export interface Province extends RegionBase {
  lat?: number;
  lng?: number;
}

// 城市信息
export interface City extends RegionBase {
  provinceCode: string;
  lat?: number;
  lng?: number;
}

// 区县信息
export interface District extends RegionBase {
  cityCode: string;
  provinceCode: string;
}

// 街道信息
export interface Street extends RegionBase {
  districtCode: string;
  cityCode: string;
  provinceCode: string;
}

// 完整路径信息
export interface RegionPath {
  province: Province;
  city?: City;
  district?: District;
  street?: Street;
}

// 数据统计
export interface RegionStats {
  provinces: number;
  cities: number;
  districts: number;
  streets: number;
  total: number;
}

// 搜索结果
export interface SearchResult {
  type: 'province' | 'city' | 'district' | 'street';
  code: string;
  name: string;
  fullName: string;
}

// 距离计算
export interface Coordinate {
  lat: number;
  lng: number;
}

export interface DistanceResult {
  from: Coordinate;
  to: Coordinate;
  distance: number;
  unit: 'km' | 'm' | 'mile' | 'nautical_mile';
  humanReadable: string;
  details: {
    km: number;
    m: number;
    mile: number;
  };
  bearing: {
    degrees: number;
    direction: string;
  };
}

export interface BearingResult {
  from: Coordinate;
  to: Coordinate;
  bearing: {
    degrees: number;
    direction: string;
    description: string;
  };
}

export interface CoordinateConvertResult {
  decimal: Coordinate;
  dms: {
    lat: string;
    lng: string;
  };
  string: string;
  geohash: string;
}

// GeoJSON边界
export interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    code: string;
    name: string;
    type: string;
    center: Coordinate;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

// API响应格式
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  cached?: boolean;
  timestamp?: number;
}

// SDK配置
export interface RegionsAPIConfig {
  baseURL?: string;
  apiKey?: string;
  timeout?: number;
  retry?: number;
}

// API Key信息
export interface APIKeyInfo {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed?: string;
  requestCount: number;
  enabled: boolean;
}

// 缓存统计
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
}

// 监控统计
export interface MetricsStats {
  uptime: number;
  totalRequests: number;
  totalErrors: number;
  avgResponseTime: number;
  requestsPerMinute: number;
  errorRate: number;
}

// 日志条目
export interface LogEntry {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  status: number;
  responseTime: number;
  ip: string;
  apiKey?: string;
  userAgent?: string;
}

// 告警配置
export interface AlertConfig {
  errorRateThreshold: number;
  latencyThreshold: number;
  enabled: boolean;
}

// Webhook配置
export interface WebhookConfig {
  id: string;
  url: string;
  type: 'dingtalk' | 'wecom' | 'feishu' | 'slack' | 'custom';
  enabled: boolean;
  createdAt: string;
}

// 反向地理编码结果
export interface ReverseGeocodeResult {
  coordinate: Coordinate;
  province?: Province;
  city?: City;
  district?: District;
  nearestStreet?: Street;
  distance: number; // 距离最近街道的距离(米)
}
