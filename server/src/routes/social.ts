import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { 
  toggleFollow, getFollowers, getFollowings, isFollowing,
  getConversations, getMessages, sendMessage, getUnreadCount
} from '../services/socialService';
import { getUserById, getUserByPhone } from '../services/userService';

const router = Router();

// 获取好友/关注列表
router.get('/followings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const followings = await getFollowings(req.userId!);
    
    res.json({
      users: followings.map((item: any) => ({
        id: item.users?.id || item.id,
        nickname: item.users?.nickname || item.nickname,
        avatar: item.users?.avatar || item.avatar,
        created_at: item.created_at
      }))
    });
  } catch (error) {
    console.error('获取关注列表错误:', error);
    res.status(500).json({ error: '获取关注列表失败' });
  }
});

// 获取粉丝列表
router.get('/followers', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const followers = await getFollowers(req.userId!);
    
    res.json({
      users: followers.map((item: any) => ({
        id: item.users?.id || item.id,
        nickname: item.users?.nickname || item.nickname,
        avatar: item.users?.avatar || item.avatar,
        created_at: item.created_at
      }))
    });
  } catch (error) {
    console.error('获取粉丝列表错误:', error);
    res.status(500).json({ error: '获取粉丝列表失败' });
  }
});

// 关注/取消关注
router.post('/follow/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = parseInt(req.params.userId as string);
    
    if (targetUserId === req.userId) {
      return res.status(400).json({ error: '不能关注自己' });
    }
    
    const targetUser = await getUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const followed = await toggleFollow(req.userId!, targetUserId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('关注操作错误:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

// 取消关注
router.delete('/follow/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = parseInt(req.params.userId as string);
    await unfollow(req.userId!, targetUserId);
    res.json({ success: true, followed: false });
  } catch (error) {
    console.error('取消关注错误:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

// 检查是否关注
router.get('/follow/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const followed = await isFollowing(req.userId!, parseInt(req.params.userId as string));
    res.json({ followed });
  } catch (error) {
    console.error('检查关注状态错误:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

// 获取用户详情
router.get('/users/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await getUserById(parseInt(req.params.id as string));
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const followed = await isFollowing(req.userId!, user.id);
    
    res.json({
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar_url,
        member_level: user.member_level,
        total_likes: user.total_likes,
        total_posts: user.total_posts,
        created_at: user.created_at,
        is_following: followed
      }
    });
  } catch (error) {
    console.error('获取用户详情错误:', error);
    res.status(500).json({ error: '获取用户详情失败' });
  }
});

// 获取私信会话列表
router.get('/conversations', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const conversations = await getConversations(req.userId!);
    const unreadCount = await getUnreadCount(req.userId!);
    
    res.json({
      conversations,
      unreadCount
    });
  } catch (error) {
    console.error('获取会话列表错误:', error);
    res.status(500).json({ error: '获取会话列表失败' });
  }
});

// 获取与某个用户的聊天记录
router.get('/messages/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const messages = await getMessages(req.userId!, parseInt(req.params.userId as string));
    
    res.json({
      messages: messages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        is_read: msg.is_read,
        created_at: msg.created_at,
        sender_id: msg.sender_id,
        is_mine: msg.sender_id === req.userId
      }))
    });
  } catch (error) {
    console.error('获取聊天记录错误:', error);
    res.status(500).json({ error: '获取聊天记录失败' });
  }
});

// 发送私信
router.post('/messages/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: '请输入消息内容' });
    }
    
    const targetUserId = parseInt(req.params.userId as string);
    const targetUser = await getUserById(targetUserId);
    
    if (!targetUser) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const message = await sendMessage(req.userId!, targetUserId, content.trim());
    
    res.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        is_read: false,
        created_at: message.created_at,
        sender_id: req.userId,
        is_mine: true
      }
    });
  } catch (error) {
    console.error('发送消息错误:', error);
    res.status(500).json({ error: '发送消息失败' });
  }
});

export default router;
