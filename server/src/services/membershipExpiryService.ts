/**
 * 会员到期提醒服务
 * 每天检查一次，对即将到期的会员发送提醒通知
 * - 到期前3天：发送到期提醒
 * - 到期前1天：发送紧急提醒
 * - 到期当天：发送最后提醒
 */

import { getPool } from '../config/database.js';
import { NotificationService, MessagePriority } from './notificationService.js';

// 检查间隔：24小时
const CHECK_INTERVAL = 24 * 60 * 60 * 1000;

// 记录已发送提醒的用户，避免重复发送
const sentReminders = new Map<string, Set<number>>(); // key: 日期, value: userId集合

/**
 * 获取日期key（YYYY-MM-DD）
 */
function getDateKey(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * 检查并发送会员到期提醒
 */
async function checkMembershipExpiry(): Promise<void> {
  try {
    const pool = getPool();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dateKey = getDateKey();
    
    // 计算3天后、1天后、当天的日期
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    threeDaysLater.setHours(23, 59, 59, 999);
    
    const oneDayLater = new Date(today);
    oneDayLater.setDate(oneDayLater.getDate() + 1);
    oneDayLater.setHours(23, 59, 59, 999);
    
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // 查询即将到期的会员（member_expire_at 在3天内的用户）
    const result = await pool.query(`
      SELECT id, nickname, member_expire_at 
      FROM users 
      WHERE member_level IS NOT NULL 
        AND member_level > 0
        AND member_expire_at IS NOT NULL
        AND member_expire_at <= $1
        AND member_expire_at >= $2
      ORDER BY member_expire_at ASC
    `, [threeDaysLater, today]);

    const expiringUsers = result.rows || [];
    
    if (expiringUsers.length === 0) {
      console.log('[会员到期提醒] 今日无即将到期的会员');
      return;
    }

    // 初始化今日记录
    if (!sentReminders.has(dateKey)) {
      sentReminders.set(dateKey, new Set());
    }
    const todaySent = sentReminders.get(dateKey)!;

    for (const user of expiringUsers) {
      const expireDate = new Date(user.member_expire_at);
      const daysUntilExpiry = Math.ceil((expireDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
      
      // 生成唯一key防止重复
      const reminderKey = `${user.id}_${daysUntilExpiry}`;
      
      if (todaySent.has(reminderKey as any)) {
        continue; // 已发送过，跳过
      }

      const expireDateStr = expireDate.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      let title: string;
      let content: string;
      let priority: MessagePriority;

      if (daysUntilExpiry <= 0) {
        // 到期当天
        title = '会员今日到期';
        content = `您的会员已于今日到期，为不影响使用请尽快前往续费。`;
        priority = MessagePriority.URGENT;
      } else if (daysUntilExpiry === 1) {
        // 到期前1天
        title = '会员明日到期';
        content = `您的会员将于${expireDateStr}到期，为不影响使用可前往续费。`;
        priority = MessagePriority.HIGH;
      } else {
        // 到期前3天
        title = '会员即将到期';
        content = `您的会员将于${expireDateStr}到期，为不影响使用可前往续费。`;
        priority = MessagePriority.NORMAL;
      }

      await NotificationService.sendSystemMessage(
        user.id,
        title,
        content,
        { 
          type: 'membership_expiry', 
          daysUntilExpiry, 
          expireAt: user.member_expire_at 
        },
        priority
      );

      todaySent.add(reminderKey as any);
      console.log(`[会员到期提醒] 已发送给 ${user.nickname}(ID:${user.id}), 剩余${daysUntilExpiry}天`);
    }

    // 清理7天前的记录
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoKey = sevenDaysAgo.toISOString().split('T')[0];
    for (const [key] of sentReminders) {
      if (key < sevenDaysAgoKey) {
        sentReminders.delete(key);
      }
    }

    console.log(`[会员到期提醒] 检查完成, 共处理 ${expiringUsers.length} 个即将到期的会员`);
  } catch (error: any) {
    console.error('[会员到期提醒] 检查失败:', error.message);
  }
}

/**
 * 启动会员到期提醒定时任务
 */
export function startMembershipExpiryReminder(): void {
  console.log('[会员到期提醒] 定时任务已启动，每24小时检查一次');
  
  // 启动后延迟5分钟执行第一次检查（等待服务完全启动）
  setTimeout(() => {
    checkMembershipExpiry();
    
    // 之后每24小时执行一次
    setInterval(checkMembershipExpiry, CHECK_INTERVAL);
  }, 5 * 60 * 1000);
}

/**
 * 手动触发检查（供管理接口调用）
 */
export async function triggerMembershipExpiryCheck(): Promise<{ success: boolean; message: string }> {
  try {
    await checkMembershipExpiry();
    return { success: true, message: '会员到期提醒检查已完成' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
