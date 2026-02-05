/**
 * P3BL Server API
 *
 * This file exports all server functions for the P3BL application.
 * These functions use TanStack Start's createServerFn for type-safe
 * server-side operations with automatic client-side integration.
 */

// Auth functions
export {
  register,
  login,
  logout,
  logoutAll,
  refreshToken,
  getCurrentUser,
  updateProfile,
  requestPasswordReset,
  resetPassword,
  changePassword,
  type AuthResponse,
} from './auth'

// User functions
export {
  getUser,
  updateUser,
  getUserBadges,
  getUserCompetencies,
  addUserXp,
  getUserXpHistory,
  getLeaderboard,
} from './users'

// Project functions
export {
  getCreatorProjects,
  getUserProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  joinProject,
  resetJoinCode,
  getUserInvitations,
  respondToInvitation,
} from './projects'

// Session functions
export {
  getSession,
  getProjectSessions,
  createSession,
  updateSession,
  deleteSession,
  reorderSessions,
  addResource,
  deleteResource,
  addRubric,
  deleteRubric,
  updateUserCurrentSession,
  addTemplate,
} from './sessions'

// Artifact functions
export {
  getArtifact,
  getUserSessionArtifacts,
  getUserArtifacts,
  createArtifact,
  updateArtifact,
  submitArtifact,
  storePrecheckResults,
  createShowcaseLink,
  getShowcaseByToken,
  revokeShowcaseLink,
  getArtifactVersions,
  getArtifactVersion,
} from './artifacts'

// Chat functions
export {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  addReaction,
  sendFloatingBotMessage,
  getFloatingBotMessages,
  getTeamPersonas,
  getAllPersonas,
} from './chat'

// Notification functions
export {
  getUserNotifications,
  getUnreadCount,
  getUnreadCountsByProject,
  markAsRead,
  markAllAsRead,
  createNotification,
  deleteNotification,
  clearOldNotifications,
  createBatchNotifications,
} from './notifications'

// Creator dashboard functions
export {
  getCreatorDashboardStats,
  getProjectTeamsWithProgress,
  getLearningMetrics,
  recordLearningMetric,
  getProjectInterventions,
  createIntervention,
  updateInterventionStatus,
  getProjectSubmissions,
  calculateTeamRisks,
  getAiPersonas,
} from './creator'
