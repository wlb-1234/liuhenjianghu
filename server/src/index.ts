import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 9091;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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

export default app;
