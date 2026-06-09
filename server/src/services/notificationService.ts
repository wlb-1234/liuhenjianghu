/**
 * 消息通知服务
 * 处理系统消息、评论通知、点赞通知等
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: '13.114.6.6',
  port: 5432,
  database: 'postgres',
  user: 'postgres.hmlqsbhbbclbzfuutrie',
  password: 'Liuhen2026App',
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// 消息类型枚举
export enum MessageType {
  SYSTEM = 'system',           // 系统消息
  COMMENT = 'comment',         // 评论通知
  LIKE = 'like',               // 点赞通知
  FOLLOW = 'follow',           // 关注通知
  REPLY = 'reply',            // 回复通知
  ACHIEVEMENT = 'achievement', // 成就通知
  ACTIVITY = 'activity',       // 活动通知
}

// 消息优先级
export enum MessagePriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  URGENT = 3,
}

// 消息结果接口
export interface MessageResult {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * 消息通知服务
 */
export class NotificationService {
  /**
   * 发送系统消息
   */
  static async sendSystemMessage(
    userId: number,
    title: string,
    content: string,
    data?: Record<string, any>,
    priority: MessagePriority = MessagePriority.NORMAL
  ): Promise<MessageResult> {
    try {
      const result = await pool.query(
        `INSERT INTO notifications (user_id, type, title, content, data, priority)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, created_at`,
        [userId, MessageType.SYSTEM, title, content, JSON.stringify(data || {}), priority]
      );

      return {
        success: true,
        message: '消息发送成功',
        data: {
          id: result.rows[0].id,
          createdAt: result.rows[0].created_at
        }
      };
    } catch (error: any) {
      console.error('发送系统消息失败:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * 发送评论通知
   */
  static async sendCommentNotification(
    postOwnerId: number,
    commenterId: number,
    commenterName: string,
    postId: number,
    postTitle: string,
    commentContent: string
  ): Promise<MessageResult> {
    // 防止给自己发通知
    if (postOwnerId === commenterId) {
      return { success: true, message: '自己评论不发送通知' };
    }

    const title = '收到新评论';
    const content = `${commenterName} 评论了你的帖子「${postTitle.substring(0, 20)}...」: ${commentContent.substring(0, 50)}...`;

    return this.sendSystemMessage(postOwnerId, title, content, {
      type: 'comment',
      postId,
      commenterId,
      action: 'view_post'
    }, MessagePriority.NORMAL);
  }

  /**
   * 发送点赞通知
   */
  static async sendLikeNotification(
    postOwnerId: number,
    likerId: number,
    likerName: string,
    postId: number,
    postTitle: string
  ): Promise<MessageResult> {
    if (postOwnerId === likerId) {
      return { success: true, message: '自己点赞不发送通知' };
    }

    const title = '收到新点赞';
    const content = `${likerName} 点赞了你的帖子「${postTitle.substring(0, 30)}」`;

    return this.sendSystemMessage(postOwnerId, title, content, {
      type: 'like',
      postId,
      likerId,
      action: 'view_post'
    }, MessagePriority.LOW);
  }

  /**
   * 发送回复通知
   */
  static async sendReplyNotification(
    commentOwnerId: number,
    replierId: number,
    replierName: string,
    postId: number,
    postTitle: string,
    originalComment: string,
    replyContent: string
  ): Promise<MessageResult> {
    if (commentOwnerId === replierId) {
      return { success: true, message: '自己回复不发送通知' };
    }

    const title = '收到回复';
    const content = `${replierName} 回复了你的评论「${originalComment.substring(0, 30)}...」: ${replyContent.substring(0, 30)}...`;

    return this.sendSystemMessage(commentOwnerId, title, content, {
      type: 'reply',
      postId,
      replierId,
      action: 'view_post'
    }, MessagePriority.NORMAL);
  }

  /**
   * 发送成就通知
   */
  static async sendAchievementNotification(
    userId: number,
    achievementName: string,
    achievementDesc: string
  ): Promise<MessageResult> {
    const title = '🏆 获得新成就';
    const content = `恭喜获得「${achievementName}」: ${achievementDesc}`;

    return this.sendSystemMessage(userId, title, content, {
      type: 'achievement',
      achievementName
    }, MessagePriority.HIGH);
  }

  /**
   * 发送签到奖励通知
   */
  static async sendCheckInRewardNotification(
    userId: number,
    expGained: number,
    streak: number,
    bonusExp: number
  ): Promise<MessageResult> {
    const title = '📅 签到奖励';
    let content = `连续签到 ${streak} 天，获得 ${expGained} 经验值`;
    if (bonusExp > 0) {
      content += ` (含连续签到奖励 +${bonusExp})`;
    }

    return this.sendSystemMessage(userId, title, content, {
      type: 'check_in',
      expGained,
      streak
    }, MessagePriority.LOW);
  }

  /**
   * 批量发送系统公告
   */
  static async broadcastSystemMessage(
    title: string,
    content: string,
    data?: Record<string, any>,
    excludeUserIds?: number[]
  ): Promise<MessageResult> {
    try {
      let query = `
        INSERT INTO notifications (user_id, type, title, content, data, priority)
        SELECT id, $2, $3, $4, $5, $6 FROM users WHERE 1=1
      `;
      const params: any[] = [MessageType.SYSTEM, title, content, JSON.stringify(data || {}), MessagePriority.HIGH];
      let paramIndex = 7;

      if (excludeUserIds && excludeUserIds.length > 0) {
        query += ` AND id NOT IN (${excludeUserIds.map((_, i) => `$${paramIndex + i}`).join(',')})`;
        params.push(...excludeUserIds);
      }

      const result = await pool.query(query, params);

      return {
        success: true,
        message: `已发送给 ${result.rowCount} 位用户`,
        data: { count: result.rowCount }
      };
    } catch (error: any) {
      console.error('广播消息失败:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * 获取用户未读消息数量
   */
  static async getUnreadCount(userId: number): Promise<number> {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
        [userId]
      );
      return parseInt(result.rows[0].count);
    } catch (error: any) {
      console.error('获取未读消息数失败:', error.message);
      return 0;
    }
  }

  /**
   * 标记消息为已读
   */
  static async markAsRead(userId: number, notificationId: number): Promise<boolean> {
    try {
      await pool.query(
        'UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2',
        [notificationId, userId]
      );
      return true;
    } catch (error: any) {
      console.error('标记已读失败:', error.message);
      return false;
    }
  }

  /**
   * 标记所有消息为已读
   */
  static async markAllAsRead(userId: number): Promise<number> {
    try {
      const result = await pool.query(
        'UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND is_read = false',
        [userId]
      );
      return result.rowCount;
    } catch (error: any) {
      console.error('标记全部已读失败:', error.message);
      return 0;
    }
  }

  /**
   * 删除消息
   */
  static async deleteNotification(userId: number, notificationId: number): Promise<boolean> {
    try {
      await pool.query(
        'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
        [notificationId, userId]
      );
      return true;
    } catch (error: any) {
      console.error('删除消息失败:', error.message);
      return false;
    }
  }

  /**
   * 清理过期消息（超过30天）
   */
  static async cleanupExpiredMessages(): Promise<number> {
    try {
      const result = await pool.query(
        `DELETE FROM notifications 
         WHERE created_at < NOW() - INTERVAL '30 days' 
         AND is_read = true`
      );
      console.log(`清理了 ${result.rowCount} 条过期消息`);
      return result.rowCount;
    } catch (error: any) {
      console.error('清理过期消息失败:', error.message);
      return 0;
    }
  }

  /**
   * 获取用户消息列表
   */
  static async getNotifications(
    userId: number,
    limit: number = 20,
    offset: number = 0,
    type?: string
  ): Promise<any[]> {
    try {
      let query = `
        SELECT id, type, title, content, data, priority, is_read, read_at, created_at
        FROM notifications
        WHERE user_id = $1
      `;
      const params: any[] = [userId];

      if (type) {
        query += ' AND type = $2';
        params.push(type);
      }

      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limit, offset);

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error: any) {
      console.error('获取消息列表失败:', error.message);
      return [];
    }
  }

  /**
   * 获取消息统计
   */
  static async getNotificationStats(userId: number): Promise<Record<string, number>> {
    try {
      const result = await pool.query(`
        SELECT type, COUNT(*) as count
        FROM notifications
        WHERE user_id = $1
        GROUP BY type
      `, [userId]);

      const stats: Record<string, number> = {};
      result.rows.forEach(row => {
        stats[row.type] = parseInt(row.count);
      });
      return stats;
    } catch (error: any) {
      console.error('获取消息统计失败:', error.message);
      return {};
    }
  }
}

export default NotificationService;
