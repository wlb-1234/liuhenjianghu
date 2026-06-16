/**
 * 图片审核API路由
 */
import { Router, Request, Response } from 'express';
import { checkImage, checkImages } from '../services/imageModerationService.js';

const router = Router();

/**
 * 单张图片审核
 * POST /api/v1/moderation/image
 * Body: { imageUrl: string }
 */
router.post('/image', async (req: Request, res: Response) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: '缺少imageUrl参数'
      });
    }

    const result = await checkImage(imageUrl);

    return res.json({
      success: result.success,
      data: {
        imageUrl,
        safe: result.safe,
        confidence: result.confidence,
        labels: result.labels,
        message: result.message
      }
    });

  } catch (error) {
    console.error('[ImageModeration] 审核失败:', error);
    return res.status(500).json({
      success: false,
      error: '图片审核服务异常'
    });
  }
});

/**
 * 批量图片审核
 * POST /api/v1/moderation/images
 * Body: { imageUrls: string[] }
 */
router.post('/images', async (req: Request, res: Response) => {
  try {
    const { imageUrls } = req.body;

    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({
        success: false,
        error: '缺少imageUrls参数（需要数组）'
      });
    }

    if (imageUrls.length > 9) {
      return res.status(400).json({
        success: false,
        error: '单次最多审核9张图片'
      });
    }

    const result = await checkImages(imageUrls);

    return res.json({
      success: result.success,
      data: {
        total: imageUrls.length,
        passed: result.results.filter(r => r.safe).length,
        failed: result.results.filter(r => !r.safe).length,
        allPassed: result.allPassed,
        results: result.results
      }
    });

  } catch (error) {
    console.error('[ImageModeration] 批量审核失败:', error);
    return res.status(500).json({
      success: false,
      error: '图片审核服务异常'
    });
  }
});

/**
 * 图片审核状态检查
 * GET /api/v1/moderation/status
 */
router.get('/status', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    data: {
      enabled: true,
      service: 'built-in',
      description: '内置图片审核服务',
      features: ['色情内容检测', '暴力内容检测', '违法内容检测', '广告内容检测']
    }
  });
});

export default router;
