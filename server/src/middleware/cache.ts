import { Router } from 'express';

/**
 * 简单的内存缓存实现（兼容ESM）
 * 使用 Map + 过期时间实现
 */

interface CacheItem<T> {
  value: T;
  expireAt: number;
}

class SimpleCache {
  private cache: Map<string, CacheItem<any>> = new Map();
  private maxKeys: number = 1000;
  private cleanInterval: NodeJS.Timeout;

  constructor(maxKeys: number = 1000, checkPeriod: number = 300) {
    this.maxKeys = maxKeys;
    // 定期清理过期缓存
    this.cleanInterval = setInterval(() => this.clean(), checkPeriod * 1000);
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;
    
    // 检查是否过期
    if (Date.now() > item.expireAt) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value as T;
  }

  /**
   * 设置缓存
   */
  set<T>(key: string, value: T, ttl: number = 3600): boolean {
    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.maxKeys) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      expireAt: Date.now() + (ttl * 1000)
    });
    return true;
  }

  /**
   * 删除缓存
   */
  del(key: string): number {
    return this.cache.delete(key) ? 1 : 0;
  }

  /**
   * 清空所有缓存
   */
  flush(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计
   */
  getStats(): { keys: number; hits: number; misses: number } {
    return {
      keys: this.cache.size,
      hits: 0,
      misses: 0
    };
  }

  /**
   * 清理过期缓存
   */
  private clean(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expireAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 销毁缓存实例
   */
  destroy(): void {
    clearInterval(this.cleanInterval);
    this.cache.clear();
  }
}

// 创建缓存实例
export const cache = new SimpleCache(1000, 300);

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
 * 清空所有缓存
 */
export function flushCache(): void {
  cache.flush();
}

/**
 * 获取缓存统计
 */
export function getCacheStats() {
  return cache.getStats();
}

// 创建缓存管理路由
export const createCacheRouter = () => {
  const router = Router();

  // 获取缓存统计
  router.get('/stats', (_req, res) => {
    res.json({
      success: true,
      data: getCacheStats()
    });
  });

  // 清空缓存
  router.post('/flush', (_req, res) => {
    flushCache();
    res.json({
      success: true,
      message: '缓存已清空'
    });
  });

  return router;
};
