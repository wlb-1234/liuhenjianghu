/**
 * IP白名单中间件
 */

import { Request, Response, NextFunction } from 'express';
import { isIPWhitelisted } from './ipWhitelist';

export function ipWhitelistMiddleware(req: Request, res: Response, next: NextFunction): void {
  // 获取客户端IP
  const clientIP = getClientIP(req);
  
  if (!isIPWhitelisted(clientIP)) {
    res.status(403).json({
      success: false,
      error: {
        code: 'IP_NOT_WHITELISTED',
        message: '当前IP不在白名单中，禁止访问'
      }
    });
    return;
  }
  
  next();
}

/**
 * 获取客户端真实IP
 */
function getClientIP(req: Request): string {
  // 优先从代理头获取
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For 可能包含多个IP，取第一个
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips.split(',')[0].trim();
  }
  
  // Cloudflare
  const cfConnectingIP = req.headers['cf-connecting-ip'];
  if (cfConnectingIP) {
    return Array.isArray(cfConnectingIP) ? cfConnectingIP[0] : cfConnectingIP;
  }
  
  // Railway/Vercel等
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return Array.isArray(realIP) ? realIP[0] : realIP;
  }
  
  // 默认
  return req.ip || req.socket.remoteAddress || '0.0.0.0';
}

export { createWhitelistRouter } from '../routes/whitelist';
