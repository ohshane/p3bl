import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Loader2, ArrowLeft, Store, User, FileText, ChevronDown, Clock, Link, BookOpen, Library, Users, Calendar } from "lucide-react";
import { toast } from "sonner";
import { u as useAuthStore, B as Button, a as Badge, N as Collapsible, O as CollapsibleTrigger, Q as CollapsibleContent, aA as getStoreTemplate, Y as cloneStoreTemplate } from "./router-Bhor0jGk.js";
import "next-themes";
import "zustand";
import "zustand/middleware";
import "./artifacts-V6YAL9mY.js";
import "../server.js";
import "node:async_hooks";
import "@tanstack/react-router/ssr/server";
import "zod";
import "./auth-B6e831Uo.js";
import "class-variance-authority";
import "radix-ui";
import "clsx";
import "tailwind-merge";
import "date-fns";
import "qrcode";
function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes} min`;
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? "s" : ""}`;
  } else if (minutes < 10080) {
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor(minutes % 1440 / 60);
    return hours > 0 ? `${days}d ${hours}h` : `${days} day${days > 1 ? "s" : ""}`;
  } else {
    const weeks = Math.floor(minutes / 10080);
    const days = Math.floor(minutes % 10080 / 1440);
    return days > 0 ? `${weeks}w ${days}d` : `${weeks} week${weeks > 1 ? "s" : ""}`;
  }
}
const difficultyColors = {
  easy: "bg-green-500/10 text-green-400 border-green-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  hard: "bg-red-500/10 text-red-400 border-red-500/20"
};
function StoreTemplateDetail() {
  const navigate = useNavigate();
  const { id } = useParams({ strict: false });
  const { currentUser } = useAuthStore();
  const [template, setTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCloning, setIsCloning] = useState(false);
  useEffect(() => {
    async function fetchTemplate() {
      if (!id) return;
      setIsLoading(true);
      try {
        const result = await getStoreTemplate({ data: { templateId: id } });
        if (result.success) {
          setTemplate(result.template);
        }
      } catch (error) {
        console.error("Failed to fetch store template:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTemplate();
  }, [id]);
  const handleCloneToLibrary = async () => {
    if (!currentUser?.id || !template) return;
    setIsCloning(true);
    try {
      const result = await cloneStoreTemplate({
        data: {
          templateId: template.id,
          creatorId: currentUser.id
        }
      });
      if (result.success) {
        toast.success("Template added to your library!");
        navigate({ to: "/creator/library" });
      } else {
        toast.error(result.error || "Failed to clone template");
      }
    } catch (error) {
      console.error("Clone store template error:", error);
      toast.error("Failed to clone template");
    } finally {
      setIsCloning(false);
    }
  };
  if (isLoading) {
    return /* @__PURE__ */ jsxs("div", { className: "min-h-[calc(100vh-4rem)] bg-background flex flex-col items-center justify-center", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "w-10 h-10 animate-spin text-violet-500 mb-4" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Loading template..." })
    ] });
  }
  if (!template) {
    return /* @__PURE__ */ jsx("div", { className: "container max-w-6xl mx-auto py-8 px-4", children: /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-foreground mb-2", children: "Template Not Found" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: "This template may have been unpublished or doesn't exist." }),
      /* @__PURE__ */ jsx(Button, { onClick: () => navigate({ to: "/creator/store" }), children: "Back to Store" })
    ] }) });
  }
  const isOwn = template.creatorId === currentUser?.id;
  const totalDuration = template.sessions.reduce(
    (sum, s) => sum + (s.durationMinutes || 0),
    0
  );
  return /* @__PURE__ */ jsx("div", { className: "min-h-[calc(100vh-4rem)] bg-background", children: /* @__PURE__ */ jsxs("div", { className: "container max-w-5xl mx-auto py-8 px-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "ghost",
          onClick: () => navigate({ to: "/creator/store" }),
          className: "mb-4 text-muted-foreground hover:text-foreground",
          children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
            "Back to Store"
          ]
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "flex items-start justify-between", children: /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
          /* @__PURE__ */ jsx(Store, { className: "w-8 h-8 text-violet-500 shrink-0" }),
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-foreground", children: template.title }),
          /* @__PURE__ */ jsx(
            Badge,
            {
              variant: "outline",
              className: "text-xs uppercase font-bold shrink-0 bg-violet-500/10 text-violet-500 border-violet-500/30",
              children: "Shared Template"
            }
          ),
          isOwn && /* @__PURE__ */ jsx(
            Badge,
            {
              variant: "outline",
              className: "text-xs uppercase font-bold shrink-0 bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
              children: "Yours"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground mt-1 ml-11", children: [
          /* @__PURE__ */ jsx(User, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxs("span", { children: [
            "by ",
            template.creatorName,
            isOwn ? " (you)" : ""
          ] })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-5", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3", children: "Description" }),
          /* @__PURE__ */ jsx("p", { className: "text-foreground whitespace-pre-wrap", children: template.description || /* @__PURE__ */ jsx("span", { className: "text-muted-foreground italic", children: "No description" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-5", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3", children: "Driving Question" }),
          /* @__PURE__ */ jsx("p", { className: "text-foreground", children: template.drivingQuestion || /* @__PURE__ */ jsx("span", { className: "text-muted-foreground italic", children: "No driving question" }) })
        ] }),
        template.background && /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-5", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3", children: "Background" }),
          /* @__PURE__ */ jsx("p", { className: "text-foreground whitespace-pre-wrap", children: template.background })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-5", children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4", children: [
            "Sessions (",
            template.sessions.length,
            ")"
          ] }),
          template.sessions.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: "No sessions configured." }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: template.sessions.map((session, idx) => /* @__PURE__ */ jsx(Collapsible, { children: /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-muted/30 border border-border", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-violet-400", children: idx + 1 }) }),
              /* @__PURE__ */ jsxs(CollapsibleTrigger, { className: "flex-1 min-w-0 flex items-center gap-2 cursor-pointer [&[data-state=open]_.chevron-icon]:rotate-180", children: [
                /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground text-sm truncate", children: session.title?.replace(/^Session\s+\d+:\s*/, "") || "Untitled" }),
                /* @__PURE__ */ jsx(
                  Badge,
                  {
                    variant: "outline",
                    className: `text-[10px] shrink-0 ${difficultyColors[session.difficulty] || ""}`,
                    children: session.difficulty
                  }
                ),
                session.deliverableType !== "none" && /* @__PURE__ */ jsx(FileText, { className: "w-3 h-3 text-muted-foreground shrink-0" }),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground shrink-0 ml-auto mr-1", children: session.durationMinutes > 0 ? formatDuration(session.durationMinutes) : "-" }),
                /* @__PURE__ */ jsx(ChevronDown, { className: "chevron-icon w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200" })
              ] })
            ] }),
            /* @__PURE__ */ jsx(CollapsibleContent, { children: /* @__PURE__ */ jsxs("div", { className: "px-3 pb-3 pt-0 pl-14 space-y-2", children: [
              session.topic && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: session.topic }),
              session.guide && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground", children: "Guide:" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-foreground mt-0.5 whitespace-pre-wrap", children: session.guide })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-xs text-muted-foreground", children: [
                /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3 shrink-0" }),
                /* @__PURE__ */ jsx("span", { children: session.durationMinutes > 0 ? formatDuration(session.durationMinutes) : "-" })
              ] }),
              session.deliverableType !== "none" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-xs text-muted-foreground", children: [
                /* @__PURE__ */ jsx(FileText, { className: "w-3 h-3 shrink-0" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  "Deliverable: ",
                  session.deliverableTitle || "Document",
                  session.deliverableDescription && ` - ${session.deliverableDescription}`
                ] })
              ] }),
              session.resources && session.resources.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-1", children: [
                /* @__PURE__ */ jsxs("span", { className: "text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1", children: [
                  /* @__PURE__ */ jsx(Link, { className: "w-3 h-3" }),
                  "Resources (",
                  session.resources.length,
                  ")"
                ] }),
                /* @__PURE__ */ jsx("div", { className: "space-y-1 pl-4", children: session.resources.map((r) => /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-foreground", children: r.title }),
                  /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[9px] px-1 py-0 h-4", children: r.type })
                ] }, r.id)) })
              ] }),
              session.rubrics && session.rubrics.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-1", children: [
                /* @__PURE__ */ jsxs("span", { className: "text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1", children: [
                  /* @__PURE__ */ jsx(BookOpen, { className: "w-3 h-3" }),
                  "Rubric (",
                  session.rubrics.length,
                  " criteria)"
                ] }),
                /* @__PURE__ */ jsx("div", { className: "space-y-1 pl-4", children: session.rubrics.map((r) => /* @__PURE__ */ jsxs("div", { className: "text-xs", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-foreground font-medium", children: r.criteria }),
                  r.description && /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
                    " - ",
                    r.description
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground ml-1", children: [
                    "(weight: ",
                    r.weight,
                    ")"
                  ] })
                ] }, r.id)) })
              ] })
            ] }) })
          ] }) }, session.id)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-card border border-border rounded-lg p-5", children: isOwn ? /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            className: "w-full",
            onClick: () => navigate({ to: "/creator/library" }),
            children: [
              /* @__PURE__ */ jsx(Library, { className: "w-4 h-4 mr-2" }),
              "View in Library"
            ]
          }
        ) : /* @__PURE__ */ jsx(
          Button,
          {
            className: "w-full bg-violet-600 hover:bg-violet-700 text-white",
            onClick: handleCloneToLibrary,
            disabled: isCloning,
            children: isCloning ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
              "Cloning..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Library, { className: "w-4 h-4 mr-2" }),
              "Add to Library"
            ] })
          }
        ) }),
        /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-5", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3", children: "Details" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-muted-foreground", children: [
                template.teamSize === 1 ? /* @__PURE__ */ jsx(User, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(Users, { className: "w-4 h-4" }),
                "Type"
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-foreground", children: template.teamSize === 1 ? "Individual" : "Group" })
            ] }),
            template.teamSize > 1 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-muted-foreground", children: [
                /* @__PURE__ */ jsx(Users, { className: "w-4 h-4" }),
                "Team Size"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "text-foreground", children: [
                template.teamSize,
                " members"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-muted-foreground", children: [
                /* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4" }),
                "Sessions"
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-foreground", children: template.sessionCount })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-muted-foreground shrink-0", children: [
                /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4" }),
                "Total Duration"
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-foreground", children: totalDuration > 0 ? formatDuration(totalDuration) : "-" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-5", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3", children: "Published By" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx("span", { className: "text-violet-400 font-medium text-sm", children: template.creatorName?.charAt(0).toUpperCase() }) }),
            /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("p", { className: "text-sm font-medium text-foreground", children: [
              template.creatorName,
              isOwn ? " (you)" : ""
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-5", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3", children: "Created" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-foreground", children: new Date(template.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          }) })
        ] })
      ] })
    ] })
  ] }) });
}
function StoreTemplateDetailPage() {
  return /* @__PURE__ */ jsx(StoreTemplateDetail, {});
}
export {
  StoreTemplateDetailPage as component
};
