import express from 'express';
import cors from 'cors';
import path from 'path';

// 错误处理和日志
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import logsRouter from './middleware/logger';
import { rateLimiters } from './middleware/rateLimiter';
import { createCacheRouter } from './middleware/cache';
import { csrfProtection } from './middleware/csrfProtection';

const app = express();
const PORT = process.env.PORT || 9091;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 请求日志中间件
app.use(requestLogger);

// 健康检查（独立于数据库）
app.get('/api/v1/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '流痕江湖 API 服务运行中',
    timestamp: new Date().toISOString()
  });
});

// 导入路由（延迟加载，避免启动时就连接数据库）
import authRoutes from './routes/auth';
import regionRoutes from './routes/regions';
import postRoutes from './routes/posts';
import socialRoutes from './routes/social';
import memberRoutes from './routes/member';
import uploadRoutes from './routes/upload';
import adminRoutes from './routes/admin';
import moderationRoutes from './routes/moderation';
import paymentRoutes from './routes/payment';
import reportsRoutes from './routes/reports';
import sensitiveWordsRoutes from './routes/sensitiveWords';
import userStatsRoutes from './routes/userStats';
import checkInRoutes from './routes/checkIn';
import notificationsRoutes from './routes/notifications';
import reviewRoutes from './routes/review';
import accountDeletionRoutes from './routes/accountDeletion';
import collectionsRoutes from './routes/collections';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/regions', regionRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/social', socialRoutes);
app.use('/api/v1/member', memberRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/moderation', moderationRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/sensitive-words', sensitiveWordsRoutes);
app.use('/api/v1/user-stats', userStatsRoutes);
app.use('/api/v1/check-in', checkInRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/moderation', reviewRoutes);
app.use('/api/v1/account', accountDeletionRoutes);
app.use('/api/v1/logs', logsRouter);
app.use('/api/v1/collections', collectionsRoutes);
app.use('/api/v1/cache', createCacheRouter());

// 错误处理（放在所有路由之后）
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║      🗡️  流痕江湖 API 服务已启动      🗡️');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║  📍 端口: ${PORT}                             ║`);
  console.log(`║  🌐 地址: http://localhost:${PORT}           ║`);
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
});

// CSRF 防护（仅对需要认证的 API 生效）
app.use('/api/v1', csrfProtection);

export default app;
