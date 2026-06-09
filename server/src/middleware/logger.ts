// 请求日志中间件
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from './auth';

// 敏感字段列表
const SENSITIVE_FIELDS = [
  'password', 'password_hash', 'token', 'access_token', 'refresh_token',
  'secret', 'api_key', 'private_key', 'authorization', 'cookie',
  'phone', 'email', 'id_card', 'bank_card'
];

// 日志脱敏函数
export const sanitizeLogData = (data: any): any => {
  if (!data) return data;
  if (typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  for (const field of SENSITIVE_FIELDS) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  return sanitized;
};

// 日志存储（生产环境应发送到日志服务）
interface LogEntry {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  userId: string | null;
  ip: string;
  userAgent: string;
  error?: string;
}

const logs: LogEntry[] = [];
const MAX_LOGS = 1000; // 内存中最多保留1000条日志

// 添加日志
export const addLog = (entry: LogEntry) => {
  logs.unshift(entry);
  if (logs.length > MAX_LOGS) {
    logs.pop();
  }
};

// 获取日志
export const getLogs = (filters?: { 
  method?: string; 
  statusCode?: number; 
  startDate?: string;
  endDate?: string;
}) => {
  let filtered = [...logs];
  
  if (filters?.method) {
    filtered = filtered.filter(log => log.method === filters.method);
  }
  if (filters?.statusCode) {
    filtered = filtered.filter(log => log.statusCode === filters.statusCode);
  }
  if (filters?.startDate) {
    filtered = filtered.filter(log => log.timestamp >= filters.startDate!);
  }
  if (filters?.endDate) {
    filtered = filtered.filter(log => log.timestamp <= filters.endDate!);
  }
  
  return filtered;
};

// 清理旧日志
export const clearLogs = () => {
  logs.length = 0;
};

// 获取统计信息
export const getStats = () => {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const recentLogs = logs.filter(log => new Date(log.timestamp).getTime() > oneHourAgo);
  const dailyLogs = logs.filter(log => new Date(log.timestamp).getTime() > oneDayAgo);

  // 错误统计
  const errorLogs = recentLogs.filter(log => log.statusCode >= 400);
  const errorRate = recentLogs.length > 0 
    ? (errorLogs.length / recentLogs.length * 100).toFixed(2) 
    : '0.00';

  // 响应时间统计
  const responseTimes = recentLogs.map(log => log.responseTime);
  const avgResponseTime = responseTimes.length > 0
    ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(0)
    : '0';

  // 路径统计
  const pathCounts: Record<string, number> = {};
  dailyLogs.forEach(log => {
    pathCounts[log.url] = (pathCounts[log.url] || 0) + 1;
  });
  const topPaths = Object.entries(pathCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }));

  return {
    total: logs.length,
    lastHour: recentLogs.length,
    lastDay: dailyLogs.length,
    errorRate: `${errorRate}%`,
    avgResponseTime: `${avgResponseTime}ms`,
    errors: errorLogs.length,
    topPaths,
  };
};

// 请求日志中间件
export const requestLogger = (req: any, res: any, next: any) => {
  const requestId = uuidv4();
  const startTime = Date.now();
  
  // 添加请求ID到请求对象
  req.requestId = requestId;
  
  // 保存原始 end 方法
  const originalEnd = res.end;
  
  // 重写 end 方法以记录响应
  res.end = function(chunk?: any, encoding?: any, callback?: any) {
    const responseTime = Date.now() - startTime;
    
    const logEntry: LogEntry = {
      id: requestId,
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      userId: req.user?.userId || null,
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
    };

    // 如果是错误，添加错误信息
    if (res.statusCode >= 400) {
      logEntry.error = req.error?.message;
    }

    addLog(logEntry);

    // 控制台输出
    const statusColor = res.statusCode >= 500 ? '\x1b[31m' : 
                        res.statusCode >= 400 ? '\x1b[33m' : 
                        '\x1b[32m';
    console.log(
      `${statusColor}[${res.statusCode}]\x1b[0m ${req.method} ${req.originalUrl} ${responseTime}ms - ${requestId}`
    );

    return originalEnd.call(this, chunk, encoding, callback);
  };

  next();
};

// 日志查询路由
const logsRouter = Router();

// 获取日志列表（管理员）
logsRouter.get('/', authMiddleware, (req: any, res: any) => {
  const { method, statusCode, startDate, endDate, limit = 100 } = req.query;
  
  const filtered = getLogs({
    method,
    statusCode: statusCode ? parseInt(statusCode) : undefined,
    startDate,
    endDate,
  });

  res.json({
    success: true,
    data: filtered.slice(0, parseInt(limit as string)),
    total: filtered.length,
  });
});

// 获取统计信息（管理员）
logsRouter.get('/stats', authMiddleware, (req: any, res: any) => {
  res.json({
    success: true,
    data: getStats(),
  });
});

// 清理日志（管理员）
logsRouter.delete('/', authMiddleware, (req: any, res: any) => {
  clearLogs();
  res.json({ success: true, message: '日志已清理' });
});

export default logsRouter;
