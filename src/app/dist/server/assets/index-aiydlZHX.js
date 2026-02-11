import { jsxs, jsx } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { B as Button, N as Collapsible, O as CollapsibleTrigger, Q as CollapsibleContent, d as cn, D as Dialog, n as DialogContent, o as DialogHeader, p as DialogTitle, E as DialogDescription, F as DialogFooter, R as DropdownMenu, U as DropdownMenuTrigger, V as DropdownMenuContent, W as DropdownMenuItem, a as Badge, m as Progress, T as TooltipProvider, v as Tooltip, w as TooltipTrigger, x as TooltipContent, u as useAuthStore } from "./router-Bhor0jGk.js";
import { a as getUserArtifacts } from "./artifacts-V6YAL9mY.js";
import { FileText, List, Grid, ChevronDown, ChevronRight, ExternalLink, Share2, Download, FileCode, Code, AlertTriangle, Clock, CheckCircle, TrendingUp, TrendingDown, Minus, Puzzle, Lightbulb, Users, Megaphone, Brain, Heart, HandHelping, MessageCircle, Calendar, Sun, Star, Compass, Flag, Footprints, Lock, Copy, Loader2, Briefcase, FolderOpen, BarChart3, Trophy } from "lucide-react";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-D_4abuiO.js";
import { C as Card, a as CardContent, b as CardHeader, c as CardTitle } from "./card-CuhZmkUZ.js";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { C as COMPETENCY_LABELS, B as BADGE_DEFINITIONS, L as LEVELS } from "./index-DKaP5KB_.js";
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
import "qrcode";
function ArtifactGallery({ artifacts }) {
  const [viewMode, setViewMode] = useState("list");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const projects = Array.from(new Set(artifacts.map((a) => a.projectId))).map((projectId) => {
    const artifact = artifacts.find((a) => a.projectId === projectId);
    return {
      id: projectId,
      title: artifact.projectTitle
    };
  });
  const [expandedProjects, setExpandedProjects] = useState(new Set(projects.map((p) => p.id)));
  const artifactsByProject = artifacts.reduce((acc, artifact) => {
    if (!acc[artifact.projectId]) {
      acc[artifact.projectId] = [];
    }
    acc[artifact.projectId].push(artifact);
    return acc;
  }, {});
  const toggleProject = (projectId) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };
  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return /* @__PURE__ */ jsxs(Badge, { className: "bg-green-500/10 text-green-500 border-green-500/30", children: [
          /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3 mr-1" }),
          "Approved"
        ] });
      case "submitted":
      case "under_review":
        return /* @__PURE__ */ jsxs(Badge, { className: "bg-blue-500/10 text-blue-500 border-blue-500/30", children: [
          /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3 mr-1" }),
          "Under Review"
        ] });
      case "needs_revision":
        return /* @__PURE__ */ jsxs(Badge, { className: "bg-amber-500/10 text-amber-500 border-amber-500/30", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { className: "w-3 h-3 mr-1" }),
          "Needs Revision"
        ] });
      default:
        return /* @__PURE__ */ jsx(Badge, { variant: "outline", children: "Draft" });
    }
  };
  const getTypeIcon = (type) => {
    switch (type) {
      case "code":
        return /* @__PURE__ */ jsx(Code, { className: "w-5 h-5 text-cyan-400" });
      case "markdown":
        return /* @__PURE__ */ jsx(FileCode, { className: "w-5 h-5 text-purple-400" });
      default:
        return /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-blue-400" });
    }
  };
  const handleShareShowcase = (artifact) => {
    setSelectedArtifact(artifact);
    setShowShareDialog(true);
  };
  const generateShowcaseLink = (expiration) => {
    const link = `https://p3bl.app/showcase/${selectedArtifact?.id}?exp=${expiration}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!", {
      description: `Expires: ${expiration === "never" ? "Never" : expiration}`
    });
    setShowShareDialog(false);
  };
  if (artifacts.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "text-center py-16", children: [
      /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx(FileText, { className: "w-8 h-8 text-muted-foreground" }) }),
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold mb-2", children: "No artifacts yet" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: "Complete your first deliverable to see it here" }),
      /* @__PURE__ */ jsx(Button, { variant: "outline", asChild: true, children: /* @__PURE__ */ jsx("a", { href: "/workspace", children: "Go to Workspace" }) })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
        artifacts.length,
        " artifact",
        artifacts.length !== 1 ? "s" : "",
        " across ",
        projects.length,
        " project",
        projects.length !== 1 ? "s" : ""
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: viewMode === "list" ? "secondary" : "ghost",
            size: "icon",
            onClick: () => setViewMode("list"),
            children: /* @__PURE__ */ jsx(List, { className: "w-4 h-4" })
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: viewMode === "grid" ? "secondary" : "ghost",
            size: "icon",
            onClick: () => setViewMode("grid"),
            children: /* @__PURE__ */ jsx(Grid, { className: "w-4 h-4" })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-6", children: projects.filter((project) => artifactsByProject[project.id]?.length > 0).map((project) => /* @__PURE__ */ jsxs(
      Collapsible,
      {
        open: expandedProjects.has(project.id),
        onOpenChange: () => toggleProject(project.id),
        children: [
          /* @__PURE__ */ jsx(CollapsibleTrigger, { asChild: true, children: /* @__PURE__ */ jsxs("button", { className: "w-full flex items-center gap-3 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors", children: [
            expandedProjects.has(project.id) ? /* @__PURE__ */ jsx(ChevronDown, { className: "w-5 h-5 text-muted-foreground" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "w-5 h-5 text-muted-foreground" }),
            /* @__PURE__ */ jsxs("div", { className: "text-left", children: [
              /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: project.title }),
              /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
                artifactsByProject[project.id].length,
                " artifact",
                artifactsByProject[project.id].length !== 1 ? "s" : ""
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx(CollapsibleContent, { children: /* @__PURE__ */ jsx("div", { className: cn(
            "mt-4",
            viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"
          ), children: artifactsByProject[project.id].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map((artifact) => /* @__PURE__ */ jsx(
            ArtifactCard,
            {
              artifact,
              viewMode,
              onShare: () => handleShareShowcase(artifact),
              getStatusBadge,
              getTypeIcon
            },
            artifact.id
          )) }) })
        ]
      },
      project.id
    )) }),
    /* @__PURE__ */ jsx(Dialog, { open: showShareDialog, onOpenChange: setShowShareDialog, children: /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Create Showcase Link" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "Generate a public link to share this artifact. Choose an expiration time." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 py-4", children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => generateShowcaseLink("7days"), children: "7 Days" }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => generateShowcaseLink("30days"), children: "30 Days" }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => generateShowcaseLink("90days"), children: "90 Days" }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => generateShowcaseLink("never"), children: "Never Expires" })
      ] }),
      /* @__PURE__ */ jsx(DialogFooter, { children: /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: () => setShowShareDialog(false), children: "Cancel" }) })
    ] }) })
  ] });
}
function ArtifactCard({ artifact, viewMode, onShare, getStatusBadge, getTypeIcon }) {
  if (viewMode === "grid") {
    return /* @__PURE__ */ jsx(Card, { className: "hover:border-cyan-500/50 transition-colors", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-3", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0", children: getTypeIcon(artifact.contentType) }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx("h4", { className: "font-medium truncate", children: artifact.title }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: artifact.sessionTitle })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        getStatusBadge(artifact.status),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: artifact.latestVersion ? formatDistanceToNow(new Date(artifact.updatedAt), { addSuffix: true }) : "Draft" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mt-4", children: [
        /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", className: "flex-1 gap-1", children: [
          /* @__PURE__ */ jsx(ExternalLink, { className: "w-3 h-3" }),
          "View"
        ] }),
        /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: onShare, children: /* @__PURE__ */ jsx(Share2, { className: "w-3 h-3" }) })
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsx(Card, { className: "hover:border-cyan-500/50 transition-colors", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center gap-4", children: [
    /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0", children: getTypeIcon(artifact.contentType) }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsx("h4", { className: "font-medium truncate", children: artifact.title }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground truncate", children: artifact.sessionTitle })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      getStatusBadge(artifact.status),
      /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: artifact.latestVersion ? format(new Date(artifact.updatedAt), "MMM d, yyyy HH:mm") : "Draft" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", className: "gap-1", children: [
        /* @__PURE__ */ jsx(ExternalLink, { className: "w-4 h-4" }),
        "View"
      ] }),
      /* @__PURE__ */ jsxs(DropdownMenu, { children: [
        /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", children: /* @__PURE__ */ jsx(Share2, { className: "w-4 h-4" }) }) }),
        /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", children: [
          /* @__PURE__ */ jsx(DropdownMenuItem, { onClick: onShare, children: "Create Showcase Link" }),
          /* @__PURE__ */ jsx(DropdownMenuItem, { children: "Share to Team Chat" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", children: /* @__PURE__ */ jsx(Download, { className: "w-4 h-4" }) })
    ] })
  ] }) });
}
function CompetencyDashboard({ competencies }) {
  const chartData = Object.entries(competencies).map(
    ([key, value]) => ({
      competency: COMPETENCY_LABELS[key],
      current: value.current,
      baseline: value.baseline || 0
    })
  );
  const hasBaseline = Object.values(competencies).some((c) => c.baseline !== null);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("span", { children: "Competency Overview" }),
        !hasBaseline && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "font-normal", children: "No baseline yet" })
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "h-[400px]", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(RadarChart, { data: chartData, children: [
        /* @__PURE__ */ jsx(PolarGrid, { stroke: "hsl(var(--border))" }),
        /* @__PURE__ */ jsx(
          PolarAngleAxis,
          {
            dataKey: "competency",
            tick: { fill: "hsl(var(--muted-foreground))", fontSize: 12 }
          }
        ),
        /* @__PURE__ */ jsx(
          PolarRadiusAxis,
          {
            angle: 30,
            domain: [0, 100],
            tick: { fill: "hsl(var(--muted-foreground))", fontSize: 10 }
          }
        ),
        hasBaseline && /* @__PURE__ */ jsx(
          Radar,
          {
            name: "Baseline",
            dataKey: "baseline",
            stroke: "hsl(var(--muted-foreground))",
            fill: "hsl(var(--muted-foreground))",
            fillOpacity: 0.1,
            strokeDasharray: "5 5"
          }
        ),
        /* @__PURE__ */ jsx(
          Radar,
          {
            name: "Current",
            dataKey: "current",
            stroke: "hsl(var(--chart-1))",
            fill: "hsl(var(--chart-1))",
            fillOpacity: 0.3
          }
        ),
        /* @__PURE__ */ jsx(Legend, {})
      ] }) }) }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: Object.entries(competencies).map(
      ([key, value]) => /* @__PURE__ */ jsx(
        CompetencyCard,
        {
          name: COMPETENCY_LABELS[key],
          current: value.current,
          baseline: value.baseline,
          insight: value.insight
        },
        key
      )
    ) })
  ] });
}
function CompetencyCard({ name, current, baseline, insight }) {
  const delta = baseline !== null ? current - baseline : null;
  const getScoreColor = (score) => {
    if (score >= 70) return "text-green-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };
  const getDeltaIcon = () => {
    if (delta === null) return null;
    if (delta > 0) return /* @__PURE__ */ jsx(TrendingUp, { className: "w-4 h-4 text-green-500" });
    if (delta < 0) return /* @__PURE__ */ jsx(TrendingDown, { className: "w-4 h-4 text-red-500" });
    return /* @__PURE__ */ jsx(Minus, { className: "w-4 h-4 text-muted-foreground" });
  };
  const getDeltaColor = () => {
    if (delta === null) return "";
    if (delta > 0) return "text-green-500";
    if (delta < 0) return "text-red-500";
    return "text-muted-foreground";
  };
  return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-3", children: [
      /* @__PURE__ */ jsx("h4", { className: "font-medium", children: name }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: cn("text-2xl font-bold", getScoreColor(current)), children: current }),
        delta !== null && /* @__PURE__ */ jsxs("div", { className: cn("flex items-center gap-1 text-sm", getDeltaColor()), children: [
          getDeltaIcon(),
          /* @__PURE__ */ jsxs("span", { children: [
            delta > 0 ? "+" : "",
            delta
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "h-2 bg-muted rounded-full mb-3 overflow-hidden", children: /* @__PURE__ */ jsx(
      "div",
      {
        className: cn(
          "h-full rounded-full transition-all",
          current >= 70 ? "bg-green-500" : current >= 50 ? "bg-amber-500" : "bg-red-500"
        ),
        style: { width: `${current}%` }
      }
    ) }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground line-clamp-3", children: insight })
  ] }) });
}
const BADGE_ICONS = {
  "footprints": Footprints,
  "flag": Flag,
  "compass": Compass,
  "star": Star,
  "sun": Sun,
  "calendar": Calendar,
  "message-circle": MessageCircle,
  "hand-helping": HandHelping,
  "heart": Heart,
  "brain": Brain,
  "megaphone": Megaphone,
  "users": Users,
  "lightbulb": Lightbulb,
  "puzzle": Puzzle
};
const CATEGORY_LABELS = {
  milestone: "Milestone",
  engagement: "Engagement",
  collaboration: "Collaboration",
  competency: "Competency"
};
const CATEGORY_COLORS = {
  milestone: "from-amber-500 to-orange-500",
  engagement: "from-green-500 to-emerald-500",
  collaboration: "from-blue-500 to-cyan-500",
  competency: "from-purple-500 to-pink-500"
};
function AchievementArchive({ earnedBadgeIds, level, xp }) {
  const badgesByCategory = BADGE_DEFINITIONS.reduce((acc, badge) => {
    if (!acc[badge.category]) {
      acc[badge.category] = [];
    }
    acc[badge.category].push({
      ...badge,
      earned: earnedBadgeIds.includes(badge.id)
    });
    return acc;
  }, {});
  const currentLevelDef = LEVELS.find((l) => l.level === level);
  const nextLevelDef = LEVELS.find((l) => l.level === level + 1);
  const currentLevelXP = currentLevelDef?.xpRequired || 0;
  const nextLevelXP = nextLevelDef?.xpRequired || xp;
  const progressPercent = nextLevelDef ? (xp - currentLevelXP) / (nextLevelXP - currentLevelXP) * 100 : 100;
  const experienceSynthesis = generateExperienceSynthesis(earnedBadgeIds, level, xp);
  const copyExperience = () => {
    navigator.clipboard.writeText(experienceSynthesis);
    toast.success("Copied to clipboard!");
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Level Progress" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
        /* @__PURE__ */ jsx("div", { className: "w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: "text-3xl font-bold text-white", children: level }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
            /* @__PURE__ */ jsx("span", { className: "font-semibold text-lg", children: currentLevelDef?.name }),
            /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground", children: [
              xp,
              " XP"
            ] })
          ] }),
          /* @__PURE__ */ jsx(Progress, { value: progressPercent, className: "h-3 mb-2" }),
          nextLevelDef ? /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
            nextLevelXP - xp,
            " XP to Level ",
            nextLevelDef.level,
            " (",
            nextLevelDef.name,
            ")"
          ] }) : /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Maximum level reached!" })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("span", { children: "Badge Collection" }),
        /* @__PURE__ */ jsxs("span", { className: "text-sm font-normal text-muted-foreground", children: [
          earnedBadgeIds.length,
          " / ",
          BADGE_DEFINITIONS.length,
          " earned"
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "space-y-6", children: Object.entries(badgesByCategory).map(
        ([category, badges]) => /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider", children: CATEGORY_LABELS[category] }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4", children: badges.map((badge) => {
            const IconComponent = BADGE_ICONS[badge.icon] || Star;
            return /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsxs(Tooltip, { children: [
              /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
                "div",
                {
                  className: cn(
                    "relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                    badge.earned ? "bg-card hover:border-cyan-500/50" : "bg-muted/30 opacity-50"
                  ),
                  children: [
                    /* @__PURE__ */ jsx(
                      "div",
                      {
                        className: cn(
                          "w-12 h-12 rounded-full flex items-center justify-center",
                          badge.earned ? `bg-gradient-to-br ${CATEGORY_COLORS[category]} text-white` : "bg-muted text-muted-foreground"
                        ),
                        children: badge.earned ? /* @__PURE__ */ jsx(IconComponent, { className: "w-6 h-6" }) : /* @__PURE__ */ jsx(Lock, { className: "w-5 h-5" })
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-center", children: badge.name })
                  ]
                }
              ) }),
              /* @__PURE__ */ jsxs(TooltipContent, { children: [
                /* @__PURE__ */ jsx("p", { className: "font-medium", children: badge.name }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: badge.description }),
                !badge.earned && /* @__PURE__ */ jsx("p", { className: "text-xs text-amber-400 mt-1", children: "Not yet earned" })
              ] })
            ] }) }, badge.id);
          }) })
        ] }, category)
      ) }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("span", { children: "Experience Synthesis" }),
        /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: copyExperience, className: "gap-2", children: [
          /* @__PURE__ */ jsx(Copy, { className: "w-4 h-4" }),
          "Copy"
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { children: [
        /* @__PURE__ */ jsx("div", { className: "bg-muted/30 rounded-lg p-4", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground leading-relaxed", children: experienceSynthesis }) }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-3", children: "This AI-generated summary is updated as you complete projects. Use it for portfolios or applications." })
      ] })
    ] })
  ] });
}
function generateExperienceSynthesis(earnedBadgeIds, level, xp) {
  const levelDef = LEVELS.find((l) => l.level === level);
  const badgeCount = earnedBadgeIds.length;
  const earnedBadges = BADGE_DEFINITIONS.filter((b) => earnedBadgeIds.includes(b.id));
  const competencyBadges = earnedBadges.filter((b) => b.category === "competency");
  const milestoneBadges = earnedBadges.filter((b) => b.category === "milestone");
  let synthesis = `As a Level ${level} ${levelDef?.name || "Explorer"} with ${xp} experience points, `;
  if (badgeCount === 0) {
    synthesis += `this learner is just beginning their journey. With dedication and consistent effort, they are well-positioned to develop key competencies and achieve meaningful milestones in their learning path.`;
  } else {
    synthesis += `this learner has demonstrated commitment to growth by earning ${badgeCount} badge${badgeCount !== 1 ? "s" : ""}. `;
    if (milestoneBadges.length > 0) {
      synthesis += `Key achievements include ${milestoneBadges.map((b) => b.name).join(", ")}, showcasing dedication to completing meaningful learning objectives. `;
    }
    if (competencyBadges.length > 0) {
      synthesis += `Demonstrated strengths in ${competencyBadges.map((b) => b.name.replace(" Badge", "")).join(" and ")}, indicating well-developed skills in these areas. `;
    }
    synthesis += `This track record reflects a learner who engages thoughtfully with challenges and consistently strives for improvement.`;
  }
  return synthesis;
}
function PortfolioPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("artifacts");
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [artifacts, setArtifacts] = useState([]);
  const {
    isAuthenticated,
    currentUser
  } = useAuthStore();
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      navigate({
        to: "/signin"
      });
    }
  }, [isHydrated, isAuthenticated, navigate]);
  useEffect(() => {
    async function loadArtifacts() {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const result = await getUserArtifacts({
          data: {
            userId: currentUser.id
          }
        });
        if (result.success && result.artifacts) {
          setArtifacts(result.artifacts);
        }
      } catch (error) {
        console.error("Failed to load artifacts:", error);
      } finally {
        setIsLoading(false);
      }
    }
    if (isHydrated && currentUser) {
      loadArtifacts();
    }
  }, [isHydrated, currentUser]);
  if (!isHydrated || isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-muted-foreground" }) });
  }
  if (!currentUser) return null;
  return /* @__PURE__ */ jsx("div", { className: "min-h-[calc(100vh-4rem)] bg-background", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto px-6 py-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-foreground flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(Briefcase, { className: "w-8 h-8 text-cyan-500" }),
        "Growth Portfolio"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-1", children: "Track your learning journey, competencies, and achievements" })
    ] }),
    /* @__PURE__ */ jsxs(Tabs, { value: activeTab, onValueChange: (v) => setActiveTab(v), children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "mb-8", children: [
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "artifacts", className: "gap-2", children: [
          /* @__PURE__ */ jsx(FolderOpen, { className: "w-4 h-4" }),
          "Artifact Gallery"
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "competencies", className: "gap-2", children: [
          /* @__PURE__ */ jsx(BarChart3, { className: "w-4 h-4" }),
          "Competency Dashboard"
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "achievements", className: "gap-2", children: [
          /* @__PURE__ */ jsx(Trophy, { className: "w-4 h-4" }),
          "Achievement Archive"
        ] })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "artifacts", children: /* @__PURE__ */ jsx(ArtifactGallery, { artifacts }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "competencies", children: currentUser.competencies ? /* @__PURE__ */ jsx(CompetencyDashboard, { competencies: currentUser.competencies }) : /* @__PURE__ */ jsxs("div", { className: "text-center py-8 text-muted-foreground", children: [
        /* @__PURE__ */ jsx("p", { children: "No competency data available yet." }),
        /* @__PURE__ */ jsx("p", { className: "text-sm mt-2", children: "Complete some project sessions to see your competency scores." })
      ] }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "achievements", children: /* @__PURE__ */ jsx(AchievementArchive, { earnedBadgeIds: currentUser.earnedBadgeIds ?? [], level: currentUser.level, xp: currentUser.xp }) })
    ] })
  ] }) });
}
export {
  PortfolioPage as component
};
