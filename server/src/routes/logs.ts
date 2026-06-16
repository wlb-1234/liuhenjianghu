import { Router } from 'express';

const logs: any[] = [];
const router = Router();

router.get('/stats', (req, res) => {
  res.json({ 
    success: true, 
    data: { total: logs.length, recent: logs.slice(-100).length }
  });
});

router.get('/recent', (req, res) => {
  res.json({ success: true, data: logs.slice(-100) });
});

export { router };
export { createLogsRouter };

export default router;
