/**
 * 消息通知路由
 * 用户消息通知相关接口
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';

const router = Router();

/**
 * 获取当前用户的消息列表
 * GET /api/v1/notifications
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { page = 1, limit = 20, type, unreadOnly } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (type) {
      whereClause += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (unreadOnly === 'true') {
      whereClause += ' AND is_read = false';
    }

    // 查询消息列表
    const result = await (await import('../services/notificationService')).default.getNotifications(
      userId,
      Number(limit),
      offset,
      type as string | undefined
    );

    // 获取未读数量
    const unreadCount = await NotificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: {
        notifications: result,
        unreadCount,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error: any) {
    console.error('获取消息列表失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 获取未读消息数量
 * GET /api/v1/notifications/unread-count
 */
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const count = await NotificationService.getUnreadCount(userId);

    res.json({ success: true, data: { count } });
  } catch (error: any) {
    console.error('获取未读数量失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 标记单条消息为已读
 * PUT /api/v1/notifications/:id/read
 */
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const notificationId = parseInt(req.params.id);

    if (isNaN(notificationId)) {
      return res.status(400).json({ success: false, message: '无效的消息ID' });
    }

    const success = await NotificationService.markAsRead(userId, notificationId);

    if (success) {
      res.json({ success: true, message: '已标记为已读' });
    } else {
      res.status(400).json({ success: false, message: '标记失败' });
    }
  } catch (error: any) {
    console.error('标记已读失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 标记所有消息为已读
 * PUT /api/v1/notifications/read-all
 */
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const count = await NotificationService.markAllAsRead(userId);

    res.json({ success: true, message: `已标记 ${count} 条消息为已读`, data: { count } });
  } catch (error: any) {
    console.error('标记全部已读失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 删除消息
 * DELETE /api/v1/notifications/:id
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const notificationId = parseInt(req.params.id);

    if (isNaN(notificationId)) {
      return res.status(400).json({ success: false, message: '无效的消息ID' });
    }

    const success = await NotificationService.deleteNotification(userId, notificationId);

    if (success) {
      res.json({ success: true, message: '删除成功' });
    } else {
      res.status(400).json({ success: false, message: '删除失败' });
    }
  } catch (error: any) {
    console.error('删除消息失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 获取消息类型统计
 * GET /api/v1/notifications/stats
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const stats = await (await import('../services/notificationService')).default.getNotificationStats(userId);

    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('获取消息统计失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
