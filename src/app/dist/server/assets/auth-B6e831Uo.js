import { z } from "zod";
const registerSchema = z.object({
  email: z.string().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username must be less than 30 characters").regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password must be less than 128 characters").regex(/[a-z]/, "Password must contain at least one lowercase letter").regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[0-9]/, "Password must contain at least one number"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  role: z.array(z.enum(["explorer", "creator", "admin"])).min(1).default(["explorer"])
});
const loginSchema = z.object({
  emailOrUsername: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required")
});
const passwordResetRequestSchema = z.object({
  email: z.string().email("Invalid email address")
});
const passwordResetSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password must be less than 128 characters").regex(/[a-z]/, "Password must contain at least one lowercase letter").regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[0-9]/, "Password must contain at least one number")
});
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(128, "Password must be less than 128 characters").regex(/[a-z]/, "Password must contain at least one lowercase letter").regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[0-9]/, "Password must contain at least one number")
});
const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters").optional(),
  avatarUrl: z.string().url("Invalid URL").optional().nullable(),
  defaultSessionDifficulty: z.enum(["easy", "medium", "hard"]).optional()
});
export {
  passwordResetSchema as a,
  changePasswordSchema as c,
  loginSchema as l,
  passwordResetRequestSchema as p,
  registerSchema as r,
  updateProfileSchema as u
};
