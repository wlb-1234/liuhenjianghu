// API 限流中间件
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// 内存存储（生产环境建议用 Redis）
const store: RateLimitStore = {};

// 限流配置
interface RateLimitConfig {
  windowMs: number;      // 时间窗口（毫秒）
  max: number;           // 最大请求数
  message?: string;       // 超限提示
  keyGenerator?: (req: any) => string; // 自定义 key 生成器
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000,  // 1分钟
  max: 100,              // 100次请求
  message: '请求过于频繁，请稍后再试',
};

// 创建限流器
export const createRateLimiter = (config: Partial<RateLimitConfig> = {}) => {
  const { windowMs, max, message, keyGenerator } = { ...defaultConfig, ...config };

  return (req: any, res: any, next: any) => {
    // 生成 key（默认按 IP）
    const key = keyGenerator ? keyGenerator(req) : (req.ip || 'unknown');
    const now = Date.now();

    // 初始化或重置
    if (!store[key] || now > store[key].resetTime) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    // 增加计数
    store[key].count++;

    // 设置响应头
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - store[key].count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(store[key].resetTime / 1000));

    // 检查是否超限
    if (store[key].count > max) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      
      return res.status(429).json({
        success: false,
        message: message || '请求过于频繁',
        code: 42900,
        retryAfter,
      });
    }

    next();
  };
};

// 清理过期数据（定期调用）
export const cleanExpired = () => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (now > store[key].resetTime) {
      delete store[key];
    }
  });
};

// 预设限流器
export const rateLimiters = {
  // 默认限流：100次/分钟
  default: createRateLimiter({ max: 100, windowMs: 60 * 1000 }),
  
  // 登录限流：5次/分钟
  auth: createRateLimiter({ max: 5, windowMs: 60 * 1000, message: '登录尝试过于频繁，请稍后再试' }),
  
  // 评论限流：20次/分钟
  comment: createRateLimiter({ max: 20, windowMs: 60 * 1000, message: '评论发送过于频繁' }),
  
  // 上传限流：10次/分钟
  upload: createRateLimiter({ max: 10, windowMs: 60 * 1000, message: '上传过于频繁' }),
  
  // 搜索限流：30次/分钟
  search: createRateLimiter({ max: 30, windowMs: 60 * 1000, message: '搜索过于频繁' }),
};

// 启动定时清理
setInterval(cleanExpired, 60 * 1000);
