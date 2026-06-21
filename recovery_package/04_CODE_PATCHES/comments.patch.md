# 评论功能补丁 v1.5.0

## 数据库表

```sql
-- 评论表
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  item_type VARCHAR(32) NOT NULL,  -- article/video
  content TEXT NOT NULL,
  parent_id INTEGER,  -- 回复的评论ID
  reply_to_user_id INTEGER,  -- 回复的用户ID
  likes INTEGER DEFAULT 0,
  status INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comments_item ON comments(item_id, item_type);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
```

## 后端接口

文件：`server/src/routes/comments.ts`

```typescript
// 评论相关路由
GET  /api/v1/comments/item/:itemId/:itemType  // 获取评论列表
POST /api/v1/comments/item/:itemId/:itemType  // 发表评论 { content, userId, parentId? }
DELETE /api/v1/comments/:id                    // 删除评论 { userId }
POST /api/v1/comments/:id/like                 // 点赞评论
```

## 路由挂载

在 `server/src/index.ts` 中添加：

```typescript
import commentsRouter from './routes/comments';
app.use('/api/v1/comments', commentsRouter);
```

## 注意事项

- users 表字段为 `nickname` 不是 `username`
- 评论区分类通过 `item_type` 区分（article/video）
- 发表评论需要登录认证
