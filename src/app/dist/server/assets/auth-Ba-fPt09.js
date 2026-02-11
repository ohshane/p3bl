import { c as createServerRpc } from "./createServerRpc-Bd3B-Ah9.js";
import { v4 } from "uuid";
import { eq, or, and, gt } from "drizzle-orm";
import { d as db, u as users, h as serializeRoles, q as authSessions, e as parseRoles, r as passwordResets } from "./index-kpcxYASC.js";
import "./settings-CebgkGhm.js";
import { h as hashPassword, g as generateTokenPair, v as verifyPassword, a as verifyRefreshToken, b as generateAccessToken, c as generatePasswordResetToken } from "./jwt-BL3DR7ZR.js";
import { r as registerSchema, l as loginSchema, p as passwordResetRequestSchema, a as passwordResetSchema, u as updateProfileSchema, c as changePasswordSchema } from "./auth-B6e831Uo.js";
import { c as createServerFn } from "../server.js";
import "better-sqlite3";
import "drizzle-orm/better-sqlite3";
import "drizzle-orm/sqlite-core";
import "path";
import "fs";
import "bcryptjs";
import "jose";
import "zod";
import "node:async_hooks";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
import "@tanstack/react-router";
function generateAnonymizedName() {
  const adjectives = ["Swift", "Bright", "Calm", "Eager", "Bold", "Wise", "Kind"];
  const nouns = ["Explorer", "Pioneer", "Scholar", "Learner", "Voyager", "Seeker"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 9e3) + 1e3;
  return `${adj}${noun}_${num}`;
}
const register_createServerFn_handler = createServerRpc({
  id: "d70d0dc959691f288a1d6bb061271253757d5c26ecfe60b73b1adf205358b139",
  name: "register",
  filename: "src/server/api/auth.ts"
}, (opts, signal) => register.__executeServer(opts, signal));
const register = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const result = registerSchema.safeParse(data);
  if (!result.success) {
    throw new Error(JSON.stringify({
      error: "Validation failed",
      errors: result.error.flatten().fieldErrors
    }));
  }
  return result.data;
}).handler(register_createServerFn_handler, async ({
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
        error: "An account with this email already exists"
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
    const tokenData = await generateTokenPair({
      userId,
      email: data.email.toLowerCase(),
      role: roles
    });
    await db.insert(authSessions).values({
      id: tokenData.sessionId,
      userId,
      refreshToken: tokenData.refreshToken,
      expiresAt: tokenData.refreshTokenExpiresAt,
      createdAt: now
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
        defaultSessionDifficulty: "medium"
      },
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresAt: tokenData.accessTokenExpiresAt.toISOString()
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: "Failed to create account. Please try again."
    };
  }
});
const login_createServerFn_handler = createServerRpc({
  id: "df7b3306040ed694082e15cc572f25e57cc73554d6312f9167bdb556e4459c6b",
  name: "login",
  filename: "src/server/api/auth.ts"
}, (opts, signal) => login.__executeServer(opts, signal));
const login = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const result = loginSchema.safeParse(data);
  if (!result.success) {
    throw new Error(JSON.stringify({
      error: "Validation failed",
      errors: result.error.flatten().fieldErrors
    }));
  }
  return result.data;
}).handler(login_createServerFn_handler, async ({
  data
}) => {
  try {
    const input = data.emailOrUsername.trim().toLowerCase();
    const user = await db.query.users.findFirst({
      where: or(eq(users.email, input), eq(users.username, input))
    });
    if (!user) {
      return {
        success: false,
        error: "Invalid email/username or password"
      };
    }
    const isValid = await verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      return {
        success: false,
        error: "Invalid email/username or password"
      };
    }
    const roles = parseRoles(user.role);
    const tokenData = await generateTokenPair({
      userId: user.id,
      email: user.email,
      role: roles
    });
    await db.insert(authSessions).values({
      id: tokenData.sessionId,
      userId: user.id,
      refreshToken: tokenData.refreshToken,
      expiresAt: tokenData.refreshTokenExpiresAt,
      createdAt: /* @__PURE__ */ new Date()
    });
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
        defaultSessionDifficulty: user.defaultSessionDifficulty
      },
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresAt: tokenData.accessTokenExpiresAt.toISOString()
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: "Login failed. Please try again."
    };
  }
});
const refreshToken_createServerFn_handler = createServerRpc({
  id: "474ac745284967e838abce62a9aad7fbda98af979b1530328377c4ab43e2b148",
  name: "refreshToken",
  filename: "src/server/api/auth.ts"
}, (opts, signal) => refreshToken.__executeServer(opts, signal));
const refreshToken = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(refreshToken_createServerFn_handler, async ({
  data
}) => {
  try {
    const payload = await verifyRefreshToken(data.refreshToken);
    if (!payload || !payload.sessionId) {
      return {
        success: false,
        error: "Invalid refresh token"
      };
    }
    const session = await db.query.authSessions.findFirst({
      where: and(eq(authSessions.id, payload.sessionId), eq(authSessions.refreshToken, data.refreshToken), gt(authSessions.expiresAt, /* @__PURE__ */ new Date()))
    });
    if (!session) {
      return {
        success: false,
        error: "Session expired or invalid"
      };
    }
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.sub)
    });
    if (!user) {
      return {
        success: false,
        error: "User not found"
      };
    }
    const roles = parseRoles(user.role);
    const {
      token: accessToken,
      expiresAt
    } = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: roles
    });
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
        defaultSessionDifficulty: user.defaultSessionDifficulty
      },
      accessToken,
      refreshToken: data.refreshToken,
      // Return same refresh token
      expiresAt: expiresAt.toISOString()
    };
  } catch (error) {
    console.error("Token refresh error:", error);
    return {
      success: false,
      error: "Failed to refresh token"
    };
  }
});
const logout_createServerFn_handler = createServerRpc({
  id: "f8d0a46c159fa8cccae666d306a4550c033e4bd1a60341dfceaaad2d922d6fc8",
  name: "logout",
  filename: "src/server/api/auth.ts"
}, (opts, signal) => logout.__executeServer(opts, signal));
const logout = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(logout_createServerFn_handler, async ({
  data
}) => {
  try {
    await db.delete(authSessions).where(eq(authSessions.refreshToken, data.refreshToken));
    return {
      success: true
    };
  } catch (error) {
    console.error("Logout error:", error);
    return {
      success: false,
      error: "Logout failed"
    };
  }
});
const logoutAll_createServerFn_handler = createServerRpc({
  id: "4b0b4f16947036ab55a59d19341ff34e497b8f1e10377e7dcafb2b5e8c58cddf",
  name: "logoutAll",
  filename: "src/server/api/auth.ts"
}, (opts, signal) => logoutAll.__executeServer(opts, signal));
const logoutAll = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(logoutAll_createServerFn_handler, async ({
  data
}) => {
  try {
    await db.delete(authSessions).where(eq(authSessions.userId, data.userId));
    return {
      success: true
    };
  } catch (error) {
    console.error("Logout all error:", error);
    return {
      success: false,
      error: "Failed to logout all sessions"
    };
  }
});
const requestPasswordReset_createServerFn_handler = createServerRpc({
  id: "3477495b74e9128ba8cfef6e125b6f2bfd3df3b35e252f15954cc5fa8fe3d7e7",
  name: "requestPasswordReset",
  filename: "src/server/api/auth.ts"
}, (opts, signal) => requestPasswordReset.__executeServer(opts, signal));
const requestPasswordReset = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const result = passwordResetRequestSchema.safeParse(data);
  if (!result.success) {
    throw new Error("Invalid email");
  }
  return result.data;
}).handler(requestPasswordReset_createServerFn_handler, async ({
  data
}) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, data.email.toLowerCase())
    });
    const successMessage = "If an account exists with this email, you will receive a password reset link.";
    if (!user) {
      return {
        success: true,
        message: successMessage
      };
    }
    const {
      token,
      expiresAt
    } = generatePasswordResetToken();
    await db.insert(passwordResets).values({
      id: v4(),
      userId: user.id,
      token,
      expiresAt,
      createdAt: /* @__PURE__ */ new Date()
    });
    console.log(`Password reset token for ${user.email}: ${token}`);
    return {
      success: true,
      message: successMessage
    };
  } catch (error) {
    console.error("Password reset request error:", error);
    return {
      success: false,
      message: "Failed to process request"
    };
  }
});
const resetPassword_createServerFn_handler = createServerRpc({
  id: "77c119535ec1f3fa7c76d38395ca255538f35148f34e14756b4d9eda97ca5328",
  name: "resetPassword",
  filename: "src/server/api/auth.ts"
}, (opts, signal) => resetPassword.__executeServer(opts, signal));
const resetPassword = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const result = passwordResetSchema.safeParse(data);
  if (!result.success) {
    throw new Error(JSON.stringify({
      error: "Validation failed",
      errors: result.error.flatten().fieldErrors
    }));
  }
  return result.data;
}).handler(resetPassword_createServerFn_handler, async ({
  data
}) => {
  try {
    const resetRecord = await db.query.passwordResets.findFirst({
      where: and(eq(passwordResets.token, data.token), gt(passwordResets.expiresAt, /* @__PURE__ */ new Date()))
    });
    if (!resetRecord || resetRecord.usedAt) {
      return {
        success: false,
        error: "Invalid or expired reset token"
      };
    }
    const passwordHash = await hashPassword(data.password);
    await db.update(users).set({
      passwordHash,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, resetRecord.userId));
    await db.update(passwordResets).set({
      usedAt: /* @__PURE__ */ new Date()
    }).where(eq(passwordResets.id, resetRecord.id));
    await db.delete(authSessions).where(eq(authSessions.userId, resetRecord.userId));
    return {
      success: true
    };
  } catch (error) {
    console.error("Password reset error:", error);
    return {
      success: false,
      error: "Failed to reset password"
    };
  }
});
const getCurrentUser_createServerFn_handler = createServerRpc({
  id: "5b8538f661f885c121057ba7ef0cfc68e8b5bb035eaaa65914662b3fa4ee3b3e",
  name: "getCurrentUser",
  filename: "src/server/api/auth.ts"
}, (opts, signal) => getCurrentUser.__executeServer(opts, signal));
const getCurrentUser = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getCurrentUser_createServerFn_handler, async ({
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
        defaultSessionDifficulty: user.defaultSessionDifficulty,
        createdAt: user.createdAt.toISOString()
      }
    };
  } catch (error) {
    console.error("Get current user error:", error);
    return {
      success: false,
      error: "Failed to get user"
    };
  }
});
const updateProfile_createServerFn_handler = createServerRpc({
  id: "b6da098bd1e5bdc9627a38d876e34d3d2ae3282407fa6ce2c794fe85e712a963",
  name: "updateProfile",
  filename: "src/server/api/auth.ts"
}, (opts, signal) => updateProfile.__executeServer(opts, signal));
const updateProfile = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const result = updateProfileSchema.safeParse(data.updates);
  if (!result.success) {
    throw new Error(JSON.stringify({
      error: "Validation failed",
      errors: result.error.flatten().fieldErrors
    }));
  }
  return {
    userId: data.userId,
    updates: result.data
  };
}).handler(updateProfile_createServerFn_handler, async ({
  data
}) => {
  try {
    await db.update(users).set({
      ...data.updates,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, data.userId));
    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, data.userId)
    });
    if (!updatedUser) {
      return {
        success: false,
        error: "User not found"
      };
    }
    return {
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        name: updatedUser.name,
        role: parseRoles(updatedUser.role),
        avatarUrl: updatedUser.avatarUrl,
        xp: updatedUser.xp,
        level: updatedUser.level,
        defaultSessionDifficulty: updatedUser.defaultSessionDifficulty
      }
    };
  } catch (error) {
    console.error("Update profile error:", error);
    return {
      success: false,
      error: "Failed to update profile"
    };
  }
});
const changePassword_createServerFn_handler = createServerRpc({
  id: "e591b9862662c314d7bf62c3d3e92ee944602db6e63d24e72fe12929daaf8de5",
  name: "changePassword",
  filename: "src/server/api/auth.ts"
}, (opts, signal) => changePassword.__executeServer(opts, signal));
const changePassword = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const result = changePasswordSchema.safeParse(data.passwords);
  if (!result.success) {
    throw new Error(JSON.stringify({
      error: "Validation failed",
      errors: result.error.flatten().fieldErrors
    }));
  }
  return {
    userId: data.userId,
    passwords: result.data
  };
}).handler(changePassword_createServerFn_handler, async ({
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
    const isValid = await verifyPassword(data.passwords.currentPassword, user.passwordHash);
    if (!isValid) {
      return {
        success: false,
        error: "Current password is incorrect"
      };
    }
    const passwordHash = await hashPassword(data.passwords.newPassword);
    await db.update(users).set({
      passwordHash,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, data.userId));
    return {
      success: true
    };
  } catch (error) {
    console.error("Change password error:", error);
    return {
      success: false,
      error: "Failed to change password"
    };
  }
});
export {
  changePassword_createServerFn_handler,
  getCurrentUser_createServerFn_handler,
  login_createServerFn_handler,
  logoutAll_createServerFn_handler,
  logout_createServerFn_handler,
  refreshToken_createServerFn_handler,
  register_createServerFn_handler,
  requestPasswordReset_createServerFn_handler,
  resetPassword_createServerFn_handler,
  updateProfile_createServerFn_handler
};
