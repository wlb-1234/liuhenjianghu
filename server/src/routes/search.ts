import { Router } from "express";
import { db, users, posts } from "../storage/database";
import { like, sql } from "drizzle-orm";
import { authenticate } from "../middleware/auth";

const router = Router();

// 搜索用户
router.get("/users", async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || typeof keyword !== "string") {
      res.status(400).json({ error: "缺少搜索关键词" });
      return;
    }

    const searchPattern = `%${keyword}%`;

    const result = await db
      .select({
        id: users.id,
        nickname: users.nickname,
        avatar: users.avatar,
        postsCount: sql<number>`(SELECT COUNT(*) FROM posts WHERE posts.user_id = ${users.id})`,
        followersCount: sql<number>`(SELECT COUNT(*) FROM follows WHERE follows.followed_id = ${users.id})`,
      })
      .from(users)
      .where(like(users.nickname, searchPattern))
      .limit(20);

    res.json({ users: result });
  } catch (error) {
    console.error("搜索用户失败:", error);
    res.status(500).json({ error: "搜索用户失败" });
  }
});

// 搜索帖子
router.get("/posts", async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || typeof keyword !== "string") {
      res.status(400).json({ error: "缺少搜索关键词" });
      return;
    }

    const searchPattern = `%${keyword}%`;

    const result = await db
      .select({
        id: posts.id,
        content: posts.content,
        images: posts.images,
        createdAt: posts.createdAt,
        userId: posts.userId,
      })
      .from(posts)
      .where(like(posts.content, searchPattern))
      .orderBy(sql`${posts.createdAt} DESC`)
      .limit(30);

    // 获取用户信息
    const userIds = [...new Set(result.map(p => p.userId))];
    const userMap: Record<number, any> = {};
    
    if (userIds.length > 0) {
      const userList = await db
        .select({
          id: users.id,
          nickname: users.nickname,
          avatar: users.avatar,
        })
        .from(users)
        .where(sql`${users.id} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`);
      
      userList.forEach(u => {
        userMap[u.id] = u;
      });
    }

    const postsWithUser = result.map(post => ({
      ...post,
      user: userMap[post.userId] || null,
    }));

    res.json({ posts: postsWithUser });
  } catch (error) {
    console.error("搜索帖子失败:", error);
    res.status(500).json({ error: "搜索帖子失败" });
  }
});

export default router;
