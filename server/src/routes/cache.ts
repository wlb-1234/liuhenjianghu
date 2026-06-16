import { Router } from 'express';

const cacheStats = { hits: 0, misses: 0, size: 0 };
const router = Router();

router.get('/stats', (req, res) => {
  res.json({ success: true, data: { ...cacheStats, hitRate: cacheStats.hits / (cacheStats.hits + cacheStats.misses) || 0 } });
});

router.post('/clear', (req, res) => {
  res.json({ success: true, message: 'Cache cleared' });
});

export { router };
export { createCacheRouter };

export default router;
