import { c as createServerRpc } from "./createServerRpc-Bd3B-Ah9.js";
import { eq, asc, and } from "drizzle-orm";
import { v4 } from "uuid";
import { d as db, c as projectSessions, s as sessionResources, f as sessionRubrics, a as teamMembers, g as sessionTemplates, p as projects } from "./index-kpcxYASC.js";
import "./settings-CebgkGhm.js";
import { z } from "zod";
import { c as createServerFn } from "../server.js";
import "better-sqlite3";
import "drizzle-orm/better-sqlite3";
import "drizzle-orm/sqlite-core";
import "path";
import "fs";
import "node:async_hooks";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
import "@tanstack/react-router";
async function recomputeSessionDates(projectId) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: {
      startDate: true,
      isTemplate: true
    }
  });
  if (!project || project.isTemplate || !project.startDate) return;
  const sessions = await db.query.projectSessions.findMany({
    where: eq(projectSessions.projectId, projectId),
    orderBy: asc(projectSessions.order),
    columns: {
      id: true,
      durationMinutes: true
    }
  });
  if (sessions.length === 0) return;
  let cursor = project.startDate.getTime();
  for (const session of sessions) {
    const durationMs = (session.durationMinutes || 60) * 60 * 1e3;
    const sessionStart = new Date(cursor);
    const sessionEnd = new Date(cursor + durationMs);
    cursor = sessionEnd.getTime();
    await db.update(projectSessions).set({
      startDate: sessionStart,
      endDate: sessionEnd,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(projectSessions.id, session.id));
  }
  await db.update(projects).set({
    endDate: new Date(cursor),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(projects.id, projectId));
}
const createSessionSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1).max(200),
  topic: z.string().optional(),
  guide: z.string().optional(),
  weight: z.number().min(1).max(200).default(1),
  durationMinutes: z.number().min(1).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  deliverableType: z.enum(["none", "document"]).default("document"),
  deliverableTitle: z.string().optional(),
  deliverableDescription: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  llmModel: z.string().optional()
});
const addResourceSchema = z.object({
  sessionId: z.string(),
  type: z.enum(["pdf", "link", "video", "document", "image"]),
  title: z.string().min(1).max(200),
  url: z.string().url().optional(),
  filePath: z.string().optional()
});
const addRubricSchema = z.object({
  sessionId: z.string(),
  criteria: z.string().min(1).max(500),
  description: z.string().optional(),
  weight: z.number().min(0).max(100).default(1)
});
const getSession_createServerFn_handler = createServerRpc({
  id: "ee028596de00c19ae1c62031ee5c4e27a1eece15c66a00f0054e3c604adba6e8",
  name: "getSession",
  filename: "src/server/api/sessions.ts"
}, (opts, signal) => getSession.__executeServer(opts, signal));
const getSession = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getSession_createServerFn_handler, async ({
  data
}) => {
  try {
    const session = await db.query.projectSessions.findFirst({
      where: eq(projectSessions.id, data.sessionId),
      with: {
        resources: {
          orderBy: (r, {
            asc: asc2
          }) => [asc2(r.order)]
        },
        rubrics: {
          orderBy: (r, {
            asc: asc2
          }) => [asc2(r.order)]
        },
        templates: {
          orderBy: (t, {
            asc: asc2
          }) => [asc2(t.order)]
        }
      }
    });
    if (!session) {
      return {
        success: false,
        error: "Session not found"
      };
    }
    return {
      success: true,
      session: {
        ...session,
        durationMinutes: session.durationMinutes ?? null,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        startDate: session.startDate?.toISOString(),
        endDate: session.endDate?.toISOString()
      }
    };
  } catch (error) {
    console.error("Get session error:", error);
    return {
      success: false,
      error: "Failed to get session"
    };
  }
});
const getProjectSessions_createServerFn_handler = createServerRpc({
  id: "47f60f7ec2f70fd840260f3b2e5f09169dd9ad9c2ba66aac2d4e908008c883b7",
  name: "getProjectSessions",
  filename: "src/server/api/sessions.ts"
}, (opts, signal) => getProjectSessions.__executeServer(opts, signal));
const getProjectSessions = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getProjectSessions_createServerFn_handler, async ({
  data
}) => {
  try {
    const sessions = await db.query.projectSessions.findMany({
      where: eq(projectSessions.projectId, data.projectId),
      orderBy: asc(projectSessions.order),
      with: {
        resources: true,
        rubrics: true
      }
    });
    return {
      success: true,
      sessions: sessions.map((s) => ({
        ...s,
        durationMinutes: s.durationMinutes ?? null,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        startDate: s.startDate?.toISOString(),
        endDate: s.endDate?.toISOString()
      }))
    };
  } catch (error) {
    console.error("Get project sessions error:", error);
    return {
      success: false,
      error: "Failed to get sessions"
    };
  }
});
const createSession_createServerFn_handler = createServerRpc({
  id: "6f8f77a46933436f03b541469e5cf4268cf65e903441aabeb6834a3dd2f49fa3",
  name: "createSession",
  filename: "src/server/api/sessions.ts"
}, (opts, signal) => createSession.__executeServer(opts, signal));
const createSession = createServerFn({
  method: "POST"
}).inputValidator((data) => createSessionSchema.parse(data)).handler(createSession_createServerFn_handler, async ({
  data
}) => {
  try {
    const existingSessions = await db.query.projectSessions.findMany({
      where: eq(projectSessions.projectId, data.projectId)
    });
    const maxOrder = existingSessions.reduce((max, s) => Math.max(max, s.order), 0);
    const sessionId = v4();
    const now = /* @__PURE__ */ new Date();
    await db.insert(projectSessions).values({
      id: sessionId,
      projectId: data.projectId,
      order: maxOrder + 1,
      title: data.title,
      topic: data.topic,
      guide: data.guide,
      weight: data.weight,
      durationMinutes: data.durationMinutes ?? null,
      difficulty: data.difficulty,
      deliverableType: data.deliverableType,
      deliverableTitle: data.deliverableTitle,
      deliverableDescription: data.deliverableDescription,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      llmModel: data.llmModel,
      createdAt: now,
      updatedAt: now
    });
    await recomputeSessionDates(data.projectId);
    return {
      success: true,
      sessionId
    };
  } catch (error) {
    console.error("Create session error:", error);
    return {
      success: false,
      error: "Failed to create session"
    };
  }
});
const updateSession_createServerFn_handler = createServerRpc({
  id: "b1c2449e815effc1ccf47a035b31f935baa85039c1eec6a0f8e7bf0fcb5d350f",
  name: "updateSession",
  filename: "src/server/api/sessions.ts"
}, (opts, signal) => updateSession.__executeServer(opts, signal));
const updateSession = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(updateSession_createServerFn_handler, async ({
  data
}) => {
  try {
    const updates = {
      ...data.updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (data.updates.startDate) {
      updates.startDate = new Date(data.updates.startDate);
    }
    if (data.updates.endDate) {
      updates.endDate = new Date(data.updates.endDate);
    }
    if (data.updates.durationMinutes !== void 0) {
      updates.durationMinutes = data.updates.durationMinutes;
    }
    await db.update(projectSessions).set(updates).where(eq(projectSessions.id, data.sessionId));
    if (data.updates.durationMinutes !== void 0) {
      const session = await db.query.projectSessions.findFirst({
        where: eq(projectSessions.id, data.sessionId),
        columns: {
          projectId: true
        }
      });
      if (session) {
        await recomputeSessionDates(session.projectId);
      }
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("Update session error:", error);
    return {
      success: false,
      error: "Failed to update session"
    };
  }
});
const deleteSession_createServerFn_handler = createServerRpc({
  id: "43eb9bf718586fedb0f4125504a9fc0ea654155a00985a931a6c10e337a41a7f",
  name: "deleteSession",
  filename: "src/server/api/sessions.ts"
}, (opts, signal) => deleteSession.__executeServer(opts, signal));
const deleteSession = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(deleteSession_createServerFn_handler, async ({
  data
}) => {
  try {
    const session = await db.query.projectSessions.findFirst({
      where: eq(projectSessions.id, data.sessionId)
    });
    if (!session) {
      return {
        success: false,
        error: "Session not found"
      };
    }
    await db.delete(projectSessions).where(eq(projectSessions.id, data.sessionId));
    const remainingSessions = await db.query.projectSessions.findMany({
      where: eq(projectSessions.projectId, session.projectId),
      orderBy: asc(projectSessions.order)
    });
    for (let i = 0; i < remainingSessions.length; i++) {
      await db.update(projectSessions).set({
        order: i + 1
      }).where(eq(projectSessions.id, remainingSessions[i].id));
    }
    await recomputeSessionDates(session.projectId);
    return {
      success: true
    };
  } catch (error) {
    console.error("Delete session error:", error);
    return {
      success: false,
      error: "Failed to delete session"
    };
  }
});
const reorderSessions_createServerFn_handler = createServerRpc({
  id: "c6175aeb1d4c7b0e00cc49827b15a670396b51e8561fe8f30451b4e4782734ac",
  name: "reorderSessions",
  filename: "src/server/api/sessions.ts"
}, (opts, signal) => reorderSessions.__executeServer(opts, signal));
const reorderSessions = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(reorderSessions_createServerFn_handler, async ({
  data
}) => {
  try {
    for (let i = 0; i < data.sessionIds.length; i++) {
      await db.update(projectSessions).set({
        order: i + 1,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(projectSessions.id, data.sessionIds[i]));
    }
    if (data.sessionIds.length > 0) {
      const first = await db.query.projectSessions.findFirst({
        where: eq(projectSessions.id, data.sessionIds[0]),
        columns: {
          projectId: true
        }
      });
      if (first) {
        await recomputeSessionDates(first.projectId);
      }
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("Reorder sessions error:", error);
    return {
      success: false,
      error: "Failed to reorder sessions"
    };
  }
});
const addResource_createServerFn_handler = createServerRpc({
  id: "d9335971500660f0ea2e18fd08f62421a882def53a4f12ec14e02bb388effa93",
  name: "addResource",
  filename: "src/server/api/sessions.ts"
}, (opts, signal) => addResource.__executeServer(opts, signal));
const addResource = createServerFn({
  method: "POST"
}).inputValidator((data) => addResourceSchema.parse(data)).handler(addResource_createServerFn_handler, async ({
  data
}) => {
  try {
    const existingResources = await db.query.sessionResources.findMany({
      where: eq(sessionResources.sessionId, data.sessionId)
    });
    const resourceId = v4();
    await db.insert(sessionResources).values({
      id: resourceId,
      sessionId: data.sessionId,
      type: data.type,
      title: data.title,
      url: data.url,
      filePath: data.filePath,
      order: existingResources.length,
      createdAt: /* @__PURE__ */ new Date()
    });
    return {
      success: true,
      resourceId
    };
  } catch (error) {
    console.error("Add resource error:", error);
    return {
      success: false,
      error: "Failed to add resource"
    };
  }
});
const deleteResource_createServerFn_handler = createServerRpc({
  id: "cb2dc9e3c8176e0690e27c852fb07d78de50e9e318ceee1054613427b9dde2f8",
  name: "deleteResource",
  filename: "src/server/api/sessions.ts"
}, (opts, signal) => deleteResource.__executeServer(opts, signal));
const deleteResource = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(deleteResource_createServerFn_handler, async ({
  data
}) => {
  try {
    await db.delete(sessionResources).where(eq(sessionResources.id, data.resourceId));
    return {
      success: true
    };
  } catch (error) {
    console.error("Delete resource error:", error);
    return {
      success: false,
      error: "Failed to delete resource"
    };
  }
});
const addRubric_createServerFn_handler = createServerRpc({
  id: "583ff1cd85136d9b081ba707656ed3bf3d6c762c235b1df74cfade2ef8dbedca",
  name: "addRubric",
  filename: "src/server/api/sessions.ts"
}, (opts, signal) => addRubric.__executeServer(opts, signal));
const addRubric = createServerFn({
  method: "POST"
}).inputValidator((data) => addRubricSchema.parse(data)).handler(addRubric_createServerFn_handler, async ({
  data
}) => {
  try {
    const existingRubrics = await db.query.sessionRubrics.findMany({
      where: eq(sessionRubrics.sessionId, data.sessionId)
    });
    const rubricId = v4();
    await db.insert(sessionRubrics).values({
      id: rubricId,
      sessionId: data.sessionId,
      criteria: data.criteria,
      description: data.description,
      weight: data.weight,
      order: existingRubrics.length,
      createdAt: /* @__PURE__ */ new Date()
    });
    return {
      success: true,
      rubricId
    };
  } catch (error) {
    console.error("Add rubric error:", error);
    return {
      success: false,
      error: "Failed to add rubric"
    };
  }
});
const updateRubric_createServerFn_handler = createServerRpc({
  id: "87e95df5413ddcef70d5e7e17359e29e2c305ccc728d32e55ca7409d7aaa5386",
  name: "updateRubric",
  filename: "src/server/api/sessions.ts"
}, (opts, signal) => updateRubric.__executeServer(opts, signal));
const updateRubric = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(updateRubric_createServerFn_handler, async ({
  data
}) => {
  try {
    await db.update(sessionRubrics).set(data.updates).where(eq(sessionRubrics.id, data.rubricId));
    return {
      success: true
    };
  } catch (error) {
    console.error("Update rubric error:", error);
    return {
      success: false,
      error: "Failed to update rubric"
    };
  }
});
const deleteRubric_createServerFn_handler = createServerRpc({
  id: "b1d176b80c2cb5278495fa511d7ea2191aa76410880bfee065570fa503f01dfa",
  name: "deleteRubric",
  filename: "src/server/api/sessions.ts"
}, (opts, signal) => deleteRubric.__executeServer(opts, signal));
const deleteRubric = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(deleteRubric_createServerFn_handler, async ({
  data
}) => {
  try {
    await db.delete(sessionRubrics).where(eq(sessionRubrics.id, data.rubricId));
    return {
      success: true
    };
  } catch (error) {
    console.error("Delete rubric error:", error);
    return {
      success: false,
      error: "Failed to delete rubric"
    };
  }
});
const updateUserCurrentSession_createServerFn_handler = createServerRpc({
  id: "edb636e8a0f74b5f69011272f1ff41612a81d72d9c9f9c61ea0efe289a37d202",
  name: "updateUserCurrentSession",
  filename: "src/server/api/sessions.ts"
}, (opts, signal) => updateUserCurrentSession.__executeServer(opts, signal));
const updateUserCurrentSession = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(updateUserCurrentSession_createServerFn_handler, async ({
  data
}) => {
  try {
    await db.update(teamMembers).set({
      currentSessionId: data.sessionId
    }).where(and(eq(teamMembers.userId, data.userId), eq(teamMembers.teamId, data.teamId)));
    return {
      success: true
    };
  } catch (error) {
    console.error("Update current session error:", error);
    return {
      success: false,
      error: "Failed to update current session"
    };
  }
});
const addTemplate_createServerFn_handler = createServerRpc({
  id: "33e801d0890c5acd168e0018b6af2f12eb4c4f385db80c380ae280b8e9553ecb",
  name: "addTemplate",
  filename: "src/server/api/sessions.ts"
}, (opts, signal) => addTemplate.__executeServer(opts, signal));
const addTemplate = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(addTemplate_createServerFn_handler, async ({
  data
}) => {
  try {
    const existingTemplates = await db.query.sessionTemplates.findMany({
      where: eq(sessionTemplates.sessionId, data.sessionId)
    });
    const templateId = v4();
    await db.insert(sessionTemplates).values({
      id: templateId,
      sessionId: data.sessionId,
      name: data.name,
      content: data.content,
      type: data.type,
      order: existingTemplates.length,
      createdAt: /* @__PURE__ */ new Date()
    });
    return {
      success: true,
      templateId
    };
  } catch (error) {
    console.error("Add template error:", error);
    return {
      success: false,
      error: "Failed to add template"
    };
  }
});
export {
  addResource_createServerFn_handler,
  addRubric_createServerFn_handler,
  addTemplate_createServerFn_handler,
  createSession_createServerFn_handler,
  deleteResource_createServerFn_handler,
  deleteRubric_createServerFn_handler,
  deleteSession_createServerFn_handler,
  getProjectSessions_createServerFn_handler,
  getSession_createServerFn_handler,
  reorderSessions_createServerFn_handler,
  updateRubric_createServerFn_handler,
  updateSession_createServerFn_handler,
  updateUserCurrentSession_createServerFn_handler
};
