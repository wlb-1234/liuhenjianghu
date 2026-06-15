/**
 * 日志持久化与告警模块
 */
import { Router } from 'express';
import fs from 'fs';
import path from 'path';

// 日志文件路径
const LOG_FILE = path.join(process.cwd(), 'logs', 'requests.jsonl');

// 确保logs目录存在
const logsDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 请求日志结构
interface RequestLog {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  ip: string;
  userAgent: string;
  apiKeyPrefix?: string;
}

// 告警配置
interface AlertConfig {
  enabled: boolean;
  errorRateThreshold: number;    // 错误率阈值 (%)
  responseTimeThreshold: number; // 响应时间阈值 (ms)
  requestsPerMinuteThreshold: number; // 每分钟请求阈值
}

// 告警状态
interface AlertState {
  lastAlertTime: string | null;
  consecutiveErrors: number;
  totalRequests: number;
  errorRequests: number;
  slowRequests: number;
}

const alertConfig: AlertConfig = {
  enabled: true,
  errorRateThreshold: 10,        // 10% 错误率告警
  responseTimeThreshold: 1000,   // 1秒响应时间告警
  requestsPerMinuteThreshold: 10000, // 每分钟10000请求告警
};

const alertState: AlertState = {
  lastAlertTime: null,
  consecutiveErrors: 0,
  totalRequests: 0,
  errorRequests: 0,
  slowRequests: 0,
};

// 告警历史
const alertHistory: Array<{
  timestamp: string;
  type: string;
  message: string;
  details: Record<string, unknown>;
}> = [];

// 记录请求日志
export function logRequest(log: RequestLog): void {
  try {
    // 追加到文件
    const line = JSON.stringify(log) + '\n';
    fs.appendFileSync(LOG_FILE, line);
    
    // 更新告警状态
    alertState.totalRequests++;
    if (log.statusCode >= 400) {
      alertState.errorRequests++;
      alertState.consecutiveErrors++;
    } else {
      alertState.consecutiveErrors = 0;
    }
    if (log.responseTime > alertConfig.responseTimeThreshold) {
      alertState.slowRequests++;
    }
    
    // 检查告警条件
    checkAlerts();
  } catch (error) {
    console.error('Failed to write request log:', error);
  }
}

// 检查告警条件
function checkAlerts(): void {
  if (!alertConfig.enabled) return;
  
  const now = new Date();
  const alerts: Array<{type: string; message: string; details: Record<string, unknown>}> = [];
  
  // 错误率告警
  if (alertState.totalRequests > 0) {
    const errorRate = (alertState.errorRequests / alertState.totalRequests) * 100;
    if (errorRate > alertConfig.errorRateThreshold) {
      alerts.push({
        type: 'HIGH_ERROR_RATE',
        message: `错误率过高: ${errorRate.toFixed(2)}%`,
        details: { errorRate, threshold: alertConfig.errorRateThreshold },
      });
    }
  }
  
  // 连续错误告警
  if (alertState.consecutiveErrors >= 10) {
    alerts.push({
      type: 'CONSECUTIVE_ERRORS',
      message: `连续错误: ${alertState.consecutiveErrors}次`,
      details: { consecutiveErrors: alertState.consecutiveErrors },
    });
  }
  
  // 记录告警
  for (const alert of alerts) {
    // 避免重复告警（1分钟内）
    if (alertState.lastAlertTime) {
      const lastAlert = new Date(alertState.lastAlertTime);
      if (now.getTime() - lastAlert.getTime() < 60000) {
        continue;
      }
    }
    
    alertState.lastAlertTime = now.toISOString();
    alertHistory.push({
      timestamp: now.toISOString(),
      ...alert,
    });
    
    // 只保留最近100条告警
    if (alertHistory.length > 100) {
      alertHistory.shift();
    }
    
    console.warn(`[ALERT] ${alert.type}: ${alert.message}`);
  }
}

// 获取告警状态
export function getAlertStatus() {
  const errorRate = alertState.totalRequests > 0 
    ? (alertState.errorRequests / alertState.totalRequests) * 100 
    : 0;
  
  return {
    config: alertConfig,
    current: {
      totalRequests: alertState.totalRequests,
      errorRequests: alertState.errorRequests,
      slowRequests: alertState.slowRequests,
      errorRate: errorRate.toFixed(2) + '%',
      consecutiveErrors: alertState.consecutiveErrors,
    },
    lastAlertTime: alertState.lastAlertTime,
    isHealthy: alertState.consecutiveErrors < 5 && parseFloat(errorRate.toFixed(2)) < alertConfig.errorRateThreshold,
  };
}

// 重置告警计数
export function resetAlertCounters(): void {
  alertState.totalRequests = 0;
  alertState.errorRequests = 0;
  alertState.slowRequests = 0;
  alertState.consecutiveErrors = 0;
}

// 更新告警配置
export function updateAlertConfig(config: Partial<AlertConfig>): void {
  Object.assign(alertConfig, config);
}

// 创建日志管理路由
export const createLogsRouter = () => {
  const router = Router();
  
  // 获取告警状态
  router.get('/status', (_req, res) => {
    res.json({
      success: true,
      data: getAlertStatus(),
    });
  });
  
  // 获取告警历史
  router.get('/alerts', (_req, res) => {
    res.json({
      success: true,
      data: {
        count: alertHistory.length,
        alerts: alertHistory.slice(-20).reverse(),
      },
    });
  });
  
  // 更新告警配置
  router.patch('/config', (req, res) => {
    const config = req.body;
    updateAlertConfig(config);
    res.json({
      success: true,
      message: '告警配置已更新',
      data: alertConfig,
    });
  });
  
  // 重置计数器
  router.post('/reset', (_req, res) => {
    resetAlertCounters();
    res.json({
      success: true,
      message: '计数器已重置',
    });
  });
  
  // 获取最近请求日志（从文件读取）
  router.get('/recent', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 100;
    
    try {
      if (!fs.existsSync(LOG_FILE)) {
        return res.json({
          success: true,
          data: { count: 0, logs: [] },
        });
      }
      
      const content = fs.readFileSync(LOG_FILE, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      const recentLogs = lines.slice(-limit).map(line => JSON.parse(line)).reverse();
      
      res.json({
        success: true,
        data: {
          count: recentLogs.length,
          logs: recentLogs,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '读取日志失败',
      });
    }
  });
  
  return router;
};

export default {
  logRequest,
  getAlertStatus,
  resetAlertCounters,
  updateAlertConfig,
  createLogsRouter,
};
