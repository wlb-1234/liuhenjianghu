import express from 'express';
import { query } from '../config/database';
import { authMiddleware as authenticate } from '../middleware/auth';
import * as social from '../services/socialService.js';

const router = express.Router();

// ============ 用户资料 ============

// 获取用户资料（含互关标识）
router.get('/users/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    const { viewerId } = req.query;

    const userR = await query('SELECT id, username, nickname, avatar_url, bio, created_at FROM users WHERE id = $1', [userId]);
    if (userR.rows.length === 0) return res.status(404).json({ error: '用户不存在' });

    const followingR = await query('SELECT COUNT(*) FROM follows WHERE follower_id = $1', [userId]);
    const followersR = await query('SELECT COUNT(*) FROM follows WHERE following_id = $1', [userId]);

    const mutualStatus = { isFollowing: false, isFollowed: false, isMutual: false };
    if (viewerId && viewerId !== userId) {
      const vf = await query('SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2', [viewerId, userId]);
      const uf = await query('SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2', [userId, viewerId]);
      mutualStatus.isFollowing = vf.rows.length > 0;
      mutualStatus.isFollowed = uf.rows.length > 0;
      mutualStatus.isMutual = vf.rows.length > 0 && uf.rows.length > 0;
    }

    res.json({
      success: true,
      data: {
        ...userR.rows[0],
        followingCount: parseInt(followingR.rows[0].count),
        followersCount: parseInt(followersR.rows[0].count),
        ...mutualStatus
      }
    });

  } catch (error) {
    console.error('获取用户资料错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取互关好友
router.get('/users/:userId/mutual-followers', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);

    // 查询A关注B 且 B也关注A的用户
    const result = await query(
      `SELECT u.id, u.username, u.nickname, u.avatar_url, f.created_at as followed_at
       FROM follows f
       JOIN users u ON f.following_id = u.id
       WHERE f.follower_id = $1
       AND EXISTS (SELECT 1 FROM follows f2 WHERE f2.follower_id = f.following_id AND f2.following_id = f.follower_id)
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(pageSize as string), offset]
    );

    res.json({ success: true, data: result.rows, total: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 推荐关注
router.get('/users/:userId/recommendations', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);

    // 排除已关注的用户
    const result = await query(
      `SELECT u.id, u.username, u.nickname, u.avatar_url, u.bio,
              (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count
       FROM users u
       WHERE u.id != $1
       AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id = $1)
       ORDER BY followers_count DESC
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(pageSize as string), offset]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// ============ 关注（需登录） ============

// 关注用户
router.post('/follow/:userId', authenticate, async (req: any, res) => {
  try {
    const myId = req.userId;
    const targetId = parseInt(req.params.userId);
    const following = await social.toggleFollow(myId, targetId);
    res.json({ success: true, following });
  } catch (error: any) {
    res.status(400).json({ error: error.message || '操作失败' });
  }
});

// 取消关注
router.delete('/follow/:userId', authenticate, async (req: any, res) => {
  try {
    const myId = req.userId;
    const targetId = parseInt(req.params.userId);
    await social.unfollow(myId, targetId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: '操作失败' });
  }
});

// 关注列表
router.get('/following', authenticate, async (req: any, res) => {
  try {
    const data = await social.getFollowings(req.userId, parseInt(req.query.page) || 1);
    res.json({ following: data });
  } catch (error: any) {
    res.status(500).json({ error: '获取关注列表失败' });
  }
});

// 粉丝列表
router.get('/followers', authenticate, async (req: any, res) => {
  try {
    const data = await social.getFollowers(req.userId, parseInt(req.query.page) || 1);
    res.json({ followers: data });
  } catch (error: any) {
    res.status(500).json({ error: '获取粉丝列表失败' });
  }
});

// ============ 好友（需登录） ============

// 添加好友/发送好友申请
router.post('/friend/:userId', authenticate, async (req: any, res) => {
  try {
    const myId = req.userId;
    const targetId = parseInt(req.params.userId);
    const result = await social.addFriend(myId, targetId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || '操作失败' });
  }
});

// 接受好友申请
router.post('/friend/accept/:userId', authenticate, async (req: any, res) => {
  try {
    const myId = req.userId;
    const applicantId = parseInt(req.params.userId);
    const result = await social.acceptFriend(myId, applicantId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || '操作失败' });
  }
});

// 删除好友
router.delete('/friend/:userId', authenticate, async (req: any, res) => {
  try {
    const myId = req.userId;
    const targetId = parseInt(req.params.userId);
    const result = await social.removeFriend(myId, targetId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: '操作失败' });
  }
});

// 好友列表
router.get('/friends', authenticate, async (req: any, res) => {
  try {
    const data = await social.getFriendList(req.userId, parseInt(req.query.page) || 1);
    res.json({ friends: data });
  } catch (error: any) {
    res.status(500).json({ error: '获取好友列表失败' });
  }
});

// 好友申请列表
router.get('/friend/requests', authenticate, async (req: any, res) => {
  try {
    const data = await social.getFriendRequests(req.userId);
    res.json({ requests: data });
  } catch (error: any) {
    res.status(500).json({ error: '获取好友申请失败' });
  }
});

// ============ 私信（需登录） ============

// 获取与某用户的聊天记录
router.get('/messages/:userId', authenticate, async (req: any, res) => {
  try {
    const myId = req.userId;
    const otherUserId = parseInt(req.params.userId);
    const page = parseInt(req.query.page) || 1;
    const messages = await social.getMessages(myId, otherUserId, page);
    // 读取后标记已读
    await social.markMessagesRead(myId, otherUserId);
    // 对方用户信息
    const u = await query('SELECT id, nickname, avatar, member_level FROM users WHERE id = $1', [otherUserId]);
    res.json({ messages, otherUser: u.rows[0] || null });
  } catch (error: any) {
    res.status(500).json({ error: '获取聊天记录失败' });
  }
});

// 发送私信
router.post('/message/:userId', authenticate, async (req: any, res) => {
  try {
    const myId = req.userId;
    const receiverId = parseInt(req.params.userId);
    const { content } = req.body;
    if (!content || !String(content).trim()) {
      return res.status(400).json({ error: '消息内容不能为空' });
    }
    const message = await social.sendMessage(myId, receiverId, String(content).trim());
    res.json({ message_id: message.id, message });
  } catch (error: any) {
    res.status(400).json({ error: error.message || '发送失败' });
  }
});

// 获取用户资料（简版，供社交页使用）
router.get('/user/:userId', authenticate, async (req: any, res) => {
  try {
    const u = await query('SELECT id, nickname, avatar, member_level FROM users WHERE id = $1', [req.params.userId]);
    if (u.rows.length === 0) return res.status(404).json({ error: '用户不存在' });
    res.json({ user: u.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: '获取用户资料失败' });
  }
});

// 搜索用户
router.get('/search', authenticate, async (req: any, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json({ users: [] });
    const result = await query(
      `SELECT id, nickname, avatar, member_level
       FROM users
       WHERE nickname ILIKE $1
       ORDER BY member_level DESC, id ASC
       LIMIT 50`,
      [`%${q}%`]
    );
    res.json({ users: result.rows });
  } catch (error: any) {
    res.status(500).json({ error: '搜索失败' });
  }
});

export default router;