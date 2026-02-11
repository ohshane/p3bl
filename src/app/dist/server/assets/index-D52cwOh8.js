import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import * as React from "react";
import { useState, useEffect, useMemo, useRef } from "react";
import { u as useAuthStore, B as Button, r as respondToInvitation, d as cn, j as joinProject, e as getUserInvitations, f as getProjectTimeStatus, h as getProjectProgress, i as getProjectTimeInfo, P as Popover, k as PopoverTrigger, l as PopoverContent, S as ScrollArea, s as safeFormatDate, m as Progress, a as Badge, D as Dialog, n as DialogContent, o as DialogHeader, p as DialogTitle, A as Avatar, q as AvatarImage, t as AvatarFallback, T as TooltipProvider, v as Tooltip, w as TooltipTrigger, x as TooltipContent, y as getUserProjects } from "./router-Bhor0jGk.js";
import { Mail, Loader2, X, ArrowRight, AlertCircle, Compass, Info, Bell, User, Users, Calendar, Clock, FileText, BookOpen, LayoutDashboard, Layers, FolderOpen, CheckCircle, Star, ChevronRight, Puzzle, Lightbulb, Megaphone, Brain, Heart, HandHelping, MessageCircle, Sun, Flag, Footprints } from "lucide-react";
import { toast } from "sonner";
import { C as Card, a as CardContent, b as CardHeader } from "./card-CuhZmkUZ.js";
import { A as Alert, a as AlertDescription } from "./alert-EcntnRnU.js";
import { OTPInput, OTPInputContext } from "input-otp";
import { u as useProjectStore } from "./projectStore-kRCMiHLx.js";
import { formatDistanceToNow, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-D_4abuiO.js";
import { L as LEVELS, B as BADGE_DEFINITIONS } from "./index-DKaP5KB_.js";
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
function InvitationCard({ invitation, onDismiss }) {
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const { addJoinedProject } = useAuthStore();
  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const result = await respondToInvitation({
        data: {
          invitationId: invitation.id,
          accept: true
        }
      });
      if (!result.success) {
        toast.error(result.error || "Failed to join project");
        setIsJoining(false);
        return;
      }
      addJoinedProject(result.projectId);
      toast.success(`Welcome to ${invitation.projectName}!`, {
        description: "You have successfully joined the project."
      });
      navigate({ to: `/explorer/project/${result.projectId}` });
    } catch (err) {
      console.error("Join project error:", err);
      toast.error("Failed to join project. Please try again.");
      setIsJoining(false);
    }
  };
  const handleDismiss = async () => {
    setIsDismissing(true);
    try {
      const result = await respondToInvitation({
        data: {
          invitationId: invitation.id,
          accept: false
        }
      });
      if (!result.success) {
        toast.error(result.error || "Failed to dismiss invitation");
        setIsDismissing(false);
        return;
      }
      toast.info("Invitation dismissed", {
        description: "You can still join later with a code."
      });
      onDismiss?.(invitation.id);
    } catch (err) {
      console.error("Dismiss invitation error:", err);
      toast.error("Failed to dismiss invitation. Please try again.");
    } finally {
      setIsDismissing(false);
    }
  };
  const isDisabled = isJoining || isDismissing;
  return /* @__PURE__ */ jsx(Card, { className: "bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Mail, { className: "w-6 h-6 text-cyan-400" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-cyan-400 font-medium mb-1", children: "You're invited!" }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-foreground truncate", children: invitation.projectName })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-3 mt-6", children: [
      /* @__PURE__ */ jsx(
        Button,
        {
          onClick: handleJoin,
          disabled: isDisabled,
          className: "flex-1 bg-cyan-600 hover:bg-cyan-700",
          children: isJoining ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
            "Joining..."
          ] }) : "Join"
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "outline",
          onClick: handleDismiss,
          disabled: isDisabled,
          className: "border-muted-foreground/30",
          children: isDismissing ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(X, { className: "w-4 h-4 mr-2" }),
            "Dismiss"
          ] })
        }
      )
    ] })
  ] }) });
}
function InputOTP({
  className,
  containerClassName,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    OTPInput,
    {
      "data-slot": "input-otp",
      containerClassName: cn(
        "flex items-center gap-2 has-disabled:opacity-50",
        containerClassName
      ),
      className: cn("disabled:cursor-not-allowed", className),
      ...props
    }
  );
}
function InputOTPGroup({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "input-otp-group",
      className: cn("flex items-center", className),
      ...props
    }
  );
}
function InputOTPSlot({
  index,
  className,
  ...props
}) {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};
  return /* @__PURE__ */ jsxs(
    "div",
    {
      "data-slot": "input-otp-slot",
      "data-active": isActive,
      className: cn(
        "data-[active=true]:border-ring data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:ring-destructive/20 dark:data-[active=true]:aria-invalid:ring-destructive/40 aria-invalid:border-destructive data-[active=true]:aria-invalid:border-destructive dark:bg-input/30 border-input relative flex h-9 w-9 items-center justify-center border-y border-r text-sm shadow-xs transition-all outline-none first:rounded-l-md first:border-l last:rounded-r-md data-[active=true]:z-10 data-[active=true]:ring-[3px]",
        className
      ),
      ...props,
      children: [
        char,
        hasFakeCaret && /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-0 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "animate-caret-blink bg-foreground h-4 w-px duration-1000" }) })
      ]
    }
  );
}
const COOLDOWN_MINUTES = 5;
function ManualCodeInput() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownEnd, setCooldownEnd] = useState(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const { currentUser, addJoinedProject } = useAuthStore();
  const startCooldown = (serverCooldownEnd) => {
    const cooldown = serverCooldownEnd || new Date(Date.now() + COOLDOWN_MINUTES * 60 * 1e3);
    setCooldownEnd(cooldown);
    setCooldownRemaining(Math.ceil(Math.max(0, cooldown.getTime() - Date.now()) / 1e3 / 60));
    const interval = setInterval(() => {
      const remaining = Math.max(0, cooldown.getTime() - Date.now());
      setCooldownRemaining(Math.ceil(remaining / 1e3 / 60));
      if (remaining <= 0) {
        setCooldownEnd(null);
        setError("");
        clearInterval(interval);
      }
    }, 1e3);
  };
  const handleCodeChange = (value) => {
    setCode(value.toUpperCase());
    setError("");
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || !code.trim() || cooldownEnd) return;
    if (code.length !== 6) {
      setError("Code must be 6 characters (letters and numbers only)");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const result = await joinProject({
        data: {
          userId: currentUser.id,
          code: code.toUpperCase()
        }
      });
      if (!result.success) {
        if ("rateLimited" in result && result.rateLimited) {
          const serverCooldownEnd = "cooldownEnd" in result && result.cooldownEnd ? new Date(result.cooldownEnd) : null;
          startCooldown(serverCooldownEnd);
          setError(result.error || "Too many attempts. Please try again later.");
        } else {
          setError(result.error || "Invalid code. Please check and try again.");
          toast.error(result.error || "Invalid code");
        }
        return;
      }
      const projectId = result.projectId;
      addJoinedProject(projectId);
      const alreadyMember = "message" in result && result.message === "Already a member of this project";
      if (!alreadyMember) {
        toast.success(`Welcome to ${result.projectTitle || "the project"}!`, {
          description: "You have successfully joined."
        });
      }
      navigate({ to: `/explorer/project/${projectId}` });
    } catch (err) {
      console.error("Join project error:", err);
      setError("Failed to join project. Please try again.");
      toast.error("Failed to join project");
    } finally {
      setIsSubmitting(false);
    }
  };
  const isDisabled = cooldownEnd !== null || isSubmitting;
  return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-5", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-2", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-center items-center gap-2", children: [
      /* @__PURE__ */ jsx(
        InputOTP,
        {
          maxLength: 6,
          value: code,
          onChange: handleCodeChange,
          disabled: isDisabled,
          inputMode: "text",
          pattern: "^[A-Za-z0-9]+$",
          children: /* @__PURE__ */ jsxs(InputOTPGroup, { children: [
            /* @__PURE__ */ jsx(InputOTPSlot, { index: 0, className: "uppercase font-mono" }),
            /* @__PURE__ */ jsx(InputOTPSlot, { index: 1, className: "uppercase font-mono" }),
            /* @__PURE__ */ jsx(InputOTPSlot, { index: 2, className: "uppercase font-mono" }),
            /* @__PURE__ */ jsx(InputOTPSlot, { index: 3, className: "uppercase font-mono" }),
            /* @__PURE__ */ jsx(InputOTPSlot, { index: 4, className: "uppercase font-mono" }),
            /* @__PURE__ */ jsx(InputOTPSlot, { index: 5, className: "uppercase font-mono" })
          ] })
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          type: "submit",
          disabled: isDisabled || code.length !== 6,
          children: isSubmitting ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })
        }
      )
    ] }),
    error && !cooldownEnd && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
      /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx(AlertDescription, { children: error })
    ] }),
    cooldownEnd && /* @__PURE__ */ jsxs(Alert, { children: [
      /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxs(AlertDescription, { children: [
        "Too many attempts. Please try again in ",
        cooldownRemaining,
        " minute",
        cooldownRemaining !== 1 ? "s" : "",
        "."
      ] })
    ] })
  ] }) }) });
}
function OnboardingMode() {
  const { currentUser } = useAuthStore();
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    async function fetchInvitations() {
      if (!currentUser) return;
      try {
        const result = await getUserInvitations({
          data: { userId: currentUser.id }
        });
        if (result.success && result.invitations) {
          const mappedInvitations = result.invitations.map((inv) => ({
            id: inv.id,
            projectId: inv.projectId,
            projectName: inv.projectTitle,
            invitedAt: inv.createdAt,
            expiresAt: null
            // API doesn't include this currently
          }));
          setInvitations(mappedInvitations);
        }
      } catch (err) {
        console.error("Failed to fetch invitations:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInvitations();
  }, [currentUser]);
  const handleDismiss = (invitationId) => {
    setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
  };
  if (!currentUser) return null;
  const hasPendingInvitations = invitations.length > 0;
  return /* @__PURE__ */ jsxs("div", { className: "container max-w-4xl mx-auto py-16 px-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-12", children: [
      /* @__PURE__ */ jsx("div", { className: "w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-6", children: /* @__PURE__ */ jsx(Compass, { className: "w-10 h-10 text-white" }) }),
      /* @__PURE__ */ jsxs("h1", { className: "text-4xl font-bold text-foreground mb-4", children: [
        "Welcome, ",
        currentUser.name,
        "!"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground max-w-2xl mx-auto", children: isLoading ? "Checking for invitations..." : hasPendingInvitations ? "You have a project invitation waiting for you." : "Enter a join code to get started." })
    ] }),
    isLoading && /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-8", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-muted-foreground" }) }),
    !isLoading && hasPendingInvitations && /* @__PURE__ */ jsx("div", { className: "mb-8 space-y-4", children: invitations.map((invitation) => /* @__PURE__ */ jsx(
      InvitationCard,
      {
        invitation,
        onDismiss: handleDismiss
      },
      invitation.id
    )) }),
    /* @__PURE__ */ jsx(ManualCodeInput, {}),
    /* @__PURE__ */ jsx("div", { className: "mt-12 text-center", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
      "Don't have a join code?",
      " ",
      /* @__PURE__ */ jsx("button", { className: "text-cyan-500 hover:text-cyan-400 underline", children: "Contact your creator" })
    ] }) })
  ] });
}
const statusBadge = {
  scheduled: { label: "Scheduled", className: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
  opened: { label: "Opened", className: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30" },
  closed: { label: "Closed", className: "bg-green-500/10 text-green-500 border-green-500/30" }
};
function StatusBadge({ status }) {
  const s = statusBadge[status];
  return /* @__PURE__ */ jsx(Badge, { variant: "outline", className: `text-[10px] uppercase font-bold py-0 h-5 px-2 ${s.className}`, children: s.label });
}
function formatSessionLength(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (isNaN(start) || isNaN(end) || end <= start) return null;
  const diffMs = end - start;
  const seconds = Math.floor(diffMs / 1e3);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) {
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}
function ProjectDetailModal({ project, open, onOpenChange }) {
  const status = getProjectTimeStatus(project.startDate, project.endDate);
  const progress = getProjectProgress(project.startDate, project.endDate);
  const timeInfo = getProjectTimeInfo(project.startDate, project.endDate);
  const isIndividual = project.teamSize === 1;
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(
    DialogContent,
    {
      className: "!flex !flex-col max-w-lg max-h-[85vh] overflow-hidden",
      overlayClassName: "backdrop-blur-sm",
      children: [
        /* @__PURE__ */ jsxs(DialogHeader, { className: "shrink-0", children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsx(StatusBadge, { status }) }),
          /* @__PURE__ */ jsx(DialogTitle, { className: "text-xl", children: project.title }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
            "By ",
            project.creatorName
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-0 overflow-y-auto -mx-6 px-6", children: /* @__PURE__ */ jsxs("div", { className: "space-y-5 pb-2", children: [
          project.description && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h4", { className: "text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(FileText, { className: "w-3.5 h-3.5" }),
              "Description"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-foreground", children: project.description })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h4", { className: "text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(Calendar, { className: "w-3.5 h-3.5" }),
              "Timeline"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-muted/50 rounded-lg p-2.5 border border-border", children: [
                /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground uppercase", children: "Start" }),
                /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-foreground", children: safeFormatDate(project.startDate, "MMM d, yyyy HH:mm", "Not set") })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-muted/50 rounded-lg p-2.5 border border-border", children: [
                /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground uppercase", children: "End" }),
                /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-foreground", children: safeFormatDate(project.endDate, "MMM d, yyyy HH:mm", "Not set") })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-2", children: [
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
              /* @__PURE__ */ jsx(Progress, { value: progress, className: "h-1.5" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h4", { className: "text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(Users, { className: "w-3.5 h-3.5" }),
              "Details"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-muted/50 rounded-lg p-2.5 border border-border", children: [
                /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground uppercase", children: "Type" }),
                /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-foreground", children: isIndividual ? "Individual" : "Group" })
              ] }),
              !isIndividual && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs("div", { className: "bg-muted/50 rounded-lg p-2.5 border border-border", children: [
                  /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground uppercase", children: "Team" }),
                  /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-foreground truncate", children: project.teamName || "Unassigned" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "bg-muted/50 rounded-lg p-2.5 border border-border", children: [
                  /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground uppercase", children: "Team Size" }),
                  /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-foreground", children: project.teamSize })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-muted/50 rounded-lg p-2.5 border border-border", children: [
                /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground uppercase", children: "Joined" }),
                /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-foreground", children: safeFormatDate(project.joinedAt, "MMM d, yyyy", "?") })
              ] })
            ] })
          ] }),
          project.sessions && project.sessions.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h4", { className: "text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(BookOpen, { className: "w-3.5 h-3.5" }),
              "Sessions (",
              project.sessions.length,
              ")"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: project.sessions.map((session, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 border border-border", children: [
              /* @__PURE__ */ jsx("span", { className: "flex items-center justify-center w-6 h-6 bg-cyan-600/20 text-cyan-500 text-xs font-semibold rounded shrink-0", children: index + 1 }),
              /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-foreground truncate", children: session.title }),
                (session.startDate || session.endDate) && /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-muted-foreground flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
                  safeFormatDate(session.startDate, "MMM d HH:mm", "TBD"),
                  " - ",
                  safeFormatDate(session.endDate, "MMM d HH:mm", "TBD"),
                  (() => {
                    const length = formatSessionLength(session.startDate, session.endDate);
                    return length ? ` (${length})` : "";
                  })()
                ] })
              ] })
            ] }, session.id)) })
          ] })
        ] }) })
      ]
    }
  ) });
}
function ProjectCard({ project }) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [, setTick] = useState(0);
  const { notifications, markNotificationRead } = useAuthStore();
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1e3);
    return () => clearInterval(timer);
  }, []);
  const projectNotifications = notifications.filter(
    (n) => n.projectId === project.id && !n.read
  );
  const notificationCount = projectNotifications.length;
  const status = getProjectTimeStatus(project.startDate, project.endDate);
  const progress = getProjectProgress(project.startDate, project.endDate);
  const timeInfo = getProjectTimeInfo(project.startDate, project.endDate);
  const isIndividual = project.teamSize === 1;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(Card, { className: "bg-card border-border transition-all", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ jsx(StatusBadge, { status }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                onClick: () => setIsDetailOpen(true),
                className: "h-8 w-8 text-muted-foreground hover:text-cyan-500 hover:bg-cyan-500/10",
                children: /* @__PURE__ */ jsx(Info, { className: "w-4 h-4" })
              }
            ),
            notificationCount > 0 && /* @__PURE__ */ jsxs(Popover, { open: isNotificationOpen, onOpenChange: setIsNotificationOpen, children: [
              /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "ghost",
                  size: "icon",
                  className: "h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted relative",
                  children: [
                    /* @__PURE__ */ jsx(Bell, { className: "w-4 h-4" }),
                    /* @__PURE__ */ jsx("span", { className: "absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center", children: notificationCount > 9 ? "9+" : notificationCount })
                  ]
                }
              ) }),
              /* @__PURE__ */ jsxs(PopoverContent, { className: "w-72 p-0", align: "end", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 border-b", children: [
                  /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium", children: [
                    "Notifications (",
                    notificationCount,
                    ")"
                  ] }),
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "sm",
                      className: "text-xs h-auto py-1",
                      onClick: () => {
                        projectNotifications.forEach((n) => markNotificationRead(n.id));
                        setIsNotificationOpen(false);
                      },
                      children: "Clear"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx(ScrollArea, { className: "max-h-[200px]", children: projectNotifications.map((notification) => /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: "p-3 border-b last:border-0 hover:bg-muted/50 cursor-pointer",
                    onClick: () => {
                      markNotificationRead(notification.id);
                    },
                    children: [
                      /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: notification.title }),
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }) })
                    ]
                  },
                  notification.id
                )) })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(Link, { to: "/explorer/project/$projectId", params: { projectId: project.id }, children: /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-foreground line-clamp-1 hover:text-cyan-500 transition-colors cursor-pointer w-full", children: project.title }) }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground line-clamp-1 mt-1 w-full", children: [
          "By ",
          project.creatorName
        ] })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-muted-foreground", children: [
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
              isIndividual ? /* @__PURE__ */ jsx(User, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(Users, { className: "w-4 h-4" }),
              "Type"
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-foreground", children: isIndividual ? "Individual" : "Group" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-muted-foreground", children: [
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4" }),
              "Sessions"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-foreground", children: [
              project.sessionCount,
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
              " - ",
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
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      ProjectDetailModal,
      {
        project,
        open: isDetailOpen,
        onOpenChange: setIsDetailOpen
      }
    )
  ] });
}
function ProjectList({ allProjects, scheduledProjects, openedProjects, closedProjects }) {
  const [activeTab, setActiveTab] = useState("all");
  const [, setTick] = useState(0);
  const sortedAllProjects = useMemo(() => {
    const getStartTime = (startDate) => {
      if (!startDate) return Number.NEGATIVE_INFINITY;
      const time = new Date(startDate).getTime();
      return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
    };
    return [...allProjects].sort((a, b) => getStartTime(b.startDate) - getStartTime(a.startDate));
  }, [allProjects]);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1e3);
    return () => clearInterval(timer);
  }, []);
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-foreground flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(LayoutDashboard, { className: "w-8 h-8 text-cyan-500" }),
        "My Projects"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-1", children: "Track your learning journey and project progress" })
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
      /* @__PURE__ */ jsx(TabsContent, { value: "all", children: allProjects.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { type: "all" }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: sortedAllProjects.map((project) => /* @__PURE__ */ jsx(
        ProjectCard,
        {
          project
        },
        project.id
      )) }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "opened", children: openedProjects.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { type: "opened" }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: openedProjects.map((project) => /* @__PURE__ */ jsx(
        ProjectCard,
        {
          project
        },
        project.id
      )) }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "scheduled", children: scheduledProjects.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { type: "scheduled" }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: scheduledProjects.map((project) => /* @__PURE__ */ jsx(
        ProjectCard,
        {
          project
        },
        project.id
      )) }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "closed", children: closedProjects.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { type: "closed" }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: closedProjects.map((project) => /* @__PURE__ */ jsx(
        ProjectCard,
        {
          project
        },
        project.id
      )) }) })
    ] })
  ] });
}
function EmptyState({ type }) {
  const getIcon = () => {
    switch (type) {
      case "all":
        return /* @__PURE__ */ jsx(Layers, { className: "w-6 h-6 text-muted-foreground" });
      case "scheduled":
        return /* @__PURE__ */ jsx(Calendar, { className: "w-6 h-6 text-muted-foreground" });
      case "opened":
        return /* @__PURE__ */ jsx(FolderOpen, { className: "w-6 h-6 text-muted-foreground" });
      case "closed":
        return /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 text-muted-foreground" });
    }
  };
  const getMessage = () => {
    switch (type) {
      case "all":
        return "No projects yet. Join a project using a code from your creator.";
      case "scheduled":
        return "You have no scheduled projects. Projects will appear here when they are scheduled to start.";
      case "opened":
        return "Join a project using a code from your creator.";
      case "closed":
        return "Your closed projects will appear here.";
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "text-center py-12 px-6 bg-muted/30 rounded-xl border border-dashed border-muted", children: [
    /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4", children: getIcon() }),
    /* @__PURE__ */ jsxs("h3", { className: "text-lg font-medium text-foreground mb-2", children: [
      "No ",
      type,
      " projects"
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: getMessage() })
  ] });
}
const BADGE_ICONS = {
  "footprints": /* @__PURE__ */ jsx(Footprints, { className: "w-4 h-4" }),
  "flag": /* @__PURE__ */ jsx(Flag, { className: "w-4 h-4" }),
  "compass": /* @__PURE__ */ jsx(Compass, { className: "w-4 h-4" }),
  "star": /* @__PURE__ */ jsx(Star, { className: "w-4 h-4" }),
  "sun": /* @__PURE__ */ jsx(Sun, { className: "w-4 h-4" }),
  "calendar": /* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4" }),
  "message-circle": /* @__PURE__ */ jsx(MessageCircle, { className: "w-4 h-4" }),
  "hand-helping": /* @__PURE__ */ jsx(HandHelping, { className: "w-4 h-4" }),
  "heart": /* @__PURE__ */ jsx(Heart, { className: "w-4 h-4" }),
  "brain": /* @__PURE__ */ jsx(Brain, { className: "w-4 h-4" }),
  "megaphone": /* @__PURE__ */ jsx(Megaphone, { className: "w-4 h-4" }),
  "users": /* @__PURE__ */ jsx(Users, { className: "w-4 h-4" }),
  "lightbulb": /* @__PURE__ */ jsx(Lightbulb, { className: "w-4 h-4" }),
  "puzzle": /* @__PURE__ */ jsx(Puzzle, { className: "w-4 h-4" })
};
function ProfileCard() {
  const { currentUser } = useAuthStore();
  if (!currentUser) return null;
  const getInitials = (name) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };
  const currentLevelDef = LEVELS.find((l) => l.level === currentUser.level);
  const nextLevelDef = LEVELS.find((l) => l.level === currentUser.level + 1);
  const currentLevelXP = currentLevelDef?.xpRequired || 0;
  const nextLevelXP = nextLevelDef?.xpRequired || currentUser.xp;
  const xpInCurrentLevel = currentUser.xp - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
  const progressPercent = nextLevelDef ? xpInCurrentLevel / xpNeededForNextLevel * 100 : 100;
  const earnedBadgeIds = currentUser.earnedBadgeIds ?? [];
  const recentBadges = earnedBadgeIds.slice(-3).map((id) => BADGE_DEFINITIONS.find((b) => b.id === id)).filter(Boolean);
  const remainingBadges = Math.max(0, earnedBadgeIds.length - 3);
  return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-4", children: [
      /* @__PURE__ */ jsxs(Avatar, { className: "h-14 w-14", children: [
        /* @__PURE__ */ jsx(AvatarImage, { src: currentUser.avatarUrl || void 0 }),
        /* @__PURE__ */ jsx(AvatarFallback, { className: "bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-lg", children: getInitials(currentUser.name) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground truncate", children: currentUser.name }),
        /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsxs(Tooltip, { children: [
          /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxs("div", { className: "cursor-help", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
              "Level ",
              currentUser.level,
              " ",
              currentLevelDef?.name
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-1", children: /* @__PURE__ */ jsx(Progress, { value: progressPercent, className: "h-1.5" }) })
          ] }) }),
          /* @__PURE__ */ jsx(TooltipContent, { children: /* @__PURE__ */ jsxs("p", { className: "text-sm", children: [
            currentUser.xp,
            " XP",
            nextLevelDef && /* @__PURE__ */ jsxs(Fragment, { children: [
              " / ",
              nextLevelXP,
              " XP to Level ",
              nextLevelDef.level
            ] })
          ] }) })
        ] }) })
      ] })
    ] }),
    recentBadges.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
      /* @__PURE__ */ jsx(TooltipProvider, { children: recentBadges.map((badge) => badge && /* @__PURE__ */ jsxs(Tooltip, { children: [
        /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400", children: BADGE_ICONS[badge.icon] || /* @__PURE__ */ jsx(Star, { className: "w-4 h-4" }) }) }),
        /* @__PURE__ */ jsxs(TooltipContent, { children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium", children: badge.name }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: badge.description })
        ] })
      ] }, badge.id)) }),
      remainingBadges > 0 && /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground", children: [
        "+",
        remainingBadges,
        " more"
      ] })
    ] }),
    /* @__PURE__ */ jsxs(
      Link,
      {
        to: "/explorer/portfolio",
        className: "flex items-center justify-between p-3 -mx-1 rounded-lg hover:bg-muted/50 transition-colors group",
        children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-cyan-500", children: "View Full Portfolio" }),
          /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4 text-cyan-500 group-hover:translate-x-1 transition-transform" })
        ]
      }
    )
  ] }) });
}
function ClockWidget() {
  const [now, setNow] = useState(/* @__PURE__ */ new Date());
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(/* @__PURE__ */ new Date());
    }, 1e3);
    return () => clearInterval(interval);
  }, []);
  return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-5 text-center", children: [
    /* @__PURE__ */ jsx("div", { className: "text-3xl font-bold font-mono text-foreground", children: format(now, "HH:mm:ss") }),
    /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground mt-1", children: format(now, "EEEE, MMMM d, yyyy") })
  ] }) });
}
function MiniCalendar() {
  const today = /* @__PURE__ */ new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-7 gap-1 text-center", children: [
    weekDays.map((day) => /* @__PURE__ */ jsx(
      "div",
      {
        className: "text-xs font-medium text-muted-foreground py-1",
        children: day
      },
      day
    )),
    days.map((day) => {
      const isCurrentMonth = isSameMonth(day, today);
      const isToday = isSameDay(day, today);
      return /* @__PURE__ */ jsx(
        "div",
        {
          className: `
                  text-xs py-1 rounded
                  ${!isCurrentMonth && "text-muted-foreground/40"}
                  ${isToday && "bg-primary text-primary-foreground font-bold"}
                `,
          children: format(day, "d")
        },
        day.toISOString()
      );
    })
  ] }) }) });
}
function ActiveMode() {
  const { currentUser } = useAuthStore();
  const {
    isLoadingProjects,
    projectsError,
    fetchUserProjects,
    getAllUserProjects,
    getScheduledProjects,
    getOpenedProjects,
    getClosedProjects
  } = useProjectStore();
  useEffect(() => {
    if (!currentUser?.id) return;
    fetchUserProjects(currentUser.id);
    const interval = setInterval(() => {
      fetchUserProjects(currentUser.id);
    }, 1e4);
    return () => clearInterval(interval);
  }, [currentUser?.id, fetchUserProjects]);
  if (!currentUser) return null;
  const allProjects = getAllUserProjects();
  const scheduledProjects = getScheduledProjects();
  const openedProjects = getOpenedProjects();
  const closedProjects = getClosedProjects();
  return /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-6 py-8", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 gap-6", children: [
    /* @__PURE__ */ jsx("div", { className: "col-span-12 lg:col-span-8 space-y-6", children: isLoadingProjects ? /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center py-12", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-muted-foreground" }),
      /* @__PURE__ */ jsx("span", { className: "ml-2 text-muted-foreground", children: "Loading projects..." })
    ] }) : projectsError ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12 text-destructive", children: [
      /* @__PURE__ */ jsx("p", { children: projectsError }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => fetchUserProjects(currentUser.id),
          className: "mt-2 text-sm underline",
          children: "Try again"
        }
      )
    ] }) : /* @__PURE__ */ jsx(
      ProjectList,
      {
        allProjects,
        scheduledProjects,
        openedProjects,
        closedProjects
      }
    ) }),
    /* @__PURE__ */ jsxs("div", { className: "col-span-12 lg:col-span-4 space-y-6", children: [
      /* @__PURE__ */ jsx(ProfileCard, {}),
      /* @__PURE__ */ jsx(ClockWidget, {}),
      /* @__PURE__ */ jsx(MiniCalendar, {}),
      /* @__PURE__ */ jsx(ManualCodeInput, {})
    ] })
  ] }) });
}
function ExplorerPage() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    currentUser,
    addJoinedProject
  } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [hasProjects, setHasProjects] = useState(false);
  const [joinCode] = useState(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("joinCode");
    if (!code) return null;
    const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    return normalized || null;
  });
  const autoJoinAttempted = useRef(false);
  useEffect(() => {
    if (!isAuthenticated) {
      if (joinCode) {
        const redirectUri = encodeURIComponent(`/explorer?joinCode=${joinCode}`);
        navigate({
          to: `/signin?redirect_uri=${redirectUri}`
        });
      } else {
        navigate({
          to: "/signin"
        });
      }
    }
  }, [isAuthenticated, joinCode, navigate]);
  useEffect(() => {
    if (!isAuthenticated || !currentUser || !joinCode || autoJoinAttempted.current) return;
    autoJoinAttempted.current = true;
    const attemptJoin = async () => {
      try {
        const result = await joinProject({
          data: {
            userId: currentUser.id,
            code: joinCode
          }
        });
        if (!result.success) {
          const message = result.error || "Invalid join code. Please check and try again.";
          toast.error(message);
          return;
        }
        addJoinedProject(result.projectId);
        const alreadyMember = "message" in result && result.message === "Already a member of this project";
        if (!alreadyMember) {
          toast.success(`Welcome to ${result.projectTitle || "the project"}!`, {
            description: "You have successfully joined."
          });
        }
        navigate({
          to: `/explorer/project/${result.projectId}`
        });
      } catch (err) {
        console.error("Join project error:", err);
        toast.error("Failed to join project. Please try again.");
      }
    };
    attemptJoin();
  }, [addJoinedProject, currentUser, isAuthenticated, joinCode, navigate]);
  useEffect(() => {
    async function checkProjects() {
      if (!currentUser) return;
      try {
        const result = await getUserProjects({
          data: {
            userId: currentUser.id
          }
        });
        if (result.success && result.projects) {
          setHasProjects(result.projects.length > 0);
        } else {
          setHasProjects(currentUser.joinedProjectIds?.length > 0);
        }
      } catch (err) {
        console.error("Failed to fetch user projects:", err);
        setHasProjects(currentUser.joinedProjectIds?.length > 0);
      } finally {
        setIsLoading(false);
      }
    }
    checkProjects();
  }, [currentUser]);
  if (!currentUser) {
    return null;
  }
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-muted-foreground" }) });
  }
  const isOnboarding = !hasProjects;
  return /* @__PURE__ */ jsx("div", { className: "min-h-[calc(100vh-4rem)] bg-background", children: isOnboarding ? /* @__PURE__ */ jsx(OnboardingMode, {}) : /* @__PURE__ */ jsx(ActiveMode, {}) });
}
export {
  ExplorerPage as component
};
