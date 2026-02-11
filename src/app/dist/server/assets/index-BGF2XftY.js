import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Maximize2, X, Circle, Lock, Play, Clock, CheckCircle, Undo2, Redo2, Bold, Italic, Underline, Strikethrough, Code, Highlighter, Link, Heading1, Heading2, Heading3, List, ListOrdered, ListTodo, Quote, SquareCode, Minus, Loader2, Sparkles, Save, Send, AlertTriangle, ChevronLeft, ArrowRight, UserMinus } from "lucide-react";
import { B as Button, D as Dialog, n as DialogContent, o as DialogHeader, p as DialogTitle, ao as DialogClose, ap as isValidDate, S as ScrollArea, d as cn, s as safeFormatDate, u as useAuthStore, E as DialogDescription, F as DialogFooter, f as getProjectTimeStatus, aq as sendFloatingBotMessage, ar as getTeamPersonas, as as sendMessage, at as getFloatingBotMessages, au as getMessages, av as getOrCreateRoom, aw as aiChatCompletion, I as Input, ax as Route, ay as allocateTeams, az as getProject } from "./router-Bhor0jGk.js";
import { create } from "zustand";
import { r as runExplorerPrecheck, e as storePrecheckResults, u as updateArtifact, b as createArtifact, s as submitArtifact, f as getTeamSessionArtifact } from "./artifacts-V6YAL9mY.js";
import "./settings-CebgkGhm.js";
import { C as Card, b as CardHeader, c as CardTitle, a as CardContent } from "./card-CuhZmkUZ.js";
import { isFuture, isPast } from "date-fns";
import { toast } from "sonner";
import { useEditor, Extension, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Collaboration from "@tiptap/extension-collaboration";
import { yCursorPlugin } from "@tiptap/y-tiptap";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { Separator as Separator$1 } from "radix-ui";
import { u as useProjectStore } from "./projectStore-kRCMiHLx.js";
import { g as getConfiguredAIModel } from "./ai-config-B-TTNnwW.js";
import "next-themes";
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
import "drizzle-orm/sqlite-core";
const useActivityStore = create((set, get) => ({
  currentProjectId: null,
  currentSessionIndex: 0,
  expandedPanel: "cockpit",
  editorContent: "",
  isDirty: false,
  lastSaved: null,
  isRunningPreCheck: false,
  preCheckResult: null,
  isSubmitting: false,
  ghostSuggestion: null,
  isGhostTypingEnabled: true,
  isResourceHubExpanded: true,
  runPreCheckAction: void 0,
  submitAction: void 0,
  setCurrentProject: (projectId) => {
    const { currentProjectId } = get();
    if (projectId === currentProjectId) return;
    set({
      currentProjectId: projectId,
      currentSessionIndex: 0,
      expandedPanel: "cockpit",
      editorContent: "",
      isDirty: false,
      preCheckResult: null
    });
  },
  setCurrentSession: (sessionIndex) => {
    const { currentSessionIndex } = get();
    if (sessionIndex === currentSessionIndex) return;
    set({
      currentSessionIndex: sessionIndex,
      expandedPanel: "cockpit",
      editorContent: "",
      isDirty: false,
      preCheckResult: null,
      ghostSuggestion: null
    });
  },
  setExpandedPanel: (panel) => {
    set({ expandedPanel: panel });
  },
  setEditorContent: (content) => {
    set({
      editorContent: content,
      isDirty: true,
      ghostSuggestion: null
      // Clear ghost suggestion when typing
    });
  },
  markSaved: () => {
    set({
      isDirty: false,
      lastSaved: (/* @__PURE__ */ new Date()).toISOString()
    });
  },
  runPreCheck: async (artifactId, rubrics) => {
    set({ isRunningPreCheck: true });
    const { editorContent } = get();
    try {
      const serverRubrics = (rubrics || []).map((r) => ({
        id: r.id,
        criteria: r.criterion,
        description: r.description,
        weight: r.weight
      }));
      const aiResult = await runExplorerPrecheck({
        data: {
          content: editorContent,
          rubrics: serverRubrics
        }
      });
      const result = {
        id: `pc_${Date.now()}`,
        overallStatus: aiResult.overallScore,
        score: aiResult.score,
        items: aiResult.items.map((item, idx) => ({
          id: item.id || `pc_item_${idx}`,
          rubricItemId: "",
          severity: item.severity,
          message: item.message,
          suggestion: item.suggestion || ""
        })),
        generatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (artifactId) {
        try {
          await storePrecheckResults({
            data: {
              artifactId,
              overallScore: result.overallStatus,
              feedback: result.items.map((item) => ({
                severity: item.severity,
                message: item.message,
                suggestion: item.suggestion
              })),
              rubricScores: aiResult.rubricScores,
              contentSnapshot: editorContent
            }
          });
        } catch (error) {
          console.error("Failed to store pre-check results:", error);
        }
      }
      set({
        isRunningPreCheck: false,
        preCheckResult: result
      });
      return result;
    } catch (error) {
      console.error("Pre-check error:", error);
      const result = {
        id: `pc_${Date.now()}`,
        overallStatus: "needs_work",
        score: 0,
        items: [{
          id: "pc_error",
          rubricItemId: "",
          severity: "warning",
          message: "Pre-check could not be completed. Please try again.",
          suggestion: "Check your connection and retry."
        }],
        generatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      set({
        isRunningPreCheck: false,
        preCheckResult: result
      });
      return result;
    }
  },
  clearPreCheck: () => {
    set({ preCheckResult: null });
  },
  setGhostSuggestion: (suggestion) => {
    set({ ghostSuggestion: suggestion });
  },
  acceptGhostSuggestion: () => {
    const { editorContent, ghostSuggestion } = get();
    if (ghostSuggestion) {
      set({
        editorContent: editorContent + ghostSuggestion,
        ghostSuggestion: null,
        isDirty: true
      });
    }
  },
  toggleGhostTyping: () => {
    set((state) => ({ isGhostTypingEnabled: !state.isGhostTypingEnabled }));
  },
  toggleResourceHub: () => {
    set((state) => ({ isResourceHubExpanded: !state.isResourceHubExpanded }));
  },
  setActionHandlers: (handlers) => {
    set({
      runPreCheckAction: handlers.runPreCheck,
      submitAction: handlers.submit
    });
  }
}));
function VoyageNavigator({ project }) {
  const { currentSessionIndex, setCurrentSession } = useActivityStore();
  const [, setTick] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const sessions = project.sessions;
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1e3);
    return () => clearInterval(timer);
  }, []);
  const findCurrentSessionByTime = () => {
    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i];
      if (!isValidDate(session.endDate)) continue;
      const endDate = new Date(session.endDate);
      if (isFuture(endDate)) {
        return i;
      }
    }
    return sessions.length - 1;
  };
  const activeSessionIndex = findCurrentSessionByTime();
  const getSessionStatus = (session, index) => {
    if (session.completedAt) return "completed";
    if (!isValidDate(session.endDate)) return "active";
    const endDate = new Date(session.endDate);
    if (index > activeSessionIndex) return "locked";
    if (isPast(endDate)) return "expired";
    if (index === activeSessionIndex) return "active";
    return "active";
  };
  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-green-500" });
      case "expired":
        return /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4 text-amber-500" });
      case "active":
        return /* @__PURE__ */ jsx(Play, { className: "w-4 h-4 text-cyan-500" });
      case "locked":
        return /* @__PURE__ */ jsx(Lock, { className: "w-4 h-4 text-muted-foreground" });
      default:
        return /* @__PURE__ */ jsx(Circle, { className: "w-4 h-4 text-muted-foreground" });
    }
  };
  const renderSessionList = (inModal = false) => /* @__PURE__ */ jsx(ScrollArea, { className: inModal ? "h-[60vh]" : "h-[200px]", children: /* @__PURE__ */ jsx("div", { className: "space-y-1", children: sessions.map((session, index) => {
    const status = getSessionStatus(session, index);
    const isCurrent = index === currentSessionIndex;
    const isLocked = index > activeSessionIndex;
    return /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => !isLocked && setCurrentSession(index),
        disabled: isLocked,
        className: cn(
          "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors",
          isLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/50",
          isCurrent && "bg-cyan-500/10 border border-cyan-500/30"
        ),
        children: [
          /* @__PURE__ */ jsx("div", { className: cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-xs",
            isLocked ? "bg-muted/50" : "bg-muted"
          ), children: index + 1 }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsx("p", { className: cn(
              "text-sm font-medium truncate",
              isCurrent && "text-cyan-400",
              isLocked && "text-muted-foreground"
            ), children: session.title }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: safeFormatDate(session.startDate, "MMM d HH:mm") })
          ] }),
          getStatusIcon(status)
        ]
      },
      session.id
    );
  }) }) });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [
        /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "Voyage Navigator" }),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            className: "h-7 w-7",
            onClick: () => setIsExpanded(true),
            children: /* @__PURE__ */ jsx(Maximize2, { className: "h-4 w-4" })
          }
        )
      ] }),
      /* @__PURE__ */ jsx(CardContent, { children: renderSessionList(false) })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: isExpanded, onOpenChange: setIsExpanded, children: /* @__PURE__ */ jsxs(
      DialogContent,
      {
        className: "max-w-4xl",
        overlayClassName: "backdrop-blur-sm",
        showCloseButton: false,
        children: [
          /* @__PURE__ */ jsxs(DialogHeader, { className: "flex flex-row items-center justify-between", children: [
            /* @__PURE__ */ jsx(DialogTitle, { children: "Voyage Navigator" }),
            /* @__PURE__ */ jsx(DialogClose, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }) }) })
          ] }),
          renderSessionList(true)
        ]
      }
    ) })
  ] });
}
function ResourcdHub({ session }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const renderGuide = () => /* @__PURE__ */ jsx("div", { className: "space-y-2 text-sm text-foreground/80 leading-relaxed", children: session.guide.split("\n").map((paragraph, index) => {
    if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
      return /* @__PURE__ */ jsx("p", { className: "text-sm text-foreground", children: paragraph.replace(/\*\*/g, "") }, index);
    }
    if (paragraph.startsWith("- ")) {
      return /* @__PURE__ */ jsx("li", { className: "ml-4 list-disc", children: paragraph.substring(2) }, index);
    }
    if (paragraph.trim()) {
      return /* @__PURE__ */ jsx("p", { children: paragraph }, index);
    }
    return /* @__PURE__ */ jsx("br", {}, index);
  }) });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(Card, { className: "max-h-[390px] overflow-hidden", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [
        /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "Guide" }),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            className: "h-7 w-7",
            onClick: () => setIsExpanded(true),
            children: /* @__PURE__ */ jsx(Maximize2, { className: "h-4 w-4" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4 overflow-auto pr-4 scrollbar-none", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Title" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-foreground mt-1", children: session.title })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Objective" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-foreground mt-1", children: session.topic || "No objective provided" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Guide" }),
          /* @__PURE__ */ jsx("div", { className: "text-sm text-foreground mt-1", children: renderGuide() })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: isExpanded, onOpenChange: setIsExpanded, children: /* @__PURE__ */ jsxs(
      DialogContent,
      {
        className: "max-w-4xl",
        overlayClassName: "backdrop-blur-sm",
        showCloseButton: false,
        children: [
          /* @__PURE__ */ jsxs(DialogHeader, { className: "flex flex-row items-center justify-between", children: [
            /* @__PURE__ */ jsx(DialogTitle, { className: "text-sm", children: "Guide" }),
            /* @__PURE__ */ jsx(DialogClose, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }) }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Title" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-foreground mt-1", children: session.title })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Objective" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-foreground/80 mt-1", children: session.topic || "No objective provided" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Guide" }),
              renderGuide()
            ] })
          ] })
        ]
      }
    ) })
  ] });
}
function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Separator$1.Root,
    {
      "data-slot": "separator",
      decorative,
      orientation,
      className: cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      ),
      ...props
    }
  );
}
function logYjs(...args) {
  {
    console.log("[yjs-ws]", ...args);
  }
}
const roomProviders = /* @__PURE__ */ new Map();
function resolveYjsUrl() {
  if (typeof window !== "undefined") {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}/ws/yjs`;
  }
  return "ws://localhost:3000/ws/yjs";
}
function acquireRoomProvider(roomName) {
  const existing = roomProviders.get(roomName);
  if (existing) {
    if (existing.destroyTimer) {
      clearTimeout(existing.destroyTimer);
      existing.destroyTimer = null;
    }
    existing.refCount += 1;
    return { ydoc: existing.ydoc, provider: existing.provider };
  }
  const ydoc = new Y.Doc();
  const provider = new WebsocketProvider(resolveYjsUrl(), roomName, ydoc, { connect: false });
  roomProviders.set(roomName, {
    ydoc,
    provider,
    refCount: 1,
    destroyTimer: null
  });
  return { ydoc, provider };
}
function releaseRoomProvider(roomName) {
  const entry = roomProviders.get(roomName);
  if (!entry) return;
  entry.refCount -= 1;
  if (entry.refCount > 0) return;
  entry.destroyTimer = window.setTimeout(() => {
    const latest = roomProviders.get(roomName);
    if (!latest || latest.refCount > 0) return;
    latest.provider.disconnect();
    latest.provider.destroy();
    latest.ydoc.destroy();
    roomProviders.delete(roomName);
    logYjs("room provider destroyed", { roomName });
  }, 1500);
}
const CURSOR_COLORS = [
  "#f87171",
  // red
  "#fb923c",
  // orange
  "#facc15",
  // yellow
  "#4ade80",
  // green
  "#22d3ee",
  // cyan
  "#818cf8",
  // indigo
  "#c084fc",
  // purple
  "#f472b6"
  // pink
];
function getCursorColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}
function getBaseExtensions(isCollaborative) {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: {
        openOnClick: false,
        HTMLAttributes: {
          class: "text-cyan-500 underline cursor-pointer"
        }
      },
      // Disable built-in undo/redo when collaborative — Yjs handles it
      ...isCollaborative ? { undoRedo: false } : {}
    }),
    Highlight,
    TaskList,
    TaskItem.configure({ nested: true }),
    Placeholder.configure({
      placeholder: "Start writing your response..."
    })
  ];
}
function RichTextEditor({ roomName, user, initialContent, onChange }) {
  if (roomName) {
    return /* @__PURE__ */ jsx(
      CollaborativeEditor,
      {
        roomName,
        user,
        initialContent,
        onChange
      }
    );
  }
  return /* @__PURE__ */ jsx(SimpleEditor, { initialContent, onChange });
}
function SimpleEditor({
  initialContent,
  onChange
}) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const editor = useEditor({
    extensions: getBaseExtensions(false),
    content: initialContent || "",
    editorProps: {
      attributes: {
        class: "focus:outline-none h-full p-4"
      }
    },
    onUpdate: ({ editor: editor2 }) => {
      const html = editor2.getHTML();
      queueMicrotask(() => {
        onChangeRef.current?.(html);
      });
    }
  });
  useEffect(() => {
    if (editor && initialContent !== void 0 && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent, { emitUpdate: false });
    }
  }, [initialContent, editor]);
  if (!editor) return null;
  return /* @__PURE__ */ jsx(EditorShell, { editor });
}
function CollaborativeEditor({
  roomName,
  user,
  initialContent,
  onChange
}) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const initialContentRef = useRef(initialContent);
  initialContentRef.current = initialContent;
  const hasSeededInitialContentRef = useRef(false);
  const debugUserName = user?.name || "Anonymous";
  const { ydoc, provider } = useMemo(() => {
    return acquireRoomProvider(roomName);
  }, [roomName]);
  useEffect(() => {
    let cancelled = false;
    hasSeededInitialContentRef.current = false;
    logYjs("mount", { roomName, userName: debugUserName });
    const connectTimer = window.setTimeout(() => {
      if (!cancelled) {
        logYjs("connect()", { roomName, userName: debugUserName });
        provider.connect();
      }
    }, 0);
    const handleSync = (isSynced) => {
      if (!isSynced) return;
      const fragment = ydoc.getXmlFragment("default");
      const contentToSeed = initialContentRef.current;
      if (!hasSeededInitialContentRef.current && fragment.length === 0 && contentToSeed) {
        logYjs("seeding initial content", { roomName, userName: debugUserName, length: contentToSeed.length });
        seedYDocFromHTML(ydoc, contentToSeed);
        hasSeededInitialContentRef.current = true;
      }
      provider.off("sync", handleSync);
      logYjs("sync event", { roomName, userName: debugUserName, isSynced, fragmentLength: fragment.length });
    };
    if (provider.synced) {
      handleSync(true);
    } else {
      provider.on("sync", handleSync);
    }
    const handleStatus = ({ status }) => {
      logYjs("status", { roomName, userName: debugUserName, status });
    };
    provider.on("status", handleStatus);
    return () => {
      cancelled = true;
      logYjs("cleanup", { roomName, userName: debugUserName });
      window.clearTimeout(connectTimer);
      provider.off("sync", handleSync);
      provider.off("status", handleStatus);
      provider.disconnect();
      releaseRoomProvider(roomName);
    };
  }, [ydoc, provider, roomName, debugUserName]);
  const cursorUser = useMemo(() => ({
    name: user?.name || "Anonymous",
    color: user?.color || getCursorColor(user?.name || "Anonymous")
  }), [user]);
  useEffect(() => {
    provider.awareness.setLocalStateField("user", cursorUser);
  }, [provider, cursorUser]);
  const editor = useEditor({
    extensions: [
      ...getBaseExtensions(true),
      Collaboration.configure({
        document: ydoc
      }),
      Extension.create({
        name: "collaborationCursor",
        addProseMirrorPlugins() {
          return [
            yCursorPlugin(
              provider.awareness,
              {
                cursorBuilder: (awarenessUser) => {
                  const cursor = document.createElement("span");
                  cursor.classList.add("collaboration-cursor__caret");
                  cursor.style.borderColor = awarenessUser.color || "#06b6d4";
                  const label = document.createElement("div");
                  label.classList.add("collaboration-cursor__label");
                  label.style.backgroundColor = awarenessUser.color || "#06b6d4";
                  label.textContent = awarenessUser.name || "Anonymous";
                  cursor.appendChild(label);
                  return cursor;
                },
                selectionBuilder: (awarenessUser) => {
                  const color = awarenessUser.color || "#06b6d4";
                  return {
                    class: "collaboration-cursor__selection",
                    style: `background-color: ${color}`
                  };
                }
              }
            )
          ];
        }
      })
    ],
    editorProps: {
      attributes: {
        class: "focus:outline-none h-full p-4"
      }
    },
    onUpdate: ({ editor: editor2 }) => {
      const html = editor2.getHTML();
      queueMicrotask(() => {
        onChangeRef.current?.(html);
      });
    }
  }, [ydoc, provider]);
  if (!editor) return null;
  return /* @__PURE__ */ jsx(EditorShell, { editor });
}
function EditorShell({ editor }) {
  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);
  if (!editor) return null;
  return /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col border rounded-lg overflow-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 p-2 border-b bg-muted/30 overflow-x-auto scrollbar-none", children: [
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => editor.chain().focus().undo().run(),
          disabled: !editor.can().chain().focus().undo().run(),
          className: "h-8 w-8 p-0",
          children: /* @__PURE__ */ jsx(Undo2, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => editor.chain().focus().redo().run(),
          disabled: !editor.can().chain().focus().redo().run(),
          className: "h-8 w-8 p-0",
          children: /* @__PURE__ */ jsx(Redo2, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsx(Separator, { orientation: "vertical", className: "mx-1 h-6" }),
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => editor.chain().focus().toggleBold().run(),
          className: cn("h-8 w-8 p-0", editor.isActive("bold") && "bg-muted"),
          children: /* @__PURE__ */ jsx(Bold, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => editor.chain().focus().toggleItalic().run(),
          className: cn("h-8 w-8 p-0", editor.isActive("italic") && "bg-muted"),
          children: /* @__PURE__ */ jsx(Italic, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => editor.chain().focus().toggleUnderline().run(),
          className: cn("h-8 w-8 p-0", editor.isActive("underline") && "bg-muted"),
          children: /* @__PURE__ */ jsx(Underline, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => editor.chain().focus().toggleStrike().run(),
          className: cn("h-8 w-8 p-0", editor.isActive("strike") && "bg-muted"),
          children: /* @__PURE__ */ jsx(Strikethrough, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => editor.chain().focus().toggleCode().run(),
          className: cn("h-8 w-8 p-0", editor.isActive("code") && "bg-muted"),
          children: /* @__PURE__ */ jsx(Code, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => editor.chain().focus().toggleHighlight().run(),
          className: cn("h-8 w-8 p-0", editor.isActive("highlight") && "bg-muted"),
          children: /* @__PURE__ */ jsx(Highlighter, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: setLink,
          className: cn("h-8 w-8 p-0", editor.isActive("link") && "bg-muted"),
          children: /* @__PURE__ */ jsx(Link, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsx(Separator, { orientation: "vertical", className: "mx-1 h-6" }),
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
          className: cn("h-8 w-8 p-0", editor.isActive("heading", { level: 1 }) && "bg-muted"),
          children: /* @__PURE__ */ jsx(Heading1, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          className: cn("h-8 w-8 p-0", editor.isActive("heading", { level: 2 }) && "bg-muted"),
          children: /* @__PURE__ */ jsx(Heading2, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          className: cn("h-8 w-8 p-0", editor.isActive("heading", { level: 3 }) && "bg-muted"),
          children: /* @__PURE__ */ jsx(Heading3, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsx(Separator, { orientation: "vertical", className: "mx-1 h-6" }),
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => editor.chain().focus().toggleBulletList().run(),
          className: cn("h-8 w-8 p-0", editor.isActive("bulletList") && "bg-muted"),
          children: /* @__PURE__ */ jsx(List, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => editor.chain().focus().toggleOrderedList().run(),
          className: cn("h-8 w-8 p-0", editor.isActive("orderedList") && "bg-muted"),
          children: /* @__PURE__ */ jsx(ListOrdered, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => editor.chain().focus().toggleTaskList().run(),
          className: cn("h-8 w-8 p-0", editor.isActive("taskList") && "bg-muted"),
          children: /* @__PURE__ */ jsx(ListTodo, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => editor.chain().focus().toggleBlockquote().run(),
          className: cn("h-8 w-8 p-0", editor.isActive("blockquote") && "bg-muted"),
          children: /* @__PURE__ */ jsx(Quote, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => editor.chain().focus().toggleCodeBlock().run(),
          className: cn("h-8 w-8 p-0", editor.isActive("codeBlock") && "bg-muted"),
          children: /* @__PURE__ */ jsx(SquareCode, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => editor.chain().focus().setHorizontalRule().run(),
          className: "h-8 w-8 p-0",
          children: /* @__PURE__ */ jsx(Minus, { className: "h-4 w-4" })
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-0 overflow-auto", children: /* @__PURE__ */ jsx(EditorContent, { editor, className: "h-full" }) })
  ] });
}
function seedYDocFromHTML(ydoc, html) {
  const fragment = ydoc.getXmlFragment("default");
  if (fragment.length > 0) return;
  const div = typeof document !== "undefined" ? document.createElement("div") : null;
  if (div) {
    div.innerHTML = html;
    const text = div.textContent || div.innerText || "";
    if (text.trim()) {
      const yText = new Y.XmlText();
      yText.insert(0, text);
      const yElement = new Y.XmlElement("paragraph");
      yElement.insert(0, [yText]);
      fragment.insert(0, [yElement]);
    }
  }
}
function SmartOutputBuilder({ project: _project, session, teamId, userName }) {
  const [artifact, setArtifact] = useState(null);
  const [, setIsLoadingArtifact] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitted, setShowSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAutoSaved, setShowAutoSaved] = useState(false);
  const [showLateSubmitDialog, setShowLateSubmitDialog] = useState(false);
  const [lastSubmittedAt, setLastSubmittedAt] = useState(null);
  const { currentUser, addXP } = useAuthStore();
  const {
    editorContent,
    setEditorContent,
    isDirty,
    markSaved,
    isRunningPreCheck,
    preCheckResult,
    runPreCheck,
    clearPreCheck,
    setActionHandlers
  } = useActivityStore();
  const handleSaveRef = useRef(() => Promise.resolve(null));
  useEffect(() => {
    async function loadArtifact() {
      if (!currentUser || !teamId) return;
      setIsLoadingArtifact(true);
      try {
        const result = await getTeamSessionArtifact({
          data: { teamId, sessionId: session.id }
        });
        if (result.success && result.artifact) {
          const a = result.artifact;
          setArtifact({
            id: a.id,
            title: a.title,
            content: a.content ?? null,
            status: a.status,
            versionCount: a.versionCount,
            latestVersion: a.latestVersion,
            lastSubmittedAt: a.lastSubmittedAt ?? null
          });
          setLastSubmittedAt(a.lastSubmittedAt ?? null);
          setEditorContent(a.content || "");
          markSaved();
        } else {
          setArtifact(null);
          setLastSubmittedAt(null);
          setEditorContent("");
          markSaved();
        }
      } catch (error) {
        console.error("Failed to load artifact:", error);
        setArtifact(null);
        setLastSubmittedAt(null);
        setEditorContent("");
      } finally {
        setIsLoadingArtifact(false);
        clearPreCheck();
      }
    }
    loadArtifact();
  }, [session.id, teamId, currentUser, setEditorContent, clearPreCheck, markSaved]);
  const handleSave = useCallback(async (options) => {
    const silent = options?.silent ?? false;
    if (!currentUser || !teamId) {
      if (!silent) toast.error("Unable to save", { description: "Missing user or team context." });
      return null;
    }
    const contentToSave = editorContent;
    setIsSaving(true);
    try {
      if (artifact) {
        const result = await updateArtifact({
          data: { artifactId: artifact.id, content: contentToSave }
        });
        if (result.success) {
          markSaved();
          if (!silent) toast.success("Saved");
          return artifact.id;
        } else {
          toast.error("Failed to save", { description: result.error });
          return null;
        }
      } else {
        const result = await createArtifact({
          data: {
            userId: currentUser.id,
            sessionId: session.id,
            teamId,
            title: `${session.title} - Draft`,
            content: contentToSave,
            contentType: "document"
          }
        });
        if (result.success && result.artifactId) {
          setArtifact({
            id: result.artifactId,
            title: `${session.title} - Draft`,
            content: contentToSave,
            status: "draft",
            versionCount: 0,
            latestVersion: null
          });
          markSaved();
          if (!silent) toast.success("Saved");
          return result.artifactId;
        } else {
          toast.error("Failed to save", { description: result.error });
          return null;
        }
      }
    } catch (error) {
      toast.error("Failed to save");
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [artifact, editorContent, currentUser, session, teamId, markSaved]);
  handleSaveRef.current = handleSave;
  useEffect(() => {
    if (!isDirty || !currentUser) return;
    const timeout = setTimeout(async () => {
      await handleSaveRef.current({ silent: true });
      setShowAutoSaved(true);
    }, 3e3);
    return () => clearTimeout(timeout);
  }, [editorContent, isDirty, currentUser]);
  useEffect(() => {
    if (showAutoSaved) {
      const timeout = setTimeout(() => setShowAutoSaved(false), 2e3);
      return () => clearTimeout(timeout);
    }
  }, [showAutoSaved]);
  useEffect(() => {
    if (!teamId) return;
    let isActive = true;
    const syncSubmissionState = async () => {
      try {
        const result = await getTeamSessionArtifact({
          data: { teamId, sessionId: session.id }
        });
        if (!isActive || !result.success) return;
        const remote = result.artifact;
        if (!remote) {
          setArtifact((prev) => prev ? null : prev);
          setLastSubmittedAt(null);
          return;
        }
        setLastSubmittedAt(remote.lastSubmittedAt ?? null);
        setArtifact((prev) => {
          if (!prev) {
            return {
              id: remote.id,
              title: remote.title,
              content: remote.content ?? null,
              status: remote.status,
              versionCount: remote.versionCount,
              latestVersion: remote.latestVersion,
              lastSubmittedAt: remote.lastSubmittedAt ?? null
            };
          }
          if (prev.id === remote.id && prev.status === remote.status && prev.latestVersion === remote.latestVersion && prev.versionCount === remote.versionCount && (prev.lastSubmittedAt ?? null) === (remote.lastSubmittedAt ?? null)) {
            return prev;
          }
          return {
            ...prev,
            id: remote.id,
            status: remote.status,
            latestVersion: remote.latestVersion,
            versionCount: remote.versionCount,
            lastSubmittedAt: remote.lastSubmittedAt ?? null
          };
        });
      } catch {
      }
    };
    const interval = setInterval(syncSubmissionState, 3e3);
    void syncSubmissionState();
    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [teamId, session.id]);
  const handleRunPreCheck = useCallback(async () => {
    const rubrics = session.rubric.length > 0 ? session.rubric : void 0;
    const result = await runPreCheck(artifact?.id, rubrics);
    if (result.overallStatus === "critical_issues") {
      toast.warning("Pre-check found critical issues", {
        description: "Please review the feedback before submitting."
      });
    } else if (result.overallStatus === "needs_work") {
      toast.info("Pre-check complete", {
        description: "Review the suggestions to improve your work."
      });
    } else {
      toast.success("Looking good!", {
        description: "Your work is ready for submission."
      });
    }
  }, [runPreCheck, session.rubric, artifact?.id]);
  const submitArtifact$1 = useCallback(async () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      const savedArtifactId = await handleSave({ silent: true });
      const artifactId = savedArtifactId || artifact?.id;
      if (!artifactId) {
        toast.error("Please save your work first");
        return;
      }
      const result = await submitArtifact({
        data: { artifactId, userId: currentUser.id }
      });
      if (result.success) {
        addXP(20);
        setShowSubmitted(true);
        setTimeout(() => setShowSubmitted(false), 2e3);
        setArtifact((prev) => prev ? {
          ...prev,
          status: "submitted",
          latestVersion: result.version || null,
          versionCount: (prev.versionCount || 0) + 1,
          lastSubmittedAt: (/* @__PURE__ */ new Date()).toISOString()
        } : null);
        setLastSubmittedAt((/* @__PURE__ */ new Date()).toISOString());
      } else {
        toast.error("Failed to submit", { description: result.error });
      }
    } catch (error) {
      toast.error("Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  }, [currentUser, artifact, handleSave, addXP]);
  const formattedLastSubmittedAt = lastSubmittedAt ? new Date(lastSubmittedAt).toLocaleString() : null;
  const isDeliverableNone = session.deliverableType === "none";
  const isLateSubmission = isValidDate(session.endDate) && isPast(new Date(session.endDate));
  const handleSubmit = useCallback(async () => {
    if (isDeliverableNone) return;
    if (isLateSubmission) {
      setShowLateSubmitDialog(true);
      return;
    }
    await submitArtifact$1();
  }, [isDeliverableNone, isLateSubmission, submitArtifact$1]);
  useEffect(() => {
    setActionHandlers({
      runPreCheck: handleRunPreCheck,
      submit: handleSubmit
    });
    return () => {
      setActionHandlers({
        runPreCheck: void 0,
        submit: void 0
      });
    };
  }, [handleRunPreCheck, handleSubmit, setActionHandlers]);
  return /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col p-0 min-h-0", children: [
      /* @__PURE__ */ jsx("div", { className: "shrink-0 pb-6", children: /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-border bg-muted/30 p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleRunPreCheck,
              disabled: isDeliverableNone || isRunningPreCheck,
              className: cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                "bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white",
                "disabled:opacity-40 disabled:cursor-not-allowed"
              ),
              children: [
                isRunningPreCheck ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4" }),
                /* @__PURE__ */ jsx("span", { children: isRunningPreCheck ? "Checking..." : "Pre-check" })
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleSave(),
              disabled: isDeliverableNone || isSaving,
              className: cn(
                "flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                "border border-border/50 hover:bg-accent",
                "disabled:opacity-40 disabled:cursor-not-allowed"
              ),
              children: /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" })
            }
          ),
          showAutoSaved && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-xs font-medium text-emerald-500", children: [
            /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3" }),
            "Auto saved"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          formattedLastSubmittedAt && /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
            "Last submitted: ",
            formattedLastSubmittedAt
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleSubmit,
              disabled: isDeliverableNone || isSubmitting,
              className: cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out",
                "border border-border/50 bg-foreground text-background hover:opacity-90 active:scale-[0.97]",
                showSubmitted && "bg-emerald-500 border-emerald-500 text-white",
                "disabled:cursor-not-allowed",
                !showSubmitted && !isSubmitting && "disabled:opacity-40"
              ),
              children: [
                isSubmitting ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Send, { className: "w-4 h-4" }),
                /* @__PURE__ */ jsx("span", { children: showSubmitted ? "Submitted" : "Submit" })
              ]
            }
          )
        ] })
      ] }) }) }),
      preCheckResult && /* @__PURE__ */ jsx("div", { className: "shrink-0 pb-6", children: /* @__PURE__ */ jsx(PreCheckResults, { result: preCheckResult, onClear: clearPreCheck }) }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-0 rounded-xl", children: session.deliverableType === "none" ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-full text-muted-foreground", children: /* @__PURE__ */ jsx("p", { children: "No deliverable required for this session." }) }) : /* @__PURE__ */ jsx(
        RichTextEditor,
        {
          roomName: teamId ? `team_${teamId}_session_${session.id}` : void 0,
          user: userName ? { name: userName } : void 0,
          initialContent: editorContent,
          onChange: setEditorContent
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: showLateSubmitDialog, onOpenChange: setShowLateSubmitDialog, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-md border-amber-500/40", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { className: "text-amber-500", children: "Late submission" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "This session has passed its end time. Submitting now will be marked as late." })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setShowLateSubmitDialog(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(
          Button,
          {
            className: "bg-amber-500 text-white hover:bg-amber-600",
            onClick: async () => {
              setShowLateSubmitDialog(false);
              await submitArtifact$1();
            },
            children: "Submit Late"
          }
        )
      ] })
    ] }) })
  ] });
}
function PreCheckResults({ result, onClear }) {
  const statusConfig = {
    ready: {
      accent: "text-emerald-600 dark:text-emerald-400",
      icon: /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4" }),
      label: "Ready"
    },
    needs_work: {
      accent: "text-amber-600 dark:text-amber-400",
      icon: /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4" }),
      label: "Needs Work"
    },
    critical_issues: {
      accent: "text-red-600 dark:text-red-400",
      icon: /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4" }),
      label: "Critical"
    }
  };
  const config = statusConfig[result.overallStatus];
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-muted/30 p-4 space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: cn("flex items-center gap-2", config.accent), children: [
          config.icon,
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: config.label })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-border/50" }),
        /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground", children: [
          "Score ",
          /* @__PURE__ */ jsx("span", { className: "font-semibold text-foreground", children: result.score }),
          "/100"
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onClear,
          className: "w-6 h-6 rounded-full hover:bg-background/60 flex items-center justify-center transition-colors",
          children: /* @__PURE__ */ jsx(X, { className: "h-3.5 w-3.5 text-muted-foreground" })
        }
      )
    ] }),
    result.items.length > 0 && /* @__PURE__ */ jsx("div", { className: "space-y-2", children: result.items.map((item) => /* @__PURE__ */ jsx(
      "div",
      {
        className: cn(
          "rounded-lg px-3 py-2.5 bg-background border border-border/50",
          item.severity === "critical" && "border-red-500/30"
        ),
        children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
          item.severity === "critical" && /* @__PURE__ */ jsx(AlertTriangle, { className: "w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1 min-w-0", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-foreground leading-snug", children: item.message }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground leading-relaxed", children: item.suggestion })
          ] })
        ] })
      },
      item.id
    )) })
  ] });
}
const PLATFORM_FAQ = [
  "Join codes are 6-character alphanumeric codes provided by instructors to join projects.",
  "Each project has multiple sessions. Complete sessions in order by submitting artifacts.",
  "Artifacts are your work submissions - documents, code, or markdown files.",
  "Pre-check reviews your artifact before final submission to catch issues early.",
  "Team chat allows collaboration with your project teammates and AI assistants.",
  "XP (experience points) are earned by submitting artifacts, completing sessions, and engaging with the platform.",
  "Levels are earned by accumulating XP: Newcomer (L1), Learner (L2), Explorer (L3), Navigator (L4), Pioneer (L5), Master (L6).",
  "Badges are achievements earned for milestones, engagement, collaboration, and competency growth.",
  "The portfolio section shows all your completed artifacts and competency scores.",
  "Competencies tracked: Critical Thinking, Communication, Collaboration, Creativity, Problem Solving."
];
function buildUserContextString() {
  const authStore = useAuthStore.getState();
  const projectStore = useProjectStore.getState();
  const currentUser = authStore.currentUser;
  if (!currentUser) {
    return `
USER CONTEXT:
- Not logged in

PLATFORM FAQ:
${PLATFORM_FAQ.map((faq, i) => `${i + 1}. ${faq}`).join("\n")}
`;
  }
  const userProjects = projectStore.userProjects ?? [];
  const openedProjects = userProjects.filter(
    (p) => getProjectTimeStatus(p.startDate, p.endDate) === "opened"
  );
  const closedProjects = userProjects.filter(
    (p) => getProjectTimeStatus(p.startDate, p.endDate) === "closed"
  );
  const userArtifacts = [];
  const projectDetails = openedProjects.slice(0, 3).map((project) => {
    return `  - "${project.title}": ${project.sessionCount} sessions`;
  }).join("\n");
  const artifactStats = {
    total: userArtifacts.length,
    submitted: userArtifacts.filter((a) => a.status === "submitted" || a.status === "under_review").length,
    approved: userArtifacts.filter((a) => a.status === "approved").length,
    needsRevision: userArtifacts.filter((a) => a.status === "needs_revision").length,
    draft: userArtifacts.filter((a) => a.status === "draft").length
  };
  const workspaceMode = openedProjects.length === 0 ? "onboarding" : "active";
  return `
USER CONTEXT:
- Name: ${currentUser.name}
- Roles: ${currentUser.role.join(", ")}
- Level: ${currentUser.level} (${currentUser.xp} XP)

WORKSPACE STATUS:
- Mode: ${workspaceMode}
- Total Projects: ${userProjects.length}
- Opened Projects: ${openedProjects.length}
- Closed Projects: ${closedProjects.length}

${openedProjects.length > 0 ? `CURRENT PROJECTS:
${projectDetails}` : "No opened projects - user needs to join a project using a join code."}

ARTIFACT PROGRESS:
- Total Artifacts: ${artifactStats.total}
- In Draft: ${artifactStats.draft}
- Submitted: ${artifactStats.submitted}
- Approved: ${artifactStats.approved}
- Needs Revision: ${artifactStats.needsRevision}

PLATFORM FAQ:
${PLATFORM_FAQ.map((faq, i) => `${i + 1}. ${faq}`).join("\n")}

INSTRUCTIONS FOR ASSISTANT:
- Use the above context to provide personalized, relevant responses.
- If user is in onboarding mode, focus on helping them join their first project.
- If user has opened projects, help them with session progress and artifact submission.
- Reference specific project names and session details when relevant.
- Be encouraging and supportive of their learning journey.
`;
}
function getWsUrl() {
  if (typeof window === "undefined") return "ws://localhost:3000/ws/chat";
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws/chat`;
}
const WS_URL = getWsUrl();
let ws = null;
let reconnectTimer = null;
let connectWatchdogTimer = null;
let messageHandler = null;
const joinedRooms = /* @__PURE__ */ new Set();
let isManualDisconnect = false;
let hasAttachedWindowListeners = false;
let reconnectAttempt = 0;
let debugIdentity = {};
const pendingBroadcasts = [];
let connectionWaiters = [];
function logWs(...args) {
  {
    console.log("[chat-ws]", { ...debugIdentity }, ...args);
  }
}
function setWebSocketDebugIdentity(identity) {
  debugIdentity = {
    userId: identity.userId,
    userName: identity.userName
  };
  logWs("debug identity set");
}
function resolveAllWaiters() {
  const waiters = connectionWaiters;
  connectionWaiters = [];
  for (const { resolve } of waiters) {
    resolve();
  }
}
function flushPendingBroadcasts() {
  while (pendingBroadcasts.length > 0) {
    const item = pendingBroadcasts.shift();
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "chat_message",
        roomId: item.roomId,
        payload: item.message
      }));
    }
  }
}
function clearConnectWatchdog() {
  if (connectWatchdogTimer) {
    clearTimeout(connectWatchdogTimer);
    connectWatchdogTimer = null;
  }
}
function ensureWindowReconnectHooks() {
  if (typeof window === "undefined" || hasAttachedWindowListeners) return;
  window.addEventListener("online", () => {
    if (!isManualDisconnect) {
      connect();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (!isManualDisconnect && document.visibilityState === "visible") {
      connect();
    }
  });
  hasAttachedWindowListeners = true;
}
function connect() {
  if (typeof window === "undefined") return;
  if (isManualDisconnect) {
    logWs("connect skipped (manual disconnect)");
    return;
  }
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
    logWs("connect skipped (socket already active)", { readyState: ws.readyState });
    return;
  }
  try {
    ensureWindowReconnectHooks();
    ws = new WebSocket(WS_URL);
    logWs("connecting", { url: WS_URL, reconnectAttempt });
    clearConnectWatchdog();
    connectWatchdogTimer = setTimeout(() => {
      if (ws?.readyState === WebSocket.CONNECTING) {
        logWs("watchdog closing stuck CONNECTING socket");
        ws.close();
      }
    }, 8e3);
    ws.onopen = () => {
      clearConnectWatchdog();
      reconnectAttempt = 0;
      for (const roomId of joinedRooms) {
        ws?.send(JSON.stringify({ type: "join", roomId }));
      }
      flushPendingBroadcasts();
      resolveAllWaiters();
      logWs("open", { joinedRooms: Array.from(joinedRooms), pendingBroadcasts: pendingBroadcasts.length });
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "chat_message" && data.roomId && data.payload && messageHandler) {
          logWs("message received", { roomId: data.roomId, messageId: data.payload?.id });
          messageHandler(data.roomId, data.payload);
        }
      } catch {
      }
    };
    ws.onclose = (event) => {
      clearConnectWatchdog();
      ws = null;
      logWs("closed", { code: event.code, reason: event.reason || "(none)", wasClean: event.wasClean });
      scheduleReconnect();
    };
    ws.onerror = (event) => {
      clearConnectWatchdog();
      logWs("error", event);
      ws?.close();
    };
  } catch (error) {
    clearConnectWatchdog();
    logWs("connect threw", error);
    scheduleReconnect();
  }
}
function scheduleReconnect() {
  if (isManualDisconnect) {
    logWs("reconnect skipped (manual disconnect)");
    return;
  }
  if (reconnectTimer) {
    logWs("reconnect already scheduled");
    return;
  }
  const delay = Math.min(1e3 * Math.pow(2, reconnectAttempt), 1e4);
  reconnectAttempt += 1;
  logWs("schedule reconnect", { delayMs: delay, reconnectAttempt });
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, delay);
}
function waitForConnection(timeout = 5e3) {
  if (ws?.readyState === WebSocket.OPEN) {
    logWs("waitForConnection immediate resolve");
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      connectionWaiters = connectionWaiters.filter((w) => w.resolve !== wrappedResolve);
      logWs("waitForConnection timeout", { timeout });
      reject(new Error("WebSocket connection timeout"));
    }, timeout);
    const wrappedResolve = () => {
      clearTimeout(timer);
      resolve();
    };
    const wrappedReject = (err) => {
      clearTimeout(timer);
      reject(err);
    };
    connectionWaiters.push({ resolve: wrappedResolve, reject: wrappedReject });
    logWs("waitForConnection queued", { waiters: connectionWaiters.length });
    connect();
  });
}
function initWebSocket(onMessage) {
  isManualDisconnect = false;
  messageHandler = onMessage;
  logWs("init");
  connect();
}
async function joinRoom(roomId) {
  joinedRooms.add(roomId);
  logWs("join requested", { roomId, joinedRooms: Array.from(joinedRooms) });
  try {
    await waitForConnection();
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "join", roomId }));
      logWs("join sent", { roomId });
      return true;
    }
  } catch {
    console.warn(`WebSocket: timed out waiting to join room ${roomId}, will retry on reconnect`);
  }
  logWs("join deferred", { roomId });
  return false;
}
function leaveRoom(roomId) {
  joinedRooms.delete(roomId);
  logWs("leave requested", { roomId, joinedRooms: Array.from(joinedRooms) });
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "leave", roomId }));
    logWs("leave sent", { roomId });
  }
}
function broadcastMessage(roomId, message) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: "chat_message",
      roomId,
      payload: message
    }));
    logWs("broadcast sent", { roomId, messageId: message.id });
  } else {
    pendingBroadcasts.push({ roomId, message });
    logWs("broadcast queued", { roomId, messageId: message.id, pending: pendingBroadcasts.length });
  }
}
const BASE_SYSTEM_PROMPT = `You are a friendly and supportive Assistant for the Peabee platform. 
Your role is to help students navigate the platform, understand their projects, and provide guidance.

Key responsibilities:
- Help students join projects using join codes or invitation links
- Explain how the platform works (sessions, artifacts, team collaboration)
- Provide encouragement and guidance on their learning journey
- Answer questions clearly and concisely
- Reference the user's specific projects and progress when relevant

Keep responses friendly, concise (2-4 sentences usually), and encouraging. Use simple language appropriate for students.`;
async function callOpenRouter(messages) {
  try {
    const userContext = buildUserContextString();
    const fullSystemPrompt = `${BASE_SYSTEM_PROMPT}

${userContext}`;
    const aiModel = await getConfiguredAIModel();
    const result = await aiChatCompletion({
      data: {
        model: aiModel,
        messages: [
          { role: "system", content: fullSystemPrompt },
          ...messages
        ],
        max_tokens: 500,
        temperature: 0.7
      }
    });
    if (!result.success) {
      console.error("AI API error:", result.error);
      return "I'm having trouble connecting right now. Please try again in a moment.";
    }
    return result.content || "I'm sorry, I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("AI API error:", error);
    return "I'm having trouble connecting right now. Please try again in a moment.";
  }
}
const useChatStore = create((set, get) => {
  if (typeof window !== "undefined") {
    initWebSocket((roomId, message) => {
      get().receiveMessage(roomId, message);
    });
  }
  return {
    roomsByTeam: {},
    isLoadingRoom: false,
    messagesByRoom: {},
    isLoadingMessages: false,
    isFloatingBotOpen: false,
    floatingBotMessages: [],
    hasShownInitialGreeting: false,
    isBotTyping: false,
    getOrCreateRoom: async (projectId, teamId, userId, roomName) => {
      const cached = get().roomsByTeam[teamId];
      if (cached && cached.projectId === projectId) {
        if (get().isLoadingRoom) set({ isLoadingRoom: false });
        return cached;
      }
      set({ isLoadingRoom: true });
      try {
        const result = await getOrCreateRoom({
          data: { projectId, teamId, userId, roomName }
        });
        if (result.success && result.room) {
          const room = {
            id: result.room.id,
            projectId: result.room.projectId,
            teamId: result.room.teamId,
            name: result.room.name
          };
          set((state) => ({
            roomsByTeam: {
              ...state.roomsByTeam,
              [teamId]: room
            },
            isLoadingRoom: false
          }));
          return room;
        }
        set({ isLoadingRoom: false });
        return null;
      } catch (error) {
        console.error("Failed to get or create room:", error);
        set({ isLoadingRoom: false });
        return null;
      }
    },
    getRoomForTeam: (teamId) => {
      return get().roomsByTeam[teamId] || null;
    },
    getRoomMessages: (roomId) => {
      return get().messagesByRoom[roomId] || [];
    },
    fetchRoomMessages: async (roomId) => {
      const existing = get().messagesByRoom[roomId];
      if (!existing || existing.length === 0) {
        set({ isLoadingMessages: true });
      }
      try {
        const result = await getMessages({ data: { roomId, limit: 50 } });
        if (result.success && result.messages) {
          const serverMessages = result.messages.map((m) => ({
            id: m.id,
            roomId,
            senderId: m.sender?.id || "unknown",
            senderName: m.sender?.name || "Unknown",
            senderAvatar: m.sender?.avatarUrl || m.sender?.avatar || null,
            senderType: m.sender?.type === "ai" ? "ai" : "user",
            content: m.content,
            timestamp: m.createdAt
          }));
          set((state) => {
            const currentMessages = state.messagesByRoom[roomId] || [];
            const serverIds = new Set(serverMessages.map((m) => m.id));
            const pendingOptimistic = currentMessages.filter(
              (m) => m.id.startsWith("msg_") && !serverIds.has(m.id)
            );
            return {
              messagesByRoom: {
                ...state.messagesByRoom,
                [roomId]: [...serverMessages, ...pendingOptimistic]
              },
              isLoadingMessages: false
            };
          });
        }
      } catch (error) {
        console.error("Failed to fetch room messages:", error);
        set({ isLoadingMessages: false });
      }
    },
    sendMessage: async (roomId, message) => {
      const tempId = `msg_${Date.now()}`;
      const newMessage = {
        ...message,
        id: tempId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      set((state) => ({
        messagesByRoom: {
          ...state.messagesByRoom,
          [roomId]: [...state.messagesByRoom[roomId] || [], newMessage]
        }
      }));
      try {
        const result = await sendMessage({
          data: {
            roomId,
            userId: message.senderType === "user" ? message.senderId : void 0,
            personaId: message.senderType === "ai" ? message.senderId : void 0,
            content: message.content,
            type: "text"
          }
        });
        if (result.success && result.message) {
          const confirmedMessage = { ...newMessage, id: result.message.id };
          set((state) => ({
            messagesByRoom: {
              ...state.messagesByRoom,
              [roomId]: state.messagesByRoom[roomId]?.map(
                (m) => m.id === tempId ? confirmedMessage : m
              ) || []
            }
          }));
          broadcastMessage(roomId, confirmedMessage);
        }
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    },
    subscribeToRoom: async (roomId) => {
      const joinedImmediately = await joinRoom(roomId);
      if (!joinedImmediately) {
        setTimeout(() => {
          joinRoom(roomId);
        }, 2e3);
      }
    },
    unsubscribeFromRoom: (roomId) => {
      leaveRoom(roomId);
    },
    receiveMessage: (roomId, message) => {
      set((state) => {
        const existing = state.messagesByRoom[roomId] || [];
        if (existing.some((m) => m.id === message.id)) return state;
        return {
          messagesByRoom: {
            ...state.messagesByRoom,
            [roomId]: [...existing, message]
          }
        };
      });
    },
    toggleFloatingBot: () => {
      set((state) => ({ isFloatingBotOpen: !state.isFloatingBotOpen }));
    },
    openFloatingBot: () => {
      set({ isFloatingBotOpen: true });
    },
    closeFloatingBot: () => {
      set({ isFloatingBotOpen: false });
    },
    sendBotMessage: async (content, userId, userName) => {
      const userMessage = {
        id: `bot_msg_${Date.now()}`,
        roomId: "bot",
        senderId: userId,
        senderName: userName,
        senderAvatar: null,
        senderType: "user",
        content,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      set((state) => ({
        floatingBotMessages: [...state.floatingBotMessages, userMessage]
      }));
      try {
        await sendFloatingBotMessage({ data: { userId, role: "user", content } });
      } catch (error) {
        console.error("Failed to store user message:", error);
      }
      get().generateBotResponse(content, userId);
    },
    markInitialGreetingShown: () => {
      const greetingMessage = {
        id: "bot_greeting",
        roomId: "bot",
        senderId: "assistant",
        senderName: "Assistant",
        senderAvatar: null,
        senderType: "ai",
        content: "Hi! I'm here to help you get started. Have a join code or invitation link? I can help you join your first project!",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      set((state) => ({
        hasShownInitialGreeting: true,
        floatingBotMessages: [greetingMessage, ...state.floatingBotMessages]
      }));
    },
    loadFloatingBotHistory: async (userId) => {
      try {
        const result = await getFloatingBotMessages({ data: { userId, limit: 50 } });
        if (result.success && result.messages) {
          const messages = result.messages.map((m) => ({
            id: m.id,
            roomId: "bot",
            senderId: m.role === "assistant" ? "assistant" : userId,
            senderName: m.role === "assistant" ? "Learning Assistant" : "You",
            senderAvatar: null,
            senderType: m.role === "assistant" ? "ai" : "user",
            content: m.content,
            timestamp: m.createdAt
          }));
          set({ floatingBotMessages: messages });
        }
      } catch (error) {
        console.error("Failed to load floating bot history:", error);
      }
    },
    generateAIResponse: async (roomId, teamId) => {
      const messages = get().messagesByRoom[roomId] || [];
      const lastUserMessage = [...messages].reverse().find((m) => m.senderType === "user");
      if (!lastUserMessage) return;
      const conversationHistory = messages.slice(-10).map((msg) => ({
        role: msg.senderType === "ai" ? "assistant" : "user",
        content: msg.content
      }));
      try {
        let selectedPersona = { id: "ai_001", name: "Professor Sage" };
        if (teamId) {
          const personasResult = await getTeamPersonas({ data: { teamId } });
          const personas = personasResult.success ? personasResult.personas : [];
          if (personas[0]) {
            selectedPersona = personas[0];
          }
        }
        const response = await callOpenRouter(conversationHistory);
        const aiMessage = {
          id: `msg_ai_${Date.now()}`,
          roomId,
          senderId: selectedPersona.id,
          senderName: selectedPersona.name,
          senderAvatar: null,
          senderType: "ai",
          content: response,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
        set((state) => ({
          messagesByRoom: {
            ...state.messagesByRoom,
            [roomId]: [...state.messagesByRoom[roomId] || [], aiMessage]
          }
        }));
        await sendMessage({
          data: {
            roomId,
            personaId: selectedPersona.id,
            content: response,
            type: "text"
          }
        });
      } catch (error) {
        console.error("Failed to generate AI response:", error);
      }
    },
    generateBotResponse: async (userMessage, userId) => {
      set({ isBotTyping: true });
      try {
        const messages = get().floatingBotMessages;
        const conversationHistory = messages.map((msg) => ({
          role: msg.senderType === "ai" ? "assistant" : "user",
          content: msg.content
        }));
        conversationHistory.push({ role: "user", content: userMessage });
        const response = await callOpenRouter(conversationHistory);
        const botMessage = {
          id: `bot_msg_${Date.now()}`,
          roomId: "bot",
          senderId: "assistant",
          senderName: "Assistant",
          senderAvatar: null,
          senderType: "ai",
          content: response,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
        set((state) => ({
          floatingBotMessages: [...state.floatingBotMessages, botMessage],
          isBotTyping: false
        }));
        if (userId) {
          try {
            await sendFloatingBotMessage({ data: { userId, role: "assistant", content: response } });
          } catch (error) {
            console.error("Failed to store assistant message:", error);
          }
        }
      } catch (error) {
        console.error("Error generating bot response:", error);
        const errorMessage = {
          id: `bot_msg_${Date.now()}`,
          roomId: "bot",
          senderId: "assistant",
          senderName: "Assistant",
          senderAvatar: null,
          senderType: "ai",
          content: "I'm sorry, I encountered an error. Please try again.",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
        set((state) => ({
          floatingBotMessages: [...state.floatingBotMessages, errorMessage],
          isBotTyping: false
        }));
      }
    }
  };
});
function GroupChatPanel({ projectId, teamId, teamName }) {
  const [message, setMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef(null);
  const expandedScrollRef = useRef(null);
  const { currentUser } = useAuthStore();
  const currentUserId = currentUser?.id;
  const {
    getOrCreateRoom: getOrCreateRoom2,
    getRoomForTeam,
    getRoomMessages,
    fetchRoomMessages,
    sendMessage: sendChatMessage,
    subscribeToRoom,
    unsubscribeFromRoom,
    isLoadingRoom
  } = useChatStore();
  const room = getRoomForTeam(teamId);
  const messages = room ? getRoomMessages(room.id) : [];
  const prevMessageCountRef = useRef(0);
  useEffect(() => {
    if (!currentUserId || !projectId || !teamId) return;
    setWebSocketDebugIdentity({
      userId: currentUserId,
      userName: currentUser?.name
    });
    let cancelled = false;
    let roomId = null;
    let pollTimer = null;
    async function initRoom() {
      const resolvedRoom = await getOrCreateRoom2(projectId, teamId, currentUserId, teamName ? `${teamName} Chat` : void 0);
      if (!resolvedRoom || cancelled) return;
      roomId = resolvedRoom.id;
      await subscribeToRoom(resolvedRoom.id);
      if (cancelled) return;
      await fetchRoomMessages(resolvedRoom.id);
      if (!cancelled) {
        pollTimer = setInterval(() => {
          if (roomId) {
            fetchRoomMessages(roomId);
          }
        }, 15e3);
      }
    }
    initRoom();
    return () => {
      cancelled = true;
      if (pollTimer) {
        clearInterval(pollTimer);
      }
      if (roomId) {
        unsubscribeFromRoom(roomId);
      }
    };
  }, [projectId, teamId, currentUserId]);
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    if (isExpanded && expandedScrollRef.current) {
      expandedScrollRef.current.scrollTop = expandedScrollRef.current.scrollHeight;
    }
  }, [isExpanded]);
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      scrollToBottom();
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length, scrollToBottom]);
  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => {
        if (expandedScrollRef.current) {
          expandedScrollRef.current.scrollTop = expandedScrollRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [isExpanded]);
  const handleSend = () => {
    if (!message.trim() || !room || !currentUser) return;
    sendChatMessage(room.id, {
      roomId: room.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatarUrl,
      senderType: "user",
      content: message.trim()
    });
    setMessage("");
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const renderMessages = (scrollAreaRef, inModal = false) => /* @__PURE__ */ jsx(ScrollArea, { className: cn("flex-1 min-h-0", inModal && "h-[50vh]"), viewportRef: scrollAreaRef, children: /* @__PURE__ */ jsx("div", { className: "space-y-4 p-4", children: messages.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-8 text-sm text-muted-foreground", children: "No messages yet. Start the conversation!" }) : messages.map((msg) => /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "flex flex-col",
        msg.senderId === currentUser?.id ? "items-end" : "items-start"
      ),
      children: [
        msg.senderId !== currentUser?.id && /* @__PURE__ */ jsx(
          "span",
          {
            className: cn(
              "text-[11px] font-medium mb-0.5 ml-1",
              msg.senderType === "ai" ? "text-purple-400" : "text-muted-foreground"
            ),
            children: msg.senderName
          }
        ),
        /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(
              "rounded-2xl px-3 py-1.5 text-sm w-fit max-w-[80%]",
              msg.senderId === currentUser?.id ? "bg-cyan-600 text-white" : msg.senderType === "ai" ? "bg-purple-500/10 text-foreground border border-purple-500/20" : "bg-muted text-foreground"
            ),
            children: /* @__PURE__ */ jsx("p", { className: "whitespace-pre-wrap", children: msg.content })
          }
        ),
        msg.artifactCard && /* @__PURE__ */ jsxs("div", { className: cn(
          "mt-1 p-3 bg-muted/50 rounded-lg border text-left max-w-[80%]",
          msg.senderId === currentUser?.id && "ml-auto"
        ), children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium truncate", children: msg.artifactCard.title }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
            "From ",
            msg.artifactCard.sessionName
          ] })
        ] })
      ]
    },
    msg.id
  )) }) });
  const renderInput = () => /* @__PURE__ */ jsx("div", { className: "p-3 shrink-0 mt-auto", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-2", children: [
    /* @__PURE__ */ jsx(
      Input,
      {
        value: message,
        onChange: (e) => setMessage(e.target.value),
        onKeyDown: handleKeyDown,
        placeholder: "Type a message...",
        className: "flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2",
        disabled: !room
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: handleSend,
        disabled: !message.trim() || !room,
        className: cn(
          "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "disabled:opacity-40 disabled:cursor-not-allowed"
        ),
        children: /* @__PURE__ */ jsx(Send, { className: "h-4 w-4" })
      }
    )
  ] }) });
  if (isLoadingRoom && !room) {
    return /* @__PURE__ */ jsx(Card, { className: "h-[550px] flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin text-muted-foreground" }) });
  }
  const chatTitle = `Group Chat${teamName ? ` (${teamName})` : ""}`;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(Card, { className: "h-[550px] flex flex-col pb-0", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [
        /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: chatTitle }),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            className: "h-7 w-7",
            onClick: () => setIsExpanded(true),
            children: /* @__PURE__ */ jsx(Maximize2, { className: "h-4 w-4" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "flex-1 flex flex-col p-0 pb-0 overflow-hidden min-h-0", children: [
        renderMessages(scrollRef, false),
        renderInput()
      ] })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: isExpanded, onOpenChange: setIsExpanded, children: /* @__PURE__ */ jsxs(
      DialogContent,
      {
        className: "max-w-5xl h-[80vh] flex flex-col",
        overlayClassName: "backdrop-blur-sm",
        showCloseButton: false,
        children: [
          /* @__PURE__ */ jsxs(DialogHeader, { className: "flex flex-row items-center justify-between", children: [
            /* @__PURE__ */ jsx(DialogTitle, { children: chatTitle }),
            /* @__PURE__ */ jsx(DialogClose, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }) }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col overflow-hidden -mx-6", children: [
            renderMessages(expandedScrollRef, true),
            renderInput()
          ] })
        ]
      }
    ) })
  ] });
}
function findCurrentSessionIndex(sessions) {
  const now = /* @__PURE__ */ new Date();
  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i];
    if (!session.endDate) continue;
    const endDate = new Date(session.endDate);
    if (endDate > now) {
      return i;
    }
  }
  return Math.max(0, sessions.length - 1);
}
function useCountdown(targetDateStr) {
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    if (!targetDateStr) {
      setTimeLeft(0);
      return;
    }
    const target = new Date(targetDateStr).getTime();
    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((target - now) / 1e3));
      setTimeLeft(diff);
    };
    update();
    const timer = setInterval(update, 1e3);
    return () => clearInterval(timer);
  }, [targetDateStr]);
  return timeLeft;
}
function ProjectCountdown({
  startDate,
  onComplete
}) {
  const timeLeft = useCountdown(startDate);
  useEffect(() => {
    if (timeLeft <= 0 && startDate) {
      if (new Date(startDate).getTime() <= Date.now()) {
        onComplete();
      }
    }
  }, [timeLeft, startDate, onComplete]);
  if (timeLeft <= 0) return null;
  const days = Math.floor(timeLeft / (3600 * 24));
  const hours = Math.floor(timeLeft % (3600 * 24) / 3600);
  const minutes = Math.floor(timeLeft % 3600 / 60);
  const seconds = timeLeft % 60;
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center min-h-[60vh] space-y-8", children: [
    /* @__PURE__ */ jsx("div", { className: "text-center space-y-4", children: /* @__PURE__ */ jsx("h2", { className: "text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-purple-600", children: "Project Starts In" }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-4 md:gap-8", children: [
      days > 0 && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center p-4 bg-card border border-border rounded-xl min-w-[100px] shadow-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "text-4xl md:text-5xl font-bold font-mono", children: days }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground uppercase tracking-wider mt-1", children: "Days" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center p-4 bg-card border border-border rounded-xl min-w-[100px] shadow-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "text-4xl md:text-5xl font-bold font-mono", children: hours.toString().padStart(2, "0") }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground uppercase tracking-wider mt-1", children: "Hours" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center p-4 bg-card border border-border rounded-xl min-w-[100px] shadow-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "text-4xl md:text-5xl font-bold font-mono", children: minutes.toString().padStart(2, "0") }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground uppercase tracking-wider mt-1", children: "Minutes" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center p-4 bg-card border border-border rounded-xl min-w-[100px] shadow-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "text-4xl md:text-5xl font-bold font-mono text-cyan-500", children: seconds.toString().padStart(2, "0") }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground uppercase tracking-wider mt-1", children: "Seconds" })
      ] })
    ] })
  ] });
}
function SessionCountdown({
  endDate,
  onSessionEnd
}) {
  const timeLeft = useCountdown(endDate);
  const prevTimeLeft = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const isFuture2 = new Date(endDate).getTime() > Date.now();
  useEffect(() => {
    if (prevTimeLeft.current !== null && prevTimeLeft.current > 0 && timeLeft <= 0 && onSessionEnd) {
      onSessionEnd();
    }
    prevTimeLeft.current = timeLeft;
  }, [timeLeft, onSessionEnd]);
  useEffect(() => {
    prevTimeLeft.current = null;
  }, [endDate]);
  const isExpired = timeLeft <= 0 && !isFuture2;
  const days = Math.floor(timeLeft / (3600 * 24));
  const hours = Math.floor(timeLeft % (3600 * 24) / 3600);
  const minutes = Math.floor(timeLeft % 3600 / 60);
  const seconds = timeLeft % 60;
  const renderTimer = (inModal = false) => /* @__PURE__ */ jsxs("div", { className: `grid grid-cols-4 gap-4 text-center ${inModal ? "py-8" : ""}`, children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { className: `${inModal ? "text-5xl" : "text-xl"} font-bold font-mono ${isExpired ? "text-amber-500" : ""}`, children: isExpired ? "0" : days }),
      /* @__PURE__ */ jsx("div", { className: `${inModal ? "text-sm" : "text-[10px]"} uppercase text-muted-foreground`, children: "Days" })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { className: `${inModal ? "text-5xl" : "text-xl"} font-bold font-mono ${isExpired ? "text-amber-500" : ""}`, children: isExpired ? "00" : hours.toString().padStart(2, "0") }),
      /* @__PURE__ */ jsx("div", { className: `${inModal ? "text-sm" : "text-[10px]"} uppercase text-muted-foreground`, children: "Hrs" })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { className: `${inModal ? "text-5xl" : "text-xl"} font-bold font-mono ${isExpired ? "text-amber-500" : ""}`, children: isExpired ? "00" : minutes.toString().padStart(2, "0") }),
      /* @__PURE__ */ jsx("div", { className: `${inModal ? "text-sm" : "text-[10px]"} uppercase text-muted-foreground`, children: "Min" })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { className: `${inModal ? "text-5xl" : "text-xl"} font-bold font-mono ${isExpired ? "text-amber-500" : "text-cyan-500"}`, children: isExpired ? "00" : seconds.toString().padStart(2, "0") }),
      /* @__PURE__ */ jsx("div", { className: `${inModal ? "text-sm" : "text-[10px]"} uppercase text-muted-foreground`, children: "Sec" })
    ] })
  ] });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [
        /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: isExpired ? "Time's Up" : "Time Remaining" }),
        /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: () => setIsExpanded(true), children: /* @__PURE__ */ jsx(Maximize2, { className: "h-4 w-4" }) })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { children: renderTimer(false) })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: isExpanded, onOpenChange: setIsExpanded, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-xl", overlayClassName: "backdrop-blur-sm", showCloseButton: false, children: [
      /* @__PURE__ */ jsxs(DialogHeader, { className: "flex flex-row items-center justify-between", children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: isExpired ? "Time's Up" : "Time Remaining" }),
        /* @__PURE__ */ jsx(DialogClose, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }) }) })
      ] }),
      renderTimer(true)
    ] }) })
  ] });
}
function WaitingScreen() {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center min-h-[60vh] space-y-6", children: [
    /* @__PURE__ */ jsx(Loader2, { className: "w-12 h-12 text-cyan-500 animate-spin" }),
    /* @__PURE__ */ jsxs("div", { className: "text-center space-y-2", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: "Allocating Teams..." }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Please wait while we group participants randomly." })
    ] })
  ] });
}
function ExplorerProjectPage() {
  const {
    projectId
  } = Route.useParams();
  const navigate = useNavigate();
  const {
    isAuthenticated,
    currentUser
  } = useAuthStore();
  const {
    setCurrentProject,
    setCurrentSession,
    currentSessionIndex,
    runPreCheckAction: _runPreCheckAction,
    submitAction: _submitAction,
    isRunningPreCheck: _isRunningPreCheck
  } = useActivityStore();
  const [project, setProject] = useState(null);
  const [userTeam, setUserTeam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAllocating, setIsAllocating] = useState(false);
  const [showNextSessionModal, setShowNextSessionModal] = useState(false);
  const [showProjectEndedModal, setShowProjectEndedModal] = useState(false);
  const [showRemovedModal, setShowRemovedModal] = useState(false);
  const [isSmartOutputOpen, setIsSmartOutputOpen] = useState(false);
  const hasLoadedOnce = useRef(false);
  const hadTeamRef = useRef(false);
  const prevProjectIdRef = useRef(projectId);
  if (prevProjectIdRef.current !== projectId) {
    prevProjectIdRef.current = projectId;
    setProject(null);
    setUserTeam(null);
    setIsLoading(true);
    setError(null);
    setRefreshKey(0);
    setIsAllocating(false);
    setShowNextSessionModal(false);
    setShowProjectEndedModal(false);
    setShowRemovedModal(false);
    setIsSmartOutputOpen(false);
    hasLoadedOnce.current = false;
    hadTeamRef.current = false;
  }
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({
        to: "/signin"
      });
    }
  }, [isAuthenticated, navigate]);
  useEffect(() => {
    setCurrentProject(projectId);
    return () => setCurrentProject(null);
  }, [projectId, setCurrentProject]);
  useEffect(() => {
    async function fetchProject() {
      if (!currentUser) return;
      if (!hasLoadedOnce.current) {
        setIsLoading(true);
      }
      setError(null);
      try {
        const result = await getProject({
          data: {
            projectId,
            userId: currentUser.id
          }
        });
        if (result.success && result.project) {
          const apiProject = result.project;
          const transformedProject = {
            id: apiProject.id,
            name: apiProject.title,
            description: apiProject.description || "",
            creatorId: apiProject.creatorId,
            creatorName: apiProject.creator?.name || "Unknown",
            startDate: apiProject.startDate ?? null,
            endDate: apiProject.endDate ?? null,
            teamId: result.userTeam?.id || "",
            currentSessionIndex: 0,
            sessions: apiProject.sessions.map((s, idx) => ({
              id: s.id,
              index: s.order || idx,
              title: s.title,
              topic: s.topic || "",
              startDate: s.startDate || "",
              endDate: s.endDate || "",
              deliverableType: s.deliverableType || "document",
              guide: s.guide || "",
              resources: s.resources?.map((r) => ({
                id: r.id,
                title: r.title,
                type: r.type,
                url: r.url
              })) || [],
              rubric: s.rubrics?.map((r) => ({
                id: r.id,
                criterion: r.criteria,
                description: r.description,
                weight: r.weight
              })) || [],
              templates: s.templates?.map((t) => ({
                id: t.id,
                name: t.name,
                content: t.content
              })) || [],
              completedAt: null
            })),
            joinCode: apiProject.joinCode || "",
            createdAt: apiProject.createdAt,
            completedAt: null,
            isWaiting: result.isWaiting
          };
          setProject(transformedProject);
          if (!hasLoadedOnce.current) {
            const initialSessionIndex = findCurrentSessionIndex(transformedProject.sessions);
            setCurrentSession(initialSessionIndex);
          }
          if (result.userTeam) {
            hadTeamRef.current = true;
            setUserTeam((prev) => {
              const incoming = {
                id: result.userTeam.id,
                name: result.userTeam.name
              };
              if (prev?.id === incoming.id && prev?.name === incoming.name) return prev;
              return incoming;
            });
          } else if (hadTeamRef.current && !result.isWaiting) {
            setShowRemovedModal(true);
          }
        } else if (result.error === "removed") {
          setShowRemovedModal(true);
        } else {
          setError(result.error || "Failed to load project");
        }
      } catch (err) {
        console.error("Failed to fetch project:", err);
        setError("Failed to load project");
      } finally {
        setIsLoading(false);
        hasLoadedOnce.current = true;
      }
    }
    fetchProject();
  }, [projectId, currentUser, refreshKey]);
  useEffect(() => {
    if (project?.isWaiting && !userTeam && !isAllocating) {
      const now = /* @__PURE__ */ new Date();
      const start = project.startDate ? new Date(project.startDate) : null;
      if (start && start <= now) {
        setIsAllocating(true);
        allocateTeams({
          data: {
            projectId
          }
        }).then(() => {
          setTimeout(() => {
            setRefreshKey((k) => k + 1);
            setIsAllocating(false);
          }, 2e3);
        }).catch(() => setIsAllocating(false));
      }
    }
  }, [project, userTeam, isAllocating, projectId]);
  useEffect(() => {
    if (!project || !currentUser) return;
    const isInWaitingState = project.startDate && new Date(project.startDate) > /* @__PURE__ */ new Date();
    const isWaitingForTeam = project.isWaiting && !userTeam;
    const interval = isInWaitingState || isWaitingForTeam ? 5e3 : 3e4;
    const pollInterval = setInterval(() => {
      setRefreshKey((k) => k + 1);
    }, interval);
    return () => clearInterval(pollInterval);
  }, [project, userTeam, currentUser]);
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-[calc(100vh-4rem)] flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Loading project..." })
    ] }) });
  }
  if (error || !project) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-[calc(100vh-4rem)] flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold mb-2", children: error === "Project not found" ? "Project not found" : "Unable to load project" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: error || "The project you're looking for doesn't exist or you don't have access." }),
      /* @__PURE__ */ jsx(Button, { onClick: () => navigate({
        to: "/explorer"
      }), children: "Back to Explorer" })
    ] }) });
  }
  if (project.startDate && new Date(project.startDate) > /* @__PURE__ */ new Date()) {
    return /* @__PURE__ */ jsxs("div", { className: "min-h-[calc(100vh-4rem)] bg-background", children: [
      /* @__PURE__ */ jsx("div", { className: "border-b bg-card", children: /* @__PURE__ */ jsx("div", { className: "max-w-[1600px] mx-auto px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: () => navigate({
          to: "/explorer"
        }), className: "gap-2", children: [
          /* @__PURE__ */ jsx(ChevronLeft, { className: "w-4 h-4" }),
          "Back"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-6 w-px bg-border" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-lg font-semibold", children: project.name }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
            "By ",
            project.creatorName
          ] })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsx(ProjectCountdown, { startDate: project.startDate, onComplete: () => setRefreshKey((k) => k + 1) })
    ] });
  }
  if (project.isWaiting && !userTeam) {
    return /* @__PURE__ */ jsxs("div", { className: "min-h-[calc(100vh-4rem)] bg-background", children: [
      /* @__PURE__ */ jsx("div", { className: "border-b bg-card", children: /* @__PURE__ */ jsx("div", { className: "max-w-[1600px] mx-auto px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: () => navigate({
          to: "/explorer"
        }), className: "gap-2", children: [
          /* @__PURE__ */ jsx(ChevronLeft, { className: "w-4 h-4" }),
          "Back"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-6 w-px bg-border" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-lg font-semibold", children: project.name }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
            "By ",
            project.creatorName
          ] })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsx(WaitingScreen, {})
    ] });
  }
  const currentSession = project.sessions[currentSessionIndex] || project.sessions[0];
  return /* @__PURE__ */ jsxs("div", { className: "min-h-[calc(100vh-4rem)] bg-background", children: [
    /* @__PURE__ */ jsx("div", { className: "border-b bg-card", children: /* @__PURE__ */ jsx("div", { className: "max-w-[1600px] mx-auto px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: () => navigate({
        to: "/explorer"
      }), className: "gap-2", children: [
        /* @__PURE__ */ jsx(ChevronLeft, { className: "w-4 h-4" }),
        "Back"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "h-6 w-px bg-border" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-lg font-semibold", children: project.name }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
          "By ",
          project.creatorName
        ] })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-[1600px] mx-auto px-6 py-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "col-span-12 xl:col-span-3 space-y-6", children: [
          /* @__PURE__ */ jsx(VoyageNavigator, { project }),
          currentSession && /* @__PURE__ */ jsx(ResourcdHub, { session: currentSession })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "col-span-12 xl:col-span-6 h-[calc(100vh-14rem)]", children: currentSession && /* @__PURE__ */ jsx(SmartOutputBuilder, { project, session: currentSession, teamId: userTeam?.id, userName: currentUser?.name }) }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-12 xl:col-span-3 space-y-6", children: [
          currentSession?.endDate && /* @__PURE__ */ jsx(SessionCountdown, { endDate: currentSession.endDate, onSessionEnd: () => {
            if (currentSessionIndex < project.sessions.length - 1) {
              setShowNextSessionModal(true);
            } else {
              setShowProjectEndedModal(true);
            }
          } }),
          userTeam && /* @__PURE__ */ jsx(GroupChatPanel, { projectId, teamId: userTeam.id, teamName: userTeam.name }, `${projectId}-${userTeam.id}`)
        ] })
      ] }),
      /* @__PURE__ */ jsx(Dialog, { open: isSmartOutputOpen, onOpenChange: setIsSmartOutputOpen, children: isSmartOutputOpen && /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-5xl h-[85vh] flex flex-col", overlayClassName: "backdrop-blur-sm", showCloseButton: false, children: [
        /* @__PURE__ */ jsxs(DialogHeader, { className: "flex flex-row items-center justify-between", children: [
          /* @__PURE__ */ jsx(DialogTitle, { className: "text-sm", children: "Smart Output Builder" }),
          /* @__PURE__ */ jsx(DialogClose, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }) }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-0", children: currentSession && /* @__PURE__ */ jsx(SmartOutputBuilder, { project, session: currentSession, teamId: userTeam?.id, userName: currentUser?.name }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: showNextSessionModal, onOpenChange: setShowNextSessionModal, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-md", overlayClassName: "backdrop-blur-sm", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { className: "flex items-center gap-2", children: /* @__PURE__ */ jsx("span", { children: "Session Complete!" }) }),
        /* @__PURE__ */ jsxs(DialogDescription, { children: [
          'The current session "',
          currentSession?.title,
          '" has ended.',
          currentSessionIndex < project.sessions.length - 1 && /* @__PURE__ */ jsxs("span", { className: "block mt-2", children: [
            "Ready to move on to the next session:",
            " ",
            /* @__PURE__ */ jsxs("span", { className: "font-medium text-foreground", children: [
              '"',
              project.sessions[currentSessionIndex + 1]?.title,
              '"'
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "flex gap-3 sm:gap-3", children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setShowNextSessionModal(false), children: "Stay Here" }),
        /* @__PURE__ */ jsxs(Button, { onClick: () => {
          setCurrentSession(currentSessionIndex + 1);
          setShowNextSessionModal(false);
        }, className: "gap-2", children: [
          "Go to Next Session",
          /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: showProjectEndedModal, onOpenChange: setShowProjectEndedModal, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-md", overlayClassName: "backdrop-blur-sm", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { className: "flex items-center gap-2", children: /* @__PURE__ */ jsx("span", { children: "Project Complete!" }) }),
        /* @__PURE__ */ jsxs(DialogDescription, { children: [
          'Congratulations! You have completed all sessions in "',
          project.name,
          '".',
          /* @__PURE__ */ jsx("span", { className: "block mt-2 text-muted-foreground", children: "You can still make late submissions or review your work." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "flex gap-3 sm:gap-3", children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setShowProjectEndedModal(false), children: "Stay Here" }),
        /* @__PURE__ */ jsxs(Button, { onClick: () => {
          setShowProjectEndedModal(false);
          navigate({
            to: "/explorer"
          });
        }, className: "gap-2", children: [
          "Back to Explorer",
          /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: showRemovedModal, onOpenChange: () => {
    }, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-md", overlayClassName: "backdrop-blur-md", showCloseButton: false, onPointerDownOutside: (e) => e.preventDefault(), onEscapeKeyDown: (e) => e.preventDefault(), children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(UserMinus, { className: "w-7 h-7 text-destructive" }) }),
        /* @__PURE__ */ jsx(DialogTitle, { children: "Removed from Project" }),
        /* @__PURE__ */ jsxs(DialogDescription, { children: [
          'You have been removed from "',
          project.name,
          '" by the creator. You no longer have access to this project.'
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(DialogFooter, { className: "sm:justify-center", children: /* @__PURE__ */ jsxs(Button, { onClick: () => navigate({
        to: "/explorer"
      }), className: "gap-2", children: [
        "Back to Explorer",
        /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })
      ] }) })
    ] }) })
  ] });
}
export {
  ExplorerProjectPage as component
};
