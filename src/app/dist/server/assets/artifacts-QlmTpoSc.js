import { c as createServerRpc } from "./createServerRpc-Bd3B-Ah9.js";
import { desc, eq, and } from "drizzle-orm";
import { v4 } from "uuid";
import { d as db, i as precheckResults, k as artifactVersions, l as artifacts, m as precheckFeedbackItems, o as showcaseLinks } from "./index-kpcxYASC.js";
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
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_BASE = process.env.OPENROUTER_API_BASE || "https://openrouter.ai/api/v1";
const OPENROUTER_API_URL = `${OPENROUTER_API_BASE}/chat/completions`;
const DEFAULT_PRECHECK_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
function buildRubricContext(rubrics) {
  if (rubrics.length === 0) return "";
  return rubrics.map((r) => `- ${r.criteria} (${r.weight}%): ${r.description || "No description provided"}`).join("\n");
}
function generateFallbackPrecheck(content, rubrics) {
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const baseScore = Math.max(30, Math.min(95, Math.round(Math.min(wordCount / 8, 100))));
  const rubricScores = Object.fromEntries(rubrics.map((rubric) => [rubric.criteria, baseScore]));
  const items = [];
  if (wordCount < 100) {
    items.push({
      id: "submission_length_critical",
      severity: "critical",
      message: "Submission is too short for reliable rubric evaluation.",
      suggestion: "Add more evidence, explanation, and examples."
    });
  } else if (wordCount < 250) {
    items.push({
      id: "submission_length_warning",
      severity: "warning",
      message: "Submission may need more depth against rubric criteria.",
      suggestion: "Expand your argument and align it with each rubric criterion."
    });
  }
  const overallScore = wordCount < 100 ? "critical_issues" : wordCount < 250 ? "needs_work" : "ready";
  return {
    overallScore,
    rubricScores,
    items
  };
}
async function generateSubmissionPrecheck(content, rubrics) {
  if (!OPENROUTER_API_KEY) {
    return generateFallbackPrecheck(content, rubrics);
  }
  const rubricContext = buildRubricContext(rubrics);
  const systemPrompt = `You are an academic evaluator.
Score the submission against the rubric criteria below and return strict JSON only.

Rubric criteria:
${rubricContext || "- No rubric criteria provided"}

Output schema:
{
  "overallScore": "ready" | "needs_work" | "critical_issues",
  "rubricScores": { "<criterion name>": <0-100 number> },
  "items": [
    {
      "id": "unique_string",
      "severity": "critical" | "warning" | "suggestion",
      "message": "issue summary",
      "suggestion": "how to improve"
    }
  ]
}`;
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: DEFAULT_PRECHECK_MODEL,
        messages: [{
          role: "system",
          content: systemPrompt
        }, {
          role: "user",
          content: `Submission:

${content}`
        }],
        max_tokens: 900,
        temperature: 0.1
      })
    });
    if (!response.ok) {
      throw new Error(`OpenRouter submit precheck failed: ${response.status}`);
    }
    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || "{}";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("OpenRouter submit precheck returned non-JSON content");
    }
    const parsed = JSON.parse(jsonMatch[0]);
    const normalizedOverall = parsed.overallScore === "critical_issues" || parsed.overallScore === "needs_work" || parsed.overallScore === "ready" ? parsed.overallScore : "needs_work";
    const parsedScores = parsed.rubricScores && typeof parsed.rubricScores === "object" ? parsed.rubricScores : {};
    const rubricScores = Object.fromEntries(rubrics.map((rubric) => {
      const raw = parsedScores[rubric.criteria];
      const score = typeof raw === "number" ? Math.max(0, Math.min(100, Math.round(raw))) : 60;
      return [rubric.criteria, score];
    }));
    const items = Array.isArray(parsed.items) ? parsed.items.map((item, idx) => {
      const severity = item?.severity === "critical" || item?.severity === "warning" || item?.severity === "suggestion" ? item.severity : "suggestion";
      if (!item?.message || typeof item.message !== "string") return null;
      return {
        id: typeof item.id === "string" && item.id ? item.id : `submit_fb_${idx + 1}`,
        severity,
        message: item.message,
        suggestion: typeof item.suggestion === "string" ? item.suggestion : void 0
      };
    }).filter((item) => item !== null) : [];
    return {
      overallScore: normalizedOverall,
      rubricScores,
      items
    };
  } catch (error) {
    console.error("Submit-time rubric precheck error:", error);
    return generateFallbackPrecheck(content, rubrics);
  }
}
const runExplorerPrecheck_createServerFn_handler = createServerRpc({
  id: "20e6c74d5ca88af7cf825c4f2acf87deab8ead48361621183d817fe59037892b",
  name: "runExplorerPrecheck",
  filename: "src/server/api/artifacts.ts"
}, (opts, signal) => runExplorerPrecheck.__executeServer(opts, signal));
const runExplorerPrecheck = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(runExplorerPrecheck_createServerFn_handler, async ({
  data
}) => {
  const result = await generateSubmissionPrecheck(data.content, data.rubrics);
  let score = 0;
  const entries = Object.entries(result.rubricScores);
  if (entries.length > 0) {
    const weightByCriterion = new Map(data.rubrics.map((r) => [r.criteria, r.weight]));
    let weightedSum = 0;
    let totalWeight = 0;
    for (const [key, s] of entries) {
      const weight = weightByCriterion.get(key) ?? 0;
      weightedSum += s * weight;
      totalWeight += weight;
    }
    score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : Math.round(entries.reduce((sum, [, s]) => sum + s, 0) / entries.length);
  } else {
    switch (result.overallScore) {
      case "ready":
        score = 85;
        break;
      case "needs_work":
        score = 65;
        break;
      case "critical_issues":
        score = 40;
        break;
      default:
        score = 0;
    }
  }
  return {
    overallScore: result.overallScore,
    score,
    rubricScores: result.rubricScores,
    items: result.items
  };
});
const createArtifactSchema = z.object({
  userId: z.string(),
  sessionId: z.string(),
  teamId: z.string(),
  title: z.string().min(1).max(500),
  content: z.string().optional(),
  contentType: z.enum(["document"]).default("document")
});
const updateArtifactSchema = z.object({
  artifactId: z.string(),
  title: z.string().optional(),
  content: z.string().optional()
});
const submitArtifactSchema = z.object({
  artifactId: z.string(),
  userId: z.string()
});
const createShowcaseLinkSchema = z.object({
  artifactId: z.string(),
  versionId: z.string().optional(),
  expiresInDays: z.number().int().min(1).max(365).optional()
});
const getArtifact_createServerFn_handler = createServerRpc({
  id: "8cc0ad7ef0ee03b8ede21308fee66cb35730f30af05c20f66199e66c309e0909",
  name: "getArtifact",
  filename: "src/server/api/artifacts.ts"
}, (opts, signal) => getArtifact.__executeServer(opts, signal));
const getArtifact = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getArtifact_createServerFn_handler, async ({
  data
}) => {
  try {
    const artifact = await db.query.artifacts.findFirst({
      where: eq(artifacts.id, data.artifactId),
      with: {
        user: true,
        versions: {
          orderBy: desc(artifactVersions.submittedAt)
        },
        precheckResults: {
          orderBy: desc(precheckResults.createdAt),
          limit: 1,
          with: {
            feedbackItems: true
          }
        }
      }
    });
    if (!artifact) {
      return {
        success: false,
        error: "Artifact not found"
      };
    }
    return {
      success: true,
      artifact: {
        ...artifact,
        createdAt: artifact.createdAt.toISOString(),
        updatedAt: artifact.updatedAt.toISOString(),
        lastPrecheckAt: artifact.lastPrecheckAt?.toISOString(),
        versions: artifact.versions.map((v) => ({
          ...v,
          submittedAt: v.submittedAt.toISOString()
        })),
        latestPrecheck: artifact.precheckResults[0] || null,
        author: {
          id: artifact.user.id,
          name: artifact.user.name,
          avatarUrl: artifact.user.avatarUrl
        }
      }
    };
  } catch (error) {
    console.error("Get artifact error:", error);
    return {
      success: false,
      error: "Failed to get artifact"
    };
  }
});
const getUserSessionArtifacts_createServerFn_handler = createServerRpc({
  id: "aef88564a41758e0f4376e9387288509923d40b3cb6ebe68c76135c7ab03ade8",
  name: "getUserSessionArtifacts",
  filename: "src/server/api/artifacts.ts"
}, (opts, signal) => getUserSessionArtifacts.__executeServer(opts, signal));
const getUserSessionArtifacts = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getUserSessionArtifacts_createServerFn_handler, async ({
  data
}) => {
  try {
    const userArtifacts = await db.query.artifacts.findMany({
      where: and(eq(artifacts.userId, data.userId), eq(artifacts.sessionId, data.sessionId)),
      orderBy: desc(artifacts.updatedAt),
      with: {
        versions: {
          orderBy: desc(artifactVersions.submittedAt)
        }
      }
    });
    return {
      success: true,
      artifacts: userArtifacts.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
        lastPrecheckAt: a.lastPrecheckAt?.toISOString(),
        versionCount: a.versions.length,
        latestVersion: a.versions[0]?.version || null
      }))
    };
  } catch (error) {
    console.error("Get user session artifacts error:", error);
    return {
      success: false,
      error: "Failed to get artifacts"
    };
  }
});
const getTeamSessionArtifact_createServerFn_handler = createServerRpc({
  id: "44bc149ea25e291badbb2a2e6866d51536d4f966d6be9a6de5a5cec14efd2691",
  name: "getTeamSessionArtifact",
  filename: "src/server/api/artifacts.ts"
}, (opts, signal) => getTeamSessionArtifact.__executeServer(opts, signal));
const getTeamSessionArtifact = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getTeamSessionArtifact_createServerFn_handler, async ({
  data
}) => {
  try {
    const teamArtifacts = await db.query.artifacts.findMany({
      where: and(eq(artifacts.teamId, data.teamId), eq(artifacts.sessionId, data.sessionId)),
      orderBy: desc(artifacts.updatedAt),
      limit: 1,
      with: {
        versions: {
          orderBy: desc(artifactVersions.submittedAt)
        }
      }
    });
    const artifact = teamArtifacts[0];
    if (!artifact) {
      return {
        success: true,
        artifact: null
      };
    }
    return {
      success: true,
      artifact: {
        ...artifact,
        createdAt: artifact.createdAt.toISOString(),
        updatedAt: artifact.updatedAt.toISOString(),
        lastPrecheckAt: artifact.lastPrecheckAt?.toISOString(),
        versionCount: artifact.versions.length,
        latestVersion: artifact.versions[0]?.version || null,
        lastSubmittedAt: artifact.versions[0]?.submittedAt?.toISOString() || null
      }
    };
  } catch (error) {
    console.error("Get team session artifact error:", error);
    return {
      success: false,
      error: "Failed to get team artifact"
    };
  }
});
const getUserArtifacts_createServerFn_handler = createServerRpc({
  id: "1472286d1bf96034ac7d4141f0fb686feba07c5149639aab84cbc8ec7873d395",
  name: "getUserArtifacts",
  filename: "src/server/api/artifacts.ts"
}, (opts, signal) => getUserArtifacts.__executeServer(opts, signal));
const getUserArtifacts = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getUserArtifacts_createServerFn_handler, async ({
  data
}) => {
  try {
    const userArtifacts = await db.query.artifacts.findMany({
      where: eq(artifacts.userId, data.userId),
      orderBy: desc(artifacts.updatedAt),
      with: {
        versions: {
          orderBy: desc(artifactVersions.submittedAt),
          limit: 1
        },
        session: {
          with: {
            project: true
          }
        }
      }
    });
    return {
      success: true,
      artifacts: userArtifacts.map((a) => ({
        id: a.id,
        title: a.title,
        contentType: a.contentType,
        status: a.status,
        projectId: a.session.project.id,
        projectTitle: a.session.project.title,
        sessionId: a.session.id,
        sessionTitle: a.session.title,
        latestVersion: a.versions[0]?.version || null,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString()
      }))
    };
  } catch (error) {
    console.error("Get user artifacts error:", error);
    return {
      success: false,
      error: "Failed to get artifacts"
    };
  }
});
const createArtifact_createServerFn_handler = createServerRpc({
  id: "509f8b786899fa08c1af89dcce77849d212bea7213e58cb454e4c997f299b914",
  name: "createArtifact",
  filename: "src/server/api/artifacts.ts"
}, (opts, signal) => createArtifact.__executeServer(opts, signal));
const createArtifact = createServerFn({
  method: "POST"
}).inputValidator((data) => createArtifactSchema.parse(data)).handler(createArtifact_createServerFn_handler, async ({
  data
}) => {
  try {
    const artifactId = v4();
    const now = /* @__PURE__ */ new Date();
    await db.insert(artifacts).values({
      id: artifactId,
      userId: data.userId,
      sessionId: data.sessionId,
      teamId: data.teamId,
      title: data.title,
      content: data.content,
      contentType: data.contentType,
      status: "draft",
      createdAt: now,
      updatedAt: now
    });
    return {
      success: true,
      artifactId
    };
  } catch (error) {
    console.error("Create artifact error:", error);
    return {
      success: false,
      error: "Failed to create artifact"
    };
  }
});
const updateArtifact_createServerFn_handler = createServerRpc({
  id: "08c35f9fce5ee316bf2b40cc81327591bd3f3d2b6a23011e4899cd37e2267a85",
  name: "updateArtifact",
  filename: "src/server/api/artifacts.ts"
}, (opts, signal) => updateArtifact.__executeServer(opts, signal));
const updateArtifact = createServerFn({
  method: "POST"
}).inputValidator((data) => updateArtifactSchema.parse(data)).handler(updateArtifact_createServerFn_handler, async ({
  data
}) => {
  try {
    const {
      artifactId,
      ...updates
    } = data;
    await db.update(artifacts).set({
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(artifacts.id, artifactId));
    return {
      success: true
    };
  } catch (error) {
    console.error("Update artifact error:", error);
    return {
      success: false,
      error: "Failed to update artifact"
    };
  }
});
const submitArtifact_createServerFn_handler = createServerRpc({
  id: "6c520ede26c6f0ecab73b622621971b0b0e831613eb516604a8066e90fceb645",
  name: "submitArtifact",
  filename: "src/server/api/artifacts.ts"
}, (opts, signal) => submitArtifact.__executeServer(opts, signal));
const submitArtifact = createServerFn({
  method: "POST"
}).inputValidator((data) => submitArtifactSchema.parse(data)).handler(submitArtifact_createServerFn_handler, async ({
  data
}) => {
  try {
    const artifact = await db.query.artifacts.findFirst({
      where: eq(artifacts.id, data.artifactId),
      with: {
        versions: {
          orderBy: desc(artifactVersions.submittedAt)
        },
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
    if (!artifact) {
      return {
        success: false,
        error: "Artifact not found"
      };
    }
    if (!artifact.content) {
      return {
        success: false,
        error: "Cannot submit empty artifact"
      };
    }
    let versionNumber;
    if (artifact.versions.length === 0) {
      versionNumber = "v1.0";
    } else {
      const lastVersion = artifact.versions[0].version;
      const [major, minor] = lastVersion.replace("v", "").split(".").map(Number);
      versionNumber = `v${major}.${minor + 1}`;
    }
    const versionId = v4();
    const now = /* @__PURE__ */ new Date();
    await db.insert(artifactVersions).values({
      id: versionId,
      artifactId: data.artifactId,
      version: versionNumber,
      content: artifact.content,
      submittedAt: now,
      submittedBy: data.userId
    });
    await db.update(artifacts).set({
      status: "submitted",
      currentVersion: versionNumber,
      updatedAt: now
    }).where(eq(artifacts.id, data.artifactId));
    const generatedPrecheck = await generateSubmissionPrecheck(artifact.content, artifact.session.rubrics);
    const teamSessionArtifacts = await db.query.artifacts.findMany({
      where: and(eq(artifacts.teamId, artifact.teamId), eq(artifacts.sessionId, artifact.sessionId))
    });
    for (const targetArtifact of teamSessionArtifacts) {
      const precheckId = v4();
      await db.insert(precheckResults).values({
        id: precheckId,
        artifactId: targetArtifact.id,
        overallScore: generatedPrecheck.overallScore,
        feedback: JSON.stringify(generatedPrecheck.items),
        rubricScores: JSON.stringify(generatedPrecheck.rubricScores),
        createdAt: now
      });
      if (generatedPrecheck.items.length > 0) {
        await db.insert(precheckFeedbackItems).values(generatedPrecheck.items.map((item) => ({
          id: v4(),
          precheckId,
          severity: item.severity,
          message: item.message,
          suggestion: item.suggestion,
          lineNumber: item.lineNumber,
          createdAt: now
        })));
      }
    }
    await db.update(artifacts).set({
      status: "submitted",
      lastPrecheckAt: now,
      precheckPassed: generatedPrecheck.overallScore !== "critical_issues",
      updatedAt: now
    }).where(and(eq(artifacts.teamId, artifact.teamId), eq(artifacts.sessionId, artifact.sessionId)));
    return {
      success: true,
      versionId,
      version: versionNumber
    };
  } catch (error) {
    console.error("Submit artifact error:", error);
    return {
      success: false,
      error: "Failed to submit artifact"
    };
  }
});
const storePrecheckResults_createServerFn_handler = createServerRpc({
  id: "caaa96b6417857d2636ba1b64a5737ee92512d1e2abf3b95c93118af10fb2434",
  name: "storePrecheckResults",
  filename: "src/server/api/artifacts.ts"
}, (opts, signal) => storePrecheckResults.__executeServer(opts, signal));
const storePrecheckResults = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(storePrecheckResults_createServerFn_handler, async ({
  data
}) => {
  try {
    const precheckId = v4();
    const now = /* @__PURE__ */ new Date();
    await db.insert(precheckResults).values({
      id: precheckId,
      artifactId: data.artifactId,
      overallScore: data.overallScore,
      feedback: JSON.stringify(data.feedback),
      rubricScores: data.rubricScores ? JSON.stringify(data.rubricScores) : null,
      contentSnapshot: data.contentSnapshot || null,
      createdAt: now
    });
    if (data.feedback.length > 0) {
      await db.insert(precheckFeedbackItems).values(data.feedback.map((f) => ({
        id: v4(),
        precheckId,
        severity: f.severity,
        message: f.message,
        suggestion: f.suggestion,
        lineNumber: f.lineNumber,
        createdAt: now
      })));
    }
    const currentArtifact = await db.query.artifacts.findFirst({
      where: eq(artifacts.id, data.artifactId),
      columns: {
        status: true
      }
    });
    const terminalStatuses = ["submitted", "under_review", "approved", "needs_revision"];
    const shouldUpdateStatus = !currentArtifact || !terminalStatuses.includes(currentArtifact.status);
    await db.update(artifacts).set({
      lastPrecheckAt: now,
      precheckPassed: data.overallScore !== "critical_issues",
      ...shouldUpdateStatus ? {
        status: "precheck_complete"
      } : {},
      updatedAt: now
    }).where(eq(artifacts.id, data.artifactId));
    return {
      success: true,
      precheckId
    };
  } catch (error) {
    console.error("Store precheck results error:", error);
    return {
      success: false,
      error: "Failed to store precheck results"
    };
  }
});
const createShowcaseLink_createServerFn_handler = createServerRpc({
  id: "df02a87ae550bcd1c7c02cce7430b9ddf3641cdac34e0814eb45c4fd9fae6658",
  name: "createShowcaseLink",
  filename: "src/server/api/artifacts.ts"
}, (opts, signal) => createShowcaseLink.__executeServer(opts, signal));
const createShowcaseLink = createServerFn({
  method: "POST"
}).inputValidator((data) => createShowcaseLinkSchema.parse(data)).handler(createShowcaseLink_createServerFn_handler, async ({
  data
}) => {
  try {
    const linkId = v4();
    const token = v4().replace(/-/g, "");
    const now = /* @__PURE__ */ new Date();
    const expiresAt = data.expiresInDays ? new Date(now.getTime() + data.expiresInDays * 24 * 60 * 60 * 1e3) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1e3);
    await db.insert(showcaseLinks).values({
      id: linkId,
      artifactId: data.artifactId,
      versionId: data.versionId,
      token,
      expiresAt,
      isActive: true,
      viewCount: 0,
      createdAt: now
    });
    return {
      success: true,
      linkId,
      token,
      url: `/showcase/${token}`,
      expiresAt: expiresAt.toISOString()
    };
  } catch (error) {
    console.error("Create showcase link error:", error);
    return {
      success: false,
      error: "Failed to create showcase link"
    };
  }
});
const getShowcaseByToken_createServerFn_handler = createServerRpc({
  id: "6d42816626b6a92d2c3bb92bd86591ffa4e2bcc36d7881e749796a2ee1f268ed",
  name: "getShowcaseByToken",
  filename: "src/server/api/artifacts.ts"
}, (opts, signal) => getShowcaseByToken.__executeServer(opts, signal));
const getShowcaseByToken = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getShowcaseByToken_createServerFn_handler, async ({
  data
}) => {
  try {
    const link = await db.query.showcaseLinks.findFirst({
      where: eq(showcaseLinks.token, data.token),
      with: {
        artifact: {
          with: {
            user: true,
            session: {
              with: {
                project: true
              }
            }
          }
        },
        version: true
      }
    });
    if (!link) {
      return {
        success: false,
        error: "Showcase not found"
      };
    }
    if (!link.isActive) {
      return {
        success: false,
        error: "This showcase link has been deactivated"
      };
    }
    if (link.expiresAt && link.expiresAt < /* @__PURE__ */ new Date()) {
      return {
        success: false,
        error: "This showcase link has expired"
      };
    }
    await db.update(showcaseLinks).set({
      viewCount: link.viewCount + 1
    }).where(eq(showcaseLinks.id, link.id));
    return {
      success: true,
      showcase: {
        title: link.artifact.title,
        content: link.version?.content || link.artifact.content,
        contentType: link.artifact.contentType,
        version: link.version?.version,
        author: {
          name: link.artifact.user.name,
          avatarUrl: link.artifact.user.avatarUrl
        },
        project: link.artifact.session.project.title,
        session: link.artifact.session.title,
        viewCount: link.viewCount + 1
      }
    };
  } catch (error) {
    console.error("Get showcase error:", error);
    return {
      success: false,
      error: "Failed to get showcase"
    };
  }
});
const revokeShowcaseLink_createServerFn_handler = createServerRpc({
  id: "91ab36cdd44d1e7a3454deb1e13bbed7346f7bcc08c74c3381c4982011542449",
  name: "revokeShowcaseLink",
  filename: "src/server/api/artifacts.ts"
}, (opts, signal) => revokeShowcaseLink.__executeServer(opts, signal));
const revokeShowcaseLink = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(revokeShowcaseLink_createServerFn_handler, async ({
  data
}) => {
  try {
    await db.update(showcaseLinks).set({
      isActive: false
    }).where(eq(showcaseLinks.id, data.linkId));
    return {
      success: true
    };
  } catch (error) {
    console.error("Revoke showcase link error:", error);
    return {
      success: false,
      error: "Failed to revoke showcase link"
    };
  }
});
const getArtifactVersions_createServerFn_handler = createServerRpc({
  id: "a9f7cbc30f63da1be9d9a0382d1b864ce4f145d776342535787687622053c8aa",
  name: "getArtifactVersions",
  filename: "src/server/api/artifacts.ts"
}, (opts, signal) => getArtifactVersions.__executeServer(opts, signal));
const getArtifactVersions = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getArtifactVersions_createServerFn_handler, async ({
  data
}) => {
  try {
    const versions = await db.query.artifactVersions.findMany({
      where: eq(artifactVersions.artifactId, data.artifactId),
      orderBy: desc(artifactVersions.submittedAt),
      with: {
        submitter: true
      }
    });
    return {
      success: true,
      versions: versions.map((v) => ({
        id: v.id,
        version: v.version,
        submittedAt: v.submittedAt.toISOString(),
        submittedBy: {
          id: v.submitter.id,
          name: v.submitter.name
        }
      }))
    };
  } catch (error) {
    console.error("Get artifact versions error:", error);
    return {
      success: false,
      error: "Failed to get versions"
    };
  }
});
const getArtifactVersion_createServerFn_handler = createServerRpc({
  id: "edc115a0ecd3ab120f22c722991f62cf9ac9971e336ae316022910babc9883e9",
  name: "getArtifactVersion",
  filename: "src/server/api/artifacts.ts"
}, (opts, signal) => getArtifactVersion.__executeServer(opts, signal));
const getArtifactVersion = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getArtifactVersion_createServerFn_handler, async ({
  data
}) => {
  try {
    const version = await db.query.artifactVersions.findFirst({
      where: eq(artifactVersions.id, data.versionId)
    });
    if (!version) {
      return {
        success: false,
        error: "Version not found"
      };
    }
    return {
      success: true,
      version: {
        ...version,
        submittedAt: version.submittedAt.toISOString()
      }
    };
  } catch (error) {
    console.error("Get artifact version error:", error);
    return {
      success: false,
      error: "Failed to get version"
    };
  }
});
export {
  createArtifact_createServerFn_handler,
  createShowcaseLink_createServerFn_handler,
  getArtifactVersion_createServerFn_handler,
  getArtifactVersions_createServerFn_handler,
  getArtifact_createServerFn_handler,
  getShowcaseByToken_createServerFn_handler,
  getTeamSessionArtifact_createServerFn_handler,
  getUserArtifacts_createServerFn_handler,
  getUserSessionArtifacts_createServerFn_handler,
  revokeShowcaseLink_createServerFn_handler,
  runExplorerPrecheck_createServerFn_handler,
  storePrecheckResults_createServerFn_handler,
  submitArtifact_createServerFn_handler,
  updateArtifact_createServerFn_handler
};
