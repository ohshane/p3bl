import { c as createServerRpc } from "./createServerRpc-Bd3B-Ah9.js";
import { and, eq, desc, count, sql } from "drizzle-orm";
import { v4 } from "uuid";
import { n as notifications, d as db } from "./index-kpcxYASC.js";
import "./settings-CebgkGhm.js";
import { z } from "zod";
import { c as createServerFn } from "../server.js";
import "better-sqlite3";
import "drizzle-orm/better-sqlite3";
import "drizzle-orm/sqlite-core";
import "path";
import "fs";
import "node:async_hooks";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
import "@tanstack/react-router";
const createNotificationSchema = z.object({
  userId: z.string(),
  type: z.enum(["new_feedback", "review_complete", "session_unlocked", "deadline_reminder", "team_message", "badge_earned", "level_up", "project_invitation", "ai_intervention", "system"]),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1e3),
  projectId: z.string().optional(),
  teamId: z.string().optional(),
  data: z.record(z.any()).optional(),
  actionUrl: z.string().optional()
});
const getUserNotifications_createServerFn_handler = createServerRpc({
  id: "0144e931adcadb2c5835e5ef35706bc547a0dcde12bef3285080f481d4fac3f4",
  name: "getUserNotifications",
  filename: "src/server/api/notifications.ts"
}, (opts, signal) => getUserNotifications.__executeServer(opts, signal));
const getUserNotifications = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getUserNotifications_createServerFn_handler, async ({
  data
}) => {
  try {
    const whereClause = data.unreadOnly ? and(eq(notifications.userId, data.userId), eq(notifications.isRead, false)) : eq(notifications.userId, data.userId);
    const notificationList = await db.query.notifications.findMany({
      where: whereClause,
      orderBy: desc(notifications.createdAt),
      limit: data.limit || 50,
      with: {
        project: true
      }
    });
    return {
      success: true,
      notifications: notificationList.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        projectId: n.projectId,
        projectTitle: n.project?.title,
        teamId: n.teamId,
        data: n.data ? JSON.parse(n.data) : null,
        actionUrl: n.actionUrl,
        createdAt: n.createdAt.toISOString(),
        readAt: n.readAt?.toISOString()
      }))
    };
  } catch (error) {
    console.error("Get notifications error:", error);
    return {
      success: false,
      error: "Failed to get notifications"
    };
  }
});
const getUnreadCount_createServerFn_handler = createServerRpc({
  id: "12c3233fba121ab71d9fd6368c20824d26be73c37403dc5040a7392317b3f146",
  name: "getUnreadCount",
  filename: "src/server/api/notifications.ts"
}, (opts, signal) => getUnreadCount.__executeServer(opts, signal));
const getUnreadCount = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getUnreadCount_createServerFn_handler, async ({
  data
}) => {
  try {
    const whereClause = data.projectId ? and(eq(notifications.userId, data.userId), eq(notifications.isRead, false), eq(notifications.projectId, data.projectId)) : and(eq(notifications.userId, data.userId), eq(notifications.isRead, false));
    const result = await db.select({
      count: count()
    }).from(notifications).where(whereClause);
    return {
      success: true,
      count: result[0]?.count || 0
    };
  } catch (error) {
    console.error("Get unread count error:", error);
    return {
      success: false,
      error: "Failed to get count"
    };
  }
});
const getUnreadCountsByProject_createServerFn_handler = createServerRpc({
  id: "1044aa5f0a361be8c8b80ed3e5cd06da7dd0256c40732f15eb158ce429086192",
  name: "getUnreadCountsByProject",
  filename: "src/server/api/notifications.ts"
}, (opts, signal) => getUnreadCountsByProject.__executeServer(opts, signal));
const getUnreadCountsByProject = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getUnreadCountsByProject_createServerFn_handler, async ({
  data
}) => {
  try {
    const result = await db.select({
      projectId: notifications.projectId,
      count: count()
    }).from(notifications).where(and(eq(notifications.userId, data.userId), eq(notifications.isRead, false))).groupBy(notifications.projectId);
    const counts = {};
    for (const row of result) {
      if (row.projectId) {
        counts[row.projectId] = row.count;
      }
    }
    return {
      success: true,
      counts
    };
  } catch (error) {
    console.error("Get unread counts by project error:", error);
    return {
      success: false,
      error: "Failed to get counts"
    };
  }
});
const markAsRead_createServerFn_handler = createServerRpc({
  id: "8baff8d1f43ad71ca7edd40bfbfd1610e4a3aeb3c6f783de51bd67bb98d1a8af",
  name: "markAsRead",
  filename: "src/server/api/notifications.ts"
}, (opts, signal) => markAsRead.__executeServer(opts, signal));
const markAsRead = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(markAsRead_createServerFn_handler, async ({
  data
}) => {
  try {
    await db.update(notifications).set({
      isRead: true,
      readAt: /* @__PURE__ */ new Date()
    }).where(eq(notifications.id, data.notificationId));
    return {
      success: true
    };
  } catch (error) {
    console.error("Mark as read error:", error);
    return {
      success: false,
      error: "Failed to mark as read"
    };
  }
});
const markAllAsRead_createServerFn_handler = createServerRpc({
  id: "f519f7d9ed3aa0d45b6ceb5961e06ec55c47d9fe1aa5c3e68ae4e70131128833",
  name: "markAllAsRead",
  filename: "src/server/api/notifications.ts"
}, (opts, signal) => markAllAsRead.__executeServer(opts, signal));
const markAllAsRead = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(markAllAsRead_createServerFn_handler, async ({
  data
}) => {
  try {
    const whereClause = data.projectId ? and(eq(notifications.userId, data.userId), eq(notifications.projectId, data.projectId)) : eq(notifications.userId, data.userId);
    await db.update(notifications).set({
      isRead: true,
      readAt: /* @__PURE__ */ new Date()
    }).where(whereClause);
    return {
      success: true
    };
  } catch (error) {
    console.error("Mark all as read error:", error);
    return {
      success: false,
      error: "Failed to mark all as read"
    };
  }
});
const createNotification_createServerFn_handler = createServerRpc({
  id: "fb1f0c9902ab14f7dcf3b31953db32440269cd2c3b85e16314e46686a59dab92",
  name: "createNotification",
  filename: "src/server/api/notifications.ts"
}, (opts, signal) => createNotification.__executeServer(opts, signal));
const createNotification = createServerFn({
  method: "POST"
}).inputValidator((data) => createNotificationSchema.parse(data)).handler(createNotification_createServerFn_handler, async ({
  data
}) => {
  try {
    const notificationId = v4();
    await db.insert(notifications).values({
      id: notificationId,
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      projectId: data.projectId,
      teamId: data.teamId,
      data: data.data ? JSON.stringify(data.data) : null,
      actionUrl: data.actionUrl,
      isRead: false,
      createdAt: /* @__PURE__ */ new Date()
    });
    return {
      success: true,
      notificationId
    };
  } catch (error) {
    console.error("Create notification error:", error);
    return {
      success: false,
      error: "Failed to create notification"
    };
  }
});
const deleteNotification_createServerFn_handler = createServerRpc({
  id: "681bca82a1d8acf243c1dfd6b5224b8c5d6e9300b05b021794680e153a80c3fa",
  name: "deleteNotification",
  filename: "src/server/api/notifications.ts"
}, (opts, signal) => deleteNotification.__executeServer(opts, signal));
const deleteNotification = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(deleteNotification_createServerFn_handler, async ({
  data
}) => {
  try {
    await db.delete(notifications).where(and(eq(notifications.id, data.notificationId), eq(notifications.userId, data.userId)));
    return {
      success: true
    };
  } catch (error) {
    console.error("Delete notification error:", error);
    return {
      success: false,
      error: "Failed to delete notification"
    };
  }
});
const clearOldNotifications_createServerFn_handler = createServerRpc({
  id: "5a44f522455635e0c81e5d726403f6b2173ee0007df8b0bbd50de6d117392a55",
  name: "clearOldNotifications",
  filename: "src/server/api/notifications.ts"
}, (opts, signal) => clearOldNotifications.__executeServer(opts, signal));
const clearOldNotifications = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(clearOldNotifications_createServerFn_handler, async ({
  data
}) => {
  try {
    const cutoff = /* @__PURE__ */ new Date();
    cutoff.setDate(cutoff.getDate() - (data.daysOld || 30));
    await db.delete(notifications).where(and(eq(notifications.userId, data.userId), eq(notifications.isRead, true), sql`${notifications.createdAt} < ${cutoff.getTime()}`));
    return {
      success: true
    };
  } catch (error) {
    console.error("Clear old notifications error:", error);
    return {
      success: false,
      error: "Failed to clear notifications"
    };
  }
});
const createBatchNotifications_createServerFn_handler = createServerRpc({
  id: "ac76e416755eb8ad31ab8260190af36afb7e484cea25809d1c2678e511d805a9",
  name: "createBatchNotifications",
  filename: "src/server/api/notifications.ts"
}, (opts, signal) => createBatchNotifications.__executeServer(opts, signal));
const createBatchNotifications = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createBatchNotifications_createServerFn_handler, async ({
  data
}) => {
  try {
    const now = /* @__PURE__ */ new Date();
    const notificationValues = data.userIds.map((userId) => ({
      id: v4(),
      userId,
      type: data.type,
      title: data.title,
      message: data.message,
      projectId: data.projectId,
      teamId: data.teamId,
      data: data.data ? JSON.stringify(data.data) : null,
      actionUrl: data.actionUrl,
      isRead: false,
      createdAt: now
    }));
    await db.insert(notifications).values(notificationValues);
    return {
      success: true,
      count: data.userIds.length
    };
  } catch (error) {
    console.error("Create batch notifications error:", error);
    return {
      success: false,
      error: "Failed to create notifications"
    };
  }
});
export {
  clearOldNotifications_createServerFn_handler,
  createBatchNotifications_createServerFn_handler,
  createNotification_createServerFn_handler,
  deleteNotification_createServerFn_handler,
  getUnreadCount_createServerFn_handler,
  getUnreadCountsByProject_createServerFn_handler,
  getUserNotifications_createServerFn_handler,
  markAllAsRead_createServerFn_handler,
  markAsRead_createServerFn_handler
};
