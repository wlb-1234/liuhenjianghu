/**
 * 短信发送与登录防刷中间件
 */
import { NextFunction, Request, Response } from 'express';
import { SMS_LIMIT, LOGIN_LIMIT } from '../config/security.js';

// 存储结构：key -> {count, lastReset, windowStart}
interface LimitEntry {
  count: number;
  windowStart: number;
}

// 内存存储
const smsPhoneMap = new Map<string, LimitEntry>();       // phone
const smsIpMap = new Map<string, LimitEntry>();          // ip (窗口内)
const smsPhoneDaily = new Map<string, { date: string; count: number }>(); // phone per day
const loginIpMap = new Map<string, LimitEntry>();        // ip

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function checkWindow(
  map: Map<string, LimitEntry>,
  key: string,
  windowMs: number,
  limit: number
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = map.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    map.set(key, { count: 1, windowStart: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= limit) {
    const retryAfterMs = windowMs - (now - entry.windowStart);
    return { allowed: false, retryAfterMs };
  }

  entry.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

/**
 * 短信发送防刷
 * 限制：同一手机号 60 秒 1 条；同一 IP 10 分钟 5 条；同一手机号每日 10 条
 */
export function smsRateLimit(req: Request, res: Response, next: NextFunction): Response | void {
  const phone = (req.body as any)?.phone;
  const ip = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';

  if (!phone) {
    // 无手机号不拦截（交由业务逻辑处理）
    return next();
  }

  // 手机号每日上限
  const today = todayString();
  const daily = smsPhoneDaily.get(phone);
  if (daily && daily.date === today && daily.count >= SMS_LIMIT.perPhoneDailyLimit) {
    return res.status(429).json({ error: '今日验证码发送次数已达上限（10次），请明天再试' });
  }
  if (!daily || daily.date !== today) {
    smsPhoneDaily.set(phone, { date: today, count: 0 });
  }

  // 手机号 60 秒窗口
  const phoneCheck = checkWindow(smsPhoneMap, phone, SMS_LIMIT.perPhoneWindowMs, SMS_LIMIT.perPhoneLimit);
  if (!phoneCheck.allowed) {
    return res.status(429).json({ error: '验证码发送过于频繁，请 1 分钟后再试' });
  }

  // IP 10 分钟窗口
  const ipCheck = checkWindow(smsIpMap, ip, SMS_LIMIT.perIpWindowMs, SMS_LIMIT.perIpLimit);
  if (!ipCheck.allowed) {
    return res.status(429).json({
      error: '当前网络发送验证码过于频繁，请稍后再试',
      retryAfterSec: Math.ceil(ipCheck.retryAfterMs / 1000),
    });
  }

  // 完成后递增每日计数
  smsPhoneDaily.get(phone)!.count += 1;
  next();
}

/**
 * 登录防刷（普通用户登录）
 * 限制：同一 IP 10 分钟最多 20 次登录尝试
 */
export function loginRateLimit(req: Request, res: Response, next: NextFunction): Response | void {
  const ip = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
  const check = checkWindow(loginIpMap, ip, LOGIN_LIMIT.perIpWindowMs, LOGIN_LIMIT.perIpLimit);
  if (!check.allowed) {
    return res.status(429).json({
      error: '登录尝试过于频繁，请稍后再试',
      retryAfterSec: Math.ceil(check.retryAfterMs / 1000),
    });
  }
  next();
}