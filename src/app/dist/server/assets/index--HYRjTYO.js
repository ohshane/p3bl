import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Store, Search, Loader2, PackageOpen, User, Library } from "lucide-react";
import { toast } from "sonner";
import { u as useAuthStore, I as Input, B as Button, a as Badge, X as getStoreTemplates, Y as cloneStoreTemplate } from "./router-Bhor0jGk.js";
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
function CreatorStore() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cloningId, setCloningId] = useState(null);
  useEffect(() => {
    async function fetchStoreTemplates() {
      if (!currentUser?.id) return;
      setIsLoading(true);
      try {
        const result = await getStoreTemplates({
          data: { creatorId: currentUser.id }
        });
        if (result.success) {
          setTemplates(result.templates || []);
        }
      } catch (error) {
        console.error("Failed to fetch store templates:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStoreTemplates();
  }, [currentUser?.id]);
  const filteredTemplates = templates.filter(
    (t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.description?.toLowerCase().includes(searchQuery.toLowerCase()) || t.creatorName?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const handleCloneToLibrary = async (template) => {
    if (!currentUser?.id) return;
    setCloningId(template.id);
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
      setCloningId(null);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "container max-w-7xl mx-auto py-8 px-4", children: [
    /* @__PURE__ */ jsx("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-foreground flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(Store, { className: "w-8 h-8 text-violet-500" }),
        "Project Store"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-1", children: "Browse and clone project templates shared by creators" })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "relative mb-8", children: [
      /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          placeholder: "Search templates by title, description, or creator...",
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value),
          className: "pl-10 h-12 bg-card border-border"
        }
      )
    ] }),
    isLoading ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-20", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "w-10 h-10 animate-spin text-violet-500 mb-4" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Loading store templates..." })
    ] }) : filteredTemplates.length === 0 ? /* @__PURE__ */ jsxs(Card, { className: "border-dashed py-20 flex flex-col items-center justify-center text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(PackageOpen, { className: "w-8 h-8 text-muted-foreground" }) }),
      /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: "No templates in the store" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground max-w-sm mb-6", children: searchQuery ? `No templates matching "${searchQuery}"` : "No creators have published templates yet. You can publish your own from the library!" }),
      !searchQuery && /* @__PURE__ */ jsx(
        Button,
        {
          onClick: () => navigate({ to: "/creator/library" }),
          variant: "outline",
          children: "Go to Library"
        }
      )
    ] }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredTemplates.map((template) => /* @__PURE__ */ jsxs(
      Card,
      {
        className: "bg-card border-border hover:border-violet-500/50 transition-all group",
        children: [
          /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(
                  Badge,
                  {
                    variant: "secondary",
                    className: "bg-violet-500/10 text-violet-500 border-none",
                    children: "Shared Template"
                  }
                ),
                template.isOwn && /* @__PURE__ */ jsx(
                  Badge,
                  {
                    variant: "secondary",
                    className: "bg-cyan-500/10 text-cyan-500 border-none",
                    children: "Yours"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                template.sessionCount,
                " sessions"
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "h3",
              {
                className: "text-lg font-semibold text-foreground line-clamp-1 group-hover:text-violet-500 transition-colors cursor-pointer",
                onClick: () => navigate({
                  to: "/creator/store/$id",
                  params: { id: template.id }
                }),
                children: template.title
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground line-clamp-2 mt-1", children: template.description || template.drivingQuestion })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground mb-4", children: [
              /* @__PURE__ */ jsx(User, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsxs("span", { children: [
                "by ",
                template.creatorName,
                template.isOwn ? " (you)" : ""
              ] })
            ] }),
            template.isOwn ? /* @__PURE__ */ jsxs(
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
                onClick: () => handleCloneToLibrary(template),
                disabled: cloningId === template.id,
                children: cloningId === template.id ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
                  "Cloning..."
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Library, { className: "w-4 h-4 mr-2" }),
                  "Add to Library"
                ] })
              }
            )
          ] })
        ]
      },
      template.id
    )) })
  ] });
}
function CreatorStorePage() {
  return /* @__PURE__ */ jsx(CreatorStore, {});
}
export {
  CreatorStorePage as component
};
