import { Router } from 'express';

const alerts: any[] = [];
const router = Router();

router.get('/stats', (req, res) => {
  res.json({ success: true, data: { total: alerts.length, active: alerts.filter(a => !a.resolved).length } });
});

export { router };
