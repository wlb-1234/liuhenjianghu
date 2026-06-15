import { Request, Response, NextFunction } from 'express';
import { validateApiKey, recordApiKeyUsage } from './apiKeyManager';

// 公开接口路径（不需要认证）
const PUBLIC_PATHS = [
  '/api/v1/health',
  '/api/v1/regions/stats',
  '/api/v1/apikeys',
  '/api/v1/stats',
  '/api/v1/cache',
  '/metrics',
  '/api-docs',
];

/**
 * API Key认证中间件
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
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
  
  const result = validateApiKey(apiKey);
  if (!result.valid) {
    return res.status(403).json({
      code: 403,
      message: 'API密钥无效或已禁用',
      data: null
    });
  }
  
  // 记录使用
  recordApiKeyUsage(apiKey);
  next();
}

/**
 * 获取当前API Keys列表
 */
export { listApiKeys } from './apiKeyManager';
