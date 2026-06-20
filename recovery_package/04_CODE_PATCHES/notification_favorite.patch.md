# 通知与收藏功能补丁

## 数据库表

```sql
-- 消息通知表
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,  -- NULL表示系统公告
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(32) NOT NULL DEFAULT 'system',  -- system/order/activity
  is_read BOOLEAN DEFAULT FALSE,
  related_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- 收藏表
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  item_type VARCHAR(32) NOT NULL,  -- article/video
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, item_id, item_type)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_type ON favorites(item_type);
```

## 后端路由文件

### server/src/routes/notifications.ts

```typescript
import { Router } from 'express';
import { query } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// 获取通知列表
router.get('/', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const { type, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = '';
    const params: any[] = [];
    let paramCount = 0;

    // 兼容 userId = 0 的情况（兼容模式）
    if (userId && userId > 0) {
      paramCount++;
      whereClause += ` AND (user_id IS NULL OR user_id = $${paramCount})`;
      params.push(userId);
    }

    if (type) {
      paramCount++;
      whereClause += ` AND type = $${paramCount}`;
      params.push(type);
    }

    const countResult = await query(
      `SELECT COUNT(*)::integer as total FROM notifications WHERE 1=1 ${whereClause}`,
      params
    );

    paramCount++;
    const limitParam = paramCount;
    params.push(Number(limit));

    paramCount++;
    const offsetParam = paramCount;
    params.push(offset);

    const result = await query(
      `SELECT * FROM notifications WHERE 1=1 ${whereClause} ORDER BY created_at DESC LIMIT $${limitParam} OFFSET $${offsetParam}`,
      params
    );

    res.json({
      success: true,
      data: {
        notifications: result.rows,
        total: countResult.rows[0]?.total || 0,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error: any) {
    console.error('获取通知失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 标记已读
router.put('/:id/read', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    await query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 标记全部已读
router.put('/read-all', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (userId && userId > 0) {
      await query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [userId]);
    } else {
      await query('UPDATE notifications SET is_read = TRUE WHERE user_id IS NULL');
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取未读数
router.get('/unread-count', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    let sql = 'SELECT COUNT(*)::integer as count FROM notifications WHERE is_read = FALSE';
    if (userId && userId > 0) {
      sql += ' AND (user_id IS NULL OR user_id = $1)';
      const result = await query(sql, [userId]);
      return res.json({ success: true, count: result.rows[0]?.count || 0 });
    }
    const result = await query(sql + ' AND user_id IS NULL');
    res.json({ success: true, count: result.rows[0]?.count || 0 });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 管理员：发送通知
router.post('/', async (req, res) => {
  try {
    const { user_id, title, content, type = 'system', related_id } = req.body;
    await query(
      `INSERT INTO notifications (user_id, title, content, type, related_id) VALUES ($1, $2, $3, $4, $5)`,
      [user_id || null, title, content, type, related_id]
    );
    res.json({ success: true, message: '通知已发送' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
```

### server/src/routes/favorites.ts

```typescript
import { Router } from 'express';
import { query } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// 获取收藏列表
router.get('/', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const { type, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = '';
    const params: any[] = [];

    if (userId && userId > 0) {
      params.push(userId);
      whereClause += ` AND f.user_id = $1`;
    }

    if (type) {
      params.push(type);
      whereClause += ` AND f.item_type = $${params.length}`;
    }

    const countSql = `SELECT COUNT(*)::integer as total FROM favorites f WHERE 1=1 ${whereClause}`;
    const countResult = await query(countSql, params);

    params.push(Number(limit), offset);
    const dataSql = `
      SELECT f.*, p.title, p.cover_image, p.summary
      FROM favorites f
      LEFT JOIN posts p ON f.item_id = p.id AND f.item_type = 'article'
      WHERE 1=1 ${whereClause}
      ORDER BY f.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const result = await query(dataSql, params);

    res.json({
      success: true,
      data: {
        favorites: result.rows,
        total: countResult.rows[0]?.total || 0,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 添加收藏
router.post('/', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId || userId <= 0) {
      return res.status(401).json({ success: false, error: '请先登录' });
    }

    const { item_id, item_type } = req.body;
    await query(
      `INSERT INTO favorites (user_id, item_id, item_type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [userId, item_id, item_type]
    );
    res.json({ success: true, message: '收藏成功' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 取消收藏
router.delete('/:item_id/:item_type', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const { item_id, item_type } = req.params;
    await query(
      `DELETE FROM favorites WHERE user_id = $1 AND item_id = $2 AND item_type = $3`,
      [userId, item_id, item_type]
    );
    res.json({ success: true, message: '已取消收藏' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 检查是否收藏
router.get('/check/:item_id/:item_type', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const { item_id, item_type } = req.params;
    const result = await query(
      `SELECT id FROM favorites WHERE user_id = $1 AND item_id = $2 AND item_type = $3`,
      [userId, item_id, item_type]
    );
    res.json({ success: true, isFavorited: result.rows.length > 0 });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
```

## 前端页面

### client/app/notifications.tsx

```tsx
export { default } from "@/screens/notifications";
```

### client/app/favorites.tsx

```tsx
export { default } from "@/screens/favorites";
```

### client/screens/notifications/index.tsx - 通知列表页面

### client/screens/favorites/index.tsx - 收藏列表页面
