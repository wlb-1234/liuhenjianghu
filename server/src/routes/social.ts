import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

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

export default router;
