import { DEFAULT_SETTINGS, SETTING_KEYS } from '@/db/schema/settings'

// Cache for the AI model to avoid repeated API calls
let cachedModel: string | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Get the configured AI model from system settings.
 * Uses a cache to avoid repeated API calls.
 * 
 * This fetches from a simple API endpoint instead of using server functions
 * to avoid issues with SSR and module loading.
 */
export async function getConfiguredAIModel(): Promise<string> {
  const now = Date.now()
  
  // Return cached value if still valid
  if (cachedModel && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedModel
  }

  try {
    // Use the server function via dynamic import
    const { getAIModel } = await import('@/server/api/admin')
    const result = await getAIModel()
    
    if (result.success) {
      cachedModel = result.model
      cacheTimestamp = now
      return result.model
    }
  } catch (error) {
    console.error('Failed to fetch AI model setting:', error)
  }

  // Return default if API fails
  const defaultModel = DEFAULT_SETTINGS[SETTING_KEYS.AI_MODEL]
  cachedModel = defaultModel
  cacheTimestamp = now
  return defaultModel
}

/**
 * Clear the AI model cache (useful when settings are updated)
 */
export function clearAIModelCache(): void {
  cachedModel = null
  cacheTimestamp = 0
}

/**
 * Get the default AI model (for use without async)
 */
export function getDefaultAIModel(): string {
  return DEFAULT_SETTINGS[SETTING_KEYS.AI_MODEL]
}
