/**
 * IP白名单管理路由
 */

import { Router, Request, Response } from 'express';
import {
  getWhitelistConfig,
  setWhitelistConfig,
  addWhitelistRule,
  removeWhitelistRule,
  WhitelistRule,
  isIPWhitelisted as checkIPWhitelist
} from '../middleware/ipWhitelist';

const router = Router();

/**
 * GET /api/v1/whitelist
 * 获取白名单配置
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: getWhitelistConfig()
  });
});

/**
 * PUT /api/v1/whitelist
 * 更新白名单配置
 */
router.put('/', (req: Request, res: Response) => {
  const { enabled, allowPrivate } = req.body;
  
  setWhitelistConfig({ enabled, allowPrivate });
  
  res.json({
    success: true,
    data: getWhitelistConfig()
  });
});

/**
 * POST /api/v1/whitelist/rules
 * 添加白名单规则
 */
router.post('/rules', (req: Request, res: Response) => {
  const { pattern, description } = req.body;
  
  if (!pattern) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'pattern不能为空' }
    });
    return;
  }
  
  const rule = addWhitelistRule({ pattern, description });
  
  res.status(201).json({
    success: true,
    data: rule
  });
});

/**
 * DELETE /api/v1/whitelist/rules/:id
 * 删除白名单规则
 */
router.delete('/rules/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  
  const success = removeWhitelistRule(id);
  
  if (success) {
    res.json({
      success: true,
      message: '规则已删除'
    });
  } else {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: '规则不存在' }
    });
  }
});

/**
 * GET /api/v1/whitelist/check
 * 检查IP是否在白名单中
 */
router.get('/check', (req: Request, res: Response) => {
  const { ip } = req.query;
  
  if (!ip || typeof ip !== 'string') {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'ip参数不能为空' }
    });
    return;
  }
  
  const whitelisted = isIPWhitelisted(ip);
  
  res.json({
    success: true,
    data: {
      ip,
      whitelisted,
      reason: whitelisted ? 'IP在白名单中或白名单未启用' : 'IP不在白名单中'
    }
  });
});

export { createWhitelistRouter };

/**
 * 创建白名单管理路由
 */
function createWhitelistRouter() {
  return router;
}

export default router;
