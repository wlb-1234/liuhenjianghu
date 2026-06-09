/**
 * CSRF 防护中间件
 * 通过检查 Origin/Referer 头防止跨站请求伪造
 */
import { Request, Response, NextFunction } from 'express';

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // 仅对非 GET/HEAD/OPTIONS 请求进行 CSRF 检查
  const method = req.method;
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return next();
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const allowedOrigins = [
    'liuhenjianghu-production.up.railway.app',
    'liuhenjianghu.up.railway.app',
    'localhost',
    '127.0.0.1',
  ];

  // 允许的来源检查
  const isAllowedOrigin = () => {
    if (!origin) return true; // 没有 origin 头则放行（部分客户端不发送）
    
    for (const allowed of allowedOrigins) {
      if (origin.includes(allowed)) return true;
    }
    return false;
  };

  // 允许的 Referer 检查
  const isAllowedReferer = () => {
    if (!referer) return true;
    
    for (const allowed of allowedOrigins) {
      if (referer.includes(allowed)) return true;
    }
    return false;
  };

  // 生产环境必须有有效的 Origin 或 Referer
  if (process.env.NODE_ENV === 'production') {
    if (!isAllowedOrigin() && !isAllowedReferer()) {
      res.status(403).json({ 
        success: false, 
        error: 'CSRF validation failed: invalid origin' 
      });
      return;
    }
  }

  next();
}
