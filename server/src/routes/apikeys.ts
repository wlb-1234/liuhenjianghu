import { Router } from 'express';
import { listApiKeys } from '../middleware/apiKeyAuth.js';

const router = Router();

router.get('/keys', (req, res) => {
  res.json({ success: true, data: listApiKeys() });
});

router.post('/keys', (req, res) => {
  res.json({ success: true, message: 'Use SDK to manage API keys' });
});

export { router };
export { createApikeysRouter };

export default router;
