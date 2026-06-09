import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { getUserByPhone, createUser, getUserById, updateUser } from '../services/userService';
import { authMiddleware, authMiddlewareWithUser, generateToken, AuthRequest } from '../middleware/auth';

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
    
    // 实际项目中，这里应该调用短信服务发送验证码
    // 这里简化为直接返回验证码用于测试
    console.log(`验证码 ${code} 已发送至 ${phone}`);
    
    // 始终返回验证码用于测试
    res.json({ 
      success: true, 
      message: '验证码已发送',
      code: code
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
    const password_hash = await bcrypt.hash(password, 10);
    
    // 创建用户
    const user = await createUser({
      phone,
      nickname,
      password_hash,
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
      return res.status(401).json({ error: '手机号或密码错误' });
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

export default router;
