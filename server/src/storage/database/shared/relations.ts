import { relations } from "drizzle-orm/relations";
import { users, posts, likes, comments, reports, follows, friends, messages } from "./schema";

export const postsRelations = relations(posts, ({one, many}) => ({
	user: one(users, {
		fields: [posts.userId],
		references: [users.id]
	}),
	likes: many(likes),
	comments: many(comments),
	reports: many(reports),
}));

export const usersRelations = relations(users, ({many}) => ({
	posts: many(posts),
	likes: many(likes),
	comments: many(comments),
	reports: many(reports),
	follows_followerId: many(follows, {
		relationName: "follows_followerId_users_id"
	}),
	follows_followingId: many(follows, {
		relationName: "follows_followingId_users_id"
	}),
	friends_userId: many(friends, {
		relationName: "friends_userId_users_id"
	}),
	friends_friendId: many(friends, {
		relationName: "friends_friendId_users_id"
	}),
	messages_senderId: many(messages, {
		relationName: "messages_senderId_users_id"
	}),
	messages_receiverId: many(messages, {
		relationName: "messages_receiverId_users_id"
	}),
}));

export const likesRelations = relations(likes, ({one}) => ({
	user: one(users, {
		fields: [likes.userId],
		references: [users.id]
	}),
	post: one(posts, {
		fields: [likes.postId],
		references: [posts.id]
	}),
}));

export const commentsRelations = relations(comments, ({one, many}) => ({
	post: one(posts, {
		fields: [comments.postId],
		references: [posts.id]
	}),
	user: one(users, {
		fields: [comments.userId],
		references: [users.id]
	}),
	comment: one(comments, {
		fields: [comments.parentId],
		references: [comments.id],
		relationName: "comments_parentId_comments_id"
	}),
	comments: many(comments, {
		relationName: "comments_parentId_comments_id"
	}),
}));

export const reportsRelations = relations(reports, ({one}) => ({
	post: one(posts, {
		fields: [reports.postId],
		references: [posts.id]
	}),
	user: one(users, {
		fields: [reports.userId],
		references: [users.id]
	}),
}));

export const followsRelations = relations(follows, ({one}) => ({
	user_followerId: one(users, {
		fields: [follows.followerId],
		references: [users.id],
		relationName: "follows_followerId_users_id"
	}),
	user_followingId: one(users, {
		fields: [follows.followingId],
		references: [users.id],
		relationName: "follows_followingId_users_id"
	}),
}));

export const friendsRelations = relations(friends, ({one}) => ({
	user_userId: one(users, {
		fields: [friends.userId],
		references: [users.id],
		relationName: "friends_userId_users_id"
	}),
	user_friendId: one(users, {
		fields: [friends.friendId],
		references: [users.id],
		relationName: "friends_friendId_users_id"
	}),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	user_senderId: one(users, {
		fields: [messages.senderId],
		references: [users.id],
		relationName: "messages_senderId_users_id"
	}),
	user_receiverId: one(users, {
		fields: [messages.receiverId],
		references: [users.id],
		relationName: "messages_receiverId_users_id"
	}),
}));