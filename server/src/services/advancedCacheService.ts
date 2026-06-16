/**
 * 高级缓存管理服务
 * 支持Redis和内存缓存，自动降级
 */
import { getCacheClient } from '../middleware/redisClient.js';

interface CacheOptions {
  ttl?: number;        // 过期时间（秒）
  prefix?: string;     // 键前缀
  compress?: boolean;   // 是否压缩
}

// 缓存命中统计
let cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0
};

/**
 * 获取带前缀的缓存键
 */
function buildKey(prefix: string, key: string): string {
  return `${prefix}:${key}`;
}

/**
 * 设置缓存
 */
export async function setCache(
  key: string, 
  value: any, 
  options: CacheOptions = {}
): Promise<boolean> {
  try {
    const client = getCacheClient();
    const fullKey = buildKey(options.prefix || 'app', key);
    const data = JSON.stringify(value);
    const ttl = options.ttl || 3600; // 默认1小时

    await client.set(fullKey, data, 'EX', ttl);
    cacheStats.sets++;
    
    return true;
  } catch (error) {
    console.error('[Cache] Set failed:', error);
    return false;
  }
}

/**
 * 获取缓存
 */
export async function getCache<T = any>(
  key: string, 
  options: CacheOptions = {}
): Promise<T | null> {
  try {
    const client = getCacheClient();
    const fullKey = buildKey(options.prefix || 'app', key);
    const data = await client.get(fullKey);
    
    if (data) {
      cacheStats.hits++;
      return JSON.parse(data) as T;
    }
    
    cacheStats.misses++;
    return null;
  } catch (error) {
    console.error('[Cache] Get failed:', error);
    cacheStats.misses++;
    return null;
  }
}

/**
 * 删除缓存
 */
export async function deleteCache(
  key: string, 
  options: CacheOptions = {}
): Promise<boolean> {
  try {
    const client = getCacheClient();
    const fullKey = buildKey(options.prefix || 'app', key);
    await client.del(fullKey);
    cacheStats.deletes++;
    return true;
  } catch (error) {
    console.error('[Cache] Delete failed:', error);
    return false;
  }
}

/**
 * 清除指定前缀的所有缓存
 */
export async function clearCacheByPrefix(prefix: string): Promise<number> {
  try {
    const client = getCacheClient();
    const pattern = `${prefix}:*`;
    const keys = await client.keys(pattern);
    
    let deleted = 0;
    for (const key of keys) {
      await client.del(key);
      deleted++;
    }
    
    return deleted;
  } catch (error) {
    console.error('[Cache] Clear by prefix failed:', error);
    return 0;
  }
}

/**
 * 清除所有缓存
 */
export async function clearAllCache(): Promise<boolean> {
  try {
    const client = getCacheClient() as any;
    if (client.flush) {
      await client.flush();
    }
    cacheStats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
    return true;
  } catch (error) {
    console.error('[Cache] Clear all failed:', error);
    return false;
  }
}

/**
 * 获取缓存统计
 */
export function getCacheStats() {
  const total = cacheStats.hits + cacheStats.misses;
  const hitRate = total > 0 ? (cacheStats.hits / total * 100).toFixed(2) : '0.00';
  
  return {
    hits: cacheStats.hits,
    misses: cacheStats.misses,
    sets: cacheStats.sets,
    deletes: cacheStats.deletes,
    total,
    hitRate: `${hitRate}%`,
    memory: getMemoryUsage()
  };
}

/**
 * 获取内存使用情况
 */
function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
    rss: Math.round(usage.rss / 1024 / 1024) + 'MB'
  };
}

/**
 * 缓存中间件工厂
 */
export function cacheMiddleware(
  prefix: string,
  ttl: number = 3600
) {
  return async (req: any, res: any, next: any) => {
    // 只对GET请求进行缓存
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = req.originalUrl || req.url;
    
    try {
      const cached = await getCache(cacheKey, { prefix });
      
      if (cached) {
        return res.json({
          ...cached,
          cached: true
        });
      }
      
      // 拦截响应，缓存结果
      const originalJson = res.json.bind(res);
      res.json = async (data: any) => {
        if (res.statusCode === 200) {
          await setCache(cacheKey, data, { prefix, ttl });
        }
        return originalJson({
          ...data,
          cached: false
        });
      };
      
      next();
    } catch (error) {
      next();
    }
  };
}
