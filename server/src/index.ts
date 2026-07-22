import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { requestLogger } from './middleware/logger.js';
import { createMetricsMiddleware } from './middleware/prometheus.js';
import { initRedis } from './middleware/redisClient.js';
import { cacheMiddleware } from './middleware/cache.js';
import { initAlertSystem } from './services/webhookService.js';
import { startMembershipExpiryReminder } from './services/membershipExpiryService.js';
import { query } from './config/database.js';
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
import paymentRouter from './routes/payment.js';
import favoritesRouter from './routes/favorites.js';
import statisticsRouter from './routes/statistics.js';
import commentsRouter from './routes/comments.js';
import feedbacksRouter from './routes/feedbacks.js';
import realnameRouter from './routes/realname.js';
import authRouter from './routes/auth.js';
import postsRouter from './routes/posts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// 初始化
initRedis();
initAlertSystem();
startMembershipExpiryReminder();

// CORS 跨域配置
const corsOptions = {
  origin: [
    'https://liuhenjianghu.com',
    'http://liuhenjianghu.com',
    'https://expo-app-production-31ad.up.railway.app',
    'http://expo-app-production-31ad.up.railway.app',
    'https://liuhenjianghu-production.up.railway.app',
    'http://liuhenjianghu-production.up.railway.app',
    'https://www.liuhenjianghu.com',
    'http://www.liuhenjianghu.com',
  ],
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Prometheus指标
const metricsRouter = createMetricsMiddleware();
app.use('/metrics', metricsRouter);

// 静态文件目录（从 src/ 回到 server/ 目录）
const publicDir = path.join(__dirname, '..', 'public');

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

// 测试数据库连接
app.get('/api/v1/dbtest', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT inet_server_addr() as ip, current_database() as db');
    console.log('✅ DB Test Success:', result.rows);
    res.json({ success: true, data: result.rows });
  } catch(e: any) {
    console.error('❌ DB Test Error:', e.message);
    res.json({ success: false, error: e.message });
  }
});

// 健康检查
app.get('/api/v1/health', async (req: Request, res: Response) => {
  try {
    const dbTest = await query('SELECT current_database(), inet_server_addr() as server_ip');
    res.json({ 
      status: 'ok', 
      service: 'China Regions API',
      version: '3.0.0',
      timestamp: new Date().ISOString,
      database: dbTest.rows[0]?.current_database,
      dbServer: dbTest.rows[0]?.server_ip
    });
  } catch(e: any) {
    res.json({ 
      status: 'error', 
      error: e.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 管理员登录
app.post('/api/v1/admin/login', async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.json({ success: false, error: '请输入手机号和密码' });
    }
    
    // 测试模式：只要密码是 admin123 就允许登录（临时解决方案）
    if (password === 'admin123' && phone === '15613594588') {
      console.log('[Admin Login] 测试模式登录成功 - 账号:', phone);
      const token = crypto.randomBytes(32).toString('hex');
      return res.json({
        success: true,
        data: {
          id: 999,
          phone: phone,
          nickname: '管理员',
          member_level: 4,
          token
        }
      });
    }
    
    // 正常验证流程...
    const validPassword = 'admin123';
    if (password !== validPassword) {
      return res.json({ success: false, error: '手机号或密码错误' });
    }
    
    // 查询用户 - 支持数字4或字符串'L4'
    const result = await query(
      'SELECT id, phone, nickname, member_level, user_rank FROM users WHERE phone = $1',
      [phone]
    );
    const user = result.rows[0];
    
    console.log('[Admin Login] 查询结果:', { user, error, member_level: user?.member_level });
    
    // 检查是否是管理员 (member_level = 4 或 'L4')
    const isAdmin = user && (user.member_level === 4 || user.member_level === 'L4');
    console.log('[Admin Login] isAdmin:', isAdmin);
    
    if (!user || !isAdmin) {
      console.log('[Admin Login] 登录失败: 该账号不是管理员');
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
app.use('/api/v1/favorites', (await import('./routes/favorites.js')).default);
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
    
    // 先获取 users 表的列信息
    const columnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    const columns = columnsResult.rows.map(r => r.column_name);
    const dataTypes = {};
    columnsResult.rows.forEach(r => dataTypes[r.column_name] = r.data_type);
    
    // 构建动态插入语句，只包含存在的列
    const insertColumns = ['phone', 'nickname', 'password'];
    const insertValues = ['15613594588', '管理员', 'admin123'];
    
    // 如果 member_level 是 integer 类型
    if (columns.includes('member_level')) {
      insertColumns.push('member_level');
      insertValues.push('4'); // 4 = L4 全国级
    } else if (columns.includes('member_level') && dataTypes['member_level'] === 'character varying') {
      insertColumns.push('member_level');
      insertValues.push('L4');
    }
    
    const placeholders = insertValues.map((_, i) => `$${i + 1}`).join(', ');
    
    const insertResult = await pool.query(`
      INSERT INTO users (${insertColumns.join(', ')})
      VALUES (${placeholders})
      RETURNING id, phone
    `, insertValues);
    
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
app.use('/api/v1/payment', paymentRouter);
app.use('/api/v1/favorites', favoritesRouter);
app.use('/api/v1/statistics', statisticsRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/comments', commentsRouter);
app.use('/api/v1/feedbacks', feedbacksRouter);
app.use('/api/v1/realname', realnameRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/posts', postsRouter);
app.use('/api/v1/admin/logs', operationLogsRouter);

// 手动触发会员到期提醒检查（管理员接口）
app.post('/api/v1/admin/membership-expiry-check', async (req: Request, res: Response) => {
  try {
    const { triggerMembershipExpiryCheck } = await import('./services/membershipExpiryService.js');
    const result = await triggerMembershipExpiryCheck();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 发送系统维护通知（管理员接口）
app.post('/api/v1/admin/maintenance-notify', async (req: Request, res: Response) => {
  try {
    const { sendMaintenanceNotification } = await import('./services/securityNotificationService.js');
    const { title, content, startTime, endTime } = req.body;
    
    if (!content) {
      return res.status(400).json({ success: false, message: '维护内容不能为空' });
    }
    
    const result = await sendMaintenanceNotification(
      title || '系统维护通知',
      content,
      startTime || '',
      endTime
    );
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 检查应用版本更新
app.get('/api/v1/version/check', async (req: Request, res: Response) => {
  try {
    const { platform, version, buildNumber } = req.query;
    
    if (!platform || !version || !buildNumber) {
      return res.status(400).json({ 
        success: false, 
        message: '缺少必要参数: platform, version, buildNumber' 
      });
    }
    
    const { checkUpdate } = await import('./services/versionService.js');
    const result = await checkUpdate(
      platform as 'ios' | 'android',
      version as string,
      parseInt(buildNumber as string)
    );
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 发布新版本（管理员接口）
app.post('/api/v1/admin/version/publish', async (req: Request, res: Response) => {
  try {
    const { publishVersion } = await import('./services/versionService.js');
    const { platform, version, buildNumber, minSupportedVersion, updateType, updateUrl, releaseNotes, forceUpdate } = req.body;
    
    if (!platform || !version || !buildNumber) {
      return res.status(400).json({ 
        success: false, 
        message: '缺少必要参数: platform, version, buildNumber' 
      });
    }
    
    const result = await publishVersion({
      platform,
      version,
      buildNumber,
      minSupportedVersion,
      updateType,
      updateUrl,
      releaseNotes,
      forceUpdate
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 初始化数据库表（管理员接口，用于创建缺失的表）
app.post('/api/v1/admin/init-db', async (req: Request, res: Response) => {
  try {
    const { query } = await import('./config/database.js');
    
    // 创建 app_versions 表
    await query(`
      CREATE TABLE IF NOT EXISTS app_versions (
        id SERIAL PRIMARY KEY,
        platform VARCHAR(20) NOT NULL,
        version VARCHAR(20) NOT NULL,
        build_number INTEGER NOT NULL,
        min_supported_version VARCHAR(20) DEFAULT '1.0.0',
        update_type VARCHAR(20) DEFAULT 'optional',
        update_url TEXT,
        release_notes TEXT,
        force_update BOOLEAN DEFAULT FALSE,
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await query(`CREATE INDEX IF NOT EXISTS idx_app_versions_platform ON app_versions(platform)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_app_versions_build ON app_versions(build_number DESC)`);
    
    // 给 users 表添加 known_devices 字段
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS known_devices JSONB DEFAULT '[]'::jsonb`);
    
    // 插入默认版本
    await query(`
      INSERT INTO app_versions (platform, version, build_number, release_notes, published_at)
      VALUES ('both', '1.0.10', 10, '新增消息通知功能', CURRENT_TIMESTAMP)
      ON CONFLICT DO NOTHING
    `);
    
    res.json({ success: true, message: '数据库初始化完成' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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
