import { c as createServerRpc } from "./createServerRpc-Bd3B-Ah9.js";
import { v4 } from "uuid";
import { or, like, sql, asc, desc, eq, gte } from "drizzle-orm";
import { u as users, d as db, e as parseRoles, h as serializeRoles } from "./index-kpcxYASC.js";
import { s as systemSettings, S as SETTING_KEYS, D as DEFAULT_SETTINGS } from "./settings-CebgkGhm.js";
import { h as hashPassword } from "./jwt-BL3DR7ZR.js";
import { z } from "zod";
import { c as createServerFn } from "../server.js";
import "better-sqlite3";
import "drizzle-orm/better-sqlite3";
import "drizzle-orm/sqlite-core";
import "path";
import "fs";
import "bcryptjs";
import "jose";
import "node:async_hooks";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
import "@tanstack/react-router";
const listUsersSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(["explorer", "creator", "admin"]).optional(),
  sortBy: z.enum(["name", "email", "createdAt", "role"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc")
});
const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters").max(30).regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  role: z.array(z.enum(["explorer", "creator", "admin"])).min(1, "At least one role is required")
});
const updateUserRoleSchema = z.object({
  userId: z.string(),
  role: z.array(z.enum(["explorer", "creator", "admin"])).min(1, "At least one role is required")
});
const deleteUserSchema = z.object({
  userId: z.string()
});
function generateAnonymizedName() {
  const adjectives = ["Swift", "Bright", "Calm", "Eager", "Bold", "Wise", "Kind"];
  const nouns = ["Explorer", "Pioneer", "Scholar", "Learner", "Voyager", "Seeker"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 9e3) + 1e3;
  return `${adj}${noun}_${num}`;
}
const listUsers_createServerFn_handler = createServerRpc({
  id: "47a259c86e4e4c509f552ef3be68a777844b86c38d775ea3cb27f10b9fd77ade",
  name: "listUsers",
  filename: "src/server/api/admin.ts"
}, (opts, signal) => listUsers.__executeServer(opts, signal));
const listUsers = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  return listUsersSchema.parse(data);
}).handler(listUsers_createServerFn_handler, async ({
  data
}) => {
  try {
    const {
      page,
      limit,
      search,
      role,
      sortBy,
      sortOrder
    } = data;
    const offset = (page - 1) * limit;
    let whereConditions = [];
    if (search) {
      const searchPattern = `%${search}%`;
      whereConditions.push(or(like(users.name, searchPattern), like(users.username, searchPattern), like(users.email, searchPattern)));
    }
    if (role) {
      whereConditions.push(like(users.role, `%"${role}"%`));
    }
    const countResult = await db.select({
      count: sql`count(*)`
    }).from(users).where(whereConditions.length > 0 ? whereConditions[0] : void 0);
    const total = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit);
    const sortColumn = sortBy === "name" ? users.name : sortBy === "email" ? users.email : sortBy === "role" ? users.role : users.createdAt;
    const orderFn = sortOrder === "asc" ? asc : desc;
    let query = db.select({
      id: users.id,
      email: users.email,
      username: users.username,
      name: users.name,
      role: users.role,
      avatarUrl: users.avatarUrl,
      xp: users.xp,
      level: users.level,
      createdAt: users.createdAt
    }).from(users).orderBy(orderFn(sortColumn)).limit(limit).offset(offset);
    if (whereConditions.length > 0) {
      query = query.where(whereConditions[0]);
    }
    const userResults = await query;
    return {
      success: true,
      users: userResults.map((u) => ({
        ...u,
        role: parseRoles(u.role),
        createdAt: u.createdAt.toISOString()
      })),
      total,
      page,
      limit,
      totalPages
    };
  } catch (error) {
    console.error("List users error:", error);
    return {
      success: false,
      error: "Failed to list users"
    };
  }
});
const createUser_createServerFn_handler = createServerRpc({
  id: "5f8b7430af7f276020ef59ac9aa988681c57f02624fbf962aa6adad723d1bebc",
  name: "createUser",
  filename: "src/server/api/admin.ts"
}, (opts, signal) => createUser.__executeServer(opts, signal));
const createUser = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const result = createUserSchema.safeParse(data);
  if (!result.success) {
    throw new Error(JSON.stringify({
      error: "Validation failed",
      errors: result.error.flatten().fieldErrors
    }));
  }
  return result.data;
}).handler(createUser_createServerFn_handler, async ({
  data
}) => {
  try {
    const usernameLower = data.username.toLowerCase();
    const existingEmail = await db.query.users.findFirst({
      where: eq(users.email, data.email.toLowerCase())
    });
    if (existingEmail) {
      return {
        success: false,
        error: "A user with this email already exists"
      };
    }
    const existingUsername = await db.query.users.findFirst({
      where: eq(users.username, usernameLower)
    });
    if (existingUsername) {
      return {
        success: false,
        error: "This username is already taken"
      };
    }
    const passwordHash = await hashPassword(data.password);
    const userId = v4();
    const now = /* @__PURE__ */ new Date();
    const roles = data.role;
    await db.insert(users).values({
      id: userId,
      email: data.email.toLowerCase(),
      username: usernameLower,
      passwordHash,
      name: data.name,
      role: serializeRoles(roles),
      xp: 0,
      level: 1,
      anonymizedName: generateAnonymizedName(),
      createdAt: now,
      updatedAt: now
    });
    return {
      success: true,
      user: {
        id: userId,
        email: data.email.toLowerCase(),
        username: usernameLower,
        name: data.name,
        role: roles,
        avatarUrl: null,
        xp: 0,
        level: 1,
        createdAt: now.toISOString()
      },
      message: `User ${data.name} created successfully`
    };
  } catch (error) {
    console.error("Create user error:", error);
    return {
      success: false,
      error: "Failed to create user"
    };
  }
});
const updateUserRole_createServerFn_handler = createServerRpc({
  id: "fc4623321573eac174526b4cdab8ad3644c95af96e32d0ca4d18632df7acafbd",
  name: "updateUserRole",
  filename: "src/server/api/admin.ts"
}, (opts, signal) => updateUserRole.__executeServer(opts, signal));
const updateUserRole = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  return updateUserRoleSchema.parse(data);
}).handler(updateUserRole_createServerFn_handler, async ({
  data
}) => {
  try {
    const {
      userId,
      role: newRoles
    } = data;
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    if (!user) {
      return {
        success: false,
        error: "User not found"
      };
    }
    const currentRoles = parseRoles(user.role);
    if (currentRoles.includes("admin") && !newRoles.includes("admin")) {
      const adminCount = await db.select({
        count: sql`count(*)`
      }).from(users).where(like(users.role, '%"admin"%'));
      if (Number(adminCount[0]?.count || 0) <= 1) {
        return {
          success: false,
          error: "Cannot remove admin role from the last admin"
        };
      }
    }
    const roles = newRoles;
    await db.update(users).set({
      role: serializeRoles(roles),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, userId));
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: roles,
        avatarUrl: user.avatarUrl,
        xp: user.xp,
        level: user.level,
        createdAt: user.createdAt.toISOString()
      },
      message: `User roles updated to ${roles.join(", ")}`
    };
  } catch (error) {
    console.error("Update user role error:", error);
    return {
      success: false,
      error: "Failed to update user role"
    };
  }
});
const deleteUser_createServerFn_handler = createServerRpc({
  id: "4e36c9220b8fe994fcc5d6437a5a14660ca836e3fc5bb105a3b12cc8c665c599",
  name: "deleteUser",
  filename: "src/server/api/admin.ts"
}, (opts, signal) => deleteUser.__executeServer(opts, signal));
const deleteUser = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  return deleteUserSchema.parse(data);
}).handler(deleteUser_createServerFn_handler, async ({
  data
}) => {
  try {
    const {
      userId
    } = data;
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    if (!user) {
      return {
        success: false,
        error: "User not found"
      };
    }
    const userRoles = parseRoles(user.role);
    if (userRoles.includes("admin")) {
      const adminCount = await db.select({
        count: sql`count(*)`
      }).from(users).where(like(users.role, '%"admin"%'));
      if (Number(adminCount[0]?.count || 0) <= 1) {
        return {
          success: false,
          error: "Cannot delete the last admin"
        };
      }
    }
    await db.delete(users).where(eq(users.id, userId));
    return {
      success: true,
      message: `User ${user.name} deleted successfully`
    };
  } catch (error) {
    console.error("Delete user error:", error);
    return {
      success: false,
      error: "Failed to delete user"
    };
  }
});
const getUserDetails_createServerFn_handler = createServerRpc({
  id: "dc6aa13381f21d807ea21e2f11f84f602c78fdeff34923b90f5e73c7c0f4b241",
  name: "getUserDetails",
  filename: "src/server/api/admin.ts"
}, (opts, signal) => getUserDetails.__executeServer(opts, signal));
const getUserDetails = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getUserDetails_createServerFn_handler, async ({
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
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: parseRoles(user.role),
        avatarUrl: user.avatarUrl,
        xp: user.xp,
        level: user.level,
        anonymizedName: user.anonymizedName,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      }
    };
  } catch (error) {
    console.error("Get user details error:", error);
    return {
      success: false,
      error: "Failed to get user details"
    };
  }
});
const resetUserPassword_createServerFn_handler = createServerRpc({
  id: "78ecad17be445d6a6781db4186d11621ae54ba039b7b1b243fe45efa3bb25dc9",
  name: "resetUserPassword",
  filename: "src/server/api/admin.ts"
}, (opts, signal) => resetUserPassword.__executeServer(opts, signal));
const resetUserPassword = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  if (data.newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  return data;
}).handler(resetUserPassword_createServerFn_handler, async ({
  data
}) => {
  try {
    const {
      userId,
      newPassword
    } = data;
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    if (!user) {
      return {
        success: false,
        error: "User not found"
      };
    }
    const passwordHash = await hashPassword(newPassword);
    await db.update(users).set({
      passwordHash,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, userId));
    return {
      success: true,
      message: `Password reset for ${user.name}`
    };
  } catch (error) {
    console.error("Reset user password error:", error);
    return {
      success: false,
      error: "Failed to reset password"
    };
  }
});
const getAdminStats_createServerFn_handler = createServerRpc({
  id: "e63ad3d46385de059d65eddab4459349d905e32966d15fd4b2bf27ff2bc5e04a",
  name: "getAdminStats",
  filename: "src/server/api/admin.ts"
}, (opts, signal) => getAdminStats.__executeServer(opts, signal));
const getAdminStats = createServerFn({
  method: "GET"
}).handler(getAdminStats_createServerFn_handler, async () => {
  try {
    const [totalUsers] = await db.select({
      count: sql`count(*)`
    }).from(users);
    const [explorers] = await db.select({
      count: sql`count(*)`
    }).from(users).where(like(users.role, '%"explorer"%'));
    const [creators] = await db.select({
      count: sql`count(*)`
    }).from(users).where(like(users.role, '%"creator"%'));
    const [admins] = await db.select({
      count: sql`count(*)`
    }).from(users).where(like(users.role, '%"admin"%'));
    const sevenDaysAgo = /* @__PURE__ */ new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt
    }).from(users).where(gte(users.createdAt, sevenDaysAgo)).orderBy(desc(users.createdAt)).limit(5);
    return {
      success: true,
      stats: {
        totalUsers: Number(totalUsers.count),
        explorers: Number(explorers.count),
        creators: Number(creators.count),
        admins: Number(admins.count)
      },
      recentUsers: recentUsers.map((u) => ({
        ...u,
        role: parseRoles(u.role),
        createdAt: u.createdAt.toISOString()
      }))
    };
  } catch (error) {
    console.error("Get admin stats error:", error);
    return {
      success: false,
      error: "Failed to get stats"
    };
  }
});
const getSystemSettings_createServerFn_handler = createServerRpc({
  id: "855a38ea38ff3de80b1029f3b1e7b120f4ccc36b3df64ad35176c76403deaf63",
  name: "getSystemSettings",
  filename: "src/server/api/admin.ts"
}, (opts, signal) => getSystemSettings.__executeServer(opts, signal));
const getSystemSettings = createServerFn({
  method: "GET"
}).handler(getSystemSettings_createServerFn_handler, async () => {
  try {
    const dbSettings = await db.select().from(systemSettings);
    const settingsMap = new Map(dbSettings.map((s) => [s.key, s]));
    const allSettings = Object.entries(SETTING_KEYS).map(([, key]) => {
      const dbSetting = settingsMap.get(key);
      if (dbSetting) {
        return {
          key: dbSetting.key,
          value: dbSetting.value,
          description: dbSetting.description,
          updatedAt: dbSetting.updatedAt.toISOString()
        };
      }
      return {
        key,
        value: DEFAULT_SETTINGS[key],
        description: null,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    });
    return {
      success: true,
      settings: allSettings
    };
  } catch (error) {
    console.error("Get system settings error:", error);
    const defaultSettings = Object.entries(SETTING_KEYS).map(([, key]) => ({
      key,
      value: DEFAULT_SETTINGS[key],
      description: null,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }));
    return {
      success: true,
      settings: defaultSettings
    };
  }
});
const getSystemSetting_createServerFn_handler = createServerRpc({
  id: "cdee01f9917689bb20aa811742ad36d5fc505ccb12a479df3c7cc6ead5de3897",
  name: "getSystemSetting",
  filename: "src/server/api/admin.ts"
}, (opts, signal) => getSystemSetting.__executeServer(opts, signal));
const getSystemSetting = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getSystemSetting_createServerFn_handler, async ({
  data
}) => {
  try {
    const setting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, data.key)
    });
    if (setting) {
      return {
        success: true,
        value: setting.value
      };
    }
    const defaultValue = DEFAULT_SETTINGS[data.key];
    if (defaultValue) {
      return {
        success: true,
        value: defaultValue
      };
    }
    return {
      success: false,
      error: "Setting not found"
    };
  } catch (error) {
    console.error("Get system setting error:", error);
    return {
      success: false,
      error: "Failed to get setting"
    };
  }
});
const updateSystemSetting_createServerFn_handler = createServerRpc({
  id: "d54a709fe3d33a2f5d84b61545574910e4748eec156519a5c564fe9a7543324d",
  name: "updateSystemSetting",
  filename: "src/server/api/admin.ts"
}, (opts, signal) => updateSystemSetting.__executeServer(opts, signal));
const updateSystemSetting = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  if (!data.key || typeof data.value !== "string") {
    throw new Error("Invalid setting data");
  }
  return data;
}).handler(updateSystemSetting_createServerFn_handler, async ({
  data
}) => {
  try {
    const {
      key,
      value,
      updatedBy
    } = data;
    const now = /* @__PURE__ */ new Date();
    const existing = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, key)
    });
    if (existing) {
      await db.update(systemSettings).set({
        value,
        updatedAt: now,
        updatedBy
      }).where(eq(systemSettings.key, key));
    } else {
      await db.insert(systemSettings).values({
        id: v4(),
        key,
        value,
        updatedAt: now,
        updatedBy
      });
    }
    return {
      success: true,
      setting: {
        key,
        value,
        description: existing?.description || null,
        updatedAt: now.toISOString()
      }
    };
  } catch (error) {
    console.error("Update system setting error:", error);
    return {
      success: false,
      error: "Failed to update setting"
    };
  }
});
const getAIModel_createServerFn_handler = createServerRpc({
  id: "798774a76b55ce0d3e8744f8e9deb2964d6c47265683aff87704a7222691360d",
  name: "getAIModel",
  filename: "src/server/api/admin.ts"
}, (opts, signal) => getAIModel.__executeServer(opts, signal));
const getAIModel = createServerFn({
  method: "GET"
}).handler(getAIModel_createServerFn_handler, async () => {
  try {
    const settings = await db.select().from(systemSettings).where(eq(systemSettings.key, SETTING_KEYS.AI_MODEL)).limit(1);
    const setting = settings[0];
    return {
      success: true,
      model: setting?.value || DEFAULT_SETTINGS[SETTING_KEYS.AI_MODEL]
    };
  } catch (error) {
    console.error("Get AI model error:", error);
    return {
      success: true,
      model: DEFAULT_SETTINGS[SETTING_KEYS.AI_MODEL]
    };
  }
});
export {
  createUser_createServerFn_handler,
  deleteUser_createServerFn_handler,
  getAIModel_createServerFn_handler,
  getAdminStats_createServerFn_handler,
  getSystemSetting_createServerFn_handler,
  getSystemSettings_createServerFn_handler,
  getUserDetails_createServerFn_handler,
  listUsers_createServerFn_handler,
  resetUserPassword_createServerFn_handler,
  updateSystemSetting_createServerFn_handler,
  updateUserRole_createServerFn_handler
};
