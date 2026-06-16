import express from 'express';

const router = express.Router();

// 反馈类型枚举
export type FeedbackType = 'bug' | 'suggestion' | 'complaint' | 'other';
export type FeedbackStatus = 'pending' | 'processing' | 'resolved' | 'rejected';

// 反馈接口定义
export interface Feedback {
  id: string;
  userId: string;
  type: FeedbackType;
  content: string;
  contact?: string;
  images?: string[];
  status: FeedbackStatus;
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
}

// 内存存储（生产环境应使用数据库）
const feedbackStore: Map<string, Feedback> = new Map();
let feedbackCounter = 0;

/**
 * POST /api/v1/feedback - 提交反馈
 */
router.post('/', async (req, res) => {
  try {
    const { userId, type, content, contact, images } = req.body;

    // 参数校验
    if (!userId || !type || !content) {
      return res.status(400).json({
        success: false,
        error: '缺少必填参数：userId, type, content'
      });
    }

    // 类型校验
    const validTypes: FeedbackType[] = ['bug', 'suggestion', 'complaint', 'other'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: '无效的反馈类型'
      });
    }

    // 内容长度校验
    if (content.length < 5 || content.length > 2000) {
      return res.status(400).json({
        success: false,
        error: '反馈内容长度应在5-2000字之间'
      });
    }

    // 创建反馈
    const id = `fb_${Date.now()}_${++feedbackCounter}`;
    const feedback: Feedback = {
      id,
      userId,
      type,
      content,
      contact,
      images: images || [],
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    feedbackStore.set(id, feedback);

    res.status(201).json({
      success: true,
      data: feedback,
      message: '反馈提交成功，我们会尽快处理'
    });
  } catch (error) {
    console.error('提交反馈失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

/**
 * GET /api/v1/feedback - 获取用户的反馈列表
 */
router.get('/', async (req, res) => {
  try {
    const { userId, status, type, page = '1', pageSize = '10' } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '缺少userId参数'
      });
    }

    // 过滤反馈
    let feedbacks = Array.from(feedbackStore.values())
      .filter(f => f.userId === userId);

    // 按状态过滤
    if (status) {
      feedbacks = feedbacks.filter(f => f.status === status);
    }

    // 按类型过滤
    if (type) {
      feedbacks = feedbacks.filter(f => f.type === type);
    }

    // 按时间倒序
    feedbacks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 分页
    const pageNum = parseInt(page as string);
    const size = Math.min(parseInt(pageSize as string), 50);
    const start = (pageNum - 1) * size;
    const paginatedFeedbacks = feedbacks.slice(start, start + size);

    // 脱敏处理（隐藏联系方式部分内容）
    const sanitizedFeedbacks = paginatedFeedbacks.map(f => ({
      ...f,
      contact: f.contact ? f.contact.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : undefined
    }));

    res.json({
      success: true,
      data: {
        list: sanitizedFeedbacks,
        pagination: {
          page: pageNum,
          pageSize: size,
          total: feedbacks.length,
          totalPages: Math.ceil(feedbacks.length / size)
        }
      }
    });
  } catch (error) {
    console.error('获取反馈列表失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

/**
 * GET /api/v1/feedback/:id - 获取反馈详情
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = feedbackStore.get(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: '反馈不存在'
      });
    }

    // 脱敏处理
    const sanitized = {
      ...feedback,
      contact: feedback.contact 
        ? feedback.contact.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') 
        : undefined
    };

    res.json({
      success: true,
      data: sanitized
    });
  } catch (error) {
    console.error('获取反馈详情失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

/**
 * DELETE /api/v1/feedback/:id - 删除反馈
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    const feedback = feedbackStore.get(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: '反馈不存在'
      });
    }

    // 验证用户身份
    if (feedback.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: '无权删除此反馈'
      });
    }

    feedbackStore.delete(id);

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除反馈失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

/**
 * GET /api/v1/feedback/stats/types - 获取反馈统计（按类型）
 */
router.get('/stats/types', async (req, res) => {
  try {
    const feedbacks = Array.from(feedbackStore.values());
    
    const stats = {
      total: feedbacks.length,
      byType: {
        bug: feedbacks.filter(f => f.type === 'bug').length,
        suggestion: feedbacks.filter(f => f.type === 'suggestion').length,
        complaint: feedbacks.filter(f => f.type === 'complaint').length,
        other: feedbacks.filter(f => f.type === 'other').length
      },
      byStatus: {
        pending: feedbacks.filter(f => f.status === 'pending').length,
        processing: feedbacks.filter(f => f.status === 'processing').length,
        resolved: feedbacks.filter(f => f.status === 'resolved').length,
        rejected: feedbacks.filter(f => f.status === 'rejected').length
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取反馈统计失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

export default router;
