import { Response, NextFunction } from 'express';
import { getPool } from '../config/database.js';
import { AuthRequest } from './auth';

/**
 * 实名认证门槛中间件（用于资金/会员等敏感"写"操作）
 *
 * 前置：必须先经过 authMiddleware（req.userId 已由登录态解析）。
 * 逻辑：若该用户未通过实名认证（realname_verifications 无 approved 记录），
 *       直接返回 403 + code=REQUIRE_REALNAME，前端据此跳转实名认证页引导。
 */
export async function requireVerified(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: '请先登录', code: 'UNAUTHORIZED' });
    }

    const rows = await getPool().query(
      `SELECT 1 FROM realname_verifications WHERE user_id = $1 AND status = 'approved' LIMIT 1`,
      [userId]
    );

    if (!rows.rows || rows.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: '请先完成实名认证后再进行该操作',
        code: 'REQUIRE_REALNAME',
      });
    }

    next();
  } catch (err) {
    next(err as Error);
  }
}