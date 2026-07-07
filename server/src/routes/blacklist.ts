import { Router } from 'express';
import { getPool } from '../config/database.js';
import { sendViolationNotification } from '../services/securityNotificationService';

const router = Router();

/**
 * 获取黑名单列表
 * GET /api/v1/blacklist
 */
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT id, user_id, blocked_user_id, reason, created_at, expires_at, is_active
      FROM blacklist
      ORDER BY created_at DESC
      LIMIT 100
    `);
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('[Blacklist] Get error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 添加用户到黑名单
 * POST /api/v1/blacklist
 */
router.post('/', async (req, res) => {
  try {
    const pool = getPool();
    const { userId, blockedUserId, reason, days } = req.body;

    if (!blockedUserId) {
      return res.status(400).json({ success: false, error: 'blockedUserId is required' });
    }

    const expiresAt = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;

    await pool.query(`
      INSERT INTO blacklist (user_id, blocked_user_id, reason, expires_at, is_active)
      VALUES ($1, $2, $3, $4, true)
    `, [userId || 'admin', blockedUserId, reason || '', expiresAt]);

    // 发送违规通知给被封禁的用户
    if (blockedUserId) {
      const action = days ? 'ban' : 'warning';
      sendViolationNotification(
        parseInt(blockedUserId), 
        reason || '违反社区规范', 
        action
      );
    }

    res.json({ success: true, message: 'User added to blacklist' });
  } catch (error) {
    console.error('[Blacklist] Add error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 解除黑名单
 * DELETE /api/v1/blacklist/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('DELETE FROM blacklist WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'User removed from blacklist' });
  } catch (error) {
    console.error('[Blacklist] Remove error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 检查用户是否在黑名单
 * GET /api/v1/blacklist/check/:userId
 */
router.get('/check/:userId', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT * FROM blacklist 
      WHERE blocked_user_id = $1 AND is_active = true 
      AND (expires_at IS NULL OR expires_at > NOW())
    `, [req.params.userId]);

    const rows = result.rows;
    res.json({ 
      success: true, 
      isBlocked: rows.length > 0,
      blocked: rows.length > 0 ? rows[0] : null
    });
  } catch (error: any) {
    console.error('[Blacklist] Check error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
