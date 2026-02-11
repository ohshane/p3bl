import { create } from "zustand";
import { j as joinProject, f as getProjectTimeStatus, y as getUserProjects } from "./router-Bhor0jGk.js";
import { s as submitArtifact, u as updateArtifact, b as createArtifact, d as getUserSessionArtifacts, a as getUserArtifacts } from "./artifacts-V6YAL9mY.js";
const useProjectStore = create((set, get) => ({
  userProjects: [],
  userArtifacts: [],
  sessionArtifacts: {},
  isLoadingProjects: false,
  isLoadingArtifacts: false,
  projectsError: null,
  artifactsError: null,
  currentProjectId: null,
  activeTab: "opened",
  fetchUserProjects: async (userId) => {
    const hasProjects = get().userProjects.length > 0;
    if (!hasProjects) {
      set({ isLoadingProjects: true, projectsError: null });
    }
    try {
      const result = await getUserProjects({ data: { userId } });
      if (result.success && result.projects) {
        set({ userProjects: result.projects, isLoadingProjects: false });
      } else {
        set({ projectsError: result.error || "Failed to fetch projects", isLoadingProjects: false });
      }
    } catch (error) {
      if (!hasProjects) {
        set({ projectsError: "Failed to fetch projects", isLoadingProjects: false });
      }
    }
  },
  fetchUserArtifacts: async (userId) => {
    set({ isLoadingArtifacts: true, artifactsError: null });
    try {
      const result = await getUserArtifacts({ data: { userId } });
      if (result.success && result.artifacts) {
        set({ userArtifacts: result.artifacts, isLoadingArtifacts: false });
      } else {
        set({ artifactsError: result.error || "Failed to fetch artifacts", isLoadingArtifacts: false });
      }
    } catch (error) {
      set({ artifactsError: "Failed to fetch artifacts", isLoadingArtifacts: false });
    }
  },
  fetchSessionArtifacts: async (userId, sessionId) => {
    try {
      const result = await getUserSessionArtifacts({ data: { userId, sessionId } });
      if (result.success && result.artifacts) {
        set((state) => ({
          sessionArtifacts: {
            ...state.sessionArtifacts,
            [sessionId]: result.artifacts
          }
        }));
      }
    } catch (error) {
      console.error("Failed to fetch session artifacts:", error);
    }
  },
  getAllUserProjects: () => {
    return get().userProjects;
  },
  getScheduledProjects: () => {
    return get().userProjects.filter((p) => getProjectTimeStatus(p.startDate, p.endDate) === "scheduled");
  },
  getOpenedProjects: () => {
    return get().userProjects.filter((p) => getProjectTimeStatus(p.startDate, p.endDate) === "opened");
  },
  getClosedProjects: () => {
    return get().userProjects.filter((p) => getProjectTimeStatus(p.startDate, p.endDate) === "closed");
  },
  getWorkspaceMode: () => {
    return get().userProjects.length > 0 ? "active" : "onboarding";
  },
  setCurrentProject: (projectId) => {
    set({ currentProjectId: projectId });
  },
  setActiveTab: (tab) => {
    set({ activeTab: tab });
  },
  joinProject: async (userId, code) => {
    try {
      const result = await joinProject({ data: { userId, code } });
      if (result.success && result.projectId) {
        await get().fetchUserProjects(userId);
        return { success: true, projectId: result.projectId };
      }
      return { success: false, error: result.error || "Failed to join project" };
    } catch (error) {
      return { success: false, error: "Failed to join project" };
    }
  },
  createArtifact: async (data) => {
    try {
      const result = await createArtifact({ data });
      if (result.success && result.artifactId) {
        await get().fetchSessionArtifacts(data.userId, data.sessionId);
        return { success: true, artifactId: result.artifactId };
      }
      return { success: false, error: result.error || "Failed to create artifact" };
    } catch (error) {
      return { success: false, error: "Failed to create artifact" };
    }
  },
  updateArtifact: async (artifactId, updates) => {
    try {
      const result = await updateArtifact({ data: { artifactId, ...updates } });
      if (result.success) {
        set((state) => {
          const newSessionArtifacts = { ...state.sessionArtifacts };
          for (const sessionId of Object.keys(newSessionArtifacts)) {
            newSessionArtifacts[sessionId] = newSessionArtifacts[sessionId].map(
              (a) => a.id === artifactId ? { ...a, ...updates, updatedAt: (/* @__PURE__ */ new Date()).toISOString() } : a
            );
          }
          return { sessionArtifacts: newSessionArtifacts };
        });
        return { success: true };
      }
      return { success: false, error: result.error || "Failed to update artifact" };
    } catch (error) {
      return { success: false, error: "Failed to update artifact" };
    }
  },
  submitArtifact: async (artifactId, userId) => {
    try {
      const result = await submitArtifact({ data: { artifactId, userId } });
      if (result.success && result.version) {
        set((state) => {
          const newSessionArtifacts = { ...state.sessionArtifacts };
          for (const sessionId of Object.keys(newSessionArtifacts)) {
            newSessionArtifacts[sessionId] = newSessionArtifacts[sessionId].map(
              (a) => a.id === artifactId ? { ...a, status: "submitted", latestVersion: result.version, updatedAt: (/* @__PURE__ */ new Date()).toISOString() } : a
            );
          }
          return { sessionArtifacts: newSessionArtifacts };
        });
        return { success: true, version: result.version };
      }
      return { success: false, error: result.error || "Failed to submit artifact" };
    } catch (error) {
      return { success: false, error: "Failed to submit artifact" };
    }
  },
  getSessionArtifact: (sessionId) => {
    const artifacts = get().sessionArtifacts[sessionId];
    return artifacts?.[0];
  },
  clearCache: () => {
    set({
      userProjects: [],
      userArtifacts: [],
      sessionArtifacts: {},
      projectsError: null,
      artifactsError: null
    });
  }
}));
export {
  useProjectStore as u
};
