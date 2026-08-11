import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { 
  getPosts, createPost, toggleLike, isLiked,
  getComments, createComment, getPostById, deletePost
} from '../services/postService';
import { getUserById } from '../services/userService';
import { getPool } from '../config/database';
import { checkContentLimit } from '../services/contentSimilarityService';

const router = Router();

// 会员等级对应的每日发帖限制
const POST_LIMITS: Record<number, number> = {
  0: 10,   // 镇
  1: 30,   // 县
  2: 100,  // 市
  3: 200,  // 省
  4: 300,  // 全国
};

// 获取帖子列表（公开，无需登录）
router.get('/', async (req: any, res: Response) => {
  try {
    const { region_code, userId, page, pageSize } = req.query;
    
    const result = await getPosts({
      region_code: region_code as string,
      userId: userId ? parseInt(userId as string) : undefined,
      page: page ? parseInt(page as string) : 1,
      pageSize: pageSize ? parseInt(pageSize as string) : 20
    });
    
    // 检查用户是否点赞（未登录时不检查）
    const posts = await Promise.all(result.posts.map(async (post: any) => {
      const liked = req.userId ? await isLiked(req.userId, post.id) : false;
      return {
        id: post.id,
        content: post.content,
        images: post.images,
        region_code: post.region_code,
        like_count: post.like_count || 0,
        comment_count: post.comment_count || 0,
        created_at: post.created_at,
        expire_at: post.expire_at,
        is_liked: liked,
        author: {
          id: post.user_id,
          nickname: post.author_nickname,
          avatar: post.author_avatar
        }
      };
    }));
    
    res.json({ posts });
  } catch (error: any) {
    console.error('获取帖子列表错误:', error);
    res.status(500).json({ error: error.message || '获取帖子列表失败' });
  }
});

// 获取我的帖子
router.get('/mine', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await getPosts({ userId: req.userId! });
    res.json({ posts: result.posts });
  } catch (error: any) {
    console.error('获取我的帖子错误:', error);
    res.status(500).json({ error: error.message || '获取帖子列表失败' });
  }
});

// 获取单个帖子（公开，无需登录）
router.get('/:id', async (req: any, res: Response) => {
  try {
    const post = await getPostById(parseInt(req.params.id));
    
    if (!post) {
      return res.status(404).json({ error: '帖子不存在' });
    }
    
    const liked = req.userId ? await isLiked(req.userId, post.id) : false;
    
    res.json({
      post: {
        ...post,
        is_liked: liked,
        author: {
          id: post.user_id,
          nickname: post.author_nickname,
          avatar: post.author_avatar
        }
      }
    });
  } catch (error: any) {
    console.error('获取帖子错误:', error);
    res.status(500).json({ error: error.message || '获取帖子失败' });
  }
});

// 创建帖子
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { content, images, region_code, region_level } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: '请输入内容' });
    }
    
    if (!region_code || region_level === undefined) {
      return res.status(400).json({ error: '请选择地区' });
    }
    
    const user = await getUserById(req.userId!);
    
    // 检查发帖限制（根据会员等级）
    const postLimit = POST_LIMITS[user.member_level] || 10;
    if (user.today_post_count >= postLimit) {
      return res.status(403).json({ 
        error: '今日发帖次数已用完',
        limit: postLimit,
        used: user.today_post_count
      });
    }
    
    // 检查相似内容限制（同区域、同一天最多3条相似内容）
    const pool = getPool();
    const today = new Date().toISOString().split('T')[0];
    const existingPosts = await pool.query(
      `SELECT content, created_at FROM posts 
       WHERE user_id = $1 AND region_code = $2 AND DATE(created_at) = $3
       ORDER BY created_at DESC`,
      [req.userId!, region_code, today]
    );
    
    const limitCheck = checkContentLimit(
      content.trim(),
      existingPosts.rows,
      2 // 最多2条相似
    );
    
    if (!limitCheck.canPost) {
      return res.status(429).json({ 
        error: limitCheck.reason,
        similarCount: limitCheck.similarCount,
        maxSimilar: 3
      });
    }
    
    const post = await createPost({
      userId: req.userId!,
      content: content.trim(),
      images: images || [],
      region_code,
      region_level
    });
    
    res.json({
      success: true,
      post: {
        id: post.id,
        content: post.content,
        images: post.images,
        region_code: post.region_code,
        created_at: post.created_at
      }
    });
  } catch (error: any) {
    console.error('创建帖子错误:', error);
    res.status(500).json({ error: error.message || '创建帖子失败' });
  }
});

// 点赞/取消点赞
router.post('/:id/like', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    const post = await getPostById(postId);
    
    if (!post) {
      return res.status(404).json({ error: '帖子不存在' });
    }
    
    const liked = await toggleLike(req.userId!, postId);
    
    // 获取更新后的点赞数
    const updatedPost = await getPostById(postId);
    
    res.json({ success: true, liked, like_count: updatedPost.like_count });
  } catch (error: any) {
    console.error('点赞错误:', error);
    res.status(500).json({ error: error.message || '操作失败' });
  }
});

// 获取评论
router.get('/:id/comments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const comments = await getComments(parseInt(req.params.id));
    res.json({ comments });
  } catch (error: any) {
    console.error('获取评论错误:', error);
    res.status(500).json({ error: error.message || '获取评论失败' });
  }
});

// 创建评论
router.post('/:id/comments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { content, parent_id } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: '请输入评论内容' });
    }
    
    const post = await getPostById(parseInt(req.params.id));
    if (!post) {
      return res.status(404).json({ error: '帖子不存在' });
    }
    
    const comment = await createComment({
      postId: parseInt(req.params.id),
      userId: req.userId!,
      content: content.trim(),
      parentId: parent_id
    });
    
    res.json({
      success: true,
      comment
    });
  } catch (error: any) {
    console.error('创建评论错误:', error);
    res.status(500).json({ error: error.message || '创建评论失败' });
  }
});

// 删除帖子
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    const post = await getPostById(postId);
    
    if (!post) {
      return res.status(404).json({ error: '帖子不存在' });
    }
    
    if (post.user_id !== req.userId) {
      return res.status(403).json({ error: '只能删除自己的帖子' });
    }
    
    await deletePost(postId);
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('删除帖子错误:', error);
    res.status(500).json({ error: error.message || '删除帖子失败' });
  }
});

// 举报帖子
router.post('/:id/report', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    const { reason } = req.body;
    
    const post = await getPostById(postId);
    if (!post) {
      return res.status(404).json({ error: '帖子不存在' });
    }
    
    // 检查是否已经举报过
    const existingReport = await pool.query(
      'SELECT id FROM reports WHERE post_id = $1 AND user_id = $2',
      [postId, req.userId]
    );
    
    if (existingReport.rows.length > 0) {
      return res.status(400).json({ error: '您已经举报过该帖子' });
    }
    
    // 创建举报记录
    await pool.query(
      'INSERT INTO reports (post_id, user_id, reason, status, created_at) VALUES ($1, $2, $3, 0, NOW())',
      [postId, req.userId, reason || '用户举报']
    );
    
    res.json({ success: true, message: '举报成功' });
  } catch (error: any) {
    console.error('举报帖子错误:', error);
    res.status(500).json({ error: error.message || '举报失败' });
  }
});

export default router;
