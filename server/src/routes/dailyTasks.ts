import express, { Request, Response } from 'express';

const router = express.Router();

// 每日签到任务配置
const DAILY_TASKS = [
  { id: 'daily_sign', name: '每日签到', points: 5, description: '每天签到获得积分' },
  { id: 'first_post', name: '首次发布', points: 10, description: '每天首次发布留言' },
  { id: 'view_content', name: '浏览内容', points: 1, description: '每浏览10条内容' },
  { id: 'invite_friend', name: '邀请好友', points: 50, description: '邀请好友注册' },
  { id: 'share_content', name: '分享内容', points: 5, description: '分享内容到社交平台' },
];

// 获取任务列表
router.get('/tasks', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: DAILY_TASKS
  });
});

// 获取用户任务状态
router.get('/status', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'userId is required'
    });
  }
  
  // 模拟数据 - 实际应从数据库查询
  res.json({
    success: true,
    data: {
      userId,
      signInToday: true,
      lastSignInDate: new Date().toISOString().split('T')[0],
      streak: 3, // 连续签到天数
      todayPoints: 5,
      totalPoints: 128,
      tasks: [
        { id: 'daily_sign', completed: true, progress: 1 },
        { id: 'first_post', completed: false, progress: 0 },
        { id: 'view_content', completed: false, progress: 3 },
        { id: 'invite_friend', completed: false, progress: 0 },
        { id: 'share_content', completed: false, progress: 0 },
      ]
    }
  });
});

// 签到
router.post('/sign', (req: Request, res: Response) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'userId is required'
    });
  }
  
  // 模拟签到成功
  res.json({
    success: true,
    data: {
      userId,
      signInDate: new Date().toISOString().split('T')[0],
      points: 5,
      streak: 3,
      message: '签到成功，获得5积分！'
    }
  });
});

// 完成任务（记录积分）
router.post('/complete', (req: Request, res: Response) => {
  const { userId, taskId } = req.body;
  
  if (!userId || !taskId) {
    return res.status(400).json({
      success: false,
      error: 'userId and taskId are required'
    });
  }
  
  const task = DAILY_TASKS.find(t => t.id === taskId);
  if (!task) {
    return res.status(404).json({
      success: false,
      error: 'Task not found'
    });
  }
  
  res.json({
    success: true,
    data: {
      userId,
      taskId,
      points: task.points,
      message: `任务完成，获得${task.points}积分！`
    }
  });
});

// 获取签到日历
router.get('/calendar', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'userId is required'
    });
  }
  
  // 模拟签到日历数据
  const signedDays = [1, 3, 5, 8, 10, 12, 15];
  
  res.json({
    success: true,
    data: {
      year,
      month,
      signedDays,
      totalSignDays: signedDays.length
    }
  });
});

export default router;
