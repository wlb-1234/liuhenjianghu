import express, { Request, Response } from 'express';

const router = express.Router();

// 生成分享链接
router.post('/generate', (req: Request, res: Response) => {
  const { userId, contentId, contentType } = req.body;
  
  if (!userId || !contentId) {
    return res.status(400).json({
      success: false,
      error: 'userId and contentId are required'
    });
  }
  
  // 生成唯一分享码
  const shareCode = Buffer.from(`${userId}-${contentId}-${Date.now()}`).toString('base64');
  
  // 分享链接
  const shareUrl = `https://liuhenjianghu.com/share/${shareCode}`;
  
  // 分享海报数据
  const posterData = {
    title: '流痕江湖 - 精彩内容分享',
    desc: '我在流痕江湖发现了一条精彩留言，快来看看吧！',
    image: 'https://liuhenjianghu.com/assets/share-poster.jpg'
  };
  
  res.json({
    success: true,
    data: {
      shareCode,
      shareUrl,
      posterData,
      expiresIn: 7 * 24 * 60 * 60 * 1000 // 7天有效期
    }
  });
});

// 获取分享详情
router.get('/info/:shareCode', (req: Request, res: Response) => {
  const { shareCode } = req.params;
  
  // 解码分享码
  try {
    const decoded = Buffer.from(shareCode, 'base64').toString('utf-8');
    const [userId, contentId, timestamp] = decoded.split('-');
    
    // 验证是否过期（7天）
    const isExpired = Date.now() - parseInt(timestamp) > 7 * 24 * 60 * 60 * 1000;
    
    if (isExpired) {
      return res.status(410).json({
        success: false,
        error: 'Share link has expired'
      });
    }
    
    // 模拟获取分享内容
    res.json({
      success: true,
      data: {
        userId,
        contentId,
        content: {
          id: contentId,
          text: '这是一条精彩的内容分享...',
          author: '用户***',
          createdAt: new Date(parseInt(timestamp)).toISOString()
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Invalid share code'
    });
  }
});

// 记录分享统计
router.post('/track', (req: Request, res: Response) => {
  const { shareCode, platform } = req.body;
  
  if (!shareCode || !platform) {
    return res.status(400).json({
      success: false,
      error: 'shareCode and platform are required'
    });
  }
  
  // 记录分享到数据库
  
  res.json({
    success: true,
    data: {
      shareCode,
      platform,
      trackedAt: new Date().toISOString()
    }
  });
});

// 获取分享排行榜
router.get('/leaderboard', (req: Request, res: Response) => {
  const period = req.query.period as string || 'week'; // day, week, month, all
  
  // 模拟排行榜数据
  const leaderboard = [
    { rank: 1, userId: 'user001', nickname: '江湖高手', shareCount: 128, avatar: '' },
    { rank: 2, userId: 'user002', nickname: '流痕达人', shareCount: 95, avatar: '' },
    { rank: 3, userId: 'user003', nickname: '江湖新秀', shareCount: 76, avatar: '' },
    { rank: 4, userId: 'user004', nickname: '留言王', shareCount: 52, avatar: '' },
    { rank: 5, userId: 'user005', nickname: '社交达人', shareCount: 38, avatar: '' },
  ];
  
  res.json({
    success: true,
    data: {
      period,
      leaderboard
    }
  });
});

// 分享到各平台的配置
router.get('/platforms', (req: Request, res: Response) => {
  const platforms = [
    {
      id: 'wechat',
      name: '微信',
      icon: 'wechat',
      color: '#07C160',
      needAuth: true
    },
    {
      id: 'weibo',
      name: '微博',
      icon: 'weibo',
      color: '#E6162D',
      needAuth: true
    },
    {
      id: 'qq',
      name: 'QQ',
      icon: 'qq',
      color: '#12B7F5',
      needAuth: true
    },
    {
      id: 'copy',
      name: '复制链接',
      icon: 'copy',
      color: '#999999',
      needAuth: false
    }
  ];
  
  res.json({
    success: true,
    data: platforms
  });
});

export default router;
