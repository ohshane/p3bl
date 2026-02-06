import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// System settings table - key-value store for app configuration
export const systemSettings = sqliteTable('system_settings', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedBy: text('updated_by'), // User ID of last updater
})

// Predefined setting keys
export const SETTING_KEYS = {
  AI_MODEL: 'ai_model',
  AI_API_BASE: 'ai_api_base',
} as const

export type SettingKey = typeof SETTING_KEYS[keyof typeof SETTING_KEYS]

// Default values for settings
export const DEFAULT_SETTINGS: Record<SettingKey, string> = {
  [SETTING_KEYS.AI_MODEL]: 'openrouter/auto',
  [SETTING_KEYS.AI_API_BASE]: 'https://openrouter.ai/api/v1',
}
