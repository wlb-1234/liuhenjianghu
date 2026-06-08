import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { sensitiveWordService } from '../services/sensitiveWordService';

const router = Router();

// 获取敏感词列表
router.get('/', authMiddleware, async (req: any, res: any) => {
  try {
    const words = sensitiveWordService.getWords();
    res.json({ success: true, data: words });
  } catch (error: any) {
    res.status(500).json({ success: false, message: '获取敏感词失败' });
  }
});

// 添加敏感词
router.post('/', authMiddleware, async (req: any, res: any) => {
  try {
    const { word, category, level } = req.body;
    sensitiveWordService.addWord(word, category, level || 1);
    res.json({ success: true, message: '添加成功' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除敏感词
router.delete('/:word', authMiddleware, async (req: any, res: any) => {
  try {
    sensitiveWordService.removeWord(req.params.word);
    res.json({ success: true, message: '删除成功' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
