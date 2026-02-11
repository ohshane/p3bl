import { c as createServerRpc } from "./createServerRpc-Bd3B-Ah9.js";
import { asc, and, eq, lt, gt, desc } from "drizzle-orm";
import { v5, v4 } from "uuid";
import { d as db, z as chatRooms, A as chatRoomMembers, B as chatMessages, C as messageReactions, D as floatingBotMessages, t as teams, E as aiPersonas } from "./index-kpcxYASC.js";
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
const sendMessageSchema = z.object({
  roomId: z.string(),
  userId: z.string().optional(),
  // null for AI messages
  personaId: z.string().optional(),
  // for AI messages
  content: z.string().min(1).max(1e4),
  type: z.enum(["text", "artifact_share", "system", "ai_intervention"]).default("text"),
  metadata: z.record(z.string(), z.any()).optional(),
  replyToId: z.string().optional()
});
const getMessagesSchema = z.object({
  roomId: z.string(),
  limit: z.number().int().min(1).max(100).default(50),
  before: z.string().optional(),
  // message ID to paginate before
  after: z.string().optional()
  // message ID to paginate after
});
const getOrCreateRoomSchema = z.object({
  projectId: z.string(),
  teamId: z.string(),
  userId: z.string(),
  roomName: z.string().optional()
});
const TEAM_CHAT_ROOM_NAMESPACE = "2be24c77-8d1e-4b80-85c4-c45ae914f2f2";
const getOrCreateRoom_createServerFn_handler = createServerRpc({
  id: "22d9687f50e0c302a9fbb77bc13bcd0bd6a3ecf265051672b9915bfd02c8bf2c",
  name: "getOrCreateRoom",
  filename: "src/server/api/chat.ts"
}, (opts, signal) => getOrCreateRoom.__executeServer(opts, signal));
const getOrCreateRoom = createServerFn({
  method: "POST"
}).inputValidator((data) => getOrCreateRoomSchema.parse(data)).handler(getOrCreateRoom_createServerFn_handler, async ({
  data
}) => {
  try {
    const existingRooms = await db.query.chatRooms.findMany({
      where: and(eq(chatRooms.projectId, data.projectId), eq(chatRooms.teamId, data.teamId)),
      orderBy: asc(chatRooms.createdAt)
    });
    let roomId;
    let roomName;
    if (existingRooms.length > 0) {
      const canonical = existingRooms[0];
      roomId = canonical.id;
      roomName = canonical.name;
      if (existingRooms.length > 1) {
        console.warn("[chat-room] duplicate rooms detected, using canonical room", {
          projectId: data.projectId,
          teamId: data.teamId,
          canonicalRoomId: roomId,
          duplicateRoomIds: existingRooms.slice(1).map((r) => r.id)
        });
      }
    } else {
      roomId = v5(`${data.projectId}:${data.teamId}`, TEAM_CHAT_ROOM_NAMESPACE);
      roomName = data.roomName || "Group Chat";
      const now = /* @__PURE__ */ new Date();
      await db.insert(chatRooms).values({
        id: roomId,
        projectId: data.projectId,
        teamId: data.teamId,
        name: roomName,
        createdAt: now,
        updatedAt: now
      }).onConflictDoNothing();
    }
    await db.insert(chatRoomMembers).values({
      roomId,
      userId: data.userId,
      joinedAt: /* @__PURE__ */ new Date()
    }).onConflictDoNothing();
    return {
      success: true,
      room: {
        id: roomId,
        projectId: data.projectId,
        teamId: data.teamId,
        name: roomName
      }
    };
  } catch (error) {
    console.error("Get or create room error:", error);
    return {
      success: false,
      error: "Failed to get or create room"
    };
  }
});
const sendMessage_createServerFn_handler = createServerRpc({
  id: "4f1a7d38c754881dc34fd2c6d1276823d891a3e754052ad17b3966637daa6c75",
  name: "sendMessage",
  filename: "src/server/api/chat.ts"
}, (opts, signal) => sendMessage.__executeServer(opts, signal));
const sendMessage = createServerFn({
  method: "POST"
}).inputValidator((data) => sendMessageSchema.parse(data)).handler(sendMessage_createServerFn_handler, async ({
  data
}) => {
  try {
    const messageId = v4();
    const now = /* @__PURE__ */ new Date();
    await db.insert(chatMessages).values({
      id: messageId,
      roomId: data.roomId,
      userId: data.userId,
      personaId: data.personaId,
      content: data.content,
      type: data.type,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      replyToId: data.replyToId,
      isEdited: false,
      createdAt: now,
      updatedAt: now
    });
    const message = await db.query.chatMessages.findFirst({
      where: eq(chatMessages.id, messageId),
      with: {
        user: true,
        persona: true,
        replyTo: {
          with: {
            user: true,
            persona: true
          }
        }
      }
    });
    return {
      success: true,
      message: message ? {
        id: message.id,
        content: message.content,
        type: message.type,
        metadata: message.metadata ? JSON.parse(message.metadata) : null,
        createdAt: message.createdAt.toISOString(),
        sender: message.user ? {
          id: message.user.id,
          name: message.user.name,
          avatarUrl: message.user.avatarUrl,
          type: "user"
        } : message.persona ? {
          id: message.persona.id,
          name: message.persona.name,
          avatar: message.persona.avatar,
          type: "ai",
          personaType: message.persona.type
        } : null,
        replyTo: message.replyTo ? {
          id: message.replyTo.id,
          content: message.replyTo.content.substring(0, 100),
          senderName: message.replyTo.user?.name || message.replyTo.persona?.name || "Unknown"
        } : null
      } : null
    };
  } catch (error) {
    console.error("Send message error:", error);
    return {
      success: false,
      error: "Failed to send message"
    };
  }
});
const getMessages_createServerFn_handler = createServerRpc({
  id: "b89be771863ad7fc81d33de53a476cade68474436bd7a93449270cec2ac9abde",
  name: "getMessages",
  filename: "src/server/api/chat.ts"
}, (opts, signal) => getMessages.__executeServer(opts, signal));
const getMessages = createServerFn({
  method: "GET"
}).inputValidator((data) => getMessagesSchema.parse(data)).handler(getMessages_createServerFn_handler, async ({
  data
}) => {
  try {
    let whereClause = eq(chatMessages.roomId, data.roomId);
    if (data.before) {
      const beforeMsg = await db.query.chatMessages.findFirst({
        where: eq(chatMessages.id, data.before)
      });
      if (beforeMsg) {
        whereClause = and(eq(chatMessages.roomId, data.roomId), lt(chatMessages.createdAt, beforeMsg.createdAt));
      }
    }
    if (data.after) {
      const afterMsg = await db.query.chatMessages.findFirst({
        where: eq(chatMessages.id, data.after)
      });
      if (afterMsg) {
        whereClause = and(eq(chatMessages.roomId, data.roomId), gt(chatMessages.createdAt, afterMsg.createdAt));
      }
    }
    const messages = await db.query.chatMessages.findMany({
      where: whereClause,
      orderBy: desc(chatMessages.createdAt),
      limit: data.limit,
      with: {
        user: true,
        persona: true,
        replyTo: {
          with: {
            user: true,
            persona: true
          }
        },
        reactions: {
          with: {
            user: true
          }
        }
      }
    });
    const orderedMessages = messages.reverse();
    return {
      success: true,
      messages: orderedMessages.map((m) => ({
        id: m.id,
        content: m.content,
        type: m.type,
        metadata: m.metadata ? JSON.parse(m.metadata) : null,
        isEdited: m.isEdited,
        createdAt: m.createdAt.toISOString(),
        sender: m.user ? {
          id: m.user.id,
          name: m.user.name,
          avatarUrl: m.user.avatarUrl,
          type: "user"
        } : m.persona ? {
          id: m.persona.id,
          name: m.persona.name,
          avatar: m.persona.avatar,
          type: "ai",
          personaType: m.persona.type
        } : null,
        replyTo: m.replyTo ? {
          id: m.replyTo.id,
          content: m.replyTo.content.substring(0, 100),
          senderName: m.replyTo.user?.name || m.replyTo.persona?.name || "Unknown"
        } : null,
        reactions: m.reactions.map((r) => ({
          emoji: r.emoji,
          userId: r.user.id,
          userName: r.user.name
        }))
      })),
      hasMore: messages.length === data.limit
    };
  } catch (error) {
    console.error("Get messages error:", error);
    return {
      success: false,
      error: "Failed to get messages"
    };
  }
});
const editMessage_createServerFn_handler = createServerRpc({
  id: "78d6d4e5e8536b9b5a4589c82badea70b600ff7e2ba7f734d4f7ebabcae0a153",
  name: "editMessage",
  filename: "src/server/api/chat.ts"
}, (opts, signal) => editMessage.__executeServer(opts, signal));
const editMessage = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(editMessage_createServerFn_handler, async ({
  data
}) => {
  try {
    const message = await db.query.chatMessages.findFirst({
      where: and(eq(chatMessages.id, data.messageId), eq(chatMessages.userId, data.userId))
    });
    if (!message) {
      return {
        success: false,
        error: "Message not found or not authorized"
      };
    }
    await db.update(chatMessages).set({
      content: data.content,
      isEdited: true,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(chatMessages.id, data.messageId));
    return {
      success: true
    };
  } catch (error) {
    console.error("Edit message error:", error);
    return {
      success: false,
      error: "Failed to edit message"
    };
  }
});
const deleteMessage_createServerFn_handler = createServerRpc({
  id: "c6389a0181611453122debda7ec885974d385e2651c260fa8bd5ac0411e0c60c",
  name: "deleteMessage",
  filename: "src/server/api/chat.ts"
}, (opts, signal) => deleteMessage.__executeServer(opts, signal));
const deleteMessage = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(deleteMessage_createServerFn_handler, async ({
  data
}) => {
  try {
    const message = await db.query.chatMessages.findFirst({
      where: and(eq(chatMessages.id, data.messageId), eq(chatMessages.userId, data.userId))
    });
    if (!message) {
      return {
        success: false,
        error: "Message not found or not authorized"
      };
    }
    await db.delete(chatMessages).where(eq(chatMessages.id, data.messageId));
    return {
      success: true
    };
  } catch (error) {
    console.error("Delete message error:", error);
    return {
      success: false,
      error: "Failed to delete message"
    };
  }
});
const addReaction_createServerFn_handler = createServerRpc({
  id: "aec1a315663e2b6667631de06138d0588ad0af26b9d461e7bfc36348f87f7d33",
  name: "addReaction",
  filename: "src/server/api/chat.ts"
}, (opts, signal) => addReaction.__executeServer(opts, signal));
const addReaction = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(addReaction_createServerFn_handler, async ({
  data
}) => {
  try {
    const existing = await db.query.messageReactions.findFirst({
      where: and(eq(messageReactions.messageId, data.messageId), eq(messageReactions.userId, data.userId), eq(messageReactions.emoji, data.emoji))
    });
    if (existing) {
      await db.delete(messageReactions).where(eq(messageReactions.id, existing.id));
      return {
        success: true,
        action: "removed"
      };
    }
    await db.insert(messageReactions).values({
      id: v4(),
      messageId: data.messageId,
      userId: data.userId,
      emoji: data.emoji,
      createdAt: /* @__PURE__ */ new Date()
    });
    return {
      success: true,
      action: "added"
    };
  } catch (error) {
    console.error("Add reaction error:", error);
    return {
      success: false,
      error: "Failed to add reaction"
    };
  }
});
const sendFloatingBotMessage_createServerFn_handler = createServerRpc({
  id: "cea61e7c93a8e9e5a2a4744673f884930bca0d522a581346079ae9fe16789a94",
  name: "sendFloatingBotMessage",
  filename: "src/server/api/chat.ts"
}, (opts, signal) => sendFloatingBotMessage.__executeServer(opts, signal));
const sendFloatingBotMessage = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(sendFloatingBotMessage_createServerFn_handler, async ({
  data
}) => {
  try {
    const messageId = v4();
    await db.insert(floatingBotMessages).values({
      id: messageId,
      userId: data.userId,
      role: data.role,
      content: data.content,
      createdAt: /* @__PURE__ */ new Date()
    });
    return {
      success: true,
      messageId
    };
  } catch (error) {
    console.error("Send floating bot message error:", error);
    return {
      success: false,
      error: "Failed to send message"
    };
  }
});
const getFloatingBotMessages_createServerFn_handler = createServerRpc({
  id: "b5038eb2290f81f7ff67357f619bf80ca96a8d2d098d05588d32a097ebbda59a",
  name: "getFloatingBotMessages",
  filename: "src/server/api/chat.ts"
}, (opts, signal) => getFloatingBotMessages.__executeServer(opts, signal));
const getFloatingBotMessages = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getFloatingBotMessages_createServerFn_handler, async ({
  data
}) => {
  try {
    const messages = await db.query.floatingBotMessages.findMany({
      where: eq(floatingBotMessages.userId, data.userId),
      orderBy: desc(floatingBotMessages.createdAt),
      limit: data.limit || 50
    });
    return {
      success: true,
      messages: messages.reverse().map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString()
      }))
    };
  } catch (error) {
    console.error("Get floating bot messages error:", error);
    return {
      success: false,
      error: "Failed to get messages"
    };
  }
});
const getTeamPersonas_createServerFn_handler = createServerRpc({
  id: "3a539797e52d9ff1fc86cfbc178b4cbe145080407a5f85702b65dd990e199e05",
  name: "getTeamPersonas",
  filename: "src/server/api/chat.ts"
}, (opts, signal) => getTeamPersonas.__executeServer(opts, signal));
const getTeamPersonas = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getTeamPersonas_createServerFn_handler, async ({
  data
}) => {
  try {
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, data.teamId),
      with: {
        aiPersonas: {
          with: {
            persona: true
          }
        }
      }
    });
    if (!team) {
      return {
        success: false,
        error: "Team not found"
      };
    }
    return {
      success: true,
      personas: team.aiPersonas.map((ap) => ({
        id: ap.persona.id,
        name: ap.persona.name,
        type: ap.persona.type,
        description: ap.persona.description,
        avatar: ap.persona.avatar,
        traits: ap.persona.traits ? JSON.parse(ap.persona.traits) : [],
        expertise: ap.persona.expertise ? JSON.parse(ap.persona.expertise) : []
      }))
    };
  } catch (error) {
    console.error("Get team personas error:", error);
    return {
      success: false,
      error: "Failed to get personas"
    };
  }
});
const getAllPersonas_createServerFn_handler = createServerRpc({
  id: "2945f52eb3ea2d2f40721dc567474d34835ae51c729047fd4a50a4a07db2bd75",
  name: "getAllPersonas",
  filename: "src/server/api/chat.ts"
}, (opts, signal) => getAllPersonas.__executeServer(opts, signal));
const getAllPersonas = createServerFn({
  method: "GET"
}).handler(getAllPersonas_createServerFn_handler, async () => {
  try {
    const personas = await db.query.aiPersonas.findMany({
      where: eq(aiPersonas.isActive, true)
    });
    return {
      success: true,
      personas: personas.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        description: p.description,
        avatar: p.avatar,
        traits: p.traits ? JSON.parse(p.traits) : [],
        expertise: p.expertise ? JSON.parse(p.expertise) : []
      }))
    };
  } catch (error) {
    console.error("Get all personas error:", error);
    return {
      success: false,
      error: "Failed to get personas"
    };
  }
});
export {
  addReaction_createServerFn_handler,
  deleteMessage_createServerFn_handler,
  editMessage_createServerFn_handler,
  getAllPersonas_createServerFn_handler,
  getFloatingBotMessages_createServerFn_handler,
  getMessages_createServerFn_handler,
  getOrCreateRoom_createServerFn_handler,
  getTeamPersonas_createServerFn_handler,
  sendFloatingBotMessage_createServerFn_handler,
  sendMessage_createServerFn_handler
};
