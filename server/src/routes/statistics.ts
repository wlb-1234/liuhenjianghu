import { Router } from 'express';
import { query } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// 确保统计表存在
async function ensureStatisticsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS statistics (
      id SERIAL PRIMARY KEY,
      stat_date DATE NOT NULL,
      stat_type VARCHAR(32) NOT NULL,
      stat_value INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(stat_date, stat_type)
    )
  `);
}

// 获取统计数据
router.get('/', async (req, res) => {
  try {
    await ensureStatisticsTable();
    
    const { days = '30', type } = req.query;
    const daysNum = parseInt(days as string) || 30;
    
    let whereClause = '';
    const params: any[] = [daysNum];
    
    if (type) {
      whereClause = ' AND stat_type = $2';
      params.push(type);
    }
    
    // 获取每日统计
    const dailySql = `
      SELECT stat_date, stat_type, stat_value 
      FROM statistics 
      WHERE stat_date >= CURRENT_DATE - ($1 || ' days')::interval
      ${whereClause}
      ORDER BY stat_date
    `;
    const dailyResult = await query(dailySql, params);
    
    // 获取汇总统计
    const summarySql = `
      SELECT 
        stat_type,
        SUM(stat_value) as total_value,
        AVG(stat_value)::integer as avg_value,
        MAX(stat_value) as max_value
      FROM statistics
      WHERE stat_date >= CURRENT_DATE - ($1 || ' days')::interval
      ${whereClause}
      GROUP BY stat_type
    `;
    const summaryResult = await query(summarySql, params);
    
    // 获取总用户数
    const usersResult = await query('SELECT COUNT(*)::integer as total_users FROM users');
    
    // 获取总文章数 (status = 1 表示已发布)
    const postsResult = await query('SELECT COUNT(*)::integer as total_posts FROM posts WHERE status = 1');
    
    // 获取今日新增
    const todayNewUsers = await query('SELECT COUNT(*)::integer as new_users FROM users WHERE created_at::date = CURRENT_DATE');
    const todayNewPosts = await query('SELECT COUNT(*)::integer as new_posts FROM posts WHERE created_at::date = CURRENT_DATE AND status = 1');
    
    const summary: any = {
      total_users: parseInt(usersResult.rows[0]?.total_users || '0'),
      total_posts: parseInt(postsResult.rows[0]?.total_posts || '0'),
      today_new_users: parseInt(todayNewUsers.rows[0]?.new_users || '0'),
      today_new_posts: parseInt(todayNewPosts.rows[0]?.new_posts || '0')
    };
    
    // 处理 type 统计
    if (type) {
      const typeStats = summaryResult.rows.find((r: any) => r.stat_type === type);
      if (typeStats) {
        summary[type] = {
          total: parseInt(typeStats.total_value) || 0,
          avg: parseInt(typeStats.avg_value) || 0,
          max: parseInt(typeStats.max_value) || 0
        };
      }
    } else {
      for (const row of summaryResult.rows) {
        summary[row.stat_type] = {
          total: parseInt(row.total_value) || 0,
          avg: parseInt(row.avg_value) || 0,
          max: parseInt(row.max_value) || 0
        };
      }
    }
    
    res.json({
      success: true,
      data: {
        daily: dailyResult.rows,
        summary,
        period_days: daysNum
      }
    });
  } catch (error: any) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 手动记录统计
router.post('/record', authMiddleware, async (req, res) => {
  try {
    await ensureStatisticsTable();
    
    const { stat_type, stat_value = 1, stat_date } = req.body;
    
    if (!stat_type) {
      return res.status(400).json({ success: false, error: 'stat_type is required' });
    }
    
    const date = stat_date || new Date().toISOString().split('T')[0];
    
    // 使用 upsert 更新或插入
    await query(`
      INSERT INTO statistics (stat_date, stat_type, stat_value)
      VALUES ($1, $2, $3)
      ON CONFLICT (stat_date, stat_type)
      DO UPDATE SET stat_value = statistics.stat_value + $3
    `, [date, stat_type, stat_value]);
    
    res.json({ success: true, message: '统计已记录' });
  } catch (error: any) {
    console.error('记录统计失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
