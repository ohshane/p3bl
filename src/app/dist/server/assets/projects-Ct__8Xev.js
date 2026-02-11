import { c as createServerRpc } from "./createServerRpc-Bd3B-Ah9.js";
import { eq, and, desc, count, or, gt, like, ne, asc } from "drizzle-orm";
import { v4 } from "uuid";
import { p as projects, d as db, t as teams, a as teamMembers, b as projectInvitations, n as notifications, j as joinCodeAttempts, c as projectSessions, u as users, e as parseRoles, s as sessionResources, f as sessionRubrics, g as sessionTemplates } from "./index-kpcxYASC.js";
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
const createProjectSchema = z.object({
  creatorId: z.string(),
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  background: z.string().optional(),
  drivingQuestion: z.string().optional(),
  orgId: z.string().optional(),
  teamSize: z.number().int().min(1).max(10).default(4),
  maxParticipants: z.number().int().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});
const joinProjectSchema = z.object({
  userId: z.string(),
  code: z.string().length(6),
  ipAddress: z.string().optional()
});
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
function generateJoinCodeString() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
async function generateUniqueJoinCode(maxAttempts = 10) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateJoinCodeString();
    const existing = await db.query.projects.findFirst({
      where: eq(projects.joinCode, code),
      columns: {
        id: true
      }
    });
    if (!existing) {
      return code;
    }
  }
  throw new Error("Failed to generate unique join code after maximum attempts");
}
const getCreatorProjects_createServerFn_handler = createServerRpc({
  id: "5db25698990f83e81127de38bb2975c3b84448fe714cd8609bf2f0922092b18d",
  name: "getCreatorProjects",
  filename: "src/server/api/projects.ts"
}, (opts, signal) => getCreatorProjects.__executeServer(opts, signal));
const getCreatorProjects = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getCreatorProjects_createServerFn_handler, async ({
  data
}) => {
  try {
    const whereClause = data.includeTemplates ? eq(projects.creatorId, data.creatorId) : and(eq(projects.creatorId, data.creatorId), eq(projects.isTemplate, false));
    const projectList = await db.query.projects.findMany({
      where: whereClause,
      orderBy: desc(projects.updatedAt),
      with: {
        sessions: {
          orderBy: (sessions, {
            asc: asc2
          }) => [asc2(sessions.order)],
          with: {
            rubrics: true
          }
        }
      }
    });
    const projectsWithStats = await Promise.all(projectList.map(async (project) => {
      const teamCount = await db.select({
        count: count()
      }).from(teams).where(eq(teams.projectId, project.id));
      const memberCount = await db.select({
        count: count()
      }).from(teamMembers).innerJoin(teams, eq(teamMembers.teamId, teams.id)).where(eq(teams.projectId, project.id));
      return {
        ...project,
        teamCount: teamCount[0]?.count || 0,
        memberCount: memberCount[0]?.count || 0,
        sessionCount: project.sessions.length,
        sessions: project.sessions.map((s) => ({
          ...s,
          durationMinutes: s.durationMinutes ?? null,
          startDate: s.startDate?.toISOString(),
          endDate: s.endDate?.toISOString()
        })),
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        startDate: project.startDate?.toISOString(),
        endDate: project.endDate?.toISOString()
      };
    }));
    return {
      success: true,
      projects: projectsWithStats
    };
  } catch (error) {
    console.error("Get creator projects error:", error);
    return {
      success: false,
      error: "Failed to get projects"
    };
  }
});
const getUserProjects_createServerFn_handler = createServerRpc({
  id: "02422d195e42847cd582607631f50438758c1fa33dd3b8bb5e4fd6839250f1eb",
  name: "getUserProjects",
  filename: "src/server/api/projects.ts"
}, (opts, signal) => getUserProjects.__executeServer(opts, signal));
const getUserProjects = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getUserProjects_createServerFn_handler, async ({
  data
}) => {
  try {
    const userTeams = await db.query.teamMembers.findMany({
      where: eq(teamMembers.userId, data.userId),
      with: {
        team: {
          with: {
            project: {
              with: {
                sessions: true,
                creator: true
              }
            }
          }
        }
      }
    });
    const projectList = userTeams.map((tm) => {
      const project = tm.team.project;
      const currentSessionIndex = project.sessions.findIndex((s) => s.id === tm.currentSessionId);
      return {
        id: project.id,
        title: project.title,
        description: project.description,
        teamId: tm.team.id,
        teamName: tm.team.name,
        teamSize: project.teamSize,
        currentSessionId: tm.currentSessionId,
        currentSessionIndex: currentSessionIndex !== -1 ? currentSessionIndex : 0,
        sessionCount: project.sessions.length,
        sessions: project.sessions.map((s) => ({
          id: s.id,
          title: s.title,
          durationMinutes: s.durationMinutes ?? null,
          startDate: s.startDate?.toISOString(),
          endDate: s.endDate?.toISOString()
        })),
        creatorName: project.creator.name,
        startDate: project.startDate?.toISOString(),
        endDate: project.endDate?.toISOString(),
        joinedAt: tm.joinedAt.toISOString()
      };
    });
    const userInvitations = await db.query.projectInvitations.findMany({
      where: and(eq(projectInvitations.userId, data.userId), eq(projectInvitations.status, "accepted")),
      with: {
        project: {
          with: {
            sessions: true,
            creator: true
          }
        }
      }
    });
    const existingProjectIds = new Set(projectList.map((p) => p.id));
    const waitingProjects = userInvitations.filter((inv) => !existingProjectIds.has(inv.project.id)).map((inv) => {
      const project = inv.project;
      return {
        id: project.id,
        title: project.title,
        description: project.description,
        teamId: "",
        teamName: "Waiting for Allocation",
        teamSize: project.teamSize,
        currentSessionId: null,
        currentSessionIndex: 0,
        sessionCount: project.sessions.length,
        sessions: project.sessions.map((s) => ({
          id: s.id,
          title: s.title,
          durationMinutes: s.durationMinutes ?? null,
          startDate: s.startDate?.toISOString(),
          endDate: s.endDate?.toISOString()
        })),
        creatorName: project.creator.name,
        startDate: project.startDate?.toISOString(),
        endDate: project.endDate?.toISOString(),
        joinedAt: inv.respondedAt?.toISOString() || inv.createdAt.toISOString(),
        isWaiting: true
      };
    });
    return {
      success: true,
      projects: [...projectList, ...waitingProjects]
    };
  } catch (error) {
    console.error("Get user projects error:", error);
    return {
      success: false,
      error: "Failed to get projects"
    };
  }
});
const getProject_createServerFn_handler = createServerRpc({
  id: "6c339db82241beb50039a36e75943c365148fa4643dd65888e2a82e67ab9ff68",
  name: "getProject",
  filename: "src/server/api/projects.ts"
}, (opts, signal) => getProject.__executeServer(opts, signal));
const getProject = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getProject_createServerFn_handler, async ({
  data
}) => {
  try {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, data.projectId),
      with: {
        sessions: {
          orderBy: (sessions, {
            asc: asc2
          }) => [asc2(sessions.order)],
          with: {
            resources: true,
            rubrics: true,
            templates: true
          }
        },
        creator: true
      }
    });
    if (!project) {
      return {
        success: false,
        error: "Project not found"
      };
    }
    const now = /* @__PURE__ */ new Date();
    if (project.startDate && project.startDate <= now) {
      const waitingInvitations = await db.query.projectInvitations.findMany({
        where: and(eq(projectInvitations.projectId, data.projectId), eq(projectInvitations.status, "accepted"))
      });
      const unallocated = waitingInvitations.filter((p) => !p.teamId);
      if (unallocated.length > 0) {
        const teamSize = project.teamSize || 4;
        const existingTeamsList = await db.query.teams.findMany({
          where: eq(teams.projectId, data.projectId),
          with: {
            members: true
          }
        });
        const firstSession = project.sessions[0];
        const shuffled = [...unallocated];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        let teamCounter = existingTeamsList.length;
        for (const p of shuffled) {
          const allTeams = await db.query.teams.findMany({
            where: eq(teams.projectId, data.projectId),
            with: {
              members: true
            }
          });
          let target = allTeams.filter((t) => t.members.length < teamSize).sort((a, b) => a.members.length - b.members.length)[0];
          if (!target) {
            const teamId = v4();
            teamCounter++;
            await db.insert(teams).values({
              id: teamId,
              projectId: data.projectId,
              name: `Team ${teamCounter}`,
              createdAt: now,
              updatedAt: now
            });
            target = {
              id: teamId,
              projectId: data.projectId,
              name: `Team ${teamCounter}`,
              members: [],
              createdAt: now,
              updatedAt: now
            };
          }
          await db.insert(teamMembers).values({
            teamId: target.id,
            userId: p.userId,
            currentSessionId: firstSession?.id,
            joinedAt: now
          });
          await db.update(projectInvitations).set({
            teamId: target.id
          }).where(eq(projectInvitations.id, p.id));
          try {
            await db.insert(notifications).values({
              id: v4(),
              userId: p.userId,
              type: "team_assignment",
              title: "Team Assigned",
              message: `You have been assigned to ${target.name}!`,
              projectId: data.projectId,
              teamId: target.id,
              createdAt: now
            });
          } catch {
          }
        }
      }
    }
    let userTeam = null;
    let isWaiting = false;
    if (data.userId) {
      const removedCheck = await db.query.projectInvitations.findFirst({
        where: and(eq(projectInvitations.projectId, data.projectId), eq(projectInvitations.userId, data.userId), eq(projectInvitations.status, "removed"))
      });
      if (removedCheck) {
        return {
          success: false,
          error: "removed"
        };
      }
      const membershipRow = await db.select({
        teamId: teams.id
      }).from(teamMembers).innerJoin(teams, eq(teamMembers.teamId, teams.id)).where(and(eq(teamMembers.userId, data.userId), eq(teams.projectId, data.projectId)));
      if (membershipRow.length > 0) {
        const team = await db.query.teams.findFirst({
          where: eq(teams.id, membershipRow[0].teamId),
          with: {
            members: {
              with: {
                user: true
              }
            },
            aiPersonas: {
              with: {
                persona: true
              }
            }
          }
        });
        if (team) {
          userTeam = {
            id: team.id,
            name: team.name,
            members: team.members.map((m) => ({
              id: m.user.id,
              name: m.user.name,
              avatarUrl: m.user.avatarUrl,
              currentSessionId: m.currentSessionId,
              joinedAt: m.joinedAt.toISOString()
            })),
            aiPersonas: team.aiPersonas.map((ap) => ({
              id: ap.persona.id,
              name: ap.persona.name,
              type: ap.persona.type,
              avatar: ap.persona.avatar
            }))
          };
        }
      } else {
        const invitation = await db.query.projectInvitations.findFirst({
          where: and(
            eq(projectInvitations.projectId, data.projectId),
            eq(projectInvitations.userId, data.userId),
            eq(projectInvitations.status, "accepted")
            // Ensure teamId is null to confirm waiting status
            // But strictly speaking, if they accepted and aren't in teamMembers yet, they are waiting/processing
          )
        });
        if (invitation && !invitation.teamId) {
          isWaiting = true;
        }
      }
    }
    return {
      success: true,
      project: {
        ...project,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        startDate: project.startDate?.toISOString(),
        endDate: project.endDate?.toISOString(),
        sessions: project.sessions.map((s) => ({
          ...s,
          durationMinutes: s.durationMinutes ?? null,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
          startDate: s.startDate?.toISOString(),
          endDate: s.endDate?.toISOString()
        })),
        creator: {
          id: project.creator.id,
          name: project.creator.name,
          avatarUrl: project.creator.avatarUrl
        }
      },
      userTeam,
      isWaiting
    };
  } catch (error) {
    console.error("Get project error:", error);
    return {
      success: false,
      error: "Failed to get project"
    };
  }
});
const createProject_createServerFn_handler = createServerRpc({
  id: "58d764a2583b6aef2cc5970d9d6b92dc7444f7d77bf211d48634a4621457dc42",
  name: "createProject",
  filename: "src/server/api/projects.ts"
}, (opts, signal) => createProject.__executeServer(opts, signal));
const createProject = createServerFn({
  method: "POST"
}).inputValidator((data) => createProjectSchema.parse(data)).handler(createProject_createServerFn_handler, async ({
  data
}) => {
  try {
    const projectId = v4();
    const joinCode = await generateUniqueJoinCode();
    const now = /* @__PURE__ */ new Date();
    await db.insert(projects).values({
      id: projectId,
      creatorId: data.creatorId,
      title: data.title,
      description: data.description,
      background: data.background,
      drivingQuestion: data.drivingQuestion,
      orgId: data.orgId,
      joinCode,
      teamSize: data.teamSize,
      maxParticipants: data.maxParticipants,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      createdAt: now,
      updatedAt: now
    });
    return {
      success: true,
      project: {
        id: projectId,
        joinCode
      }
    };
  } catch (error) {
    console.error("Create project error:", error);
    return {
      success: false,
      error: "Failed to create project"
    };
  }
});
const updateProject_createServerFn_handler = createServerRpc({
  id: "ee92b135cccbaab9a4f083fa47d0d2175ba2d054081fe8b9fc65db70a621c80c",
  name: "updateProject",
  filename: "src/server/api/projects.ts"
}, (opts, signal) => updateProject.__executeServer(opts, signal));
const updateProject = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(updateProject_createServerFn_handler, async ({
  data
}) => {
  try {
    const updates = {
      ...data.updates
    };
    if (data.updates.startDate) {
      updates.startDate = new Date(data.updates.startDate);
    }
    if (data.updates.endDate) {
      updates.endDate = new Date(data.updates.endDate);
    }
    await db.update(projects).set({
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(projects.id, data.projectId));
    if (data.updates.startDate) {
      await recomputeSessionDates(data.projectId);
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("Update project error:", error);
    return {
      success: false,
      error: "Failed to update project"
    };
  }
});
const deleteProject_createServerFn_handler = createServerRpc({
  id: "e483d82ed8148370e8cd4f4d59c25e80443a17b273ccd58d948403c95a73aaea",
  name: "deleteProject",
  filename: "src/server/api/projects.ts"
}, (opts, signal) => deleteProject.__executeServer(opts, signal));
const deleteProject = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(deleteProject_createServerFn_handler, async ({
  data
}) => {
  try {
    await db.delete(projects).where(eq(projects.id, data.projectId));
    return {
      success: true
    };
  } catch (error) {
    console.error("Delete project error:", error);
    return {
      success: false,
      error: "Failed to delete project"
    };
  }
});
const joinProject_createServerFn_handler = createServerRpc({
  id: "14211fbf4f335c5cedd47d589d060380fcc3bc5dbbd83c30a06226c72a043f08",
  name: "joinProject",
  filename: "src/server/api/projects.ts"
}, (opts, signal) => joinProject.__executeServer(opts, signal));
const joinProject = createServerFn({
  method: "POST"
}).inputValidator((data) => joinProjectSchema.parse(data)).handler(joinProject_createServerFn_handler, async ({
  data
}) => {
  try {
    const code = data.code.toUpperCase();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1e3);
    const cooldownEnd = new Date(Date.now() + 5 * 60 * 1e3);
    const rateLimitConditions = [eq(joinCodeAttempts.userId, data.userId)];
    if (data.ipAddress) {
      rateLimitConditions.push(eq(joinCodeAttempts.ipAddress, data.ipAddress));
    }
    const recentAttempts = await db.select({
      count: count()
    }).from(joinCodeAttempts).where(and(or(...rateLimitConditions), gt(joinCodeAttempts.createdAt, fiveMinutesAgo), eq(joinCodeAttempts.success, false)));
    if ((recentAttempts[0]?.count || 0) >= 5) {
      return {
        success: false,
        error: "Too many attempts. Please try again in 5 minutes.",
        rateLimited: true,
        cooldownEnd: cooldownEnd.toISOString()
      };
    }
    const project = await db.query.projects.findFirst({
      where: eq(projects.joinCode, code)
    });
    const now = /* @__PURE__ */ new Date();
    const isExpired = project?.joinCodeExpiresAt && project.joinCodeExpiresAt < now;
    const isScheduled = project && project.startDate && project.startDate > now;
    const isOpened = project && (!project.startDate || project.startDate <= now) && (!project.endDate || project.endDate > now);
    const isClosed = project && project.endDate && project.endDate <= now;
    const isJoinable = !!(project && !isExpired && (isScheduled || isOpened) && !isClosed);
    await db.insert(joinCodeAttempts).values({
      id: v4(),
      userId: data.userId,
      ipAddress: data.ipAddress,
      code,
      success: isJoinable,
      createdAt: now
    });
    if (!project) {
      return {
        success: false,
        error: "Invalid code. Please check and try again."
      };
    }
    if (isExpired) {
      return {
        success: false,
        error: "This join code has expired. Please contact your instructor."
      };
    }
    if (isClosed) {
      return {
        success: false,
        error: "This project has ended."
      };
    }
    const removedInvitation = await db.query.projectInvitations.findFirst({
      where: and(eq(projectInvitations.projectId, project.id), eq(projectInvitations.userId, data.userId), eq(projectInvitations.status, "removed"))
    });
    if (removedInvitation) {
      return {
        success: false,
        error: "You have been removed from this project by the creator."
      };
    }
    const existingMembership = await db.select().from(teamMembers).innerJoin(teams, eq(teamMembers.teamId, teams.id)).where(and(eq(teams.projectId, project.id), eq(teamMembers.userId, data.userId)));
    if (existingMembership.length > 0) {
      return {
        success: true,
        projectId: project.id,
        teamId: existingMembership[0].teams.id,
        message: "Already a member of this project"
      };
    }
    const existingInvitation = await db.query.projectInvitations.findFirst({
      where: and(eq(projectInvitations.projectId, project.id), eq(projectInvitations.userId, data.userId), eq(projectInvitations.status, "accepted"))
    });
    if (existingInvitation) {
      return {
        success: true,
        projectId: project.id,
        message: "You have joined the project and are waiting for it to start.",
        waiting: true
      };
    }
    if (isScheduled) {
      await db.insert(projectInvitations).values({
        id: v4(),
        projectId: project.id,
        userId: data.userId,
        status: "accepted",
        createdAt: now,
        respondedAt: now
      });
      return {
        success: true,
        projectId: project.id,
        projectTitle: project.title,
        waiting: true,
        startDate: project.startDate?.toISOString()
      };
    }
    const existingTeams = await db.query.teams.findMany({
      where: eq(teams.projectId, project.id),
      with: {
        members: true
      }
    });
    const teamSize = project.teamSize || 4;
    let targetTeam = existingTeams.filter((t) => t.members.length < teamSize).sort((a, b) => a.members.length - b.members.length)[0];
    if (!targetTeam) {
      const teamId = v4();
      const teamNumber = existingTeams.length + 1;
      await db.insert(teams).values({
        id: teamId,
        projectId: project.id,
        name: `Team ${teamNumber}`,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      });
      targetTeam = {
        id: teamId,
        projectId: project.id,
        name: `Team ${teamNumber}`,
        members: [],
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
    }
    const firstSession = await db.query.projectSessions.findFirst({
      where: eq(projectSessions.projectId, project.id),
      orderBy: (s, {
        asc: asc2
      }) => [asc2(s.order)]
    });
    const joinNow = /* @__PURE__ */ new Date();
    await db.insert(teamMembers).values({
      teamId: targetTeam.id,
      userId: data.userId,
      currentSessionId: firstSession?.id,
      joinedAt: joinNow
    });
    await db.insert(projectInvitations).values({
      id: v4(),
      projectId: project.id,
      userId: data.userId,
      teamId: targetTeam.id,
      status: "accepted",
      createdAt: joinNow,
      respondedAt: joinNow
    });
    try {
      await db.insert(notifications).values({
        id: v4(),
        userId: data.userId,
        type: "project_invitation",
        title: "Welcome!",
        message: `You've joined ${project.title}!`,
        projectId: project.id,
        teamId: targetTeam.id,
        createdAt: joinNow
      });
    } catch (notifError) {
      console.error("Failed to create join notification (non-critical):", notifError);
    }
    return {
      success: true,
      projectId: project.id,
      teamId: targetTeam.id,
      projectTitle: project.title
    };
  } catch (error) {
    console.error("Join project error:", error);
    return {
      success: false,
      error: "Failed to join project"
    };
  }
});
const resetJoinCode_createServerFn_handler = createServerRpc({
  id: "1381c9e01da43b9bc0fcf00b8072d15667027f99473ac2afcdc090fc867ff830",
  name: "resetJoinCode",
  filename: "src/server/api/projects.ts"
}, (opts, signal) => resetJoinCode.__executeServer(opts, signal));
const resetJoinCode = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(resetJoinCode_createServerFn_handler, async ({
  data
}) => {
  try {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, data.projectId),
      columns: {
        creatorId: true
      }
    });
    if (!project) {
      return {
        success: false,
        error: "Project not found"
      };
    }
    if (project.creatorId !== data.creatorId) {
      return {
        success: false,
        error: "Not authorized to reset join code"
      };
    }
    const newCode = await generateUniqueJoinCode();
    await db.update(projects).set({
      joinCode: newCode,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(projects.id, data.projectId));
    await db.delete(projectInvitations).where(and(eq(projectInvitations.projectId, data.projectId), eq(projectInvitations.status, "removed")));
    return {
      success: true,
      joinCode: newCode
    };
  } catch (error) {
    console.error("Reset join code error:", error);
    return {
      success: false,
      error: "Failed to reset join code"
    };
  }
});
const getUserInvitations_createServerFn_handler = createServerRpc({
  id: "3c95c077e838d657635d1a807805fbd7ab572fe810730498f70d9e22b240b887",
  name: "getUserInvitations",
  filename: "src/server/api/projects.ts"
}, (opts, signal) => getUserInvitations.__executeServer(opts, signal));
const getUserInvitations = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getUserInvitations_createServerFn_handler, async ({
  data
}) => {
  try {
    const invitations = await db.query.projectInvitations.findMany({
      where: and(eq(projectInvitations.userId, data.userId), eq(projectInvitations.status, "pending")),
      with: {
        project: true
      }
    });
    return {
      success: true,
      invitations: invitations.map((inv) => ({
        id: inv.id,
        projectId: inv.project.id,
        projectTitle: inv.project.title,
        status: inv.status,
        createdAt: inv.createdAt.toISOString()
      }))
    };
  } catch (error) {
    console.error("Get invitations error:", error);
    return {
      success: false,
      error: "Failed to get invitations"
    };
  }
});
const respondToInvitation_createServerFn_handler = createServerRpc({
  id: "d4955f9e41b18849ef75c3ebbba365f1ee1e92465942ec05a32d242303d0923d",
  name: "respondToInvitation",
  filename: "src/server/api/projects.ts"
}, (opts, signal) => respondToInvitation.__executeServer(opts, signal));
const respondToInvitation = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(respondToInvitation_createServerFn_handler, async ({
  data
}) => {
  try {
    const invitation = await db.query.projectInvitations.findFirst({
      where: eq(projectInvitations.id, data.invitationId),
      with: {
        project: true
      }
    });
    if (!invitation) {
      return {
        success: false,
        error: "Invitation not found"
      };
    }
    if (!data.accept) {
      await db.update(projectInvitations).set({
        status: "dismissed",
        respondedAt: /* @__PURE__ */ new Date()
      }).where(eq(projectInvitations.id, data.invitationId));
      return {
        success: true
      };
    }
    const now = /* @__PURE__ */ new Date();
    const project = invitation.project;
    const isScheduled = project.startDate && project.startDate > now;
    const isOpened = (!project.startDate || project.startDate <= now) && (!project.endDate || project.endDate > now);
    const isClosed = project.endDate && project.endDate <= now;
    if (isClosed) {
      return {
        success: false,
        error: "This project has ended."
      };
    }
    if (isScheduled) {
      await db.update(projectInvitations).set({
        status: "accepted",
        respondedAt: /* @__PURE__ */ new Date()
      }).where(eq(projectInvitations.id, data.invitationId));
      return {
        success: true,
        projectId: invitation.projectId,
        waiting: true,
        startDate: project.startDate?.toISOString()
      };
    }
    let teamId = invitation.teamId;
    if (!teamId) {
      const existingTeams = await db.query.teams.findMany({
        where: eq(teams.projectId, invitation.projectId),
        with: {
          members: true
        }
      });
      const teamSize = invitation.project.teamSize || 4;
      const availableTeam = existingTeams.find((t) => t.members.length < teamSize);
      if (availableTeam) {
        teamId = availableTeam.id;
      } else {
        teamId = v4();
        await db.insert(teams).values({
          id: teamId,
          projectId: invitation.projectId,
          name: `Team ${existingTeams.length + 1}`,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        });
      }
    }
    const firstSession = await db.query.projectSessions.findFirst({
      where: eq(projectSessions.projectId, invitation.projectId),
      orderBy: (s, {
        asc: asc2
      }) => [asc2(s.order)]
    });
    await db.insert(teamMembers).values({
      teamId,
      userId: invitation.userId,
      currentSessionId: firstSession?.id,
      joinedAt: /* @__PURE__ */ new Date()
    });
    await db.update(projectInvitations).set({
      status: "accepted",
      teamId,
      respondedAt: /* @__PURE__ */ new Date()
    }).where(eq(projectInvitations.id, data.invitationId));
    return {
      success: true,
      projectId: invitation.projectId,
      teamId
    };
  } catch (error) {
    console.error("Respond to invitation error:", error);
    return {
      success: false,
      error: "Failed to respond to invitation"
    };
  }
});
const allocateTeams_createServerFn_handler = createServerRpc({
  id: "482528319fe0691929d95e44672958b0acd3edca7e1caca86d3a241d52f008e3",
  name: "allocateTeams",
  filename: "src/server/api/projects.ts"
}, (opts, signal) => allocateTeams.__executeServer(opts, signal));
const allocateTeams = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(allocateTeams_createServerFn_handler, async ({
  data
}) => {
  try {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, data.projectId)
    });
    if (!project) {
      return {
        success: false,
        error: "Project not found"
      };
    }
    const participants = await db.query.projectInvitations.findMany({
      where: and(eq(projectInvitations.projectId, data.projectId), eq(projectInvitations.status, "accepted"))
    });
    const waitingParticipants = participants.filter((p) => !p.teamId);
    if (waitingParticipants.length === 0) {
      return {
        success: true,
        message: "No participants to allocate"
      };
    }
    const shuffled = [...waitingParticipants];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const teamSize = project.teamSize || 4;
    const existingTeams = await db.query.teams.findMany({
      where: eq(teams.projectId, data.projectId)
    });
    let teamCount = existingTeams.length;
    const numberOfTeams = Math.ceil(shuffled.length / teamSize);
    const firstSession = await db.query.projectSessions.findFirst({
      where: eq(projectSessions.projectId, data.projectId),
      orderBy: (s, {
        asc: asc2
      }) => [asc2(s.order)]
    });
    const now = /* @__PURE__ */ new Date();
    for (let i = 0; i < numberOfTeams; i++) {
      const teamId = v4();
      teamCount++;
      await db.insert(teams).values({
        id: teamId,
        projectId: data.projectId,
        name: `Team ${teamCount}`,
        createdAt: now,
        updatedAt: now
      });
      const chunk = shuffled.slice(i * teamSize, (i + 1) * teamSize);
      for (const p of chunk) {
        await db.insert(teamMembers).values({
          teamId,
          userId: p.userId,
          currentSessionId: firstSession?.id,
          joinedAt: now
        });
        await db.update(projectInvitations).set({
          teamId
        }).where(eq(projectInvitations.id, p.id));
        await db.insert(notifications).values({
          id: v4(),
          userId: p.userId,
          type: "team_assignment",
          title: "Team Assigned",
          message: `You have been assigned to Team ${teamCount}!`,
          projectId: data.projectId,
          teamId,
          createdAt: now
        });
      }
    }
    return {
      success: true,
      allocatedCount: waitingParticipants.length
    };
  } catch (error) {
    console.error("Allocate teams error:", error);
    return {
      success: false,
      error: "Failed to allocate teams"
    };
  }
});
const getProjectParticipants_createServerFn_handler = createServerRpc({
  id: "a006a3ea66c89744d80fd67a2003a9b5a6a3c0eec8effa075417707836dfe02c",
  name: "getProjectParticipants",
  filename: "src/server/api/projects.ts"
}, (opts, signal) => getProjectParticipants.__executeServer(opts, signal));
const getProjectParticipants = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getProjectParticipants_createServerFn_handler, async ({
  data
}) => {
  try {
    const invitations = await db.query.projectInvitations.findMany({
      where: and(eq(projectInvitations.projectId, data.projectId), eq(projectInvitations.status, "accepted")),
      with: {
        user: true,
        team: true
      }
    });
    const participants = invitations.map((inv) => ({
      id: inv.userId,
      name: inv.user.name,
      email: inv.user.email,
      avatar: inv.user.avatarUrl,
      teamId: inv.teamId,
      teamName: inv.team?.name || null,
      joinedAt: inv.respondedAt?.toISOString() || inv.createdAt.toISOString()
    }));
    const projectTeams = await db.query.teams.findMany({
      where: eq(teams.projectId, data.projectId),
      with: {
        members: {
          with: {
            user: true
          }
        }
      }
    });
    const invitationUserIds = new Set(participants.map((p) => p.id));
    for (const team of projectTeams) {
      for (const member of team.members) {
        if (!invitationUserIds.has(member.userId)) {
          participants.push({
            id: member.userId,
            name: member.user.name,
            email: member.user.email,
            avatar: member.user.avatarUrl,
            teamId: team.id,
            teamName: team.name,
            joinedAt: member.joinedAt.toISOString()
          });
        }
      }
    }
    const waiting = participants.filter((p) => !p.teamId);
    const assigned = participants.filter((p) => p.teamId);
    const removedInvitations = await db.query.projectInvitations.findMany({
      where: and(eq(projectInvitations.projectId, data.projectId), eq(projectInvitations.status, "removed")),
      with: {
        user: true
      }
    });
    const removed = removedInvitations.map((inv) => ({
      id: inv.userId,
      name: inv.user.name,
      email: inv.user.email,
      avatar: inv.user.avatarUrl,
      teamId: null,
      teamName: null,
      joinedAt: inv.respondedAt?.toISOString() || inv.createdAt.toISOString()
    }));
    return {
      success: true,
      participants: {
        total: participants.length,
        waiting,
        assigned,
        removed
      }
    };
  } catch (error) {
    console.error("Get project participants error:", error);
    return {
      success: false,
      error: "Failed to get participants"
    };
  }
});
const removeParticipant_createServerFn_handler = createServerRpc({
  id: "9e7f5a15180ccbf229a7d5fe9627d98776b6216a303144901cdde69ee678098a",
  name: "removeParticipant",
  filename: "src/server/api/projects.ts"
}, (opts, signal) => removeParticipant.__executeServer(opts, signal));
const removeParticipant = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(removeParticipant_createServerFn_handler, async ({
  data
}) => {
  try {
    const projectTeams = await db.query.teams.findMany({
      where: eq(teams.projectId, data.projectId)
    });
    for (const team of projectTeams) {
      await db.delete(teamMembers).where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, data.userId)));
      const remaining = await db.select({
        count: count()
      }).from(teamMembers).where(eq(teamMembers.teamId, team.id));
      if ((remaining[0]?.count || 0) === 0) {
        await db.delete(teams).where(eq(teams.id, team.id));
      }
    }
    await db.update(projectInvitations).set({
      status: "removed",
      respondedAt: /* @__PURE__ */ new Date()
    }).where(and(eq(projectInvitations.projectId, data.projectId), eq(projectInvitations.userId, data.userId)));
    return {
      success: true
    };
  } catch (error) {
    console.error("Remove participant error:", error);
    return {
      success: false,
      error: "Failed to remove participant"
    };
  }
});
const unremoveParticipant_createServerFn_handler = createServerRpc({
  id: "06ca06922cdbd7d03d71aaaa3a9805f89dcafaffd83a5f253bde1290550704e9",
  name: "unremoveParticipant",
  filename: "src/server/api/projects.ts"
}, (opts, signal) => unremoveParticipant.__executeServer(opts, signal));
const unremoveParticipant = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(unremoveParticipant_createServerFn_handler, async ({
  data
}) => {
  try {
    await db.delete(projectInvitations).where(and(eq(projectInvitations.projectId, data.projectId), eq(projectInvitations.userId, data.userId), eq(projectInvitations.status, "removed")));
    return {
      success: true
    };
  } catch (error) {
    console.error("Unremove participant error:", error);
    return {
      success: false,
      error: "Failed to unremove participant"
    };
  }
});
const searchDelegateUsers_createServerFn_handler = createServerRpc({
  id: "fd7d4bea043eeb039b07109d12f1a09401c7185a976e6ca12dcab9945017a5a0",
  name: "searchDelegateUsers",
  filename: "src/server/api/projects.ts"
}, (opts, signal) => searchDelegateUsers.__executeServer(opts, signal));
const searchDelegateUsers = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(searchDelegateUsers_createServerFn_handler, async ({
  data
}) => {
  try {
    const searchPattern = `%${data.search}%`;
    let query = db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      avatarUrl: users.avatarUrl
    }).from(users).where(and(
      // User must have admin or creator role in their role array
      or(like(users.role, '%"admin"%'), like(users.role, '%"creator"%')),
      or(like(users.name, searchPattern), like(users.email, searchPattern)),
      ...data.excludeUserId ? [ne(users.id, data.excludeUserId)] : []
    )).limit(10);
    const results = await query;
    return {
      success: true,
      users: results.map((u) => ({
        ...u,
        role: parseRoles(u.role)
      }))
    };
  } catch (error) {
    console.error("Search delegate users error:", error);
    return {
      success: false,
      error: "Failed to search users"
    };
  }
});
const delegateProject_createServerFn_handler = createServerRpc({
  id: "7adfccce51ea16b84b2c3b4b40d89ee81a44900b2f181c42d774902e6faeca90",
  name: "delegateProject",
  filename: "src/server/api/projects.ts"
}, (opts, signal) => delegateProject.__executeServer(opts, signal));
const delegateProject = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(delegateProject_createServerFn_handler, async ({
  data
}) => {
  try {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, data.projectId),
      columns: {
        id: true,
        creatorId: true,
        title: true
      }
    });
    if (!project) {
      return {
        success: false,
        error: "Project not found"
      };
    }
    if (project.creatorId !== data.currentCreatorId) {
      return {
        success: false,
        error: "Not authorized to delegate this project"
      };
    }
    const newCreator = await db.query.users.findFirst({
      where: eq(users.id, data.newCreatorId),
      columns: {
        id: true,
        role: true,
        name: true
      }
    });
    if (!newCreator) {
      return {
        success: false,
        error: "Target user not found"
      };
    }
    const newCreatorRoles = parseRoles(newCreator.role);
    if (!newCreatorRoles.includes("admin") && !newCreatorRoles.includes("creator")) {
      return {
        success: false,
        error: "Target user does not have an eligible role (requires admin or creator)"
      };
    }
    await db.update(projects).set({
      creatorId: data.newCreatorId,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(projects.id, data.projectId));
    return {
      success: true,
      message: `Project "${project.title}" delegated to ${newCreator.name}`
    };
  } catch (error) {
    console.error("Delegate project error:", error);
    return {
      success: false,
      error: "Failed to delegate project"
    };
  }
});
const cloneProjectAsTemplate_createServerFn_handler = createServerRpc({
  id: "5113128641296796d504d5ab14c5416f0dfcc9a2708c7006d5a64fc3c4280e76",
  name: "cloneProjectAsTemplate",
  filename: "src/server/api/projects.ts"
}, (opts, signal) => cloneProjectAsTemplate.__executeServer(opts, signal));
const cloneProjectAsTemplate = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(cloneProjectAsTemplate_createServerFn_handler, async ({
  data
}) => {
  try {
    const sourceProject = await db.query.projects.findFirst({
      where: eq(projects.id, data.projectId),
      with: {
        sessions: {
          with: {
            resources: true,
            rubrics: true,
            templates: true
          }
        }
      }
    });
    if (!sourceProject) {
      return {
        success: false,
        error: "Source project not found"
      };
    }
    const templateId = v4();
    const now = /* @__PURE__ */ new Date();
    await db.insert(projects).values({
      id: templateId,
      creatorId: data.creatorId,
      orgId: sourceProject.orgId,
      title: sourceProject.title,
      description: sourceProject.description,
      background: sourceProject.background,
      drivingQuestion: sourceProject.drivingQuestion,
      teamSize: sourceProject.teamSize,
      maxParticipants: sourceProject.maxParticipants,
      isTemplate: true,
      isPublished: data.publish ?? false,
      createdAt: now,
      updatedAt: now
    });
    for (const session of sourceProject.sessions) {
      const newSessionId = v4();
      let durationMinutes = session.durationMinutes;
      if (!durationMinutes && session.startDate && session.endDate) {
        durationMinutes = Math.round((session.endDate.getTime() - session.startDate.getTime()) / 6e4);
      }
      await db.insert(projectSessions).values({
        id: newSessionId,
        projectId: templateId,
        order: session.order,
        title: session.title,
        topic: session.topic,
        guide: session.guide,
        weight: session.weight,
        durationMinutes: durationMinutes || null,
        difficulty: session.difficulty,
        deliverableType: session.deliverableType,
        deliverableTitle: session.deliverableTitle,
        deliverableDescription: session.deliverableDescription,
        llmModel: session.llmModel,
        createdAt: now,
        updatedAt: now
      });
      if (session.resources.length > 0) {
        for (const resource of session.resources) {
          await db.insert(sessionResources).values({
            id: v4(),
            sessionId: newSessionId,
            type: resource.type,
            title: resource.title,
            url: resource.url,
            filePath: resource.filePath,
            order: resource.order,
            createdAt: now
          });
        }
      }
      if (session.rubrics.length > 0) {
        for (const rubric of session.rubrics) {
          await db.insert(sessionRubrics).values({
            id: v4(),
            sessionId: newSessionId,
            criteria: rubric.criteria,
            description: rubric.description,
            weight: rubric.weight,
            order: rubric.order,
            createdAt: now
          });
        }
      }
      if (session.templates.length > 0) {
        for (const template of session.templates) {
          await db.insert(sessionTemplates).values({
            id: v4(),
            sessionId: newSessionId,
            name: template.name,
            content: template.content,
            type: template.type,
            order: template.order,
            createdAt: now
          });
        }
      }
    }
    return {
      success: true,
      templateId
    };
  } catch (error) {
    console.error("Clone project as template error:", error);
    return {
      success: false,
      error: "Failed to clone project as template"
    };
  }
});
const getLibraryTemplates_createServerFn_handler = createServerRpc({
  id: "94c0af11ce9c4c527d819df9d9c4c033bcae34b7c39bd7f6ec9b0395655bd2ba",
  name: "getLibraryTemplates",
  filename: "src/server/api/projects.ts"
}, (opts, signal) => getLibraryTemplates.__executeServer(opts, signal));
const getLibraryTemplates = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getLibraryTemplates_createServerFn_handler, async ({
  data
}) => {
  try {
    const templateList = await db.query.projects.findMany({
      where: and(eq(projects.creatorId, data.creatorId), eq(projects.isTemplate, true)),
      orderBy: desc(projects.updatedAt),
      with: {
        sessions: {
          orderBy: (sessions, {
            asc: asc2
          }) => [asc2(sessions.order)]
        }
      }
    });
    return {
      success: true,
      templates: templateList.map((t) => ({
        ...t,
        sessionCount: t.sessions.length,
        isPublished: t.isPublished,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString()
      }))
    };
  } catch (error) {
    console.error("Get library templates error:", error);
    return {
      success: false,
      error: "Failed to get templates"
    };
  }
});
const deployTemplate_createServerFn_handler = createServerRpc({
  id: "9460279c83f6f545772f14be2021a90ae38132c9fb3df7bbd4fa4ca3c646df8f",
  name: "deployTemplate",
  filename: "src/server/api/projects.ts"
}, (opts, signal) => deployTemplate.__executeServer(opts, signal));
const deployTemplate = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(deployTemplate_createServerFn_handler, async ({
  data
}) => {
  try {
    const sourceTemplate = await db.query.projects.findFirst({
      where: eq(projects.id, data.templateId),
      with: {
        sessions: {
          orderBy: (sessions, {
            asc: asc2
          }) => [asc2(sessions.order)],
          with: {
            resources: true,
            rubrics: true,
            templates: true
          }
        }
      }
    });
    if (!sourceTemplate) {
      return {
        success: false,
        error: "Template not found"
      };
    }
    const projectId = v4();
    const joinCode = await generateUniqueJoinCode();
    const now = /* @__PURE__ */ new Date();
    const projectStartDate = new Date(data.startDate);
    const projectEndDate = new Date(data.endDate);
    await db.insert(projects).values({
      id: projectId,
      creatorId: data.creatorId,
      orgId: sourceTemplate.orgId,
      title: sourceTemplate.title,
      description: sourceTemplate.description,
      background: sourceTemplate.background,
      drivingQuestion: sourceTemplate.drivingQuestion,
      teamSize: sourceTemplate.teamSize,
      maxParticipants: sourceTemplate.maxParticipants,
      isTemplate: false,
      joinCode,
      startDate: projectStartDate,
      endDate: projectEndDate,
      createdAt: now,
      updatedAt: now
    });
    let cursor = projectStartDate.getTime();
    for (const session of sourceTemplate.sessions) {
      const newSessionId = v4();
      const durationMs = (session.durationMinutes || 60) * 60 * 1e3;
      const sessionStart = new Date(cursor);
      const sessionEnd = new Date(cursor + durationMs);
      cursor = sessionEnd.getTime();
      await db.insert(projectSessions).values({
        id: newSessionId,
        projectId,
        order: session.order,
        title: session.title,
        topic: session.topic,
        guide: session.guide,
        weight: session.weight,
        durationMinutes: session.durationMinutes,
        difficulty: session.difficulty,
        deliverableType: session.deliverableType,
        deliverableTitle: session.deliverableTitle,
        deliverableDescription: session.deliverableDescription,
        llmModel: session.llmModel,
        startDate: sessionStart,
        endDate: sessionEnd,
        createdAt: now,
        updatedAt: now
      });
      for (const resource of session.resources) {
        await db.insert(sessionResources).values({
          id: v4(),
          sessionId: newSessionId,
          type: resource.type,
          title: resource.title,
          url: resource.url,
          filePath: resource.filePath,
          order: resource.order,
          createdAt: now
        });
      }
      for (const rubric of session.rubrics) {
        await db.insert(sessionRubrics).values({
          id: v4(),
          sessionId: newSessionId,
          criteria: rubric.criteria,
          description: rubric.description,
          weight: rubric.weight,
          order: rubric.order,
          createdAt: now
        });
      }
      for (const template of session.templates) {
        await db.insert(sessionTemplates).values({
          id: v4(),
          sessionId: newSessionId,
          name: template.name,
          content: template.content,
          type: template.type,
          order: template.order,
          createdAt: now
        });
      }
    }
    return {
      success: true,
      projectId,
      joinCode
    };
  } catch (error) {
    console.error("Deploy template error:", error);
    return {
      success: false,
      error: "Failed to deploy template"
    };
  }
});
const publishTemplate_createServerFn_handler = createServerRpc({
  id: "d2a73d0db7dd32d45d0bd99af24d5542c621317361e00dbf1a5679507aa3d575",
  name: "publishTemplate",
  filename: "src/server/api/projects.ts"
}, (opts, signal) => publishTemplate.__executeServer(opts, signal));
const publishTemplate = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(publishTemplate_createServerFn_handler, async ({
  data
}) => {
  try {
    const template = await db.query.projects.findFirst({
      where: and(eq(projects.id, data.templateId), eq(projects.creatorId, data.creatorId), eq(projects.isTemplate, true))
    });
    if (!template) {
      return {
        success: false,
        error: "Template not found or you do not own it"
      };
    }
    await db.update(projects).set({
      isPublished: true,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(projects.id, data.templateId));
    return {
      success: true
    };
  } catch (error) {
    console.error("Publish template error:", error);
    return {
      success: false,
      error: "Failed to publish template"
    };
  }
});
const unpublishTemplate_createServerFn_handler = createServerRpc({
  id: "aca4c587c67266ee06ff6c579b69e420e91722542400be62122362b9062beb26",
  name: "unpublishTemplate",
  filename: "src/server/api/projects.ts"
}, (opts, signal) => unpublishTemplate.__executeServer(opts, signal));
const unpublishTemplate = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(unpublishTemplate_createServerFn_handler, async ({
  data
}) => {
  try {
    const template = await db.query.projects.findFirst({
      where: and(eq(projects.id, data.templateId), eq(projects.creatorId, data.creatorId), eq(projects.isTemplate, true))
    });
    if (!template) {
      return {
        success: false,
        error: "Template not found or you do not own it"
      };
    }
    await db.update(projects).set({
      isPublished: false,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(projects.id, data.templateId));
    return {
      success: true
    };
  } catch (error) {
    console.error("Unpublish template error:", error);
    return {
      success: false,
      error: "Failed to unpublish template"
    };
  }
});
const getStoreTemplates_createServerFn_handler = createServerRpc({
  id: "7f2331e59fa0bfbe8337b2ef7cb0ebcc2bed1d622bf12be10b929e9bc85cb2ec",
  name: "getStoreTemplates",
  filename: "src/server/api/projects.ts"
}, (opts, signal) => getStoreTemplates.__executeServer(opts, signal));
const getStoreTemplates = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getStoreTemplates_createServerFn_handler, async ({
  data
}) => {
  try {
    const templateList = await db.query.projects.findMany({
      where: and(eq(projects.isTemplate, true), eq(projects.isPublished, true)),
      orderBy: desc(projects.updatedAt),
      with: {
        creator: true,
        sessions: {
          orderBy: (sessions, {
            asc: asc2
          }) => [asc2(sessions.order)]
        }
      }
    });
    return {
      success: true,
      templates: templateList.map((t) => ({
        ...t,
        sessionCount: t.sessions.length,
        creatorName: t.creator.name,
        isOwn: t.creatorId === data.creatorId,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString()
      }))
    };
  } catch (error) {
    console.error("Get store templates error:", error);
    return {
      success: false,
      error: "Failed to get store templates"
    };
  }
});
const getStoreTemplate_createServerFn_handler = createServerRpc({
  id: "27025c073dd56855c50b5fec8c849b39f228c68d3d2ac1506e88845a64a30911",
  name: "getStoreTemplate",
  filename: "src/server/api/projects.ts"
}, (opts, signal) => getStoreTemplate.__executeServer(opts, signal));
const getStoreTemplate = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getStoreTemplate_createServerFn_handler, async ({
  data
}) => {
  try {
    const template = await db.query.projects.findFirst({
      where: and(eq(projects.id, data.templateId), eq(projects.isTemplate, true), eq(projects.isPublished, true)),
      with: {
        creator: true,
        sessions: {
          orderBy: (sessions, {
            asc: asc2
          }) => [asc2(sessions.order)],
          with: {
            resources: true,
            rubrics: true
          }
        }
      }
    });
    if (!template) {
      return {
        success: false,
        error: "Published template not found"
      };
    }
    return {
      success: true,
      template: {
        ...template,
        sessionCount: template.sessions.length,
        creatorName: template.creator.name,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString()
      }
    };
  } catch (error) {
    console.error("Get store template error:", error);
    return {
      success: false,
      error: "Failed to get template"
    };
  }
});
const cloneStoreTemplate_createServerFn_handler = createServerRpc({
  id: "a9861fca5da20a56be3961bd0bc892cd1b6181c6cf53600293ed7a6eb0669edf",
  name: "cloneStoreTemplate",
  filename: "src/server/api/projects.ts"
}, (opts, signal) => cloneStoreTemplate.__executeServer(opts, signal));
const cloneStoreTemplate = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(cloneStoreTemplate_createServerFn_handler, async ({
  data
}) => {
  try {
    const sourceTemplate = await db.query.projects.findFirst({
      where: and(eq(projects.id, data.templateId), eq(projects.isTemplate, true), eq(projects.isPublished, true)),
      with: {
        sessions: {
          orderBy: (sessions, {
            asc: asc2
          }) => [asc2(sessions.order)],
          with: {
            resources: true,
            rubrics: true,
            templates: true
          }
        }
      }
    });
    if (!sourceTemplate) {
      return {
        success: false,
        error: "Published template not found"
      };
    }
    const newTemplateId = v4();
    const now = /* @__PURE__ */ new Date();
    await db.insert(projects).values({
      id: newTemplateId,
      creatorId: data.creatorId,
      orgId: sourceTemplate.orgId,
      title: sourceTemplate.title,
      description: sourceTemplate.description,
      background: sourceTemplate.background,
      drivingQuestion: sourceTemplate.drivingQuestion,
      teamSize: sourceTemplate.teamSize,
      maxParticipants: sourceTemplate.maxParticipants,
      isTemplate: true,
      isPublished: false,
      createdAt: now,
      updatedAt: now
    });
    for (const session of sourceTemplate.sessions) {
      const newSessionId = v4();
      await db.insert(projectSessions).values({
        id: newSessionId,
        projectId: newTemplateId,
        order: session.order,
        title: session.title,
        topic: session.topic,
        guide: session.guide,
        weight: session.weight,
        durationMinutes: session.durationMinutes || null,
        difficulty: session.difficulty,
        deliverableType: session.deliverableType,
        deliverableTitle: session.deliverableTitle,
        deliverableDescription: session.deliverableDescription,
        llmModel: session.llmModel,
        createdAt: now,
        updatedAt: now
      });
      for (const resource of session.resources) {
        await db.insert(sessionResources).values({
          id: v4(),
          sessionId: newSessionId,
          type: resource.type,
          title: resource.title,
          url: resource.url,
          filePath: resource.filePath,
          order: resource.order,
          createdAt: now
        });
      }
      for (const rubric of session.rubrics) {
        await db.insert(sessionRubrics).values({
          id: v4(),
          sessionId: newSessionId,
          criteria: rubric.criteria,
          description: rubric.description,
          weight: rubric.weight,
          order: rubric.order,
          createdAt: now
        });
      }
      for (const template of session.templates) {
        await db.insert(sessionTemplates).values({
          id: v4(),
          sessionId: newSessionId,
          name: template.name,
          content: template.content,
          type: template.type,
          order: template.order,
          createdAt: now
        });
      }
    }
    return {
      success: true,
      templateId: newTemplateId
    };
  } catch (error) {
    console.error("Clone store template error:", error);
    return {
      success: false,
      error: "Failed to clone template from store"
    };
  }
});
export {
  allocateTeams_createServerFn_handler,
  cloneProjectAsTemplate_createServerFn_handler,
  cloneStoreTemplate_createServerFn_handler,
  createProject_createServerFn_handler,
  delegateProject_createServerFn_handler,
  deleteProject_createServerFn_handler,
  deployTemplate_createServerFn_handler,
  getCreatorProjects_createServerFn_handler,
  getLibraryTemplates_createServerFn_handler,
  getProjectParticipants_createServerFn_handler,
  getProject_createServerFn_handler,
  getStoreTemplate_createServerFn_handler,
  getStoreTemplates_createServerFn_handler,
  getUserInvitations_createServerFn_handler,
  getUserProjects_createServerFn_handler,
  joinProject_createServerFn_handler,
  publishTemplate_createServerFn_handler,
  removeParticipant_createServerFn_handler,
  resetJoinCode_createServerFn_handler,
  respondToInvitation_createServerFn_handler,
  searchDelegateUsers_createServerFn_handler,
  unpublishTemplate_createServerFn_handler,
  unremoveParticipant_createServerFn_handler,
  updateProject_createServerFn_handler
};
