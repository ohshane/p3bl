import { c as createServerRpc } from "./createServerRpc-Bd3B-Ah9.js";
import { eq, desc } from "drizzle-orm";
import { d as db, u as users, v as userBadges, w as badges, x as competencyScores, y as xpTransactions } from "./index-kpcxYASC.js";
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
const getUserSchema = z.object({
  userId: z.string()
});
const updateUserSchema = z.object({
  userId: z.string(),
  name: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  defaultSessionDifficulty: z.enum(["easy", "medium", "hard"]).optional()
});
const addXpSchema = z.object({
  userId: z.string(),
  amount: z.number().int(),
  reason: z.string(),
  entityType: z.string().optional(),
  entityId: z.string().optional()
});
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1e3, 1500];
const LEVEL_NAMES = ["Newcomer", "Learner", "Explorer", "Navigator", "Pioneer", "Master"];
function calculateLevel(xp) {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const progress = Math.min(100, (xp - currentThreshold) / (nextThreshold - currentThreshold) * 100);
  return {
    level,
    name: LEVEL_NAMES[level - 1] || "Master",
    progress
  };
}
const getUser_createServerFn_handler = createServerRpc({
  id: "4e38d84a3f96180ccd0d938445b54912e3a91b228f0eeb3ec846427d409108f1",
  name: "getUser",
  filename: "src/server/api/users.ts"
}, (opts, signal) => getUser.__executeServer(opts, signal));
const getUser = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  return getUserSchema.parse(data);
}).handler(getUser_createServerFn_handler, async ({
  data
}) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, data.userId)
    });
    if (!user) {
      return {
        success: false,
        error: "User not found"
      };
    }
    const levelInfo = calculateLevel(user.xp);
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        xp: user.xp,
        level: levelInfo.level,
        levelName: levelInfo.name,
        levelProgress: levelInfo.progress,
        anonymizedName: user.anonymizedName,
        defaultSessionDifficulty: user.defaultSessionDifficulty,
        createdAt: user.createdAt.toISOString()
      }
    };
  } catch (error) {
    console.error("Get user error:", error);
    return {
      success: false,
      error: "Failed to get user"
    };
  }
});
const updateUser_createServerFn_handler = createServerRpc({
  id: "b674e84f4c520f18a82fb513f806555ae87d273e79037d0eebd51652c3b973bc",
  name: "updateUser",
  filename: "src/server/api/users.ts"
}, (opts, signal) => updateUser.__executeServer(opts, signal));
const updateUser = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  return updateUserSchema.parse(data);
}).handler(updateUser_createServerFn_handler, async ({
  data
}) => {
  try {
    const {
      userId,
      ...updates
    } = data;
    await db.update(users).set({
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, userId));
    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    if (!updatedUser) {
      return {
        success: false,
        error: "User not found"
      };
    }
    const levelInfo = calculateLevel(updatedUser.xp);
    return {
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        avatarUrl: updatedUser.avatarUrl,
        xp: updatedUser.xp,
        level: levelInfo.level,
        levelName: levelInfo.name,
        defaultSessionDifficulty: updatedUser.defaultSessionDifficulty
      }
    };
  } catch (error) {
    console.error("Update user error:", error);
    return {
      success: false,
      error: "Failed to update user"
    };
  }
});
const getUserBadges_createServerFn_handler = createServerRpc({
  id: "1a6a9496f680af8f9ce44b65a7593dd840ba69db4d1c3d39b885d0619035d5d1",
  name: "getUserBadges",
  filename: "src/server/api/users.ts"
}, (opts, signal) => getUserBadges.__executeServer(opts, signal));
const getUserBadges = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getUserBadges_createServerFn_handler, async ({
  data
}) => {
  try {
    const earnedBadges = await db.select({
      badge: badges,
      earnedAt: userBadges.earnedAt,
      context: userBadges.context
    }).from(userBadges).innerJoin(badges, eq(userBadges.badgeId, badges.id)).where(eq(userBadges.userId, data.userId)).orderBy(desc(userBadges.earnedAt));
    const allBadges = await db.query.badges.findMany({
      where: eq(badges.isActive, true)
    });
    const earnedIds = new Set(earnedBadges.map((b) => b.badge.id));
    return {
      success: true,
      earned: earnedBadges.map((b) => ({
        ...b.badge,
        earnedAt: b.earnedAt.toISOString(),
        context: b.context ? JSON.parse(b.context) : null
      })),
      available: allBadges.filter((b) => !earnedIds.has(b.id))
    };
  } catch (error) {
    console.error("Get user badges error:", error);
    return {
      success: false,
      error: "Failed to get badges"
    };
  }
});
const getUserCompetencies_createServerFn_handler = createServerRpc({
  id: "c7296286e7842edbf568895224fc586b2882be5b3f5a9eeae14a5ba72affc34c",
  name: "getUserCompetencies",
  filename: "src/server/api/users.ts"
}, (opts, signal) => getUserCompetencies.__executeServer(opts, signal));
const getUserCompetencies = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getUserCompetencies_createServerFn_handler, async ({
  data
}) => {
  try {
    const query = data.projectId ? db.query.competencyScores.findMany({
      where: (scores2, {
        and,
        eq: eq2
      }) => and(eq2(scores2.userId, data.userId), eq2(scores2.projectId, data.projectId))
    }) : db.query.competencyScores.findMany({
      where: eq(competencyScores.userId, data.userId)
    });
    const scores = await query;
    return {
      success: true,
      competencies: scores.map((s) => ({
        ...s,
        lastCalculatedAt: s.lastCalculatedAt.toISOString(),
        createdAt: s.createdAt.toISOString()
      }))
    };
  } catch (error) {
    console.error("Get user competencies error:", error);
    return {
      success: false,
      error: "Failed to get competencies"
    };
  }
});
const addUserXp_createServerFn_handler = createServerRpc({
  id: "57c8b0d960da3e4626a1e8c6194891a29aa8a8fd9c8a9fb288a0452cc08068f5",
  name: "addUserXp",
  filename: "src/server/api/users.ts"
}, (opts, signal) => addUserXp.__executeServer(opts, signal));
const addUserXp = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  return addXpSchema.parse(data);
}).handler(addUserXp_createServerFn_handler, async ({
  data
}) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, data.userId)
    });
    if (!user) {
      return {
        success: false,
        error: "User not found"
      };
    }
    const newXp = user.xp + data.amount;
    const levelInfo = calculateLevel(newXp);
    const previousLevel = calculateLevel(user.xp).level;
    const leveledUp = levelInfo.level > previousLevel;
    await db.update(users).set({
      xp: newXp,
      level: levelInfo.level,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, data.userId));
    await db.insert(xpTransactions).values({
      id: crypto.randomUUID(),
      userId: data.userId,
      amount: data.amount,
      reason: data.reason,
      entityType: data.entityType,
      entityId: data.entityId,
      createdAt: /* @__PURE__ */ new Date()
    });
    return {
      success: true,
      xp: newXp,
      level: levelInfo.level,
      levelName: levelInfo.name,
      leveledUp
    };
  } catch (error) {
    console.error("Add XP error:", error);
    return {
      success: false,
      error: "Failed to add XP"
    };
  }
});
const getUserXpHistory_createServerFn_handler = createServerRpc({
  id: "68e8031c61fa6688bca0bcacc43e0a6ef765d92d7f1456d0d2bfd4cd766b71b8",
  name: "getUserXpHistory",
  filename: "src/server/api/users.ts"
}, (opts, signal) => getUserXpHistory.__executeServer(opts, signal));
const getUserXpHistory = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getUserXpHistory_createServerFn_handler, async ({
  data
}) => {
  try {
    const transactions = await db.query.xpTransactions.findMany({
      where: eq(xpTransactions.userId, data.userId),
      orderBy: desc(xpTransactions.createdAt),
      limit: data.limit || 50
    });
    return {
      success: true,
      transactions: transactions.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString()
      }))
    };
  } catch (error) {
    console.error("Get XP history error:", error);
    return {
      success: false,
      error: "Failed to get XP history"
    };
  }
});
export {
  addUserXp_createServerFn_handler,
  getUserBadges_createServerFn_handler,
  getUserCompetencies_createServerFn_handler,
  getUserXpHistory_createServerFn_handler,
  getUser_createServerFn_handler,
  updateUser_createServerFn_handler
};
