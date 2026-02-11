import { T as TSS_SERVER_FUNCTION, g as getServerFnById, c as createServerFn } from "../server.js";
import { z } from "zod";
const createSsrRpc = (functionId, importer) => {
  const url = "/_serverFn/" + functionId;
  const serverFnMeta = { id: functionId };
  const fn = async (...args) => {
    const serverFn = await getServerFnById(functionId);
    return serverFn(...args);
  };
  return Object.assign(fn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
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
const runExplorerPrecheck = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("20e6c74d5ca88af7cf825c4f2acf87deab8ead48361621183d817fe59037892b"));
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
createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("8cc0ad7ef0ee03b8ede21308fee66cb35730f30af05c20f66199e66c309e0909"));
const getUserSessionArtifacts = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("aef88564a41758e0f4376e9387288509923d40b3cb6ebe68c76135c7ab03ade8"));
const getTeamSessionArtifact = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("44bc149ea25e291badbb2a2e6866d51536d4f966d6be9a6de5a5cec14efd2691"));
const getUserArtifacts = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("1472286d1bf96034ac7d4141f0fb686feba07c5149639aab84cbc8ec7873d395"));
const createArtifact = createServerFn({
  method: "POST"
}).inputValidator((data) => createArtifactSchema.parse(data)).handler(createSsrRpc("509f8b786899fa08c1af89dcce77849d212bea7213e58cb454e4c997f299b914"));
const updateArtifact = createServerFn({
  method: "POST"
}).inputValidator((data) => updateArtifactSchema.parse(data)).handler(createSsrRpc("08c35f9fce5ee316bf2b40cc81327591bd3f3d2b6a23011e4899cd37e2267a85"));
const submitArtifact = createServerFn({
  method: "POST"
}).inputValidator((data) => submitArtifactSchema.parse(data)).handler(createSsrRpc("6c520ede26c6f0ecab73b622621971b0b0e831613eb516604a8066e90fceb645"));
const storePrecheckResults = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("caaa96b6417857d2636ba1b64a5737ee92512d1e2abf3b95c93118af10fb2434"));
createServerFn({
  method: "POST"
}).inputValidator((data) => createShowcaseLinkSchema.parse(data)).handler(createSsrRpc("df02a87ae550bcd1c7c02cce7430b9ddf3641cdac34e0814eb45c4fd9fae6658"));
createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("6d42816626b6a92d2c3bb92bd86591ffa4e2bcc36d7881e749796a2ee1f268ed"));
createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("91ab36cdd44d1e7a3454deb1e13bbed7346f7bcc08c74c3381c4982011542449"));
createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("a9f7cbc30f63da1be9d9a0382d1b864ce4f145d776342535787687622053c8aa"));
createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("edc115a0ecd3ab120f22c722991f62cf9ac9971e336ae316022910babc9883e9"));
export {
  getUserArtifacts as a,
  createArtifact as b,
  createSsrRpc as c,
  getUserSessionArtifacts as d,
  storePrecheckResults as e,
  getTeamSessionArtifact as f,
  generateSubmissionPrecheck as g,
  runExplorerPrecheck as r,
  submitArtifact as s,
  updateArtifact as u
};
