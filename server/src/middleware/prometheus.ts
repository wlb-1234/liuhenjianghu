/**
 * Prometheus 指标监控中间件（轻量级实现）
 * 导出 HTTP 请求量和响应时间等指标
 * 兼容 ESM 模块
 */
import { Request, Response, NextFunction } from 'express';

// ==================== 指标存储 ====================

// HTTP 请求计数器
interface Counter {
  labels: Record<string, number>;
  increment(labels: Record<string, string>): void;
}

interface Histogram {
  labels: Record<string, number[]>;
  observe(labels: Record<string, string>, value: number): void;
}

interface Gauge {
  value: number;
  set(value: number): void;
  inc(): void;
  dec(): void;
}

// 简单的指标实现
const httpRequestsTotal: Counter = {
  labels: {},
  increment(labels) {
    const key = JSON.stringify(labels);
    this.labels[key] = (this.labels[key] || 0) + 1;
  }
};

const httpRequestDuration: Histogram = {
  labels: {},
  observe(labels, value) {
    const key = JSON.stringify(labels);
    if (!this.labels[key]) {
      this.labels[key] = [];
    }
    this.labels[key].push(value);
  }
};

const httpRequestsInProgress: Gauge = {
  value: 0,
  set(v) { this.value = v; },
  inc() { this.value++; },
  dec() { this.value--; }
};

const apiCallsTotal: Counter = {
  labels: {},
  increment(labels) {
    const key = JSON.stringify(labels);
    this.labels[key] = (this.labels[key] || 0) + 1;
  }
};

const cacheHits: Gauge = { value: 0, set(v) { this.value = v; }, inc() { this.value++; }, dec() { this.value--; } };
const cacheMisses: Gauge = { value: 0, set(v) { this.value = v; }, inc() { this.value++; }, dec() { this.value--; } };
const cacheSize: Gauge = { value: 0, set(v) { this.value = v; }, inc() { this.value++; }, dec() { this.value--; } };

// 启动时间
const startTime = Date.now();

/**
 * 路径规范化（避免过多唯一路径）
 */
function normalizePath(path: string): string {
  return path
    .replace(/\/\d+/g, '/:id')
    .replace(/\/[a-f0-9-]{36}/gi, '/:uuid');
}

/**
 * 指标收集中间件
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/metrics') {
    return next();
  }

  const startMs = Date.now();
  httpRequestsInProgress.inc({ method: req.method } as any);

  res.on('finish', () => {
    const duration = (Date.now() - startMs) / 1000;
    const path = normalizePath(req.route?.path || req.path);

    httpRequestsTotal.increment({
      method: req.method,
      path,
      status: res.statusCode.toString()
    });

    httpRequestDuration.observe(
      { method: req.method, path, status: res.statusCode.toString() },
      duration
    );

    httpRequestsInProgress.dec({ method: req.method } as any);
  });

  next();
}

/**
 * 格式化 Prometheus 指标
 */
function formatPrometheusMetrics(): string {
  const lines: string[] = [];

  // 帮助信息
  lines.push('# HELP http_requests_total Total HTTP requests');
  lines.push('# TYPE http_requests_total counter');
  for (const [key, value] of Object.entries(httpRequestsTotal.labels)) {
    const labels = JSON.parse(key);
    const labelStr = Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',');
    lines.push(`http_requests_total{${labelStr}} ${value}`);
  }

  lines.push('');
  lines.push('# HELP http_request_duration_seconds HTTP request duration');
  lines.push('# TYPE http_request_duration_seconds summary');
  for (const [key, values] of Object.entries(httpRequestDuration.labels)) {
    const labels = JSON.parse(key);
    const labelStr = Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',');
    if (values.length > 0) {
      const sum = values.reduce((a, b) => a + b, 0);
      const count = values.length;
      const avg = sum / count;
      lines.push(`http_request_duration_seconds_sum{${labelStr}} ${sum}`);
      lines.push(`http_request_duration_seconds_count{${labelStr}} ${count}`);
    }
  }

  lines.push('');
  lines.push('# HELP http_requests_in_progress HTTP requests in progress');
  lines.push('# TYPE http_requests_in_progress gauge');
  lines.push(`http_requests_in_progress ${httpRequestsInProgress.value}`);

  lines.push('');
  lines.push('# HELP api_calls_total Total API calls');
  lines.push('# TYPE api_calls_total counter');
  for (const [key, value] of Object.entries(apiCallsTotal.labels)) {
    const labels = JSON.parse(key);
    const labelStr = Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',');
    lines.push(`api_calls_total{${labelStr}} ${value}`);
  }

  lines.push('');
  lines.push('# HELP cache_hits_total Cache hits');
  lines.push('# TYPE cache_hits_total counter');
  lines.push(`cache_hits_total ${cacheHits.value}`);

  lines.push('');
  lines.push('# HELP cache_misses_total Cache misses');
  lines.push('# TYPE cache_misses_total counter');
  lines.push(`cache_misses_total ${cacheMisses.value}`);

  lines.push('');
  lines.push('# HELP cache_size Cache size');
  lines.push('# TYPE cache_size gauge');
  lines.push(`cache_size ${cacheSize.value}`);

  lines.push('');
  lines.push('# HELP process_uptime_seconds Process uptime');
  lines.push('# TYPE process_uptime_seconds gauge');
  lines.push(`process_uptime_seconds ${(Date.now() - startTime) / 1000}`);

  return lines.join('\n');
}

/**
 * 创建 /metrics 路由处理器
 */
export function metricsHandler() {
  return (_req: Request, res: Response) => {
    try {
      res.set('Content-Type', 'text/plain; charset=utf-8');
      res.send(formatPrometheusMetrics());
    } catch (error) {
      res.status(500).send('Error collecting metrics');
    }
  };
}

/**
 * 缓存指标记录函数
 */
export function recordCacheHit() {
  cacheHits.inc();
}

export function recordCacheMiss() {
  cacheMisses.inc();
}

export function setCacheSize(size: number) {
  cacheSize.set(size);
}

/**
 * API 调用记录
 */
export function recordApiCall(endpoint: string, method: string) {
  apiCallsTotal.increment({ endpoint, method });
}

export default {
  metricsMiddleware,
  metricsHandler,
  recordCacheHit,
  recordCacheMiss,
  setCacheSize,
  recordApiCall,
};
