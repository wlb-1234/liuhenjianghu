/**
 * Redis 缓存模块（占位符）
 * 
 * 注意：由于 ioredis 与 ESM 模块不兼容，当前使用内存缓存
 * 如需 Redis 缓存，可在 Railway 中添加 Redis 插件，
 * 并安装兼容 ESM 的 Redis 客户端（如 @redis/client）
 */

// 缓存统计
let cacheHits = 0;
let cacheMisses = 0;

/**
 * 初始化 Redis（当前为占位函数）
 */
export async function initRedis(): Promise<boolean> {
  console.log('[Cache] Using in-memory cache (Redis optional)');
  return false;
}

/**
 * 获取缓存
 */
export async function redisGet<T>(key: string): Promise<T | null> {
  return null; // 内存缓存由 cache.ts 处理
}

/**
 * 设置缓存
 */
export async function redisSet(key: string, value: unknown, ttl: number = 3600): Promise<boolean> {
  return false;
}

/**
 * 删除缓存
 */
export async function redisDel(key: string): Promise<boolean> {
  return false;
}

/**
 * 清空所有缓存
 */
export async function redisFlush(): Promise<boolean> {
  return false;
}

/**
 * 获取缓存统计
 */
export async function redisStats(): Promise<{ type: string; connected: boolean; keys?: number }> {
  return { type: 'memory', connected: true };
}

/**
 * 记录缓存命中
 */
export function recordHit(): void {
  cacheHits++;
}

/**
 * 记录缓存未命中
 */
export function recordMiss(): void {
  cacheMisses++;
}

/**
 * 获取缓存统计数据
 */
export function getStats(): { hits: number; misses: number } {
  return { hits: cacheHits, misses: cacheMisses };
}

export default {
  initRedis,
  redisGet,
  redisSet,
  redisDel,
  redisFlush,
  redisStats,
  recordHit,
  recordMiss,
  getStats,
};
