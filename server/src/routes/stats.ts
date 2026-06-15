/**
 * 统计API路由
 */
import { Router } from "express";
import {
  getStats,
  getSummary,
  getRecentLogs,
  getTopEndpoints,
  getActiveHours,
  getDailyStats
} from "../middleware/stats";
import { apiKeyAuth } from "../middleware/apiKeyAuth";

const router = Router();

/**
 * @swagger
 * /api/v1/stats/summary:
 *   get:
 *     summary: 获取API调用汇总统计
 *     tags: [统计]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
router.get("/summary", apiKeyAuth, (req, res) => {
  const summary = getSummary();
  res.json({
    code: 200,
    message: "success",
    data: summary
  });
});

/**
 * @swagger
 * /api/v1/stats/endpoints:
 *   get:
 *     summary: 获取各接口调用统计
 *     tags: [统计]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 返回数量限制
 *     responses:
 *       200:
 *         description: 成功
 */
router.get("/endpoints", apiKeyAuth, (req, res) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const endpoints = getTopEndpoints(limit);
  res.json({
    code: 200,
    message: "success",
    data: endpoints
  });
});

/**
 * @swagger
 * /api/v1/stats/realtime:
 *   get:
 *     summary: 获取实时请求统计
 *     tags: [统计]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
router.get("/realtime", apiKeyAuth, (req, res) => {
  const stats = getStats();
  const recentLogs = getRecentLogs(50);
  const activeHours = getActiveHours();
  
  res.json({
    code: 200,
    message: "success",
    data: {
      activeEndpoints: Object.keys(stats).length,
      recentLogs,
      activeHours,
      cacheStats: {
        keys: stats
      }
    }
  });
});

/**
 * @swagger
 * /api/v1/stats/daily:
 *   get:
 *     summary: 获取每日请求统计
 *     tags: [统计]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
router.get("/daily", apiKeyAuth, (req, res) => {
  const dailyStats = getDailyStats();
  res.json({
    code: 200,
    message: "success",
    data: dailyStats
  });
});

/**
 * @swagger
 * /api/v1/stats/logs:
 *   get:
 *     summary: 获取最近请求日志
 *     tags: [统计]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: 返回数量限制
 *     responses:
 *       200:
 *         description: 成功
 */
router.get("/logs", apiKeyAuth, (req, res) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const logs = getRecentLogs(limit);
  res.json({
    code: 200,
    message: "success",
    data: logs
  });
});

export default router;
