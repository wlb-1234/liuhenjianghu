import { pgTable, index, serial, varchar, integer, timestamp, text, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// 敏感词表
export const sensitiveWords = pgTable("sensitive_words", {
  id: serial().primaryKey().notNull(),
  word: varchar({ length: 100 }).notNull(),
  category: varchar({ length: 50 }), // politics/sex/crime/advertisement/custom
  level: integer().default(1), // 1: 低危 2: 中危 3: 高危 4: 违规
  createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_sensitive_word").using("btree", table.word.asc()),
  index("idx_sensitive_category").using("btree", table.category.asc()),
]);

// 用户违规记录表
export const violations = pgTable("violations", {
  id: serial().primaryKey().notNull(),
  userId: integer("user_id").notNull(),
  targetType: varchar("target_type", { length: 20 }), // post/comment/username
  targetId: integer("target_id"),
  reason: varchar({ length: 500 }).notNull(),
  content: text(), // 违规内容摘要
  violationType: varchar("violation_type", { length: 50 }), // sensitive_word/spam/malicious/report
  status: integer().default(0), // 0: 待处理 1: 已警告 2: 已处罚 3: 已忽略
  handledBy: integer("handled_by"), // 管理员ID
  handleNote: text("handle_note"),
  createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
  handledAt: timestamp("handled_at", { mode: 'string' }),
}, (table) => [
  index("idx_violations_user").using("btree", table.userId.asc()),
  index("idx_violations_status").using("btree", table.status.asc()),
  index("idx_violations_created").using("btree", table.createdAt.desc()),
]);

// 用户封禁记录表
export const bans = pgTable("bans", {
  id: serial().primaryKey().notNull(),
  userId: integer("user_id").notNull(),
  type: varchar({ length: 20 }).default('warning'), // warning/warn/post/login/forever
  reason: varchar({ length: 500 }).notNull(),
  violationId: integer("violation_id"), // 关联的违规记录
  adminId: integer("admin_id"),
  expiredAt: timestamp("expired_at", { mode: 'string' }), // null 表示永久
  liftedAt: timestamp("lifted_at", { mode: 'string' }), // 解封时间
  liftReason: text("lift_reason"),
  liftedBy: integer("lifted_by"),
  createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_bans_user").using("btree", table.userId.asc()),
  index("idx_bans_type").using("btree", table.type.asc()),
]);

// 待审核内容表
export const pendingContent = pgTable("pending_content", {
  id: serial().primaryKey().notNull(),
  type: varchar({ length: 20 }).notNull(), // post/comment
  targetId: integer("target_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text().notNull(),
  images: text(), // JSON array of image URLs
  reason: varchar({ length: 200 }), // 审核不通过原因
  aiResult: varchar("ai_result", { length: 20 }), // pass/suspicious/reject
  aiScores: varchar("ai_scores"), // JSON scores from AI
  status: integer().default(0), // 0: 待审核 1: 通过 2: 拒绝 3: 人工复审
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
  createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_pending_status").using("btree", table.status.asc()),
  index("idx_pending_type").using("btree", table.type.asc()),
  index("idx_pending_created").using("btree", table.createdAt.desc()),
]);
