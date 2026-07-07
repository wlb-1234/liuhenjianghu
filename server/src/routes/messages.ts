import { Router } from "express";
import { db, messages, conversations, users } from "../storage/database";
import { eq, and, or, desc, sql, ne } from "drizzle-orm";
import { z } from "zod";
import { authMiddleware as authenticate } from "../middleware/auth";
import { NotificationService, MessagePriority } from "../services/notificationService.js";

const router = Router();

// 获取当前用户的会话列表
router.get("/conversations", authenticate, async (req: any, res) => {
  try {
    const userId = req.userId;

    // 获取会话列表，包含对方用户信息
    const conversationList = await db
      .select({
        id: conversations.id,
        updatedAt: conversations.updatedAt,
        userId: users.id,
        nickname: users.nickname,
        avatar: users.avatar,
      })
      .from(conversations)
      .innerJoin(users, sql`(
        (${conversations.userId1} = ${users.id} AND ${conversations.userId2} = ${userId})
        OR
        (${conversations.userId2} = ${users.id} AND ${conversations.userId1} = ${userId})
      )`)
      .where(
        or(
          eq(conversations.userId1, userId),
          eq(conversations.userId2, userId)
        )
      )
      .orderBy(desc(conversations.updatedAt));

    // 获取每个会话的最新消息
    const result = await Promise.all(
      conversationList.map(async (conv) => {
        const latestMessage = await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, conv.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        const unreadCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, conv.id),
              eq(messages.receiverId, userId),
              eq(messages.isRead, false)
            )
          );

        return {
          ...conv,
          latestMessage: latestMessage[0] || null,
          unreadCount: Number(unreadCount[0]?.count || 0),
        };
      })
    );

    res.json({ conversations: result });
  } catch (error) {
    console.error("获取会话列表失败:", error);
    res.status(500).json({ error: "获取会话列表失败" });
  }
});

// 获取与某个用户的聊天记录
router.get("/:userId", authenticate, async (req: any, res) => {
  try {
    const currentUserId = req.userId;
    const otherUserId = parseInt(req.params.userId);

    // 查找或创建会话
    let conversation = await db
      .select()
      .from(conversations)
      .where(
        or(
          and(eq(conversations.userId1, currentUserId), eq(conversations.userId2, otherUserId)),
          and(eq(conversations.userId1, otherUserId), eq(conversations.userId2, currentUserId))
        )
      )
      .limit(1);

    let convId: number;
    if (conversation.length === 0) {
      // 创建新会话
      const newConv = await db
        .insert(conversations)
        .values({
          userId1: currentUserId,
          userId2: otherUserId,
        })
        .returning();
      convId = newConv[0].id;
    } else {
      convId = conversation[0].id;
    }

    // 获取聊天记录
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const messageList = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, convId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    // 标记消息为已读
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.conversationId, convId),
          eq(messages.receiverId, currentUserId),
          eq(messages.isRead, false)
        )
      );

    // 获取对方用户信息
    const otherUser = await db
      .select({ id: users.id, nickname: users.nickname, avatar: users.avatar })
      .from(users)
      .where(eq(users.id, otherUserId))
      .limit(1);

    res.json({
      conversationId: convId,
      otherUser: otherUser[0] || null,
      messages: messageList.reverse(),
      hasMore: messageList.length === limit,
    });
  } catch (error) {
    console.error("获取聊天记录失败:", error);
    res.status(500).json({ error: "获取聊天记录失败" });
  }
});

// 发送消息
router.post("/", authenticate, async (req: any, res) => {
  try {
    const senderId = req.userId;
    const { receiverId, content, type = "text" } = req.body;

    if (!receiverId || !content) {
      res.status(400).json({ error: "缺少必要参数" });
      return;
    }

    // 查找或创建会话
    let conversation = await db
      .select()
      .from(conversations)
      .where(
        or(
          and(eq(conversations.userId1, senderId), eq(conversations.userId2, receiverId)),
          and(eq(conversations.userId1, receiverId), eq(conversations.userId2, senderId))
        )
      )
      .limit(1);

    let convId: number;
    if (conversation.length === 0) {
      const newConv = await db
        .insert(conversations)
        .values({
          userId1: senderId,
          userId2: receiverId,
        })
        .returning();
      convId = newConv[0].id;
    } else {
      convId = conversation[0].id;
    }

    // 发送消息
    const newMessage = await db
      .insert(messages)
      .values({
        conversationId: convId,
        senderId,
        receiverId,
        content,
        type,
      })
      .returning();

    // 更新会话时间
    await db
      .update(conversations)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(conversations.id, convId));

    // 发送新私信通知给接收方
    if (senderId !== receiverId) {
      try {
        // 获取发送者昵称
        const senderInfo = await db
          .select({ nickname: users.nickname })
          .from(users)
          .where(eq(users.id, senderId))
          .limit(1);
        
        const senderName = senderInfo[0]?.nickname || '有人';
        const displayContent = type === 'text' ? content.substring(0, 30) : '[消息]';
        
        await NotificationService.sendSystemMessage(
          receiverId,
          '新私信提醒',
          `${senderName} 给您发了一条消息: ${displayContent}`,
          { type: 'private_message', senderId, conversationId: convId, messageType: type },
          MessagePriority.NORMAL
        );
      } catch (notifError: any) {
        console.error('发送私信通知失败(不影响消息发送):', notifError.message);
      }
    }

    res.json({ message: newMessage[0] });
  } catch (error) {
    console.error("发送消息失败:", error);
    res.status(500).json({ error: "发送消息失败" });
  }
});

export default router;
