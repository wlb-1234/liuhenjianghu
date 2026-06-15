/**
 * Redis客户端管理
 * 支持Railway Redis插件环境变量
 * 支持本地开发和Docker部署
 */

interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, duration?: number): Promise<string>;
  del(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  info(section?: string): Promise<string>;
  ping(): Promise<string>;
  quit(): Promise<string>;
  isOpen: boolean;
}

// Railway Redis插件环境变量
const REDIS_URL = process.env.REDIS_URL || process.env.REDIS_HOST;
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false' && (REDIS_URL || process.env.REDIS_TLS_URL);

let redisClient: RedisClient | null = null;
let isRedisConnected = false;

// 简单的内存缓存（作为Redis不可用时的降级方案）
const memoryCache = new Map<string, { value: string; expireAt: number }>();
const MAX_MEMORY_CACHE_SIZE = 1000;
const DEFAULT_TTL = 3600; // 1小时

function cleanupMemoryCache(): void {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expireAt < now) {
      memoryCache.delete(key);
    }
  }
  // 如果缓存太大，清理最旧的条目
  if (memoryCache.size > MAX_MEMORY_CACHE_SIZE) {
    const keys = Array.from(memoryCache.keys());
    for (let i = 0; i < 100; i++) {
      memoryCache.delete(keys[i]);
    }
  }
}

// 内存缓存实现
export const memoryCacheClient = {
  async get(key: string): Promise<string | null> {
    cleanupMemoryCache();
    const entry = memoryCache.get(key);
    if (!entry) return null;
    if (entry.expireAt < Date.now()) {
      memoryCache.delete(key);
      return null;
    }
    return entry.value;
  },

  async set(key: string, value: string, _mode?: string, duration?: number): Promise<string> {
    cleanupMemoryCache();
    const ttl = duration || DEFAULT_TTL;
    memoryCache.set(key, {
      value,
      expireAt: Date.now() + ttl * 1000
    });
    return 'OK';
  },

  async del(key: string): Promise<number> {
    return memoryCache.delete(key) ? 1 : 0;
  },

  async keys(pattern: string): Promise<string[]> {
    cleanupMemoryCache();
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(memoryCache.keys()).filter(key => regex.test(key));
  },

  async flush(): Promise<string> {
    memoryCache.clear();
    return 'OK';
  },

  async getStats(): Promise<{ type: string; keys: number; hits: number; misses: number }> {
    return {
      type: 'memory',
      keys: memoryCache.size,
      hits: 0,
      misses: 0
    };
  },

  isOpen: true
};

/**
 * 初始化Redis连接
 */
export async function initRedis(): Promise<{ type: string; connected: boolean; url?: string }> {
  // 如果环境变量明确禁用了Redis
  if (process.env.REDIS_ENABLED === 'false') {
    console.log('[Cache] Redis is disabled by environment variable, using memory cache');
    return { type: 'memory', connected: true };
  }

  // 如果有Railway Redis URL
  if (REDIS_URL) {
    try {
      // 使用动态导入避免ESM兼容性问题
      const Redis = (await import('ioredis')).default;
      const url = new URL(REDIS_URL);
      
      redisClient = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        lazyConnect: true,
        password: url.password || undefined,
        connectTimeout: 5000,
      });

      // 连接超时处理
      const connectPromise = redisClient.connect().catch((err: Error) => {
        console.log('[Cache] Redis connection failed:', err.message);
        return null;
      });

      // 等待连接或超时
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (redisClient.isOpen) {
        isRedisConnected = true;
        console.log('[Cache] Redis connected successfully:', url.host);
        return { type: 'redis', connected: true, url: url.host };
      }
    } catch (error) {
      console.log('[Cache] Redis initialization failed, using memory cache');
    }
  }

  // 默认使用内存缓存
  console.log('[Cache] Using memory cache (no Redis URL provided)');
  return { type: 'memory', connected: true };
}

/**
 * 获取缓存客户端
 */
export function getCacheClient(): RedisClient & { flush?: () => Promise<string>; getStats?: () => Promise<any> } {
  if (redisClient && redisClient.isOpen) {
    return {
      ...redisClient,
      flush: async () => {
        const keys = await redisClient!.keys('*');
        for (const key of keys) {
          await redisClient!.del(key);
        }
        return 'OK';
      },
      getStats: async () => {
        try {
          const info = await redisClient!.info('stats');
          const lines = info.split('\r\n');
          const stats: any = { type: 'redis' };
          for (const line of lines) {
            if (line.startsWith('keyspace_hits:')) {
              stats.hits = parseInt(line.split(':')[1]) || 0;
            }
            if (line.startsWith('keyspace_misses:')) {
              stats.misses = parseInt(line.split(':')[1]) || 0;
            }
          }
          stats.keys = (await redisClient!.keys('*')).length;
          return stats;
        } catch {
          return { type: 'redis', keys: 0, hits: 0, misses: 0 };
        }
      }
    };
  }
  return memoryCacheClient as any;
}

/**
 * 关闭Redis连接
 */
export async function closeRedis(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
    isRedisConnected = false;
    console.log('[Cache] Redis connection closed');
  }
}

/**
 * 获取缓存统计信息
 */
export async function getRedisStats(): Promise<{
  type: string;
  connected: boolean;
  keys: number;
  hits: number;
  misses: number;
  hitRate: number;
}> {
  const client = getCacheClient();
  const stats = await (client as any).getStats();
  
  const hitRate = stats.hits + stats.misses > 0 
    ? Math.round((stats.hits / (stats.hits + stats.misses)) * 100) 
    : 0;

  return {
    type: stats.type || 'memory',
    connected: isRedisConnected || stats.type === 'memory',
    keys: stats.keys || 0,
    hits: stats.hits || 0,
    misses: stats.misses || 0,
    hitRate
  };
}
