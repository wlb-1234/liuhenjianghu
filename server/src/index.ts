import express from 'express';
import cors from 'cors';
import path from 'path';
import { loadEnv, getDbUrl } from 'coze-coding-dev-sdk';

// 加载环境变量
loadEnv();

const app = express();
const PORT = process.env.PORT || 9091;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 健康检查
app.get('/api/v1/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '流痕江湖 API 服务运行中',
    timestamp: new Date().toISOString()
  });
});

// 导入路由
import authRoutes from './routes/auth';
import regionRoutes from './routes/regions';
import postRoutes from './routes/posts';
import socialRoutes from './routes/social';
import memberRoutes from './routes/member';
import uploadRoutes from './routes/upload';
import adminRoutes from './routes/admin';
import moderationRoutes from './routes/moderation';

// 使用路由
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/regions', regionRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/social', socialRoutes);
app.use('/api/v1/member', memberRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/moderation', moderationRoutes);

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║                                               ║
  ║     🗡️  流痕江湖 API 服务已启动 🗡️              ║
  ║                                               ║
  ║     📍 端口: ${PORT}                             ║
  ║     🌐 地址: http://localhost:${PORT}           ║
  ║                                               ║
  ╚═══════════════════════════════════════════════╝
  `);
  
  // 测试数据库连接
  try {
    const dbUrl = getDbUrl();
    console.log('✅ 数据库连接信息已加载');
  } catch (error) {
    console.error('❌ 数据库连接信息加载失败:', error);
  }
});

export default app;
