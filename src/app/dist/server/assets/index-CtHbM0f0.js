import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { d as cn, z as useCreatorStore, I as Input, B as Button, aB as Textarea, aw as aiChatCompletion, ap as isValidDate, s as safeFormatDate, u as useAuthStore, aC as updateUser, T as TooltipProvider, v as Tooltip, w as TooltipTrigger, x as TooltipContent, a as Badge, D as Dialog, n as DialogContent, o as DialogHeader, p as DialogTitle, E as DialogDescription, F as DialogFooter } from "./router-Bhor0jGk.js";
import { g as getConfiguredAIModel } from "./ai-config-B-TTNnwW.js";
import { FileText, Wand2, Zap, Upload, X, Loader2, Sparkles, User, Users, Minus, Plus, Calendar, Clock, GripVertical, Trash2, ChevronUp, ChevronDown, Ban, Info, ListChecks, CheckCircle, AlertCircle, FolderPlus, Settings, Rocket, ArrowLeft, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { L as Label } from "./label-BGuIo3xV.js";
import { Slider as Slider$1 } from "radix-ui";
import { addMinutes, differenceInMinutes, format } from "date-fns";
import "./artifacts-V6YAL9mY.js";
import "next-themes";
import "zustand";
import "zustand/middleware";
import "./auth-B6e831Uo.js";
import "zod";
import "../server.js";
import "node:async_hooks";
import "@tanstack/react-router/ssr/server";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "qrcode";
import "./settings-CebgkGhm.js";
import "drizzle-orm/sqlite-core";
const Slider = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxs(
  Slider$1.Root,
  {
    ref,
    className: cn(
      "relative flex w-full touch-none select-none items-center",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx(Slider$1.Track, { className: "relative h-2 w-full grow overflow-hidden rounded-full bg-secondary", children: /* @__PURE__ */ jsx(Slider$1.Range, { className: "absolute h-full bg-primary" }) }),
      /* @__PURE__ */ jsx(Slider$1.Thumb, { className: "block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer" })
    ]
  }
));
Slider.displayName = Slider$1.Root.displayName;
const WIZARD_MODES = [
  {
    id: "manual",
    icon: FileText,
    title: "Manual Builder",
    description: "Create your project from scratch with full control over every detail.",
    recommended: false
  },
  {
    id: "keyword",
    icon: Wand2,
    title: "Keyword Generator",
    description: "Enter keywords and let AI generate a project structure for you.",
    recommended: true
  },
  {
    id: "quickstart",
    icon: Zap,
    title: "Quick Start",
    description: "Configure all settings at once with demo defaults. Perfect for testing.",
    recommended: false,
    special: true
  },
  {
    id: "document",
    icon: Upload,
    title: "Document-Driven",
    description: "Upload your syllabus or lecture materials and AI will auto-generate a project.",
    recommended: false
  }
];
function WizardModeSelector() {
  const { wizardState, setWizardMode } = useCreatorStore();
  const { mode } = wizardState;
  const handleModeSelect = (modeId) => {
    setWizardMode(modeId);
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-foreground mb-2", children: "How would you like to create your project?" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Choose a creation mode that fits your workflow" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-4", children: WIZARD_MODES.map((option) => {
      const Icon = option.icon;
      const isSelected = mode === option.id;
      return /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => handleModeSelect(option.id),
          className: cn(
            "relative p-6 rounded-xl border-2 text-left transition-all",
            isSelected ? option.id === "quickstart" ? "border-purple-500 bg-purple-500/10" : "border-cyan-500 bg-cyan-500/10" : "border-border bg-card hover:border-border/70"
          ),
          children: [
            option.recommended && /* @__PURE__ */ jsx("span", { className: "absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-cyan-600 text-white text-xs rounded-full", children: "Recommended" }),
            option.id === "quickstart" && /* @__PURE__ */ jsx("span", { className: "absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full", children: "Fastest" }),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center mb-4",
                  isSelected ? option.id === "quickstart" ? "bg-purple-500/20 text-purple-500" : "bg-cyan-500/20 text-cyan-500" : "bg-muted text-muted-foreground"
                ),
                children: /* @__PURE__ */ jsx(Icon, { className: "w-6 h-6" })
              }
            ),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-foreground mb-2", children: option.title }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: option.description }),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: cn(
                  "absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  isSelected ? option.id === "quickstart" ? "border-purple-500 bg-purple-500" : "border-cyan-500 bg-cyan-500" : "border-border"
                ),
                children: isSelected && /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-white" })
              }
            )
          ]
        },
        option.id
      );
    }) })
  ] });
}
const PROJECT_GENERATION_PROMPT = `You are an expert educational project designer for Peabee.
Your task is to generate a compelling project title, background context, and driving question based on keywords provided by educators.

Guidelines:
- Title: Create an engaging, concise project title (5-10 words) that captures the essence of the learning experience
- Background: Write 2-3 sentences providing context about why this objective matters and what will be explored
- Driving Question: Craft an open-ended, thought-provoking question that will guide inquiry throughout the project
- IMPORTANT: Do NOT use the word "student" or "students" anywhere in the output. Use "learner", "participant", "team", or rephrase to avoid addressing anyone directly.`;
const PROJECT_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Engaging project title (5-10 words)" },
    background: { type: "string", description: "2-3 sentences of context" },
    drivingQuestion: { type: "string", description: "Open-ended guiding question" }
  },
  required: ["title", "background", "drivingQuestion"],
  additionalProperties: false
};
async function generateProjectFromKeywords(keywords) {
  let aiModel;
  try {
    aiModel = await getConfiguredAIModel();
  } catch (error) {
    console.error("Error getting AI model, using default:", error);
    aiModel = "openrouter/auto";
  }
  const result = await aiChatCompletion({
    data: {
      model: aiModel,
      messages: [
        { role: "system", content: PROJECT_GENERATION_PROMPT },
        { role: "user", content: `Generate a project based on these keywords: ${keywords}` }
      ],
      max_tokens: 500,
      temperature: 0.8,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "project_response",
          strict: true,
          schema: PROJECT_RESPONSE_SCHEMA
        }
      }
    }
  });
  if (!result.success) {
    throw new Error(result.error || "AI API error");
  }
  const content = result.content;
  if (!content) {
    throw new Error("No content in API response");
  }
  try {
    let jsonContent = content.trim();
    const codeBlockMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonContent = codeBlockMatch[1].trim();
    }
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }
    const parsed = JSON.parse(jsonContent);
    return {
      title: parsed.title || "",
      background: parsed.background || "",
      drivingQuestion: parsed.drivingQuestion || ""
    };
  } catch (parseError) {
    console.error("Failed to parse JSON response:", content, parseError);
    throw new Error("Failed to parse AI response. Please try again.");
  }
}
function ContentSetup() {
  const { wizardState, updateBasicInfo } = useCreatorStore();
  const { mode, basicInfo, uploadedFiles, ragProcessingStatus, validationErrors } = wizardState;
  const [keywords, setKeywords] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (files) {
      console.log("Files uploaded:", files);
    }
  };
  const handleGenerateFromKeywords = async () => {
    if (!keywords.trim()) return;
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const generated = await generateProjectFromKeywords(keywords);
      updateBasicInfo(generated);
    } catch (error) {
      console.error("Generation error:", error);
      setGenerationError(
        error instanceof Error ? error.message : "Failed to generate project. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-foreground mb-2", children: "Content Analysis & Setup" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Define your project's foundation" })
    ] }),
    mode === "document" && /* @__PURE__ */ jsxs("div", { className: "p-6 border-2 border-dashed border-border rounded-xl bg-muted/20", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx(Upload, { className: "w-12 h-12 mx-auto text-muted-foreground mb-4" }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-foreground mb-2", children: "Upload Course Materials" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "Drag and drop or click to upload syllabus, lecture notes, or assignments (PDF, DOCX, PPTX)" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            type: "file",
            accept: ".pdf,.docx,.pptx,.doc,.ppt",
            multiple: true,
            onChange: handleFileUpload,
            className: "hidden",
            id: "file-upload"
          }
        ),
        /* @__PURE__ */ jsx("label", { htmlFor: "file-upload", children: /* @__PURE__ */ jsx(Button, { variant: "outline", asChild: true, children: /* @__PURE__ */ jsxs("span", { className: "cursor-pointer", children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 mr-2" }),
          "Select Files"
        ] }) }) })
      ] }),
      uploadedFiles.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-2", children: uploadedFiles.map((file) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "flex items-center justify-between p-2 bg-muted rounded",
          children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm text-foreground", children: file.name }),
            /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6", children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }) })
          ]
        },
        file.id
      )) }),
      ragProcessingStatus === "processing" && /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center justify-center gap-2 text-cyan-500", children: [
        /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }),
        "Processing documents with AI..."
      ] })
    ] }),
    mode === "keyword" && /* @__PURE__ */ jsxs("div", { className: "p-6 bg-card rounded-xl border border-border", children: [
      /* @__PURE__ */ jsx(Label, { className: "text-foreground mb-2 block", children: "Enter Keywords" }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx(
          Input,
          {
            value: keywords,
            onChange: (e) => setKeywords(e.target.value),
            placeholder: "e.g., machine learning, data science, python",
            className: "bg-background border-border"
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            onClick: handleGenerateFromKeywords,
            disabled: isGenerating || !keywords.trim(),
            className: "bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white",
            children: isGenerating ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4 mr-2" }),
              "Generate"
            ] })
          }
        )
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-2", children: "Enter comma-separated keywords related to your project objective" }),
      generationError && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-400 mt-2", children: generationError })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs(Label, { htmlFor: "title", className: "text-foreground", children: [
          "Project Title ",
          /* @__PURE__ */ jsx("span", { className: "text-red-400", children: "*" })
        ] }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "title",
            value: basicInfo.title,
            onChange: (e) => updateBasicInfo({ title: e.target.value }),
            placeholder: "Enter a descriptive project title",
            className: `mt-1 bg-background border-border ${validationErrors.title ? "border-red-500" : ""}`
          }
        ),
        validationErrors.title && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-400 mt-1", children: validationErrors.title })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "background", className: "text-foreground", children: "Background" }),
        /* @__PURE__ */ jsx(
          Textarea,
          {
            id: "background",
            value: basicInfo.background,
            onChange: (e) => updateBasicInfo({ background: e.target.value }),
            placeholder: "Provide context and background for the project",
            className: "mt-1 bg-background border-border min-h-[100px]"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs(Label, { htmlFor: "drivingQuestion", className: "text-foreground", children: [
          "Driving Question ",
          /* @__PURE__ */ jsx("span", { className: "text-red-400", children: "*" })
        ] }),
        /* @__PURE__ */ jsx(
          Textarea,
          {
            id: "drivingQuestion",
            value: basicInfo.drivingQuestion,
            onChange: (e) => updateBasicInfo({ drivingQuestion: e.target.value }),
            placeholder: "What is the central question students will explore?",
            className: `mt-1 bg-background border-border ${validationErrors.drivingQuestion ? "border-red-500" : ""}`
          }
        ),
        validationErrors.drivingQuestion && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-400 mt-1", children: validationErrors.drivingQuestion }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "A good driving question is open-ended, engaging, and connects to real-world problems" })
      ] })
    ] })
  ] });
}
function TeamSetup() {
  const { wizardState, updateParticipantParams } = useCreatorStore();
  const { participantParams, validationErrors } = wizardState;
  const minTeamSize = 2;
  const maxTeamSize = 10;
  const clampTeamSize = (value) => Math.min(maxTeamSize, Math.max(minTeamSize, value));
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-foreground mb-2", children: "Team Formation" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Choose how explorers will work on this project" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => updateParticipantParams({ projectMode: "personal" }),
          className: cn(
            "p-6 rounded-xl border-2 text-left transition-all",
            participantParams.projectMode === "personal" ? "border-cyan-500 bg-cyan-500/10" : "border-border bg-card hover:border-border/70"
          ),
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center",
                    participantParams.projectMode === "personal" ? "bg-cyan-500/20 text-cyan-500" : "bg-muted text-muted-foreground"
                  ),
                  children: /* @__PURE__ */ jsx(User, { className: "w-6 h-6" })
                }
              ),
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-foreground", children: "Personal" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Each explorer works individually on their own project." })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => updateParticipantParams({ projectMode: "team" }),
          className: cn(
            "p-6 rounded-xl border-2 text-left transition-all",
            participantParams.projectMode === "team" ? "border-cyan-500 bg-cyan-500/10" : "border-border bg-card hover:border-border/70"
          ),
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center",
                    participantParams.projectMode === "team" ? "bg-cyan-500/20 text-cyan-500" : "bg-muted text-muted-foreground"
                  ),
                  children: /* @__PURE__ */ jsx(Users, { className: "w-6 h-6" })
                }
              ),
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-foreground", children: "Team" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Explorers collaborate together in teams." })
          ]
        }
      )
    ] }),
    participantParams.projectMode === "team" && /* @__PURE__ */ jsxs("div", { className: "py-8 px-6 bg-card rounded-xl border border-border", children: [
      /* @__PURE__ */ jsxs("label", { className: "text-sm font-medium text-foreground mb-4 block text-center", children: [
        "Team Size ",
        /* @__PURE__ */ jsx("span", { className: "text-red-400", children: "*" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-4", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            size: "icon-lg",
            onClick: () => updateParticipantParams({
              teamSize: clampTeamSize(participantParams.teamSize - 1)
            }),
            disabled: participantParams.teamSize <= minTeamSize,
            className: "h-14 w-14",
            children: /* @__PURE__ */ jsx(Minus, { className: "w-5 h-5" })
          }
        ),
        /* @__PURE__ */ jsx(
          Input,
          {
            type: "number",
            min: minTeamSize,
            max: maxTeamSize,
            value: participantParams.teamSize,
            onChange: (e) => updateParticipantParams({
              teamSize: clampTeamSize(parseInt(e.target.value, 10) || minTeamSize)
            }),
            className: cn(
              "bg-background border-border w-32 h-14 text-center text-2xl font-semibold",
              validationErrors.teamSize && "border-red-500"
            )
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            size: "icon-lg",
            onClick: () => updateParticipantParams({
              teamSize: clampTeamSize(participantParams.teamSize + 1)
            }),
            disabled: participantParams.teamSize >= maxTeamSize,
            className: "h-14 w-14",
            children: /* @__PURE__ */ jsx(Plus, { className: "w-5 h-5" })
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-base", children: "members per team" })
      ] }),
      validationErrors.teamSize && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-400 mt-3 text-center", children: validationErrors.teamSize })
    ] })
  ] });
}
const DURATION_PRESETS = [
  { label: "5min", minutes: 5 },
  { label: "10min", minutes: 10 },
  { label: "15min", minutes: 15 },
  { label: "30min", minutes: 30 },
  { label: "1hour", minutes: 60 },
  { label: "2hours", minutes: 120 },
  { label: "4hours", minutes: 240 },
  { label: "8hours", minutes: 480 },
  { label: "1day", minutes: 1440 },
  { label: "2days", minutes: 2880 },
  { label: "1week", minutes: 10080 },
  { label: "2weeks", minutes: 20160 },
  { label: "4weeks", minutes: 40320 },
  { label: "8weeks", minutes: 80640 },
  { label: "16weeks", minutes: 161280 }
];
function findClosestPresetIndex(minutes) {
  let closestIndex = 0;
  let closestDiff = Math.abs(DURATION_PRESETS[0].minutes - minutes);
  for (let i = 1; i < DURATION_PRESETS.length; i++) {
    const diff = Math.abs(DURATION_PRESETS[i].minutes - minutes);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIndex = i;
    }
  }
  return closestIndex;
}
function formatDuration$2(minutes) {
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
function TimelineSetup() {
  const { wizardState, setTimeline } = useCreatorStore();
  const { timeline, validationErrors } = wizardState;
  useEffect(() => {
    if (!isValidDate(timeline.startDate) || !isValidDate(timeline.endDate)) {
      const now = /* @__PURE__ */ new Date();
      now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);
      const start = addMinutes(now, 10);
      const end = addMinutes(start, 5);
      setTimeline({
        startDate: start.toISOString(),
        endDate: end.toISOString()
      });
    }
  }, [timeline.startDate, timeline.endDate, setTimeline]);
  const startDateTime = useMemo(() => {
    if (isValidDate(timeline.startDate)) {
      return new Date(timeline.startDate);
    }
    const now = /* @__PURE__ */ new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);
    return addMinutes(now, 10);
  }, [timeline.startDate]);
  const endDateTime = useMemo(() => {
    if (isValidDate(timeline.endDate)) {
      return new Date(timeline.endDate);
    }
    return addMinutes(startDateTime, 5);
  }, [timeline.endDate, startDateTime]);
  const durationMinutes = useMemo(() => {
    return differenceInMinutes(endDateTime, startDateTime);
  }, [startDateTime, endDateTime]);
  const [sliderValue, setSliderValue] = useState(() => findClosestPresetIndex(durationMinutes));
  const handleSliderChange = (value) => {
    const presetIndex = value[0];
    setSliderValue(presetIndex);
    const preset = DURATION_PRESETS[presetIndex];
    const newEndDate = addMinutes(startDateTime, preset.minutes);
    setTimeline({
      startDate: startDateTime.toISOString(),
      endDate: newEndDate.toISOString()
    });
  };
  const handleStartDateChange = (dateStr) => {
    if (!dateStr) return;
    const [date, time] = [
      dateStr,
      format(startDateTime, "HH:mm")
    ];
    const newStart = /* @__PURE__ */ new Date(`${date}T${time}`);
    const newEnd = addMinutes(newStart, durationMinutes);
    setTimeline({
      startDate: newStart.toISOString(),
      endDate: newEnd.toISOString()
    });
  };
  const handleStartTimeChange = (timeStr) => {
    if (!timeStr) return;
    const dateStr = format(startDateTime, "yyyy-MM-dd");
    const newStart = /* @__PURE__ */ new Date(`${dateStr}T${timeStr}`);
    const newEnd = addMinutes(newStart, durationMinutes);
    setTimeline({
      startDate: newStart.toISOString(),
      endDate: newEnd.toISOString()
    });
  };
  const handleEndDateChange = (dateStr) => {
    if (!dateStr) return;
    const timeStr = format(endDateTime, "HH:mm");
    const newEnd = /* @__PURE__ */ new Date(`${dateStr}T${timeStr}`);
    setTimeline({
      startDate: startDateTime.toISOString(),
      endDate: newEnd.toISOString()
    });
    const newDuration = differenceInMinutes(newEnd, startDateTime);
    setSliderValue(findClosestPresetIndex(newDuration));
  };
  const handleEndTimeChange = (timeStr) => {
    if (!timeStr) return;
    const dateStr = format(endDateTime, "yyyy-MM-dd");
    const newEnd = /* @__PURE__ */ new Date(`${dateStr}T${timeStr}`);
    setTimeline({
      startDate: startDateTime.toISOString(),
      endDate: newEnd.toISOString()
    });
    const newDuration = differenceInMinutes(newEnd, startDateTime);
    setSliderValue(findClosestPresetIndex(newDuration));
  };
  const applyPreset = (presetIndex) => {
    setSliderValue(presetIndex);
    const preset = DURATION_PRESETS[presetIndex];
    const newEndDate = addMinutes(startDateTime, preset.minutes);
    setTimeline({
      startDate: startDateTime.toISOString(),
      endDate: newEndDate.toISOString()
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-foreground mb-2", children: "Project Duration" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Set the start and end dates with times for your project" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-4 bg-card rounded-xl border border-border", children: [
      /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-foreground mb-3 block", children: "Quick Duration Selector" }),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "grid gap-1",
          style: { gridTemplateColumns: `repeat(${DURATION_PRESETS.length}, 1fr)` },
          children: DURATION_PRESETS.map((preset, index) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => applyPreset(index),
              className: cn(
                "py-1.5 rounded text-xs font-medium text-center transition-all",
                sliderValue === index ? "bg-cyan-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              ),
              children: preset.label
            },
            preset.label
          ))
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "mt-3 px-1", children: /* @__PURE__ */ jsx(
        Slider,
        {
          value: [sliderValue],
          onValueChange: handleSliderChange,
          max: DURATION_PRESETS.length - 1,
          step: 1,
          className: "w-full"
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-4 bg-muted/40 rounded-xl border border-border", children: [
        /* @__PURE__ */ jsxs("label", { className: "text-sm font-medium text-foreground mb-3 block", children: [
          /* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4 inline mr-2" }),
          "Start Date & Time ",
          /* @__PURE__ */ jsx("span", { className: "text-red-400", children: "*" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground mb-1 block", children: "Date" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "date",
                value: format(startDateTime, "yyyy-MM-dd"),
                onChange: (e) => handleStartDateChange(e.target.value),
                className: cn(
                  "bg-background border-border",
                  validationErrors.startDate && "border-red-500"
                )
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground mb-1 block", children: "Time" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "time",
                value: format(startDateTime, "HH:mm"),
                onChange: (e) => handleStartTimeChange(e.target.value),
                className: "bg-background border-border"
              }
            )
          ] })
        ] }),
        validationErrors.startDate && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-400 mt-2", children: validationErrors.startDate })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-4 bg-muted/40 rounded-xl border border-border", children: [
        /* @__PURE__ */ jsxs("label", { className: "text-sm font-medium text-foreground mb-3 block", children: [
          /* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4 inline mr-2" }),
          "End Date & Time ",
          /* @__PURE__ */ jsx("span", { className: "text-red-400", children: "*" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground mb-1 block", children: "Date" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "date",
                value: format(endDateTime, "yyyy-MM-dd"),
                min: format(startDateTime, "yyyy-MM-dd"),
                onChange: (e) => handleEndDateChange(e.target.value),
                className: cn(
                  "bg-background border-border",
                  validationErrors.endDate && "border-red-500"
                )
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground mb-1 block", children: "Time" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "time",
                value: format(endDateTime, "HH:mm"),
                onChange: (e) => handleEndTimeChange(e.target.value),
                className: "bg-background border-border"
              }
            )
          ] })
        ] }),
        validationErrors.endDate && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-400 mt-2", children: validationErrors.endDate })
      ] })
    ] }),
    durationMinutes > 0 && /* @__PURE__ */ jsxs("div", { className: "p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-500/30", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-xl bg-cyan-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(Clock, { className: "w-7 h-7 text-cyan-500" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx("div", { className: "text-3xl font-bold text-foreground", children: formatDuration$2(durationMinutes) }),
          /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: "Total project duration" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm text-foreground", children: safeFormatDate(startDateTime.toISOString(), "MMM d, yyyy HH:mm", "Not set") }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground my-1", children: "to" }),
          /* @__PURE__ */ jsx("div", { className: "text-sm text-foreground", children: safeFormatDate(endDateTime.toISOString(), "MMM d, yyyy HH:mm", "Not set") })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 pt-4 border-t border-border/50", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-4 h-4 rounded-full bg-green-500 shadow-lg shadow-green-500/30" }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 h-2 bg-gradient-to-r from-green-500 via-cyan-500 to-blue-500 rounded-full mx-2" }),
          /* @__PURE__ */ jsx("div", { className: "w-4 h-4 rounded-full bg-blue-500 shadow-lg shadow-blue-500/30" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between mt-2 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsx("span", { children: "Project Start" }),
          /* @__PURE__ */ jsx("span", { children: "Project End" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-4 bg-muted/40 rounded-lg border border-border", children: [
      /* @__PURE__ */ jsx("h4", { className: "text-sm font-medium text-foreground mb-2", children: "Timeline Tips" }),
      /* @__PURE__ */ jsxs("ul", { className: "text-sm text-muted-foreground space-y-1 list-disc list-inside", children: [
        /* @__PURE__ */ jsx("li", { children: "Use the slider for quick duration selection" }),
        /* @__PURE__ */ jsx("li", { children: "Short durations (15min-8hours) are great for workshops or class sessions" }),
        /* @__PURE__ */ jsx("li", { children: "Longer durations (weeks) are better for semester-long projects" }),
        /* @__PURE__ */ jsx("li", { children: "You can fine-tune individual session durations in the next steps" })
      ] })
    ] })
  ] });
}
const DELIVERABLE_TYPES = [
  { value: "none", label: "None", icon: Ban },
  { value: "document", label: "Document", icon: FileText }
];
const DIFFICULTY_OPTIONS = [
  {
    value: "easy",
    label: "Easy",
    bgColor: "bg-sky-500",
    textColor: "text-sky-600",
    borderColor: "border-sky-500"
  },
  {
    value: "medium",
    label: "Medium",
    bgColor: "bg-violet-500",
    textColor: "text-violet-600",
    borderColor: "border-violet-500"
  },
  {
    value: "hard",
    label: "Hard",
    bgColor: "bg-rose-500",
    textColor: "text-rose-600",
    borderColor: "border-rose-500"
  }
];
const DIFFICULTY_WEIGHTS$1 = {
  easy: 60,
  medium: 100,
  hard: 140
};
function formatDuration$1(minutes) {
  if (minutes < 60) {
    return `${minutes} min`;
  } else if (minutes < 1440) {
    const hours = Math.round(minutes / 60);
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  } else if (minutes < 10080) {
    const days = Math.round(minutes / 1440);
    return `${days} day${days > 1 ? "s" : ""}`;
  } else {
    const weeks = Math.round(minutes / 10080);
    return `${weeks} week${weeks > 1 ? "s" : ""}`;
  }
}
function formatSessionDuration(sessionMinutes, totalMinutes) {
  if (totalMinutes < 1440) {
    if (sessionMinutes < 60) {
      return `${sessionMinutes} min`;
    }
    const hours = Math.round(sessionMinutes / 60 * 10) / 10;
    return `${hours}h`;
  } else if (totalMinutes < 10080) {
    if (sessionMinutes < 1440) {
      const hours = Math.round(sessionMinutes / 60);
      return `${hours}h`;
    }
    const days = Math.round(sessionMinutes / 1440 * 10) / 10;
    return `${days}d`;
  } else {
    const days = Math.round(sessionMinutes / 1440);
    return `${days} day${days > 1 ? "s" : ""}`;
  }
}
const getSessionGenerationPrompt = (divergenceLevel, toneLevel) => `You are an expert educational project designer for Peabee.
Your task is to generate appropriate learning sessions based on the project information provided.

Guidelines:
- Create sessions that scaffold learning from foundational concepts to complex applications
- Each session should have a clear learning objective tied to the driving question
- Difficulty should progress: typically start with easy/medium, build to hard, then consolidate
- Time allocation based on difficulty: easy (shorter), medium (standard), hard (longer)
- Rubric criteria should be specific, measurable, and aligned with session objectives
- IMPORTANT: Do NOT prefix or number session titles with labels like "Session 1:", "Session 2:", etc. Use descriptive, content-based titles only.
- IMPORTANT: Do NOT use the word "student" or "students" anywhere in the output — not in titles, topics, guides, rubric criteria, or rubric descriptions. Use "learner", "participant", "team", or rephrase to avoid addressing anyone directly.
- Thinking Style (Divergence Level): ${divergenceLevel}/100 (0 = Highly Convergent/Structured, 100 = Highly Divergent/Creative).
  - Low divergence: Detailed guides, specific document deliverables, strict rubrics.
  - High divergence: Open-ended guides, creative deliverables, flexible rubrics.
- Tone/Style: ${toneLevel}/100 (0 = Professional/Formal, 100 = Fun/Casual).
  - Low (0-30): Strictly professional, academic, formal tone.
  - Mid (31-70): Balanced tone. Professional but accessible and engaging.
  - High (71-100): Fun, engaging, casual tone. Use emojis, exciting language.

For each session, provide:
- title: Concise session title (3-7 words)
- topic: What will be learned/done in this session (1-2 sentences)
- difficulty: "easy", "medium", or "hard"
- guide: Detailed instructions for the session (2-3 paragraphs)
- deliverableType: "none" or "document" based on the project nature and divergence level
 - rubric: Array of 3-4 criteria, each with criterion name, description, and weight (integer percentage 0-100, no decimals, weights must sum to exactly 100)`;
const SESSION_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    sessions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          topic: { type: "string" },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          guide: { type: "string" },
          deliverableType: { type: "string", enum: ["none", "document"] },
          rubric: {
            type: "array",
            items: {
              type: "object",
              properties: {
                criterion: { type: "string" },
                description: { type: "string" },
                weight: { type: "integer", minimum: 0, maximum: 100 }
              },
              required: ["criterion", "description", "weight"],
              additionalProperties: false
            }
          }
        },
        required: ["title", "topic", "difficulty", "guide", "deliverableType", "rubric"],
        additionalProperties: false
      }
    }
  },
  required: ["sessions"],
  additionalProperties: false
};
async function generateSessions(title, background, drivingQuestion, durationMinutes, sessionCount, divergenceLevel, toneLevel) {
  const durationText = formatDuration$1(durationMinutes);
  let aiModel;
  try {
    aiModel = await getConfiguredAIModel();
  } catch (error) {
    console.error("Error getting AI model, using default:", error);
    aiModel = "openrouter/auto";
  }
  const result = await aiChatCompletion({
    data: {
      model: aiModel,
      messages: [
        {
          role: "system",
          content: getSessionGenerationPrompt(divergenceLevel, toneLevel)
        },
        {
          role: "user",
          content: `Generate exactly ${sessionCount} learning sessions for this project:

Project Title: ${title}
Background: ${background}
Driving Question: ${drivingQuestion}
Total Duration: ${durationText}

Create a well-structured learning journey that helps answer the driving question.`
        }
      ],
      max_tokens: 3e3,
      temperature: 0.7 + divergenceLevel / 100 * 0.3,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "sessions_response",
          strict: true,
          schema: SESSION_RESPONSE_SCHEMA
        }
      }
    }
  });
  if (!result.success) {
    throw new Error(result.error || "AI API error");
  }
  const content = result.content;
  if (!content) {
    throw new Error("No content in API response");
  }
  try {
    let jsonContent = content.trim();
    const codeBlockMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonContent = codeBlockMatch[1].trim();
    }
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }
    const parsed = JSON.parse(jsonContent);
    return parsed.sessions.map((s) => ({
      title: s.title || "",
      topic: s.topic || "",
      difficulty: ["easy", "medium", "hard"].includes(s.difficulty) ? s.difficulty : "medium",
      guide: s.guide || "",
      deliverableType: ["none", "document"].includes(s.deliverableType) ? s.deliverableType : "document",
      rubric: (s.rubric || []).map((r) => ({
        criterion: r.criterion || "",
        description: r.description || "",
        weight: r.weight || 25
      }))
    }));
  } catch (parseError) {
    console.error("Failed to parse JSON response:", content, parseError);
    throw new Error("Failed to parse AI response. Please try again.");
  }
}
function getRecommendedSessionCount$1(minutes) {
  if (minutes <= 0) return 1;
  if (minutes <= 60) return 3;
  if (minutes <= 240) return 4;
  if (minutes <= 480) return 5;
  if (minutes <= 1440) return 3;
  if (minutes <= 10080) return 3;
  if (minutes <= 20160) return 5;
  if (minutes <= 40320) return 6;
  if (minutes <= 80640) return 8;
  return 8;
}
function VariableSessionBuilder() {
  const { wizardState, addSession, updateSession, removeSession, setSessions } = useCreatorStore();
  const { currentUser, setUser } = useAuthStore();
  const { sessions, timeline, basicInfo, validationErrors } = wizardState;
  const [expandedSession, setExpandedSession] = useState(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [divergenceLevel, setDivergenceLevel] = useState([50]);
  const [toneLevel, setToneLevel] = useState([50]);
  const [draggingHandle, setDraggingHandle] = useState(null);
  const timelineRef = useRef(null);
  const [draggedSessionIndex, setDraggedSessionIndex] = useState(null);
  const [dragOverSessionIndex, setDragOverSessionIndex] = useState(null);
  const totalMinutes = useMemo(() => {
    if (!isValidDate(timeline.startDate) || !isValidDate(timeline.endDate))
      return 0;
    return differenceInMinutes(
      new Date(timeline.endDate),
      new Date(timeline.startDate)
    );
  }, [timeline.startDate, timeline.endDate]);
  const [sessionCount, setSessionCount] = useState(
    () => getRecommendedSessionCount$1(totalMinutes)
  );
  const persistDefaultDifficulty = useCallback(
    async (difficulty) => {
      if (!currentUser?.id) return;
      try {
        const result = await updateUser({
          data: {
            userId: currentUser.id,
            defaultSessionDifficulty: difficulty
          }
        });
        if (result.success) {
          setUser({
            ...currentUser,
            defaultSessionDifficulty: result.user.defaultSessionDifficulty ?? difficulty
          });
        }
      } catch (error) {
        console.error("Failed to save default session difficulty:", error);
      }
    },
    [currentUser, setUser]
  );
  const totalWeight = sessions.reduce((sum, s) => sum + s.weight, 0);
  const sessionsWithDates = useMemo(() => {
    if (!isValidDate(timeline.startDate) || sessions.length === 0) {
      return sessions.map((session, index) => ({
        ...session,
        index,
        calculatedStartDate: "",
        calculatedEndDate: "",
        isoStartDate: "",
        isoEndDate: "",
        sessionMinutes: 0,
        percentage: sessions.length > 0 ? Math.round(100 / sessions.length) : 0
      }));
    }
    let currentDate = new Date(timeline.startDate);
    return sessions.map((session, index) => {
      const proportion = totalWeight > 0 ? session.weight / totalWeight : 0;
      const sessionMinutes = Math.max(1, Math.round(totalMinutes * proportion));
      const startDate = currentDate;
      const endDate = addMinutes(currentDate, sessionMinutes);
      currentDate = endDate;
      return {
        ...session,
        index,
        calculatedStartDate: format(startDate, "yyyy-MM-dd HH:mm"),
        calculatedEndDate: format(endDate, "yyyy-MM-dd HH:mm"),
        isoStartDate: startDate.toISOString(),
        isoEndDate: endDate.toISOString(),
        sessionMinutes,
        percentage: Math.round(proportion * 100)
      };
    });
  }, [sessions, timeline.startDate, totalMinutes, totalWeight]);
  const handleTimelineDrag = useCallback(
    (e) => {
      if (draggingHandle === null || !timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const totalWidth = rect.width;
      let cumulativePercent = 0;
      for (let i = 0; i < draggingHandle; i++) {
        cumulativePercent += sessionsWithDates[i]?.percentage || 0;
      }
      const newPercent = Math.max(5, Math.min(95, mouseX / totalWidth * 100));
      const leftSession = sessions[draggingHandle];
      const rightSession = sessions[draggingHandle + 1];
      if (!leftSession || !rightSession) return;
      const leftPercent = sessionsWithDates[draggingHandle]?.percentage || 0;
      const rightPercent = sessionsWithDates[draggingHandle + 1]?.percentage || 0;
      const combinedPercent = leftPercent + rightPercent;
      const newLeftPercent = Math.max(
        5,
        Math.min(combinedPercent - 5, newPercent - cumulativePercent)
      );
      const totalWeightForBoth = leftSession.weight + rightSession.weight;
      const newLeftWeight = Math.max(
        1,
        Math.round(newLeftPercent / combinedPercent * totalWeightForBoth)
      );
      const newRightWeight = Math.max(1, totalWeightForBoth - newLeftWeight);
      updateSession(draggingHandle, { weight: newLeftWeight });
      updateSession(draggingHandle + 1, { weight: newRightWeight });
    },
    [draggingHandle, sessions, sessionsWithDates, updateSession]
  );
  const handleMouseUp = useCallback(() => {
    setDraggingHandle(null);
  }, []);
  useEffect(() => {
    if (draggingHandle !== null) {
      const handleMove = (e) => handleTimelineDrag(e);
      const handleUp = () => handleMouseUp();
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
      return () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };
    }
  }, [draggingHandle, handleTimelineDrag, handleMouseUp]);
  const handleDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
    setDraggedSessionIndex(index);
  };
  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverSessionIndex(index);
  };
  const handleDragLeave = () => {
    setDragOverSessionIndex(null);
  };
  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = draggedSessionIndex;
    if (dragIndex === null || dragIndex === dropIndex) {
      setDraggedSessionIndex(null);
      setDragOverSessionIndex(null);
      return;
    }
    const newSessions = [...sessions];
    const [draggedSession] = newSessions.splice(dragIndex, 1);
    newSessions.splice(dropIndex, 0, draggedSession);
    setSessions(newSessions);
    setDraggedSessionIndex(null);
    setDragOverSessionIndex(null);
    if (expandedSession === dragIndex) {
      setExpandedSession(dropIndex);
    } else if (expandedSession !== null) {
      if (dragIndex < expandedSession && dropIndex >= expandedSession) {
        setExpandedSession(expandedSession - 1);
      } else if (dragIndex > expandedSession && dropIndex <= expandedSession) {
        setExpandedSession(expandedSession + 1);
      }
    }
  };
  const handleDragEnd = () => {
    setDraggedSessionIndex(null);
    setDragOverSessionIndex(null);
  };
  useEffect(() => {
    if (!isValidDate(timeline.startDate)) return;
    sessionsWithDates.forEach((calculated, index) => {
      const currentSession = sessions[index];
      if (currentSession.startDate !== calculated.isoStartDate || currentSession.endDate !== calculated.isoEndDate) ;
    });
    const updatesNeeded = sessionsWithDates.some((calculated, index) => {
      const currentSession = sessions[index];
      return currentSession.startDate !== calculated.isoStartDate || currentSession.endDate !== calculated.isoEndDate || currentSession.durationMinutes !== calculated.sessionMinutes;
    });
    if (updatesNeeded) {
      const newSessions = sessions.map((session, index) => {
        const calculated = sessionsWithDates[index];
        return {
          ...session,
          durationMinutes: calculated.sessionMinutes,
          startDate: calculated.isoStartDate,
          endDate: calculated.isoEndDate
        };
      });
      setSessions(newSessions);
    }
  }, [sessionsWithDates, sessions, setSessions, timeline.startDate]);
  const handleGenerateAllSessions = async () => {
    if (!basicInfo.title || !basicInfo.drivingQuestion) {
      setGenerationError(
        "Please fill in project title and driving question first (Step 2: Content)"
      );
      return;
    }
    setIsGeneratingAll(true);
    setGenerationError(null);
    try {
      const generated = await generateSessions(
        basicInfo.title,
        basicInfo.background,
        basicInfo.drivingQuestion,
        totalMinutes || 20160,
        // default 2 weeks
        sessionCount,
        divergenceLevel[0],
        toneLevel[0]
      );
      const newSessions = generated.map(
        (g, index) => ({
          index,
          title: g.title,
          topic: g.topic,
          guide: g.guide,
          difficulty: g.difficulty,
          weight: DIFFICULTY_WEIGHTS$1[g.difficulty],
          durationMinutes: DIFFICULTY_WEIGHTS$1[g.difficulty],
          startDate: "",
          endDate: "",
          deliverableType: g.deliverableType,
          rubric: g.rubric.map((r) => ({
            id: `rubric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...r
          })),
          resources: [],
          templates: [],
          llmModel: "gpt-4"
        })
      );
      setSessions(newSessions);
      setExpandedSession(0);
    } catch (error) {
      console.error("Generation error:", error);
      setGenerationError(
        error instanceof Error ? error.message : "Failed to generate sessions. Please try again."
      );
    } finally {
      setIsGeneratingAll(false);
    }
  };
  const addRubricItem = (sessionIndex) => {
    const currentRubric = sessions[sessionIndex].rubric || [];
    const usedWeight = currentRubric.reduce((sum, r) => sum + r.weight, 0);
    const remainingWeight = Math.max(0, 100 - usedWeight);
    const newItem = {
      id: `rubric_${Date.now()}`,
      criterion: "",
      description: "",
      weight: remainingWeight
    };
    updateSession(sessionIndex, { rubric: [...currentRubric, newItem] });
  };
  const updateRubricItem = (sessionIndex, rubricIndex, updates) => {
    const currentRubric = [...sessions[sessionIndex].rubric || []];
    currentRubric[rubricIndex] = { ...currentRubric[rubricIndex], ...updates };
    updateSession(sessionIndex, { rubric: currentRubric });
  };
  const removeRubricItem = (sessionIndex, rubricIndex) => {
    const currentRubric = sessions[sessionIndex].rubric.filter(
      (_, i) => i !== rubricIndex
    );
    updateSession(sessionIndex, { rubric: currentRubric });
  };
  const recommendedCount = getRecommendedSessionCount$1(totalMinutes);
  const formatTimelineDate = (dateStr) => {
    if (totalMinutes < 1440) {
      return safeFormatDate(dateStr, "MMM d HH:mm", "?");
    }
    return safeFormatDate(dateStr, "MMM d", "?");
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-foreground mb-2", children: "Variable Session Builder" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "AI generates sessions based on your project info. Customize as needed." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-4 bg-card rounded-xl border border-border space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-8", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mb-1", children: "Project Duration" }),
            /* @__PURE__ */ jsx("div", { className: "text-foreground font-medium", children: totalMinutes > 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
              formatDuration$1(totalMinutes),
              /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground font-normal ml-2 text-sm", children: [
                "(",
                formatTimelineDate(timeline.startDate),
                " -",
                " ",
                formatTimelineDate(timeline.endDate),
                ")"
              ] })
            ] }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Not set" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mb-1", children: [
              "Number of Sessions",
              sessionCount === recommendedCount && /* @__PURE__ */ jsx("span", { className: "text-cyan-500 ml-1", children: "(recommended)" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setSessionCount(Math.max(1, sessionCount - 1)),
                  className: "w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center transition-colors",
                  disabled: sessionCount <= 1,
                  children: "-"
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "w-8 text-center text-xl font-bold text-foreground", children: sessionCount }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setSessionCount(Math.min(10, sessionCount + 1)),
                  className: "w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center transition-colors",
                  disabled: sessionCount >= 10,
                  children: "+"
                }
              ),
              sessionCount !== recommendedCount && /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setSessionCount(recommendedCount),
                  className: "text-xs text-cyan-500 hover:text-cyan-600 ml-2",
                  children: [
                    "Reset to ",
                    recommendedCount
                  ]
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            onClick: handleGenerateAllSessions,
            disabled: isGeneratingAll || !basicInfo.title,
            className: "bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white",
            children: isGeneratingAll ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
              "Generating..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4 mr-2" }),
              "Generate ",
              sessionCount,
              " Sessions"
            ] })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-8 pt-4 border-t border-border/50", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs text-muted-foreground mb-3", children: [
            /* @__PURE__ */ jsx("span", { children: "Convergent" }),
            /* @__PURE__ */ jsx("span", { className: "text-cyan-500 font-medium", children: "Thinking Style" }),
            /* @__PURE__ */ jsx("span", { children: "Divergent" })
          ] }),
          /* @__PURE__ */ jsx(
            Slider,
            {
              value: divergenceLevel,
              onValueChange: setDivergenceLevel,
              max: 100,
              step: 50,
              className: "py-1 cursor-pointer"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs text-muted-foreground mb-3", children: [
            /* @__PURE__ */ jsx("span", { children: "Professional" }),
            /* @__PURE__ */ jsx("span", { className: "text-purple-500 font-medium", children: "Tone" }),
            /* @__PURE__ */ jsx("span", { children: "Fun/Casual" })
          ] }),
          /* @__PURE__ */ jsx(
            Slider,
            {
              value: toneLevel,
              onValueChange: setToneLevel,
              max: 100,
              step: 50,
              className: "py-1 cursor-pointer"
            }
          )
        ] })
      ] })
    ] }),
    generationError && /* @__PURE__ */ jsx("div", { className: "p-4 bg-red-500/10 border border-red-500/30 rounded-lg", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-red-500", children: generationError }) }),
    sessions.length > 0 && /* @__PURE__ */ jsxs("div", { className: "p-4 bg-card rounded-lg border border-border", children: [
      /* @__PURE__ */ jsxs("label", { className: "text-sm font-medium text-foreground mb-3 block", children: [
        "Timeline Distribution",
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground font-normal ml-2", children: "(drag handles to adjust)" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "px-8", children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            ref: timelineRef,
            className: cn(
              "flex h-14 rounded-lg overflow-hidden border border-border bg-muted/30 relative",
              draggingHandle !== null && "cursor-col-resize"
            ),
            children: sessionsWithDates.map((session, index) => /* @__PURE__ */ jsxs(
              "div",
              {
                className: "relative h-full",
                style: { width: `${session.percentage}%` },
                children: [
                  /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsxs(Tooltip, { children: [
                    /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
                      "div",
                      {
                        className: cn(
                          "h-full flex flex-col items-center justify-center text-foreground bg-background border-y border-l border-border/70 transition-colors duration-200 ease-out hover:bg-cyan-500/35",
                          expandedSession === index && "bg-cyan-500/35",
                          index === sessionsWithDates.length - 1 && "border-r"
                        ),
                        onClick: () => setExpandedSession(index),
                        children: [
                          /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold", children: index + 1 }),
                          /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground", children: formatSessionDuration(session.sessionMinutes, totalMinutes) })
                        ]
                      }
                    ) }),
                    /* @__PURE__ */ jsxs(TooltipContent, { children: [
                      /* @__PURE__ */ jsx("p", { className: "font-medium", children: session.title || `Session ${index + 1}` }),
                      /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
                        formatSessionDuration(
                          session.sessionMinutes,
                          totalMinutes
                        ),
                        " ",
                        "(",
                        session.percentage,
                        "%)"
                      ] })
                    ] })
                  ] }) }),
                  index < sessionsWithDates.length - 1 && /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: cn(
                        "absolute right-0 top-0 h-full w-3 cursor-col-resize z-10 flex items-center justify-center translate-x-1/2 group",
                        draggingHandle === index && "bg-cyan-500/20"
                      ),
                      onMouseDown: (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDraggingHandle(index);
                      },
                      children: /* @__PURE__ */ jsx(
                        "div",
                        {
                          className: cn(
                            "w-1 h-8 rounded-full bg-border transition-colors",
                            "group-hover:bg-cyan-500 group-hover:w-1.5",
                            draggingHandle === index && "bg-cyan-500 w-1.5"
                          )
                        }
                      )
                    }
                  )
                ]
              },
              index
            ))
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "relative flex mt-1 pb-4", children: sessionsWithDates.map((session, index) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "relative text-[10px] text-muted-foreground",
            style: { width: `${session.percentage}%` },
            children: [
              /* @__PURE__ */ jsx("span", { className: "absolute left-0 -translate-x-1/2", children: index === 0 && formatTimelineDate(session.isoStartDate) }),
              /* @__PURE__ */ jsx("span", { className: "absolute right-0 translate-x-1/2", children: formatTimelineDate(session.isoEndDate) })
            ]
          },
          index
        )) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-4", children: sessions.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-8 bg-muted/40 rounded-lg border border-border", children: [
      /* @__PURE__ */ jsx(Sparkles, { className: "w-10 h-10 mx-auto text-muted-foreground mb-3" }),
      /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground mb-4", children: [
        'Click "Generate ',
        sessionCount,
        ' Sessions" above or add sessions manually'
      ] }),
      /* @__PURE__ */ jsxs(
        Button,
        {
          onClick: () => addSession(),
          variant: "outline",
          className: "border-border",
          children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
            "Add Session"
          ]
        }
      )
    ] }) : sessionsWithDates.map((session, index) => /* @__PURE__ */ jsxs(
      "div",
      {
        onDragOver: (e) => handleDragOver(e, index),
        onDragLeave: handleDragLeave,
        onDrop: (e) => handleDrop(e, index),
        onDragEnd: handleDragEnd,
        className: cn(
          "bg-card rounded-lg border border-border overflow-hidden transition-all",
          draggedSessionIndex === index && "opacity-50",
          dragOverSessionIndex === index && draggedSessionIndex !== index && "border-cyan-500 border-2"
        ),
        children: [
          /* @__PURE__ */ jsxs(
            "div",
            {
              draggable: true,
              onDragStart: (e) => handleDragStart(e, index),
              className: "w-full p-4 flex items-center justify-between hover:bg-muted/70 transition-colors cursor-grab active:cursor-grabbing",
              onClick: () => setExpandedSession(expandedSession === index ? null : index),
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: "text-muted-foreground hover:text-foreground transition-colors",
                      children: /* @__PURE__ */ jsx(GripVertical, { className: "w-5 h-5" })
                    }
                  ),
                  /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full flex items-center justify-center text-foreground font-semibold border border-border bg-background shrink-0", children: index + 1 }),
                  /* @__PURE__ */ jsxs("div", { className: "text-left", children: [
                    /* @__PURE__ */ jsx("h3", { className: "font-medium text-foreground", children: session.title || `Session ${index + 1}` }),
                    /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: /* @__PURE__ */ jsx("span", { children: session.topic || "No objective set" }) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 flex-nowrap", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 min-w-[210px] justify-end whitespace-nowrap", children: [
                    /* @__PURE__ */ jsx(
                      "span",
                      {
                        className: cn(
                          "px-2.5 py-1 rounded-md text-xs font-semibold capitalize",
                          session.difficulty === "easy" && "bg-sky-500/10 text-sky-600",
                          session.difficulty === "medium" && "bg-violet-500/10 text-violet-600",
                          session.difficulty === "hard" && "bg-rose-500/10 text-rose-600"
                        ),
                        children: session.difficulty
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: formatSessionDuration(
                      session.sessionMinutes,
                      totalMinutes
                    ) })
                  ] }),
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "icon",
                      onClick: (e) => {
                        e.stopPropagation();
                        removeSession(index);
                      },
                      className: "text-muted-foreground hover:text-red-500",
                      disabled: sessions.length === 1,
                      children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
                    }
                  ),
                  expandedSession === index ? /* @__PURE__ */ jsx(ChevronUp, { className: "w-5 h-5 text-muted-foreground" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "w-5 h-5 text-muted-foreground" })
                ] })
              ]
            }
          ),
          expandedSession === index && /* @__PURE__ */ jsxs("div", { className: "p-4 border-t border-border space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-foreground mb-2 block", children: "Session Title" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    value: session.title,
                    onChange: (e) => updateSession(index, { title: e.target.value }),
                    placeholder: `Session ${index + 1}`,
                    className: "bg-background border-border"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-foreground mb-2 block", children: "Objective" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    value: session.topic,
                    onChange: (e) => updateSession(index, { topic: e.target.value }),
                    placeholder: "What will students learn?",
                    className: "bg-background border-border"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-foreground mb-2 block", children: "Difficulty" }),
              /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: DIFFICULTY_OPTIONS.map((opt) => /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => {
                    updateSession(index, { difficulty: opt.value });
                    persistDefaultDifficulty(opt.value);
                  },
                  className: cn(
                    "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all border",
                    session.difficulty === opt.value ? `${opt.bgColor} text-white border-transparent` : `bg-muted/50 ${opt.textColor} ${opt.borderColor} border-opacity-40 hover:border-opacity-100`
                  ),
                  children: [
                    opt.label,
                    /* @__PURE__ */ jsxs("span", { className: "ml-2 text-xs opacity-80", children: [
                      "x",
                      (DIFFICULTY_WEIGHTS$1[opt.value] / 100).toFixed(1)
                    ] })
                  ]
                },
                opt.value
              )) })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-foreground mb-2 block", children: "Session Guide" }),
              /* @__PURE__ */ jsx(
                Textarea,
                {
                  value: session.guide,
                  onChange: (e) => updateSession(index, { guide: e.target.value }),
                  placeholder: "Provide instructions and guidance for this session",
                  className: "bg-background border-border min-h-[100px]"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-foreground mb-2 block", children: "Deliverable Type" }),
              /* @__PURE__ */ jsx("div", { className: "flex gap-3 w-full", children: DELIVERABLE_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = session.deliverableType === type.value;
                return /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => updateSession(index, {
                      deliverableType: type.value,
                      ...type.value === "none" ? { rubric: [] } : {}
                    }),
                    className: cn(
                      "p-3 rounded-lg border flex flex-col items-center gap-2 transition-all flex-1",
                      isSelected ? "border-cyan-500 bg-cyan-500/10 text-cyan-500" : "border-border text-muted-foreground hover:border-border/70"
                    ),
                    children: [
                      /* @__PURE__ */ jsx(Icon, { className: "w-5 h-5" }),
                      /* @__PURE__ */ jsx("span", { className: "text-xs", children: type.label })
                    ]
                  },
                  type.value
                );
              }) })
            ] }),
            session.deliverableType !== "none" && (() => {
              const totalWeight2 = session.rubric.reduce((sum, r) => sum + r.weight, 0);
              const isWeightValid = session.rubric.length === 0 || totalWeight2 === 100;
              return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-muted/30 p-4 mt-6", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-foreground", children: "Rubric Criteria" }),
                    session.rubric.length > 0 && /* @__PURE__ */ jsxs("span", { className: cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      isWeightValid ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                    ), children: [
                      totalWeight2,
                      "% / 100%"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => addRubricItem(index),
                      className: "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border/50 bg-background hover:bg-accent/50 transition-colors",
                      children: [
                        /* @__PURE__ */ jsx(Plus, { className: "w-3.5 h-3.5" }),
                        "Add Criterion"
                      ]
                    }
                  )
                ] }),
                session.rubric.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-8 rounded-lg border border-dashed border-border/50 bg-background/50", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-3", children: "No rubric criteria defined" }),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => addRubricItem(index),
                      className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border/50 bg-background hover:bg-accent/50 transition-colors",
                      children: [
                        /* @__PURE__ */ jsx(Plus, { className: "w-3.5 h-3.5" }),
                        "Add First Criterion"
                      ]
                    }
                  )
                ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  session.rubric.map((item, rubricIndex) => /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: "p-3 bg-background rounded-lg border border-border/50",
                      children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-2", children: [
                          /* @__PURE__ */ jsx(
                            Input,
                            {
                              value: item.criterion,
                              onChange: (e) => updateRubricItem(index, rubricIndex, {
                                criterion: e.target.value
                              }),
                              placeholder: "Criterion name",
                              className: "bg-background border-border/50 text-sm"
                            }
                          ),
                          /* @__PURE__ */ jsx(
                            Input,
                            {
                              value: item.description,
                              onChange: (e) => updateRubricItem(index, rubricIndex, {
                                description: e.target.value
                              }),
                              placeholder: "Description",
                              className: "bg-background border-border/50 text-sm"
                            }
                          ),
                          /* @__PURE__ */ jsxs("div", { children: [
                            /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground mb-1 block", children: "Weight %" }),
                            /* @__PURE__ */ jsx(
                              Input,
                              {
                                type: "number",
                                min: 0,
                                max: 100,
                                value: item.weight,
                                onChange: (e) => updateRubricItem(index, rubricIndex, {
                                  weight: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                                }),
                                className: cn(
                                  "bg-background border-border/50 text-sm w-24",
                                  !isWeightValid && "border-red-500/50"
                                )
                              }
                            )
                          ] })
                        ] }),
                        /* @__PURE__ */ jsx(
                          "button",
                          {
                            onClick: () => removeRubricItem(index, rubricIndex),
                            className: "w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors",
                            children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
                          }
                        )
                      ] })
                    },
                    item.id
                  )),
                  !isWeightValid && /* @__PURE__ */ jsxs("p", { className: "text-xs text-red-500 mt-2", children: [
                    "Weights must add up to 100% (currently ",
                    totalWeight2,
                    "%)"
                  ] })
                ] })
              ] });
            })()
          ] })
        ]
      },
      index
    )) }),
    sessions.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex gap-3", children: /* @__PURE__ */ jsxs(
      Button,
      {
        onClick: () => {
          addSession();
          setExpandedSession(sessions.length);
        },
        variant: "outline",
        className: "flex-1 border-border hover:border-border/70",
        children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
          "Add Session"
        ]
      }
    ) }),
    validationErrors.sessions && /* @__PURE__ */ jsx("div", { className: "p-4 bg-red-500/10 border border-red-500/30 rounded-lg", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-red-500", children: validationErrors.sessions }) }),
    /* @__PURE__ */ jsx("div", { className: "p-4 bg-muted/40 rounded-lg border border-border", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
      /* @__PURE__ */ jsx(Info, { className: "w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" }),
      /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsxs("p", { className: "mb-2", children: [
          /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: "AI-Powered Sessions:" }),
          " ",
          "Based on your project title, background, and driving question, AI generates sessions with appropriate difficulty, time allocation, and rubric criteria."
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: "Difficulty = Time:" }),
          " ",
          "Easy sessions get less time, hard sessions get more. Adjust the weight slider for fine-tuning."
        ] })
      ] })
    ] }) })
  ] });
}
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
function ReviewAndDeploy() {
  const { wizardState, validateWizard, setWizardStep } = useCreatorStore();
  const {
    basicInfo,
    participantParams,
    timeline,
    sessions,
    isValid,
    validationErrors
  } = wizardState;
  useEffect(() => {
    validateWizard();
  }, [basicInfo, participantParams, timeline, sessions, validateWizard]);
  const isValidProject = isValid;
  const durationMinutes = isValidDate(timeline.startDate) && isValidDate(timeline.endDate) ? differenceInMinutes(
    new Date(timeline.endDate),
    new Date(timeline.startDate)
  ) : 0;
  const sections = [
    {
      icon: FileText,
      title: "Project Information",
      targetStep: 2,
      valid: !!basicInfo.title && !!basicInfo.drivingQuestion,
      content: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Title: " }),
          /* @__PURE__ */ jsx("span", { className: "text-foreground", children: basicInfo.title || /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "Not set" }) })
        ] }),
        basicInfo.background && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Background: " }),
          /* @__PURE__ */ jsx("span", { className: "text-foreground line-clamp-2", children: basicInfo.background })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Driving Question: " }),
          /* @__PURE__ */ jsx("span", { className: "text-foreground", children: basicInfo.drivingQuestion || /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "Not set" }) })
        ] })
      ] })
    },
    {
      icon: Users,
      title: "Team Formation",
      targetStep: 3,
      valid: participantParams.projectMode === "personal" || participantParams.teamSize >= 2,
      content: /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Mode: " }),
          /* @__PURE__ */ jsx("span", { className: "text-foreground capitalize", children: participantParams.projectMode })
        ] }),
        participantParams.projectMode === "team" && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Team Size: " }),
          /* @__PURE__ */ jsxs("span", { className: "text-foreground", children: [
            participantParams.teamSize,
            " members"
          ] })
        ] })
      ] })
    },
    {
      icon: Calendar,
      title: "Timeline",
      targetStep: 4,
      valid: !!timeline.startDate && !!timeline.endDate,
      content: /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Duration: " }),
          /* @__PURE__ */ jsx("span", { className: "text-foreground", children: formatDuration(durationMinutes) })
        ] }),
        isValidDate(timeline.startDate) && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Start: " }),
          /* @__PURE__ */ jsx("span", { className: "text-foreground", children: safeFormatDate(timeline.startDate, "MMM d, yyyy HH:mm") })
        ] }),
        isValidDate(timeline.endDate) && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "End: " }),
          /* @__PURE__ */ jsx("span", { className: "text-foreground", children: safeFormatDate(timeline.endDate, "MMM d, yyyy HH:mm") })
        ] })
      ] })
    },
    {
      icon: ListChecks,
      title: "Sessions",
      targetStep: 5,
      valid: sessions.length > 0,
      content: /* @__PURE__ */ jsx("div", { children: sessions.length === 0 ? /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "No sessions defined" }) : /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Total Sessions: " }),
          /* @__PURE__ */ jsx("span", { className: "text-foreground", children: sessions.length })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1 mt-2", children: sessions.map((s, i) => /* @__PURE__ */ jsxs(
          Badge,
          {
            variant: "outline",
            className: "border-border text-xs",
            children: [
              s.title,
              s.durationMinutes > 0 && /* @__PURE__ */ jsxs("span", { className: "ml-1 text-muted-foreground", children: [
                "(",
                formatDuration(s.durationMinutes),
                ")"
              ] })
            ]
          },
          i
        )) })
      ] }) })
    }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-foreground mb-2", children: "Review & Deploy" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Review your project configuration before creating it" })
    ] }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: cn(
          "p-4 rounded-lg border",
          isValidProject ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
        ),
        children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: isValidProject ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 text-green-500" }),
            /* @__PURE__ */ jsx("span", { className: "text-green-500 font-medium", children: "Your project is ready to be created!" })
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(AlertCircle, { className: "w-5 h-5 text-red-500" }),
            /* @__PURE__ */ jsx("span", { className: "text-red-500 font-medium", children: "Please fix the following issues:" })
          ] }) }),
          !isValidProject && Object.keys(validationErrors).length > 0 && /* @__PURE__ */ jsx("ul", { className: "mt-2 ml-8 list-disc text-sm text-red-500", children: Object.entries(validationErrors).map(([key, error]) => /* @__PURE__ */ jsx("li", { children: error }, key)) })
        ]
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: sections.map((section, index) => {
      const Icon = section.icon;
      return /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setWizardStep(section.targetStep),
          className: cn(
            "p-4 rounded-lg border text-left transition-all hover:ring-2 hover:ring-cyan-500/50 group cursor-pointer",
            section.valid ? "bg-card border-border" : "bg-red-500/5 border-red-500/30"
          ),
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
              /* @__PURE__ */ jsx(
                Icon,
                {
                  className: cn(
                    "w-4 h-4 transition-colors",
                    section.valid ? "text-cyan-500 group-hover:text-cyan-400" : "text-red-500"
                  )
                }
              ),
              /* @__PURE__ */ jsx("h3", { className: "font-medium text-foreground group-hover:text-cyan-500 transition-colors", children: section.title }),
              section.valid ? /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-green-500 ml-auto" }) : /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4 text-red-500 ml-auto" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-sm", children: section.content })
          ]
        },
        index
      );
    }) }),
    /* @__PURE__ */ jsxs("div", { className: "p-4 bg-muted/40 rounded-lg border border-border", children: [
      /* @__PURE__ */ jsx("h4", { className: "font-medium text-foreground mb-2", children: "What happens next?" }),
      /* @__PURE__ */ jsx("ul", { className: "text-sm text-muted-foreground space-y-1 list-disc list-inside", children: /* @__PURE__ */ jsx("li", { children: "A unique join code will be generated for explorers" }) })
    ] })
  ] });
}
const WIZARD_STEPS = [
  { id: 1, label: "Mode", icon: Settings, description: "Choose creation mode" },
  {
    id: 2,
    label: "Content",
    icon: FileText,
    description: "Project info & content"
  },
  { id: 3, label: "Teams", icon: Users, description: "Team formation" },
  { id: 4, label: "Timeline", icon: Calendar, description: "Project duration" },
  {
    id: 5,
    label: "Sessions",
    icon: ListChecks,
    description: "Build sessions with AI"
  },
  { id: 6, label: "Deploy", icon: Rocket, description: "Review & launch" }
];
const QUICK_START_DURATIONS = [
  { label: "5 min", value: 5 },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "4 hours", value: 240 },
  { label: "8 hours", value: 480 },
  { label: "1 day", value: 1440 },
  { label: "2 days", value: 2880 },
  { label: "1 week", value: 10080 }
];
const DIFFICULTY_WEIGHTS = {
  easy: 60,
  medium: 100,
  hard: 140
};
function getRecommendedSessionCount(minutes) {
  if (minutes <= 0) return 1;
  if (minutes <= 60) return 3;
  if (minutes <= 240) return 4;
  if (minutes <= 480) return 5;
  if (minutes <= 1440) return 3;
  if (minutes <= 10080) return 3;
  if (minutes <= 20160) return 5;
  if (minutes <= 40320) return 6;
  if (minutes <= 80640) return 8;
  return 8;
}
const QUICK_START_PROMPT = `You are an expert educational project designer.
Generate a complete PBL project structure based on a keyword and duration.
Generate exactly the number of sessions specified in the user prompt.
Each session must have a difficulty of "easy", "medium", or "hard" — vary difficulties to create a natural learning progression.
Rubric weights must be integer percentages between 0 and 100 (no decimals) and must sum to exactly 100.
IMPORTANT: Do NOT prefix or number session titles with labels like "Session 1:", "Session 2:", etc. Use descriptive, content-based titles only.
IMPORTANT: Do NOT use the word "student" or "students" anywhere in the output — not in titles, topics, guides, background, driving question, rubric criteria, or rubric descriptions. Use "learner", "participant", "team", or rephrase to avoid addressing anyone directly.`;
const QUICK_START_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Engaging project title" },
    background: {
      type: "string",
      description: "Context about the project (2-3 sentences)"
    },
    drivingQuestion: {
      type: "string",
      description: "The central open-ended question"
    },
    sessions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          topic: { type: "string" },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          guide: { type: "string" },
          deliverableType: { type: "string", enum: ["none", "document"] },
          rubric: {
            type: "array",
            items: {
              type: "object",
              properties: {
                criterion: { type: "string" },
                description: { type: "string" },
                weight: { type: "integer", minimum: 0, maximum: 100 }
              },
              required: ["criterion", "description", "weight"],
              additionalProperties: false
            }
          }
        },
        required: [
          "title",
          "topic",
          "difficulty",
          "guide",
          "deliverableType",
          "rubric"
        ],
        additionalProperties: false
      }
    }
  },
  required: ["title", "background", "drivingQuestion", "sessions"],
  additionalProperties: false
};
function ProjectWizard() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [isCreating, setIsCreating] = useState(false);
  const [isGeneratingQuickStart, setIsGeneratingQuickStart] = useState(false);
  const [showQuickStartModal, setShowQuickStartModal] = useState(false);
  const [quickStartKeyword, setQuickStartKeyword] = useState("");
  const [durationIndex, setDurationIndex] = useState(0);
  const {
    wizardState,
    setWizardStep,
    nextStep,
    prevStep,
    resetWizard,
    setTimeline,
    setLastSessionDifficulty,
    createProject,
    quickStart
  } = useCreatorStore();
  const { currentStep, totalSteps } = wizardState;
  const isPersonalTeamStep = currentStep === 3 && wizardState.participantParams.projectMode === "personal";
  const isCurrentStepValid = () => {
    const step = currentStep;
    if (step === 2) {
      return !!wizardState.basicInfo.title.trim() && !!wizardState.basicInfo.drivingQuestion.trim();
    }
    if (step === 3) {
      return wizardState.participantParams.projectMode === "personal" || wizardState.participantParams.teamSize >= 2;
    }
    if (step === 4) {
      return !!wizardState.timeline.startDate && !!wizardState.timeline.endDate;
    }
    if (step === 5) {
      if (wizardState.sessions.length === 0) return false;
      for (const session of wizardState.sessions) {
        if (session.deliverableType !== "none" && session.rubric.length > 0) {
          const totalWeight = session.rubric.reduce(
            (sum, r) => sum + r.weight,
            0
          );
          if (totalWeight !== 100) return false;
        }
      }
    }
    if (step === totalSteps) {
      return wizardState.isValid;
    }
    return true;
  };
  const canProceed = !isCreating && isCurrentStepValid();
  useEffect(() => {
    resetWizard();
    const minStart = new Date(Date.now() + 10 * 60 * 1e3).toISOString();
    setTimeline({ startDate: minStart, endDate: "" });
  }, []);
  useEffect(() => {
    if (currentUser?.defaultSessionDifficulty) {
      setLastSessionDifficulty(currentUser.defaultSessionDifficulty);
    }
  }, [currentUser, setLastSessionDifficulty]);
  const handleBack = () => {
    if (currentStep === 1) {
      navigate({ to: "/creator" });
    } else {
      prevStep();
    }
  };
  const handleNext = async () => {
    if (currentStep === totalSteps) {
      if (!currentUser?.id) {
        toast.error("You must be logged in to create a project");
        return;
      }
      setIsCreating(true);
      try {
        const project = await createProject(currentUser.id);
        if (project) {
          toast.success("Project created successfully!");
          navigate({ to: "/creator" });
        } else {
          toast.error("Please fix validation errors before continuing");
        }
      } finally {
        setIsCreating(false);
      }
    } else {
      if (currentStep === 1 && wizardState.mode === "quickstart") {
        setShowQuickStartModal(true);
      } else {
        const result = nextStep();
        if (!result.success && result.error) {
          toast.error(result.error);
        }
      }
    }
  };
  const handleQuickStartConfirm = async () => {
    if (!quickStartKeyword.trim()) {
      toast.error("Please enter a keyword");
      return;
    }
    setIsGeneratingQuickStart(true);
    try {
      const selectedDuration = QUICK_START_DURATIONS[durationIndex];
      const recommendedCount = getRecommendedSessionCount(selectedDuration.value);
      let aiModel;
      try {
        aiModel = await getConfiguredAIModel();
      } catch (error) {
        console.error("Error getting AI model, using default:", error);
        aiModel = "openrouter/auto";
      }
      const result = await aiChatCompletion({
        data: {
          model: aiModel,
          messages: [
            { role: "system", content: QUICK_START_PROMPT },
            {
              role: "user",
              content: `Generate a project for keyword: "${quickStartKeyword}" with total duration: ${selectedDuration.label}. Generate exactly ${recommendedCount} sessions.`
            }
          ],
          max_tokens: 3e3,
          temperature: 0.7,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "quick_start_response",
              strict: true,
              schema: QUICK_START_SCHEMA
            }
          }
        }
      });
      if (!result.success) throw new Error(result.error || "API request failed");
      const content = result.content;
      let jsonContent = content.trim();
      const codeBlockMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) jsonContent = codeBlockMatch[1].trim();
      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonContent = jsonMatch[0];
      const parsed = JSON.parse(jsonContent);
      const now = /* @__PURE__ */ new Date();
      now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);
      const start = now;
      const end = new Date(
        start.getTime() + selectedDuration.value * 60 * 1e3
      );
      const mappedSessions = parsed.sessions.map((s, idx) => {
        const difficulty = ["easy", "medium", "hard"].includes(s.difficulty) ? s.difficulty : "medium";
        return {
          ...s,
          index: idx,
          difficulty,
          weight: DIFFICULTY_WEIGHTS[difficulty] || 100,
          durationMinutes: DIFFICULTY_WEIGHTS[difficulty] || 100,
          startDate: "",
          endDate: "",
          rubric: s.rubric.map((r, rIdx) => ({
            id: `quick_r_${idx}_${rIdx}`,
            ...r
          })),
          resources: [],
          templates: [],
          llmModel: "gpt-4"
        };
      });
      const totalWeight = mappedSessions.reduce((sum, s) => sum + s.weight, 0);
      const totalMinutes = selectedDuration.value;
      let currentDate = new Date(start.getTime());
      for (const session of mappedSessions) {
        const proportion = totalWeight > 0 ? session.weight / totalWeight : 1 / mappedSessions.length;
        const sessionMinutes = Math.max(1, Math.round(totalMinutes * proportion));
        session.durationMinutes = sessionMinutes;
        session.startDate = currentDate.toISOString();
        currentDate = new Date(currentDate.getTime() + sessionMinutes * 60 * 1e3);
        session.endDate = currentDate.toISOString();
      }
      quickStart({
        basicInfo: {
          title: parsed.title,
          background: parsed.background,
          drivingQuestion: parsed.drivingQuestion
        },
        sessions: mappedSessions,
        timeline: {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        }
      });
      toast.success("Project generated successfully!");
      setShowQuickStartModal(false);
      setWizardStep(6);
    } catch (error) {
      console.error("Quick Start generation error:", error);
      toast.error("Failed to generate project. Please try again.");
    } finally {
      setIsGeneratingQuickStart(false);
    }
  };
  const handleStepClick = (step) => {
    if (step === 1 && currentStep > 1) return;
    setWizardStep(step);
  };
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return /* @__PURE__ */ jsx(WizardModeSelector, {});
      case 2:
        return /* @__PURE__ */ jsx(ContentSetup, {});
      case 3:
        return /* @__PURE__ */ jsx(TeamSetup, {});
      case 4:
        return /* @__PURE__ */ jsx(TimelineSetup, {});
      case 5:
        return /* @__PURE__ */ jsx(VariableSessionBuilder, {});
      case 6:
        return /* @__PURE__ */ jsx(ReviewAndDeploy, {});
      default:
        return null;
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "container max-w-7xl mx-auto py-8 px-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-foreground flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(FolderPlus, { className: "w-8 h-8 text-cyan-500" }),
          "Create New Project"
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground mt-1", children: [
          "Step ",
          currentStep,
          " of ",
          totalSteps,
          ":",
          " ",
          WIZARD_STEPS[currentStep - 1]?.description
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "outline",
          onClick: () => navigate({ to: "/creator" }),
          className: "text-muted-foreground hover:text-foreground border-border",
          children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
            "Back to Dashboard"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "hidden lg:flex items-center w-full mb-12 py-2 relative", children: WIZARD_STEPS.map((step, index) => {
      const StepIcon = step.icon;
      const isCompleted = currentStep > step.id;
      const isCurrent = currentStep === step.id;
      const isClickable = step.id === 1 ? currentStep === 1 : true;
      return /* @__PURE__ */ jsxs(
        "div",
        {
          className: "flex-1 flex flex-col items-center relative",
          children: [
            index < WIZARD_STEPS.length - 1 && /* @__PURE__ */ jsx(
              "div",
              {
                className: cn(
                  "absolute top-5 left-[50%] right-[-50%] h-0.5 z-0 transition-colors",
                  isCompleted ? "bg-green-600" : "bg-muted"
                )
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => handleStepClick(step.id),
                className: cn(
                  "flex flex-col items-center gap-2 transition-all z-10 relative",
                  isClickable && !isCurrent && "cursor-pointer hover:opacity-80",
                  !isClickable && "cursor-default"
                ),
                children: [
                  /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm z-20 relative",
                        isCompleted && "bg-green-600 text-white",
                        isCurrent && "bg-cyan-600 text-white border-4 border-background ring-2 ring-cyan-500",
                        !isCompleted && !isCurrent && "bg-background text-muted-foreground border-2 border-muted"
                      ),
                      children: isCompleted ? /* @__PURE__ */ jsx(Check, { className: "w-5 h-5" }) : /* @__PURE__ */ jsx(StepIcon, { className: "w-5 h-5" })
                    }
                  ),
                  /* @__PURE__ */ jsx("div", { className: "flex flex-col items-center min-h-[20px]", children: /* @__PURE__ */ jsx(
                    "span",
                    {
                      className: cn(
                        "text-[10px] font-bold uppercase tracking-tight",
                        isCurrent ? "text-cyan-500" : isCompleted ? "text-green-600" : "text-muted-foreground"
                      ),
                      children: step.label
                    }
                  ) })
                ]
              }
            )
          ]
        },
        step.id
      );
    }) }),
    /* @__PURE__ */ jsx("div", { className: "lg:hidden flex items-center justify-center gap-2 mb-8", children: WIZARD_STEPS.map((step) => /* @__PURE__ */ jsx(
      "div",
      {
        className: cn(
          "w-2 h-2 rounded-full transition-all",
          currentStep === step.id && "w-6 bg-cyan-500",
          currentStep > step.id && "bg-green-500",
          currentStep < step.id && "bg-border"
        )
      },
      step.id
    )) }),
    /* @__PURE__ */ jsx(
      "div",
      {
        className: cn(
          "bg-card border border-border rounded-xl p-6",
          isPersonalTeamStep ? "min-h-[260px]" : "min-h-[400px]"
        ),
        children: renderStepContent()
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between mt-6", children: [
      /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "outline",
          onClick: handleBack,
          className: "border-border",
          children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
            currentStep === 1 ? "Cancel" : "Back"
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          onClick: handleNext,
          disabled: !canProceed,
          className: cn(
            currentStep === totalSteps ? "bg-green-600 hover:bg-green-700 text-white" : "bg-cyan-600 hover:bg-cyan-700 text-white",
            !canProceed && "opacity-60"
          ),
          children: currentStep === totalSteps ? isCreating ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
            "Creating..."
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Rocket, { className: "w-4 h-4 mr-2" }),
            "Create Project"
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            "Next",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
          ] })
        }
      )
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: showQuickStartModal, onOpenChange: setShowQuickStartModal, children: /* @__PURE__ */ jsxs(
      DialogContent,
      {
        className: "sm:max-w-[425px]",
        overlayClassName: "backdrop-blur-sm",
        children: [
          /* @__PURE__ */ jsxs(DialogHeader, { children: [
            /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Zap, { className: "w-5 h-5 text-purple-500" }),
              "Quick Start Configuration"
            ] }),
            /* @__PURE__ */ jsx(DialogDescription, { children: "Provide a keyword and duration to instantly set up your project." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-4 py-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "keyword", children: "Keyword" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "keyword",
                  placeholder: "e.g. Climate Change, Blockchain, Cooking",
                  value: quickStartKeyword,
                  onChange: (e) => setQuickStartKeyword(e.target.value),
                  autoFocus: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: "duration", children: "Duration" }),
                /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-purple-600", children: QUICK_START_DURATIONS[durationIndex].label })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "py-4", children: /* @__PURE__ */ jsx(
                Slider,
                {
                  id: "duration",
                  min: 0,
                  max: QUICK_START_DURATIONS.length - 1,
                  step: 1,
                  value: [durationIndex],
                  onValueChange: (value) => setDurationIndex(value[0]),
                  className: "cursor-pointer"
                }
              ) }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[10px] text-muted-foreground", children: [
                /* @__PURE__ */ jsx("span", { children: QUICK_START_DURATIONS[0].label }),
                /* @__PURE__ */ jsx("span", { children: QUICK_START_DURATIONS[Math.floor(QUICK_START_DURATIONS.length / 2)].label }),
                /* @__PURE__ */ jsx("span", { children: QUICK_START_DURATIONS[QUICK_START_DURATIONS.length - 1].label })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(DialogFooter, { children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "outline",
                onClick: () => setShowQuickStartModal(false),
                disabled: isGeneratingQuickStart,
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                onClick: handleQuickStartConfirm,
                disabled: isGeneratingQuickStart,
                className: "bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white min-w-[120px]",
                children: isGeneratingQuickStart ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
                  "Generating..."
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4 mr-2" }),
                  "Generate"
                ] })
              }
            )
          ] })
        ]
      }
    ) })
  ] });
}
function NewProjectPage() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    currentUser
  } = useAuthStore();
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
  if (!currentUser || !currentUser.role.includes("creator")) {
    return null;
  }
  return /* @__PURE__ */ jsx("div", { className: "min-h-[calc(100vh-4rem)] bg-background", children: /* @__PURE__ */ jsx(ProjectWizard, {}) });
}
export {
  NewProjectPage as component
};
