import { Request, Response, NextFunction } from 'express';

export interface AdminUser {
  id: number;
  role: string;
}

// 简单验证：检查 x-admin-token header
export function verifyAdmin(req: Request, res: Response, next: NextFunction) {
  const adminToken = req.headers['x-admin-token'] as string;
  const validToken = process.env.ADMIN_TOKEN || 'admin_token_dev';

  if (adminToken === validToken) {
    (req as any).adminUser = { id: 0, role: 'admin' };
    next();
  } else {
    res.status(401).json({ error: '未授权访问管理后台' });
  }
}
