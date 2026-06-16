/**
 * 中国行政区划API SDK
 * API客户端
 */

import type {
  Province,
  City,
  District,
  Street,
  RegionPath,
  RegionStats,
  SearchResult,
  DistanceResult,
  BearingResult,
  CoordinateConvertResult,
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  ApiResponse,
  RegionsAPIConfig,
  APIKeyInfo,
  CacheStats,
  MetricsStats,
  LogEntry,
  AlertConfig,
  WebhookConfig,
  ReverseGeocodeResult,
  Coordinate,
} from './types';

const DEFAULT_BASE_URL = 'http://localhost:8080';

export class RegionsAPI {
  private baseURL: string;
  private apiKey: string;
  private timeout: number;
  private retry: number;

  constructor(config: RegionsAPIConfig = {}) {
    this.baseURL = config.baseURL || DEFAULT_BASE_URL;
    this.apiKey = config.apiKey || '';
    this.timeout = config.timeout || 30000;
    this.retry = config.retry || 3;
  }

  /**
   * 设置API密钥
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * 发送HTTP请求
   */
  private async request<T>(
    method: string,
    path: string,
    params?: Record<string, any>,
    body?: any
  ): Promise<T> {
    const url = new URL(path, this.baseURL);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.retry; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        const response = await fetch(url.toString(), {
          ...options,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.retry - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  // ==================== 健康检查 ====================

  /**
   * 健康检查
   */
  async healthCheck(): Promise<ApiResponse<{ status: string }>> {
    return this.request('GET', '/api/v1/health');
  }

  // ==================== 行政区划API ====================

  /**
   * 获取数据统计
   */
  async getStats(): Promise<ApiResponse<RegionStats>> {
    return this.request('GET', '/api/v1/regions/stats');
  }

  /**
   * 获取所有省份
   */
  async getProvinces(): Promise<ApiResponse<Province[]>> {
    return this.request('GET', '/api/v1/regions/provinces');
  }

  /**
   * 获取省份下的城市
   * @param provinceCode 省份代码 (2位)
   */
  async getCities(provinceCode: string): Promise<ApiResponse<City[]>> {
    return this.request('GET', `/api/v1/regions/cities/${provinceCode}`);
  }

  /**
   * 获取城市下的区县
   * @param cityCode 城市代码 (4位)
   */
  async getDistricts(cityCode: string): Promise<ApiResponse<District[]>> {
    return this.request('GET', `/api/v1/regions/districts/${cityCode}`);
  }

  /**
   * 获取区县下的街道
   * @param districtCode 区县代码 (6位)
   */
  async getStreets(districtCode: string): Promise<ApiResponse<Street[]>> {
    return this.request('GET', `/api/v1/regions/streets/${districtCode}`);
  }

  /**
   * 获取下级行政区划（通用方法）
   * @param code 行政区划代码
   */
  async getChildren(code: string): Promise<ApiResponse<(Province | City | District | Street)[]>> {
    return this.request('GET', `/api/v1/regions/children/${code}`);
  }

  /**
   * 搜索行政区划
   * @param keyword 搜索关键词
   */
  async search(keyword: string): Promise<ApiResponse<SearchResult[]>> {
    return this.request('GET', '/api/v1/regions/search', { keyword });
  }

  /**
   * 获取完整路径
   * @param code 任意级别行政区划代码
   */
  async getPath(code: string): Promise<ApiResponse<RegionPath>> {
    return this.request('GET', `/api/v1/regions/path/${code}`);
  }

  /**
   * 获取省份详情
   * @param code 省份代码
   */
  async getProvince(code: string): Promise<ApiResponse<Province>> {
    return this.request('GET', `/api/v1/regions/province/${code}`);
  }

  /**
   * 获取城市详情
   * @param code 城市代码
   */
  async getCity(code: string): Promise<ApiResponse<City>> {
    return this.request('GET', `/api/v1/regions/city/${code}`);
  }

  /**
   * 获取区县详情
   * @param code 区县代码
   */
  async getDistrict(code: string): Promise<ApiResponse<District>> {
    return this.request('GET', `/api/v1/regions/district/${code}`);
  }

  /**
   * 获取街道详情
   * @param code 街道代码
   */
  async getStreet(code: string): Promise<ApiResponse<Street>> {
    return this.request('GET', `/api/v1/regions/street/${code}`);
  }

  // ==================== 地理API ====================

  /**
   * 计算两点间距离
   */
  async calculateDistance(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
    unit: 'km' | 'm' | 'mile' | 'nautical_mile' = 'km'
  ): Promise<ApiResponse<DistanceResult>> {
    return this.request('GET', '/api/v1/geo/distance', {
      fromLat,
      fromLng,
      toLat,
      toLng,
      unit,
    });
  }

  /**
   * 计算方位角
   */
  async calculateBearing(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
  ): Promise<ApiResponse<BearingResult>> {
    return this.request('GET', '/api/v1/geo/bearing', {
      fromLat,
      fromLng,
      toLat,
      toLng,
    });
  }

  /**
   * 坐标格式转换
   */
  async convertCoordinate(lat: number, lng: number): Promise<ApiResponse<CoordinateConvertResult>> {
    return this.request('GET', '/api/v1/geo/convert', { lat, lng });
  }

  /**
   * 批量计算距离
   */
  async batchCalculateDistance(
    points: { lat: number; lng: number; name?: string }[]
  ): Promise<ApiResponse<{ distances: DistanceResult[] }>> {
    return this.request('POST', '/api/v1/geo/distance/batch', undefined, { points });
  }

  // ==================== GeoJSON边界 ====================

  /**
   * 获取所有省份边界
   */
  async getProvincesGeoJSON(): Promise<ApiResponse<GeoJSONFeatureCollection>> {
    return this.request('GET', '/api/v1/geojson/provinces');
  }

  /**
   * 获取指定省份边界
   * @param code 省份代码
   */
  async getProvinceGeoJSON(code: string): Promise<ApiResponse<GeoJSONFeature>> {
    return this.request('GET', `/api/v1/geojson/provinces/${code}`);
  }

  // ==================== 反向地理编码 ====================

  /**
   * 根据经纬度获取行政区划
   * @param lat 纬度
   * @param lng 经度
   */
  async reverseGeocode(lat: number, lng: number): Promise<ApiResponse<ReverseGeocodeResult>> {
    return this.request('GET', '/api/v1/geo/reverse', { lat, lng });
  }

  // ==================== 监控统计 ====================

  /**
   * 获取缓存统计
   */
  async getCacheStats(): Promise<ApiResponse<CacheStats>> {
    return this.request('GET', '/api/v1/cache/stats');
  }

  /**
   * 获取Prometheus指标
   */
  async getMetrics(): Promise<string> {
    return this.request('GET', '/metrics');
  }

  /**
   * 获取监控汇总
   */
  async getMetricsSummary(): Promise<ApiResponse<MetricsStats>> {
    return this.request('GET', '/api/v1/stats/summary');
  }

  /**
   * 获取接口排行
   */
  async getEndpointStats(): Promise<ApiResponse<{ endpoints: any[] }>> {
    return this.request('GET', '/api/v1/stats/endpoints');
  }

  /**
   * 获取实时监控
   */
  async getRealtimeStats(): Promise<ApiResponse<any>> {
    return this.request('GET', '/api/v1/stats/realtime');
  }

  // ==================== 日志 ====================

  /**
   * 获取日志统计
   */
  async getLogStats(): Promise<ApiResponse<any>> {
    return this.request('GET', '/api/v1/logs/stats');
  }

  /**
   * 获取最近日志
   * @param limit 日志数量
   */
  async getRecentLogs(limit: number = 100): Promise<ApiResponse<LogEntry[]>> {
    return this.request('GET', '/api/v1/logs/recent', { limit });
  }

  // ==================== API Key管理 ====================

  /**
   * 获取所有API Key
   */
  async getAPIKeys(): Promise<ApiResponse<APIKeyInfo[]>> {
    return this.request('GET', '/api/v1/apikeys/keys');
  }

  /**
   * 创建API Key
   */
  async createAPIKey(name: string): Promise<ApiResponse<APIKeyInfo>> {
    return this.request('POST', '/api/v1/apikeys/keys', undefined, { name });
  }

  /**
   * 删除API Key
   */
  async deleteAPIKey(keyId: string): Promise<ApiResponse<void>> {
    return this.request('DELETE', `/api/v1/apikeys/keys/${keyId}`);
  }

  /**
   * 获取API Key使用统计
   */
  async getAPIKeyStats(): Promise<ApiResponse<any>> {
    return this.request('GET', '/api/v1/apikeys/stats');
  }

  // ==================== Webhook管理 ====================

  /**
   * 获取所有Webhook
   */
  async getWebhooks(): Promise<ApiResponse<WebhookConfig[]>> {
    return this.request('GET', '/api/v1/webhooks');
  }

  /**
   * 添加Webhook
   */
  async addWebhook(config: Omit<WebhookConfig, 'createdAt'>): Promise<ApiResponse<WebhookConfig>> {
    return this.request('POST', '/api/v1/webhooks', undefined, config);
  }

  /**
   * 删除Webhook
   */
  async deleteWebhook(id: string): Promise<ApiResponse<void>> {
    return this.request('DELETE', `/api/v1/webhooks/${id}`);
  }

  /**
   * 获取告警统计
   */
  async getAlertStats(): Promise<ApiResponse<any>> {
    return this.request('GET', '/api/v1/webhooks/alerts/stats');
  }
}

// 默认导出
export default RegionsAPI;

// 便利函数
export function createClient(config?: RegionsAPIConfig): RegionsAPI {
  return new RegionsAPI(config);
}
