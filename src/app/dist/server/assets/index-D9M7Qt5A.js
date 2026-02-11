import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Library, Search, Loader2, BookOpen, GlobeLock, Globe, Trash2, Plus, Rocket, Clock, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format, addMinutes } from "date-fns";
import { u as useAuthStore, z as useCreatorStore, I as Input, B as Button, a as Badge, D as Dialog, n as DialogContent, o as DialogHeader, p as DialogTitle, E as DialogDescription, F as DialogFooter, Z as getLibraryTemplates, _ as unpublishTemplate, $ as publishTemplate, a0 as deleteProject, a1 as deployTemplate } from "./router-Bhor0jGk.js";
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
import "qrcode";
function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes} minutes`;
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
function CreatorLibrary() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { fetchProjects } = useCreatorStore();
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [publishingId, setPublishingId] = useState(null);
  const [deployTarget, setDeployTarget] = useState(null);
  const [deployStartDate, setDeployStartDate] = useState("");
  const [deployEndDate, setDeployEndDate] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  useEffect(() => {
    async function fetchTemplates() {
      if (!currentUser?.id) return;
      setIsLoading(true);
      try {
        const result = await getLibraryTemplates({ data: { creatorId: currentUser.id } });
        if (result.success) {
          setTemplates(result.templates || []);
        }
      } catch (error) {
        console.error("Failed to fetch templates:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTemplates();
  }, [currentUser?.id]);
  const filteredTemplates = templates.filter(
    (t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const templateTotalMinutes = useMemo(() => {
    if (!deployTarget?.sessions) return 0;
    return deployTarget.sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  }, [deployTarget]);
  const handleUseTemplate = (template) => {
    const now = /* @__PURE__ */ new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);
    const startStr = format(now, "yyyy-MM-dd'T'HH:mm");
    const totalMins = (template.sessions || []).reduce(
      (sum, s) => sum + (s.durationMinutes || 0),
      0
    );
    const end = addMinutes(now, totalMins || 60);
    const endStr = format(end, "yyyy-MM-dd'T'HH:mm");
    setDeployStartDate(startStr);
    setDeployEndDate(endStr);
    setDeployTarget(template);
  };
  const handleStartDateChange = (value) => {
    setDeployStartDate(value);
    if (value && templateTotalMinutes > 0) {
      const start = new Date(value);
      const end = addMinutes(start, templateTotalMinutes);
      setDeployEndDate(format(end, "yyyy-MM-dd'T'HH:mm"));
    }
  };
  const handleDeploy = async () => {
    if (!deployTarget || !currentUser?.id || !deployStartDate || !deployEndDate) return;
    setIsDeploying(true);
    try {
      const result = await deployTemplate({
        data: {
          templateId: deployTarget.id,
          creatorId: currentUser.id,
          startDate: new Date(deployStartDate).toISOString(),
          endDate: new Date(deployEndDate).toISOString()
        }
      });
      if (result.success && result.projectId) {
        toast.success("Project deployed from template!");
        setDeployTarget(null);
        await fetchProjects(currentUser.id);
        navigate({ to: "/creator/project/$projectId", params: { projectId: result.projectId } });
      } else {
        toast.error(result.error || "Failed to deploy template");
      }
    } catch (error) {
      console.error("Deploy template error:", error);
      toast.error("Failed to deploy template");
    } finally {
      setIsDeploying(false);
    }
  };
  const handleDeleteTemplate = async () => {
    if (!deleteTarget) return;
    try {
      const result = await deleteProject({ data: { projectId: deleteTarget.id } });
      if (result.success) {
        setTemplates((prev) => prev.filter((t) => t.id !== deleteTarget.id));
        toast.success("Template removed from library");
      } else {
        toast.error("Failed to remove template");
      }
    } catch (error) {
      console.error("Failed to delete template:", error);
      toast.error("Failed to remove template");
    } finally {
      setDeleteTarget(null);
    }
  };
  const handleTogglePublish = async (template) => {
    if (!currentUser?.id) return;
    setPublishingId(template.id);
    try {
      const isCurrentlyPublished = template.isPublished;
      const result = isCurrentlyPublished ? await unpublishTemplate({ data: { templateId: template.id, creatorId: currentUser.id } }) : await publishTemplate({ data: { templateId: template.id, creatorId: currentUser.id } });
      if (result.success) {
        setTemplates((prev) => prev.map(
          (t) => t.id === template.id ? { ...t, isPublished: !isCurrentlyPublished } : t
        ));
        toast.success(isCurrentlyPublished ? "Template unpublished from store" : "Template published to store!");
      } else {
        toast.error(result.error || "Failed to update publish status");
      }
    } catch (error) {
      console.error("Toggle publish error:", error);
      toast.error("Failed to update publish status");
    } finally {
      setPublishingId(null);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "container max-w-7xl mx-auto py-8 px-4", children: [
    /* @__PURE__ */ jsx("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-foreground flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(Library, { className: "w-8 h-8 text-cyan-500" }),
        "Project Library"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-1", children: "Manage your project templates and reuse proven structures" })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "relative mb-8", children: [
      /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          placeholder: "Search templates...",
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value),
          className: "pl-10 h-12 bg-card border-border"
        }
      )
    ] }),
    isLoading ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-20", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "w-10 h-10 animate-spin text-cyan-500 mb-4" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Loading templates..." })
    ] }) : filteredTemplates.length === 0 ? /* @__PURE__ */ jsxs(Card, { className: "border-dashed py-20 flex flex-col items-center justify-center text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(BookOpen, { className: "w-8 h-8 text-muted-foreground" }) }),
      /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: "No templates found" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground max-w-sm mb-6", children: searchQuery ? `No templates matching "${searchQuery}"` : "You haven't added any templates yet. Click the library icon on any project card to save it as a template." }),
      !searchQuery && /* @__PURE__ */ jsx(Button, { onClick: () => navigate({ to: "/creator" }), variant: "outline", children: "Go to Dashboard" })
    ] }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredTemplates.map((template) => /* @__PURE__ */ jsxs(Card, { className: "bg-card border-border hover:border-cyan-500/50 transition-all group", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "bg-cyan-500/10 text-cyan-500 border-none", children: "Template" }),
            template.isPublished && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "bg-violet-500/10 text-violet-500 border-none", children: "Published" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
              template.sessionCount,
              " sessions"
            ] }),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                onClick: () => handleTogglePublish(template),
                disabled: publishingId === template.id,
                className: `h-7 w-7 ${template.isPublished ? "text-violet-500 hover:text-violet-400 hover:bg-violet-500/10" : "text-muted-foreground hover:text-violet-500 hover:bg-violet-500/10"}`,
                title: template.isPublished ? "Unpublish from store" : "Publish to store",
                children: publishingId === template.id ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : template.isPublished ? /* @__PURE__ */ jsx(GlobeLock, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(Globe, { className: "w-4 h-4" })
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                onClick: () => setDeleteTarget({ id: template.id, title: template.title }),
                className: "h-7 w-7 text-muted-foreground hover:text-red-400 hover:bg-red-500/10",
                title: "Remove template",
                children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "h3",
          {
            className: "text-lg font-semibold text-foreground line-clamp-1 group-hover:text-cyan-500 transition-colors cursor-pointer",
            onClick: () => navigate({ to: "/creator/library/$id", params: { id: template.id } }),
            children: template.title
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground line-clamp-2 mt-1", children: template.description || template.drivingQuestion })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mt-4", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            className: "flex-1 bg-cyan-600 hover:bg-cyan-700 text-white",
            onClick: () => handleUseTemplate(template),
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
              "Use Template"
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "outline",
            className: "flex-none",
            onClick: () => navigate({ to: "/creator/library/$id", params: { id: template.id } }),
            children: "Edit"
          }
        )
      ] }) })
    ] }, template.id)) }),
    /* @__PURE__ */ jsx(Dialog, { open: !!deleteTarget, onOpenChange: (open) => !open && setDeleteTarget(null), children: /* @__PURE__ */ jsxs(DialogContent, { className: "bg-card border-border", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Remove Template" }),
        /* @__PURE__ */ jsxs(DialogDescription, { children: [
          'Are you sure you want to remove "',
          deleteTarget?.title,
          '" from your library? This action cannot be undone.'
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setDeleteTarget(null), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { variant: "destructive", onClick: handleDeleteTemplate, children: "Remove" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: !!deployTarget, onOpenChange: (open) => {
      if (!open) setDeployTarget(null);
    }, children: /* @__PURE__ */ jsxs(DialogContent, { className: "bg-card border-border sm:max-w-md", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Rocket, { className: "w-5 h-5 text-cyan-500" }),
          "Deploy Project"
        ] }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "Set the start and end time to create a live project from this template." })
      ] }),
      deployTarget && /* @__PURE__ */ jsxs("div", { className: "space-y-5 py-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-3 bg-muted/40 rounded-lg border border-border", children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium text-foreground text-sm", children: deployTarget.title }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mt-1.5 text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxs("span", { children: [
              deployTarget.sessionCount,
              " sessions"
            ] }),
            templateTotalMinutes > 0 && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
              formatDuration(templateTotalMinutes)
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "w-3.5 h-3.5 text-muted-foreground" }),
            "Start Date & Time"
          ] }),
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "datetime-local",
              value: deployStartDate,
              onChange: (e) => handleStartDateChange(e.target.value),
              className: "bg-background border-border"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "w-3.5 h-3.5 text-muted-foreground" }),
            "End Date & Time"
          ] }),
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "datetime-local",
              value: deployEndDate,
              min: deployStartDate,
              onChange: (e) => setDeployEndDate(e.target.value),
              className: "bg-background border-border"
            }
          )
        ] }),
        deployStartDate && deployEndDate && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-3 py-2.5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/20", children: [
          /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4 text-cyan-500 shrink-0" }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-foreground", children: formatDuration(
              Math.max(0, Math.round(
                (new Date(deployEndDate).getTime() - new Date(deployStartDate).getTime()) / 6e4
              ))
            ) }),
            /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground ml-2", children: "total project duration" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setDeployTarget(null), disabled: isDeploying, children: "Cancel" }),
        /* @__PURE__ */ jsx(
          Button,
          {
            className: "bg-cyan-600 hover:bg-cyan-700 text-white",
            onClick: handleDeploy,
            disabled: isDeploying || !deployStartDate || !deployEndDate,
            children: isDeploying ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
              "Deploying..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Rocket, { className: "w-4 h-4 mr-2" }),
              "Deploy Project"
            ] })
          }
        )
      ] })
    ] }) })
  ] });
}
function CreatorLibraryPage() {
  return /* @__PURE__ */ jsx(CreatorLibrary, {});
}
export {
  CreatorLibraryPage as component
};
