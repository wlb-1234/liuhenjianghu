import { Request, Response, NextFunction } from 'express';

// API Keys配置（生产环境应使用环境变量）
const API_KEYS = new Set([
  'sk_dev_key_abc123',
  'sk_prod_key_xyz789',
]);

// 公开接口路径（不需要认证）- 使用原始URL匹配
const PUBLIC_PATHS = [
  '/api/v1/health',
  '/api/v1/regions/stats',
  '/api-docs',
];

/**
 * API Key认证中间件
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  // 使用 originalUrl 获取完整路径
  const fullPath = req.originalUrl.split('?')[0];
  
  // 公开接口直接放行
  if (PUBLIC_PATHS.some(p => fullPath === p || fullPath.startsWith(p + '/'))) {
    return next();
  }
  
  // 只对 /api/v1/regions 路径进行认证
  if (!fullPath.startsWith('/api/v1/regions')) {
    return next();
  }
  
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({
      code: 401,
      message: '缺少API密钥，请使用 x-api-key Header传递',
      data: null
    });
  }
  
  if (!API_KEYS.has(apiKey)) {
    return res.status(403).json({
      code: 403,
      message: 'API密钥无效',
      data: null
    });
  }
  
  next();
}

/**
 * 获取当前API Keys列表（仅开发环境）
 */
export function getApiKeys(): string[] {
  return Array.from(API_KEYS);
}
