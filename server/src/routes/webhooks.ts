/**
 * Webhook告警API路由
 */
import { Router } from 'express';
import {
  configureWebhook,
  getAllWebhookConfigs,
  deleteWebhook,
  getAlertHistory,
  getAlertStats,
  clearAlertHistory,
  AlertType,
} from '../services/webhookService.js';

const router = Router();

// 验证URL格式
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * 获取所有Webhook配置
 * GET /api/v1/webhooks
 */
router.get('/', (req, res) => {
  try {
    const webhooks = getAllWebhookConfigs();
    res.json({
      code: 200,
      message: 'success',
      data: webhooks,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取Webhook配置失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 添加Webhook配置
 * POST /api/v1/webhooks
 */
router.post('/', (req, res) => {
  try {
    const { id, url, enabled = true, secret, retryCount = 3, retryDelay = 1000 } = req.body;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        code: 400,
        message: '缺少Webhook ID',
      });
    }
    
    if (!url || !isValidUrl(url)) {
      return res.status(400).json({
        code: 400,
        message: '无效的Webhook URL',
      });
    }
    
    configureWebhook(id, {
      url,
      enabled,
      secret,
      retryCount,
      retryDelay,
    });
    
    res.json({
      code: 200,
      message: 'Webhook配置成功',
      data: { id, url, enabled },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '配置Webhook失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 更新Webhook配置
 * PUT /api/v1/webhooks/:id
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { url, enabled, secret, retryCount, retryDelay } = req.body;
    
    if (url && !isValidUrl(url)) {
      return res.status(400).json({
        code: 400,
        message: '无效的Webhook URL',
      });
    }
    
    configureWebhook(id, {
      url,
      enabled,
      secret,
      retryCount,
      retryDelay,
    });
    
    res.json({
      code: 200,
      message: 'Webhook配置更新成功',
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '更新Webhook配置失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 测试Webhook
 * POST /api/v1/webhooks/:id/test
 */
router.post('/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 动态导入避免循环依赖
    const { sendAlert } = await import('../services/webhookService.js');
    
    const testAlert = {
      type: 'CUSTOM' as AlertType,
      message: 'Webhook测试通知 - 中国行政区划API',
      details: {
        timestamp: Date.now(),
        metadata: {
          test: true,
          message: '这是一条测试消息，用于验证Webhook配置是否正确',
        },
      },
    };
    
    const success = await sendAlert(id, testAlert);
    
    if (success) {
      res.json({
        code: 200,
        message: '测试消息发送成功',
      });
    } else {
      res.status(400).json({
        code: 400,
        message: '测试消息发送失败，请检查Webhook URL是否可访问',
      });
    }
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '测试Webhook失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 获取告警历史
 * GET /api/v1/webhooks/alerts
 */
router.get('/alerts/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const history = getAlertHistory(limit);
    
    res.json({
      code: 200,
      message: 'success',
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取告警历史失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 获取告警统计
 * GET /api/v1/webhooks/alerts/stats
 */
router.get('/alerts/stats', (req, res) => {
  try {
    const stats = getAlertStats();
    
    res.json({
      code: 200,
      message: 'success',
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取告警统计失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 清除告警历史
 * DELETE /api/v1/webhooks/alerts
 */
router.delete('/alerts', (req, res) => {
  try {
    clearAlertHistory();
    
    res.json({
      code: 200,
      message: '告警历史已清除',
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '清除告警历史失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 删除Webhook配置
 * DELETE /api/v1/webhooks/:id
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // 不允许删除控制台输出
    if (id === 'console') {
      return res.status(400).json({
        code: 400,
        message: '无法删除控制台输出配置',
      });
    }
    
    const deleted = deleteWebhook(id);
    
    if (deleted) {
      res.json({
        code: 200,
        message: 'Webhook配置已删除',
      });
    } else {
      res.status(404).json({
        code: 404,
        message: 'Webhook配置不存在',
      });
    }
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '删除Webhook配置失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
