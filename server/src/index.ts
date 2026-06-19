import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { requestLogger } from './middleware/logger.js';
import { createMetricsMiddleware } from './middleware/prometheus.js';
import { initRedis } from './middleware/redisClient.js';
import { cacheMiddleware } from './middleware/cache.js';
import { initAlertSystem } from './services/webhookService.js';
import { getSupabaseClient } from './storage/database/supabase-client.js';
import crypto from 'crypto';
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
import revenueRouter from './routes/revenue.js';
import membersRouter from './routes/members.js';
import rateLimitRouter from './routes/rateLimit.js';
import reportsRouter from './routes/reports.js';
import operationLogsRouter from './routes/operationLogs.js';
import blacklistRouter from './routes/blacklist.js';
import notificationsRouter from './routes/notifications.js';
import ordersRouter from './routes/orders.js';
import dailyTasksRouter from './routes/dailyTasks.js';
import shareRouter from './routes/share.js';
import pointsRouter from './routes/points.js';

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

// 手机管理后台
app.get('/admin-mobile', (req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'admin-mobile.html'));
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

// 管理员登录
app.post('/api/v1/admin/login', async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.json({ success: false, error: '请输入手机号和密码' });
    }
    
    // 验证密码 (默认密码: admin123)
    const validPassword = 'admin123';
    if (password !== validPassword) {
      return res.json({ success: false, error: '手机号或密码错误' });
    }
    
    // 查询用户
    const supabase = getSupabaseClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, phone, nickname, member_level, user_rank')
      .eq('phone', phone)
      .eq('member_level', 'L4') // 只有L4会员可以登录后台
      .single();
    
    if (error || !user) {
      return res.json({ success: false, error: '该账号不是管理员' });
    }
    
    // 生成简单token
    const token = crypto.randomBytes(32).toString('hex');
    
    res.json({
      success: true,
      data: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        member_level: user.member_level,
        user_rank: user.user_rank,
        token
      }
    });
  } catch (err: any) {
    console.error('[Admin Login Error]', err);
    res.json({ success: false, error: '登录失败' });
  }
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
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/theme', themeRouter);
app.use('/api/v1/revenue', revenueRouter);
app.use('/api/v1/members', membersRouter);
app.use('/api/v1/operation-logs', operationLogsRouter);
app.use('/api/v1/rate-limit', rateLimitRouter);
app.use('/api/v1/blacklist', blacklistRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/tasks', dailyTasksRouter);
app.use('/api/v1/share', shareRouter);
// 临时管理员初始化接口（首次部署后调用一次即可）
// 使用原生 pg Pool，避免 Drizzle ORM 问题
app.get('/api/v1/init-admin', async (req: Request, res: Response) => {
  try {
    const { Pool } = await import('pg');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // 检查是否已有管理员
    const existingResult = await pool.query(
      "SELECT id, phone FROM users WHERE phone = $1",
      ['15613594588']
    );
    
    if (existingResult.rows.length > 0) {
      await pool.end();
      return res.json({ success: true, message: '管理员已存在', phone: existingResult.rows[0].phone });
    }
    
    // 创建管理员账号（只使用必要字段）
    const insertResult = await pool.query(`
      INSERT INTO users (phone, nickname, member_level, member_expire_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id, phone
    `, [
      '15613594588',
      '管理员',
      'L4',
      '2030-12-31 23:59:59+00'
    ]);
    
    if (insertResult.rows.length === 0) {
      await pool.end();
      throw new Error('创建管理员失败');
    }
    
    await pool.end();
    
    console.log('[Init Admin] 管理员账号创建成功: 15613594588');
    res.json({ success: true, message: '管理员创建成功', phone: '15613594588' });
  } catch (err: any) {
    console.error('[Init Admin] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.use('/api/v1/points', pointsRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/admin/logs', operationLogsRouter);

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
