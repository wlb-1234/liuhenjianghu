import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

// 导出数据
router.post('/export', async (req, res) => {
  try {
    const { type = 'all', format = 'json', startDate, endDate } = req.body;
    const result: any = { exportedAt: new Date().toISOString(), type, format };

    if (type === 'all' || type === 'users') {
      const r = await query('SELECT * FROM users');
      result.users = r.rows || [];
    }
    if (type === 'all' || type === 'contents') {
      let sql = 'SELECT * FROM contents WHERE is_deleted = false';
      if (startDate && endDate) sql += ` AND created_at BETWEEN '${startDate}' AND '${endDate}'`;
      const r = await query(sql);
      result.contents = r.rows || [];
    }
    if (type === 'all' || type === 'comments') {
      let sql = 'SELECT * FROM comments WHERE is_deleted = false';
      if (startDate && endDate) sql += ` AND created_at BETWEEN '${startDate}' AND '${endDate}'`;
      const r = await query(sql);
      result.comments = r.rows || [];
    }
    if (type === 'all' || type === 'follows') {
      let sql = 'SELECT * FROM follows';
      if (startDate && endDate) sql += ` WHERE created_at BETWEEN '${startDate}' AND '${endDate}'`;
      const r = await query(sql);
      result.follows = r.rows || [];
    }

    result.summary = {
      usersCount: result.users?.length || 0,
      contentsCount: result.contents?.length || 0,
      commentsCount: result.comments?.length || 0,
      followsCount: result.follows?.length || 0
    };

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=export_${type}_${Date.now()}.csv`);
      return res.send(JSON.stringify(result));
    }

    res.json({ success: true, data: result });

  } catch (error) {
    console.error('数据导出错误:', error);
    res.status(500).json({ error: '导出失败' });
  }
});

// 导出历史
router.get('/export/history', async (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'exp_001', type: 'users', format: 'json', recordCount: 128, exportedAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 'exp_002', type: 'contents', format: 'csv', recordCount: 456, exportedAt: new Date(Date.now() - 172800000).toISOString() }
    ],
    total: 2
  });
});

// 导出用户自己的数据
router.get('/export/my-data', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: '缺少用户ID' });

    const userR = await query('SELECT * FROM users WHERE id = $1', [userId]);
    const contentsR = await query('SELECT * FROM contents WHERE user_id = $1 AND is_deleted = false', [userId]);
    const commentsR = await query('SELECT * FROM comments WHERE user_id = $1 AND is_deleted = false', [userId]);
    const followsR = await query('SELECT * FROM follows WHERE follower_id = $1 OR following_id = $1', [userId]);

    res.json({
      success: true,
      data: {
        exportedAt: new Date().toISOString(),
        user: userR.rows[0],
        contents: contentsR.rows || [],
        comments: commentsR.rows || [],
        follows: followsR.rows || []
      }
    });
  } catch (error) {
    res.status(500).json({ error: '导出失败' });
  }
});

export default router;
