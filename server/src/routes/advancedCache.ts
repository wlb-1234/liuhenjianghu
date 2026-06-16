/**
 * 高级缓存管理API
 */
import { Router, Request, Response } from 'express';
import { getCacheStats, clearCacheByPrefix, clearAllCache } from '../services/advancedCacheService.js';

const router = Router();

/**
 * 获取缓存统计
 * GET /api/v1/cache/advanced/stats
 */
router.get('/advanced/stats', async (_req: Request, res: Response) => {
  try {
    const stats = getCacheStats();
    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[Cache] 获取统计失败:', error);
    return res.status(500).json({
      success: false,
      error: '获取缓存统计失败'
    });
  }
});

/**
 * 按前缀清除缓存
 * DELETE /api/v1/cache/advanced/prefix/:prefix
 */
router.delete('/advanced/prefix/:prefix', async (req: Request, res: Response) => {
  try {
    const { prefix } = req.params;
    const deleted = await clearCacheByPrefix(prefix);
    
    return res.json({
      success: true,
      data: {
        prefix,
        deleted
      }
    });
  } catch (error) {
    console.error('[Cache] 清除缓存失败:', error);
    return res.status(500).json({
      success: false,
      error: '清除缓存失败'
    });
  }
});

/**
 * 清除所有缓存
 * DELETE /api/v1/cache/advanced/all
 */
router.delete('/advanced/all', async (_req: Request, res: Response) => {
  try {
    const result = await clearAllCache();
    
    return res.json({
      success: result,
      message: result ? '所有缓存已清除' : '清除失败'
    });
  } catch (error) {
    console.error('[Cache] 清除所有缓存失败:', error);
    return res.status(500).json({
      success: false,
      error: '清除所有缓存失败'
    });
  }
});

/**
 * 缓存预热
 * POST /api/v1/cache/advanced/warmup
 */
router.post('/advanced/warmup', async (req: Request, res: Response) => {
  try {
    const { keys } = req.body;
    
    if (!Array.isArray(keys)) {
      return res.status(400).json({
        success: false,
        error: 'keys必须是数组'
      });
    }

    // 预热逻辑可以在这里实现
    // 目前只是记录预热请求
    console.log('[Cache] 预热请求:', keys);

    return res.json({
      success: true,
      message: '缓存预热请求已接收',
      count: keys.length
    });
  } catch (error) {
    console.error('[Cache] 预热失败:', error);
    return res.status(500).json({
      success: false,
      error: '缓存预热失败'
    });
  }
});

export default router;
