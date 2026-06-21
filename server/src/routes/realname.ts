import { Router, Request, Response } from 'express';
import { getPool } from '../config/database.js';
import { optionalAuth } from '../middleware/auth';
import { verifyAdmin } from '../middleware/admin';

const router = Router();

// 初始化表结构
router.get('/init-table', async (req: Request, res: Response) => {
  try {
    await getPool().query(`
      CREATE TABLE IF NOT EXISTS realname_verifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        real_name VARCHAR(50) NOT NULL,
        id_card VARCHAR(18) NOT NULL,
        id_card_front TEXT,
        id_card_back TEXT,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        reject_reason TEXT,
        reviewed_at TIMESTAMP,
        reviewed_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    res.json({ success: true, message: '表创建成功' });
  } catch (error) {
    res.status(500).json({ error: '创建表失败' });
  }
});

/**
 * 服务端文件：server/src/routes/realname.ts
 * 接口：GET /api/v1/realname/status
 * 说明：获取当前用户实名认证状态
 */
router.get('/status', optionalAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.json({ verified: false, status: null });
    }

    const result = await getPool().query(
      'SELECT status, real_name, reject_reason FROM realname_verifications WHERE user_id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json({ verified: false, status: null });
    }

    const verification = result.rows[0];
    return res.json({
      verified: verification.status === 'approved',
      status: verification.status,
      real_name: verification.real_name ? verification.real_name.charAt(0) + '***' : null,
      reject_reason: verification.reject_reason,
    });
  } catch (error: any) {
    console.error('获取实名认证状态失败:', error);
    return res.status(500).json({ error: '获取认证状态失败' });
  }
});

/**
 * 服务端文件：server/src/routes/realname.ts
 * 接口：POST /api/v1/realname
 * Body 参数：realName: string, idCard: string, idCardFront?: string, idCardBack?: string
 * 说明：提交实名认证申请
 */
router.post('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '请先登录' });
    }

    const { realName, idCard, idCardFront, idCardBack } = req.body;

    if (!realName || !idCard) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    // 简单验证身份证格式
    if (!/^\d{17}[\dXx]$/.test(idCard)) {
      return res.status(400).json({ error: '身份证格式不正确' });
    }

    // 检查是否有待审核或已通过的申请
    const existing = await getPool().query(
      'SELECT status FROM realname_verifications WHERE user_id = $1',
      [req.user.id]
    );

    if (existing.rows.length > 0) {
      const currentStatus = existing.rows[0].status;
      if (currentStatus === 'pending') {
        return res.status(400).json({ error: '您有待审核的申请，请等待审核结果' });
      }
      if (currentStatus === 'approved') {
        return res.status(400).json({ error: '您已完成实名认证' });
      }
    }

    // 插入或更新认证申请
    await getPool().query(
      `INSERT INTO realname_verifications (user_id, real_name, id_card, id_card_front, id_card_back, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       ON CONFLICT (user_id) 
       DO UPDATE SET real_name = $2, id_card = $3, id_card_front = $4, id_card_back = $5, 
                     status = 'pending', reject_reason = NULL, reviewed_at = NULL, reviewed_by = NULL`,
      [req.user.id, realName, idCard, idCardFront || null, idCardBack || null]
    );

    return res.json({ success: true, message: '提交成功，请等待审核' });
  } catch (error: any) {
    console.error('提交实名认证失败:', error);
    return res.status(500).json({ error: '提交失败，请稍后重试' });
  }
});

/**
 * 服务端文件：server/src/routes/realname.ts
 * 接口：GET /api/v1/realname/admin/list
 * 说明：管理后台获取认证列表
 */
router.get('/admin/list', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const status = req.query.status as string;
    const offset = (page - 1) * pageSize;

    let whereClause = '';
    const params: any[] = [];
    
    if (status) {
      params.push(status);
      whereClause = `WHERE rv.status = $${params.length}`;
    }

    const countResult = await getPool().query(
      `SELECT COUNT(*) FROM realname_verifications rv ${whereClause}`,
      params
    );

    params.push(pageSize, offset);
    const result = await getPool().query(
      `SELECT rv.*, u.nickname, u.avatar 
       FROM realname_verifications rv 
       LEFT JOIN users u ON rv.user_id = u.id 
       ${whereClause}
       ORDER BY rv.created_at DESC 
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.json({
      list: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      pageSize,
    });
  } catch (error: any) {
    console.error('获取认证列表失败:', error);
    return res.status(500).json({ error: '获取列表失败' });
  }
});

/**
 * 服务端文件：server/src/routes/realname.ts
 * 接口：PUT /api/v1/realname/admin/:id/review
 * Body 参数：status: 'approved' | 'rejected', rejectReason?: string
 * 说明：管理后台审核认证申请
 */
router.put('/admin/:id/review', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: '状态参数错误' });
    }

    const result = await getPool().query(
      `UPDATE realname_verifications 
       SET status = $1, reject_reason = $2, reviewed_at = NOW(), reviewed_by = $3
       WHERE id = $4
       RETURNING *`,
      [status, rejectReason || null, req.adminId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '认证申请不存在' });
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error('审核认证申请失败:', error);
    return res.status(500).json({ error: '审核失败' });
  }
});

export default router;
