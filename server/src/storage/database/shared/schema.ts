import { pgTable, index, unique, serial, varchar, integer, timestamp, date, foreignKey, text, jsonb, boolean, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const regions = pgTable("regions", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 20 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	parentCode: varchar("parent_code", { length: 20 }),
	level: integer().notNull(),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_regions_parent").using("btree", table.parentCode.asc().nullsLast().op("text_ops")),
	unique("regions_code_key").on(table.code),
]);

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	phone: varchar({ length: 20 }).notNull(),
	nickname: varchar({ length: 50 }).notNull(),
	avatar: varchar({ length: 500 }),
	passwordHash: varchar("password", { length: 255 }).notNull(),
	provinceCode: varchar("province_code", { length: 20 }),
	cityCode: varchar("city_code", { length: 20 }),
	districtCode: varchar("district_code", { length: 20 }),
	townCode: varchar("town_code", { length: 20 }),
	memberLevel: integer("member_level").default(0),
	memberExpireAt: timestamp("member_expire_at", { mode: 'string' }),
	todayPostCount: integer("today_post_count").default(0),
	lastPostDate: date("last_post_date"),
	totalLikes: integer("total_likes").default(0),
	totalPosts: integer("total_posts").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("users_phone_key").on(table.phone),
]);

export const posts = pgTable("posts", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	content: text().notNull(),
	images: jsonb().default([]),
	regionCode: varchar("region_code", { length: 20 }).notNull(),
	regionLevel: integer("region_level").notNull(),
	likeCount: integer("like_count").default(0),
	commentCount: integer("comment_count").default(0),
	isPinned: boolean("is_pinned").default(false),
	status: integer().default(1),
	expireAt: timestamp("expire_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_posts_created").using("btree", table.createdAt.desc().nullsFirst().op("timestamp_ops")),
	index("idx_posts_expire").using("btree", table.expireAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_posts_region").using("btree", table.regionCode.asc().nullsLast().op("text_ops")),
	index("idx_posts_user").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "posts_user_id_fkey"
		}),
]);

export const likes = pgTable("likes", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	postId: integer("post_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_likes_post").using("btree", table.postId.asc().nullsLast().op("int4_ops")),
	index("idx_likes_user").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "likes_user_id_fkey"
		}),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "likes_post_id_fkey"
		}),
	unique("likes_user_id_post_id_key").on(table.userId, table.postId),
]);

export const comments = pgTable("comments", {
	id: serial().primaryKey().notNull(),
	postId: integer("post_id").notNull(),
	userId: integer("user_id").notNull(),
	parentId: integer("parent_id"),
	content: text().notNull(),
	status: integer().default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_comments_post").using("btree", table.postId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "comments_post_id_fkey"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "comments_user_id_fkey"
		}),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "comments_parent_id_fkey"
		}),
]);

export const reports = pgTable("reports", {
	id: serial().primaryKey().notNull(),
	postId: integer("post_id"),
	userId: integer("user_id").notNull(),
	reason: varchar({ length: 500 }).notNull(),
	status: integer().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "reports_post_id_fkey"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "reports_user_id_fkey"
		}),
]);

export const follows = pgTable("follows", {
	id: serial().primaryKey().notNull(),
	followerId: integer("follower_id").notNull(),
	followingId: integer("following_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_follows_follower").using("btree", table.followerId.asc().nullsLast().op("int4_ops")),
	index("idx_follows_following").using("btree", table.followingId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.followerId],
			foreignColumns: [users.id],
			name: "follows_follower_id_fkey"
		}),
	foreignKey({
			columns: [table.followingId],
			foreignColumns: [users.id],
			name: "follows_following_id_fkey"
		}),
	unique("follows_follower_id_following_id_key").on(table.followerId, table.followingId),
]);

export const friends = pgTable("friends", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	friendId: integer("friend_id").notNull(),
	status: integer().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_friends_user").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "friends_user_id_fkey"
		}),
	foreignKey({
			columns: [table.friendId],
			foreignColumns: [users.id],
			name: "friends_friend_id_fkey"
		}),
	unique("friends_user_id_friend_id_key").on(table.userId, table.friendId),
]);

export const messages = pgTable("messages", {
	id: serial().primaryKey().notNull(),
	senderId: integer("sender_id").notNull(),
	receiverId: integer("receiver_id").notNull(),
	content: text().notNull(),
	isRead: boolean("is_read").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_messages_receiver").using("btree", table.receiverId.asc().nullsLast().op("int4_ops")),
	index("idx_messages_sender").using("btree", table.senderId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "messages_sender_id_fkey"
		}),
	foreignKey({
			columns: [table.receiverId],
			foreignColumns: [users.id],
			name: "messages_receiver_id_fkey"
		}),
]);

export const memberLevels = pgTable("member_levels", {
	id: serial().primaryKey().notNull(),
	level: integer().notNull(),
	name: varchar({ length: 50 }).notNull(),
	price: numeric({ precision: 10, scale:  2 }),
	regionLimit: integer("region_limit").notNull(),
	dailyLimit: integer("daily_limit").notNull(),
	retentionDays: integer("retention_days").notNull(),
	canPin: boolean("can_pin").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("member_levels_level_key").on(table.level),
]);

export const smsCodes = pgTable("sms_codes", {
	id: serial().primaryKey().notNull(),
	phone: varchar({ length: 20 }).notNull(),
	code: varchar({ length: 10 }).notNull(),
	expireAt: timestamp("expire_at", { mode: 'string' }).notNull(),
	used: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

// 收藏表
export const collections = pgTable("collections", {
	id: serial("id").primaryKey(),
	userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
	postId: integer("post_id").notNull().references(() => posts.id, { onDelete: 'cascade' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
	userIdx: index("collections_user_id_idx").on(table.userId),
	postIdx: index("collections_post_id_idx").on(table.postId),
	userPostUnique: unique("collections_user_post_unique").on(table.userId, table.postId),
}));

// 会话表
export const conversations = pgTable("conversations", {
	id: serial("id").primaryKey(),
	userId1: integer("user_id_1").notNull(),
	userId2: integer("user_id_2").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
	user1Idx: index("conversations_user_id_1_idx").on(table.userId1),
	user2Idx: index("conversations_user_id_2_idx").on(table.userId2),
}));

// 消息表
export const messages = pgTable("messages", {
	id: serial("id").primaryKey(),
	conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: 'cascade' }),
	senderId: integer("sender_id").notNull(),
	receiverId: integer("receiver_id").notNull(),
	content: text("content").notNull(),
	type: varchar("type", { length: 20 }).default("text"), // text, image, voice
	isRead: boolean("is_read").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
	conversationIdx: index("messages_conversation_id_idx").on(table.conversationId),
	senderIdx: index("messages_sender_id_idx").on(table.senderId),
	receiverIdx: index("messages_receiver_id_idx").on(table.receiverId),
}));
