import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { u as useAuthStore, B as Button, d as cn, I as Input, S as ScrollArea, ak as getSystemSettings, al as aiListModels, am as updateSystemSetting } from "./router-Bhor0jGk.js";
import { S as SETTING_KEYS } from "./settings-CebgkGhm.js";
import { C as Card, b as CardHeader, c as CardTitle, d as CardDescription, a as CardContent } from "./card-CuhZmkUZ.js";
import { L as Label } from "./label-BGuIo3xV.js";
import { Loader2, AlertCircle, Settings, Bot, RefreshCw, Search, Check, Save } from "lucide-react";
import { toast } from "sonner";
import "@tanstack/react-router";
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
import "drizzle-orm/sqlite-core";
function AdminSettings() {
  const {
    currentUser
  } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [aiModel, setAiModel] = useState("");
  const [savedModel, setSavedModel] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [models, setModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [modelSearch, setModelSearch] = useState("");
  const fetchModels = async () => {
    setLoadingModels(true);
    try {
      const result = await aiListModels();
      if (result.success) {
        const sortedModels = (result.models || []).sort((a, b) => a.name.localeCompare(b.name));
        setModels(sortedModels);
      } else {
        console.error("Failed to fetch models:", result.error);
      }
    } catch (err) {
      console.error("Error fetching models:", err);
    } finally {
      setLoadingModels(false);
    }
  };
  useEffect(() => {
    async function loadSettings() {
      try {
        const result = await getSystemSettings();
        if (result.success) {
          const modelSetting = result.settings.find((s) => s.key === SETTING_KEYS.AI_MODEL);
          if (modelSetting) {
            setAiModel(modelSetting.value);
            setSavedModel(modelSetting.value);
            setLastUpdated(modelSetting.updatedAt);
          }
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
    fetchModels();
  }, []);
  const handleSave = async () => {
    setSaving(true);
    try {
      if (!aiModel) {
        toast.error("Please select an AI model");
        setSaving(false);
        return;
      }
      const result = await updateSystemSetting({
        data: {
          key: SETTING_KEYS.AI_MODEL,
          value: aiModel,
          updatedBy: currentUser?.id
        }
      });
      if (result.success) {
        setSavedModel(aiModel);
        setLastUpdated(result.setting.updatedAt);
        toast.success("Settings saved successfully");
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };
  const filteredModels = models.filter((model) => model.id.toLowerCase().includes(modelSearch.toLowerCase()) || model.name.toLowerCase().includes(modelSearch.toLowerCase()));
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64 text-muted-foreground", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-cyan-500" }) });
  }
  if (error) {
    return /* @__PURE__ */ jsxs("div", { className: "bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center", children: [
      /* @__PURE__ */ jsx(AlertCircle, { className: "w-8 h-8 text-destructive mx-auto mb-2" }),
      /* @__PURE__ */ jsx("p", { className: "text-destructive", children: error })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-foreground flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(Settings, { className: "w-8 h-8 text-cyan-500" }),
        "System Settings"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-1", children: "Configure application-wide settings" })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "bg-card border-border", children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "text-foreground flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Bot, { className: "w-5 h-5 text-cyan-500" }),
          "AI Model Configuration"
        ] }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Select the AI model used for generating content, chat responses, and analysis across the platform. Models are fetched from OpenRouter API." })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-6", children: [
        /* @__PURE__ */ jsx("div", { className: "p-4 bg-muted/30 rounded-lg border border-border", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Current Model" }),
            /* @__PURE__ */ jsx("p", { className: "font-mono text-foreground text-lg", children: savedModel || "(not set)" })
          ] }),
          lastUpdated && /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Last Updated" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-foreground", children: new Date(lastUpdated).toLocaleString() })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-foreground", children: "Select a Model" }),
            /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: fetchModels, disabled: loadingModels, className: "text-muted-foreground hover:text-foreground", children: [
              /* @__PURE__ */ jsx(RefreshCw, { className: cn("w-4 h-4 mr-1", loadingModels && "animate-spin") }),
              "Refresh"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
            /* @__PURE__ */ jsx(Input, { value: modelSearch, onChange: (e) => setModelSearch(e.target.value), placeholder: "Search models...", className: "pl-9 bg-background border-border" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "border border-border rounded-lg", children: loadingModels ? /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center py-12", children: [
          /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-cyan-500" }),
          /* @__PURE__ */ jsx("span", { className: "ml-2 text-muted-foreground", children: "Loading models..." })
        ] }) : filteredModels.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-12 text-muted-foreground", children: modelSearch ? "No models match your search" : "No models available" }) : /* @__PURE__ */ jsx(ScrollArea, { className: "h-[400px]", children: /* @__PURE__ */ jsx("div", { className: "divide-y divide-border", children: filteredModels.map((model) => /* @__PURE__ */ jsx("button", { onClick: () => setAiModel(model.id), className: cn("w-full p-4 text-left transition-colors hover:bg-muted/50", aiModel === model.id && "bg-cyan-600/20"), children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground truncate", children: model.name }),
              aiModel === model.id && /* @__PURE__ */ jsx(Check, { className: "w-4 h-4 text-cyan-500 shrink-0" })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground font-mono block truncate", children: model.id })
          ] }),
          model.context_length && /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground ml-4 shrink-0", children: [
            (model.context_length / 1e3).toFixed(0),
            "k ctx"
          ] })
        ] }) }, model.id)) }) }) }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-foreground", children: "Or enter a custom model ID" }),
          /* @__PURE__ */ jsx(Input, { value: aiModel, onChange: (e) => setAiModel(e.target.value), placeholder: "e.g., google/gemini-2.0-flash-001", className: "bg-background border-border font-mono" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex justify-end pt-4 border-t border-border", children: /* @__PURE__ */ jsx(Button, { onClick: handleSave, disabled: saving, className: "bg-cyan-600 hover:bg-cyan-700 text-white", children: saving ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
          "Saving..."
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Save, { className: "w-4 h-4 mr-2" }),
          "Save Settings"
        ] }) }) })
      ] })
    ] })
  ] });
}
export {
  AdminSettings as component
};
