import { Router, Request, Response } from 'express';
import { authMiddlewareWithUser as authMiddleware, AuthRequest } from '../middleware/auth';
import { 
  getPosts, getPostById, createPost, toggleLike, isLiked,
  getComments, createComment, createReport
} from '../services/userService';
import { getMemberLevel } from '../services/memberService';
import { checkSensitiveWords, moderateContent } from '../services/moderationService';

const router = Router();

// 获取帖子列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const { region_code, page = '1', limit = '20' } = req.query;
    
    const result = await getPosts({
      region_code: region_code as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
    
    res.json({
      posts: result.posts.map((post: any) => ({
        id: post.id,
        content: post.content,
        images: post.images,
        region_code: post.region_code,
        region_level: post.region_level,
        like_count: post.like_count,
        comment_count: post.comment_count,
        is_pinned: post.is_pinned,
        expire_at: post.expire_at,
        created_at: post.created_at,
        user: post.users
      })),
      page: parseInt(page as string),
      hasMore: result.posts.length === parseInt(limit as string)
    });
  } catch (error) {
    console.error('获取帖子列表错误:', error);
    res.status(500).json({ error: '获取帖子列表失败' });
  }
});

// 获取单个帖子详情
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const post = await getPostById(parseInt(req.params.id as string));
    
    if (!post) {
      return res.status(404).json({ error: '帖子不存在' });
    }
    
    res.json({
      post: {
        id: post.id,
        content: post.content,
        images: post.images,
        region_code: post.region_code,
        region_level: post.region_level,
        like_count: post.like_count,
        comment_count: post.comment_count,
        is_pinned: post.is_pinned,
        expire_at: post.expire_at,
        created_at: post.created_at,
        user: post.users
      }
    });
  } catch (error) {
    console.error('获取帖子详情错误:', error);
    res.status(500).json({ error: '获取帖子详情失败' });
  }
});

// 发布帖子
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { content, images, region_code, region_level } = req.body;
    console.log('Create post request:', { content, images, region_code, region_level });
    console.log('User:', req.user);
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: '请输入留言内容' });
    }
    
    if (!region_code || !region_level) {
      return res.status(400).json({ error: '请选择发布区域' });
    }
    
    // 检查会员等级和发帖限制
    const memberLevel = await getMemberLevel(req.user!.member_level);
    const now = new Date();
    const lastPostDate = req.user!.last_post_date ? new Date(req.user!.last_post_date) : null;
    
    // 如果是今天，需要检查发帖次数
    if (lastPostDate && lastPostDate.toDateString() === now.toDateString()) {
      if (req.user!.today_post_count >= memberLevel.daily_limit) {
        return res.status(403).json({ 
          error: `今日发帖次数已用完（${memberLevel.daily_limit}条/天）`,
          code: 'DAILY_LIMIT_EXCEEDED'
        });
      }
    }
    
    // 检查区域权限
    const userRegionCodes = [
      req.user!.province_code,
      req.user!.city_code,
      req.user!.district_code,
      req.user!.town_code
    ];
    
    // L0只能发本镇，L1本县，L2本市，L3本省，L4全国
    const minLevel = memberLevel.region_limit;
    if (region_level > minLevel && !userRegionCodes.includes(region_code)) {
      return res.status(403).json({ 
        error: '您没有在该区域发帖的权限',
        code: 'REGION_NOT_ALLOWED'
      });
    }
    
    // 内容安全审核
    const textViolation = await checkSensitiveWords(content);
    if (!textViolation.passed) {
      // 记录违规
      await moderateContent('post', req.userId!, content, []);
      return res.status(400).json({ 
        error: '您的留言包含违规内容，请修改后重试',
        code: 'CONTENT_VIOLATED',
        violation_words: textViolation.words,
        suggestion: '请删除以下违规词汇后重新发布: ' + textViolation.words.join(', ')
      });
    }
    
    // 计算过期时间
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + memberLevel.retention_days);
    
    const post = await createPost({
      user_id: req.userId!,
      content: content.trim(),
      images: images || [],
      region_code,
      region_level,
      expire_at: expireAt.toISOString()
    });
    
    res.json({
      success: true,
      message: '发布成功',
      post: {
        id: post.id,
        content: post.content,
        images: post.images,
        region_code: post.region_code,
        region_level: post.region_level,
        like_count: 0,
        comment_count: 0,
        expire_at: post.expire_at,
        created_at: post.created_at,
        user: post.users
      }
    });
  } catch (error: any) {
    console.error('发布帖子错误:', error);
    res.status(500).json({ error: '发布失败', message: error.message, stack: error.stack });
  }
});

// 点赞/取消点赞
router.post('/:id/like', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const postId = parseInt(req.params.id as string);
    const result = await toggleLike(req.userId!, postId);
    
    res.json({
      success: true,
      liked: result.liked
    });
  } catch (error) {
    console.error('点赞错误:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

// 检查是否点赞
router.get('/:id/like', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const liked = await isLiked(req.userId!, parseInt(req.params.id as string));
    res.json({ liked });
  } catch (error) {
    console.error('检查点赞状态错误:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

// 获取评论
router.get('/:id/comments', async (req: Request, res: Response) => {
  try {
    const comments = await getComments(parseInt(req.params.id as string));
    
    res.json({
      comments: comments.map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        parent_id: comment.parent_id,
        created_at: comment.created_at,
        user: comment.users
      }))
    });
  } catch (error) {
    console.error('获取评论错误:', error);
    res.status(500).json({ error: '获取评论失败' });
  }
});

// 添加评论
router.post('/:id/comments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { content, parent_id } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: '请输入评论内容' });
    }
    
    const comment = await createComment({
      post_id: parseInt(req.params.id as string),
      user_id: req.userId!,
      content: content.trim(),
      parent_id
    });
    
    res.json({
      success: true,
      comment: {
        id: comment.id,
        content: comment.content,
        parent_id: comment.parent_id,
        created_at: comment.created_at,
        user: comment.users
      }
    });
  } catch (error) {
    console.error('添加评论错误:', error);
    res.status(500).json({ error: '评论失败' });
  }
});

// 举报帖子
router.post('/:id/report', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { reason } = req.body;
    
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: '请输入举报原因' });
    }
    
    await createReport({
      post_id: parseInt(req.params.id as string),
      user_id: req.userId!,
      reason: reason.trim()
    });
    
    res.json({
      success: true,
      message: '举报成功，我们会尽快处理'
    });
  } catch (error) {
    console.error('举报错误:', error);
    res.status(500).json({ error: '举报失败' });
  }
});

export default router;
