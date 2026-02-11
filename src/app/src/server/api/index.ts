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
  getProjectParticipants,
  removeParticipant,
  unremoveParticipant,
  searchDelegateUsers,
  delegateProject,
  cloneProjectAsTemplate,
  getLibraryTemplates,
  deployTemplate,
  publishTemplate,
  unpublishTemplate,
  getStoreTemplates,
  getStoreTemplate,
  cloneStoreTemplate,
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
  updateRubric,
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
  runExplorerPrecheck,
  createShowcaseLink,
  getShowcaseByToken,
  revokeShowcaseLink,
  getArtifactVersions,
  getArtifactVersion,
} from './artifacts'

// Chat functions
export {
  getOrCreateRoom,
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
  regradeSubmission,
  gradeSubmission,
  calculateTeamRisks,
  getAiPersonas,
} from './creator'

// AI proxy functions
export {
  aiChatCompletion,
  aiListModels,
} from './ai'

// Admin functions
export {
  listUsers,
  createUser,
  updateUserRole,
  deleteUser,
  getUserDetails,
  resetUserPassword,
  getAdminStats,
  getSystemSettings,
  getSystemSetting,
  updateSystemSetting,
  getAIModel,
} from './admin'
