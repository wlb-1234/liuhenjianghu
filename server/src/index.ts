import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { requestLogger } from './middleware/logger.js';
import { createMetricsMiddleware } from './middleware/prometheus.js';
import { initRedis } from './middleware/redisClient.js';
import { cacheMiddleware } from './middleware/cache.js';
import { initAlertSystem } from './services/webhookService.js';
import regionsRouter from './routes/regions.js';
import statsRouter from './routes/stats.js';
import apiKeysRouter from './routes/apikeys.js';
import logsRouter from './routes/logs.js';
import cacheRouter from './routes/cache.js';
import geoRouter from './routes/geo.js';
import reverseRouter from './routes/reverse.js';
import swaggerRouter from './routes/swagger.js';
import collectionsRouter from './routes/collections.js';
import { createWhitelistRouter } from './middleware/ipWhitelistMiddleware.js';
import webhookRouter from './routes/webhooks.js';
import { router as alertsRouter } from './routes/alerts.js';
import imageModerationRouter from './routes/imageModeration.js';
import advancedCacheRouter from './routes/advancedCache.js';
import pushNotificationsRouter from './routes/pushNotifications.js';
import feedbackRouter from './routes/feedback.js';
import databaseOptimizationRouter from './routes/databaseOptimization.js';
import messageRecallRouter from './routes/messageRecall.js';
import searchRouter from './routes/search.js';
import dataExportRouter from './routes/dataExport.js';
import socialRouter from './routes/social.js';
import contentModerationRouter from './routes/contentModeration.js';
import scheduledPostRouter from './routes/scheduledPost.js';
import i18nRouter from './routes/i18n.js';
import themeRouter from './routes/theme.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// 初始化
initRedis();
initAlertSystem();

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Prometheus指标
const metricsRouter = createMetricsMiddleware();
app.use('/metrics', metricsRouter);

// 静态文件目录
const publicDir = path.join(__dirname, 'public');

// 静态文件（Web管理后台）
app.use(express.static(publicDir));

// Web管理后台
app.get('/admin', (req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'admin.html'));
});

// 健康检查
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    service: 'China Regions API',
    version: '3.0.0',
    timestamp: new Date().toISOString()
  });
});

// 路由
app.use('/api/v1/regions', regionsRouter);
app.use('/api/v1/stats', statsRouter);
app.use('/api/v1/apikeys', apiKeysRouter);
app.use('/api/v1/logs', logsRouter);
app.use('/api/v1/cache', cacheRouter);
app.use('/api/v1/geo', geoRouter);
app.use('/api/v1/geo', reverseRouter);
app.use('/', swaggerRouter);
app.use('/api/v1/geo', collectionsRouter);
app.use('/api/v1/whitelist', createWhitelistRouter());
app.use('/api/v1/webhooks', webhookRouter);
app.use('/api/v1/alerts', alertsRouter);
app.use('/api/v1/moderation', imageModerationRouter);
app.use('/api/v1/cache', advancedCacheRouter);
app.use('/api/v1/notifications', pushNotificationsRouter);
app.use('/api/v1/feedback', feedbackRouter);
app.use('/api/v1/db', databaseOptimizationRouter);
app.use('/api/v1/messages', messageRecallRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/export', dataExportRouter);
app.use('/api/v1/social', socialRouter);
app.use('/api/v1/admin', contentModerationRouter);
app.use('/api/v1/scheduled', scheduledPostRouter);
app.use('/api/v1/i18n', i18nRouter);
app.use('/api/v1/theme', themeRouter);

// 错误处理
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]', err.message);
  res.status(500).json({ 
    code: 500, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 启动服务
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] China Regions API v3.0.0 started on port ${PORT}`);
  console.log(`[Server] Admin UI: http://localhost:${PORT}/admin`);
  console.log(`[Server] API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`[Server] Health: http://localhost:${PORT}/api/v1/health`);
});

export default app;
