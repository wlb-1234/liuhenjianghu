import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { getUserByPhone, createUser, getUserById, updateUser } from '../services/userService';
import { authMiddleware, authMiddlewareWithUser, generateToken, AuthRequest } from '../middleware/auth';
import { sendVerificationSMS } from '../services/sms';
import { 
  recordLoginFailure, 
  clearLoginFailure, 
  getLoginFailureCount,
  checkNewDeviceLogin,
  sendNewDeviceLoginNotification,
  sendAccountAbnormalNotification,
  sendPasswordChangeNotification
} from '../services/securityNotificationService';
import { getPool } from '../config/database.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'liuhen-jianghu-secret-key-2024';

// 发送验证码
router.post('/send-code', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: '请输入有效的手机号' });
    }
    
    // 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 使用短信服务发送验证码
    const success = await sendVerificationSMS(phone, code);
    
    if (!success) {
      return res.status(500).json({ error: '验证码发送失败，请稍后重试' });
    }
    
    // 开发环境下返回验证码用于测试，生产环境不返回
    const isDev = process.env.NODE_ENV !== 'production';
    
    res.json({ 
      success: true, 
      message: '验证码已发送',
      ...(isDev && { code })
    });
  } catch (error) {
    console.error('发送验证码错误:', error);
    res.status(500).json({ error: '发送验证码失败' });
  }
});

// 注册
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { phone, code, nickname, password, province_code, city_code, district_code, town_code } = req.body;
    
    // 验证必填字段
    if (!phone || !code || !nickname || !password) {
      return res.status(400).json({ error: '请填写所有必填项' });
    }
    
    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: '手机号格式不正确' });
    }
    
    // 验证昵称长度
    if (nickname.length < 2 || nickname.length > 20) {
      return res.status(400).json({ error: '昵称长度需要在2-20个字符之间' });
    }
    
    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度不能少于6位' });
    }
    
    // 验证验证码（测试环境下跳过）
    if (process.env.NODE_ENV !== 'development') {
      // 实际项目中需要验证验证码
    }
    
    // 检查用户是否已存在
    const existingUser = await getUserByPhone(phone);
    if (existingUser) {
      return res.status(400).json({ error: '该手机号已注册' });
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建用户
    const user = await createUser({
      phone,
      nickname,
      password: hashedPassword,
      province_code,
      city_code,
      district_code,
      town_code
    });
    
    // 生成 token
    const token = generateToken(user.id);
    
    // 返回用户信息和token
    const userInfo = {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      member_level: user.member_level,
      province_code: user.province_code,
      city_code: user.city_code,
      district_code: user.district_code,
      town_code: user.town_code
    };
    
    res.json({ 
      success: true, 
      message: '注册成功',
      token,
      user: userInfo
    });
  } catch (error: any) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '注册失败: ' + (error?.message || error?.code || '未知错误') });
  }
});

// 登录
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;
    const ip = req.ip || req.headers['x-forwarded-ip'] as string || 'unknown';
    const userAgent = req.headers['user-agent'] || '';
    
    if (!phone || !password) {
      return res.status(400).json({ error: '请输入手机号和密码' });
    }
    
    // 查找用户
    const user = await getUserByPhone(phone);
    if (!user) {
      return res.status(401).json({ error: '手机号或密码错误' });
    }
    
    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      // 记录登录失败
      recordLoginFailure(phone, ip);
      const failCount = getLoginFailureCount(phone);
      
      // 超过5次失败，发送账号异常提醒
      if (failCount >= 5 && failCount % 5 === 0) {
        sendAccountAbnormalNotification(user.id, failCount, ip);
      }
      
      return res.status(401).json({ error: '手机号或密码错误' });
    }
    
    // 登录成功，清除失败记录
    clearLoginFailure(phone);
    
    // 检查是否是新设备登录
    const isNewDevice = await checkNewDeviceLogin(user.id, ip, userAgent);
    if (isNewDevice) {
      // 异步发送新设备登录提醒（不阻塞登录）
      sendNewDeviceLoginNotification(user.id, ip, userAgent);
    }
    
    // 生成 token
    const token = generateToken(user.id);
    
    // 返回用户信息
    const userInfo = {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      member_level: user.member_level,
      province_code: user.province_code,
      city_code: user.city_code,
      district_code: user.district_code,
      town_code: user.town_code,
      today_post_count: user.today_post_count,
      total_likes: user.total_likes,
      total_posts: user.total_posts
    };
    
    res.json({ 
      success: true, 
      message: '登录成功',
      token,
      user: userInfo
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// 获取当前用户信息
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await getUserById(req.userId!);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const userInfo = {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      member_level: user.member_level,
      member_expire_at: user.member_expire_at,
      province_code: user.province_code,
      city_code: user.city_code,
      district_code: user.district_code,
      town_code: user.town_code,
      today_post_count: user.today_post_count,
      total_likes: user.total_likes,
      total_posts: user.total_posts,
      created_at: user.created_at
    };
    
    res.json({ user: userInfo });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// 更新用户信息
router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { nickname, avatar, province_code, city_code, district_code, town_code } = req.body;
    
    const updates: Record<string, any> = {};
    if (nickname) updates.nickname = nickname;
    if (avatar) updates.avatar = avatar;
    if (province_code) updates.province_code = province_code;
    if (city_code) updates.city_code = city_code;
    if (district_code) updates.district_code = district_code;
    if (town_code) updates.town_code = town_code;
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: '没有需要更新的字段' });
    }
    
    const user = await updateUser(req.userId!, updates);
    
    res.json({ 
      success: true,
      message: '更新成功',
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        member_level: user.member_level,
        province_code: user.province_code,
        city_code: user.city_code,
        district_code: user.district_code,
        town_code: user.town_code
      }
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

// 修改密码
router.put('/password', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: '请输入原密码和新密码' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: '新密码长度不能少于6位' });
    }
    
    // 获取用户信息
    const user = await getUserById(req.userId!);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 验证原密码
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: '原密码错误' });
    }
    
    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // 更新密码
    const pool = getPool();
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, req.userId]
    );
    
    // 发送密码修改通知
    sendPasswordChangeNotification(req.userId!);
    
    res.json({ 
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({ error: '修改密码失败' });
  }
});

// 忘记密码 - 通过手机验证码重置密码
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { phone, code, newPassword } = req.body;

    if (!phone || !code || !newPassword) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: '手机号格式不正确' });
    }

    if (code.length !== 6) {
      return res.status(400).json({ error: '验证码为6位数字' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: '新密码长度不能少于6位' });
    }

    // 验证短信验证码
    const pool = getPool();
    const codeResult = await pool.query(
      `SELECT * FROM verification_codes 
       WHERE phone = $1 AND code = $2 AND is_used = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [phone, code]
    );

    if (codeResult.rows.length === 0) {
      return res.status(400).json({ error: '验证码无效或已过期' });
    }

    // 标记验证码已使用
    await pool.query(
      'UPDATE verification_codes SET is_used = true WHERE id = $1',
      [codeResult.rows[0].id]
    );

    // 查找用户
    const userResult = await pool.query(
      'SELECT id FROM users WHERE phone = $1',
      [phone]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: '该手机号未注册' });
    }

    const userId = userResult.rows[0].id;

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    // 发送密码修改通知
    sendPasswordChangeNotification(userId);

    res.json({ 
      success: true,
      message: '密码重置成功'
    });
  } catch (error) {
    console.error('忘记密码错误:', error);
    res.status(500).json({ error: '密码重置失败' });
  }
});

export default router;
