import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'liuhen-jianghu-secret-key-2024';

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

// 内存存储限流数据
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// 限流配置
const rateLimitConfig = {
  // 默认限流：100次/分钟
  default: { limit: 100, windowMs: 60000 },
  // 付费会员限流：根据等级
  vip: {
    free: { limit: 100, windowMs: 60000 },      // 免费：100次/分钟
    basic: { limit: 1000, windowMs: 60000 },    // 基础：1000次/分钟
    premium: { limit: 10000, windowMs: 60000 },// 高级：10000次/分钟
    vip: { limit: -1, windowMs: 0 }             // VIP：无限制
  }
};

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

// 获取限流配置
function getRateLimitConfig(userLevel: string) {
  const levelConfig = rateLimitConfig.vip[userLevel as keyof typeof rateLimitConfig.vip];
  return levelConfig || rateLimitConfig.default;
}

// 检查限流
function checkRateLimit(userId: string, userLevel: string): { allowed: boolean; remaining: number; resetTime: number } {
  const config = getRateLimitConfig(userLevel);
  
  // VIP无限制
  if (config.limit === -1) {
    return { allowed: true, remaining: -1, resetTime: 0 };
  }
  
  const key = userId;
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || record.resetTime < now) {
    // 新窗口
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    });
    return { allowed: true, remaining: config.limit - 1, resetTime: now + config.windowMs };
  }
  
  if (record.count >= config.limit) {
    // 超过限制
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }
  
  // 增加计数
  record.count++;
  return { allowed: true, remaining: config.limit - record.count, resetTime: record.resetTime };
}

// 获取用户等级（从请求头或数据库）
function getUserLevel(req: Request): string {
  // 从请求头获取（实际应从JWT或Session获取）
  return req.headers['x-user-level'] as string || 'free';
}

// 应用限流中间件
export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  // 如果是公开接口，跳过限流
  const publicPaths = ['/api/v1/health', '/api/v1/regions', '/api/v1/geo'];
  if (publicPaths.some(p => req.path.startsWith(p))) {
    return next();
  }
  
  // 获取用户ID（从请求头或JWT）
  const userId = req.headers['x-user-id'] as string || req.ip;
  const userLevel = getUserLevel(req);
  
  const result = checkRateLimit(userId, userLevel);
  
  // 设置响应头
  res.setHeader('X-RateLimit-Limit', getRateLimitConfig(userLevel).limit);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', Math.floor(result.resetTime / 1000));
  
  if (!result.allowed) {
    return res.status(429).json({
      success: false,
      error: '请求过于频繁，请稍后再试',
      resetTime: new Date(result.resetTime).toISOString()
    });
  }
  
  next();
}

// 路由

// 获取限流状态
router.get('/status', (req, res) => {
  const userId = req.headers['x-user-id'] as string || req.ip;
  const userLevel = getUserLevel(req);
  const config = getRateLimitConfig(userLevel);
  const result = checkRateLimit(userId, userLevel);
  
  res.json({
    success: true,
    data: {
      userLevel,
      limit: config.limit === -1 ? 'unlimited' : config.limit,
      remaining: result.remaining,
      resetTime: result.resetTime ? new Date(result.resetTime).toISOString() : null
    }
  });
});

// 获取限流配置
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      tiers: rateLimitConfig.vip,
      default: rateLimitConfig.default
    }
  });
});

// 更新限流配置（管理员）
router.put('/config', adminAuthMiddleware, (req, res) => {
  const { level, limit, windowMs } = req.body;
  
  if (level && limit !== undefined && windowMs !== undefined) {
    if (rateLimitConfig.vip[level as keyof typeof rateLimitConfig.vip]) {
      (rateLimitConfig.vip as any)[level] = { limit, windowMs };
      res.json({ success: true, message: '配置已更新' });
    } else {
      res.status(400).json({ success: false, error: '无效的会员等级' });
    }
  } else {
    res.status(400).json({ success: false, error: '缺少参数' });
  }
});

// 重置用户限流（管理员）
router.post('/reset/:userId', adminAuthMiddleware, (req, res) => {
  const { userId } = req.params;
  rateLimitStore.delete(userId);
  res.json({ success: true, message: '限流已重置' });
});

// 获取统计
router.get('/stats', (req, res) => {
  const total = rateLimitStore.size;
  const blocked = Array.from(rateLimitStore.values()).filter(v => v.count >= getRateLimitConfig('free').limit).length;
  
  res.json({
    success: true,
    data: {
      activeUsers: total,
      blockedUsers: blocked,
      tiers: Object.entries(rateLimitConfig.vip).map(([level, config]) => ({
        level,
        limit: config.limit === -1 ? 'unlimited' : config.limit
      }))
    }
  });
});

export default router;
