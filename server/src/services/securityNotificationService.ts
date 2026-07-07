/**
 * 安全通知服务
 * 处理登录安全、账号异常等通知
 */

import crypto from 'crypto';
import { getPool } from '../config/database.js';
import { NotificationService, MessagePriority } from './notificationService.js';

// 登录失败记录（内存存储，重启后清空）
const loginFailures = new Map<string, { count: number; lastAttempt: number; ip: string }>();

// 已知设备记录（简化版，使用IP+UA哈希）
const knownDevices = new Map<number, Set<string>>();

/**
 * 生成设备指纹（简化版）
 */
function generateDeviceFingerprint(ip: string, userAgent: string): string {
  const data = `${ip}_${userAgent.substring(0, 50)}`;
  return crypto.createHash('md5').update(data).digest('hex').substring(0, 16);
}

/**
 * 记录登录失败
 */
export function recordLoginFailure(phone: string, ip: string): void {
  const key = phone;
  const existing = loginFailures.get(key);
  
  if (existing) {
    existing.count += 1;
    existing.lastAttempt = Date.now();
    existing.ip = ip;
  } else {
    loginFailures.set(key, { count: 1, lastAttempt: Date.now(), ip });
  }
  
  // 清理超过1小时的记录
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [k, v] of loginFailures) {
    if (v.lastAttempt < oneHourAgo) {
      loginFailures.delete(k);
    }
  }
}

/**
 * 清除登录失败记录
 */
export function clearLoginFailure(phone: string): void {
  loginFailures.delete(phone);
}

/**
 * 获取登录失败次数
 */
export function getLoginFailureCount(phone: string): number {
  return loginFailures.get(phone)?.count || 0;
}

/**
 * 检查是否是新设备登录
 */
export async function checkNewDeviceLogin(
  userId: number, 
  ip: string, 
  userAgent: string
): Promise<boolean> {
  const fingerprint = generateDeviceFingerprint(ip, userAgent);
  
  // 从数据库加载已知设备
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT known_devices FROM users WHERE id = $1',
      [userId]
    );
    
    const knownDevicesList = result.rows[0]?.known_devices || [];
    
    if (knownDevicesList.includes(fingerprint)) {
      return false; // 已知设备
    }
    
    // 记录新设备
    const updatedDevices = [...knownDevicesList, fingerprint].slice(-10); // 只保留最近10个
    await pool.query(
      'UPDATE users SET known_devices = $1 WHERE id = $2',
      [JSON.stringify(updatedDevices), userId]
    );
    
    return true; // 新设备
  } catch (error: any) {
    console.error('[安全通知] 检查设备失败:', error.message);
    return false; // 出错时不发送通知
  }
}

/**
 * 发送新设备登录提醒
 */
export async function sendNewDeviceLoginNotification(
  userId: number,
  ip: string,
  userAgent: string
): Promise<void> {
  try {
    // 简化IP显示（隐藏部分）
    const ipParts = ip.split('.');
    const maskedIp = ipParts.length === 4 
      ? `${ipParts[0]}.${ipParts[1]}.*.*` 
      : ip.substring(0, 10) + '***';
    
    // 简化UA显示
    let deviceName = '未知设备';
    if (userAgent.includes('iPhone')) deviceName = 'iPhone';
    else if (userAgent.includes('Android')) deviceName = 'Android设备';
    else if (userAgent.includes('Mac')) deviceName = 'Mac电脑';
    else if (userAgent.includes('Windows')) deviceName = 'Windows电脑';
    else if (userAgent.includes('Linux')) deviceName = 'Linux设备';
    
    await NotificationService.sendSystemMessage(
      userId,
      '新设备登录提醒',
      `检测到您的账号在${deviceName}登录（IP: ${maskedIp}），若非本人操作请及时修改密码。`,
      { type: 'new_device_login', ip, deviceName },
      MessagePriority.HIGH
    );
  } catch (error: any) {
    console.error('[安全通知] 发送新设备登录通知失败:', error.message);
  }
}

/**
 * 发送账号异常提醒（多次登录失败）
 */
export async function sendAccountAbnormalNotification(
  userId: number,
  failCount: number,
  ip: string
): Promise<void> {
  try {
    const ipParts = ip.split('.');
    const maskedIp = ipParts.length === 4 
      ? `${ipParts[0]}.${ipParts[1]}.*.*` 
      : '未知';
    
    await NotificationService.sendSystemMessage(
      userId,
      '账号安全提醒',
      `您的账号存在${failCount}次登录失败行为（IP: ${maskedIp}），为保障安全请尽快修改密码。`,
      { type: 'account_abnormal', failCount, ip },
      MessagePriority.HIGH
    );
  } catch (error: any) {
    console.error('[安全通知] 发送账号异常通知失败:', error.message);
  }
}

/**
 * 发送密码修改通知
 */
export async function sendPasswordChangeNotification(
  userId: number
): Promise<void> {
  try {
    await NotificationService.sendSystemMessage(
      userId,
      '密码修改成功',
      '您的登录密码已修改成功。如非本人操作请立即联系客服。',
      { type: 'password_changed' },
      MessagePriority.HIGH
    );
  } catch (error: any) {
    console.error('[安全通知] 发送密码修改通知失败:', error.message);
  }
}

/**
 * 发送违规通知
 */
export async function sendViolationNotification(
  userId: number,
  reason: string,
  action: string // 'warning' | 'ban' | 'content_removed'
): Promise<void> {
  try {
    let title = '违规通知';
    let content = '';
    
    switch (action) {
      case 'warning':
        title = '违规警告';
        content = `您的内容因「${reason}」违反社区规范，已被警告。请注意规范使用，多次违规可能导致封号。`;
        break;
      case 'ban':
        title = '账号封禁通知';
        content = `您的账号因「${reason}」违反社区规范，已被封禁。如有疑问请联系客服申诉。`;
        break;
      case 'content_removed':
        title = '内容删除通知';
        content = `您发布的内容因「${reason}」违反社区规范，已被删除。请遵守社区规范，共同维护良好的社区环境。`;
        break;
      default:
        content = `您的内容因「${reason}」违反社区规范，已被处理。`;
    }
    
    await NotificationService.sendSystemMessage(
      userId,
      title,
      content,
      { type: 'violation', reason, action },
      MessagePriority.HIGH
    );
  } catch (error: any) {
    console.error('[安全通知] 发送违规通知失败:', error.message);
  }
}

/**
 * 发送系统维护通知（广播给所有用户）
 */
export async function sendMaintenanceNotification(
  title: string,
  content: string,
  startTime: string,
  endTime?: string
): Promise<{ success: boolean; count?: number }> {
  try {
    let fullContent = content;
    if (startTime) {
      fullContent += `\n\n维护时间：${startTime}`;
      if (endTime) {
        fullContent += ` 至 ${endTime}`;
      }
    }
    fullContent += '\n\n维护期间部分功能暂不可用，敬请谅解。';
    
    const result = await NotificationService.broadcastSystemMessage(
      title || '系统维护通知',
      fullContent,
      { type: 'maintenance', startTime, endTime }
    );
    
    return { success: result.success, count: result.data?.count };
  } catch (error: any) {
    console.error('[安全通知] 发送维护通知失败:', error.message);
    return { success: false };
  }
}
