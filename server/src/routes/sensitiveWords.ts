import { Router, Request, Response } from 'express';
import { sensitiveWordService } from '../services/sensitiveWordService';

const router = Router();

// 获取敏感词列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const words = await sensitiveWordService.getAllWords();
    res.json({
      success: true,
      data: {
        words,
        total: words.length,
      },
    });
  } catch (error) {
    console.error('获取敏感词列表错误:', error);
    res.status(500).json({ success: false, error: '获取敏感词列表失败' });
  }
});

// 添加敏感词
router.post('/', async (req: Request, res: Response) => {
  try {
    const { word, level = 1 } = req.body;

    if (!word || typeof word !== 'string') {
      return res.status(400).json({ success: false, error: '请提供有效的敏感词' });
    }

    await sensitiveWordService.addWord(word.trim(), level);

    res.json({
      success: true,
      message: '敏感词添加成功',
    });
  } catch (error) {
    console.error('添加敏感词错误:', error);
    res.status(500).json({ success: false, error: '添加敏感词失败' });
  }
});

// 删除敏感词
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await sensitiveWordService.deleteWord(parseInt(id, 10));

    res.json({
      success: true,
      message: '敏感词删除成功',
    });
  } catch (error) {
    console.error('删除敏感词错误:', error);
    res.status(500).json({ success: false, error: '删除敏感词失败' });
  }
});

export default router;
