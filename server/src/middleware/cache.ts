/**
 * 缓存模块 - 内存缓存实现
 * 提供同步缓存接口，兼容现有代码
 */
import { Router } from 'express';
import { recordCacheHit, recordCacheMiss, setCacheSize } from './prometheus';

interface CacheItem<T> {
  value: T;
  expireAt: number;
}

class SimpleCache {
  private cache: Map<string, CacheItem<any>> = new Map();
  private maxKeys: number = 1000;
  private cleanInterval: ReturnType<typeof setInterval>;
  private hits = 0;
  private misses = 0;

  constructor(maxKeys: number = 1000, checkPeriod: number = 300) {
    this.maxKeys = maxKeys;
    this.cleanInterval = setInterval(() => this.clean(), checkPeriod * 1000);
  }

  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;
    
    if (Date.now() > item.expireAt) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value as T;
  }

  set<T>(key: string, value: T, ttl: number = 3600): boolean {
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

  del(key: string): number {
    return this.cache.delete(key) ? 1 : 0;
  }

  flush(): void {
    this.cache.clear();
  }

  getStats(): { keys: number; hits: number; misses: number } {
    return {
      keys: this.cache.size,
      hits: this.hits,
      misses: this.misses
    };
  }

  recordHit(): void {
    this.hits++;
    recordCacheHit();
  }

  recordMiss(): void {
    this.misses++;
    recordCacheMiss();
  }

  private clean(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expireAt) {
        this.cache.delete(key);
      }
    }
    setCacheSize(this.cache.size);
  }

  destroy(): void {
    clearInterval(this.cleanInterval);
    this.cache.clear();
  }
}

// 创建缓存实例
export const memoryCache = new SimpleCache(1000, 300);

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
 * 获取缓存数据（同步版本）
 */
export function getCache<T>(key: string): T | undefined {
  const value = memoryCache.get<T>(key);
  if (value !== undefined) {
    memoryCache.recordHit();
    return value;
  }
  memoryCache.recordMiss();
  return undefined;
}

/**
 * 设置缓存数据（同步版本）
 */
export function setCache<T>(key: string, value: T, ttl?: number): boolean {
  memoryCache.set(key, value, ttl);
  setCacheSize(memoryCache.getStats().keys);
  return true;
}

/**
 * 删除缓存数据
 */
export function delCache(key: string): number {
  return memoryCache.del(key);
}

/**
 * 清空所有缓存
 */
export function flushCache(): void {
  memoryCache.flush();
}

/**
 * 获取缓存统计
 */
export function getCacheStats() {
  const stats = memoryCache.getStats();
  return {
    redis: { type: 'memory', connected: true },
    memory: stats,
    total: {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits + stats.misses > 0
        ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2) + '%'
        : '0%'
    }
  };
}

// 创建缓存管理路由
export const createCacheRouter = () => {
  const router = Router();

  router.get('/stats', (_req, res) => {
    res.json({
      success: true,
      data: getCacheStats()
    });
  });

  router.post('/flush', (_req, res) => {
    flushCache();
    res.json({
      success: true,
      message: '缓存已清空'
    });
  });

  return router;
};

// 初始化（占位）
export async function initCache(): Promise<void> {
  console.log('[Cache] Using in-memory cache');
}

export default {
  getCache,
  setCache,
  delCache,
  flushCache,
  getCacheStats,
  createCacheRouter,
  initCache,
};
