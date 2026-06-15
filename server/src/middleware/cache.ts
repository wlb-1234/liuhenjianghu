import NodeCache from 'node-cache';
import { Router } from 'express';

/**
 * 内存缓存配置
 * 使用 node-cache 实现内存缓存，适合单实例部署
 */

// 创建缓存实例
export const cache = new NodeCache({
  stdTTL: 3600,        // 默认过期时间：1小时
  checkperiod: 300,    // 检查过期时间：5分钟
  useClones: true,     // 克隆值而不是引用
  maxKeys: 1000        // 最大缓存key数量
});

// 缓存key前缀
export const CACHE_KEYS = {
  PROVINCES: 'regions:provinces',
  CITIES: 'regions:cities:',
  DISTRICTS: 'regions:districts:',
  STREETS: 'regions:streets:',
  CHILDREN: 'regions:children:',
  SEARCH: 'regions:search:',
  PATH: 'regions:path:',
  STATS: 'regions:stats',
};

/**
 * 获取缓存数据
 */
export function getCache<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

/**
 * 设置缓存数据
 */
export function setCache<T>(key: string, value: T, ttl?: number): boolean {
  if (ttl) {
    return cache.set(key, value, ttl);
  }
  return cache.set(key, value);
}

/**
 * 删除缓存数据
 */
export function delCache(key: string): number {
  return cache.del(key);
}

/**
 * 清除所有缓存
 */
export function flushCache(): void {
  cache.flushAll();
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats() {
  const stats = cache.getStats();
  return {
    keys: cache.keys().length,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: stats.hits / (stats.hits + stats.misses) || 0,
    ksize: stats.ksize,
    vsize: stats.vsize,
  };
}

/**
 * 创建通用缓存管理路由
 */
export function createCacheRouter() {
  const router = Router();
  
  // 获取缓存统计
  router.get('/stats', (req, res) => {
    const stats = getCacheStats();
    res.json({
      code: 200,
      message: 'success',
      data: {
        keys: stats.keys,
        hits: stats.hits,
        misses: stats.misses,
        hitRate: `${(stats.hitRate * 100).toFixed(2)}%`,
      }
    });
  });
  
  // 清除所有缓存
  router.post('/flush', (req, res) => {
    flushCache();
    res.json({
      code: 200,
      message: 'success',
      data: { message: '所有缓存已清除' }
    });
  });
  
  // 获取缓存key列表
  router.get('/keys', (req, res) => {
    const keys = cache.keys();
    res.json({
      code: 200,
      message: 'success',
      data: {
        count: keys.length,
        keys: keys.slice(0, 100) // 最多返回100个key
      }
    });
  });
  
  return router;
}
