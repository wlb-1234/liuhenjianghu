/**
 * 使用量统计中间件
 * 记录每个API的调用次数和响应时间
 */
import { Request, Response, NextFunction } from "express";
import NodeCache from "node-cache";

interface ApiStats {
  count: number;           // 调用次数
  totalTime: number;       // 总响应时间(ms)
  avgTime: number;         // 平均响应时间(ms)
  lastTime: string;        // 最后调用时间
  successCount: number;    // 成功次数
  errorCount: number;      // 失败次数
}

interface RequestLog {
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  ip: string;
  userAgent: string;
}

// 统计数据缓存（内存）
const statsCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });
const statsKey = "api:stats";

// 最近请求日志（内存中保留最近1000条）
const recentLogs: RequestLog[] = [];
const MAX_LOGS = 1000;

// 获取统计数据的key
function getEndpointKey(method: string, path: string): string {
  // 移除动态参数部分
  return `${method}:${path}`;
}

/**
 * 记录API调用
 */
export function recordApiCall(method: string, path: string, statusCode: number, responseTime: number) {
  const key = getEndpointKey(method, path);
  const stats = (statsCache.get(key) as ApiStats) || {
    count: 0,
    totalTime: 0,
    avgTime: 0,
    lastTime: "",
    successCount: 0,
    errorCount: 0
  };
  
  stats.count++;
  stats.totalTime += responseTime;
  stats.avgTime = Math.round(stats.totalTime / stats.count);
  stats.lastTime = new Date().toISOString();
  
  if (statusCode >= 200 && statusCode < 400) {
    stats.successCount++;
  } else {
    stats.errorCount++;
  }
  
  statsCache.set(key, stats);
  
  // 记录到日志
  const log: RequestLog = {
    timestamp: new Date().toISOString(),
    method,
    path,
    statusCode,
    responseTime,
    ip: "",
    userAgent: ""
  };
  
  recentLogs.push(log);
  if (recentLogs.length > MAX_LOGS) {
    recentLogs.shift();
  }
}

/**
 * 获取所有统计
 */
export function getStats(): Record<string, ApiStats> {
  const keys = statsCache.keys();
  const result: Record<string, ApiStats> = {};
  
  for (const key of keys) {
    const stats = statsCache.get(key) as ApiStats;
    if (stats) {
      result[key] = stats;
    }
  }
  
  return result;
}

/**
 * 获取汇总统计
 */
export function getSummary(): {
  totalRequests: number;
  totalTime: number;
  avgTime: number;
  successRate: number;
  endpointCount: number;
  errorRate: number;
} {
  const stats = getStats();
  let totalRequests = 0;
  let totalTime = 0;
  let successCount = 0;
  let errorCount = 0;
  
  for (const stat of Object.values(stats)) {
    totalRequests += stat.count;
    totalTime += stat.totalTime;
    successCount += stat.successCount;
    errorCount += stat.errorCount;
  }
  
  return {
    totalRequests,
    totalTime,
    avgTime: totalRequests > 0 ? Math.round(totalTime / totalRequests) : 0,
    successRate: totalRequests > 0 ? Math.round((successCount / totalRequests) * 10000) / 100 : 0,
    endpointCount: Object.keys(stats).length,
    errorRate: totalRequests > 0 ? Math.round((errorCount / totalRequests) * 10000) / 100 : 0
  };
}

/**
 * 获取最近日志
 */
export function getRecentLogs(limit: number = 100): RequestLog[] {
  return recentLogs.slice(-limit);
}

/**
 * 获取Top N接口
 */
export function getTopEndpoints(limit: number = 10): Array<{ endpoint: string } & ApiStats> {
  const stats = getStats();
  return Object.entries(stats)
    .map(([endpoint, stat]) => ({ endpoint, ...stat }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * 统计中间件
 */
export function statsMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // 响应完成后记录统计
  res.on("finish", () => {
    const responseTime = Date.now() - startTime;
    recordApiCall(req.method, req.path, res.statusCode, responseTime);
  });
  
  next();
}

/**
 * 获取活跃时段统计
 */
export function getActiveHours(): Record<number, number> {
  const logs = getRecentLogs(10000);
  const hours: Record<number, number> = {};
  
  for (let i = 0; i < 24; i++) {
    hours[i] = 0;
  }
  
  for (const log of logs) {
    const hour = new Date(log.timestamp).getHours();
    hours[hour]++;
  }
  
  return hours;
}

/**
 * 获取每日统计
 */
export function getDailyStats(): Record<string, { requests: number; avgTime: number }> {
  const logs = getRecentLogs(10000);
  const days: Record<string, { requests: number; totalTime: number }> = {};
  
  for (const log of logs) {
    const day = log.timestamp.split("T")[0];
    if (!days[day]) {
      days[day] = { requests: 0, totalTime: 0 };
    }
    days[day].requests++;
    days[day].totalTime += log.responseTime;
  }
  
  const result: Record<string, { requests: number; avgTime: number }> = {};
  for (const [day, data] of Object.entries(days)) {
    result[day] = {
      requests: data.requests,
      avgTime: Math.round(data.totalTime / data.requests)
    };
  }
  
  return result;
}
