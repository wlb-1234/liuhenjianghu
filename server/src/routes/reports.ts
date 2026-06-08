/**
 * 举报相关 API 路由
 */
import { Router } from "express"
import jwt from 'jsonwebtoken'
import { Pool } from 'pg'

const router = Router()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function query(text: string, params?: any[]) {
  const result = await pool.query(text, params)
  return result
}

// 举报类型
const REPORT_TYPES = {
  POST: 'post',
  COMMENT: 'comment',
  USER: 'user',
}

// 举报原因
const REPORT_REASONS = {
  SENSITIVE_CONTENT: 'sensitive_content',
  SPAM: 'spam',
  MALICIOUS: 'malicious',
  HARASSMENT: 'harassment',
  FALSE_INFO: 'false_info',
  PIRACY: 'piracy',
  OTHER: 'other',
}

// 验证用户身份
async function verifyUser(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' })
  }
  const token = authHeader.split(' ')[1]
  try {
    const jwt_secret = process.env.JWT_SECRET || 'liuhen-jianghu-secret-key-2024'
    const decoded = jwt.verify(token, jwt_secret)
    req.userId = decoded.userId || decoded.adminId
    req.user = decoded
    next()
  } catch (e: any) {
    return res.status(401).json({ error: '登录已过期' })
  }
}

/**
 * 提交举报
 */
router.post('/', verifyUser, async (req: any, res: any) => {
  try {
    const { type, targetId, reason, description } = req.body

    if (!type || !targetId || !reason) {
      return res.status(400).json({ error: '缺少必填参数' })
    }

    if (!Object.values(REPORT_TYPES).includes(type)) {
      return res.status(400).json({ error: '无效的举报类型' })
    }

    // 检查用户是否被封禁
    const banCheck = await checkUserBan(req.userId)
    if (banCheck.banned) {
      return res.status(403).json({ 
        error: '账号已被封禁',
        banInfo: banCheck
      })
    }

    // 创建举报记录
    const result = await query(
      `INSERT INTO reports (type, target_id, reporter_id, reason, description, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [type, targetId, req.userId, reason, description || '']
    )

    res.json({
      success: true,
      report: result.rows[0]
    })
  } catch (error: any) {
    console.error('提交举报错误:', error)
    res.status(500).json({ error: '提交举报失败' })
  }
})

/**
 * 获取我的举报列表
 */
router.get('/my', verifyUser, async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const offset = (page - 1) * limit

    const countResult = await query(
      'SELECT COUNT(*) as total FROM reports WHERE reporter_id = $1',
      [req.userId]
    )

    const reports = await query(
      `SELECT r.*, 
              CASE 
                WHEN r.type = 'post' THEN p.content
                WHEN r.type = 'comment' THEN c.content
                WHEN r.type = 'user' THEN u.nickname
                ELSE ''
              END as target_content
       FROM reports r
       LEFT JOIN posts p ON r.type = 'post' AND r.target_id = p.id
       LEFT JOIN comments c ON r.type = 'comment' AND r.target_id = c.id
       LEFT JOIN users u ON r.type = 'user' AND r.target_id = u.id
       WHERE r.reporter_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.userId, limit, offset]
    )

    res.json({
      reports: reports.rows,
      total: parseInt(countResult.rows[0].total),
      page,
      limit
    })
  } catch (error: any) {
    console.error('获取举报列表错误:', error)
    res.status(500).json({ error: '获取举报列表失败' })
  }
})

/**
 * 管理员：获取所有举报列表
 */
router.get('/admin/list', async (req: any, res: any) => {
  try {
    // 验证管理员身份
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未登录' })
    }
    const token = authHeader.split(' ')[1]
    const jwt_secret = process.env.JWT_SECRET || 'liuhen-jianghu-secret-key-2024'
    const decoded = jwt.verify(token, jwt_secret)
    if (!decoded.adminId) {
      return res.status(403).json({ error: '需要管理员权限' })
    }

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const offset = (page - 1) * limit
    const status = req.query.status || 'pending'

    let whereClause = ''
    const params: any[] = []

    if (status !== 'all') {
      whereClause = 'WHERE r.status = $1'
      params.push(status)
    }

    const countResult = await query(
      `SELECT COUNT(*) as total FROM reports r ${whereClause}`,
      params
    )

    params.push(limit, offset)
    const reports = await query(
      `SELECT r.*,
              reporter.nickname as reporter_nickname,
              reporter.phone as reporter_phone,
              CASE 
                WHEN r.type = 'post' THEN p.content
                WHEN r.type = 'comment' THEN c.content
                WHEN r.type = 'user' THEN u.nickname
                ELSE ''
              END as target_content,
              CASE 
                WHEN r.type = 'post' THEN p.user_id
                WHEN r.type = 'comment' THEN c.user_id
                ELSE NULL
              END as target_user_id,
              target_user.nickname as target_user_nickname
       FROM reports r
       LEFT JOIN users reporter ON r.reporter_id = reporter.id
       LEFT JOIN posts p ON r.type = 'post' AND r.target_id = p.id
       LEFT JOIN comments c ON r.type = 'comment' AND r.target_id = c.id
       LEFT JOIN users u ON r.type = 'user' AND r.target_id = u.id
       LEFT JOIN users target_user ON (
         (r.type = 'post' AND target_user.id = p.user_id) OR
         (r.type = 'comment' AND target_user.id = c.user_id) OR
         (r.type = 'user' AND target_user.id = r.target_id)
       )
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    )

    res.json({
      reports: reports.rows,
      total: parseInt(countResult.rows[0].total),
      page,
      limit
    })
  } catch (error: any) {
    console.error('获取举报列表错误:', error)
    res.status(500).json({ error: '获取举报列表失败' })
  }
})

/**
 * 管理员：处理举报
 */
router.post('/admin/handle/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params
    const { action, reason, banDays } = req.body

    // 验证管理员身份
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未登录' })
    }
    const token = authHeader.split(' ')[1]
    const jwt_secret = process.env.JWT_SECRET || 'liuhen-jianghu-secret-key-2024'
    const decoded = jwt.verify(token, jwt_secret)
    if (!decoded.adminId) {
      return res.status(403).json({ error: '需要管理员权限' })
    }

    // 获取举报详情
    const reportResult = await query('SELECT * FROM reports WHERE id = $1', [id])
    if (reportResult.rows.length === 0) {
      return res.status(404).json({ error: '举报不存在' })
    }

    const report = reportResult.rows[0]
    let actionTaken = ''
    let targetUserId: number | null = null

    // 根据处理动作执行相应操作
    switch (action) {
      case 'dismiss':
        await query(
          'UPDATE reports SET status = $1, handled_by = $2, handled_at = NOW() WHERE id = $3',
          ['dismissed', decoded.adminId, id]
        )
        actionTaken = 'dismissed'
        break

      case 'warn':
        if (report.type === 'post' || report.type === 'comment' || report.type === 'user') {
          targetUserId = report.type === 'user' ? report.target_id : 
            (await query(`SELECT user_id FROM ${report.type === 'post' ? 'posts' : 'comments'} WHERE id = $1`, [report.target_id])).rows[0]?.user_id
          
          if (targetUserId) {
            await autoPunishUser(targetUserId, 'warn', `因举报：${reason || '违反社区规则'}`)
            actionTaken = 'warned'
          }
        }
        await query(
          'UPDATE reports SET status = $1, handled_by = $2, handled_at = NOW(), result = $3 WHERE id = $4',
          ['handled', decoded.adminId, `警告用户`, id]
        )
        break

      case 'delete':
        if (report.type === 'post') {
          await query('UPDATE posts SET status = $1 WHERE id = $2', [0, report.target_id])
          actionTaken = 'post_deleted'
        } else if (report.type === 'comment') {
          await query('UPDATE comments SET status = $1 WHERE id = $2', [0, report.target_id])
          actionTaken = 'comment_deleted'
        }
        await query(
          'UPDATE reports SET status = $1, handled_by = $2, handled_at = NOW(), result = $3 WHERE id = $4',
          ['handled', decoded.adminId, actionTaken, id]
        )
        break

      case 'ban':
        if (report.type === 'post' || report.type === 'comment' || report.type === 'user') {
          targetUserId = report.type === 'user' ? report.target_id : 
            (await query(`SELECT user_id FROM ${report.type === 'post' ? 'posts' : 'comments'} WHERE id = $1`, [report.target_id])).rows[0]?.user_id
          
          if (targetUserId) {
            const banDuration = banDays || 30
            await autoPunishUser(targetUserId, 'ban', `因举报：${reason || '严重违规'}`, banDuration)
            actionTaken = 'user_banned'
          }
        }
        await query(
          'UPDATE reports SET status = $1, handled_by = $2, handled_at = NOW(), result = $3 WHERE id = $4',
          ['handled', decoded.adminId, `封禁${banDays || 30}天`, id]
        )
        break

      default:
        return res.status(400).json({ error: '无效的处理动作' })
    }

    res.json({
      success: true,
      action: actionTaken,
      message: '处理成功'
    })
  } catch (error: any) {
    console.error('处理举报错误:', error)
    res.status(500).json({ error: '处理举报失败' })
  }
})

/**
 * 管理员：获取举报统计
 */
router.get('/admin/stats', async (req: any, res: any) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未登录' })
    }
    const token = authHeader.split(' ')[1]
    const jwt_secret = process.env.JWT_SECRET || 'liuhen-jianghu-secret-key-2024'
    const decoded = jwt.verify(token, jwt_secret)
    if (!decoded.adminId) {
      return res.status(403).json({ error: '需要管理员权限' })
    }

    const stats = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'handled') as handled,
        COUNT(*) FILTER (WHERE status = 'dismissed') as dismissed,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today,
        COUNT(*) FILTER (WHERE DATE(created_at) >= DATE_TRUNC('week', CURRENT_DATE)) as this_week
      FROM reports
    `)

    const byType = await query(`
      SELECT type, COUNT(*) as count
      FROM reports
      WHERE DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY type
    `)

    const byReason = await query(`
      SELECT reason, COUNT(*) as count
      FROM reports
      WHERE DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY reason
    `)

    res.json({
      total: parseInt(stats.rows[0].total),
      pending: parseInt(stats.rows[0].pending),
      handled: parseInt(stats.rows[0].handled),
      dismissed: parseInt(stats.rows[0].dismissed),
      today: parseInt(stats.rows[0].today),
      thisWeek: parseInt(stats.rows[0].this_week),
      byType: byType.rows,
      byReason: byReason.rows
    })
  } catch (error: any) {
    console.error('获取举报统计错误:', error)
    res.status(500).json({ error: '获取举报统计失败' })
  }
})

export default router
