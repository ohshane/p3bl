import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
const systemSettings = sqliteTable("system_settings", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedBy: text("updated_by")
  // User ID of last updater
});
const SETTING_KEYS = {
  AI_MODEL: "ai_model",
  AI_API_BASE: "ai_api_base"
};
const DEFAULT_SETTINGS = {
  [SETTING_KEYS.AI_MODEL]: "openrouter/auto",
  [SETTING_KEYS.AI_API_BASE]: "https://openrouter.ai/api/v1"
};
export {
  DEFAULT_SETTINGS as D,
  SETTING_KEYS as S,
  systemSettings as s
};
