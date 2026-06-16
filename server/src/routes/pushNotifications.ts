/**
 * 推送通知API路由
 */
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  sendNotification,
  broadcastNotification
} from '../services/pushNotificationService.js';

const router = Router();

/**
 * 获取通知列表
 * GET /api/v1/notifications
 */
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = getUserNotifications(userId, limit, offset);

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Notifications] 获取列表失败:', error);
    return res.status(500).json({
      success: false,
      error: '获取通知列表失败'
    });
  }
});

/**
 * 获取未读数量
 * GET /api/v1/notifications/unread-count
 */
router.get('/unread-count', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const count = getUnreadCount(userId);

    return res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('[Notifications] 获取未读数失败:', error);
    return res.status(500).json({
      success: false,
      error: '获取未读数量失败'
    });
  }
});

/**
 * 标记单条通知为已读
 * PUT /api/v1/notifications/:id/read
 */
router.put('/:id/read', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const notificationId = req.params.id;

    const success = markAsRead(userId, notificationId);

    return res.json({
      success,
      message: success ? '已标记为已读' : '通知不存在'
    });
  } catch (error) {
    console.error('[Notifications] 标记已读失败:', error);
    return res.status(500).json({
      success: false,
      error: '标记已读失败'
    });
  }
});

/**
 * 标记所有通知为已读
 * PUT /api/v1/notifications/read-all
 */
router.put('/read-all', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const count = markAllAsRead(userId);

    return res.json({
      success: true,
      data: { count },
      message: `已标记${count}条通知为已读`
    });
  } catch (error) {
    console.error('[Notifications] 全部标记已读失败:', error);
    return res.status(500).json({
      success: false,
      error: '标记全部已读失败'
    });
  }
});

/**
 * 删除通知
 * DELETE /api/v1/notifications/:id
 */
router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const notificationId = req.params.id;

    const success = deleteNotification(userId, notificationId);

    return res.json({
      success,
      message: success ? '已删除' : '通知不存在'
    });
  } catch (error) {
    console.error('[Notifications] 删除失败:', error);
    return res.status(500).json({
      success: false,
      error: '删除通知失败'
    });
  }
});

/**
 * 发送通知（管理员用）
 * POST /api/v1/notifications/send
 */
router.post('/send', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId, type, title, content, userIds } = req.body;

    // 检查是否是管理员
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '需要管理员权限'
      });
    }

    if (userIds && Array.isArray(userIds)) {
      // 批量发送
      const count = await broadcastNotification(userIds, type, title, content);
      return res.json({
        success: true,
        data: { count },
        message: `已发送给${count}个用户`
      });
    } else if (userId) {
      // 单个发送
      const notification = await sendNotification(userId, type, title, content);
      return res.json({
        success: true,
        data: notification
      });
    } else {
      return res.status(400).json({
        success: false,
        error: '缺少userId或userIds参数'
      });
    }
  } catch (error) {
    console.error('[Notifications] 发送失败:', error);
    return res.status(500).json({
      success: false,
      error: '发送通知失败'
    });
  }
});

/**
 * WebSocket连接（客户端轮询实现）
 * GET /api/v1/notifications/poll
 * 客户端可以通过长轮询获取最新通知
 */
router.get('/poll', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const since = req.query.since as string;
    
    // 获取指定时间之后的新通知
    const sinceTime = since ? new Date(since) : new Date(0);
    const result = getUserNotifications(userId, 50, 0);
    
    const newNotifications = result.notifications.filter(
      n => new Date(n.createdAt) > sinceTime
    );

    return res.json({
      success: true,
      data: {
        notifications: newNotifications,
        unread: result.unread
      }
    });
  } catch (error) {
    console.error('[Notifications] 轮询失败:', error);
    return res.status(500).json({
      success: false,
      error: '轮询失败'
    });
  }
});

export default router;
