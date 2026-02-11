import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Pencil, Users, Loader2, Library, Globe, Forward, Trash2, User, Calendar, Clock, Eye, LogIn, Play, Search, PenTool, Shield, FolderPlus, Sparkles, TrendingUp, LayoutDashboard, Plus, Layers, FolderOpen, CheckCircle } from "lucide-react";
import { z as useCreatorStore, u as useAuthStore, f as getProjectTimeStatus, h as getProjectProgress, i as getProjectTimeInfo, C as searchDelegateUsers, a as Badge, B as Button, J as JoinCode, s as safeFormatDate, m as Progress, D as Dialog, n as DialogContent, o as DialogHeader, p as DialogTitle, E as DialogDescription, F as DialogFooter, I as Input, G as cloneProjectAsTemplate, j as joinProject, H as updateProject, K as updateSession, L as delegateProject } from "./router-Bhor0jGk.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-D_4abuiO.js";
import { toast } from "sonner";
import { C as Card, b as CardHeader, a as CardContent } from "./card-CuhZmkUZ.js";
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
function CreatorProjectCard({ project }) {
  const navigate = useNavigate();
  const { deleteProject, fetchProjects } = useCreatorStore();
  const { currentUser } = useAuthStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDelegateDialog, setShowDelegateDialog] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isDelegating, setIsDelegating] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [, setTick] = useState(0);
  const [delegateSearch, setDelegateSearch] = useState("");
  const [delegateResults, setDelegateResults] = useState([]);
  const [selectedDelegate, setSelectedDelegate] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef(null);
  const userRoles = currentUser?.role ?? [];
  const showJoinButton = userRoles.includes("explorer");
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1e3);
    return () => clearInterval(timer);
  }, []);
  const status = getProjectTimeStatus(
    project.startDate,
    project.endDate
  );
  const progress = getProjectProgress(project.startDate, project.endDate);
  const timeInfo = getProjectTimeInfo(project.startDate, project.endDate);
  const statusColors = {
    scheduled: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    opened: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
    closed: "bg-green-500/10 text-green-500 border-green-500/30"
  };
  const statusLabels = {
    scheduled: "Scheduled",
    opened: "Opened",
    closed: "Closed"
  };
  const handleDelete = async () => {
    const success = await deleteProject(project.id);
    setShowDeleteDialog(false);
    if (success) {
      toast.success("Project deleted");
    } else {
      toast.error("Failed to delete project");
    }
  };
  const handleMonitor = () => {
    navigate({
      to: "/creator/project/$projectId/monitor",
      params: { projectId: project.id }
    });
  };
  const handleStartNow = async () => {
    setIsStarting(true);
    try {
      const now = /* @__PURE__ */ new Date();
      const totalDurationMs = project.sessions.reduce(
        (sum, s) => sum + (s.durationMinutes || 60) * 60 * 1e3,
        0
      );
      let projectEndDate;
      if (totalDurationMs > 0) {
        projectEndDate = new Date(now.getTime() + totalDurationMs);
      } else if (project.startDate && project.endDate) {
        const originalDuration = new Date(project.endDate).getTime() - new Date(project.startDate).getTime();
        projectEndDate = new Date(now.getTime() + originalDuration);
      } else {
        projectEndDate = new Date(now.getTime() + 60 * 60 * 1e3);
      }
      const result = await updateProject({
        data: {
          projectId: project.id,
          updates: {
            startDate: now.toISOString(),
            endDate: projectEndDate.toISOString()
          }
        }
      });
      if (result.success && project.sessions.length > 0) {
        let cursor = now.getTime();
        const sessionDateUpdates = project.sessions.map((session) => {
          const sessionDurationMs = (session.durationMinutes || 60) * 60 * 1e3;
          const sessionStart = new Date(cursor);
          const sessionEnd = new Date(cursor + sessionDurationMs);
          cursor = sessionEnd.getTime();
          return {
            sessionId: session.id,
            startDate: sessionStart.toISOString(),
            endDate: sessionEnd.toISOString()
          };
        });
        await Promise.all(
          sessionDateUpdates.map(async (u) => {
            await updateSession({
              data: {
                sessionId: u.sessionId,
                updates: {
                  startDate: u.startDate,
                  endDate: u.endDate
                }
              }
            });
          })
        );
        toast.success("Project started!");
        await fetchProjects(project.creatorId);
      } else if (result.success) {
        toast.success("Project started!");
        await fetchProjects(project.creatorId);
      } else {
        toast.error("Failed to start project");
      }
    } catch (error) {
      toast.error("Failed to start project");
    } finally {
      setIsStarting(false);
    }
  };
  const handleAddToLibrary = async () => {
    if (!currentUser?.id) return;
    setIsCloning(true);
    try {
      const result = await cloneProjectAsTemplate({
        data: {
          projectId: project.id,
          creatorId: currentUser.id
        }
      });
      if (result.success) {
        toast.success("Project added to library as a template!");
        navigate({ to: "/creator/library" });
      } else {
        toast.error(result.error || "Failed to add to library");
      }
    } catch (error) {
      toast.error("Failed to add to library");
    } finally {
      setIsCloning(false);
    }
  };
  const handlePublishToStore = async () => {
    if (!currentUser?.id) return;
    setIsPublishing(true);
    try {
      const result = await cloneProjectAsTemplate({
        data: {
          projectId: project.id,
          creatorId: currentUser.id,
          publish: true
        }
      });
      if (result.success) {
        toast.success("Project published to the store!");
        navigate({ to: "/creator/store" });
      } else {
        toast.error(result.error || "Failed to publish to store");
      }
    } catch (error) {
      toast.error("Failed to publish to store");
    } finally {
      setIsPublishing(false);
    }
  };
  const handleViewDetails = () => {
    navigate({
      to: "/creator/project/$projectId",
      params: { projectId: project.id }
    });
  };
  const handleJoinAsExplorer = async () => {
    if (!currentUser?.id || !project.joinCode) return;
    setIsJoining(true);
    try {
      const result = await joinProject({
        data: { userId: currentUser.id, code: project.joinCode }
      });
      if (result.success) {
        const alreadyMember = "message" in result && result.message === "Already a member of this project";
        if (!alreadyMember) {
          toast.success("Joined project as explorer!");
        }
        navigate({
          to: "/explorer/project/$projectId",
          params: { projectId: result.projectId || project.id }
        });
      } else {
        toast.error(result.error || "Failed to join project");
      }
    } catch (error) {
      toast.error("Failed to join project");
    } finally {
      setIsJoining(false);
    }
  };
  const handleDelegateSearch = useCallback(
    (value) => {
      setDelegateSearch(value);
      setSelectedDelegate(null);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (value.trim().length < 2) {
        setDelegateResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const result = await searchDelegateUsers({
            data: { search: value.trim(), excludeUserId: currentUser?.id }
          });
          if (result.success) {
            setDelegateResults(result.users);
          } else {
            setDelegateResults([]);
          }
        } catch {
          setDelegateResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    },
    [currentUser?.id]
  );
  const handleDelegate = async () => {
    if (!selectedDelegate || !currentUser?.id) return;
    setIsDelegating(true);
    try {
      const result = await delegateProject({
        data: {
          projectId: project.id,
          currentCreatorId: currentUser.id,
          newCreatorId: selectedDelegate.id
        }
      });
      if (result.success) {
        toast.success(result.message || "Project delegated successfully");
        setShowDelegateDialog(false);
        setDelegateSearch("");
        setDelegateResults([]);
        setSelectedDelegate(null);
        await fetchProjects(currentUser.id);
      } else {
        toast.error(result.error || "Failed to delegate project");
      }
    } catch {
      toast.error("Failed to delegate project");
    } finally {
      setIsDelegating(false);
    }
  };
  const handleCloseDelegateDialog = (open) => {
    setShowDelegateDialog(open);
    if (!open) {
      setDelegateSearch("");
      setDelegateResults([]);
      setSelectedDelegate(null);
    }
  };
  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return /* @__PURE__ */ jsx(Shield, { className: "w-3 h-3" });
      case "creator":
        return /* @__PURE__ */ jsx(PenTool, { className: "w-3 h-3" });
      default:
        return null;
    }
  };
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "creator":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    }
  };
  const teamsWithRisk = project.teams.filter(
    (t) => t.riskLevel === "red" || t.riskLevel === "yellow"
  );
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(Card, { className: "bg-card border-border transition-all flex flex-col h-full", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ jsx(
            Badge,
            {
              variant: "outline",
              className: `text-[10px] uppercase font-bold py-0 h-5 px-2 ${statusColors[status]}`,
              children: statusLabels[status]
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                onClick: handleViewDetails,
                className: "h-8 w-8 text-muted-foreground hover:text-cyan-500 hover:bg-cyan-500/10",
                title: "Edit project",
                children: /* @__PURE__ */ jsx(Pencil, { className: "w-4 h-4" })
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                onClick: () => navigate({
                  to: "/creator/project/$projectId/participant",
                  params: { projectId: project.id }
                }),
                className: "h-8 w-8 text-muted-foreground hover:text-cyan-500 hover:bg-cyan-500/10",
                title: "View participants",
                children: /* @__PURE__ */ jsx(Users, { className: "w-4 h-4" })
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                onClick: handleAddToLibrary,
                disabled: isCloning,
                className: "h-8 w-8 text-muted-foreground hover:text-cyan-500 hover:bg-cyan-500/10",
                title: "Add to library as template",
                children: isCloning ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Library, { className: "w-4 h-4" })
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                onClick: handlePublishToStore,
                disabled: isPublishing,
                className: "h-8 w-8 text-muted-foreground hover:text-violet-500 hover:bg-violet-500/10",
                title: "Publish to store",
                children: isPublishing ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Globe, { className: "w-4 h-4" })
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                onClick: () => setShowDelegateDialog(true),
                className: "h-8 w-8 text-muted-foreground hover:text-orange-400 hover:bg-orange-500/10",
                title: "Delegate project",
                children: /* @__PURE__ */ jsx(Forward, { className: "w-4 h-4" })
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                onClick: () => setShowDeleteDialog(true),
                className: "h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10",
                title: "Delete project",
                children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "h3",
          {
            className: "text-lg font-semibold text-foreground line-clamp-1 hover:text-cyan-500 transition-colors cursor-pointer w-full",
            onClick: handleViewDetails,
            children: project.name
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground line-clamp-2 mt-1 w-full", children: project.description })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "flex flex-col flex-1", children: [
        /* @__PURE__ */ jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsx(
          JoinCode,
          {
            joinCode: project.joinCode,
            projectId: project.id,
            creatorId: project.creatorId,
            projectName: project.name,
            size: "sm"
          }
        ) }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-muted-foreground", children: [
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
              project.teamSize === 1 ? /* @__PURE__ */ jsx(User, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(Users, { className: "w-4 h-4" }),
              "Type"
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-foreground", children: project.teamSize === 1 ? "Individual" : "Group" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-muted-foreground", children: [
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4" }),
              "Sessions"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-foreground", children: [
              project.sessions.length,
              " sessions"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-muted-foreground", children: [
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4" }),
              "Duration"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-foreground", children: [
              safeFormatDate(project.startDate, "MMM d HH:mm", "TBD"),
              " -",
              " ",
              safeFormatDate(project.endDate, "MMM d HH:mm", "TBD")
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-5 mb-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs text-muted-foreground mb-1", children: [
            /* @__PURE__ */ jsxs("span", { children: [
              timeInfo.elapsed,
              " elapsed"
            ] }),
            /* @__PURE__ */ jsxs("span", { children: [
              timeInfo.remaining,
              " left"
            ] })
          ] }),
          /* @__PURE__ */ jsx(Progress, { value: progress, className: "h-2" })
        ] }),
        status === "opened" && teamsWithRisk.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-4 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400", children: [
          teamsWithRisk.length,
          " team(s) need attention"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-auto pt-4", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              onClick: handleMonitor,
              className: "w-full bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-600/50",
              children: [
                /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4 mr-2" }),
                "Monitor Progress"
              ]
            }
          ),
          showJoinButton && status !== "closed" && /* @__PURE__ */ jsxs(
            Button,
            {
              onClick: handleJoinAsExplorer,
              disabled: isJoining,
              className: "w-full mt-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-600/50",
              children: [
                isJoining ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }) : /* @__PURE__ */ jsx(LogIn, { className: "w-4 h-4 mr-2" }),
                isJoining ? "Joining..." : "Join as Explorer"
              ]
            }
          ),
          status === "scheduled" && /* @__PURE__ */ jsxs(
            Button,
            {
              onClick: handleStartNow,
              disabled: isStarting,
              className: "w-full mt-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/50",
              children: [
                /* @__PURE__ */ jsx(Play, { className: "w-4 h-4 mr-2" }),
                isStarting ? "Starting..." : "Start Now"
              ]
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: showDeleteDialog, onOpenChange: setShowDeleteDialog, children: /* @__PURE__ */ jsxs(DialogContent, { className: "bg-card border-border", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Delete Project" }),
        /* @__PURE__ */ jsxs(DialogDescription, { children: [
          'Are you sure you want to delete "',
          project.name,
          '"? This action cannot be undone.'
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "outline",
            onClick: () => setShowDeleteDialog(false),
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsx(Button, { variant: "destructive", onClick: handleDelete, children: "Delete" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(
      Dialog,
      {
        open: showDelegateDialog,
        onOpenChange: handleCloseDelegateDialog,
        children: /* @__PURE__ */ jsxs(DialogContent, { className: "bg-card border-border sm:max-w-md", children: [
          /* @__PURE__ */ jsxs(DialogHeader, { children: [
            /* @__PURE__ */ jsx(DialogTitle, { children: "Delegate Project" }),
            /* @__PURE__ */ jsxs(DialogDescription, { children: [
              'Transfer ownership of "',
              project.name,
              '" to another user. This will remove the project from your dashboard.'
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                placeholder: "Search by name or email...",
                value: delegateSearch,
                onChange: (e) => handleDelegateSearch(e.target.value),
                className: "pl-10 bg-background border-border",
                autoFocus: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "min-h-[200px] max-h-[300px] overflow-y-auto", children: [
            isSearching && /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-8", children: /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin text-muted-foreground" }) }),
            !isSearching && delegateSearch.trim().length < 2 && /* @__PURE__ */ jsx("div", { className: "text-center py-8 text-sm text-muted-foreground", children: "Type at least 2 characters to search" }),
            !isSearching && delegateSearch.trim().length >= 2 && delegateResults.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-center py-8 text-sm text-muted-foreground", children: "No users found" }),
            !isSearching && delegateResults.length > 0 && /* @__PURE__ */ jsx("div", { className: "space-y-1", children: delegateResults.map((user) => /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setSelectedDelegate(user),
                className: `w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${selectedDelegate?.id === user.id ? "bg-cyan-500/10 border border-cyan-500/30" : "hover:bg-muted/50 border border-transparent"}`,
                children: [
                  /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx("span", { className: "text-foreground font-medium text-sm", children: user.name.charAt(0).toUpperCase() }) }),
                  /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsx("p", { className: "font-medium text-foreground text-sm truncate", children: user.name }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground truncate", children: user.email })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "flex gap-1 shrink-0", children: (Array.isArray(user.role) ? user.role : [user.role]).map(
                    (r) => /* @__PURE__ */ jsxs(
                      Badge,
                      {
                        className: `${getRoleBadgeColor(r)} gap-1 text-[10px]`,
                        children: [
                          getRoleIcon(r),
                          r
                        ]
                      },
                      r
                    )
                  ) })
                ]
              },
              user.id
            )) })
          ] }),
          /* @__PURE__ */ jsxs(DialogFooter, { children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "outline",
                onClick: () => handleCloseDelegateDialog(false),
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                onClick: handleDelegate,
                disabled: !selectedDelegate || isDelegating,
                className: "bg-orange-600 hover:bg-orange-700 text-white",
                children: isDelegating ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
                  "Delegating..."
                ] }) : "Delegate"
              }
            )
          ] })
        ] })
      }
    )
  ] });
}
function EmptyDashboard({ onCreateProject }) {
  const features = [
    {
      icon: /* @__PURE__ */ jsx(Sparkles, { className: "w-6 h-6" }),
      title: "AI-Powered Project Design",
      description: "Let AI help you break down complex problems into structured, conquerable milestones."
    },
    {
      icon: /* @__PURE__ */ jsx(Users, { className: "w-6 h-6" }),
      title: "Smart Team Formation",
      description: "Automatically create balanced teams or manually assign explorers based on your preferences."
    },
    {
      icon: /* @__PURE__ */ jsx(TrendingUp, { className: "w-6 h-6" }),
      title: "Real-Time Progress Tracking",
      description: "Monitor team progress across milestones, identify blockers, and provide timely guidance."
    }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "container max-w-4xl mx-auto py-16 px-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-12", children: [
      /* @__PURE__ */ jsx("div", { className: "w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center", children: /* @__PURE__ */ jsx(FolderPlus, { className: "w-10 h-10 text-white" }) }),
      /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold text-foreground mb-4", children: "Welcome to the Creator Dashboard" }),
      /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground max-w-2xl mx-auto", children: "Design projects that break complex problems into conquerable milestones. Form teams, track progress, and guide explorers as they tackle each challenge." })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-12", children: /* @__PURE__ */ jsxs(
      Button,
      {
        onClick: onCreateProject,
        size: "lg",
        className: "bg-cyan-600 hover:bg-cyan-700 text-white text-lg px-8 py-6",
        children: [
          /* @__PURE__ */ jsx(FolderPlus, { className: "w-5 h-5 mr-2" }),
          "Create Your First Project"
        ]
      }
    ) }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: features.map((feature, index) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: "bg-card border border-border rounded-xl p-6 text-center",
        children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 mx-auto mb-4 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500", children: feature.icon }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-foreground mb-2", children: feature.title }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: feature.description })
        ]
      },
      index
    )) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-12 bg-muted/40 border border-border rounded-xl p-8", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mb-6 text-center", children: "Getting Started in 3 Steps" }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row items-center justify-center gap-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold", children: "1" }),
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Create a project" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "hidden md:block w-12 h-[2px] bg-border" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold", children: "2" }),
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Share the join code" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "hidden md:block w-12 h-[2px] bg-border" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold", children: "3" }),
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Monitor & assess" })
        ] })
      ] })
    ] })
  ] });
}
function CreatorDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [, setTick] = useState(0);
  const { currentUser } = useAuthStore();
  const {
    getAllProjects,
    getScheduledProjects,
    getOpenedProjects,
    getClosedProjects,
    fetchProjects,
    isLoading,
    error,
    clearError
  } = useCreatorStore();
  useEffect(() => {
    if (currentUser?.id) {
      fetchProjects(currentUser.id);
    }
  }, [currentUser?.id, fetchProjects]);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1e3);
    return () => clearInterval(timer);
  }, []);
  const allProjects = getAllProjects();
  const scheduledProjects = getScheduledProjects();
  const openedProjects = getOpenedProjects();
  const closedProjects = getClosedProjects();
  const sortedAllProjects = useMemo(() => {
    const getStartTime = (startDate) => {
      if (!startDate) return Number.NEGATIVE_INFINITY;
      const time = new Date(startDate).getTime();
      return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
    };
    return [...allProjects].sort((a, b) => getStartTime(b.startDate) - getStartTime(a.startDate));
  }, [allProjects]);
  const hasProjects = allProjects.length > 0;
  const handleCreateProject = () => {
    navigate({ to: "/creator/project/new" });
  };
  const getCurrentTabProjects = () => {
    switch (activeTab) {
      case "all":
        return sortedAllProjects;
      case "scheduled":
        return scheduledProjects;
      case "opened":
        return openedProjects;
      case "closed":
        return closedProjects;
    }
  };
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center min-h-[400px]", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-cyan-500 mx-auto mb-4" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Loading your projects..." })
    ] }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center min-h-[400px]", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-red-400 mb-4", children: error }),
      /* @__PURE__ */ jsx(Button, { onClick: () => {
        clearError();
        currentUser?.id && fetchProjects(currentUser.id);
      }, children: "Try Again" })
    ] }) });
  }
  if (!hasProjects) {
    return /* @__PURE__ */ jsx(EmptyDashboard, { onCreateProject: handleCreateProject });
  }
  return /* @__PURE__ */ jsxs("div", { className: "container max-w-7xl mx-auto py-8 px-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-8", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-foreground flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(LayoutDashboard, { className: "w-8 h-8 text-cyan-500" }),
          "My Projects"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-1", children: "Manage your projects, monitor progress, and assess explorers" })
      ] }),
      /* @__PURE__ */ jsxs(
        Button,
        {
          onClick: handleCreateProject,
          className: "bg-cyan-600 hover:bg-cyan-700 text-white",
          children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
            "New Project"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 mb-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-foreground", children: allProjects.length }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Total Projects" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-foreground", children: scheduledProjects.length }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Scheduled" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-foreground", children: openedProjects.length }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Opened" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-foreground", children: closedProjects.length }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Closed" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Tabs, { value: activeTab, onValueChange: (v) => setActiveTab(v), children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "mb-6", children: [
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "all", className: "gap-2", children: [
          /* @__PURE__ */ jsx(Layers, { className: "w-4 h-4" }),
          "All",
          allProjects.length > 0 && /* @__PURE__ */ jsx("span", { className: "ml-1 px-2 py-0.5 text-xs bg-slate-500/20 text-slate-400 rounded-full", children: allProjects.length })
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "scheduled", className: "gap-2", children: [
          /* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4" }),
          "Scheduled",
          scheduledProjects.length > 0 && /* @__PURE__ */ jsx("span", { className: "ml-1 px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full", children: scheduledProjects.length })
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "opened", className: "gap-2", children: [
          /* @__PURE__ */ jsx(FolderOpen, { className: "w-4 h-4" }),
          "Opened",
          openedProjects.length > 0 && /* @__PURE__ */ jsx("span", { className: "ml-1 px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-full", children: openedProjects.length })
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "closed", className: "gap-2", children: [
          /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4" }),
          "Closed",
          closedProjects.length > 0 && /* @__PURE__ */ jsx("span", { className: "ml-1 px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full", children: closedProjects.length })
        ] })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: activeTab, children: getCurrentTabProjects().length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-12 bg-muted/40 rounded-lg border border-border", children: /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
        activeTab === "all" && "No projects yet. Create a new project to get started.",
        activeTab === "scheduled" && "No scheduled projects. Projects with future start dates will appear here.",
        activeTab === "opened" && "No opened projects. Projects that have started will appear here.",
        activeTab === "closed" && "No closed projects yet."
      ] }) }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: getCurrentTabProjects().map((project) => /* @__PURE__ */ jsx(CreatorProjectCard, { project }, project.id)) }) })
    ] })
  ] });
}
function CreatorIndexPage() {
  return /* @__PURE__ */ jsx(CreatorDashboard, {});
}
export {
  CreatorIndexPage as component
};
