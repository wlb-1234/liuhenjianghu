/**
 * 审核管理路由
 * 管理员审核内容
 */

import { Router } from 'express';
import { getReviewQueue, getReviewStats, approveItem, rejectItem, getReviewItemDetail } from '../services/reviewService';

const router = Router();

/**
 * 获取审核队列
 * GET /api/v1/moderation/queue
 */
router.get('/queue', async (req, res) => {
  try {
    const { page = '1', limit = '20', status, type } = req.query;

    const { items, total } = await getReviewQueue(
      parseInt(page as string) || 1,
      parseInt(limit as string) || 20,
      status as string,
      type as string
    );

    res.json({
      success: true,
      data: {
        items,
        total,
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 20,
      },
    });
  } catch (error: any) {
    console.error('获取审核队列失败:', error);
    res.status(500).json({ success: false, message: '获取审核队列失败' });
  }
});

/**
 * 获取审核统计
 * GET /api/v1/moderation/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await getReviewStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('获取审核统计失败:', error);
    res.status(500).json({ success: false, message: '获取审核统计失败' });
  }
});

/**
 * 审核通过
 * PUT /api/v1/moderation/approve/:id
 */
router.put('/approve/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 从认证获取管理员 ID（需要实现）
    const reviewerId = req.body.adminId || req.headers['x-admin-id'] ? parseInt(req.headers['x-admin-id'] as string) : 1;

    const result = await approveItem(parseInt(id), reviewerId);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error('审核通过失败:', error);
    res.status(500).json({ success: false, message: '审核通过失败' });
  }
});

/**
 * 审核拒绝
 * PUT /api/v1/moderation/reject/:id
 */
router.put('/reject/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const reviewerId = req.body.adminId || req.headers['x-admin-id'] ? parseInt(req.headers['x-admin-id'] as string) : 1;

    const result = await rejectItem(parseInt(id), reviewerId);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error('审核拒绝失败:', error);
    res.status(500).json({ success: false, message: '审核拒绝失败' });
  }
});

/**
 * 获取审核项详情
 * GET /api/v1/moderation/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const item = await getReviewItemDetail(parseInt(id));

    if (!item) {
      return res.status(404).json({ success: false, message: '审核项不存在' });
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error('获取审核项详情失败:', error);
    res.status(500).json({ success: false, message: '获取审核项详情失败' });
  }
});

export default router;
