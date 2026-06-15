/**
 * Webhook告警通知服务
 */
import https from 'https';
import http from 'http';

// Webhook配置接口
export interface WebhookConfig {
  url: string;
  enabled: boolean;
  secret?: string;
  retryCount: number;
  retryDelay: number;
}

// Webhook通知类型
export type AlertType = 
  | 'HIGH_ERROR_RATE'      // 高错误率
  | 'HIGH_LATENCY'         // 高延迟
  | 'SERVICE_DOWN'         // 服务不可用
  | 'RATE_LIMIT_EXCEEDED'  // 触发限流
  | 'API_KEY_EXCEEDED'     // API Key使用超限
  | 'CACHE_FAILURE'        // 缓存失败
  | 'CUSTOM';              // 自定义告警

// 告警信息接口
export interface AlertInfo {
  type: AlertType;
  message: string;
  details: {
    value?: number;
    threshold?: number;
    timestamp: number;
    metadata?: Record<string, any>;
  };
}

// Webhook配置存储
let webhookConfigs: Map<string, WebhookConfig> = new Map();

// 告警历史
const alertHistory: AlertInfo[] = [];
const MAX_HISTORY = 100;

/**
 * 配置Webhook
 */
export function configureWebhook(id: string, config: Partial<WebhookConfig>): void {
  const existing = webhookConfigs.get(id) || {
    url: '',
    enabled: false,
    retryCount: 3,
    retryDelay: 1000,
  };
  
  webhookConfigs.set(id, {
    ...existing,
    ...config,
  });
  
  console.log(`[Webhook] 配置更新: ${id} -> ${config.url || '(未设置URL)'}`);
}

/**
 * 获取Webhook配置
 */
export function getWebhookConfig(id: string): WebhookConfig | undefined {
  return webhookConfigs.get(id);
}

/**
 * 获取所有Webhook配置
 */
export function getAllWebhookConfigs(): { id: string; config: WebhookConfig }[] {
  return Array.from(webhookConfigs.entries()).map(([id, config]) => ({
    id,
    config,
  }));
}

/**
 * 删除Webhook配置
 */
export function deleteWebhook(id: string): boolean {
  return webhookConfigs.delete(id);
}

/**
 * 发送HTTP请求
 */
function sendHttpRequest(url: string, data: object): Promise<boolean> {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const postData = JSON.stringify(data);
    
    const options: http.RequestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'China-Regions-API-Webhook/1.0',
        'X-Alert-Timestamp': new Date().toISOString(),
      },
      timeout: 10000,
    };
    
    const req = client.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`[Webhook] 发送成功: ${url} [${res.statusCode}]`);
          resolve(true);
        } else {
          console.error(`[Webhook] 发送失败: ${url} [${res.statusCode}] ${responseData}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`[Webhook] 请求错误: ${url} - ${error.message}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.error(`[Webhook] 请求超时: ${url}`);
      req.destroy();
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

/**
 * 发送告警通知
 */
export async function sendAlert(
  webhookId: string,
  alert: AlertInfo,
  retryCount = 0
): Promise<boolean> {
  const config = webhookConfigs.get(webhookId);
  
  if (!config || !config.enabled || !config.url) {
    return false;
  }
  
  // 准备通知数据
  const payload = {
    event: 'alert',
    type: alert.type,
    message: alert.message,
    timestamp: new Date(alert.details.timestamp).toISOString(),
    details: alert.details,
    metadata: {
      service: 'China-Regions-API',
      version: '2.0.0',
    },
  };
  
  // 发送请求
  const success = await sendHttpRequest(config.url, payload);
  
  // 如果失败且还有重试次数
  if (!success && retryCount < config.retryCount) {
    await new Promise((resolve) => setTimeout(resolve, config.retryDelay));
    return sendAlert(webhookId, alert, retryCount + 1);
  }
  
  return success;
}

/**
 * 广播告警到所有启用的Webhook
 */
export async function broadcastAlert(alert: AlertInfo): Promise<void> {
  const promises: Promise<boolean>[] = [];
  
  for (const [id, config] of webhookConfigs.entries()) {
    if (config.enabled && config.url) {
      promises.push(sendAlert(id, alert));
    }
  }
  
  await Promise.allSettled(promises);
}

/**
 * 发送高错误率告警
 */
export async function alertHighErrorRate(
  errorRate: number,
  threshold: number,
  recentRequests: number
): Promise<void> {
  const alert: AlertInfo = {
    type: 'HIGH_ERROR_RATE',
    message: `API错误率过高: ${errorRate.toFixed(2)}% (阈值: ${threshold}%)`,
    details: {
      value: errorRate,
      threshold,
      timestamp: Date.now(),
      metadata: { recentRequests },
    },
  };
  
  // 添加到历史
  addToHistory(alert);
  
  // 广播告警
  await broadcastAlert(alert);
}

/**
 * 发送高延迟告警
 */
export async function alertHighLatency(
  avgLatency: number,
  threshold: number,
  slowRequests: number
): Promise<void> {
  const alert: AlertInfo = {
    type: 'HIGH_LATENCY',
    message: `API响应延迟过高: ${avgLatency.toFixed(2)}ms (阈值: ${threshold}ms)`,
    details: {
      value: avgLatency,
      threshold,
      timestamp: Date.now(),
      metadata: { slowRequests },
    },
  };
  
  addToHistory(alert);
  await broadcastAlert(alert);
}

/**
 * 发送API Key使用超限告警
 */
export async function alertApiKeyExceeded(
  apiKey: string,
  usageCount: number,
  limit: number
): Promise<void> {
  const alert: AlertInfo = {
    type: 'API_KEY_EXCEEDED',
    message: `API Key使用量超限: ${usageCount}/${limit}`,
    details: {
      value: usageCount,
      threshold: limit,
      timestamp: Date.now(),
      metadata: { apiKey: apiKey.substring(0, 8) + '...' },
    },
  };
  
  addToHistory(alert);
  await broadcastAlert(alert);
}

/**
 * 发送限流触发告警
 */
export async function alertRateLimitExceeded(
  apiKey: string,
  currentUsage: number
): Promise<void> {
  const alert: AlertInfo = {
    type: 'RATE_LIMIT_EXCEEDED',
    message: `API Key触发限流: ${apiKey.substring(0, 8)}...`,
    details: {
      value: currentUsage,
      timestamp: Date.now(),
      metadata: { apiKey: apiKey.substring(0, 8) + '...' },
    },
  };
  
  addToHistory(alert);
  await broadcastAlert(alert);
}

/**
 * 添加告警到历史
 */
function addToHistory(alert: AlertInfo): void {
  alertHistory.unshift(alert);
  if (alertHistory.length > MAX_HISTORY) {
    alertHistory.pop();
  }
}

/**
 * 获取告警历史
 */
export function getAlertHistory(limit = 50): AlertInfo[] {
  return alertHistory.slice(0, limit);
}

/**
 * 获取告警统计
 */
export function getAlertStats(): {
  total: number;
  byType: Record<AlertType, number>;
  recent: AlertInfo[];
} {
  const byType: Record<AlertType, number> = {
    HIGH_ERROR_RATE: 0,
    HIGH_LATENCY: 0,
    SERVICE_DOWN: 0,
    RATE_LIMIT_EXCEEDED: 0,
    API_KEY_EXCEEDED: 0,
    CACHE_FAILURE: 0,
    CUSTOM: 0,
  };
  
  for (const alert of alertHistory) {
    byType[alert.type]++;
  }
  
  return {
    total: alertHistory.length,
    byType,
    recent: alertHistory.slice(0, 10),
  };
}

/**
 * 清除告警历史
 */
export function clearAlertHistory(): void {
  alertHistory.length = 0;
}

// 默认配置：控制台输出
configureWebhook('console', {
  url: '',
  enabled: true,
  retryCount: 0,
  retryDelay: 0,
});

console.log('[Webhook] 告警服务已初始化');
