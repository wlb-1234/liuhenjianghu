/**
 * 推送通知服务
 * 支持站内通知、WebSocket推送、邮件通知等
 */

interface Notification {
  id: string;
  userId: number;
  type: 'like' | 'comment' | 'follow' | 'system' | 'mention';
  title: string;
  content: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

// 通知存储（生产环境应存入数据库）
const notifications: Map<number, Notification[]> = new Map();

// WebSocket连接池（用于实时推送）
const wsConnections: Map<number, Set<any>> = new Map();

/**
 * 生成通知ID
 */
function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 发送站内通知
 */
export async function sendNotification(
  userId: number,
  type: Notification['type'],
  title: string,
  content: string,
  data?: Record<string, any>
): Promise<Notification> {
  const notification: Notification = {
    id: generateId(),
    userId,
    type,
    title,
    content,
    data,
    read: false,
    createdAt: new Date()
  };

  // 存入内存/数据库
  const userNotifications = notifications.get(userId) || [];
  userNotifications.unshift(notification);
  
  // 只保留最近100条通知
  if (userNotifications.length > 100) {
    userNotifications.pop();
  }
  notifications.set(userId, userNotifications);

  // 通过WebSocket实时推送
  await pushViaWebSocket(userId, notification);

  console.log(`[Notification] 发送给用户${userId}: ${title}`);
  return notification;
}

/**
 * WebSocket实时推送
 */
async function pushViaWebSocket(userId: number, notification: Notification): Promise<void> {
  const connections = wsConnections.get(userId);
  if (connections) {
    const message = JSON.stringify({
      type: 'notification',
      data: notification
    });
    
    for (const ws of connections) {
      try {
        if (ws.readyState === 1) { // OPEN
          ws.send(message);
        }
      } catch (error) {
        console.error('[Notification] WebSocket发送失败:', error);
      }
    }
  }
}

/**
 * 获取用户通知列表
 */
export function getUserNotifications(
  userId: number,
  limit: number = 20,
  offset: number = 0
): { notifications: Notification[]; total: number; unread: number } {
  const userNotifications = notifications.get(userId) || [];
  const unread = userNotifications.filter(n => !n.read).length;
  
  return {
    notifications: userNotifications.slice(offset, offset + limit),
    total: userNotifications.length,
    unread
  };
}

/**
 * 标记通知为已读
 */
export function markAsRead(userId: number, notificationId: string): boolean {
  const userNotifications = notifications.get(userId);
  if (!userNotifications) return false;

  const notification = userNotifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
    return true;
  }
  return false;
}

/**
 * 标记所有通知为已读
 */
export function markAllAsRead(userId: number): number {
  const userNotifications = notifications.get(userId);
  if (!userNotifications) return 0;

  let count = 0;
  for (const n of userNotifications) {
    if (!n.read) {
      n.read = true;
      count++;
    }
  }
  return count;
}

/**
 * 删除通知
 */
export function deleteNotification(userId: number, notificationId: string): boolean {
  const userNotifications = notifications.get(userId);
  if (!userNotifications) return false;

  const index = userNotifications.findIndex(n => n.id === notificationId);
  if (index !== -1) {
    userNotifications.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * 获取未读数量
 */
export function getUnreadCount(userId: number): number {
  const userNotifications = notifications.get(userId);
  if (!userNotifications) return 0;
  return userNotifications.filter(n => !n.read).length;
}

/**
 * 注册WebSocket连接
 */
export function registerWebSocket(userId: number, ws: any): void {
  const connections = wsConnections.get(userId) || new Set();
  connections.add(ws);
  wsConnections.set(userId, connections);
  console.log(`[Notification] 用户${userId} WebSocket已连接`);
}

/**
 * 注销WebSocket连接
 */
export function unregisterWebSocket(userId: number, ws: any): void {
  const connections = wsConnections.get(userId);
  if (connections) {
    connections.delete(ws);
    if (connections.size === 0) {
      wsConnections.delete(userId);
    }
    console.log(`[Notification] 用户${userId} WebSocket已断开`);
  }
}

/**
 * 发送点赞通知
 */
export async function notifyLike(userId: number, postId: number, likerName: string): Promise<void> {
  await sendNotification(
    userId,
    'like',
    '收到点赞',
    `${likerName} 点赞了你的帖子`,
    { postId, type: 'like' }
  );
}

/**
 * 发送评论通知
 */
export async function notifyComment(
  userId: number, 
  postId: number, 
  commentId: number, 
  commenterName: string,
  commentPreview: string
): Promise<void> {
  const preview = commentPreview.length > 50 
    ? commentPreview.substring(0, 50) + '...' 
    : commentPreview;
    
  await sendNotification(
    userId,
    'comment',
    '收到评论',
    `${commenterName}: ${preview}`,
    { postId, commentId, type: 'comment' }
  );
}

/**
 * 发送关注通知
 */
export async function notifyFollow(userId: number, followerId: number, followerName: string): Promise<void> {
  await sendNotification(
    userId,
    'follow',
    '新粉丝',
    `${followerName} 关注了你`,
    { followerId, type: 'follow' }
  );
}

/**
 * 发送系统通知
 */
export async function notifySystem(userId: number, title: string, content: string): Promise<void> {
  await sendNotification(
    userId,
    'system',
    title,
    content,
    { type: 'system' }
  );
}

/**
 * 批量发送通知（用于系统公告）
 */
export async function broadcastNotification(
  userIds: number[],
  type: Notification['type'],
  title: string,
  content: string
): Promise<number> {
  let count = 0;
  for (const userId of userIds) {
    await sendNotification(userId, type, title, content);
    count++;
  }
  console.log(`[Notification] 广播通知已发送给${count}个用户`);
  return count;
}
