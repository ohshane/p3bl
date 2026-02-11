import { c as createServerRpc } from "./createServerRpc-Bd3B-Ah9.js";
import { and, eq, count, inArray, desc } from "drizzle-orm";
import { v4 } from "uuid";
import { d as db, p as projects, a as teamMembers, t as teams, F as teamRiskAssessments, l as artifacts, c as projectSessions, i as precheckResults, G as learningMetrics, H as aiInterventions, m as precheckFeedbackItems, E as aiPersonas } from "./index-kpcxYASC.js";
import "./settings-CebgkGhm.js";
import { g as generateSubmissionPrecheck } from "./artifacts-V6YAL9mY.js";
import { c as createServerFn } from "../server.js";
import "better-sqlite3";
import "drizzle-orm/better-sqlite3";
import "drizzle-orm/sqlite-core";
import "path";
import "fs";
import "zod";
import "node:async_hooks";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
import "@tanstack/react-router";
const getCreatorDashboardStats_createServerFn_handler = createServerRpc({
  id: "ea040ef298c6307e3294c6be160b3b3e5d00e5f19c0281d9483499f83391a88c",
  name: "getCreatorDashboardStats",
  filename: "src/server/api/creator.ts"
}, (opts, signal) => getCreatorDashboardStats.__executeServer(opts, signal));
const getCreatorDashboardStats = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getCreatorDashboardStats_createServerFn_handler, async ({
  data
}) => {
  try {
    const creatorProjects = await db.query.projects.findMany({
      where: and(eq(projects.creatorId, data.creatorId), eq(projects.isTemplate, false))
    });
    const projectIds = creatorProjects.map((p) => p.id);
    if (projectIds.length === 0) {
      return {
        success: true,
        stats: {
          scheduledProjects: 0,
          openedProjects: 0,
          closedProjects: 0,
          totalLearners: 0,
          projectsAtRisk: 0
        }
      };
    }
    const now = /* @__PURE__ */ new Date();
    const scheduledProjects = creatorProjects.filter((p) => {
      if (!p.startDate) return false;
      return p.startDate > now;
    }).length;
    const openedProjects = creatorProjects.filter((p) => {
      const startOk = !p.startDate || p.startDate <= now;
      const endOk = !p.endDate || p.endDate > now;
      return startOk && endOk;
    }).length;
    const closedProjects = creatorProjects.filter((p) => {
      if (!p.endDate) return false;
      return p.endDate <= now;
    }).length;
    const openedProjectIds = creatorProjects.filter((p) => {
      const startOk = !p.startDate || p.startDate <= now;
      const endOk = !p.endDate || p.endDate > now;
      return startOk && endOk;
    }).map((p) => p.id);
    let totalLearners = 0;
    if (openedProjectIds.length > 0) {
      const memberCountResult = await db.select({
        count: count()
      }).from(teamMembers).innerJoin(teams, eq(teamMembers.teamId, teams.id)).where(inArray(teams.projectId, openedProjectIds));
      totalLearners = memberCountResult[0]?.count || 0;
    }
    let projectsAtRisk = 0;
    if (openedProjectIds.length > 0) {
      const riskAssessments = await db.select({
        projectId: teamRiskAssessments.projectId,
        riskLevel: teamRiskAssessments.riskLevel
      }).from(teamRiskAssessments).where(inArray(teamRiskAssessments.projectId, openedProjectIds));
      const projectsWithRedRisk = new Set(riskAssessments.filter((r) => r.riskLevel === "red").map((r) => r.projectId));
      projectsAtRisk = projectsWithRedRisk.size;
    }
    return {
      success: true,
      stats: {
        scheduledProjects,
        openedProjects,
        closedProjects,
        totalLearners,
        projectsAtRisk
      }
    };
  } catch (error) {
    console.error("Get creator dashboard stats error:", error);
    return {
      success: false,
      error: "Failed to get dashboard stats"
    };
  }
});
const getProjectTeamsWithProgress_createServerFn_handler = createServerRpc({
  id: "53133277a54baa242ac8764724d661e63475cd0b46190f49413d440668069552",
  name: "getProjectTeamsWithProgress",
  filename: "src/server/api/creator.ts"
}, (opts, signal) => getProjectTeamsWithProgress.__executeServer(opts, signal));
const getProjectTeamsWithProgress = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getProjectTeamsWithProgress_createServerFn_handler, async ({
  data
}) => {
  try {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, data.projectId),
      with: {
        sessions: {
          orderBy: (sessions, {
            asc
          }) => [asc(sessions.order)]
        }
      }
    });
    if (!project) {
      return {
        success: false,
        error: "Project not found"
      };
    }
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
    const riskAssessments = await db.query.teamRiskAssessments.findMany({
      where: eq(teamRiskAssessments.projectId, data.projectId),
      orderBy: desc(teamRiskAssessments.assessedAt)
    });
    const riskByTeam = /* @__PURE__ */ new Map();
    for (const assessment of riskAssessments) {
      if (!riskByTeam.has(assessment.teamId)) {
        riskByTeam.set(assessment.teamId, assessment);
      }
    }
    const teamArtifacts = await db.query.artifacts.findMany({
      where: inArray(artifacts.teamId, projectTeams.map((t) => t.id))
    });
    const matrixData = projectTeams.map((team) => {
      const teamRisk = riskByTeam.get(team.id);
      const teamArtifactsList = teamArtifacts.filter((a) => a.teamId === team.id);
      const sessionProgress = project.sessions.map((session) => {
        const sessionArtifacts = teamArtifactsList.filter((a) => a.sessionId === session.id);
        let status = "not_started";
        if (sessionArtifacts.some((a) => a.status === "approved")) {
          status = "approved";
        } else if (sessionArtifacts.some((a) => a.status === "needs_revision")) {
          status = "needs_revision";
        } else if (sessionArtifacts.some((a) => a.status === "submitted" || a.status === "under_review")) {
          status = "submitted";
        } else if (sessionArtifacts.some((a) => a.status === "draft" || a.status === "precheck_pending" || a.status === "precheck_complete")) {
          status = "in_progress";
        }
        const latestSubmittedArtifact = sessionArtifacts.filter((a) => a.status === "submitted" || a.status === "under_review" || a.status === "approved").sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
        const latestStatusArtifact = sessionArtifacts.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
        return {
          sessionId: session.id,
          sessionIndex: session.order,
          status,
          startDate: session.startDate?.toISOString() || null,
          submittedAt: latestSubmittedArtifact ? latestSubmittedArtifact.updatedAt.toISOString() : null,
          statusUpdatedAt: latestStatusArtifact ? latestStatusArtifact.updatedAt.toISOString() : null
        };
      });
      const lastActivity = team.members.reduce((latest, member) => {
        return latest;
      }, null);
      return {
        teamId: team.id,
        teamName: team.name,
        riskLevel: teamRisk?.riskLevel || "green",
        riskReason: teamRisk?.riskFactors ? JSON.parse(teamRisk.riskFactors)[0] : null,
        lastActivityAt: teamRisk?.lastActivityAt?.toISOString() || (/* @__PURE__ */ new Date()).toISOString(),
        members: team.members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          avatar: m.user.avatarUrl,
          status: "active",
          currentSessionId: m.currentSessionId,
          completedSessions: sessionProgress.filter((s) => s.status === "approved").length,
          currentSessionProgress: 0,
          // Would need more detailed tracking
          lastActiveAt: (/* @__PURE__ */ new Date()).toISOString()
          // Would need activity tracking
        })),
        sessionProgress
      };
    });
    return {
      success: true,
      sessions: project.sessions.map((s) => ({
        id: s.id,
        title: s.title,
        order: s.order
      })),
      teams: matrixData
    };
  } catch (error) {
    console.error("Get project teams with progress error:", error);
    return {
      success: false,
      error: "Failed to get team progress"
    };
  }
});
const getLearningMetrics_createServerFn_handler = createServerRpc({
  id: "ceb02c61ce6d3d92d5932076d0fe87ea6e28e77087558d8b3dfd6778c921bb6e",
  name: "getLearningMetrics",
  filename: "src/server/api/creator.ts"
}, (opts, signal) => getLearningMetrics.__executeServer(opts, signal));
const getLearningMetrics = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getLearningMetrics_createServerFn_handler, async ({
  data
}) => {
  try {
    const sessions = await db.query.projectSessions.findMany({
      where: eq(projectSessions.projectId, data.projectId),
      orderBy: projectSessions.order,
      with: {
        rubrics: true
      }
    });
    const sessionIds = sessions.map((s) => s.id);
    if (sessionIds.length === 0) {
      return {
        success: true,
        metrics: []
      };
    }
    const allArtifacts = await db.query.artifacts.findMany({
      where: inArray(artifacts.sessionId, sessionIds),
      with: {
        team: true,
        precheckResults: {
          orderBy: precheckResults.createdAt
        }
      }
    });
    if (allArtifacts.length === 0) {
      return {
        success: true,
        metrics: []
      };
    }
    const days = data.days || 90;
    const cutoff = /* @__PURE__ */ new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const sessionRubricMap = /* @__PURE__ */ new Map();
    for (const session of sessions) {
      sessionRubricMap.set(session.id, session.rubrics.map((r) => ({
        criteria: r.criteria,
        weight: r.weight
      })));
    }
    const metrics = [];
    for (const artifact of allArtifacts) {
      const sessionRubrics = sessionRubricMap.get(artifact.sessionId) || [];
      const weightByCriterion = new Map(sessionRubrics.map((r) => [r.criteria, r.weight]));
      for (const precheck of artifact.precheckResults) {
        const precheckDate = precheck.createdAt instanceof Date ? precheck.createdAt : new Date(precheck.createdAt);
        if (precheckDate < cutoff) continue;
        let rubricScores = {};
        let score = 0;
        if (precheck.rubricScores) {
          try {
            rubricScores = JSON.parse(precheck.rubricScores);
            const entries = Object.entries(rubricScores);
            if (entries.length > 0) {
              let weightedSum = 0;
              let totalWeight = 0;
              for (const [key, s] of entries) {
                const weight = weightByCriterion.get(key) ?? 0;
                weightedSum += s * weight;
                totalWeight += weight;
              }
              score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : Math.round(entries.reduce((sum, [, s]) => sum + s, 0) / entries.length);
            }
          } catch {
          }
        }
        if (score === 0) {
          switch (precheck.overallScore) {
            case "ready":
              score = 85;
              break;
            case "needs_work":
              score = 65;
              break;
            case "critical_issues":
              score = 40;
              break;
          }
        }
        metrics.push({
          date: precheckDate.toISOString(),
          teamId: artifact.teamId,
          teamName: artifact.team?.name || "Unknown Team",
          score,
          overallScore: precheck.overallScore,
          rubricScores
        });
      }
    }
    metrics.sort((a, b) => a.date.localeCompare(b.date));
    return {
      success: true,
      metrics
    };
  } catch (error) {
    console.error("Get learning metrics error:", error);
    return {
      success: false,
      error: "Failed to get learning metrics"
    };
  }
});
const recordLearningMetric_createServerFn_handler = createServerRpc({
  id: "6f365a1105a97d93988c0afeb108d26712e638503065671f92aa47fe1792085c",
  name: "recordLearningMetric",
  filename: "src/server/api/creator.ts"
}, (opts, signal) => recordLearningMetric.__executeServer(opts, signal));
const recordLearningMetric = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(recordLearningMetric_createServerFn_handler, async ({
  data
}) => {
  try {
    const metricId = v4();
    await db.insert(learningMetrics).values({
      id: metricId,
      projectId: data.projectId,
      teamId: data.teamId,
      userId: data.userId,
      metricType: data.metricType,
      value: Math.max(0, Math.min(100, data.value)),
      // Clamp to 0-100
      source: data.source,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      recordedAt: /* @__PURE__ */ new Date()
    });
    return {
      success: true,
      metricId
    };
  } catch (error) {
    console.error("Record learning metric error:", error);
    return {
      success: false,
      error: "Failed to record metric"
    };
  }
});
const typeMapping = {
  "proactive": "custom",
  "reactive": "engagement",
  "scheduled": "deadline"
};
const statusMapping = {
  "proposed": "pending",
  "approved": "approved",
  "rejected": "rejected",
  "executed": "executed"
};
const reverseStatusMapping = {
  "pending": "proposed",
  "approved": "approved",
  "rejected": "rejected",
  "executed": "executed"
};
const getProjectInterventions_createServerFn_handler = createServerRpc({
  id: "e2d4528d6a54a083e994f881555ded2a42c17316d4ac19e0fcea3b1d7801c58c",
  name: "getProjectInterventions",
  filename: "src/server/api/creator.ts"
}, (opts, signal) => getProjectInterventions.__executeServer(opts, signal));
const getProjectInterventions = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getProjectInterventions_createServerFn_handler, async ({
  data
}) => {
  try {
    const interventions = await db.query.aiInterventions.findMany({
      where: eq(aiInterventions.projectId, data.projectId),
      orderBy: desc(aiInterventions.createdAt),
      with: {
        executor: true,
        team: true
      }
    });
    return {
      success: true,
      interventions: interventions.map((i) => ({
        id: i.id,
        type: i.type === "custom" ? "proactive" : i.type === "engagement" ? "reactive" : "scheduled",
        description: i.proposedAction,
        targetTeamIds: i.teamId ? [i.teamId] : [],
        status: reverseStatusMapping[i.status] || i.status,
        timestamp: i.createdAt.toISOString(),
        proposedAt: i.createdAt.toISOString(),
        approvedAt: i.status === "approved" ? i.createdAt.toISOString() : void 0,
        rejectedAt: i.status === "rejected" ? i.createdAt.toISOString() : void 0,
        executedAt: i.executedAt?.toISOString(),
        createdBy: i.executor ? {
          id: i.executor.id,
          name: i.executor.name
        } : null
      }))
    };
  } catch (error) {
    console.error("Get project interventions error:", error);
    return {
      success: false,
      error: "Failed to get interventions"
    };
  }
});
const createIntervention_createServerFn_handler = createServerRpc({
  id: "4772894a5b856f51587b168fe8cc1abb2bbb5afb3262d69e5de6d2df6bcd782b",
  name: "createIntervention",
  filename: "src/server/api/creator.ts"
}, (opts, signal) => createIntervention.__executeServer(opts, signal));
const createIntervention = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createIntervention_createServerFn_handler, async ({
  data
}) => {
  try {
    const interventionId = v4();
    const dbType = typeMapping[data.type] || "custom";
    const targetTeam = data.targetTeamIds[0];
    await db.insert(aiInterventions).values({
      id: interventionId,
      projectId: data.projectId,
      teamId: targetTeam || null,
      type: dbType,
      trigger: `Creator ${data.type} intervention`,
      proposedAction: data.description,
      status: "pending",
      createdAt: /* @__PURE__ */ new Date()
    });
    return {
      success: true,
      interventionId
    };
  } catch (error) {
    console.error("Create intervention error:", error);
    return {
      success: false,
      error: "Failed to create intervention"
    };
  }
});
const updateInterventionStatus_createServerFn_handler = createServerRpc({
  id: "d89f07b083d25d6016afb00f2cbb5c2928b31798afb623812013f17ce5bcb9cc",
  name: "updateInterventionStatus",
  filename: "src/server/api/creator.ts"
}, (opts, signal) => updateInterventionStatus.__executeServer(opts, signal));
const updateInterventionStatus = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(updateInterventionStatus_createServerFn_handler, async ({
  data
}) => {
  try {
    const now = /* @__PURE__ */ new Date();
    const dbStatus = statusMapping[data.status] || data.status;
    const updates = {
      status: dbStatus
    };
    if (data.status === "executed") {
      updates.executedAt = now;
    }
    await db.update(aiInterventions).set(updates).where(eq(aiInterventions.id, data.interventionId));
    return {
      success: true
    };
  } catch (error) {
    console.error("Update intervention status error:", error);
    return {
      success: false,
      error: "Failed to update intervention"
    };
  }
});
const getProjectSubmissions_createServerFn_handler = createServerRpc({
  id: "e06a2be867458da8175bfdea5bbb452bfa3e666c37e419fc4ee267ad1d1e2916",
  name: "getProjectSubmissions",
  filename: "src/server/api/creator.ts"
}, (opts, signal) => getProjectSubmissions.__executeServer(opts, signal));
const getProjectSubmissions = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getProjectSubmissions_createServerFn_handler, async ({
  data
}) => {
  try {
    const sessions = await db.query.projectSessions.findMany({
      where: eq(projectSessions.projectId, data.projectId),
      orderBy: projectSessions.order,
      with: {
        rubrics: true
      }
    });
    const sessionIds = sessions.map((s) => s.id);
    if (sessionIds.length === 0) {
      return {
        success: true,
        submissions: [],
        stats: {
          total: 0,
          pending: 0,
          graded: 0,
          avgScore: 0
        }
      };
    }
    const allArtifacts = await db.query.artifacts.findMany({
      where: inArray(artifacts.sessionId, sessionIds),
      with: {
        user: true,
        team: true,
        precheckResults: {
          orderBy: desc(precheckResults.createdAt),
          limit: 1
        }
      }
    });
    const submissions = allArtifacts.map((artifact) => {
      const session = sessions.find((s) => s.id === artifact.sessionId);
      const sessionRubrics = session?.rubrics || [];
      const latestPrecheck = artifact.precheckResults[0];
      let aiScore = 0;
      let rubricBreakdown = sessionRubrics.map((r) => ({
        criterion: r.criteria,
        weight: r.weight,
        score: null
      }));
      const applyOverallScoreFallback = () => {
        switch (latestPrecheck?.overallScore) {
          case "ready":
            aiScore = 85;
            break;
          case "needs_work":
            aiScore = 65;
            break;
          case "critical_issues":
            aiScore = 40;
            break;
          default:
            aiScore = 0;
        }
      };
      if (latestPrecheck?.rubricScores) {
        try {
          const scores = JSON.parse(latestPrecheck.rubricScores);
          const entries = Object.entries(scores);
          if (entries.length > 0) {
            const rubrics = sessionRubrics;
            const weightById = new Map(rubrics.map((r) => [r.id, r.weight]));
            const weightByCriterion = new Map(rubrics.map((r) => [r.criteria, r.weight]));
            const scoreById = new Map(Object.entries(scores));
            rubricBreakdown = rubrics.map((rubric) => {
              const rawScore = scoreById.get(rubric.id) ?? scoreById.get(rubric.criteria);
              return {
                criterion: rubric.criteria,
                weight: rubric.weight,
                score: typeof rawScore === "number" ? Math.round(rawScore) : null
              };
            });
            let weightedSum = 0;
            let totalWeight = 0;
            for (const [key, score] of entries) {
              const weight = weightById.get(key) ?? weightByCriterion.get(key) ?? 0;
              weightedSum += score * weight;
              totalWeight += weight;
            }
            aiScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : Math.round(entries.reduce((sum, [, s]) => sum + s, 0) / entries.length);
          } else {
            applyOverallScoreFallback();
          }
        } catch {
          applyOverallScoreFallback();
        }
      } else {
        applyOverallScoreFallback();
      }
      return {
        id: artifact.id,
        teamId: artifact.teamId,
        teamName: artifact.team.name,
        studentId: artifact.userId,
        studentName: artifact.user.name,
        sessionId: artifact.sessionId,
        sessionIndex: session?.order || 0,
        sessionTitle: session?.title || "Unknown Session",
        aiScore,
        status: artifact.status === "approved" ? "graded" : "pending",
        submittedAt: artifact.updatedAt.toISOString(),
        precheckPassed: artifact.precheckPassed,
        rubricBreakdown
      };
    });
    const pendingCount = submissions.filter((s) => s.status === "pending").length;
    const gradedCount = submissions.filter((s) => s.status === "graded").length;
    const avgScore = submissions.length > 0 ? Math.round(submissions.reduce((sum, s) => sum + s.aiScore, 0) / submissions.length) : 0;
    return {
      success: true,
      submissions,
      stats: {
        total: submissions.length,
        pending: pendingCount,
        graded: gradedCount,
        avgScore
      }
    };
  } catch (error) {
    console.error("Get project submissions error:", error);
    return {
      success: false,
      error: "Failed to get submissions"
    };
  }
});
const regradeSubmission_createServerFn_handler = createServerRpc({
  id: "f9b48ad9c6a0d116317b9da711c8fc14ef6b5645e0c166db9c28b809d83e8405",
  name: "regradeSubmission",
  filename: "src/server/api/creator.ts"
}, (opts, signal) => regradeSubmission.__executeServer(opts, signal));
const regradeSubmission = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(regradeSubmission_createServerFn_handler, async ({
  data
}) => {
  try {
    const ids = Array.isArray(data.artifactIds) ? data.artifactIds : [data.artifactIds];
    if (ids.length === 0) {
      return {
        success: false,
        error: "No artifact IDs provided"
      };
    }
    const targetArtifacts = await db.query.artifacts.findMany({
      where: inArray(artifacts.id, ids),
      with: {
        session: {
          with: {
            rubrics: {
              orderBy: (rubrics, {
                asc
              }) => [asc(rubrics.order)]
            }
          }
        }
      }
    });
    const now = /* @__PURE__ */ new Date();
    const updatedScores = [];
    for (const artifact of targetArtifacts) {
      const rubrics = artifact.session?.rubrics || [];
      const content = artifact.content || "";
      if (content.trim() && rubrics.length > 0) {
        const generated = await generateSubmissionPrecheck(content, rubrics);
        const precheckId = v4();
        await db.insert(precheckResults).values({
          id: precheckId,
          artifactId: artifact.id,
          overallScore: generated.overallScore,
          feedback: JSON.stringify(generated.items),
          rubricScores: JSON.stringify(generated.rubricScores),
          createdAt: now
        });
        if (generated.items.length > 0) {
          await db.insert(precheckFeedbackItems).values(generated.items.map((item) => ({
            id: v4(),
            precheckId,
            severity: item.severity,
            message: item.message,
            suggestion: item.suggestion,
            lineNumber: item.lineNumber,
            createdAt: now
          })));
        }
        const entries = Object.entries(generated.rubricScores);
        let aiScore = 0;
        if (entries.length > 0) {
          const weightByCriterion = new Map(rubrics.map((r) => [r.criteria, r.weight]));
          let weightedSum = 0;
          let totalWeight = 0;
          for (const [key, s] of entries) {
            const weight = weightByCriterion.get(key) ?? 0;
            weightedSum += s * weight;
            totalWeight += weight;
          }
          aiScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : Math.round(entries.reduce((sum, [, s]) => sum + s, 0) / entries.length);
        }
        updatedScores.push({
          artifactId: artifact.id,
          aiScore,
          rubricBreakdown: rubrics.map((r) => ({
            criterion: r.criteria,
            weight: r.weight,
            score: generated.rubricScores[r.criteria] ?? null
          }))
        });
        await db.update(artifacts).set({
          lastPrecheckAt: now,
          precheckPassed: generated.overallScore !== "critical_issues",
          updatedAt: now
        }).where(eq(artifacts.id, artifact.id));
      }
    }
    return {
      success: true,
      regradedCount: ids.length,
      updatedScores
    };
  } catch (error) {
    console.error("Regrade submission error:", error);
    return {
      success: false,
      error: "Failed to re-grade submission"
    };
  }
});
const gradeSubmission_createServerFn_handler = createServerRpc({
  id: "e09d7c9908ed722d93aa9043d22cb3d7b21c0a36c960f00a5dc19f94e604543a",
  name: "gradeSubmission",
  filename: "src/server/api/creator.ts"
}, (opts, signal) => gradeSubmission.__executeServer(opts, signal));
const gradeSubmission = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(gradeSubmission_createServerFn_handler, async ({
  data
}) => {
  try {
    const ids = Array.isArray(data.artifactIds) ? data.artifactIds : [data.artifactIds];
    if (ids.length === 0) {
      return {
        success: false,
        error: "No artifact IDs provided"
      };
    }
    const now = /* @__PURE__ */ new Date();
    await db.update(artifacts).set({
      status: "approved",
      updatedAt: now
    }).where(inArray(artifacts.id, ids));
    return {
      success: true,
      gradedCount: ids.length
    };
  } catch (error) {
    console.error("Grade submission error:", error);
    return {
      success: false,
      error: "Failed to grade submission"
    };
  }
});
const calculateTeamRisks_createServerFn_handler = createServerRpc({
  id: "5da98288a1e723901fb931468e0d7b16d35aed1164b6d1387eb42c1dd22b844d",
  name: "calculateTeamRisks",
  filename: "src/server/api/creator.ts"
}, (opts, signal) => calculateTeamRisks.__executeServer(opts, signal));
const calculateTeamRisks = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(calculateTeamRisks_createServerFn_handler, async ({
  data
}) => {
  try {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, data.projectId),
      with: {
        sessions: true
      }
    });
    if (!project) {
      return {
        success: false,
        error: "Project not found"
      };
    }
    const projectTeams = await db.query.teams.findMany({
      where: eq(teams.projectId, data.projectId),
      with: {
        members: true
      }
    });
    const sessionIds = project.sessions.map((s) => s.id);
    const allArtifacts = await db.query.artifacts.findMany({
      where: inArray(artifacts.sessionId, sessionIds),
      with: {
        precheckResults: {
          orderBy: desc(precheckResults.createdAt),
          limit: 5
        }
      }
    });
    const now = /* @__PURE__ */ new Date();
    const assessments = [];
    for (const team of projectTeams) {
      const teamArtifacts = allArtifacts.filter((a) => a.teamId === team.id);
      const riskFactors = [];
      let riskLevel = "green";
      const projectStart = project.startDate?.getTime() ?? 0;
      const projectEnd = project.endDate?.getTime() ?? 0;
      const projectDuration = projectEnd - projectStart;
      const expectedSessions = projectDuration > 0 && projectStart > 0 ? Math.floor((now.getTime() - projectStart) / projectDuration * project.sessions.length) : 0;
      const completedSessions = teamArtifacts.filter((a) => a.status === "approved" || a.status === "submitted").length;
      const sessionsBehind = Math.max(0, expectedSessions - completedSessions);
      if (sessionsBehind >= 2) {
        riskFactors.push(`${sessionsBehind} sessions behind schedule`);
        riskLevel = "red";
      } else if (sessionsBehind === 1) {
        riskFactors.push("1 session behind schedule");
        if (riskLevel !== "red") riskLevel = "yellow";
      }
      const allPrechecks = teamArtifacts.flatMap((a) => a.precheckResults);
      const failedPrechecks = allPrechecks.filter((p) => p.overallScore === "critical_issues").length;
      const precheckFailureRate = allPrechecks.length > 0 ? Math.round(failedPrechecks / allPrechecks.length * 100) : null;
      if (precheckFailureRate !== null && precheckFailureRate > 50) {
        riskFactors.push(`High precheck failure rate (${precheckFailureRate}%)`);
        riskLevel = "red";
      } else if (precheckFailureRate !== null && precheckFailureRate > 30) {
        riskFactors.push(`Elevated precheck failure rate (${precheckFailureRate}%)`);
        if (riskLevel !== "red") riskLevel = "yellow";
      }
      const lastArtifactUpdate = teamArtifacts.reduce((latest, a) => {
        return a.updatedAt > latest ? a.updatedAt : latest;
      }, /* @__PURE__ */ new Date(0));
      const daysSinceActivity = Math.floor((now.getTime() - lastArtifactUpdate.getTime()) / (1e3 * 60 * 60 * 24));
      if (daysSinceActivity > 7) {
        riskFactors.push(`No activity for ${daysSinceActivity} days`);
        riskLevel = "red";
      } else if (daysSinceActivity > 3) {
        riskFactors.push(`Limited activity (${daysSinceActivity} days ago)`);
        if (riskLevel !== "red") riskLevel = "yellow";
      }
      assessments.push({
        id: v4(),
        projectId: data.projectId,
        teamId: team.id,
        riskLevel,
        riskFactors: JSON.stringify(riskFactors),
        lastActivityAt: lastArtifactUpdate.getTime() > 0 ? lastArtifactUpdate : null,
        sessionsBehind,
        precheckFailureRate,
        assessedAt: now
      });
    }
    if (assessments.length > 0) {
      await db.insert(teamRiskAssessments).values(assessments);
    }
    return {
      success: true,
      assessments: assessments.map((a) => ({
        teamId: a.teamId,
        riskLevel: a.riskLevel,
        riskFactors: JSON.parse(a.riskFactors)
      }))
    };
  } catch (error) {
    console.error("Calculate team risks error:", error);
    return {
      success: false,
      error: "Failed to calculate team risks"
    };
  }
});
const getAiPersonas_createServerFn_handler = createServerRpc({
  id: "74a454497eab31e9eab5841136276064a8a69028c0e32a369004ebb509d09f83",
  name: "getAiPersonas",
  filename: "src/server/api/creator.ts"
}, (opts, signal) => getAiPersonas.__executeServer(opts, signal));
const getAiPersonas = createServerFn({
  method: "GET"
}).handler(getAiPersonas_createServerFn_handler, async () => {
  try {
    const personas = await db.query.aiPersonas.findMany({
      where: eq(aiPersonas.isActive, true)
    });
    return {
      success: true,
      personas: personas.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        description: p.description,
        avatar: p.avatar,
        traits: p.traits ? JSON.parse(p.traits) : [],
        expertise: p.expertise ? JSON.parse(p.expertise) : []
      }))
    };
  } catch (error) {
    console.error("Get AI personas error:", error);
    return {
      success: false,
      error: "Failed to get AI personas"
    };
  }
});
export {
  calculateTeamRisks_createServerFn_handler,
  createIntervention_createServerFn_handler,
  getAiPersonas_createServerFn_handler,
  getCreatorDashboardStats_createServerFn_handler,
  getLearningMetrics_createServerFn_handler,
  getProjectInterventions_createServerFn_handler,
  getProjectSubmissions_createServerFn_handler,
  getProjectTeamsWithProgress_createServerFn_handler,
  gradeSubmission_createServerFn_handler,
  recordLearningMetric_createServerFn_handler,
  regradeSubmission_createServerFn_handler,
  updateInterventionStatus_createServerFn_handler
};
