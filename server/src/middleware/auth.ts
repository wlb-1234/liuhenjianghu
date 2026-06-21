import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getUserById } from '../services/userService';

const JWT_SECRET = process.env.JWT_SECRET || 'liuhen-jianghu-secret-key-2024';

export interface AuthRequest extends Request {
  userId?: number;
  adminId?: number;
  user?: any;
}

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未授权，请先登录' });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: number; adminId?: number; username?: string; role?: string };
    
    // 同时支持普通用户 token (userId) 和管理员 token (adminId)
    if (decoded.userId) {
      req.userId = decoded.userId;
    } else if (decoded.adminId) {
      req.adminId = decoded.adminId;
      req.userId = decoded.adminId; // 管理员也赋值给 userId 便于后续逻辑处理
    } else {
      return res.status(401).json({ error: '无效的 token' });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

// 可选认证中间件 - 不强制登录，但会解析用户信息
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // 没有 token，继续执行
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: number; adminId?: number };
    
    if (decoded.userId) {
      req.userId = decoded.userId;
    } else if (decoded.adminId) {
      req.adminId = decoded.adminId;
      req.userId = decoded.adminId;
    }
    
    next();
  } catch (error) {
    next(); // token 无效也继续执行
  }
}

export async function authMiddlewareWithUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未授权，请先登录' });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    
    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    
    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}
