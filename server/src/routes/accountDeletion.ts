import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getPool } from '../config/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 验证 schemas
const accountDeletionSchema = z.object({
  password: z.string().min(6, '密码至少6位'),
  confirmText: z.string(),
});

const adminDeleteSchema = z.object({
  userId: z.number().positive(),
  reason: z.string().optional(),
});

// 验证 CSRF token（POST 请求需要）
const validateCsrf = async (req: Request, res: Response): Promise<boolean> => {
  // CSRF 保护由全局中间件处理，这里只做简单检查
  return true;
};

// 用户注销账户
router.post('/delete', authMiddlewareWithUser, async (req: Request, res: Response) => {
  try {
    // 验证请求体
    const parseResult = accountDeletionSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: '请求参数错误',
        details: parseResult.error.issues,
      });
      return;
    }

    const { password, confirmText } = parseResult.data;
    const userId = req.userId;

    // 确认文本必须包含 "注销"
    if (!confirmText.includes('注销')) {
      res.status(400).json({
        success: false,
        error: '请输入"注销"以确认操作',
      });
      return;
    }

    // 验证密码
    const pool = getPool();
    const [userResult] = await pool.query(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );
    
    if (!Array.isArray(userResult) || userResult.length === 0) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
      });
      return;
    }

    const user = userResult[0] as { password?: string };
    
    // 验证密码（支持新旧格式）
    let isValidPassword = false;
    if (user.password) {
      if (user.password.startsWith('$2')) {
        // bcrypt 格式
        const bcrypt = await import('bcryptjs');
        isValidPassword = bcrypt.compareSync(password, user.password);
      } else if (user.password.length === 64) {
        // SHA256 格式（旧）
        const crypto = await import('crypto');
        const hash = crypto.createHash('sha256').update(password).digest('hex');
        isValidPassword = hash === user.password;
      }
    }

    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: '密码错误',
      });
      return;
    }

    // 执行账户注销（软删除：更新状态）
    await pool.query(
      'UPDATE users SET status = ?, deleted_at = NOW() WHERE id = ?',
      ['deleted', userId]
    );

    // 清除相关会话（如果有的话）

    res.json({
      success: true,
      message: '账户已注销',
    });
  } catch (error: any) {
    console.error('账户注销错误:', error);
    res.status(500).json({
      success: false,
      error: '注销失败',
    });
  }
});

// 用户注销预览（查看将被删除的内容）
router.get('/preview', authMiddlewareWithUser, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const pool = getPool();

    // 获取用户发帖数
    const [postResult] = await pool.query(
      'SELECT COUNT(*) as count FROM posts WHERE user_id = ?',
      [userId]
    );

    // 获取用户评论数
    const [commentResult] = await pool.query(
      'SELECT COUNT(*) as count FROM comments WHERE user_id = ?',
      [userId]
    );

    // 获取用户点赞数
    const [likeResult] = await pool.query(
      'SELECT COUNT(*) as count FROM likes WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      data: {
        posts: (postResult as any)[0]?.count || 0,
        comments: (commentResult as any)[0]?.count || 0,
        likes: (likeResult as any)[0]?.count || 0,
      },
    });
  } catch (error: any) {
    console.error('预览错误:', error);
    res.status(500).json({
      success: false,
      error: '获取预览失败',
    });
  }
});

// 管理员强制注销用户（需要管理员权限）
router.post('/admin/delete', authMiddlewareWithUser, async (req: Request, res: Response) => {
  try {
    // 验证是否为管理员
    if (req.user!.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: '需要管理员权限',
      });
      return;
    }

    const parseResult = adminDeleteSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: '请求参数错误',
      });
      return;
    }

    const { userId, reason } = parseResult.data;
    const pool = getPool();

    // 检查用户是否存在
    const [userResult] = await pool.query(
      'SELECT id, status FROM users WHERE id = ?',
      [userId]
    );

    if (!Array.isArray(userResult) || userResult.length === 0) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
      });
      return;
    }

    // 执行软删除
    await pool.query(
      'UPDATE users SET status = ?, deleted_at = NOW() WHERE id = ?',
      ['deleted', userId]
    );

    res.json({
      success: true,
      message: '用户已注销',
    });
  } catch (error: any) {
    console.error('管理员注销错误:', error);
    res.status(500).json({
      success: false,
      error: '操作失败',
    });
  }
});

export default router;
