import { Router } from 'express';
import { getPool } from '../config/database.js';

const router = Router();

// 获取操作日志列表
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const { 
      page = 1, 
      limit = 20, 
      action, 
      admin_id, 
      start_date,
      end_date 
    } = req.query;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (action) {
      whereClause += ` AND action = $${paramIndex}`;
      params.push(action);
      paramIndex++;
    }

    if (admin_id) {
      whereClause += ` AND admin_id = $${paramIndex}`;
      params.push(admin_id);
      paramIndex++;
    }

    if (start_date) {
      whereClause += ` AND created_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      whereClause += ` AND created_at <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    const offset = (Number(page) - 1) * Number(limit);
    
    // 查询日志列表
    const logsQuery = `
      SELECT * FROM admin_operation_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(Number(limit), offset);

    const logsResult = await pool.query(logsQuery, params);

    // 查询总数
    const countQuery = `SELECT COUNT(*) FROM admin_operation_logs ${whereClause}`;
    const countResult = await pool.query(countQuery, params.slice(0, -2));

    res.json({
      success: true,
      data: {
        logs: logsResult.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(parseInt(countResult.rows[0].count) / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取操作日志失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取日志详情
router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM admin_operation_logs WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '日志不存在' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('获取日志详情失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取操作类型统计
router.get('/stats/types', async (req, res) => {
  try {
    const pool = getPool();

    const result = await pool.query(`
      SELECT action, COUNT(*) as count 
      FROM admin_operation_logs 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY action 
      ORDER BY count DESC
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('获取操作统计失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 记录操作日志（内部使用）
export async function logAdminAction(
  pool: any,
  adminId: string,
  adminName: string,
  action: string,
  targetType: string,
  targetId: string,
  details: object,
  ipAddress: string
) {
  try {
    await pool.query(`
      INSERT INTO admin_operation_logs 
      (admin_id, admin_name, action, target_type, target_id, details, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [adminId, adminName, action, targetType, targetId, JSON.stringify(details), ipAddress]);
    return true;
  } catch (error) {
    console.error('记录操作日志失败:', error);
    return false;
  }
}

export default router;
