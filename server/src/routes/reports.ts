import express from 'express';
import { getPool } from '../config/database.js';

const router = express.Router();

// 获取举报类型列表
router.get('/types', (req, res) => {
  const types = [
    { id: 'spam', name: '垃圾广告', icon: '📢' },
    { id: 'porn', name: '色情低俗', icon: '🔞' },
    { id: 'violence', name: '暴力血腥', icon: '🔪' },
    { id: 'fraud', name: '诈骗欺诈', icon: '💰' },
    { id: 'privacy', name: '隐私泄露', icon: '🔒' },
    { id: 'politics', name: '政治敏感', icon: '⚠️' },
    { id: 'other', name: '其他违规', icon: '❓' }
  ];
  res.json({ success: true, data: types });
});

// 提交举报
router.post('/', async (req, res) => {
  try {
    const { contentId, contentType, reportType, reason, reporterId } = req.body;
    
    if (!contentId || !contentType || !reportType) {
      return res.status(400).json({ success: false, error: '缺少必要参数' });
    }

    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO reports (content_id, content_type, report_type, reason, reporter_id, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
       RETURNING *`,
      [contentId, contentType, reportType, reason || '', reporterId || null]
    );

    res.json({ 
      success: true, 
      message: '举报已提交，感谢您的反馈',
      data: result.rows[0] 
    });
  } catch (error) {
    console.error('提交举报失败:', error);
    res.status(500).json({ success: false, error: '提交举报失败' });
  }
});

// 获取举报列表（后台管理）
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;
    
    const pool = getPool();
    
    let whereClause = '';
    const params = [];
    
    if (status && status !== 'all') {
      params.push(status);
      whereClause = `WHERE status = $${params.length}`;
    }
    
    // 获取总数
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM reports ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);
    
    // 获取列表
    params.push(pageSize, offset);
    const result = await pool.query(
      `SELECT r.*, 
              u1.nickname as reporter_nickname,
              u2.nickname as content_owner_nickname
       FROM reports r
       LEFT JOIN users u1 ON r.reporter_id = u1.id
       LEFT JOIN users u2 ON r.content_id = u2.id AND r.content_type = 'user'
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    
    res.json({
      success: true,
      data: {
        list: result.rows,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取举报列表失败:', error);
    res.status(500).json({ success: false, error: '获取举报列表失败' });
  }
});

// 获取举报详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    
    const result = await pool.query(
      `SELECT r.*, 
              u1.nickname as reporter_nickname,
              u2.nickname as content_owner_nickname
       FROM reports r
       LEFT JOIN users u1 ON r.reporter_id = u1.id
       LEFT JOIN users u2 ON r.content_id = u2.id AND r.content_type = 'user'
       WHERE r.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: '举报不存在' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('获取举报详情失败:', error);
    res.status(500).json({ success: false, error: '获取举报详情失败' });
  }
});

// 处理举报（后台管理）
router.put('/:id/handle', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, handleNote, handlerId } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: '状态不正确' });
    }
    
    const pool = getPool();
    const result = await pool.query(
      `UPDATE reports 
       SET status = $1, handle_note = $2, handler_id = $3, handled_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, handleNote || '', handlerId || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: '举报不存在' });
    }
    
    res.json({ 
      success: true, 
      message: status === 'approved' ? '举报已采纳，内容已处理' : '举报已驳回',
      data: result.rows[0] 
    });
  } catch (error) {
    console.error('处理举报失败:', error);
    res.status(500).json({ success: false, error: '处理举报失败' });
  }
});

// 举报统计
router.get('/stats/summary', async (req, res) => {
  try {
    const pool = getPool();
    
    // 总举报数
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM reports');
    
    // 待处理数
    const pendingResult = await pool.query(
      "SELECT COUNT(*) as pending FROM reports WHERE status = 'pending'"
    );
    
    // 各类型统计
    const typeResult = await pool.query(
      `SELECT report_type, COUNT(*) as count 
       FROM reports 
       GROUP BY report_type 
       ORDER BY count DESC`
    );
    
    // 今日举报
    const todayResult = await pool.query(
      `SELECT COUNT(*) as today FROM reports 
       WHERE DATE(created_at) = CURRENT_DATE`
    );
    
    res.json({
      success: true,
      data: {
        total: parseInt(totalResult.rows[0].total),
        pending: parseInt(pendingResult.rows[0].pending),
        today: parseInt(todayResult.rows[0].today),
        byType: typeResult.rows
      }
    });
  } catch (error) {
    console.error('获取举报统计失败:', error);
    res.status(500).json({ success: false, error: '获取举报统计失败' });
  }
});

export default router;
