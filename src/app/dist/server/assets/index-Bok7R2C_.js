import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Users, RefreshCw, Loader2, ChevronDown, X, Clock, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { aH as Route, u as useAuthStore, z as useCreatorStore, aI as unremoveParticipant, B as Button, T as TooltipProvider, v as Tooltip, w as TooltipTrigger, x as TooltipContent, d as cn, a as Badge, N as Collapsible, O as CollapsibleTrigger, Q as CollapsibleContent, A as Avatar, q as AvatarImage, t as AvatarFallback, ab as AlertDialog, ac as AlertDialogContent, ad as AlertDialogHeader, ae as AlertDialogTitle, af as AlertDialogDescription, ag as AlertDialogFooter, ah as AlertDialogCancel, ai as AlertDialogAction } from "./router-Bhor0jGk.js";
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
import "qrcode";
const POLL_INTERVAL = 1e4;
function ParticipantCard({
  id,
  name,
  email,
  avatar,
  joinedAt,
  onRemove
}) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 bg-card border border-border rounded-lg p-3 group hover:border-muted-foreground/30 transition-colors", children: [
    /* @__PURE__ */ jsxs(Avatar, { children: [
      avatar ? /* @__PURE__ */ jsx(AvatarImage, { src: avatar, alt: name }) : null,
      /* @__PURE__ */ jsx(AvatarFallback, { children: initials })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-foreground truncate", children: name }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground truncate", children: email })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
      /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsxs(Tooltip, { children: [
        /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground hidden sm:inline-flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
          formatDistanceToNow(new Date(joinedAt), {
            addSuffix: true
          })
        ] }) }),
        /* @__PURE__ */ jsx(TooltipContent, { children: /* @__PURE__ */ jsxs("p", { children: [
          "Joined ",
          new Date(joinedAt).toLocaleString()
        ] }) })
      ] }) }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => onRemove(id, name), className: "p-1.5 rounded-md text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors", children: /* @__PURE__ */ jsx(UserMinus, { className: "w-3.5 h-3.5" }) })
    ] })
  ] });
}
function ParticipantPage() {
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
    fetchProjects,
    getParticipants,
    fetchParticipants,
    removeParticipant
  } = useCreatorStore();
  const project = getProject(projectId);
  const participants = getParticipants(projectId);
  const [isLoading, setIsLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(/* @__PURE__ */ new Date());
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
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchParticipants(projectId);
      setIsLoading(false);
      setLastRefresh(/* @__PURE__ */ new Date());
    };
    load();
  }, [projectId, fetchParticipants]);
  useEffect(() => {
    const interval = setInterval(async () => {
      await fetchParticipants(projectId);
      setLastRefresh(/* @__PURE__ */ new Date());
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [projectId, fetchParticipants]);
  const handleManualRefresh = useCallback(async () => {
    await fetchParticipants(projectId);
    setLastRefresh(/* @__PURE__ */ new Date());
  }, [projectId, fetchParticipants]);
  const handleRemove = useCallback(async (userId) => {
    setRemoveLoading(true);
    try {
      const success = await removeParticipant(projectId, userId);
      if (success) {
        toast.success("Participant removed");
      } else {
        toast.error("Failed to remove participant");
      }
    } catch {
      toast.error("Failed to remove participant");
    } finally {
      setRemoveLoading(false);
      setRemoveTarget(null);
    }
  }, [projectId, removeParticipant]);
  const handleUnremove = useCallback(async (userId) => {
    try {
      const result = await unremoveParticipant({
        data: {
          projectId,
          userId
        }
      });
      if (result.success) {
        toast.success("Participant unremoved");
        await fetchParticipants(projectId);
      } else {
        toast.error("Failed to unremove participant");
      }
    } catch {
      toast.error("Failed to unremove participant");
    }
  }, [projectId, fetchParticipants]);
  if (!currentUser || !currentUser.role.includes("creator")) {
    return null;
  }
  if (!project) {
    return /* @__PURE__ */ jsx("div", { className: "container max-w-5xl mx-auto py-8 px-4", children: /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-foreground mb-2", children: "Project Not Found" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: "The project you're looking for doesn't exist." }),
      /* @__PURE__ */ jsx(Button, { onClick: () => navigate({
        to: "/creator"
      }), children: "Back to Dashboard" })
    ] }) });
  }
  const teamGroups = /* @__PURE__ */ new Map();
  if (participants) {
    for (const p of participants.assigned) {
      const key = p.teamId;
      if (!teamGroups.has(key)) {
        teamGroups.set(key, {
          teamName: p.teamName,
          members: []
        });
      }
      teamGroups.get(key).members.push(p);
    }
  }
  const waitingCount = participants?.waiting.length ?? 0;
  participants?.assigned.length ?? 0;
  const removedCount = participants?.removed?.length ?? 0;
  const teamCount = teamGroups.size;
  return /* @__PURE__ */ jsxs("div", { className: "min-h-[calc(100vh-4rem)] bg-background", children: [
    /* @__PURE__ */ jsxs("div", { className: "container max-w-5xl mx-auto py-8 px-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
        /* @__PURE__ */ jsxs(Button, { variant: "ghost", onClick: () => navigate({
          to: "/creator/project/$projectId",
          params: {
            projectId
          }
        }), className: "mb-4 text-muted-foreground hover:text-foreground", children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
          "Back to Project"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-foreground flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(Users, { className: "w-8 h-8 text-cyan-500" }),
              "Participants"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-1", children: project.name })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "Updates every 10s" }),
            /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsxs(Tooltip, { children: [
              /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: handleManualRefresh, className: "border-border", children: /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4" }) }) }),
              /* @__PURE__ */ jsx(TooltipContent, { children: /* @__PURE__ */ jsxs("p", { children: [
                "Refresh now (last:",
                " ",
                lastRefresh.toLocaleTimeString(),
                ")"
              ] }) })
            ] }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: cn("grid gap-4 mb-8", removedCount > 0 ? "grid-cols-4" : "grid-cols-3"), children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-4", children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-foreground", children: participants?.total ?? 0 }),
          /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Total Participants" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-4", children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-foreground", children: teamCount }),
          /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Teams" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-4", children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-amber-500", children: waitingCount }),
          /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Waiting for Team" })
        ] }),
        removedCount > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-4", children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-destructive/70", children: removedCount }),
          /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Removed" })
        ] })
      ] }),
      isLoading && !participants && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center py-16", children: [
        /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-muted-foreground" }),
        /* @__PURE__ */ jsx("span", { className: "ml-3 text-muted-foreground", children: "Loading participants..." })
      ] }),
      !isLoading && participants && participants.total === 0 && /* @__PURE__ */ jsxs("div", { className: "text-center py-16", children: [
        /* @__PURE__ */ jsx(Users, { className: "w-12 h-12 text-muted-foreground/40 mx-auto mb-4" }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-foreground mb-1", children: "No participants yet" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
          "Share the join code",
          " ",
          /* @__PURE__ */ jsx("span", { className: "font-mono font-bold text-foreground", children: project.joinCode }),
          " ",
          "to invite explorers."
        ] })
      ] }),
      participants && waitingCount > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-sm font-medium text-muted-foreground uppercase tracking-wider", children: "Waiting for Team Assignment" }),
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "bg-amber-500/10 text-amber-500 border-amber-500/30 text-xs", children: waitingCount })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: participants.waiting.map((p) => /* @__PURE__ */ jsx(ParticipantCard, { id: p.id, name: p.name, email: p.email, avatar: p.avatar, joinedAt: p.joinedAt, onRemove: (id, name) => setRemoveTarget({
          id,
          name
        }) }, p.id)) })
      ] }),
      participants && teamCount > 0 && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4", children: [
          "Teams (",
          teamCount,
          ")"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-4", children: Array.from(teamGroups.entries()).map(([teamId, {
          teamName,
          members
        }]) => /* @__PURE__ */ jsx(Collapsible, { defaultOpen: true, children: /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg overflow-hidden", children: [
          /* @__PURE__ */ jsxs(CollapsibleTrigger, { className: "w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(Users, { className: "w-4 h-4 text-cyan-500" }),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-foreground", children: teamName }),
              /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30 text-xs", children: [
                members.length,
                " ",
                members.length === 1 ? "member" : "members"
              ] })
            ] }),
            /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" })
          ] }),
          /* @__PURE__ */ jsx(CollapsibleContent, { children: /* @__PURE__ */ jsx("div", { className: "border-t border-border px-4 pb-4 pt-3", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: members.map((p) => /* @__PURE__ */ jsx(ParticipantCard, { id: p.id, name: p.name, email: p.email, avatar: p.avatar, joinedAt: p.joinedAt, onRemove: (id, name) => setRemoveTarget({
            id,
            name
          }) }, p.id)) }) }) })
        ] }) }, teamId)) })
      ] }),
      participants && removedCount > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-sm font-medium text-muted-foreground uppercase tracking-wider", children: "Removed" }),
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "bg-destructive/10 text-destructive border-destructive/30 text-xs", children: removedCount })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: participants.removed.map((p) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 bg-card border border-border rounded-lg p-3", children: [
          /* @__PURE__ */ jsxs(Avatar, { children: [
            p.avatar ? /* @__PURE__ */ jsx(AvatarImage, { src: p.avatar, alt: p.name }) : null,
            /* @__PURE__ */ jsx(AvatarFallback, { children: p.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-foreground truncate", children: p.name }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground truncate", children: p.email })
          ] }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => handleUnremove(p.id), className: "p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors", children: /* @__PURE__ */ jsx(X, { className: "w-3.5 h-3.5" }) })
        ] }, p.id)) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(AlertDialog, { open: !!removeTarget, onOpenChange: (open) => !open && setRemoveTarget(null), children: /* @__PURE__ */ jsxs(AlertDialogContent, { className: "bg-card border-border", children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { className: "text-foreground", children: "Remove Participant" }),
        /* @__PURE__ */ jsxs(AlertDialogDescription, { className: "text-muted-foreground", children: [
          "Are you sure you want to remove",
          " ",
          /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: removeTarget?.name }),
          " ",
          "from this project? They will be removed from their team and their invitation will be revoked. This action cannot be undone."
        ] })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { className: "border-border text-muted-foreground hover:bg-muted", children: "Cancel" }),
        /* @__PURE__ */ jsx(AlertDialogAction, { className: "bg-destructive text-white hover:bg-destructive/90 dark:bg-destructive/60", disabled: removeLoading, onClick: async () => {
          if (removeTarget) {
            await handleRemove(removeTarget.id);
          }
        }, children: removeLoading ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
          "Removing..."
        ] }) : "Remove" })
      ] })
    ] }) })
  ] });
}
export {
  ParticipantPage as component
};
