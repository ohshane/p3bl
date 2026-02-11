import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, AlertCircle, CheckCircle, Clock, X, TrendingDown, Info, Zap, AlertTriangle, Bot, CheckCheck, Search, ClipboardCheck, Sparkles, ArrowLeft, Eye, Activity } from "lucide-react";
import { z as useCreatorStore, v as Tooltip, w as TooltipTrigger, x as TooltipContent, d as cn, T as TooltipProvider, u as useAuthStore, B as Button, a as Badge, s as safeFormatDate, D as Dialog, n as DialogContent, o as DialogHeader, p as DialogTitle, E as DialogDescription, aB as Textarea, F as DialogFooter, I as Input, a5 as Select, a6 as SelectTrigger, a7 as SelectValue, a8 as SelectContent, a9 as SelectItem, aJ as getProjectSubmissions, aK as gradeSubmission, aL as regradeSubmission, aM as Route } from "./router-Bhor0jGk.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-D_4abuiO.js";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip as Tooltip$1, Legend, ReferenceLine, Line } from "recharts";
import { C as Card, a as CardContent, b as CardHeader, c as CardTitle } from "./card-CuhZmkUZ.js";
import { f as getTeamSessionArtifact } from "./artifacts-V6YAL9mY.js";
import { toast } from "sonner";
import "next-themes";
import "zustand";
import "zustand/middleware";
import "./auth-B6e831Uo.js";
import "zod";
import "../server.js";
import "node:async_hooks";
import "@tanstack/react-router/ssr/server";
import "class-variance-authority";
import "radix-ui";
import "clsx";
import "tailwind-merge";
import "date-fns";
import "qrcode";
function LiveMatrix({ projectId }) {
  const {
    getProject,
    getLiveMatrix,
    fetchLiveMatrix,
    isLoadingMatrix
  } = useCreatorStore();
  const project = getProject(projectId);
  const matrix = getLiveMatrix(projectId);
  useEffect(() => {
    fetchLiveMatrix(projectId);
  }, [projectId, fetchLiveMatrix]);
  if (!project) return null;
  const statusIcons = {
    not_started: /* @__PURE__ */ jsx(X, { className: "w-3 h-3" }),
    in_progress: /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
    submitted: /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
    approved: /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3" }),
    needs_revision: /* @__PURE__ */ jsx(AlertCircle, { className: "w-3 h-3" })
  };
  const statusColors = {
    not_started: "bg-muted text-muted-foreground",
    in_progress: "bg-yellow-500/20 text-yellow-500",
    submitted: "bg-blue-500/20 text-blue-500",
    approved: "bg-green-500/20 text-green-500",
    needs_revision: "bg-red-500/20 text-red-500"
  };
  const riskColors = {
    green: "border-green-500/50 bg-green-500/5",
    yellow: "border-yellow-500/50 bg-yellow-500/5",
    red: "border-red-500/50 bg-red-500/5"
  };
  const canShowTimestamp = (status) => status === "approved" || status === "submitted" || status === "in_progress";
  const formatSessionDuration = (startDate, endDate, durationMinutes) => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        return `${start.toLocaleString()} - ${end.toLocaleString()}`;
      }
    }
    if (durationMinutes && durationMinutes > 0) {
      if (durationMinutes < 60) return `${durationMinutes} min`;
      if (durationMinutes < 1440) {
        const h2 = Math.floor(durationMinutes / 60);
        const m = durationMinutes % 60;
        return m > 0 ? `${h2}h ${m}m` : `${h2} hour${h2 > 1 ? "s" : ""}`;
      }
      const d = Math.floor(durationMinutes / 1440);
      const h = Math.floor(durationMinutes % 1440 / 60);
      return h > 0 ? `${d}d ${h}h` : `${d} day${d > 1 ? "s" : ""}`;
    }
    return "Duration not set";
  };
  if (isLoadingMatrix && matrix.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center py-12", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-cyan-500 mr-2" }),
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Loading team progress..." })
    ] });
  }
  if (matrix.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "text-center py-12 bg-muted/40 rounded-lg border border-border", children: [
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "No teams have joined this project yet." }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mt-2", children: [
        "Share the join code ",
        /* @__PURE__ */ jsx("span", { className: "font-mono text-cyan-500", children: project.joinCode }),
        " with participants."
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground", children: "Team Progress Matrix" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsx("div", { className: "w-3 h-3 rounded bg-green-500/20" }),
          /* @__PURE__ */ jsx("span", { children: "Approved" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsx("div", { className: "w-3 h-3 rounded bg-blue-500/20" }),
          /* @__PURE__ */ jsx("span", { children: "Submitted" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsx("div", { className: "w-3 h-3 rounded bg-yellow-500/20" }),
          /* @__PURE__ */ jsx("span", { children: "In Progress" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsx("div", { className: "w-3 h-3 rounded bg-muted" }),
          /* @__PURE__ */ jsx("span", { children: "Not Started" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full border-collapse", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "text-left p-3 text-muted-foreground text-sm font-medium border-b border-border", children: "Team" }),
        project.sessions.map((session, idx) => /* @__PURE__ */ jsx(
          "th",
          {
            className: "p-3 text-center text-muted-foreground text-sm font-medium border-b border-border min-w-[100px]",
            children: /* @__PURE__ */ jsxs(Tooltip, { children: [
              /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx("span", { className: "cursor-help", children: idx + 1 }) }),
              /* @__PURE__ */ jsx(TooltipContent, { children: /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("p", { children: session.title || `Session ${idx + 1}` }),
                /* @__PURE__ */ jsx("p", { children: formatSessionDuration(session.startDate, session.endDate, session.durationMinutes) })
              ] }) })
            ] })
          },
          session.id || idx
        )),
        /* @__PURE__ */ jsx("th", { className: "p-3 text-center text-muted-foreground text-sm font-medium border-b border-border", children: "Progress" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: matrix.map((entry) => {
        const completedCount = entry.sessionProgress.filter(
          (s) => s.status === "approved" || s.status === "submitted"
        ).length;
        const progressPercent = project.sessions.length > 0 ? Math.round(completedCount / project.sessions.length * 100) : 0;
        return /* @__PURE__ */ jsxs(
          "tr",
          {
            className: cn(
              "border-b border-border/70 hover:bg-muted/60",
              riskColors[entry.riskLevel]
            ),
            children: [
              /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: cn(
                      "w-2 h-8 rounded-full",
                      entry.riskLevel === "green" && "bg-green-500",
                      entry.riskLevel === "yellow" && "bg-yellow-500",
                      entry.riskLevel === "red" && "bg-red-500"
                    )
                  }
                ),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { className: "font-medium text-foreground", children: entry.teamName }),
                  /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
                    entry.members.length,
                    " members"
                  ] })
                ] })
              ] }) }),
              entry.sessionProgress.map((progress, idx) => /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: canShowTimestamp(progress.status) && progress.statusUpdatedAt ? /* @__PURE__ */ jsxs(Tooltip, { children: [
                /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: cn(
                      "inline-flex items-center justify-center w-8 h-8 rounded-lg",
                      statusColors[progress.status]
                    ),
                    children: statusIcons[progress.status]
                  }
                ) }),
                /* @__PURE__ */ jsx(TooltipContent, { children: new Date(progress.statusUpdatedAt).toLocaleString() })
              ] }) : /* @__PURE__ */ jsx(
                "div",
                {
                  className: cn(
                    "inline-flex items-center justify-center w-8 h-8 rounded-lg",
                    statusColors[progress.status]
                  ),
                  children: statusIcons[progress.status]
                }
              ) }, idx)),
              /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("div", { className: "flex-1 h-2 bg-muted rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: "h-full bg-cyan-500 rounded-full transition-all",
                    style: { width: `${progressPercent}%` }
                  }
                ) }),
                /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground w-10 text-right", children: [
                  progressPercent,
                  "%"
                ] })
              ] }) })
            ]
          },
          entry.teamId
        );
      }) })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "p-4 bg-muted/40 rounded-lg border border-border", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Click on a team row to view individual member progress and details." }) })
  ] });
}
const TEAM_COLORS = [
  "#06B6D4",
  // cyan
  "#8B5CF6",
  // purple
  "#F59E0B",
  // amber
  "#22C55E",
  // green
  "#EF4444",
  // red
  "#EC4899",
  // pink
  "#3B82F6",
  // blue
  "#F97316",
  // orange
  "#14B8A6",
  // teal
  "#A855F7",
  // violet
  "#64748B",
  // slate
  "#84CC16"
  // lime
];
function toDateKey(d) {
  return d.toISOString().split("T")[0];
}
function toLabel(d) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
function DipChart({ projectId, projectStartDate, projectEndDate }) {
  const {
    getDipChartData,
    fetchDipChartData,
    isLoadingMetrics
  } = useCreatorStore();
  const rawData = getDipChartData(projectId);
  useEffect(() => {
    fetchDipChartData(projectId);
  }, [projectId, fetchDipChartData]);
  const teamList = useMemo(() => {
    const seen = /* @__PURE__ */ new Map();
    for (const pt of rawData) {
      if (!seen.has(pt.teamId)) {
        seen.set(pt.teamId, pt.teamName);
      }
    }
    return Array.from(seen.entries()).map(([id, name], idx) => ({
      id,
      name,
      color: TEAM_COLORS[idx % TEAM_COLORS.length],
      dataKey: `team_${id}`
    }));
  }, [rawData]);
  const { chartRows, dipPoint } = useMemo(() => {
    const start = new Date(projectStartDate);
    const end = new Date(projectEndDate);
    const now = /* @__PURE__ */ new Date();
    const axisEnd = end < now ? end : now;
    if (isNaN(start.getTime()) || isNaN(axisEnd.getTime()) || start > axisEnd) {
      return { chartRows: [], dipPoint: null };
    }
    const days = [];
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    const axisEndDay = new Date(axisEnd);
    axisEndDay.setHours(23, 59, 59, 999);
    while (cursor <= axisEndDay) {
      const key = toDateKey(cursor);
      days.push({
        dateKey: key,
        label: toLabel(cursor),
        ts: cursor.getTime()
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    const dayTeamScore = /* @__PURE__ */ new Map();
    let minScore = 101;
    let minDateKey = "";
    for (const pt of rawData) {
      const dayKey = pt.date.split("T")[0];
      const mapKey = `${dayKey}|${pt.teamId}`;
      dayTeamScore.set(mapKey, pt.score);
      if (pt.score < minScore) {
        minScore = pt.score;
        minDateKey = dayKey;
      }
    }
    for (const row of days) {
      for (const team of teamList) {
        const mapKey = `${row.dateKey}|${team.id}`;
        const score = dayTeamScore.get(mapKey);
        if (score !== void 0) {
          row[team.dataKey] = score;
        }
      }
    }
    return {
      chartRows: days,
      dipPoint: minDateKey ? { dateKey: minDateKey, score: minScore } : null
    };
  }, [rawData, teamList, projectStartDate, projectEndDate]);
  const teamSummaries = useMemo(() => {
    const latest = /* @__PURE__ */ new Map();
    for (const pt of rawData) {
      const existing = latest.get(pt.teamId);
      if (!existing || pt.date > existing.date) {
        latest.set(pt.teamId, pt);
      }
    }
    return teamList.map((t) => {
      const pt = latest.get(t.id);
      return {
        ...t,
        latestScore: pt?.score ?? 0,
        overallScore: pt?.overallScore ?? "needs_work"
      };
    });
  }, [rawData, teamList]);
  const avgScore = useMemo(() => {
    if (teamSummaries.length === 0) return 0;
    return Math.round(
      teamSummaries.reduce((s, t) => s + t.latestScore, 0) / teamSummaries.length
    );
  }, [teamSummaries]);
  const CustomTooltipContent = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    const validEntries = payload.filter(
      (entry) => entry.value !== void 0 && entry.value !== null
    );
    if (validEntries.length === 0) return null;
    return /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-3 shadow-lg text-sm", children: [
      /* @__PURE__ */ jsx("div", { className: "text-muted-foreground mb-2", children: label }),
      validEntries.map((entry, idx) => {
        const teamId = entry.dataKey.replace("team_", "");
        const team = teamList.find((t) => t.id === teamId);
        const dayKey = entry.payload.dateKey;
        const rawPt = rawData.find(
          (pt) => pt.teamId === teamId && pt.date.startsWith(dayKey)
        );
        return /* @__PURE__ */ jsxs("div", { className: "mb-2 last:mb-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "w-2.5 h-2.5 rounded-full",
                style: { backgroundColor: entry.color }
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: team?.name || teamId }),
            /* @__PURE__ */ jsxs("span", { className: "ml-auto font-bold text-foreground", children: [
              entry.value,
              "%"
            ] })
          ] }),
          rawPt && Object.keys(rawPt.rubricScores).length > 0 && /* @__PURE__ */ jsx("div", { className: "ml-5 mt-1 space-y-0.5", children: Object.entries(rawPt.rubricScores).map(([criterion, score]) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "flex justify-between text-xs text-muted-foreground",
              children: [
                /* @__PURE__ */ jsx("span", { children: criterion }),
                /* @__PURE__ */ jsxs("span", { children: [
                  score,
                  "%"
                ] })
              ]
            },
            criterion
          )) })
        ] }, idx);
      })
    ] });
  };
  if (isLoadingMetrics && rawData.length === 0) {
    return /* @__PURE__ */ jsx(Card, { className: "bg-card border-border", children: /* @__PURE__ */ jsxs(CardContent, { className: "flex items-center justify-center py-12", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-cyan-500 mr-2" }),
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Loading precheck data..." })
    ] }) });
  }
  if (rawData.length === 0) {
    return /* @__PURE__ */ jsxs(Card, { className: "bg-card border-border", children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-foreground", children: [
        /* @__PURE__ */ jsx(TrendingDown, { className: "w-5 h-5 text-cyan-500" }),
        "The Dip Chart",
        /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsxs(Tooltip, { children: [
          /* @__PURE__ */ jsx(TooltipTrigger, { children: /* @__PURE__ */ jsx(Info, { className: "w-4 h-4 text-muted-foreground" }) }),
          /* @__PURE__ */ jsx(TooltipContent, { className: "max-w-xs", children: /* @__PURE__ */ jsx("p", { children: "The Dip Chart shows each team's pre-check scores over time. Each point represents a rubric-weighted score from a pre-check run." }) })
        ] }) })
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "text-center py-8 bg-muted/40 rounded-lg border border-border", children: [
        /* @__PURE__ */ jsx(TrendingDown, { className: "w-12 h-12 mx-auto text-muted-foreground mb-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "No pre-check data yet." }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-2", children: "Scores will appear here as explorers run pre-checks on their work." })
      ] }) })
    ] });
  }
  const tickInterval = chartRows.length <= 14 ? 0 : chartRows.length <= 30 ? 1 : Math.floor(chartRows.length / 15);
  return /* @__PURE__ */ jsxs(Card, { className: "bg-card border-border", children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-foreground", children: [
        /* @__PURE__ */ jsx(TrendingDown, { className: "w-5 h-5 text-cyan-500" }),
        "The Dip Chart",
        /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsxs(Tooltip, { children: [
          /* @__PURE__ */ jsx(TooltipTrigger, { children: /* @__PURE__ */ jsx(Info, { className: "w-4 h-4 text-muted-foreground" }) }),
          /* @__PURE__ */ jsx(TooltipContent, { className: "max-w-xs", children: /* @__PURE__ */ jsx("p", { children: "The Dip Chart shows each team's pre-check scores over time. Each point represents a rubric-weighted score from a pre-check run. Hover over data points to see individual rubric breakdowns." }) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 text-sm flex-wrap", children: [
        teamList.map((team) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "w-3 h-3 rounded-full",
              style: { backgroundColor: team.color }
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: team.name })
        ] }, team.id)),
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 ml-4 px-3 py-1 bg-cyan-500/10 rounded border border-cyan-500/30", children: /* @__PURE__ */ jsxs("span", { className: "text-cyan-500 font-medium", children: [
          "Avg: ",
          avgScore,
          "%"
        ] }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(CardContent, { children: [
      /* @__PURE__ */ jsx("div", { className: "h-[300px]", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(
        LineChart,
        {
          data: chartRows,
          margin: { top: 5, right: 30, left: 20, bottom: 5 },
          children: [
            /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--border)" }),
            /* @__PURE__ */ jsx(
              XAxis,
              {
                dataKey: "label",
                stroke: "var(--muted-foreground)",
                tick: { fill: "var(--muted-foreground)", fontSize: 11 },
                interval: tickInterval
              }
            ),
            /* @__PURE__ */ jsx(
              YAxis,
              {
                stroke: "var(--muted-foreground)",
                tick: { fill: "var(--muted-foreground)", fontSize: 12 },
                domain: [0, 100],
                tickFormatter: (value) => `${value}%`
              }
            ),
            /* @__PURE__ */ jsx(Tooltip$1, { content: /* @__PURE__ */ jsx(CustomTooltipContent, {}) }),
            /* @__PURE__ */ jsx(Legend, {}),
            dipPoint && /* @__PURE__ */ jsx(
              ReferenceLine,
              {
                x: toLabel(new Date(dipPoint.dateKey)),
                stroke: "#EF4444",
                strokeDasharray: "5 5",
                label: {
                  value: `The Dip (${dipPoint.score}%)`,
                  fill: "#EF4444",
                  fontSize: 11,
                  position: "top"
                }
              }
            ),
            teamList.map((team) => /* @__PURE__ */ jsx(
              Line,
              {
                type: "monotone",
                dataKey: team.dataKey,
                name: team.name,
                stroke: team.color,
                strokeWidth: 2,
                dot: { r: 4, fill: team.color },
                activeDot: { r: 6, fill: team.color },
                connectNulls: true
              },
              team.id
            ))
          ]
        }
      ) }) }),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "mt-6 grid gap-4",
          style: {
            gridTemplateColumns: `repeat(${Math.min(teamSummaries.length, 4)}, 1fr)`
          },
          children: teamSummaries.map((team) => {
            const statusColor = team.overallScore === "ready" ? "bg-green-500" : team.overallScore === "needs_work" ? "bg-amber-500" : "bg-red-500";
            return /* @__PURE__ */ jsxs(
              "div",
              {
                className: "bg-muted/40 rounded-lg p-3 border border-border",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                    /* @__PURE__ */ jsx(
                      "div",
                      {
                        className: "w-2.5 h-2.5 rounded-full",
                        style: { backgroundColor: team.color }
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground truncate", children: team.name })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("div", { className: "flex-1 h-2 bg-muted rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
                      "div",
                      {
                        className: `h-full ${statusColor} rounded-full`,
                        style: { width: `${team.latestScore}%` }
                      }
                    ) }),
                    /* @__PURE__ */ jsxs("span", { className: "text-sm text-foreground font-medium", children: [
                      team.latestScore,
                      "%"
                    ] })
                  ] })
                ]
              },
              team.id
            );
          })
        }
      )
    ] })
  ] });
}
function SignalRiskCenter({ projectId }) {
  const { currentUser } = useAuthStore();
  const {
    getProject,
    getProjectInterventions,
    fetchInterventions,
    proposeIntervention,
    approveIntervention,
    rejectIntervention
  } = useCreatorStore();
  const project = getProject(projectId);
  const interventions = getProjectInterventions(projectId);
  const [showInterventionDialog, setShowInterventionDialog] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState([]);
  const [interventionMessage, setInterventionMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    fetchInterventions(projectId);
  }, [projectId, fetchInterventions]);
  if (!project) return null;
  const riskTeams = project.teams.filter((t) => t.riskLevel === "red" || t.riskLevel === "yellow");
  const handleProposeIntervention = async () => {
    if (selectedTeamIds.length === 0 || !interventionMessage.trim()) return;
    setIsSubmitting(true);
    try {
      await proposeIntervention(projectId, {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        type: "proactive",
        description: interventionMessage,
        targetTeamIds: selectedTeamIds
      }, currentUser?.id);
      setShowInterventionDialog(false);
      setSelectedTeamIds([]);
      setInterventionMessage("");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleApproveIntervention = async (interventionId) => {
    await approveIntervention(interventionId);
  };
  const handleRejectIntervention = async (interventionId) => {
    await rejectIntervention(interventionId);
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground", children: "Signal & Risk Center" }),
      /* @__PURE__ */ jsxs(
        Button,
        {
          onClick: () => setShowInterventionDialog(true),
          className: "bg-cyan-600 hover:bg-cyan-700 text-white",
          disabled: riskTeams.length === 0,
          children: [
            /* @__PURE__ */ jsx(Zap, { className: "w-4 h-4 mr-2" }),
            "AI Intervention"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-green-500/10 border border-green-500/30 rounded-lg p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-green-500 mb-2", children: [
          /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5" }),
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: "On Track" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-3xl font-bold text-foreground", children: project.teams.filter((t) => t.riskLevel === "green").length }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "teams" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-yellow-500 mb-2", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { className: "w-5 h-5" }),
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Needs Attention" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-3xl font-bold text-foreground", children: project.teams.filter((t) => t.riskLevel === "yellow").length }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "teams" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-red-500/10 border border-red-500/30 rounded-lg p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-red-500 mb-2", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { className: "w-5 h-5" }),
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: "At Risk" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-3xl font-bold text-foreground", children: project.teams.filter((t) => t.riskLevel === "red").length }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "teams" })
      ] })
    ] }),
    riskTeams.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-foreground", children: "Teams Requiring Attention" }),
      riskTeams.map((team) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: cn(
            "p-4 rounded-lg border",
            team.riskLevel === "yellow" ? "bg-yellow-500/5 border-yellow-500/30" : "bg-red-500/5 border-red-500/30"
          ),
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: cn(
                      "w-3 h-3 rounded-full",
                      team.riskLevel === "yellow" ? "bg-yellow-500" : "bg-red-500"
                    )
                  }
                ),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h4", { className: "font-medium text-foreground", children: team.name }),
                  /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
                    team.memberIds.length,
                    " members"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                Badge,
                {
                  variant: "outline",
                  className: cn(
                    team.riskLevel === "yellow" ? "border-yellow-500/50 text-yellow-500" : "border-red-500/50 text-red-500"
                  ),
                  children: team.riskLevel === "yellow" ? "Warning" : "Critical"
                }
              )
            ] }),
            team.riskReason && /* @__PURE__ */ jsxs("div", { className: "mt-3 p-2 bg-muted/50 rounded flex items-center gap-2 border border-border", children: [
              /* @__PURE__ */ jsx(AlertTriangle, { className: cn(
                "w-4 h-4",
                team.riskLevel === "yellow" ? "text-yellow-500" : "text-red-500"
              ) }),
              /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: team.riskReason })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center gap-2 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
              "Last activity: ",
              safeFormatDate(team.lastActivityAt, "MMM d, h:mm a", "Unknown")
            ] })
          ]
        },
        team.id
      ))
    ] }) : /* @__PURE__ */ jsxs("div", { className: "text-center py-8 bg-green-500/5 border border-green-500/30 rounded-lg", children: [
      /* @__PURE__ */ jsx(CheckCircle, { className: "w-12 h-12 mx-auto text-green-500 mb-2" }),
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-foreground", children: "All Teams On Track" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No immediate risks detected" })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-foreground mb-4", children: "Intervention History" }),
      interventions.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-6 bg-muted/40 rounded-lg border border-border", children: [
        /* @__PURE__ */ jsx(Bot, { className: "w-8 h-8 mx-auto text-muted-foreground mb-2" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No interventions yet" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: interventions.map((intervention) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "p-4 bg-card rounded-lg border border-border",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Zap, { className: cn(
                  "w-4 h-4",
                  intervention.status === "approved" ? "text-green-500" : intervention.status === "rejected" ? "text-red-500" : "text-yellow-500"
                ) }),
                /* @__PURE__ */ jsxs("span", { className: "text-sm text-foreground capitalize", children: [
                  intervention.type,
                  " Intervention"
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                Badge,
                {
                  variant: "outline",
                  className: cn(
                    intervention.status === "approved" ? "border-green-500/50 text-green-500" : intervention.status === "rejected" ? "border-red-500/50 text-red-500" : intervention.status === "executed" ? "border-blue-500/50 text-blue-500" : "border-yellow-500/50 text-yellow-500"
                  ),
                  children: intervention.status
                }
              )
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-2", children: intervention.description }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-2", children: safeFormatDate(intervention.timestamp, "MMM d, yyyy h:mm a", "Unknown") }),
            intervention.status === "proposed" && /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mt-3", children: [
              /* @__PURE__ */ jsxs(
                Button,
                {
                  size: "sm",
                  onClick: () => handleApproveIntervention(intervention.id),
                  className: "bg-green-600 hover:bg-green-700 text-white",
                  children: [
                    /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3 mr-1" }),
                    "Approve"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                Button,
                {
                  size: "sm",
                  variant: "outline",
                  onClick: () => handleRejectIntervention(intervention.id),
                  className: "border-red-500/50 text-red-500 hover:bg-red-500/10",
                  children: [
                    /* @__PURE__ */ jsx(X, { className: "w-3 h-3 mr-1" }),
                    "Reject"
                  ]
                }
              )
            ] })
          ]
        },
        intervention.id
      )) })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: showInterventionDialog, onOpenChange: setShowInterventionDialog, children: /* @__PURE__ */ jsxs(DialogContent, { className: "bg-card border-border", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Propose AI Intervention" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "Send a supportive message to selected teams through the AI assistant" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-foreground mb-2 block", children: "Select Teams" }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: riskTeams.map((team) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                if (selectedTeamIds.includes(team.id)) {
                  setSelectedTeamIds(selectedTeamIds.filter((id) => id !== team.id));
                } else {
                  setSelectedTeamIds([...selectedTeamIds, team.id]);
                }
              },
              className: cn(
                "px-3 py-1 rounded-full border text-sm transition-all",
                selectedTeamIds.includes(team.id) ? "border-cyan-500 bg-cyan-500/20 text-cyan-500" : "border-border text-muted-foreground hover:border-border/70"
              ),
              children: team.name
            },
            team.id
          )) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-foreground mb-2 block", children: "Intervention Message" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              value: interventionMessage,
              onChange: (e) => setInterventionMessage(e.target.value),
              placeholder: "The AI will send this supportive message to the selected teams...",
              className: "bg-background border-border min-h-[100px]"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setShowInterventionDialog(false), children: "Cancel" }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            onClick: handleProposeIntervention,
            disabled: selectedTeamIds.length === 0 || !interventionMessage.trim() || isSubmitting,
            className: "bg-cyan-600 hover:bg-cyan-700 text-white",
            children: [
              isSubmitting ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }) : /* @__PURE__ */ jsx(Zap, { className: "w-4 h-4 mr-2" }),
              "Propose Intervention"
            ]
          }
        )
      ] })
    ] }) })
  ] });
}
function AssessmentPanel({ projectId }) {
  const { getProject } = useCreatorStore();
  const project = getProject(projectId);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, graded: 0, avgScore: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSession, setSelectedSession] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewContent, setReviewContent] = useState("");
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [gradingIds, setGradingIds] = useState(/* @__PURE__ */ new Set());
  const [regradingIds, setRegradingIds] = useState(/* @__PURE__ */ new Set());
  const [isGradingAll, setIsGradingAll] = useState(false);
  useEffect(() => {
    async function fetchSubmissions() {
      setIsLoading(true);
      try {
        const result = await getProjectSubmissions({ data: { projectId } });
        if (result.success) {
          setSubmissions(result.submissions || []);
          setStats(result.stats || { total: 0, pending: 0, graded: 0, avgScore: 0 });
        }
      } catch (error) {
        console.error("Failed to fetch submissions:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSubmissions();
  }, [projectId]);
  if (!project) return null;
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch = sub.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || sub.teamName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSession = selectedSession === "all" || sub.sessionIndex === parseInt(selectedSession);
    const matchesTeam = selectedTeam === "all" || sub.teamId === selectedTeam;
    return matchesSearch && matchesSession && matchesTeam;
  });
  const getSessionNumber = (submission) => {
    const sessionIdx = project.sessions.findIndex((s) => s.id === submission.sessionId);
    if (sessionIdx >= 0) return sessionIdx + 1;
    return submission.sessionIndex + 1;
  };
  const handleReview = async (submission) => {
    setSelectedSubmission(submission);
    setIsReviewOpen(true);
    setIsLoadingReview(true);
    setReviewError(null);
    setReviewContent("");
    try {
      const result = await getTeamSessionArtifact({
        data: { teamId: submission.teamId, sessionId: submission.sessionId }
      });
      if (!result.success) {
        setReviewError(result.error || "Failed to load submitted content");
        return;
      }
      const content = result.artifact?.content || "";
      if (!content.trim()) {
        setReviewError("No submitted content found for this team/session.");
        return;
      }
      setReviewContent(content);
    } catch (error) {
      setReviewError("Failed to load submitted content");
    } finally {
      setIsLoadingReview(false);
    }
  };
  const handleRegrade = async (submission) => {
    setRegradingIds((prev) => new Set(prev).add(submission.id));
    try {
      const result = await regradeSubmission({ data: { artifactIds: submission.id } });
      if (result.success && result.updatedScores) {
        const scoreMap = new Map(result.updatedScores.map((s) => [s.artifactId, s]));
        setSubmissions(
          (prev) => prev.map((s) => {
            const updated = scoreMap.get(s.id);
            return updated ? { ...s, aiScore: updated.aiScore, rubricBreakdown: updated.rubricBreakdown } : s;
          })
        );
        const updatedScore = result.updatedScores.find((s) => s.artifactId === submission.id);
        toast.success("AI score refreshed", {
          description: `${submission.studentName} scored ${updatedScore ? updatedScore.aiScore : submission.aiScore}%`
        });
      } else {
        toast.error("Failed to re-grade submission");
      }
    } catch {
      toast.error("Failed to re-grade submission");
    } finally {
      setRegradingIds((prev) => {
        const next = new Set(prev);
        next.delete(submission.id);
        return next;
      });
    }
  };
  const handleGrade = async (submission) => {
    setGradingIds((prev) => new Set(prev).add(submission.id));
    try {
      const result = await gradeSubmission({ data: { artifactIds: submission.id } });
      if (result.success) {
        setSubmissions(
          (prev) => prev.map((s) => s.id === submission.id ? { ...s, status: "graded" } : s)
        );
        setStats((prev) => ({
          ...prev,
          pending: Math.max(0, prev.pending - 1),
          graded: prev.graded + 1
        }));
        toast.success("Submission graded", {
          description: `${submission.studentName} confirmed at ${submission.aiScore}%`
        });
      } else {
        toast.error("Failed to grade submission");
      }
    } catch {
      toast.error("Failed to grade submission");
    } finally {
      setGradingIds((prev) => {
        const next = new Set(prev);
        next.delete(submission.id);
        return next;
      });
    }
  };
  const pendingSubmissions = submissions.filter((s) => s.status === "pending");
  const ungradedCount = pendingSubmissions.length;
  const handleGradeAll = async () => {
    if (ungradedCount === 0) return;
    setIsGradingAll(true);
    try {
      const ids = pendingSubmissions.map((s) => s.id);
      const result = await gradeSubmission({ data: { artifactIds: ids } });
      if (result.success) {
        const idSet = new Set(ids);
        setSubmissions(
          (prev) => prev.map((s) => idSet.has(s.id) ? { ...s, status: "graded" } : s)
        );
        setStats((prev) => ({
          ...prev,
          pending: 0,
          graded: prev.graded + ids.length
        }));
        toast.success(`Graded ${ids.length} submissions`);
      } else {
        toast.error("Failed to grade submissions");
      }
    } catch {
      toast.error("Failed to grade submissions");
    } finally {
      setIsGradingAll(false);
    }
  };
  if (isLoading) {
    return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center py-12", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-cyan-500 mr-2" }),
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Loading submissions..." })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground", children: "AI Assessment & Grading" }),
      ungradedCount > 0 && /* @__PURE__ */ jsxs(
        Button,
        {
          size: "sm",
          onClick: handleGradeAll,
          disabled: isGradingAll,
          className: "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white",
          children: [
            isGradingAll ? /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin mr-1.5" }) : /* @__PURE__ */ jsx(CheckCheck, { className: "w-3.5 h-3.5 mr-1.5" }),
            "Grade All (",
            ungradedCount,
            ")"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-1 min-w-[200px]", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            placeholder: "Search students or teams...",
            className: "pl-10 bg-background border-border"
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxs(Select, { value: selectedSession, onValueChange: setSelectedSession, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[180px] bg-background border-border", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "All Sessions" }) }),
        /* @__PURE__ */ jsxs(SelectContent, { className: "bg-popover border-border", children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All Sessions" }),
          project.sessions.map((session, idx) => /* @__PURE__ */ jsx(SelectItem, { value: idx.toString(), children: session.title }, session.id || idx))
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: selectedTeam, onValueChange: setSelectedTeam, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[180px] bg-background border-border", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "All Teams" }) }),
        /* @__PURE__ */ jsxs(SelectContent, { className: "bg-popover border-border", children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All Teams" }),
          project.teams.map((team) => /* @__PURE__ */ jsx(SelectItem, { value: team.id, children: team.name }, team.id))
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-foreground", children: stats.total }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Total Submissions" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-yellow-500", children: stats.pending }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Pending Review" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-green-500", children: stats.graded }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Graded" })
      ] })
    ] }),
    submissions.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12 bg-muted/40 rounded-lg border border-border", children: [
      /* @__PURE__ */ jsx(ClipboardCheck, { className: "w-12 h-12 mx-auto text-muted-foreground mb-4" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "No submissions yet." }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-2", children: "Submissions will appear here once explorers start submitting their work." })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "text-left p-3 text-muted-foreground text-sm font-medium border-b border-border", children: "Student" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-3 text-muted-foreground text-sm font-medium border-b border-border", children: "Team" }),
          /* @__PURE__ */ jsx("th", { className: "text-center p-3 text-muted-foreground text-sm font-medium border-b border-border", children: "Session #" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-3 text-muted-foreground text-sm font-medium border-b border-border", children: "Session" }),
          /* @__PURE__ */ jsx("th", { className: "text-center p-3 text-muted-foreground text-sm font-medium border-b border-border", children: "AI Score" }),
          /* @__PURE__ */ jsx("th", { className: "text-center p-3 text-muted-foreground text-sm font-medium border-b border-border", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-3 text-muted-foreground text-sm font-medium border-b border-border", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: filteredSubmissions.slice(0, 10).map((submission) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-border/70 hover:bg-muted/60", children: [
          /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx("span", { className: "text-foreground", children: submission.studentName }) }),
          /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: submission.teamName }) }),
          /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: getSessionNumber(submission) }) }),
          /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: submission.sessionTitle }) }),
          /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: /* @__PURE__ */ jsxs("span", { className: cn(
            "font-semibold",
            submission.aiScore >= 80 ? "text-green-500" : submission.aiScore >= 60 ? "text-yellow-500" : "text-red-500"
          ), children: [
            submission.aiScore,
            "%"
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: /* @__PURE__ */ jsx(
            Badge,
            {
              variant: "outline",
              className: cn(
                submission.status === "graded" ? "border-green-500/50 text-green-500" : "border-yellow-500/50 text-yellow-500"
              ),
              children: submission.status
            }
          ) }),
          /* @__PURE__ */ jsx("td", { className: "p-3 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2", children: [
            /* @__PURE__ */ jsxs(
              Button,
              {
                size: "sm",
                variant: "outline",
                className: "border-border",
                onClick: () => handleReview(submission),
                children: [
                  /* @__PURE__ */ jsx(ClipboardCheck, { className: "w-3 h-3 mr-1" }),
                  "Review"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              Button,
              {
                size: "sm",
                onClick: () => handleRegrade(submission),
                disabled: regradingIds.has(submission.id),
                className: "bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white",
                children: [
                  regradingIds.has(submission.id) ? /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 animate-spin mr-1" }) : /* @__PURE__ */ jsx(Sparkles, { className: "w-3 h-3 mr-1" }),
                  regradingIds.has(submission.id) ? "Re-grading..." : "Re-grade"
                ]
              }
            ),
            submission.status === "pending" && /* @__PURE__ */ jsxs(
              Button,
              {
                size: "sm",
                onClick: () => handleGrade(submission),
                disabled: gradingIds.has(submission.id) || isGradingAll,
                className: "bg-green-600 hover:bg-green-700 text-white",
                children: [
                  gradingIds.has(submission.id) ? /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 animate-spin mr-1" }) : /* @__PURE__ */ jsx(CheckCheck, { className: "w-3 h-3 mr-1" }),
                  "Grade"
                ]
              }
            )
          ] }) })
        ] }, submission.id)) })
      ] }) }),
      filteredSubmissions.length > 10 && /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "border-border", children: [
        "Load More (",
        filteredSubmissions.length - 10,
        " remaining)"
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: isReviewOpen, onOpenChange: setIsReviewOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-4xl max-h-[85vh]", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Submitted Team Content" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: selectedSubmission ? `${selectedSubmission.teamName} · Session ${getSessionNumber(selectedSubmission)} (${selectedSubmission.sessionTitle})` : "Review submitted content" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "min-h-[320px] max-h-[60vh] overflow-auto rounded-lg border border-border bg-muted/20 p-4", children: [
        selectedSubmission && selectedSubmission.rubricBreakdown.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-4 rounded-lg border border-border bg-background p-3", children: [
          /* @__PURE__ */ jsx("h4", { className: "text-sm font-medium text-foreground mb-2", children: "Rubric Criteria Scores" }),
          /* @__PURE__ */ jsx("div", { className: "space-y-2", children: selectedSubmission.rubricBreakdown.map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
              item.criterion,
              " ",
              /* @__PURE__ */ jsxs("span", { className: "text-xs", children: [
                "(",
                item.weight,
                "%)"
              ] })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: item.score !== null ? `${item.score}` : "-" })
          ] }, `${item.criterion}-${idx}`)) })
        ] }),
        isLoadingReview ? /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center py-10 text-muted-foreground", children: [
          /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin mr-2" }),
          "Loading submitted content..."
        ] }) : reviewError ? /* @__PURE__ */ jsx("div", { className: "py-10 text-center text-sm text-muted-foreground", children: reviewError }) : /* @__PURE__ */ jsx("div", { className: "h-full flex flex-col border rounded-lg overflow-hidden bg-background", children: /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-0 overflow-auto", children: /* @__PURE__ */ jsx(
          "div",
          {
            className: "tiptap focus:outline-none h-full p-4",
            dangerouslySetInnerHTML: { __html: reviewContent }
          }
        ) }) })
      ] })
    ] }) })
  ] });
}
function MonitoringPage() {
  const navigate = useNavigate();
  const {
    projectId
  } = Route.useParams();
  const {
    isAuthenticated,
    currentUser
  } = useAuthStore();
  const {
    getProject,
    fetchProjects
  } = useCreatorStore();
  const project = getProject(projectId);
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({
        to: "/"
      });
    }
  }, [isAuthenticated, navigate]);
  useEffect(() => {
    if (currentUser && !currentUser.role.includes("creator")) {
      navigate({
        to: "/explorer"
      });
    }
  }, [currentUser, navigate]);
  useEffect(() => {
    if (currentUser?.id && !project) {
      fetchProjects(currentUser.id);
    }
  }, [currentUser?.id, project, fetchProjects]);
  if (!currentUser || !currentUser.role.includes("creator")) {
    return null;
  }
  if (!project) {
    return /* @__PURE__ */ jsx("div", { className: "container max-w-6xl mx-auto py-8 px-4", children: /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-foreground mb-2", children: "Project Not Found" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: "The project you're looking for doesn't exist." }),
      /* @__PURE__ */ jsx(Button, { onClick: () => navigate({
        to: "/creator"
      }), children: "Back to Dashboard" })
    ] }) });
  }
  const teamsAtRisk = project.teams.filter((t) => t.riskLevel === "red" || t.riskLevel === "yellow");
  return /* @__PURE__ */ jsx("div", { className: "min-h-[calc(100vh-4rem)] bg-background", children: /* @__PURE__ */ jsxs("div", { className: "container max-w-7xl mx-auto py-8 px-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsxs(Button, { variant: "ghost", onClick: () => navigate({
        to: "/creator"
      }), className: "mb-4 text-muted-foreground hover:text-foreground", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
        "Back to Dashboard"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-foreground flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Eye, { className: "w-8 h-8 text-cyan-500" }),
            project.name
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-1", children: "Monitoring & Assessment" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-4", children: teamsAtRisk.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-lg", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4 text-red-500" }),
          /* @__PURE__ */ jsxs("span", { className: "text-sm text-red-500", children: [
            teamsAtRisk.length,
            " team(s) at risk"
          ] })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 mb-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-foreground", children: project.teams.length }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Active Teams" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-foreground", children: project.teams.reduce((sum, t) => sum + t.memberIds.length, 0) }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Total Explorers" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold text-foreground", children: [
          (() => {
            const idx = project.sessions.findIndex((s) => {
              if (!s.endDate) return true;
              const end = new Date(s.endDate);
              return isNaN(end.getTime()) || end > /* @__PURE__ */ new Date();
            });
            return idx === -1 ? project.sessions.length : idx + 1;
          })(),
          " / ",
          project.sessions.length
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Current Session" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-4", children: [
        /* @__PURE__ */ jsx("div", { className: `text-2xl font-bold ${project.riskLevel === "green" ? "text-green-500" : project.riskLevel === "yellow" ? "text-yellow-500" : "text-red-500"}`, children: project.riskLevel === "green" ? "Healthy" : project.riskLevel === "yellow" ? "Attention" : "At Risk" }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Project Health" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mb-8", children: /* @__PURE__ */ jsx(DipChart, { projectId: project.id, projectStartDate: project.startDate, projectEndDate: project.endDate }) }),
    /* @__PURE__ */ jsxs(Tabs, { defaultValue: "matrix", children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "mb-6", children: [
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "matrix", className: "gap-2", children: [
          /* @__PURE__ */ jsx(Activity, { className: "w-4 h-4" }),
          "Live Matrix",
          project.teams.length > 0 && /* @__PURE__ */ jsx("span", { className: "ml-1 px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-full", children: project.teams.length })
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "assessment", className: "gap-2", children: [
          /* @__PURE__ */ jsx(ClipboardCheck, { className: "w-4 h-4" }),
          "Assessment",
          project.sessions.length > 0 && /* @__PURE__ */ jsx("span", { className: "ml-1 px-2 py-0.5 text-xs bg-slate-500/20 text-slate-400 rounded-full", children: project.sessions.length })
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "risk", className: "gap-2", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4" }),
          "Signal & Risk",
          teamsAtRisk.length > 0 && /* @__PURE__ */ jsx("span", { className: "ml-1 px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full", children: teamsAtRisk.length })
        ] })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "matrix", children: /* @__PURE__ */ jsx(LiveMatrix, { projectId: project.id }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "assessment", children: /* @__PURE__ */ jsx(AssessmentPanel, { projectId: project.id }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "risk", children: /* @__PURE__ */ jsx(SignalRiskCenter, { projectId: project.id }) })
    ] })
  ] }) });
}
export {
  MonitoringPage as component
};
