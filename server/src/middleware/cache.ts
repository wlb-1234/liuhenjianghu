// 响应缓存中间件
interface CacheEntry {
  data: any;
  expireTime: number;
}

// 内存缓存
const cache: Map<string, CacheEntry> = new Map();
const DEFAULT_TTL = 5 * 60 * 1000; // 默认 5 分钟
const MAX_CACHE_SIZE = 500; // 最大缓存条数

// 设置缓存
export const setCache = (key: string, data: any, ttl: number = DEFAULT_TTL) => {
  // 超过最大容量，删除最旧的
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }

  cache.set(key, {
    data,
    expireTime: Date.now() + ttl,
  });
};

// 获取缓存
export const getCache = (key: string): any | null => {
  const entry = cache.get(key);
  
  if (!entry) return null;
  
  // 检查是否过期
  if (Date.now() > entry.expireTime) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
};

// 删除缓存
export const deleteCache = (key: string) => {
  cache.delete(key);
};

// 清除所有缓存
export const clearCache = () => {
  cache.clear();
};

// 清除匹配前缀的缓存
export const clearCacheByPrefix = (prefix: string) => {
  const keys = Array.from(cache.keys());
  keys.forEach(key => {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  });
};

// 缓存中间件
export const cacheMiddleware = (ttl: number = DEFAULT_TTL, keyGenerator?: (req: any) => string) => {
  return (req: any, res: any, next: any) => {
    const cacheKey = keyGenerator 
      ? keyGenerator(req) 
      : `${req.originalUrl}`;

    // 尝试从缓存获取
    const cachedData = getCache(cacheKey);
    
    if (cachedData) {
      // 设置缓存命中头
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedData);
    }

    // 设置缓存未命中头
    res.setHeader('X-Cache', 'MISS');

    // 重写 json 方法，在响应时缓存数据
    const originalJson = res.json.bind(res);
    res.json = (data: any) => {
      // 只缓存成功响应
      if (res.statusCode === 200 && data?.success !== false) {
        setCache(cacheKey, data, ttl);
      }
      return originalJson(data);
    };

    next();
  };
};

// 获取缓存统计
export const getCacheStats = () => {
  const now = Date.now();
  let validCount = 0;
  let expiredCount = 0;

  cache.forEach((entry) => {
    if (now > entry.expireTime) {
      expiredCount++;
    } else {
      validCount++;
    }
  });

  return {
    total: cache.size,
    valid: validCount,
    expired: expiredCount,
  };
};

// 缓存路由
import { Router } from 'express';
import { authMiddleware } from './auth';

export const createCacheRouter = () => {
  const router = Router();

  // 获取缓存统计（管理员）
  router.get('/stats', authMiddleware, (req: any, res: any) => {
    res.json({
      success: true,
      data: getCacheStats(),
    });
  });

  // 清除所有缓存（管理员）
  router.delete('/all', authMiddleware, (req: any, res: any) => {
    clearCache();
    res.json({ success: true, message: '缓存已清除' });
  });

  // 清除指定前缀的缓存（管理员）
  router.delete('/prefix/:prefix', authMiddleware, (req: any, res: any) => {
    clearCacheByPrefix(req.params.prefix);
    res.json({ success: true, message: `已清除前缀为 ${req.params.prefix} 的缓存` });
  });

  return router;
};

// 定期清理过期缓存
setInterval(() => {
  const now = Date.now();
  cache.forEach((entry, key) => {
    if (now > entry.expireTime) {
      cache.delete(key);
    }
  });
}, 60 * 1000);
