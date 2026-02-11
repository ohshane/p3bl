import { D as DEFAULT_SETTINGS, S as SETTING_KEYS } from "./settings-CebgkGhm.js";
let cachedModel = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1e3;
async function getConfiguredAIModel() {
  const now = Date.now();
  if (cachedModel && now - cacheTimestamp < CACHE_DURATION) {
    return cachedModel;
  }
  try {
    const { getAIModel } = await import("./router-Bhor0jGk.js").then((n) => n.aN);
    const result = await getAIModel();
    if (result.success) {
      cachedModel = result.model;
      cacheTimestamp = now;
      return result.model;
    }
  } catch (error) {
    console.error("Failed to fetch AI model setting:", error);
  }
  const defaultModel = DEFAULT_SETTINGS[SETTING_KEYS.AI_MODEL];
  cachedModel = defaultModel;
  cacheTimestamp = now;
  return defaultModel;
}
export {
  getConfiguredAIModel as g
};
