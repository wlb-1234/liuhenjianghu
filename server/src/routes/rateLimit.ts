import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, GLOBAL_RATE_LIMIT } from '../config/security.js';

const router = express.Router();

// 管理员权限验证中间件
function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: '未授权，请先登录' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { adminId?: number; role?: string };

    // 验证是否为管理员
    if (!decoded.adminId) {
      return res.status(403).json({ success: false, error: '需要管理员权限' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: '登录已过期，请重新登录' });
  }
}

// 内存存储限流数据（key -> {count, resetTime}）
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const blockedUsers = new Map<string, number>(); // ip -> blockUntil

// 清理过期数据
function cleanupExpired() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

// 定时清理
setInterval(cleanupExpired, 60000);

/**
 * 全局 API 限流中间件
 * 基于客户端 IP 进行限流（默认 120 次/分钟）。
 * 白名单路径（健康检查等）不限流。
 * 已触发限流的 IP 会自动阻止后续请求。
 */
export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  // 公开/基础路径跳过（避免误伤关键入口）
  const publicPaths = [
    '/api/v1/health',
    '/api/v1/regions',
    '/api/v1/geo',
    '/metrics',
    '/admin',
    '/admin-mobile',
  ];
  if (publicPaths.some((p) => req.path === p || req.path.startsWith(p + '/'))) {
    return next();
  }

  // 被封锁的 IP
  const ip = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
  const blockedUntil = blockedUsers.get(ip);
  if (blockedUntil && Date.now() < blockedUntil) {
    return res.status(429).json({
      success: false,
      error: '请求过于频繁，已限制访问，请稍后再试',
      resetTime: new Date(blockedUntil).toISOString(),
    });
  }
  if (blockedUntil && Date.now() >= blockedUntil) {
    blockedUsers.delete(ip);
    // 清除该 IP 的历史计数
    for (const key of Array.from(rateLimitStore.keys())) {
      if (key.endsWith(`:${ip}`)) rateLimitStore.delete(key);
    }
  }

  const key = `g:${ip}`;
  const now = Date.now();
  const config = GLOBAL_RATE_LIMIT;
  const record = rateLimitStore.get(key);

  if (!record || record.resetTime < now) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return next();
  }

  if (record.count >= config.limit) {
    // 触发限流：延长窗口并记录封锁
    rateLimitStore.set(key, { count: record.count, resetTime: now + config.windowMs });
    res.setHeader('X-RateLimit-Limit', config.limit);
    res.setHeader('X-RateLimit-Reset', Math.floor((now + config.windowMs) / 1000));
    return res.status(429).json({
      success: false,
      error: '请求过于频繁，请稍后再试',
      resetTime: new Date(now + config.windowMs).toISOString(),
    });
  }

  record.count++;
  res.setHeader('X-RateLimit-Limit', config.limit);
  res.setHeader('X-RateLimit-Remaining', config.limit - record.count);
  next();
}

// 主动封锁某个 IP（管理员用）
export function blockIp(ip: string, durationMs: number): void {
  blockedUsers.set(ip, Date.now() + durationMs);
  const now = Date.now();
  for (const key of Array.from(rateLimitStore.keys())) {
    if (key.endsWith(`:${ip}`)) rateLimitStore.delete(key);
  }
}

// 路由（保留原 admin 后台用接口）

// 获取限流状态
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      activeKeys: rateLimitStore.size,
      blocked: blockedUsers.size,
      default: GLOBAL_RATE_LIMIT,
    },
  });
});

// 获取限流配置
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      global: GLOBAL_RATE_LIMIT,
    },
  });
});

// 封锁指定 IP（管理员）
router.post('/block', adminAuthMiddleware, (req, res) => {
  const { ip, durationMs = 60 * 60 * 1000 } = req.body;
  if (!ip) {
    return res.status(400).json({ success: false, error: '缺少 ip 参数' });
  }
  blockIp(ip, durationMs);
  res.json({ success: true, message: `IP ${ip} 已封锁` });
});

// 重置用户限流（管理员）
router.post('/reset/:ip', adminAuthMiddleware, (req, res) => {
  const { ip } = req.params;
  const ipStr = String(ip);
  rateLimitStore.delete(`g:${ipStr}`);
  blockedUsers.delete(ipStr);
  res.json({ success: true, message: '限流已重置' });
});

// 获取统计
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      activeKeys: rateLimitStore.size,
      blocked: blockedUsers.size,
      global: GLOBAL_RATE_LIMIT,
    },
  });
});

export default router;