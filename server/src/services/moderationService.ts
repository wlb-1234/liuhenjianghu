/**
 * 内容审核服务
 * 支持文本审核、举报管理、自动封禁
 */
import { query, transaction } from "../config/database"
import { ReportReason, checkText, containsSensitiveWord, findSensitiveWords } from "./sensitiveWordService"

// 举报类型枚举
export enum ReportType {
  POST = 'post',
  COMMENT = 'comment',
  USER = 'user'
}

// 举报状态枚举
export enum ReportStatus {
  PENDING = 'pending',   // 待处理
  RESOLVED = 'resolved', // 已处理
  DISMISSED = 'dismissed' // 已驳回
}

// 封禁类型
export enum BanType {
  WARNING = 'warning',   // 警告
  TEMPORARY = 'temporary', // 临时封禁
  PERMANENT = 'permanent'  // 永久封禁
}

// 审核结果
export interface ModerationResult {
  passed: boolean
  reason?: string
  matchedWords?: string[]
  action?: 'allow' | 'review' | 'reject'
}

// 举报记录
export interface ReportRecord {
  id: number
  reporter_id: number
  target_type: ReportType
  target_id: number
  reason: ReportReason
  description?: string
  status: ReportStatus
  handler_id?: number
  handler_note?: string
  created_at: Date
  handled_at?: Date
}

// 封禁记录
export interface BanRecord {
  id: number
  user_id: number
  type: BanType
  reason: string
  start_date: Date
  end_date?: Date
  content_id?: number
  content_type?: string
  created_by: number
  is_active: boolean
  created_at: Date
}

/**
 * 文本内容审核
 */
export async function moderateText(
  text: string,
  userId?: number
): Promise<ModerationResult> {
  // 检查敏感词
  const sensitiveCheck = checkText(text)
  
  if (sensitiveCheck.blocked) {
    return {
      passed: false,
      reason: '包含敏感词',
      matchedWords: sensitiveCheck.matchedWords,
      action: 'reject'
    }
  }
  
  if (sensitiveCheck.needsReview) {
    return {
      passed: true,
      reason: '可能包含敏感内容，需人工审核',
      matchedWords: sensitiveCheck.matchedWords,
      action: 'review'
    }
  }
  
  return {
    passed: true,
    action: 'allow'
  }
}

/**
 * 创建举报
 */
export async function createReport(
  reporterId: number,
  targetType: ReportType,
  targetId: number,
  reason: ReportReason,
  description?: string
): Promise<{ success: boolean; reportId?: number; error?: string }> {
  try {
    // 检查是否已存在相同举报
    const existing = await query(
      `SELECT id FROM reports 
       WHERE reporter_id = $1 AND target_type = $2 AND target_id = $3 AND status = 'pending'`,
      [reporterId, targetType, targetId]
    )
    
    if (existing.rows.length > 0) {
      return { success: false, error: '您已举报过该内容，请等待处理' }
    }
    
    // 创建举报
    const result = await query(
      `INSERT INTO reports (reporter_id, target_type, target_id, reason, description, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id`,
      [reporterId, targetType, targetId, reason, description || null]
    )
    
    return { success: true, reportId: result.rows[0].id }
  } catch (error: any) {
    console.error('创建举报失败:', error.message)
    return { success: false, error: '创建举报失败' }
  }
}

/**
 * 获取举报列表（管理员）
 */
export async function getReports(options: {
  status?: ReportStatus
  limit?: number
  offset?: number
}): Promise<{ reports: ReportRecord[]; total: number }> {
  const { status, limit = 20, offset = 0 } = options
  
  let whereClause = ''
  const params: any[] = []
  
  if (status) {
    whereClause = 'WHERE r.status = $1'
    params.push(status)
  }
  
  const countResult = await query(
    `SELECT COUNT(*) as total FROM reports r ${whereClause}`,
    params
  )
  
  const orderBy = 'ORDER BY r.created_at DESC'
  const limitOffset = `LIMIT ${limit} OFFSET ${offset}`
  
  let queryStr: string
  if (status) {
    queryStr = `
      SELECT r.*, 
             u1.nickname as reporter_nickname,
             u2.nickname as target_user_nickname,
             a.username as handler_username
      FROM reports r
      LEFT JOIN users u1 ON r.reporter_id = u1.id
      LEFT JOIN users u2 ON r.target_user_id = u2.id
      LEFT JOIN admins a ON r.handler_id = a.id
      ${whereClause}
      ${orderBy}
      ${limitOffset}
    `
  } else {
    queryStr = `
      SELECT r.*, 
             u1.nickname as reporter_nickname,
             u2.nickname as target_user_nickname,
             a.username as handler_username
      FROM reports r
      LEFT JOIN users u1 ON r.reporter_id = u1.id
      LEFT JOIN users u2 ON r.target_user_id = u2.id
      LEFT JOIN admins a ON r.handler_id = a.id
      ${orderBy}
      ${limitOffset}
    `
  }
  
  const result = await query(queryStr, params)
  
  return {
    reports: result.rows,
    total: parseInt(countResult.rows[0].total)
  }
}

/**
 * 处理举报
 */
export async function handleReport(
  reportId: number,
  handlerId: number,
  action: 'resolve' | 'dismiss',
  note?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const status = action === 'resolve' ? ReportStatus.RESOLVED : ReportStatus.DISMISSED
    
    await query(
      `UPDATE reports 
       SET status = $1, handler_id = $2, handler_note = $3, handled_at = NOW()
       WHERE id = $4`,
      [status, handlerId, note || null, reportId]
    )
    
    return { success: true }
  } catch (error: any) {
    console.error('处理举报失败:', error.message)
    return { success: false, error: '处理举报失败' }
  }
}

/**
 * 检查用户是否被封禁
 */
export async function checkUserBan(userId: number): Promise<{
  banned: boolean
  type?: BanType
  reason?: string
  endDate?: Date
}> {
  const result = await query(
    `SELECT type, reason, end_date 
     FROM user_bans 
     WHERE user_id = $1 AND is_active = true 
       AND (end_date IS NULL OR end_date > NOW())
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  )
  
  if (result.rows.length > 0) {
    return {
      banned: true,
      type: result.rows[0].type,
      reason: result.rows[0].reason,
      endDate: result.rows[0].end_date
    }
  }
  
  return { banned: false }
}

/**
 * 封禁用户
 */
export async function banUser(
  userId: number,
  type: BanType,
  reason: string,
  endDate?: Date,
  createdBy: number,
  contentId?: number,
  contentType?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 先解除之前的封禁
    await query(
      'UPDATE user_bans SET is_active = false WHERE user_id = $1 AND is_active = true',
      [userId]
    )
    
    // 创建新封禁
    await query(
      `INSERT INTO user_bans 
       (user_id, type, reason, start_date, end_date, content_id, content_type, created_by, is_active)
       VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, true)`,
      [userId, type, reason, endDate || null, contentId || null, contentType || null, createdBy]
    )
    
    return { success: true }
  } catch (error: any) {
    console.error('封禁用户失败:', error.message)
    return { success: false, error: '封禁用户失败' }
  }
}

/**
 * 解封用户
 */
export async function unbanUser(
  userId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await query(
      'UPDATE user_bans SET is_active = false WHERE user_id = $1',
      [userId]
    )
    return { success: true }
  } catch (error: any) {
    console.error('解封用户失败:', error.message)
    return { success: false, error: '解封用户失败' }
  }
}

/**
 * 自动封禁检查（根据违规次数）
 */
export async function checkAutoBan(userId: number): Promise<{
  shouldBan: boolean
  type?: BanType
  reason?: string
}> {
  // 获取用户最近的违规记录
  const result = await query(
    `SELECT COUNT(*) as count 
     FROM user_violations 
     WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'`,
    [userId]
  )
  
  const violationCount = parseInt(result.rows[0].count)
  
  if (violationCount >= 10) {
    return {
      shouldBan: true,
      type: BanType.PERMANENT,
      reason: '30天内违规超过10次，永久封禁'
    }
  } else if (violationCount >= 5) {
    return {
      shouldBan: true,
      type: BanType.TEMPORARY,
      reason: '30天内违规超过5次，临时封禁7天'
    }
  } else if (violationCount >= 3) {
    return {
      shouldBan: true,
      type: BanType.WARNING,
      reason: '30天内违规超过3次，警告'
    }
  }
  
  return { shouldBan: false }
}

/**
 * 记录用户违规
 */
export async function recordViolation(
  userId: number,
  reason: string,
  contentId?: number,
  contentType?: string
): Promise<{ success: boolean }> {
  try {
    await query(
      `INSERT INTO user_violations (user_id, reason, content_id, content_type)
       VALUES ($1, $2, $3, $4)`,
      [userId, reason, contentId || null, contentType || null]
    )
    return { success: true }
  } catch (error: any) {
    console.error('记录违规失败:', error.message)
    return { success: false }
  }
}

/**
 * 获取用户违规记录
 */
export async function getUserViolations(
  userId: number,
  limit: number = 10
): Promise<any[]> {
  const result = await query(
    `SELECT * FROM user_violations 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2`,
    [userId, limit]
  )
  return result.rows
}

/**
 * 获取封禁列表（管理员）
 */
export async function getBans(options: {
  activeOnly?: boolean
  limit?: number
  offset?: number
}): Promise<{ bans: BanRecord[]; total: number }> {
  const { activeOnly = false, limit = 20, offset = 0 } = options
  
  let whereClause = ''
  const params: any[] = []
  
  if (activeOnly) {
    whereClause = 'WHERE b.is_active = true AND (b.end_date IS NULL OR b.end_date > NOW())'
  }
  
  const countResult = await query(
    `SELECT COUNT(*) as total FROM user_bans b ${whereClause}`,
    params
  )
  
  const result = await query(
    `SELECT b.*, u.nickname as user_nickname, u.phone as user_phone, a.username as creator_username
     FROM user_bans b
     LEFT JOIN users u ON b.user_id = u.id
     LEFT JOIN admins a ON b.created_by = a.id
     ${whereClause}
     ORDER BY b.created_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  )
  
  return {
    bans: result.rows,
    total: parseInt(countResult.rows[0].total)
  }
}
