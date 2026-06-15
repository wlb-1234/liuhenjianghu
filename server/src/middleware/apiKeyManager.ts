/**
 * API Key 管理模块
 * 支持创建、禁用、查看使用量
 */
import { Router } from 'express';
import crypto from 'crypto';

interface ApiKeyInfo {
  key: string;           // 完整密钥（仅创建时返回）
  keyPrefix: string;     // 密钥前缀（显示用）
  name: string;          // 密钥名称
  createdAt: string;     // 创建时间
  lastUsedAt: string;    // 最后使用时间
  isActive: boolean;     // 是否启用
  requestCount: number;  // 请求次数
  dailyLimit: number;    // 每日限制
}

// API Keys 存储
const apiKeys = new Map<string, ApiKeyInfo>();

// 初始化默认密钥
function initDefaultKeys() {
  const defaultKeys = [
    { key: 'sk_dev_key_abc123', name: '开发环境密钥' },
    { key: 'sk_prod_key_xyz789', name: '生产环境密钥' },
  ];
  
  defaultKeys.forEach(({ key, name }) => {
    apiKeys.set(key, {
      key,
      keyPrefix: key.substring(0, 12) + '...',
      name,
      createdAt: '2026-01-01T00:00:00Z',
      lastUsedAt: new Date().toISOString(),
      isActive: true,
      requestCount: 0,
      dailyLimit: 100000,
    });
  });
}

initDefaultKeys();

/**
 * 验证 API Key
 */
export function validateApiKey(key: string): { valid: boolean; info?: ApiKeyInfo } {
  const info = apiKeys.get(key);
  if (!info) {
    return { valid: false };
  }
  if (!info.isActive) {
    return { valid: false };
  }
  return { valid: true, info };
}

/**
 * 记录 API Key 使用
 */
export function recordApiKeyUsage(key: string): void {
  const info = apiKeys.get(key);
  if (info) {
    info.requestCount++;
    info.lastUsedAt = new Date().toISOString();
  }
}

/**
 * 生成新 API Key
 */
export function generateApiKey(name: string): ApiKeyInfo {
  const key = 'sk_' + crypto.randomBytes(24).toString('hex');
  const info: ApiKeyInfo = {
    key,
    keyPrefix: key.substring(0, 12) + '...',
    name,
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
    isActive: true,
    requestCount: 0,
    dailyLimit: 10000,
  };
  apiKeys.set(key, info);
  return info;
}

/**
 * 禁用/启用 API Key
 */
export function toggleApiKey(keyPrefix: string, active: boolean): boolean {
  for (const [key, info] of apiKeys.entries()) {
    if (info.keyPrefix === keyPrefix) {
      info.isActive = active;
      return true;
    }
  }
  return false;
}

/**
 * 获取所有 API Keys（不包含完整密钥）
 */
export function listApiKeys(): Omit<ApiKeyInfo, 'key'>[] {
  return Array.from(apiKeys.values()).map(({ key, ...rest }) => rest);
}

/**
 * 获取 API Key 使用统计
 */
export function getApiKeyStats() {
  const keys = Array.from(apiKeys.values());
  return {
    total: keys.length,
    active: keys.filter(k => k.isActive).length,
    totalRequests: keys.reduce((sum, k) => sum + k.requestCount, 0),
    topUsers: keys
      .sort((a, b) => b.requestCount - a.requestCount)
      .slice(0, 5)
      .map(({ key, ...rest }) => rest),
  };
}

/**
 * 密钥前缀查找
 */
export function findKeyByPrefix(prefix: string): ApiKeyInfo | undefined {
  for (const info of apiKeys.values()) {
    if (info.keyPrefix === prefix) {
      return info;
    }
  }
  return undefined;
}

// 创建管理路由
export const createApiKeyRouter = () => {
  const router = Router();

  // 获取所有 API Keys
  router.get('/keys', (_req, res) => {
    const keys = listApiKeys();
    const stats = getApiKeyStats();
    res.json({
      success: true,
      data: { keys, stats }
    });
  });

  // 创建新 API Key
  router.post('/keys', (req, res) => {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: '请提供密钥名称'
      });
    }

    const info = generateApiKey(name);
    res.json({
      success: true,
      message: 'API Key 创建成功，请妥善保管',
      data: {
        key: info.key,
        keyPrefix: info.keyPrefix,
        name: info.name,
        createdAt: info.createdAt,
        dailyLimit: info.dailyLimit,
      }
    });
  });

  // 禁用/启用 API Key
  router.patch('/keys/:prefix', (req, res) => {
    const { prefix } = req.params;
    const { active } = req.body;

    const success = toggleApiKey(prefix, active);
    if (success) {
      res.json({
        success: true,
        message: active ? 'API Key 已启用' : 'API Key 已禁用'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'API Key 不存在'
      });
    }
  });

  // 删除 API Key
  router.delete('/keys/:prefix', (req, res) => {
    const { prefix } = req.params;
    
    for (const [key, info] of apiKeys.entries()) {
      if (info.keyPrefix === prefix) {
        apiKeys.delete(key);
        return res.json({
          success: true,
          message: 'API Key 已删除'
        });
      }
    }

    res.status(404).json({
      success: false,
      message: 'API Key 不存在'
    });
  });

  // 获取使用统计
  router.get('/stats', (_req, res) => {
    res.json({
      success: true,
      data: getApiKeyStats()
    });
  });

  return router;
};

export default {
  validateApiKey,
  recordApiKeyUsage,
  generateApiKey,
  toggleApiKey,
  listApiKeys,
  getApiKeyStats,
  createApiKeyRouter,
};
