import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 举报类型枚举
const ReportType = {
  POST: 'post',
  COMMENT: 'comment',
  USER: 'user'
};

// 举报原因枚举
const ReportReason = {
  SPAM: '垃圾广告',
  HARASSMENT: '骚扰谩骂',
  HATE_SPEECH: '仇恨言论',
  MISINFORMATION: '虚假信息',
  COPYRIGHT: '侵权内容',
  OTHER: '其他'
};

// 内存存储举报数据（生产环境应存数据库）
const reports: Array<{
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'rejected';
  createdAt: string;
}> = [];

// 提交举报
router.post('/', authMiddleware, async (req: any, res: any) => {
  try {
    const { targetType, targetId, reason, description } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: '缺少必要参数' 
      });
    }

    if (!Object.values(ReportType).includes(targetType)) {
      return res.status(400).json({ 
        success: false, 
        message: '无效的举报类型' 
      });
    }

    const report = {
      id: `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reporterId: req.user?.userId || 'anonymous',
      targetType,
      targetId,
      reason,
      description: description || '',
      status: 'pending' as const,
      createdAt: new Date().toISOString()
    };

    reports.push(report);

    res.json({ 
      success: true, 
      message: '举报已提交，感谢您的反馈',
      data: { reportId: report.id }
    });
  } catch (error: any) {
    console.error('提交举报失败:', error);
    res.status(500).json({ success: false, message: '提交举报失败' });
  }
});

// 获取举报列表（管理员）
router.get('/', authMiddleware, async (req: any, res: any) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    let filtered = reports;
    
    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }

    // 按时间倒序
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const start = (parseInt(page) - 1) * parseInt(limit);
    const end = start + parseInt(limit);
    const paginated = filtered.slice(start, end);

    res.json({
      success: true,
      data: paginated,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filtered.length
      }
    });
  } catch (error: any) {
    console.error('获取举报列表失败:', error);
    res.status(500).json({ success: false, message: '获取举报列表失败' });
  }
});

// 更新举报状态（管理员）
router.patch('/:id/status', authMiddleware, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'resolved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: '无效的状态' 
      });
    }

    const report = reports.find(r => r.id === id);
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: '举报不存在' 
      });
    }

    report.status = status;

    res.json({ success: true, message: '状态更新成功' });
  } catch (error: any) {
    console.error('更新举报状态失败:', error);
    res.status(500).json({ success: false, message: '更新举报状态失败' });
  }
});

export default router;
