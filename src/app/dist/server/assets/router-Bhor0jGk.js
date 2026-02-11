import { useNavigate, useLocation, Link, createRootRoute, HeadContent, Outlet, Scripts, createFileRoute, lazyRouteComponent, useParams, createRouter } from "@tanstack/react-router";
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useTheme, ThemeProvider } from "next-themes";
import { Loader2Icon, OctagonXIcon, TriangleAlertIcon, InfoIcon, CircleCheckIcon, Moon, Sun, Monitor, Shield, PenTool, Compass, LayoutDashboard, User, Settings, Calendar, Library, Store, FolderPlus, Briefcase, Bell, ChevronDown, LogOut, ChevronDownIcon, CheckIcon, ChevronUpIcon, XIcon, Copy, QrCode, RefreshCw, ArrowLeft, Clock, Plus, GripVertical, FileText, Trash2, Users, Loader2, Check, X, Pencil, Save, BookOpen } from "lucide-react";
import { Toaster as Toaster$1, toast } from "sonner";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { c as createSsrRpc } from "./artifacts-V6YAL9mY.js";
import { r as registerSchema, l as loginSchema, p as passwordResetRequestSchema, a as passwordResetSchema, u as updateProfileSchema, c as changePasswordSchema } from "./auth-B6e831Uo.js";
import { c as createServerFn } from "../server.js";
import { cva } from "class-variance-authority";
import { Slot, DropdownMenu as DropdownMenu$1, Avatar as Avatar$1, Popover as Popover$1, ScrollArea as ScrollArea$1, Progress as Progress$1, Select as Select$1, Tooltip as Tooltip$1, Dialog as Dialog$1, Collapsible as Collapsible$1, AlertDialog as AlertDialog$1 } from "radix-ui";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, addMinutes, differenceInMinutes } from "date-fns";
import { z } from "zod";
import { toDataURL } from "qrcode";
function json(payload, init) {
  return Response.json(payload, init);
}
const Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme();
  return /* @__PURE__ */ jsx(
    Toaster$1,
    {
      theme,
      className: "toaster group",
      icons: {
        success: /* @__PURE__ */ jsx(CircleCheckIcon, { className: "size-4" }),
        info: /* @__PURE__ */ jsx(InfoIcon, { className: "size-4" }),
        warning: /* @__PURE__ */ jsx(TriangleAlertIcon, { className: "size-4" }),
        error: /* @__PURE__ */ jsx(OctagonXIcon, { className: "size-4" }),
        loading: /* @__PURE__ */ jsx(Loader2Icon, { className: "size-4 animate-spin" })
      },
      style: {
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
        "--border-radius": "var(--radius)"
      },
      ...props
    }
  );
};
const register = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const result = registerSchema.safeParse(data);
  if (!result.success) {
    throw new Error(JSON.stringify({
      error: "Validation failed",
      errors: result.error.flatten().fieldErrors
    }));
  }
  return result.data;
}).handler(createSsrRpc("d70d0dc959691f288a1d6bb061271253757d5c26ecfe60b73b1adf205358b139"));
const login = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const result = loginSchema.safeParse(data);
  if (!result.success) {
    throw new Error(JSON.stringify({
      error: "Validation failed",
      errors: result.error.flatten().fieldErrors
    }));
  }
  return result.data;
}).handler(createSsrRpc("df7b3306040ed694082e15cc572f25e57cc73554d6312f9167bdb556e4459c6b"));
const refreshToken = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("474ac745284967e838abce62a9aad7fbda98af979b1530328377c4ab43e2b148"));
const logout = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("f8d0a46c159fa8cccae666d306a4550c033e4bd1a60341dfceaaad2d922d6fc8"));
createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("4b0b4f16947036ab55a59d19341ff34e497b8f1e10377e7dcafb2b5e8c58cddf"));
createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const result = passwordResetRequestSchema.safeParse(data);
  if (!result.success) {
    throw new Error("Invalid email");
  }
  return result.data;
}).handler(createSsrRpc("3477495b74e9128ba8cfef6e125b6f2bfd3df3b35e252f15954cc5fa8fe3d7e7"));
createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const result = passwordResetSchema.safeParse(data);
  if (!result.success) {
    throw new Error(JSON.stringify({
      error: "Validation failed",
      errors: result.error.flatten().fieldErrors
    }));
  }
  return result.data;
}).handler(createSsrRpc("77c119535ec1f3fa7c76d38395ca255538f35148f34e14756b4d9eda97ca5328"));
createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("5b8538f661f885c121057ba7ef0cfc68e8b5bb035eaaa65914662b3fa4ee3b3e"));
createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const result = updateProfileSchema.safeParse(data.updates);
  if (!result.success) {
    throw new Error(JSON.stringify({
      error: "Validation failed",
      errors: result.error.flatten().fieldErrors
    }));
  }
  return {
    userId: data.userId,
    updates: result.data
  };
}).handler(createSsrRpc("b6da098bd1e5bdc9627a38d876e34d3d2ae3282407fa6ce2c794fe85e712a963"));
createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const result = changePasswordSchema.safeParse(data.passwords);
  if (!result.success) {
    throw new Error(JSON.stringify({
      error: "Validation failed",
      errors: result.error.flatten().fieldErrors
    }));
  }
  return {
    userId: data.userId,
    passwords: result.data
  };
}).handler(createSsrRpc("e591b9862662c314d7bf62c3d3e92ee944602db6e63d24e72fe12929daaf8de5"));
const DEFAULT_COMPETENCIES = {
  criticalThinking: { current: 50, baseline: null, lastUpdated: (/* @__PURE__ */ new Date()).toISOString(), insight: "No assessments yet" },
  communication: { current: 50, baseline: null, lastUpdated: (/* @__PURE__ */ new Date()).toISOString(), insight: "No assessments yet" },
  collaboration: { current: 50, baseline: null, lastUpdated: (/* @__PURE__ */ new Date()).toISOString(), insight: "No assessments yet" },
  creativity: { current: 50, baseline: null, lastUpdated: (/* @__PURE__ */ new Date()).toISOString(), insight: "No assessments yet" },
  problemSolving: { current: 50, baseline: null, lastUpdated: (/* @__PURE__ */ new Date()).toISOString(), insight: "No assessments yet" }
};
function isTokenExpired(expiresAt) {
  if (!expiresAt) return true;
  const expiry = new Date(expiresAt).getTime();
  const now = Date.now();
  const bufferMs = 60 * 1e3;
  return now >= expiry - bufferMs;
}
const useAuthStore = create()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      notifications: [],
      unreadNotificationCount: 0,
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      login: async (emailOrUsername, password) => {
        set({ isLoading: true, error: null });
        try {
          const result = await login({ data: { emailOrUsername, password } });
          if (result.success) {
            const user = {
              id: result.user.id,
              email: result.user.email,
              username: result.user.username,
              name: result.user.name,
              role: result.user.role,
              avatarUrl: result.user.avatarUrl,
              xp: result.user.xp,
              level: result.user.level,
              defaultSessionDifficulty: result.user.defaultSessionDifficulty,
              earnedBadgeIds: result.user.earnedBadgeIds ?? [],
              competencies: result.user.competencies ?? DEFAULT_COMPETENCIES,
              joinedProjectIds: result.user.joinedProjectIds ?? []
            };
            set({
              currentUser: user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              accessToken: result.accessToken,
              refreshToken: result.refreshToken,
              tokenExpiresAt: result.expiresAt
            });
            return { success: true };
          } else {
            set({
              isLoading: false,
              error: result.error
            });
            return { success: false, error: result.error };
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Login failed";
          set({
            isLoading: false,
            error: errorMessage
          });
          return { success: false, error: errorMessage };
        }
      },
      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const result = await register({
            data: {
              email: data.email.toLowerCase(),
              username: data.username,
              password: data.password,
              name: data.name,
              role: ["explorer"]
              // Self-registration is always as explorer
            }
          });
          if (result.success) {
            const user = {
              id: result.user.id,
              email: result.user.email,
              username: result.user.username,
              name: result.user.name,
              role: result.user.role,
              avatarUrl: result.user.avatarUrl,
              xp: result.user.xp,
              level: result.user.level,
              defaultSessionDifficulty: result.user.defaultSessionDifficulty,
              earnedBadgeIds: result.user.earnedBadgeIds ?? [],
              competencies: result.user.competencies ?? DEFAULT_COMPETENCIES,
              joinedProjectIds: result.user.joinedProjectIds ?? []
            };
            set({
              currentUser: user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              accessToken: result.accessToken,
              refreshToken: result.refreshToken,
              tokenExpiresAt: result.expiresAt
            });
            return { success: true };
          } else {
            set({
              isLoading: false,
              error: result.error
            });
            return { success: false, error: result.error };
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Registration failed";
          set({
            isLoading: false,
            error: errorMessage
          });
          return { success: false, error: errorMessage };
        }
      },
      logout: async () => {
        const { refreshToken: refreshToken2 } = get();
        try {
          if (refreshToken2) {
            await logout({ data: { refreshToken: refreshToken2 } });
          }
        } catch (error) {
          console.error("Logout API error:", error);
        }
        set({
          currentUser: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          accessToken: null,
          refreshToken: null,
          tokenExpiresAt: null
        });
      },
      clearError: () => {
        set({ error: null });
      },
      addXP: (amount) => {
        const { currentUser } = get();
        if (!currentUser) return;
        const newXP = currentUser.xp + amount;
        const newLevel = Math.floor(newXP / 100) + 1;
        set({
          currentUser: {
            ...currentUser,
            xp: newXP,
            level: Math.min(newLevel, 6)
            // Cap at level 6
          }
        });
      },
      refreshAccessToken: async () => {
        const { refreshToken: refreshToken$1 } = get();
        if (!refreshToken$1) {
          return false;
        }
        try {
          const result = await refreshToken({ data: { refreshToken: refreshToken$1 } });
          if (result.success) {
            set({
              currentUser: {
                id: result.user.id,
                email: result.user.email,
                username: result.user.username,
                name: result.user.name,
                role: result.user.role,
                avatarUrl: result.user.avatarUrl,
                xp: result.user.xp,
                level: result.user.level,
                defaultSessionDifficulty: result.user.defaultSessionDifficulty,
                earnedBadgeIds: result.user.earnedBadgeIds ?? [],
                competencies: result.user.competencies ?? DEFAULT_COMPETENCIES,
                joinedProjectIds: result.user.joinedProjectIds ?? []
              },
              isAuthenticated: true,
              accessToken: result.accessToken,
              refreshToken: result.refreshToken,
              tokenExpiresAt: result.expiresAt
            });
            return true;
          }
        } catch (error) {
          console.error("Token refresh error:", error);
        }
        set({
          currentUser: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          tokenExpiresAt: null
        });
        return false;
      },
      getAccessToken: async () => {
        const { accessToken, tokenExpiresAt, refreshAccessToken } = get();
        if (isTokenExpired(tokenExpiresAt)) {
          const refreshed = await refreshAccessToken();
          if (!refreshed) {
            return null;
          }
          return get().accessToken;
        }
        return accessToken;
      },
      checkAuth: async () => {
        const { accessToken, refreshToken: refreshToken2, tokenExpiresAt, refreshAccessToken } = get();
        if (!refreshToken2) {
          set({ isAuthenticated: false, currentUser: null });
          return false;
        }
        if (accessToken && !isTokenExpired(tokenExpiresAt)) {
          return true;
        }
        return await refreshAccessToken();
      },
      setUser: (user) => {
        set({ currentUser: user, isAuthenticated: !!user });
      },
      setTokens: (accessToken, refreshToken2, expiresAt) => {
        set({ accessToken, refreshToken: refreshToken2, tokenExpiresAt: expiresAt });
      },
      clearTokens: () => {
        set({ accessToken: null, refreshToken: null, tokenExpiresAt: null });
      },
      addJoinedProject: (projectId) => {
        const { currentUser } = get();
        if (!currentUser) return;
        const existing = currentUser.joinedProjectIds ?? [];
        if (existing.includes(projectId)) return;
        set({
          currentUser: {
            ...currentUser,
            joinedProjectIds: [...existing, projectId]
          }
        });
      },
      markNotificationRead: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.map(
            (n) => n.id === notificationId ? { ...n, read: true } : n
          ),
          unreadNotificationCount: state.notifications.filter((n) => !n.read && n.id !== notificationId).length
        }));
      },
      markAllNotificationsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadNotificationCount: 0
        }));
      },
      addNotification: (notification) => {
        const newNotification = {
          ...notification,
          id: `notif_${Date.now()}`,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadNotificationCount: state.unreadNotificationCount + 1
        }));
      },
      setNotifications: (notifications) => {
        set({
          notifications,
          unreadNotificationCount: notifications.filter((n) => !n.read).length
        });
      }
    }),
    {
      name: "p3bl-auth-storage",
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        tokenExpiresAt: state.tokenExpiresAt
      }),
      merge: (persisted, current) => {
        const state = { ...current, ...persisted };
        if (state.currentUser) {
          state.currentUser = {
            ...state.currentUser,
            joinedProjectIds: state.currentUser.joinedProjectIds ?? [],
            earnedBadgeIds: state.currentUser.earnedBadgeIds ?? [],
            competencies: state.currentUser.competencies ?? DEFAULT_COMPETENCIES
          };
        }
        return state;
      }
    }
  )
);
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
function safeFormatDate(dateString, formatStr, fallback = "N/A") {
  if (!dateString) return fallback;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return fallback;
    return format(date, formatStr);
  } catch {
    return fallback;
  }
}
function isValidDate(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}
function getProjectTimeStatus(startDate, endDate) {
  const now = /* @__PURE__ */ new Date();
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (start && !isNaN(start.getTime()) && start > now) {
    return "scheduled";
  }
  if (end && !isNaN(end.getTime()) && end <= now) {
    return "closed";
  }
  return "opened";
}
function getProjectProgress(startDate, endDate) {
  const now = (/* @__PURE__ */ new Date()).getTime();
  const start = startDate ? new Date(startDate).getTime() : null;
  const end = endDate ? new Date(endDate).getTime() : null;
  if (!start || !end || isNaN(start) || isNaN(end)) {
    return 0;
  }
  if (now < start) {
    return 0;
  }
  if (now >= end) {
    return 100;
  }
  const total = end - start;
  const elapsed = now - start;
  return Math.round(elapsed / total * 100);
}
function formatDuration$1(ms) {
  const seconds = Math.floor(ms / 1e3);
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
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}
function getProjectTimeInfo(startDate, endDate) {
  const now = (/* @__PURE__ */ new Date()).getTime();
  const start = startDate ? new Date(startDate).getTime() : null;
  const end = endDate ? new Date(endDate).getTime() : null;
  if (!start || !end || isNaN(start) || isNaN(end)) {
    return { elapsed: "-", remaining: "-" };
  }
  if (now < start) {
    const total = end - start;
    return { elapsed: "-", remaining: formatDuration$1(total) };
  }
  if (now >= end) {
    const total = end - start;
    return { elapsed: formatDuration$1(total), remaining: "-" };
  }
  const elapsed = now - start;
  const remaining = end - now;
  return { elapsed: formatDuration$1(elapsed), remaining: formatDuration$1(remaining) };
}
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "button";
  return /* @__PURE__ */ jsx(
    Comp,
    {
      "data-slot": "button",
      "data-variant": variant,
      "data-size": size,
      className: cn(buttonVariants({ variant, size, className })),
      ...props
    }
  );
}
function DropdownMenu({
  ...props
}) {
  return /* @__PURE__ */ jsx(DropdownMenu$1.Root, { "data-slot": "dropdown-menu", ...props });
}
function DropdownMenuTrigger({
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DropdownMenu$1.Trigger,
    {
      "data-slot": "dropdown-menu-trigger",
      ...props
    }
  );
}
function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}) {
  return /* @__PURE__ */ jsx(DropdownMenu$1.Portal, { children: /* @__PURE__ */ jsx(
    DropdownMenu$1.Content,
    {
      "data-slot": "dropdown-menu-content",
      sideOffset,
      className: cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
        className
      ),
      ...props
    }
  ) });
}
function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DropdownMenu$1.Item,
    {
      "data-slot": "dropdown-menu-item",
      "data-inset": inset,
      "data-variant": variant,
      className: cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props
    }
  );
}
function DropdownMenuLabel({
  className,
  inset,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DropdownMenu$1.Label,
    {
      "data-slot": "dropdown-menu-label",
      "data-inset": inset,
      className: cn(
        "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        className
      ),
      ...props
    }
  );
}
function DropdownMenuSeparator({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DropdownMenu$1.Separator,
    {
      "data-slot": "dropdown-menu-separator",
      className: cn("bg-border -mx-1 my-1 h-px", className),
      ...props
    }
  );
}
function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const Icon = currentTheme === "dark" ? Moon : Sun;
  return /* @__PURE__ */ jsxs(DropdownMenu, { children: [
    /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
      Button,
      {
        variant: "ghost",
        size: "icon",
        "aria-label": "Toggle theme",
        title: "Theme",
        children: /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4" })
      }
    ) }),
    /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", className: "w-40", children: [
      /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setTheme("light"), children: [
        /* @__PURE__ */ jsx(Sun, { className: "mr-2 h-4 w-4" }),
        "Light"
      ] }),
      /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setTheme("dark"), children: [
        /* @__PURE__ */ jsx(Moon, { className: "mr-2 h-4 w-4" }),
        "Dark"
      ] }),
      /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setTheme("system"), children: [
        /* @__PURE__ */ jsx(Monitor, { className: "mr-2 h-4 w-4" }),
        "System"
      ] })
    ] })
  ] });
}
function Avatar({
  className,
  size = "default",
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Avatar$1.Root,
    {
      "data-slot": "avatar",
      "data-size": size,
      className: cn(
        "group/avatar relative flex size-8 shrink-0 overflow-hidden rounded-full select-none data-[size=lg]:size-10 data-[size=sm]:size-6",
        className
      ),
      ...props
    }
  );
}
function AvatarImage({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Avatar$1.Image,
    {
      "data-slot": "avatar-image",
      className: cn("aspect-square size-full", className),
      ...props
    }
  );
}
function AvatarFallback({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Avatar$1.Fallback,
    {
      "data-slot": "avatar-fallback",
      className: cn(
        "bg-muted text-muted-foreground flex size-full items-center justify-center rounded-full text-sm group-data-[size=sm]/avatar:text-xs",
        className
      ),
      ...props
    }
  );
}
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive: "bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline: "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "span";
  return /* @__PURE__ */ jsx(
    Comp,
    {
      "data-slot": "badge",
      "data-variant": variant,
      className: cn(badgeVariants({ variant }), className),
      ...props
    }
  );
}
function Popover({
  ...props
}) {
  return /* @__PURE__ */ jsx(Popover$1.Root, { "data-slot": "popover", ...props });
}
function PopoverTrigger({
  ...props
}) {
  return /* @__PURE__ */ jsx(Popover$1.Trigger, { "data-slot": "popover-trigger", ...props });
}
function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}) {
  return /* @__PURE__ */ jsx(Popover$1.Portal, { children: /* @__PURE__ */ jsx(
    Popover$1.Content,
    {
      "data-slot": "popover-content",
      align,
      sideOffset,
      className: cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
        className
      ),
      ...props
    }
  ) });
}
function ScrollArea({
  className,
  children,
  viewportRef,
  ...props
}) {
  return /* @__PURE__ */ jsxs(
    ScrollArea$1.Root,
    {
      "data-slot": "scroll-area",
      className: cn("relative overflow-hidden", className),
      ...props,
      children: [
        /* @__PURE__ */ jsx(
          ScrollArea$1.Viewport,
          {
            ref: viewportRef,
            "data-slot": "scroll-area-viewport",
            className: "size-full rounded-[inherit] [&>div]:!block",
            children
          }
        ),
        /* @__PURE__ */ jsx(ScrollBar, {}),
        /* @__PURE__ */ jsx(ScrollArea$1.Corner, {})
      ]
    }
  );
}
function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}) {
  return /* @__PURE__ */ jsx(
    ScrollArea$1.ScrollAreaScrollbar,
    {
      "data-slot": "scroll-area-scrollbar",
      orientation,
      className: cn(
        "flex touch-none p-px transition-colors select-none",
        orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent",
        orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx(
        ScrollArea$1.ScrollAreaThumb,
        {
          "data-slot": "scroll-area-thumb",
          className: "bg-border relative flex-1 rounded-full"
        }
      )
    }
  );
}
function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentUser,
    notifications,
    unreadNotificationCount,
    logout: logout2,
    markNotificationRead,
    markAllNotificationsRead
  } = useAuthStore();
  const roles = currentUser?.role ?? [];
  const hasAdmin = roles.includes("admin");
  const hasCreator = roles.includes("creator");
  const hasExplorer = roles.includes("explorer");
  const isAdminView = location.pathname.startsWith("/admin");
  const isCreatorView = location.pathname.startsWith("/creator");
  const isExplorerView = location.pathname.startsWith("/explorer") || location.pathname.startsWith("/activity");
  const homeLink = hasAdmin ? "/admin" : isCreatorView ? "/creator" : "/explorer";
  const handleLogout = () => {
    logout2();
    navigate({ to: "/" });
  };
  const getInitials = (name) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };
  const getNotificationIcon = (type) => {
    switch (type) {
      case "badge_earned":
        return "🏆";
      case "level_up":
        return "⬆️";
      case "new_feedback":
        return "💬";
      case "review_complete":
        return "✅";
      case "deadline_reminder":
        return "⏰";
      case "team_message":
        return "👥";
      default:
        return "🔔";
    }
  };
  return /* @__PURE__ */ jsxs("header", { className: "h-16 border-b border-border bg-card px-4 flex items-center justify-between sticky top-0 z-40", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsxs(Link, { to: homeLink, className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            src: "/android-chrome-192x192.png",
            alt: "Peabee",
            className: "w-10 h-10 rounded-xl"
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "text-xl font-semibold text-foreground hidden sm:block", children: "Peabee" })
      ] }),
      roles.length > 0 && /* @__PURE__ */ jsxs("div", { className: "hidden sm:flex items-center bg-muted rounded-lg p-1", children: [
        hasAdmin && /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => navigate({ to: "/admin" }),
            className: `px-3 py-1 text-sm font-medium rounded-md transition-colors ${isAdminView ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`,
            children: [
              /* @__PURE__ */ jsx(Shield, { className: "w-3.5 h-3.5 inline mr-1" }),
              "Admin"
            ]
          }
        ),
        hasCreator && /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => navigate({ to: "/creator" }),
            className: `px-3 py-1 text-sm font-medium rounded-md transition-colors ${isCreatorView ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`,
            children: [
              /* @__PURE__ */ jsx(PenTool, { className: "w-3.5 h-3.5 inline mr-1" }),
              "Creator"
            ]
          }
        ),
        hasExplorer && /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => navigate({ to: "/explorer" }),
            className: `px-3 py-1 text-sm font-medium rounded-md transition-colors ${isExplorerView ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`,
            children: [
              /* @__PURE__ */ jsx(Compass, { className: "w-3.5 h-3.5 inline mr-1" }),
              "Explorer"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("nav", { className: "hidden md:flex items-center gap-6", children: [
      isAdminView && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/admin",
            className: "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
            activeProps: { className: "text-sm font-medium text-foreground" },
            children: [
              /* @__PURE__ */ jsx(LayoutDashboard, { className: "w-4 h-4 inline mr-1" }),
              "Dashboard"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/admin/users",
            className: "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
            activeProps: { className: "text-sm font-medium text-foreground" },
            children: [
              /* @__PURE__ */ jsx(User, { className: "w-4 h-4 inline mr-1" }),
              "Users"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/admin/settings",
            className: "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
            activeProps: { className: "text-sm font-medium text-foreground" },
            children: [
              /* @__PURE__ */ jsx(Settings, { className: "w-4 h-4 inline mr-1" }),
              "Settings"
            ]
          }
        )
      ] }),
      isCreatorView && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/creator",
            className: "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
            activeProps: { className: "text-sm font-medium text-foreground" },
            children: [
              /* @__PURE__ */ jsx(LayoutDashboard, { className: "w-4 h-4 inline mr-1" }),
              "Dashboard"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/creator/calendar",
            className: "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
            activeProps: { className: "text-sm font-medium text-foreground" },
            children: [
              /* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4 inline mr-1" }),
              "Calendar"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/creator/library",
            className: "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
            activeProps: { className: "text-sm font-medium text-foreground" },
            children: [
              /* @__PURE__ */ jsx(Library, { className: "w-4 h-4 inline mr-1" }),
              "Library"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/creator/store",
            className: "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
            activeProps: { className: "text-sm font-medium text-foreground" },
            children: [
              /* @__PURE__ */ jsx(Store, { className: "w-4 h-4 inline mr-1" }),
              "Store"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/creator/project/new",
            className: "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
            activeProps: { className: "text-sm font-medium text-foreground" },
            children: [
              /* @__PURE__ */ jsx(FolderPlus, { className: "w-4 h-4 inline mr-1" }),
              "New Project"
            ]
          }
        )
      ] }),
      isExplorerView && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/explorer",
            className: "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
            activeProps: { className: "text-sm font-medium text-foreground" },
            children: [
              /* @__PURE__ */ jsx(LayoutDashboard, { className: "w-4 h-4 inline mr-1" }),
              "Dashboard"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/explorer/calendar",
            className: "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
            activeProps: { className: "text-sm font-medium text-foreground" },
            children: [
              /* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4 inline mr-1" }),
              "Calendar"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/explorer/portfolio",
            className: "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
            activeProps: { className: "text-sm font-medium text-foreground" },
            children: [
              /* @__PURE__ */ jsx(Briefcase, { className: "w-4 h-4 inline mr-1" }),
              "Portfolio"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(ThemeToggle, {}),
      currentUser && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(Popover, { children: [
          /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "icon", className: "relative", children: [
            /* @__PURE__ */ jsx(Bell, { className: "h-5 w-5" }),
            unreadNotificationCount > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center", children: unreadNotificationCount > 9 ? "9+" : unreadNotificationCount })
          ] }) }),
          /* @__PURE__ */ jsxs(PopoverContent, { className: "w-80 p-0", align: "end", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 border-b", children: [
              /* @__PURE__ */ jsx("h4", { className: "font-semibold", children: "Notifications" }),
              unreadNotificationCount > 0 && /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "ghost",
                  size: "sm",
                  onClick: markAllNotificationsRead,
                  className: "text-xs",
                  children: "Mark all read"
                }
              )
            ] }),
            /* @__PURE__ */ jsx(ScrollArea, { className: "h-[300px]", children: !notifications || notifications.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-4 text-center text-muted-foreground", children: "No notifications" }) : /* @__PURE__ */ jsx("div", { className: "divide-y", children: notifications.slice(0, 10).map((notification) => /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  markNotificationRead(notification.id);
                  if (notification.actionUrl) {
                    navigate({ to: notification.actionUrl });
                  }
                },
                className: `w-full p-4 text-left hover:bg-muted/50 transition-colors ${!notification.read ? "bg-muted/30" : ""}`,
                children: /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-lg", children: getNotificationIcon(notification.type) }),
                  /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-medium truncate", children: notification.title }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground truncate", children: notification.message }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }) })
                  ] }),
                  !notification.read && /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-cyan-500 mt-2" })
                ] })
              },
              notification.id
            )) }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(DropdownMenu, { children: [
          /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", className: "gap-2 px-2", children: [
            /* @__PURE__ */ jsxs(Avatar, { className: "h-8 w-8", children: [
              /* @__PURE__ */ jsx(AvatarImage, { src: currentUser.avatarUrl || void 0 }),
              /* @__PURE__ */ jsx(AvatarFallback, { className: "bg-cyan-600 text-white text-sm", children: getInitials(currentUser.name) })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "hidden sm:block text-sm font-medium", children: currentUser.name }),
            /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4 text-muted-foreground" })
          ] }) }),
          /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", className: "w-56", children: [
            /* @__PURE__ */ jsx(DropdownMenuLabel, { children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
              /* @__PURE__ */ jsx("span", { children: currentUser.name }),
              /* @__PURE__ */ jsxs("span", { className: "text-xs font-normal text-muted-foreground", children: [
                "Level ",
                currentUser.level,
                " • ",
                currentUser.xp,
                " XP"
              ] })
            ] }) }),
            /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
            isExplorerView && /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxs(Link, { to: "/explorer/portfolio", className: "cursor-pointer", children: [
              /* @__PURE__ */ jsx(User, { className: "mr-2 h-4 w-4" }),
              "My Portfolio"
            ] }) }),
            /* @__PURE__ */ jsxs(DropdownMenuItem, { disabled: true, children: [
              /* @__PURE__ */ jsx(Settings, { className: "mr-2 h-4 w-4" }),
              "Settings",
              /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "ml-auto text-xs", children: "Soon" })
            ] }),
            /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
            /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: handleLogout, className: "text-destructive", children: [
              /* @__PURE__ */ jsx(LogOut, { className: "mr-2 h-4 w-4" }),
              "Logout"
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
}
const AUTH_REDIRECT_STORAGE_KEY = "p3bl:auth-redirect";
function getRoleBasedHomePath(roles) {
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("creator")) return "/creator";
  return "/explorer";
}
function storeRedirectPath(path) {
  if (typeof window === "undefined") return;
  if (!path.startsWith("/")) return;
  if (path.startsWith("/signin") || path.startsWith("/signup")) return;
  sessionStorage.setItem(AUTH_REDIRECT_STORAGE_KEY, path);
}
function getStoredRedirectPath() {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(AUTH_REDIRECT_STORAGE_KEY);
  if (!value || !value.startsWith("/")) return null;
  if (value.startsWith("/signin") || value.startsWith("/signup")) return null;
  return value;
}
function clearStoredRedirectPath() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
}
const appCss = "/assets/styles-CpbRkvXK.css";
const Route$v = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8"
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      },
      {
        title: "Peabee"
      }
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss
      }
    ]
  }),
  component: RootComponent,
  notFoundComponent: RootNotFound
});
function RootComponent() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  useEffect(() => {
    const search = location.search;
    const searchString = (() => {
      if (!search) return "";
      if (typeof search === "string") {
        return search.startsWith("?") ? search : `?${search}`;
      }
      const params = new URLSearchParams(search);
      const serialized = params.toString();
      return serialized ? `?${serialized}` : "";
    })();
    const path = `${location.pathname}${searchString}${location.hash ?? ""}`;
    storeRedirectPath(path);
  }, [location.pathname, location.search, location.hash]);
  return /* @__PURE__ */ jsxs("html", { lang: "en", suppressHydrationWarning: true, children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsx("body", { className: "min-h-screen bg-background antialiased", children: /* @__PURE__ */ jsxs(ThemeProvider, { attribute: "class", defaultTheme: "system", enableSystem: true, children: [
      isAuthenticated && /* @__PURE__ */ jsx(AppHeader, {}),
      /* @__PURE__ */ jsx("main", { children: /* @__PURE__ */ jsx(Outlet, {}) }),
      /* @__PURE__ */ jsx(Toaster, { position: "bottom-right" }),
      /* @__PURE__ */ jsx(Scripts, {})
    ] }) })
  ] });
}
function RootNotFound() {
  return /* @__PURE__ */ jsx("div", { className: "min-h-[calc(100vh-4rem)] flex items-center justify-center px-6", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full text-center space-y-4", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold", children: "Page not found" }),
    /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "The page you requested doesn't exist or was moved." }),
    /* @__PURE__ */ jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 transition-colors",
        children: "Go to home"
      }
    )
  ] }) });
}
const $$splitComponentImporter$s = () => import("./route-B1DLXazQ.js");
const Route$u = createFileRoute("/explorer")({
  component: lazyRouteComponent($$splitComponentImporter$s, "component")
});
const $$splitComponentImporter$r = () => import("./route-Go2LbHVZ.js");
const Route$t = createFileRoute("/creator")({
  component: lazyRouteComponent($$splitComponentImporter$r, "component")
});
const $$splitComponentImporter$q = () => import("./route-CpfQtFAX.js");
const Route$s = createFileRoute("/admin")({
  component: lazyRouteComponent($$splitComponentImporter$q, "component")
});
const $$splitComponentImporter$p = () => import("./index-DL3-iNpZ.js");
const Route$r = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter$p, "component")
});
const $$splitComponentImporter$o = () => import("./index-DfQ4-0nq.js");
const Route$q = createFileRoute("/signup/")({
  component: lazyRouteComponent($$splitComponentImporter$o, "component")
});
const $$splitComponentImporter$n = () => import("./index-zZSSFHqr.js");
const Route$p = createFileRoute("/signin/")({
  component: lazyRouteComponent($$splitComponentImporter$n, "component")
});
const $$splitComponentImporter$m = () => import("./index-D52cwOh8.js");
const Route$o = createFileRoute("/explorer/")({
  component: lazyRouteComponent($$splitComponentImporter$m, "component")
});
const $$splitComponentImporter$l = () => import("./index-DWxCO7dY.js");
const Route$n = createFileRoute("/creator/")({
  component: lazyRouteComponent($$splitComponentImporter$l, "component")
});
const $$splitComponentImporter$k = () => import("./index-B0dkcGTK.js");
const Route$m = createFileRoute("/admin/")({
  component: lazyRouteComponent($$splitComponentImporter$k, "component")
});
const $$splitComponentImporter$j = () => import("./index-aiydlZHX.js");
const Route$l = createFileRoute("/explorer/portfolio/")({
  component: lazyRouteComponent($$splitComponentImporter$j, "component")
});
const $$splitComponentImporter$i = () => import("./index-DjawISZT.js");
const Route$k = createFileRoute("/explorer/calendar/")({
  component: lazyRouteComponent($$splitComponentImporter$i, "component")
});
const $$splitComponentImporter$h = () => import("./index--HYRjTYO.js");
const Route$j = createFileRoute("/creator/store/")({
  component: lazyRouteComponent($$splitComponentImporter$h, "component")
});
const $$splitComponentImporter$g = () => import("./index-D9M7Qt5A.js");
const Route$i = createFileRoute("/creator/library/")({
  component: lazyRouteComponent($$splitComponentImporter$g, "component")
});
const $$splitComponentImporter$f = () => import("./index-CNAaWvpS.js");
const Route$h = createFileRoute("/creator/calendar/")({
  component: lazyRouteComponent($$splitComponentImporter$f, "component")
});
const $$splitComponentImporter$e = () => import("./index-C75kZSOt.js");
const Route$g = createFileRoute("/admin/users/")({
  component: lazyRouteComponent($$splitComponentImporter$e, "component")
});
const $$splitComponentImporter$d = () => import("./index-C5Eeg2Vx.js");
const Route$f = createFileRoute("/admin/settings/")({
  component: lazyRouteComponent($$splitComponentImporter$d, "component")
});
const $$splitComponentImporter$c = () => import("./start.server-funcs-BKzvpNCG.js");
const getTodos = createServerFn({
  method: "GET"
}).handler(createSsrRpc("c9d51a5243700889c80f82ed57a4ce74b25f188e5ebd534c9c64965dc44e8e8d"));
const Route$e = createFileRoute("/demo/start/server-funcs")({
  component: lazyRouteComponent($$splitComponentImporter$c, "component"),
  loader: async () => await getTodos()
});
const $$splitComponentImporter$b = () => import("./start.api-request-DhPN1_Dc.js");
const Route$d = createFileRoute("/demo/start/api-request")({
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const Route$c = createFileRoute("/demo/api/names")({
  server: {
    handlers: {
      GET: () => json(["Alice", "Bob", "Charlie"])
    }
  }
});
const $$splitComponentImporter$a = () => import("./route-Dr6w2Wo7.js");
const Route$b = createFileRoute("/creator/project/$projectId")({
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./index-BGF2XftY.js");
const Route$a = createFileRoute("/explorer/project/$projectId/")({
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./start.ssr.index-BmCCCK3g.js");
const Route$9 = createFileRoute("/demo/start/ssr/")({
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./index-Bb_L3_wh.js");
const Route$8 = createFileRoute("/creator/store/$id/")({
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./index-CtHbM0f0.js");
const Route$7 = createFileRoute("/creator/project/new/")({
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const getUserSchema = z.object({
  userId: z.string()
});
const updateUserSchema = z.object({
  userId: z.string(),
  name: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  defaultSessionDifficulty: z.enum(["easy", "medium", "hard"]).optional()
});
const addXpSchema = z.object({
  userId: z.string(),
  amount: z.number().int(),
  reason: z.string(),
  entityType: z.string().optional(),
  entityId: z.string().optional()
});
createServerFn({
  method: "GET"
}).inputValidator((data) => {
  return getUserSchema.parse(data);
}).handler(createSsrRpc("4e38d84a3f96180ccd0d938445b54912e3a91b228f0eeb3ec846427d409108f1"));
const updateUser = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  return updateUserSchema.parse(data);
}).handler(createSsrRpc("b674e84f4c520f18a82fb513f806555ae87d273e79037d0eebd51652c3b973bc"));
createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("1a6a9496f680af8f9ce44b65a7593dd840ba69db4d1c3d39b885d0619035d5d1"));
createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("c7296286e7842edbf568895224fc586b2882be5b3f5a9eeae14a5ba72affc34c"));
createServerFn({
  method: "POST"
}).inputValidator((data) => {
  return addXpSchema.parse(data);
}).handler(createSsrRpc("57c8b0d960da3e4626a1e8c6194891a29aa8a8fd9c8a9fb288a0452cc08068f5"));
createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("68e8031c61fa6688bca0bcacc43e0a6ef765d92d7f1456d0d2bfd4cd766b71b8"));
const createProjectSchema = z.object({
  creatorId: z.string(),
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  background: z.string().optional(),
  drivingQuestion: z.string().optional(),
  orgId: z.string().optional(),
  teamSize: z.number().int().min(1).max(10).default(4),
  maxParticipants: z.number().int().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});
const joinProjectSchema = z.object({
  userId: z.string(),
  code: z.string().length(6),
  ipAddress: z.string().optional()
});
const getCreatorProjects = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("5db25698990f83e81127de38bb2975c3b84448fe714cd8609bf2f0922092b18d"));
const getUserProjects = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("02422d195e42847cd582607631f50438758c1fa33dd3b8bb5e4fd6839250f1eb"));
const getProject = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("6c339db82241beb50039a36e75943c365148fa4643dd65888e2a82e67ab9ff68"));
const createProject = createServerFn({
  method: "POST"
}).inputValidator((data) => createProjectSchema.parse(data)).handler(createSsrRpc("58d764a2583b6aef2cc5970d9d6b92dc7444f7d77bf211d48634a4621457dc42"));
const updateProject = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("ee92b135cccbaab9a4f083fa47d0d2175ba2d054081fe8b9fc65db70a621c80c"));
const deleteProject = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("e483d82ed8148370e8cd4f4d59c25e80443a17b273ccd58d948403c95a73aaea"));
const joinProject = createServerFn({
  method: "POST"
}).inputValidator((data) => joinProjectSchema.parse(data)).handler(createSsrRpc("14211fbf4f335c5cedd47d589d060380fcc3bc5dbbd83c30a06226c72a043f08"));
const resetJoinCode = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("1381c9e01da43b9bc0fcf00b8072d15667027f99473ac2afcdc090fc867ff830"));
const getUserInvitations = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("3c95c077e838d657635d1a807805fbd7ab572fe810730498f70d9e22b240b887"));
const respondToInvitation = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("d4955f9e41b18849ef75c3ebbba365f1ee1e92465942ec05a32d242303d0923d"));
const allocateTeams = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("482528319fe0691929d95e44672958b0acd3edca7e1caca86d3a241d52f008e3"));
const getProjectParticipants = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("a006a3ea66c89744d80fd67a2003a9b5a6a3c0eec8effa075417707836dfe02c"));
const removeParticipant = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("9e7f5a15180ccbf229a7d5fe9627d98776b6216a303144901cdde69ee678098a"));
const unremoveParticipant = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("06ca06922cdbd7d03d71aaaa3a9805f89dcafaffd83a5f253bde1290550704e9"));
const searchDelegateUsers = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("fd7d4bea043eeb039b07109d12f1a09401c7185a976e6ca12dcab9945017a5a0"));
const delegateProject = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("7adfccce51ea16b84b2c3b4b40d89ee81a44900b2f181c42d774902e6faeca90"));
const cloneProjectAsTemplate = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("5113128641296796d504d5ab14c5416f0dfcc9a2708c7006d5a64fc3c4280e76"));
const getLibraryTemplates = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("94c0af11ce9c4c527d819df9d9c4c033bcae34b7c39bd7f6ec9b0395655bd2ba"));
const deployTemplate = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("9460279c83f6f545772f14be2021a90ae38132c9fb3df7bbd4fa4ca3c646df8f"));
const publishTemplate = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("d2a73d0db7dd32d45d0bd99af24d5542c621317361e00dbf1a5679507aa3d575"));
const unpublishTemplate = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("aca4c587c67266ee06ff6c579b69e420e91722542400be62122362b9062beb26"));
const getStoreTemplates = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("7f2331e59fa0bfbe8337b2ef7cb0ebcc2bed1d622bf12be10b929e9bc85cb2ec"));
const getStoreTemplate = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("27025c073dd56855c50b5fec8c849b39f228c68d3d2ac1506e88845a64a30911"));
const cloneStoreTemplate = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("a9861fca5da20a56be3961bd0bc892cd1b6181c6cf53600293ed7a6eb0669edf"));
const createSessionSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1).max(200),
  topic: z.string().optional(),
  guide: z.string().optional(),
  weight: z.number().min(1).max(200).default(1),
  durationMinutes: z.number().min(1).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  deliverableType: z.enum(["none", "document"]).default("document"),
  deliverableTitle: z.string().optional(),
  deliverableDescription: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  llmModel: z.string().optional()
});
const addResourceSchema = z.object({
  sessionId: z.string(),
  type: z.enum(["pdf", "link", "video", "document", "image"]),
  title: z.string().min(1).max(200),
  url: z.string().url().optional(),
  filePath: z.string().optional()
});
const addRubricSchema = z.object({
  sessionId: z.string(),
  criteria: z.string().min(1).max(500),
  description: z.string().optional(),
  weight: z.number().min(0).max(100).default(1)
});
createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("ee028596de00c19ae1c62031ee5c4e27a1eece15c66a00f0054e3c604adba6e8"));
createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("47f60f7ec2f70fd840260f3b2e5f09169dd9ad9c2ba66aac2d4e908008c883b7"));
const createSession = createServerFn({
  method: "POST"
}).inputValidator((data) => createSessionSchema.parse(data)).handler(createSsrRpc("6f8f77a46933436f03b541469e5cf4268cf65e903441aabeb6834a3dd2f49fa3"));
const updateSession = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("b1c2449e815effc1ccf47a035b31f935baa85039c1eec6a0f8e7bf0fcb5d350f"));
const deleteSession = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("43eb9bf718586fedb0f4125504a9fc0ea654155a00985a931a6c10e337a41a7f"));
const reorderSessions = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("c6175aeb1d4c7b0e00cc49827b15a670396b51e8561fe8f30451b4e4782734ac"));
const addResource = createServerFn({
  method: "POST"
}).inputValidator((data) => addResourceSchema.parse(data)).handler(createSsrRpc("d9335971500660f0ea2e18fd08f62421a882def53a4f12ec14e02bb388effa93"));
createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("cb2dc9e3c8176e0690e27c852fb07d78de50e9e318ceee1054613427b9dde2f8"));
const addRubric = createServerFn({
  method: "POST"
}).inputValidator((data) => addRubricSchema.parse(data)).handler(createSsrRpc("583ff1cd85136d9b081ba707656ed3bf3d6c762c235b1df74cfade2ef8dbedca"));
const updateRubric = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("87e95df5413ddcef70d5e7e17359e29e2c305ccc728d32e55ca7409d7aaa5386"));
const deleteRubric = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("b1d176b80c2cb5278495fa511d7ea2191aa76410880bfee065570fa503f01dfa"));
createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("edb636e8a0f74b5f69011272f1ff41612a81d72d9c9f9c61ea0efe289a37d202"));
const addTemplate = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("33e801d0890c5acd168e0018b6af2f12eb4c4f385db80c380ae280b8e9553ecb"));
const sendMessageSchema = z.object({
  roomId: z.string(),
  userId: z.string().optional(),
  // null for AI messages
  personaId: z.string().optional(),
  // for AI messages
  content: z.string().min(1).max(1e4),
  type: z.enum(["text", "artifact_share", "system", "ai_intervention"]).default("text"),
  metadata: z.record(z.string(), z.any()).optional(),
  replyToId: z.string().optional()
});
const getMessagesSchema = z.object({
  roomId: z.string(),
  limit: z.number().int().min(1).max(100).default(50),
  before: z.string().optional(),
  // message ID to paginate before
  after: z.string().optional()
  // message ID to paginate after
});
const getOrCreateRoomSchema = z.object({
  projectId: z.string(),
  teamId: z.string(),
  userId: z.string(),
  roomName: z.string().optional()
});
const getOrCreateRoom = createServerFn({
  method: "POST"
}).inputValidator((data) => getOrCreateRoomSchema.parse(data)).handler(createSsrRpc("22d9687f50e0c302a9fbb77bc13bcd0bd6a3ecf265051672b9915bfd02c8bf2c"));
const sendMessage = createServerFn({
  method: "POST"
}).inputValidator((data) => sendMessageSchema.parse(data)).handler(createSsrRpc("4f1a7d38c754881dc34fd2c6d1276823d891a3e754052ad17b3966637daa6c75"));
const getMessages = createServerFn({
  method: "GET"
}).inputValidator((data) => getMessagesSchema.parse(data)).handler(createSsrRpc("b89be771863ad7fc81d33de53a476cade68474436bd7a93449270cec2ac9abde"));
createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("78d6d4e5e8536b9b5a4589c82badea70b600ff7e2ba7f734d4f7ebabcae0a153"));
createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("c6389a0181611453122debda7ec885974d385e2651c260fa8bd5ac0411e0c60c"));
createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("aec1a315663e2b6667631de06138d0588ad0af26b9d461e7bfc36348f87f7d33"));
const sendFloatingBotMessage = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("cea61e7c93a8e9e5a2a4744673f884930bca0d522a581346079ae9fe16789a94"));
const getFloatingBotMessages = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("b5038eb2290f81f7ff67357f619bf80ca96a8d2d098d05588d32a097ebbda59a"));
const getTeamPersonas = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("3a539797e52d9ff1fc86cfbc178b4cbe145080407a5f85702b65dd990e199e05"));
createServerFn({
  method: "GET"
}).handler(createSsrRpc("2945f52eb3ea2d2f40721dc567474d34835ae51c729047fd4a50a4a07db2bd75"));
const createNotificationSchema = z.object({
  userId: z.string(),
  type: z.enum(["new_feedback", "review_complete", "session_unlocked", "deadline_reminder", "team_message", "badge_earned", "level_up", "project_invitation", "ai_intervention", "system"]),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1e3),
  projectId: z.string().optional(),
  teamId: z.string().optional(),
  data: z.record(z.any()).optional(),
  actionUrl: z.string().optional()
});
createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("0144e931adcadb2c5835e5ef35706bc547a0dcde12bef3285080f481d4fac3f4"));
createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("12c3233fba121ab71d9fd6368c20824d26be73c37403dc5040a7392317b3f146"));
createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("1044aa5f0a361be8c8b80ed3e5cd06da7dd0256c40732f15eb158ce429086192"));
createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("8baff8d1f43ad71ca7edd40bfbfd1610e4a3aeb3c6f783de51bd67bb98d1a8af"));
createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("f519f7d9ed3aa0d45b6ceb5961e06ec55c47d9fe1aa5c3e68ae4e70131128833"));
createServerFn({
  method: "POST"
}).inputValidator((data) => createNotificationSchema.parse(data)).handler(createSsrRpc("fb1f0c9902ab14f7dcf3b31953db32440269cd2c3b85e16314e46686a59dab92"));
createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("681bca82a1d8acf243c1dfd6b5224b8c5d6e9300b05b021794680e153a80c3fa"));
createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("5a44f522455635e0c81e5d726403f6b2173ee0007df8b0bbd50de6d117392a55"));
createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("ac76e416755eb8ad31ab8260190af36afb7e484cea25809d1c2678e511d805a9"));
const getCreatorDashboardStats = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("ea040ef298c6307e3294c6be160b3b3e5d00e5f19c0281d9483499f83391a88c"));
const getProjectTeamsWithProgress = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("53133277a54baa242ac8764724d661e63475cd0b46190f49413d440668069552"));
const getLearningMetrics = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("ceb02c61ce6d3d92d5932076d0fe87ea6e28e77087558d8b3dfd6778c921bb6e"));
createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("6f365a1105a97d93988c0afeb108d26712e638503065671f92aa47fe1792085c"));
const getProjectInterventions = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("e2d4528d6a54a083e994f881555ded2a42c17316d4ac19e0fcea3b1d7801c58c"));
const createIntervention = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("4772894a5b856f51587b168fe8cc1abb2bbb5afb3262d69e5de6d2df6bcd782b"));
const updateInterventionStatus = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("d89f07b083d25d6016afb00f2cbb5c2928b31798afb623812013f17ce5bcb9cc"));
const getProjectSubmissions = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("e06a2be867458da8175bfdea5bbb452bfa3e666c37e419fc4ee267ad1d1e2916"));
const regradeSubmission = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("f9b48ad9c6a0d116317b9da711c8fc14ef6b5645e0c166db9c28b809d83e8405"));
const gradeSubmission = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("e09d7c9908ed722d93aa9043d22cb3d7b21c0a36c960f00a5dc19f94e604543a"));
createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("5da98288a1e723901fb931468e0d7b16d35aed1164b6d1387eb42c1dd22b844d"));
const getAiPersonas = createServerFn({
  method: "GET"
}).handler(createSsrRpc("74a454497eab31e9eab5841136276064a8a69028c0e32a369004ebb509d09f83"));
const aiChatCompletion = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("c7e92d4a50b79a5d6601d37896e78bf7b90aa5d3855ea98c8eb4d06296f2e592"));
const aiListModels = createServerFn({
  method: "GET"
}).handler(createSsrRpc("94d7828b20e4cb3a717adbca5dc58ad4f00a818138d6dff2d6cc88f801fbc808"));
const listUsersSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(["explorer", "creator", "admin"]).optional(),
  sortBy: z.enum(["name", "email", "createdAt", "role"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc")
});
const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters").max(30).regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  role: z.array(z.enum(["explorer", "creator", "admin"])).min(1, "At least one role is required")
});
const updateUserRoleSchema = z.object({
  userId: z.string(),
  role: z.array(z.enum(["explorer", "creator", "admin"])).min(1, "At least one role is required")
});
const deleteUserSchema = z.object({
  userId: z.string()
});
const listUsers = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  return listUsersSchema.parse(data);
}).handler(createSsrRpc("47a259c86e4e4c509f552ef3be68a777844b86c38d775ea3cb27f10b9fd77ade"));
const createUser = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const result = createUserSchema.safeParse(data);
  if (!result.success) {
    throw new Error(JSON.stringify({
      error: "Validation failed",
      errors: result.error.flatten().fieldErrors
    }));
  }
  return result.data;
}).handler(createSsrRpc("5f8b7430af7f276020ef59ac9aa988681c57f02624fbf962aa6adad723d1bebc"));
const updateUserRole = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  return updateUserRoleSchema.parse(data);
}).handler(createSsrRpc("fc4623321573eac174526b4cdab8ad3644c95af96e32d0ca4d18632df7acafbd"));
const deleteUser = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  return deleteUserSchema.parse(data);
}).handler(createSsrRpc("4e36c9220b8fe994fcc5d6437a5a14660ca836e3fc5bb105a3b12cc8c665c599"));
const getUserDetails = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("dc6aa13381f21d807ea21e2f11f84f602c78fdeff34923b90f5e73c7c0f4b241"));
const resetUserPassword = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  if (data.newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  return data;
}).handler(createSsrRpc("78ecad17be445d6a6781db4186d11621ae54ba039b7b1b243fe45efa3bb25dc9"));
const getAdminStats = createServerFn({
  method: "GET"
}).handler(createSsrRpc("e63ad3d46385de059d65eddab4459349d905e32966d15fd4b2bf27ff2bc5e04a"));
const getSystemSettings = createServerFn({
  method: "GET"
}).handler(createSsrRpc("855a38ea38ff3de80b1029f3b1e7b120f4ccc36b3df64ad35176c76403deaf63"));
const getSystemSetting = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("cdee01f9917689bb20aa811742ad36d5fc505ccb12a479df3c7cc6ead5de3897"));
const updateSystemSetting = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  if (!data.key || typeof data.value !== "string") {
    throw new Error("Invalid setting data");
  }
  return data;
}).handler(createSsrRpc("d54a709fe3d33a2f5d84b61545574910e4748eec156519a5c564fe9a7543324d"));
const getAIModel = createServerFn({
  method: "GET"
}).handler(createSsrRpc("798774a76b55ce0d3e8744f8e9deb2964d6c47265683aff87704a7222691360d"));
const admin = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  createUser,
  deleteUser,
  getAIModel,
  getAdminStats,
  getSystemSetting,
  getSystemSettings,
  getUserDetails,
  listUsers,
  resetUserPassword,
  updateSystemSetting,
  updateUserRole
}, Symbol.toStringTag, { value: "Module" }));
const defaultWizardState = {
  mode: "keyword",
  currentStep: 1,
  totalSteps: 6,
  uploadedFiles: [],
  ragProcessingStatus: "idle",
  basicInfo: {
    title: "",
    background: "",
    drivingQuestion: ""
  },
  selectedAIPersonaIds: [],
  participantParams: {
    projectMode: "team",
    teamSize: 2
  },
  timeline: {
    startDate: "",
    endDate: ""
  },
  sessions: [],
  isValid: false,
  validationErrors: {}
};
const DIFFICULTY_WEIGHTS$1 = {
  easy: 60,
  medium: 100,
  hard: 140
};
const DIFFICULTY_DURATIONS$1 = {
  easy: 60,
  medium: 100,
  hard: 140
};
function createDefaultSession(index, difficulty = "medium") {
  return {
    index,
    title: `Session ${index + 1}`,
    topic: "",
    guide: "",
    difficulty,
    weight: DIFFICULTY_WEIGHTS$1[difficulty],
    durationMinutes: DIFFICULTY_DURATIONS$1[difficulty],
    startDate: "",
    endDate: "",
    deliverableType: "document",
    rubric: [],
    resources: [],
    templates: [],
    llmModel: "gpt-4"
  };
}
const useCreatorStore = create()(
  persist(
    (set, get) => ({
      // Initialize with empty data - will be fetched from API
      projects: [],
      aiPersonas: [],
      experts: [],
      assessmentDrafts: [],
      interventions: [],
      dashboardStats: {
        scheduledProjects: 0,
        openedProjects: 0,
        closedProjects: 0,
        totalLearners: 0,
        projectsAtRisk: 0
      },
      liveMatrixCache: /* @__PURE__ */ new Map(),
      dipChartCache: /* @__PURE__ */ new Map(),
      participantsCache: /* @__PURE__ */ new Map(),
      isLoading: false,
      isLoadingMatrix: false,
      isLoadingMetrics: false,
      error: null,
      wizardState: { ...defaultWizardState },
      lastSessionDifficulty: "medium",
      currentProjectId: null,
      activeView: "dashboard",
      // Dashboard getters - categorize by dates
      getAllProjects: () => {
        return get().projects;
      },
      getScheduledProjects: () => {
        const now = /* @__PURE__ */ new Date();
        return get().projects.filter((p) => {
          if (!p.startDate) return false;
          return new Date(p.startDate) > now;
        });
      },
      getOpenedProjects: () => {
        const now = /* @__PURE__ */ new Date();
        return get().projects.filter((p) => {
          if (!p.startDate) return true;
          const startDate = new Date(p.startDate);
          const endDate = p.endDate ? new Date(p.endDate) : null;
          return startDate <= now && (!endDate || endDate > now);
        });
      },
      getClosedProjects: () => {
        const now = /* @__PURE__ */ new Date();
        return get().projects.filter((p) => {
          if (!p.endDate) return false;
          return new Date(p.endDate) <= now;
        });
      },
      getProject: (projectId) => {
        return get().projects.find((p) => p.id === projectId);
      },
      // Monitoring getters (from cache or empty)
      getLiveMatrix: (projectId) => {
        return get().liveMatrixCache.get(projectId) || [];
      },
      getDipChartData: (projectId) => {
        return get().dipChartCache.get(projectId) || [];
      },
      getProjectInterventions: (projectId) => {
        const project = get().getProject(projectId);
        if (!project) return [];
        return get().interventions.filter(
          (i) => i.targetTeamIds.some(
            (teamId) => project.teams.some((t) => t.id === teamId)
          )
        );
      },
      getParticipants: (projectId) => {
        return get().participantsCache.get(projectId) || null;
      },
      // Async data fetching
      fetchProjects: async (creatorId, options) => {
        set({ isLoading: true, error: null });
        try {
          const result = await getCreatorProjects({
            data: {
              creatorId,
              includeTemplates: options?.includeTemplates
            }
          });
          if (result.success && result.projects) {
            const transformedProjects = result.projects.map((p) => ({
              id: p.id,
              name: p.title,
              description: p.description || "",
              drivingQuestion: p.drivingQuestion || "",
              creatorId: p.creatorId,
              joinCode: p.joinCode,
              qrCode: null,
              totalParticipants: p.maxParticipants || 0,
              teamSize: p.teamSize || 4,
              teamFormationMode: "automatic",
              startDate: p.startDate || "",
              endDate: p.endDate || "",
              sessions: p.sessions?.map((s, idx) => {
                const difficulty = s.difficulty || "medium";
                return {
                  id: s.id,
                  index: s.order || idx,
                  title: s.title,
                  topic: s.topic || "",
                  guide: s.guide || "",
                  difficulty,
                  weight: s.weight ?? DIFFICULTY_WEIGHTS$1[difficulty],
                  durationMinutes: s.durationMinutes ?? DIFFICULTY_DURATIONS$1[difficulty],
                  startDate: s.startDate || "",
                  endDate: s.endDate || "",
                  deliverableType: s.deliverableType || "document",
                  rubric: (s.rubrics || []).map((r) => ({
                    id: r.id,
                    criterion: r.criteria,
                    description: r.description || "",
                    weight: r.weight
                  })),
                  resources: [],
                  templates: [],
                  llmModel: s.llmModel || "gpt-4"
                };
              }) || [],
              teams: [],
              // Will be populated by fetchLiveMatrix
              aiPersonaIds: [],
              expertIds: [],
              riskLevel: "green",
              createdAt: p.createdAt,
              completedAt: null
            }));
            set({ projects: transformedProjects, isLoading: false });
          } else {
            set({ error: result.error || "Failed to fetch projects", isLoading: false });
          }
        } catch (error) {
          set({ error: "Failed to fetch projects", isLoading: false });
        }
      },
      fetchDashboardStats: async (creatorId) => {
        try {
          const result = await getCreatorDashboardStats({ data: { creatorId } });
          if (result.success && result.stats) {
            set({ dashboardStats: result.stats });
          }
        } catch (error) {
          console.error("Failed to fetch dashboard stats:", error);
        }
      },
      fetchLiveMatrix: async (projectId) => {
        set({ isLoadingMatrix: true });
        try {
          const result = await getProjectTeamsWithProgress({ data: { projectId } });
          if (result.success && result.teams) {
            const matrixEntries = result.teams.map((t) => ({
              teamId: t.teamId,
              teamName: t.teamName,
              riskLevel: t.riskLevel,
              members: t.members,
              sessionProgress: t.sessionProgress.map((sp) => ({
                sessionIndex: sp.sessionIndex,
                status: sp.status,
                submittedAt: sp.submittedAt,
                statusUpdatedAt: sp.statusUpdatedAt
              }))
            }));
            const newCache = new Map(get().liveMatrixCache);
            newCache.set(projectId, matrixEntries);
            set((state) => ({
              liveMatrixCache: newCache,
              isLoadingMatrix: false,
              projects: state.projects.map(
                (p) => p.id === projectId ? {
                  ...p,
                  teams: result.teams.map((t) => ({
                    id: t.teamId,
                    name: t.teamName,
                    memberIds: t.members.map((m) => m.id),
                    aiPersonaIds: [],
                    riskLevel: t.riskLevel,
                    riskReason: t.riskReason,
                    lastActivityAt: t.lastActivityAt
                  }))
                } : p
              )
            }));
          } else {
            set({ isLoadingMatrix: false });
          }
        } catch (error) {
          console.error("Failed to fetch live matrix:", error);
          set({ isLoadingMatrix: false });
        }
      },
      fetchParticipants: async (projectId) => {
        try {
          const result = await getProjectParticipants({ data: { projectId } });
          if (result.success && result.participants) {
            const newCache = new Map(get().participantsCache);
            newCache.set(projectId, result.participants);
            set({ participantsCache: newCache });
          }
        } catch (error) {
          console.error("Failed to fetch participants:", error);
        }
      },
      fetchDipChartData: async (projectId) => {
        set({ isLoadingMetrics: true });
        try {
          const result = await getLearningMetrics({ data: { projectId, days: 90 } });
          if (result.success && result.metrics) {
            const chartData = result.metrics.map((m) => ({
              date: m.date,
              teamId: m.teamId,
              teamName: m.teamName,
              score: m.score,
              overallScore: m.overallScore,
              rubricScores: m.rubricScores || {}
            }));
            const newCache = new Map(get().dipChartCache);
            newCache.set(projectId, chartData);
            set({ dipChartCache: newCache, isLoadingMetrics: false });
          } else {
            set({ isLoadingMetrics: false });
          }
        } catch (error) {
          console.error("Failed to fetch dip chart data:", error);
          set({ isLoadingMetrics: false });
        }
      },
      fetchInterventions: async (projectId) => {
        try {
          const result = await getProjectInterventions({ data: { projectId } });
          if (result.success && result.interventions) {
            const newInterventions = result.interventions.map((i) => ({
              id: i.id,
              timestamp: i.timestamp,
              type: i.type,
              description: i.description,
              targetTeamIds: i.targetTeamIds,
              status: i.status
            }));
            set((state) => {
              const project = state.projects.find((p) => p.id === projectId);
              const projectTeamIds = project?.teams.map((t) => t.id) || [];
              const otherInterventions = state.interventions.filter(
                (i) => !i.targetTeamIds.some((tid) => projectTeamIds.includes(tid))
              );
              return { interventions: [...otherInterventions, ...newInterventions] };
            });
          }
        } catch (error) {
          console.error("Failed to fetch interventions:", error);
        }
      },
      fetchAiPersonas: async () => {
        try {
          const result = await getAiPersonas();
          if (result.success && result.personas) {
            const personas = result.personas.map((p) => ({
              id: p.id,
              name: p.name,
              avatar: p.avatar,
              role: p.type,
              personality: p.description || "",
              expertise: p.expertise || []
            }));
            set({ aiPersonas: personas });
          }
        } catch (error) {
          console.error("Failed to fetch AI personas:", error);
        }
      },
      // Actions
      setCurrentProject: (projectId) => {
        set({ currentProjectId: projectId });
      },
      setActiveView: (view) => {
        set({ activeView: view });
      },
      clearError: () => {
        set({ error: null });
      },
      // Wizard actions
      setWizardMode: (mode) => {
        set((state) => ({
          wizardState: { ...state.wizardState, mode }
        }));
      },
      setWizardStep: (step) => {
        const { wizardState } = get();
        if (step >= 1 && step <= wizardState.totalSteps) {
          set((state) => ({
            wizardState: { ...state.wizardState, currentStep: step }
          }));
        }
      },
      nextStep: () => {
        const { wizardState } = get();
        const step = wizardState.currentStep;
        if (step === 2) {
          if (!wizardState.basicInfo.title.trim()) {
            return { success: false, error: "Project title is required" };
          }
          if (!wizardState.basicInfo.drivingQuestion.trim()) {
            return { success: false, error: "Driving question is required" };
          }
        }
        if (step === 3) {
          if (wizardState.participantParams.projectMode === "team" && wizardState.participantParams.teamSize < 2) {
            return { success: false, error: "Team size must be at least 2" };
          }
        }
        if (step === 4) {
          if (!wizardState.timeline.startDate) {
            return { success: false, error: "Start date is required" };
          }
          if (!wizardState.timeline.endDate) {
            return { success: false, error: "End date is required" };
          }
        }
        if (step === 5) {
          if (wizardState.sessions.length === 0) {
            return { success: false, error: "At least one session is required" };
          }
          for (const session of wizardState.sessions) {
            if (session.deliverableType !== "none" && session.rubric.length > 0) {
              const totalWeight = session.rubric.reduce((sum, r) => sum + r.weight, 0);
              if (totalWeight !== 100) {
                return { success: false, error: `Rubric weights for "${session.title || "Untitled session"}" must add up to 100% (currently ${totalWeight}%)` };
              }
            }
          }
        }
        if (wizardState.currentStep < wizardState.totalSteps) {
          set((state) => ({
            wizardState: { ...state.wizardState, currentStep: state.wizardState.currentStep + 1 }
          }));
        }
        return { success: true };
      },
      prevStep: () => {
        const { wizardState } = get();
        if (wizardState.currentStep > 1) {
          set((state) => ({
            wizardState: { ...state.wizardState, currentStep: state.wizardState.currentStep - 1 }
          }));
        }
      },
      updateBasicInfo: (info) => {
        set((state) => ({
          wizardState: {
            ...state.wizardState,
            basicInfo: { ...state.wizardState.basicInfo, ...info }
          }
        }));
      },
      setSelectedAIPersonas: (ids) => {
        set((state) => ({
          wizardState: { ...state.wizardState, selectedAIPersonaIds: ids }
        }));
      },
      updateParticipantParams: (params) => {
        set((state) => ({
          wizardState: {
            ...state.wizardState,
            participantParams: { ...state.wizardState.participantParams, ...params }
          }
        }));
      },
      setTimeline: (timeline) => {
        set((state) => ({
          wizardState: { ...state.wizardState, timeline }
        }));
      },
      setLastSessionDifficulty: (difficulty) => {
        set({ lastSessionDifficulty: difficulty });
      },
      addSession: () => {
        set((state) => {
          const newIndex = state.wizardState.sessions.length;
          return {
            wizardState: {
              ...state.wizardState,
              sessions: [
                ...state.wizardState.sessions,
                createDefaultSession(newIndex, state.lastSessionDifficulty)
              ]
            }
          };
        });
      },
      updateSession: (index, updates) => {
        set((state) => ({
          wizardState: {
            ...state.wizardState,
            sessions: state.wizardState.sessions.map((s, i) => {
              if (i !== index) return s;
              const newUpdates = { ...updates };
              if (updates.difficulty && updates.difficulty !== s.difficulty) {
                newUpdates.weight = DIFFICULTY_WEIGHTS$1[updates.difficulty];
                newUpdates.durationMinutes = DIFFICULTY_DURATIONS$1[updates.difficulty];
              }
              return { ...s, ...newUpdates };
            })
          },
          lastSessionDifficulty: updates.difficulty && updates.difficulty !== state.wizardState.sessions[index]?.difficulty ? updates.difficulty : state.lastSessionDifficulty
        }));
      },
      removeSession: (index) => {
        set((state) => ({
          wizardState: {
            ...state.wizardState,
            sessions: state.wizardState.sessions.filter((_, i) => i !== index).map((s, i) => ({ ...s, index: i }))
          }
        }));
      },
      setSessions: (sessions) => {
        set((state) => ({
          wizardState: {
            ...state.wizardState,
            sessions: sessions.map((s, i) => ({ ...s, index: i }))
          },
          lastSessionDifficulty: sessions.length > 0 ? sessions[sessions.length - 1].difficulty : state.lastSessionDifficulty
        }));
      },
      quickStart: (data) => {
        set((state) => ({
          wizardState: {
            ...state.wizardState,
            mode: "quickstart",
            basicInfo: data.basicInfo,
            selectedAIPersonaIds: ["persona_sage", "persona_spark"],
            participantParams: {
              projectMode: "team",
              teamSize: 2
            },
            timeline: data.timeline,
            sessions: data.sessions,
            isValid: true,
            validationErrors: {}
          },
          lastSessionDifficulty: data.sessions.length > 0 ? data.sessions[data.sessions.length - 1].difficulty : state.lastSessionDifficulty
        }));
      },
      resetWizard: () => {
        set({ wizardState: { ...defaultWizardState } });
      },
      validateWizard: () => {
        const { wizardState } = get();
        const errors = {};
        if (!wizardState.basicInfo.title.trim()) {
          errors.title = "Project title is required";
        }
        if (!wizardState.basicInfo.drivingQuestion.trim()) {
          errors.drivingQuestion = "Driving question is required";
        }
        if (wizardState.participantParams.projectMode === "team" && wizardState.participantParams.teamSize < 2) {
          errors.teamSize = "Team size must be at least 2";
        }
        if (!wizardState.timeline.startDate) {
          errors.startDate = "Start date is required";
        }
        if (!wizardState.timeline.endDate) {
          errors.endDate = "End date is required";
        }
        if (wizardState.sessions.length === 0) {
          errors.sessions = "At least one session is required";
        }
        const isValid = Object.keys(errors).length === 0;
        set((state) => ({
          wizardState: { ...state.wizardState, isValid, validationErrors: errors }
        }));
        return isValid;
      },
      // Project actions (async)
      createProject: async (creatorId) => {
        const { wizardState, validateWizard } = get();
        if (!validateWizard()) {
          return null;
        }
        try {
          const effectiveTeamSize = wizardState.participantParams.projectMode === "personal" ? 1 : wizardState.participantParams.teamSize;
          const result = await createProject({
            data: {
              creatorId,
              title: wizardState.basicInfo.title,
              description: wizardState.basicInfo.background,
              drivingQuestion: wizardState.basicInfo.drivingQuestion,
              teamSize: effectiveTeamSize,
              startDate: wizardState.timeline.startDate,
              endDate: wizardState.timeline.endDate
            }
          });
          if (result.success && result.project) {
            const projectId = result.project.id;
            const createdSessionIds = [];
            for (const session of wizardState.sessions) {
              try {
                const sessionResult = await createSession({
                  data: {
                    projectId,
                    title: session.title,
                    topic: session.topic,
                    guide: session.guide,
                    weight: session.weight,
                    durationMinutes: session.durationMinutes,
                    difficulty: session.difficulty,
                    deliverableType: session.deliverableType,
                    startDate: session.startDate,
                    endDate: session.endDate,
                    llmModel: session.llmModel
                  }
                });
                if (sessionResult.success && sessionResult.sessionId) {
                  createdSessionIds.push(sessionResult.sessionId);
                  for (const rubric of session.rubric) {
                    await addRubric({
                      data: {
                        sessionId: sessionResult.sessionId,
                        criteria: rubric.criterion,
                        description: rubric.description,
                        weight: rubric.weight
                      }
                    });
                  }
                  for (const resource of session.resources) {
                    await addResource({
                      data: {
                        sessionId: sessionResult.sessionId,
                        type: resource.type,
                        title: resource.title,
                        url: resource.url
                      }
                    });
                  }
                  for (const template of session.templates) {
                    await addTemplate({
                      data: {
                        sessionId: sessionResult.sessionId,
                        name: template.name,
                        content: template.content,
                        type: "document"
                        // Default type for templates
                      }
                    });
                  }
                }
              } catch (sessionError) {
                console.error("Failed to create session:", sessionError);
              }
            }
            const now = (/* @__PURE__ */ new Date()).toISOString();
            const newProject = {
              id: projectId,
              name: wizardState.basicInfo.title,
              description: wizardState.basicInfo.background,
              drivingQuestion: wizardState.basicInfo.drivingQuestion,
              creatorId,
              joinCode: result.project.joinCode,
              qrCode: null,
              totalParticipants: 0,
              teamSize: effectiveTeamSize,
              teamFormationMode: "automatic",
              startDate: wizardState.timeline.startDate,
              endDate: wizardState.timeline.endDate,
              sessions: wizardState.sessions.map((s, idx) => ({
                ...s,
                id: createdSessionIds[idx] || `session_${projectId}_${idx}`
              })),
              teams: [],
              aiPersonaIds: wizardState.selectedAIPersonaIds,
              expertIds: [],
              riskLevel: "green",
              createdAt: now,
              completedAt: null
            };
            set((state) => ({
              projects: [...state.projects, newProject],
              wizardState: { ...defaultWizardState }
            }));
            return newProject;
          }
          set({ error: result.error || "Failed to create project" });
          return null;
        } catch (error) {
          set({ error: "Failed to create project" });
          return null;
        }
      },
      deleteProject: async (projectId) => {
        try {
          const result = await deleteProject({ data: { projectId } });
          if (result.success) {
            set((state) => ({
              projects: state.projects.filter((p) => p.id !== projectId)
            }));
            return true;
          }
          set({ error: result.error || "Failed to delete project" });
          return false;
        } catch (error) {
          set({ error: "Failed to delete project" });
          return false;
        }
      },
      regenerateJoinCode: async (projectId, creatorId) => {
        try {
          const result = await resetJoinCode({ data: { projectId, creatorId } });
          if (result.success && result.joinCode) {
            set((state) => ({
              projects: state.projects.map(
                (p) => p.id === projectId ? { ...p, joinCode: result.joinCode } : p
              )
            }));
            return result.joinCode;
          }
          return null;
        } catch (error) {
          return null;
        }
      },
      // Team actions
      removeParticipant: async (projectId, userId) => {
        try {
          const result = await removeParticipant({ data: { projectId, userId } });
          if (result.success) {
            await get().fetchParticipants(projectId);
            await get().fetchLiveMatrix(projectId);
            return true;
          }
          return false;
        } catch (error) {
          console.error("Failed to remove participant:", error);
          return false;
        }
      },
      updateTeamRisk: (projectId, teamId, riskLevel, reason) => {
        set((state) => ({
          projects: state.projects.map(
            (p) => p.id === projectId ? {
              ...p,
              teams: p.teams.map(
                (t) => t.id === teamId ? { ...t, riskLevel, riskReason: reason } : t
              )
            } : p
          )
        }));
      },
      // Intervention actions (async)
      proposeIntervention: async (projectId, intervention, creatorId) => {
        try {
          const result = await createIntervention({
            data: {
              projectId,
              type: intervention.type,
              description: intervention.description,
              targetTeamIds: intervention.targetTeamIds,
              createdBy: creatorId
            }
          });
          if (result.success && result.interventionId) {
            const newIntervention = {
              ...intervention,
              id: result.interventionId,
              status: "proposed"
            };
            set((state) => ({
              interventions: [...state.interventions, newIntervention]
            }));
          }
        } catch (error) {
          console.error("Failed to create intervention:", error);
        }
      },
      approveIntervention: async (interventionId) => {
        try {
          const result = await updateInterventionStatus({
            data: { interventionId, status: "approved" }
          });
          if (result.success) {
            set((state) => ({
              interventions: state.interventions.map(
                (i) => i.id === interventionId ? { ...i, status: "approved" } : i
              )
            }));
          }
        } catch (error) {
          console.error("Failed to approve intervention:", error);
        }
      },
      rejectIntervention: async (interventionId) => {
        try {
          const result = await updateInterventionStatus({
            data: { interventionId, status: "rejected" }
          });
          if (result.success) {
            set((state) => ({
              interventions: state.interventions.map(
                (i) => i.id === interventionId ? { ...i, status: "rejected" } : i
              )
            }));
          }
        } catch (error) {
          console.error("Failed to reject intervention:", error);
        }
      },
      // Assessment actions
      updateAssessmentDraft: (draftId, updates) => {
        set((state) => ({
          assessmentDrafts: state.assessmentDrafts.map(
            (d) => d.id === draftId ? { ...d, ...updates } : d
          )
        }));
      },
      finalizeAssessment: (draftId) => {
        set((state) => ({
          assessmentDrafts: state.assessmentDrafts.map(
            (d) => d.id === draftId ? { ...d, status: "finalized", finalizedAt: (/* @__PURE__ */ new Date()).toISOString() } : d
          )
        }));
      }
    }),
    {
      name: "p3bl-creator",
      partialize: (state) => ({
        wizardState: state.wizardState,
        currentProjectId: state.currentProjectId,
        lastSessionDifficulty: state.lastSessionDifficulty
        // Don't persist projects - fetch fresh from API
      })
    }
  )
);
function Progress({
  className,
  value,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Progress$1.Root,
    {
      "data-slot": "progress",
      className: cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx(
        Progress$1.Indicator,
        {
          "data-slot": "progress-indicator",
          className: "bg-primary h-full w-full flex-1 transition-all",
          style: { transform: `translateX(-${100 - (value || 0)}%)` }
        }
      )
    }
  );
}
function Input({ className, type, ...props }) {
  return /* @__PURE__ */ jsx(
    "input",
    {
      type,
      "data-slot": "input",
      className: cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      ),
      ...props
    }
  );
}
function Textarea({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "textarea",
    {
      "data-slot": "textarea",
      className: cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      ),
      ...props
    }
  );
}
function Select({
  ...props
}) {
  return /* @__PURE__ */ jsx(Select$1.Root, { "data-slot": "select", ...props });
}
function SelectValue({
  ...props
}) {
  return /* @__PURE__ */ jsx(Select$1.Value, { "data-slot": "select-value", ...props });
}
function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxs(
    Select$1.Trigger,
    {
      "data-slot": "select-trigger",
      "data-size": size,
      className: cn(
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsx(Select$1.Icon, { asChild: true, children: /* @__PURE__ */ jsx(ChevronDownIcon, { className: "size-4 opacity-50" }) })
      ]
    }
  );
}
function SelectContent({
  className,
  children,
  position = "item-aligned",
  align = "center",
  ...props
}) {
  return /* @__PURE__ */ jsx(Select$1.Portal, { children: /* @__PURE__ */ jsxs(
    Select$1.Content,
    {
      "data-slot": "select-content",
      className: cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
        position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      ),
      position,
      align,
      ...props,
      children: [
        /* @__PURE__ */ jsx(SelectScrollUpButton, {}),
        /* @__PURE__ */ jsx(
          Select$1.Viewport,
          {
            className: cn(
              "p-1",
              position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
            ),
            children
          }
        ),
        /* @__PURE__ */ jsx(SelectScrollDownButton, {})
      ]
    }
  ) });
}
function SelectItem({
  className,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxs(
    Select$1.Item,
    {
      "data-slot": "select-item",
      className: cn(
        "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsx(
          "span",
          {
            "data-slot": "select-item-indicator",
            className: "absolute right-2 flex size-3.5 items-center justify-center",
            children: /* @__PURE__ */ jsx(Select$1.ItemIndicator, { children: /* @__PURE__ */ jsx(CheckIcon, { className: "size-4" }) })
          }
        ),
        /* @__PURE__ */ jsx(Select$1.ItemText, { children })
      ]
    }
  );
}
function SelectScrollUpButton({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Select$1.ScrollUpButton,
    {
      "data-slot": "select-scroll-up-button",
      className: cn(
        "flex cursor-default items-center justify-center py-1",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx(ChevronUpIcon, { className: "size-4" })
    }
  );
}
function SelectScrollDownButton({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Select$1.ScrollDownButton,
    {
      "data-slot": "select-scroll-down-button",
      className: cn(
        "flex cursor-default items-center justify-center py-1",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx(ChevronDownIcon, { className: "size-4" })
    }
  );
}
function TooltipProvider({
  delayDuration = 0,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Tooltip$1.Provider,
    {
      "data-slot": "tooltip-provider",
      delayDuration,
      ...props
    }
  );
}
function Tooltip({
  ...props
}) {
  return /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsx(Tooltip$1.Root, { "data-slot": "tooltip", ...props }) });
}
function TooltipTrigger({
  ...props
}) {
  return /* @__PURE__ */ jsx(Tooltip$1.Trigger, { "data-slot": "tooltip-trigger", ...props });
}
function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsx(Tooltip$1.Portal, { children: /* @__PURE__ */ jsxs(
    Tooltip$1.Content,
    {
      "data-slot": "tooltip-content",
      sideOffset,
      className: cn(
        "bg-foreground text-background animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsx(Tooltip$1.Arrow, { className: "bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" })
      ]
    }
  ) });
}
function Dialog({
  ...props
}) {
  return /* @__PURE__ */ jsx(Dialog$1.Root, { "data-slot": "dialog", ...props });
}
function DialogPortal({
  ...props
}) {
  return /* @__PURE__ */ jsx(Dialog$1.Portal, { "data-slot": "dialog-portal", ...props });
}
function DialogClose({
  ...props
}) {
  return /* @__PURE__ */ jsx(Dialog$1.Close, { "data-slot": "dialog-close", ...props });
}
function DialogOverlay({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Dialog$1.Overlay,
    {
      "data-slot": "dialog-overlay",
      className: cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
        className
      ),
      ...props
    }
  );
}
function DialogContent({
  className,
  children,
  showCloseButton = true,
  overlayClassName,
  ...props
}) {
  return /* @__PURE__ */ jsxs(DialogPortal, { "data-slot": "dialog-portal", children: [
    /* @__PURE__ */ jsx(DialogOverlay, { className: overlayClassName }),
    /* @__PURE__ */ jsxs(
      Dialog$1.Content,
      {
        "data-slot": "dialog-content",
        className: cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 outline-none sm:max-w-lg",
          className
        ),
        ...props,
        children: [
          children,
          showCloseButton && /* @__PURE__ */ jsxs(
            Dialog$1.Close,
            {
              "data-slot": "dialog-close",
              className: "ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
              children: [
                /* @__PURE__ */ jsx(XIcon, {}),
                /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close" })
              ]
            }
          )
        ]
      }
    )
  ] });
}
function DialogHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "dialog-header",
      className: cn("flex flex-col gap-2 text-center sm:text-left", className),
      ...props
    }
  );
}
function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      "data-slot": "dialog-footer",
      className: cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      ),
      ...props,
      children: [
        children,
        showCloseButton && /* @__PURE__ */ jsx(Dialog$1.Close, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "outline", children: "Close" }) })
      ]
    }
  );
}
function DialogTitle({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Dialog$1.Title,
    {
      "data-slot": "dialog-title",
      className: cn("text-lg leading-none font-semibold", className),
      ...props
    }
  );
}
function DialogDescription({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Dialog$1.Description,
    {
      "data-slot": "dialog-description",
      className: cn("text-muted-foreground text-sm", className),
      ...props
    }
  );
}
function JoinCode({
  joinCode,
  projectId,
  creatorId,
  projectName,
  onRegenerate,
  size = "sm"
}) {
  const { regenerateJoinCode } = useCreatorStore();
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const baseUrl = "http://192.168.50.38:3000".replace(/\/$/, "");
  const joinPath = `/explorer?joinCode=${encodeURIComponent(joinCode)}`;
  const joinUrl = baseUrl ? `${baseUrl}/signin?redirect_uri=${encodeURIComponent(joinPath)}` : "";
  useEffect(() => {
    if (!showQRDialog) {
      setQrCodeUrl(null);
      return;
    }
    if (!joinUrl) {
      setQrCodeUrl(null);
      return;
    }
    let isActive = true;
    toDataURL(joinUrl, {
      width: 512,
      margin: 1,
      errorCorrectionLevel: "M"
    }).then((url) => {
      if (isActive) {
        setQrCodeUrl(url);
      }
    }).catch(() => {
      if (isActive) {
        setQrCodeUrl(null);
      }
    });
    return () => {
      isActive = false;
    };
  }, [showQRDialog, joinUrl]);
  const handleCopyCode = () => {
    navigator.clipboard.writeText(joinCode);
    toast.success("Join code copied to clipboard");
  };
  const handleRegenerateCode = async () => {
    const newCode = await regenerateJoinCode(projectId, creatorId);
    if (newCode) {
      toast.success("Join code regenerated");
      onRegenerate?.();
    } else {
      toast.error("Failed to regenerate join code");
    }
  };
  const isLarge = size === "lg";
  const iconSize = isLarge ? "w-5 h-5" : "w-4 h-4";
  const buttonSize = isLarge ? "h-9 w-9" : "h-8 w-8";
  const codeSize = isLarge ? "text-2xl" : "text-lg";
  const padding = isLarge ? "p-4" : "p-3";
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: `bg-muted/50 rounded-lg ${padding}`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        !isLarge && /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "Join Code" }),
        /* @__PURE__ */ jsx("div", { className: `font-mono ${codeSize} font-bold text-cyan-400`, children: joinCode })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            onClick: handleCopyCode,
            className: `${buttonSize} text-muted-foreground hover:text-foreground`,
            children: /* @__PURE__ */ jsx(Copy, { className: iconSize })
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            onClick: () => setShowQRDialog(true),
            className: `${buttonSize} text-muted-foreground hover:text-foreground`,
            children: /* @__PURE__ */ jsx(QrCode, { className: iconSize })
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            onClick: handleRegenerateCode,
            className: `${buttonSize} text-muted-foreground hover:text-foreground`,
            children: /* @__PURE__ */ jsx(RefreshCw, { className: iconSize })
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: showQRDialog, onOpenChange: setShowQRDialog, children: /* @__PURE__ */ jsxs(
      DialogContent,
      {
        className: "bg-card border-border sm:max-w-2xl",
        overlayClassName: "backdrop-blur-sm",
        children: [
          /* @__PURE__ */ jsxs(DialogHeader, { children: [
            /* @__PURE__ */ jsx(DialogTitle, { children: "QR Code" }),
            /* @__PURE__ */ jsx(DialogDescription, { children: "Share this QR code with explorers to join the project" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center py-8", children: [
            /* @__PURE__ */ jsx("div", { className: "w-64 h-64 bg-background rounded-lg flex items-center justify-center border border-border", children: qrCodeUrl ? /* @__PURE__ */ jsx(
              "img",
              {
                src: qrCodeUrl,
                alt: `Join ${projectName}`,
                className: "w-full h-full object-contain p-3"
              }
            ) : /* @__PURE__ */ jsx(QrCode, { className: "w-44 h-44 text-muted-foreground" }) }),
            /* @__PURE__ */ jsx("p", { className: "mt-5 font-mono text-3xl font-bold text-cyan-400", children: joinCode })
          ] }),
          /* @__PURE__ */ jsx(DialogFooter, {})
        ]
      }
    ) })
  ] });
}
function Collapsible({
  ...props
}) {
  return /* @__PURE__ */ jsx(Collapsible$1.Root, { "data-slot": "collapsible", ...props });
}
function CollapsibleTrigger({
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Collapsible$1.CollapsibleTrigger,
    {
      "data-slot": "collapsible-trigger",
      ...props
    }
  );
}
function CollapsibleContent({
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Collapsible$1.CollapsibleContent,
    {
      "data-slot": "collapsible-content",
      ...props
    }
  );
}
function AlertDialog({
  ...props
}) {
  return /* @__PURE__ */ jsx(AlertDialog$1.Root, { "data-slot": "alert-dialog", ...props });
}
function AlertDialogPortal({
  ...props
}) {
  return /* @__PURE__ */ jsx(AlertDialog$1.Portal, { "data-slot": "alert-dialog-portal", ...props });
}
function AlertDialogOverlay({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    AlertDialog$1.Overlay,
    {
      "data-slot": "alert-dialog-overlay",
      className: cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
        className
      ),
      ...props
    }
  );
}
function AlertDialogContent({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxs(AlertDialogPortal, { children: [
    /* @__PURE__ */ jsx(AlertDialogOverlay, {}),
    /* @__PURE__ */ jsx(
      AlertDialog$1.Content,
      {
        "data-slot": "alert-dialog-content",
        className: cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 outline-none sm:max-w-lg",
          className
        ),
        ...props
      }
    )
  ] });
}
function AlertDialogHeader({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "alert-dialog-header",
      className: cn("flex flex-col gap-2 text-center sm:text-left", className),
      ...props
    }
  );
}
function AlertDialogFooter({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "alert-dialog-footer",
      className: cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      ),
      ...props
    }
  );
}
function AlertDialogTitle({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    AlertDialog$1.Title,
    {
      "data-slot": "alert-dialog-title",
      className: cn("text-lg leading-none font-semibold", className),
      ...props
    }
  );
}
function AlertDialogDescription({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    AlertDialog$1.Description,
    {
      "data-slot": "alert-dialog-description",
      className: cn("text-muted-foreground text-sm", className),
      ...props
    }
  );
}
function AlertDialogAction({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    AlertDialog$1.Action,
    {
      className: cn(buttonVariants(), className),
      ...props
    }
  );
}
function AlertDialogCancel({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    AlertDialog$1.Cancel,
    {
      className: cn(
        buttonVariants({ variant: "outline" }),
        "mt-2 sm:mt-0",
        className
      ),
      ...props
    }
  );
}
const Route$6 = createFileRoute("/creator/project/$projectId/")({
  component: ProjectDetailPage
});
const DIFFICULTY_WEIGHTS = {
  easy: 60,
  medium: 100,
  hard: 140
};
const DIFFICULTY_DURATIONS = {
  easy: 60,
  medium: 100,
  hard: 140
};
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
function formatSessionDuration(sessionMinutes, totalMinutes) {
  if (totalMinutes < 1440) {
    if (sessionMinutes < 60) return `${sessionMinutes} min`;
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
function formatTimelineDateForScale(dateStr, totalMinutes) {
  if (totalMinutes < 1440) {
    return safeFormatDate(dateStr, "MMM d HH:mm", "?");
  }
  return safeFormatDate(dateStr, "MMM d", "?");
}
function InlineText({
  value,
  onSave,
  editable,
  className = "",
  inputClassName = "",
  placeholder = "Click to edit...",
  multiline = false
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => {
    setDraft(value);
  }, [value]);
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);
  const handleSave = async () => {
    const trimmed = draft.trim();
    if (trimmed === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(trimmed);
      setEditing(false);
    } catch {
      toast.error("Failed to save");
      setDraft(value);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };
  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Enter" && multiline && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      handleCancel();
    }
  };
  if (!editable) {
    return /* @__PURE__ */ jsx("span", { className, children: value || /* @__PURE__ */ jsx("span", { className: "text-muted-foreground italic", children: "Not set" }) });
  }
  if (editing) {
    return /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 w-full", children: [
      multiline ? /* @__PURE__ */ jsx(
        Textarea,
        {
          ref: inputRef,
          value: draft,
          onChange: (e) => setDraft(e.target.value),
          onKeyDown: handleKeyDown,
          className: `flex-1 min-h-[60px] ${inputClassName}`,
          placeholder,
          disabled: saving
        }
      ) : /* @__PURE__ */ jsx(
        Input,
        {
          ref: inputRef,
          value: draft,
          onChange: (e) => setDraft(e.target.value),
          onKeyDown: handleKeyDown,
          className: `flex-1 ${inputClassName}`,
          placeholder,
          disabled: saving
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          size: "icon",
          variant: "ghost",
          onClick: handleSave,
          disabled: saving,
          className: "h-8 w-8 text-green-500 hover:text-green-400 hover:bg-green-500/10 shrink-0",
          children: /* @__PURE__ */ jsx(Check, { className: "w-4 h-4" })
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          size: "icon",
          variant: "ghost",
          onClick: handleCancel,
          disabled: saving,
          className: "h-8 w-8 text-muted-foreground hover:text-foreground shrink-0",
          children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxs(
    "span",
    {
      className: `group/edit cursor-pointer inline-flex items-center gap-2 ${className}`,
      onClick: () => setEditing(true),
      children: [
        value || /* @__PURE__ */ jsx("span", { className: "text-muted-foreground italic", children: placeholder }),
        /* @__PURE__ */ jsx(Pencil, { className: "w-3.5 h-3.5 text-muted-foreground shrink-0" })
      ]
    }
  );
}
function RubricEditor({
  sessionId,
  rubric,
  editable,
  onChanged
}) {
  const [saving, setSaving] = useState(null);
  const handleAdd = async () => {
    const usedWeight = rubric.reduce((sum, r) => sum + r.weight, 0);
    const remainingWeight = Math.max(0, 100 - usedWeight);
    setSaving("add");
    try {
      const result = await addRubric({
        data: {
          sessionId,
          criteria: "New criterion",
          description: "",
          weight: remainingWeight
        }
      });
      if (result.success) {
        await onChanged();
      } else {
        toast.error("Failed to add rubric");
      }
    } catch {
      toast.error("Failed to add rubric");
    } finally {
      setSaving(null);
    }
  };
  const handleDelete = async (rubricId) => {
    setSaving(rubricId);
    try {
      const result = await deleteRubric({
        data: { rubricId }
      });
      if (result.success) {
        await onChanged();
      } else {
        toast.error("Failed to delete rubric");
      }
    } catch {
      toast.error("Failed to delete rubric");
    } finally {
      setSaving(null);
    }
  };
  if (!editable) {
    if (rubric.length === 0) return null;
    return /* @__PURE__ */ jsxs("div", { className: "mt-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-xs text-muted-foreground mb-1.5", children: [
        /* @__PURE__ */ jsx(BookOpen, { className: "w-3 h-3" }),
        rubric.length,
        " rubric",
        " ",
        rubric.length === 1 ? "criterion" : "criteria"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: rubric.map((r) => /* @__PURE__ */ jsxs("div", { className: "pl-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsx("span", { className: "text-foreground", children: r.criterion }),
          /* @__PURE__ */ jsxs("span", { className: "text-[10px]", children: [
            "(",
            r.weight,
            "%)"
          ] })
        ] }),
        r.description && /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground mt-0.5", children: r.description })
      ] }, r.id)) })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "mt-2", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsx(BookOpen, { className: "w-3 h-3" }),
        "Rubric"
      ] }),
      /* @__PURE__ */ jsx(
        Button,
        {
          size: "sm",
          variant: "ghost",
          onClick: handleAdd,
          disabled: saving === "add",
          className: "h-6 px-2 text-xs text-muted-foreground hover:text-foreground",
          children: saving === "add" ? /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 animate-spin" }) : /* @__PURE__ */ jsx(Plus, { className: "w-3 h-3" })
        }
      )
    ] }),
    rubric.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "space-y-2", children: rubric.map((r) => /* @__PURE__ */ jsx(
        RubricItemEditor,
        {
          item: r,
          saving: saving === r.id,
          onDelete: () => handleDelete(r.id),
          onChanged
        },
        r.id
      )) }),
      (() => {
        const total = rubric.reduce((sum, r) => sum + r.weight, 0);
        if (total !== 100) {
          return /* @__PURE__ */ jsxs(
            Badge,
            {
              variant: "outline",
              className: "mt-2 text-[10px] bg-red-500/10 text-red-400 border-red-500/20",
              children: [
                "Total: ",
                total,
                "% (must equal 100%)"
              ]
            }
          );
        }
        return null;
      })()
    ] })
  ] });
}
function RubricItemEditor({
  item,
  saving,
  onDelete,
  onChanged
}) {
  const [weightSaving, setWeightSaving] = useState(false);
  const [weightDraft, setWeightDraft] = useState(String(item.weight));
  const weightInputRef = useRef(null);
  useEffect(() => {
    if (document.activeElement !== weightInputRef.current) {
      setWeightDraft(String(item.weight));
    }
  }, [item.weight]);
  const saveRubricField = async (updates) => {
    const result = await updateRubric({ data: { rubricId: item.id, updates } });
    if (result.success) {
      toast.success("Saved");
      await onChanged();
    } else {
      throw new Error("Failed to save");
    }
  };
  const handleWeightChange = async (delta) => {
    const newWeight = Math.max(0, Math.min(100, item.weight + delta));
    if (newWeight === item.weight) return;
    setWeightSaving(true);
    try {
      await saveRubricField({ weight: newWeight });
    } finally {
      setWeightSaving(false);
    }
  };
  const commitWeight = async () => {
    const num = parseInt(weightDraft, 10);
    if (isNaN(num) || num < 0 || num > 100) {
      setWeightDraft(String(item.weight));
      return;
    }
    if (num === item.weight) return;
    setWeightSaving(true);
    try {
      await saveRubricField({ weight: num });
    } catch {
      setWeightDraft(String(item.weight));
    } finally {
      setWeightSaving(false);
    }
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "p-2 rounded bg-background border border-border/50 space-y-1",
        saving && "opacity-60"
      ),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "flex-1 min-w-0", children: /* @__PURE__ */ jsx(
            InlineText,
            {
              value: item.criterion,
              onSave: async (val) => saveRubricField({ criteria: val }),
              editable: true,
              className: "text-xs text-foreground",
              placeholder: "Criterion name..."
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5 shrink-0 pt-0.5", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center h-6 rounded border border-border bg-muted/30", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => handleWeightChange(-1),
                  disabled: weightSaving || item.weight <= 0,
                  className: "px-1.5 h-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed rounded-l text-xs font-medium",
                  children: "-"
                }
              ),
              /* @__PURE__ */ jsx(
                "input",
                {
                  ref: weightInputRef,
                  type: "number",
                  min: 0,
                  max: 100,
                  value: weightDraft,
                  onChange: (e) => setWeightDraft(e.target.value),
                  onBlur: commitWeight,
                  onKeyDown: (e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitWeight();
                    }
                    if (e.key === "Escape") {
                      setWeightDraft(String(item.weight));
                      weightInputRef.current?.blur();
                    }
                  },
                  disabled: weightSaving,
                  className: cn(
                    "w-8 text-center text-xs font-medium tabular-nums bg-transparent border-none outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]",
                    weightSaving && "opacity-50"
                  )
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground pr-1", children: "%" }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => handleWeightChange(1),
                  disabled: weightSaving || item.weight >= 100,
                  className: "px-1.5 h-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed rounded-r text-xs font-medium",
                  children: "+"
                }
              )
            ] }),
            /* @__PURE__ */ jsx(
              Button,
              {
                size: "icon",
                variant: "ghost",
                onClick: onDelete,
                disabled: saving,
                className: "h-6 w-6 text-muted-foreground hover:text-red-400 hover:bg-red-500/10",
                children: /* @__PURE__ */ jsx(Trash2, { className: "w-3 h-3" })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "pl-0", children: /* @__PURE__ */ jsx(
          InlineText,
          {
            value: item.description || "",
            onSave: async (val) => saveRubricField({ description: val }),
            editable: true,
            className: "text-[11px] text-muted-foreground",
            placeholder: "Add description..."
          }
        ) })
      ]
    }
  );
}
function ExpandedSessionInfo({
  session,
  durationMinutes,
  onSessionDateChange
}) {
  const toLocal = (iso) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
  };
  const startLocal = toLocal(session.isoStartDate);
  const endLocal = toLocal(session.isoEndDate);
  return /* @__PURE__ */ jsxs("div", { className: "mt-2 p-3 bg-muted/30 rounded-lg border border-border text-sm", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
      /* @__PURE__ */ jsx("span", { className: "w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-xs font-bold text-cyan-400", children: session.index + 1 }),
      /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: session.session.title }),
      /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground ml-auto", children: [
        formatSessionDuration(session.sessionMinutes, durationMinutes),
        " (",
        session.percentage,
        "%)"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-[10px] font-medium text-muted-foreground mb-1 block", children: "Start" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            type: "datetime-local",
            value: startLocal,
            onChange: (e) => {
              if (!e.target.value) return;
              const newStart = new Date(e.target.value).toISOString();
              onSessionDateChange(newStart, session.isoEndDate);
            },
            className: "bg-background border-border text-xs h-8"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-[10px] font-medium text-muted-foreground mb-1 block", children: "End" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            type: "datetime-local",
            value: endLocal,
            min: startLocal,
            onChange: (e) => {
              if (!e.target.value) return;
              const newEnd = new Date(e.target.value).toISOString();
              onSessionDateChange(session.isoStartDate, newEnd);
            },
            className: "bg-background border-border text-xs h-8"
          }
        )
      ] })
    ] })
  ] });
}
function TimelineEditor({
  projectId,
  startDate,
  endDate,
  sessions,
  isTemplateView: isTemplate = false,
  onSaved
}) {
  const [draftStartDate, setDraftStartDate] = useState(startDate);
  const [draftEndDate, setDraftEndDate] = useState(endDate);
  const [draftWeights, setDraftWeights] = useState(
    () => sessions.map(
      (s) => s.weight || DIFFICULTY_WEIGHTS[s.difficulty] || 100
    )
  );
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [draggingHandle, setDraggingHandle] = useState(null);
  const timelineRef = useRef(null);
  const [expandedSession, setExpandedSession] = useState(0);
  useEffect(() => {
    setDraftStartDate(startDate);
    setDraftEndDate(endDate);
    setDraftWeights(
      sessions.map(
        (s) => s.weight || DIFFICULTY_WEIGHTS[s.difficulty] || 100
      )
    );
    setDirty(false);
  }, [startDate, endDate, sessions]);
  const startDateTime = useMemo(() => {
    if (isValidDate(draftStartDate)) return new Date(draftStartDate);
    return /* @__PURE__ */ new Date();
  }, [draftStartDate]);
  const endDateTime = useMemo(() => {
    if (isValidDate(draftEndDate)) return new Date(draftEndDate);
    return addMinutes(startDateTime, 5);
  }, [draftEndDate, startDateTime]);
  const durationMinutes = useMemo(() => {
    return Math.max(0, differenceInMinutes(endDateTime, startDateTime));
  }, [startDateTime, endDateTime]);
  const startDateLocal = useMemo(() => {
    const d = startDateTime;
    return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
  }, [startDateTime]);
  const endDateLocal = useMemo(() => {
    const d = endDateTime;
    return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
  }, [endDateTime]);
  const totalWeight = draftWeights.reduce((sum, w) => sum + w, 0);
  const sessionsWithDates = useMemo(() => {
    if (!isValidDate(draftStartDate) || sessions.length === 0) {
      return sessions.map((session, index) => ({
        session,
        index,
        calculatedStartDate: "",
        calculatedEndDate: "",
        isoStartDate: "",
        isoEndDate: "",
        sessionMinutes: 0,
        percentage: sessions.length > 0 ? Math.round(100 / sessions.length) : 0,
        weight: draftWeights[index] || 100
      }));
    }
    let currentDate = new Date(draftStartDate);
    return sessions.map((session, index) => {
      const weight = draftWeights[index] || 100;
      const proportion = totalWeight > 0 ? weight / totalWeight : 0;
      const sessionMinutes = Math.max(
        1,
        Math.round(durationMinutes * proportion)
      );
      const sStart = currentDate;
      const sEnd = addMinutes(currentDate, sessionMinutes);
      currentDate = sEnd;
      return {
        session,
        index,
        calculatedStartDate: format(sStart, "yyyy-MM-dd HH:mm"),
        calculatedEndDate: format(sEnd, "yyyy-MM-dd HH:mm"),
        isoStartDate: sStart.toISOString(),
        isoEndDate: sEnd.toISOString(),
        sessionMinutes,
        percentage: Math.round(proportion * 100),
        weight
      };
    });
  }, [sessions, draftStartDate, durationMinutes, totalWeight, draftWeights]);
  const handleStartChange = (localValue) => {
    if (!localValue) return;
    const newStart = new Date(localValue);
    const newEnd = addMinutes(newStart, durationMinutes);
    setDraftStartDate(newStart.toISOString());
    setDraftEndDate(newEnd.toISOString());
    setDirty(true);
  };
  const handleEndChange = (localValue) => {
    if (!localValue) return;
    const newEnd = new Date(localValue);
    setDraftEndDate(newEnd.toISOString());
    setDirty(true);
  };
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
      const leftWeight = draftWeights[draggingHandle];
      const rightWeight = draftWeights[draggingHandle + 1];
      if (leftWeight === void 0 || rightWeight === void 0) return;
      const leftPercent = sessionsWithDates[draggingHandle]?.percentage || 0;
      const rightPercent = sessionsWithDates[draggingHandle + 1]?.percentage || 0;
      const combinedPercent = leftPercent + rightPercent;
      const newLeftPercent = Math.max(
        5,
        Math.min(combinedPercent - 5, newPercent - cumulativePercent)
      );
      const totalWeightForBoth = leftWeight + rightWeight;
      const newLeftWeight = Math.max(
        1,
        Math.round(newLeftPercent / combinedPercent * totalWeightForBoth)
      );
      const newRightWeight = Math.max(1, totalWeightForBoth - newLeftWeight);
      setDraftWeights((prev) => {
        const next = [...prev];
        next[draggingHandle] = newLeftWeight;
        next[draggingHandle + 1] = newRightWeight;
        return next;
      });
      setDirty(true);
    },
    [draggingHandle, sessionsWithDates, draftWeights]
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
  const handleSaveTimeline = async () => {
    setSaving(true);
    try {
      if (!isTemplate) {
        const projResult = await updateProject({
          data: {
            projectId,
            updates: {
              startDate: draftStartDate,
              endDate: draftEndDate
            }
          }
        });
        if (!projResult.success) {
          toast.error("Failed to save project dates");
          setSaving(false);
          return;
        }
      }
      const sessionPromises = sessionsWithDates.map(async (s) => {
        const updates = {
          weight: s.weight,
          durationMinutes: s.sessionMinutes
        };
        if (!isTemplate) {
          updates.startDate = s.isoStartDate;
          updates.endDate = s.isoEndDate;
        }
        return updateSession({
          data: {
            sessionId: s.session.id,
            updates
          }
        });
      });
      const results = await Promise.all(sessionPromises);
      const allSuccess = results.every((r) => r.success);
      if (allSuccess) {
        toast.success("Timeline saved");
        setDirty(false);
        await onSaved();
      } else {
        toast.error("Some session updates failed");
      }
    } catch {
      toast.error("Failed to save timeline");
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-xs font-medium text-muted-foreground mb-1 block", children: "Start" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            type: "datetime-local",
            value: startDateLocal,
            onChange: (e) => handleStartChange(e.target.value),
            className: "bg-background border-border text-sm"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-xs font-medium text-muted-foreground mb-1 block", children: "End" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            type: "datetime-local",
            value: endDateLocal,
            min: startDateLocal,
            onChange: (e) => handleEndChange(e.target.value),
            className: "bg-background border-border text-sm"
          }
        )
      ] })
    ] }),
    durationMinutes > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/20", children: [
      /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4 text-cyan-500 shrink-0" }),
      /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-foreground", children: formatDuration(durationMinutes) }),
      /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
        safeFormatDate(draftStartDate, "MMM d HH:mm", "-"),
        " -",
        " ",
        safeFormatDate(draftEndDate, "MMM d HH:mm", "-")
      ] })
    ] }),
    sessions.length > 0 && durationMinutes > 0 && /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("label", { className: "text-xs font-medium text-muted-foreground mb-2 block", children: [
        "Session Distribution",
        /* @__PURE__ */ jsx("span", { className: "text-[10px] font-normal ml-1", children: "(drag handles to adjust)" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "px-6", children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            ref: timelineRef,
            className: cn(
              "flex h-8 rounded-md overflow-hidden border border-border bg-muted/30 relative",
              draggingHandle !== null && "cursor-col-resize"
            ),
            children: sessionsWithDates.map((s, index) => /* @__PURE__ */ jsxs(
              "div",
              {
                className: "relative h-full",
                style: { width: `${s.percentage}%` },
                children: [
                  /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsxs(Tooltip, { children: [
                    /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
                      "div",
                      {
                        className: cn(
                          "h-full flex items-center justify-center text-foreground bg-background border-y border-l border-border/70 transition-colors duration-200 ease-out hover:bg-cyan-500/35",
                          expandedSession === index && "bg-cyan-500/35",
                          index === sessionsWithDates.length - 1 && "border-r"
                        ),
                        onClick: () => setExpandedSession(
                          expandedSession === index ? null : index
                        ),
                        children: /* @__PURE__ */ jsx("span", { className: "text-[11px] font-semibold", children: index + 1 })
                      }
                    ) }),
                    /* @__PURE__ */ jsxs(TooltipContent, { children: [
                      /* @__PURE__ */ jsx("p", { className: "font-medium", children: s.session.title || `Session ${index + 1}` }),
                      /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
                        formatSessionDuration(
                          s.sessionMinutes,
                          durationMinutes
                        ),
                        " ",
                        "(",
                        s.percentage,
                        "%)"
                      ] }),
                      /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
                        formatTimelineDateForScale(
                          s.isoStartDate,
                          durationMinutes
                        ),
                        " ",
                        "-",
                        " ",
                        formatTimelineDateForScale(
                          s.isoEndDate,
                          durationMinutes
                        )
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
                            "w-1 h-5 rounded-full bg-border transition-colors",
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
        /* @__PURE__ */ jsx("div", { className: "flex justify-between mt-1 mb-4 text-[10px] text-muted-foreground", children: sessionsWithDates.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("span", { children: formatTimelineDateForScale(
            sessionsWithDates[0].isoStartDate,
            durationMinutes
          ) }),
          /* @__PURE__ */ jsx("span", { children: formatTimelineDateForScale(
            sessionsWithDates[sessionsWithDates.length - 1].isoEndDate,
            durationMinutes
          ) })
        ] }) })
      ] }),
      expandedSession !== null && sessionsWithDates[expandedSession] && /* @__PURE__ */ jsx(
        ExpandedSessionInfo,
        {
          session: sessionsWithDates[expandedSession],
          durationMinutes,
          onSessionDateChange: (startIso, endIso) => {
            if (expandedSession === 0) {
              setDraftStartDate(startIso);
            }
            if (expandedSession === sessions.length - 1) {
              setDraftEndDate(endIso);
            }
            const effectiveStartIso = expandedSession === 0 ? startIso : draftStartDate;
            const effectiveEndIso = expandedSession === sessions.length - 1 ? endIso : draftEndDate;
            const effectiveDuration = Math.max(
              0,
              differenceInMinutes(new Date(effectiveEndIso), new Date(effectiveStartIso))
            );
            const newSessionMinutes = Math.max(
              1,
              differenceInMinutes(new Date(endIso), new Date(startIso))
            );
            const otherWeightsTotal = draftWeights.reduce(
              (sum, w, i) => i === expandedSession ? sum : sum + w,
              0
            );
            const otherMinutes = effectiveDuration - newSessionMinutes;
            const newWeight = otherMinutes > 0 && otherWeightsTotal > 0 ? Math.max(
              1,
              Math.round(
                newSessionMinutes / otherMinutes * otherWeightsTotal
              )
            ) : draftWeights[expandedSession];
            setDraftWeights((prev) => {
              const next = [...prev];
              next[expandedSession] = newWeight;
              return next;
            });
            setDirty(true);
          }
        }
      )
    ] }),
    dirty && /* @__PURE__ */ jsx(
      Button,
      {
        onClick: handleSaveTimeline,
        disabled: saving,
        className: "w-full bg-cyan-600 hover:bg-cyan-700 text-white",
        children: saving ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
          "Saving..."
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Save, { className: "w-4 h-4 mr-2" }),
          "Save Timeline"
        ] })
      }
    )
  ] });
}
function TeamSizeEditor({ value, onSave }) {
  const [draft, setDraft] = useState(String(value));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setDraft(String(value));
    }
  }, [value]);
  const handleChange = async (delta) => {
    const newVal = Math.max(2, Math.min(10, value + delta));
    if (newVal === value) return;
    setSaving(true);
    try {
      await onSave(newVal);
    } finally {
      setSaving(false);
    }
  };
  const commitValue = async () => {
    const num = parseInt(draft, 10);
    if (isNaN(num) || num < 2 || num > 10) {
      setDraft(String(value));
      return;
    }
    if (num === value) return;
    setSaving(true);
    try {
      await onSave(num);
    } catch {
      setDraft(String(value));
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center h-6 rounded border border-border bg-muted/30", children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => handleChange(-1),
        disabled: saving || value <= 2,
        className: "px-1.5 h-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed rounded-l text-xs font-medium",
        children: "-"
      }
    ),
    /* @__PURE__ */ jsx(
      "input",
      {
        ref: inputRef,
        type: "number",
        min: 2,
        max: 10,
        value: draft,
        onChange: (e) => setDraft(e.target.value),
        onBlur: commitValue,
        onKeyDown: (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitValue();
          }
          if (e.key === "Escape") {
            setDraft(String(value));
            inputRef.current?.blur();
          }
        },
        disabled: saving,
        className: cn(
          "w-8 text-center text-xs font-medium tabular-nums bg-transparent border-none outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]",
          saving && "opacity-50"
        )
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => handleChange(1),
        disabled: saving || value >= 10,
        className: "px-1.5 h-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed rounded-r text-xs font-medium",
        children: "+"
      }
    )
  ] });
}
function DurationEditor({ value, onSave }) {
  const decompose = (totalMinutes) => ({
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor(totalMinutes % 1440 / 60),
    minutes: totalMinutes % 60
  });
  const initial = decompose(value);
  const [days, setDays] = useState(String(initial.days));
  const [hours, setHours] = useState(String(initial.hours));
  const [minutes, setMinutes] = useState(String(initial.minutes));
  const [saving, setSaving] = useState(false);
  const timerRef = useRef(null);
  const latestRef = useRef(value);
  useEffect(() => {
    latestRef.current = value;
    const d = decompose(value);
    setDays(String(d.days));
    setHours(String(d.hours));
    setMinutes(String(d.minutes));
  }, [value]);
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
  const saveTotal = useCallback(
    (d, h, m) => {
      const total = (parseInt(d) || 0) * 1440 + (parseInt(h) || 0) * 60 + (parseInt(m) || 0);
      if (total <= 0 || total === latestRef.current) return;
      latestRef.current = total;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          await onSave(total);
        } catch {
          const prev = decompose(value);
          setDays(String(prev.days));
          setHours(String(prev.hours));
          setMinutes(String(prev.minutes));
        } finally {
          setSaving(false);
        }
      }, 500);
    },
    [onSave, value]
  );
  const handleChange = (field, val) => {
    const newDays = field === "days" ? val : days;
    const newHours = field === "hours" ? val : hours;
    const newMinutes = field === "minutes" ? val : minutes;
    if (field === "days") setDays(val);
    if (field === "hours") setHours(val);
    if (field === "minutes") setMinutes(val);
    saveTotal(newDays, newHours, newMinutes);
  };
  const inputClass = cn(
    "w-8 text-center text-xs font-medium tabular-nums bg-transparent border-none outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]",
    saving && "opacity-50"
  );
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center h-6 rounded border border-border bg-muted/30 px-0.5", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "number",
          min: 0,
          value: days,
          onChange: (e) => handleChange("days", e.target.value),
          disabled: saving,
          className: inputClass
        }
      ),
      /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground pr-1", children: "d" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center h-6 rounded border border-border bg-muted/30 px-0.5", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "number",
          min: 0,
          max: 23,
          value: hours,
          onChange: (e) => handleChange("hours", e.target.value),
          disabled: saving,
          className: inputClass
        }
      ),
      /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground pr-1", children: "h" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center h-6 rounded border border-border bg-muted/30 px-0.5", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "number",
          min: 0,
          max: 59,
          value: minutes,
          onChange: (e) => handleChange("minutes", e.target.value),
          disabled: saving,
          className: inputClass
        }
      ),
      /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground pr-1", children: "m" })
    ] })
  ] });
}
function ProjectDetailPage() {
  const navigate = useNavigate();
  const { projectId, id } = useParams({ strict: false });
  const resolvedProjectId = projectId ?? id;
  const isTemplateView = Boolean(id && !projectId);
  const includeTemplates = isTemplateView;
  const { isAuthenticated, currentUser } = useAuthStore();
  const { getProject: getProject2, fetchProjects } = useCreatorStore();
  const project = resolvedProjectId ? getProject2(resolvedProjectId) : void 0;
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [deleteSessionId, setDeleteSessionId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1e3);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (currentUser?.id && !project) {
      fetchProjects(currentUser.id, { includeTemplates });
    }
  }, [currentUser?.id, project, fetchProjects, includeTemplates]);
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate]);
  useEffect(() => {
    if (currentUser && !currentUser.role.includes("creator")) {
      navigate({ to: "/explorer" });
    }
  }, [currentUser, navigate]);
  const saveProjectField = useCallback(
    async (updates) => {
      if (!project || !currentUser?.id) return;
      const result = await updateProject({
        data: { projectId: project.id, updates }
      });
      if (result.success) {
        toast.success("Saved");
        await fetchProjects(currentUser.id, { includeTemplates });
      } else {
        throw new Error("Failed to save");
      }
    },
    [project, currentUser?.id, fetchProjects, includeTemplates]
  );
  const saveSessionField = useCallback(
    async (sessionId, updates) => {
      if (!currentUser?.id) return;
      const result = await updateSession({
        data: { sessionId, updates }
      });
      if (result.success) {
        toast.success("Saved");
        await fetchProjects(currentUser.id, { includeTemplates });
      } else {
        throw new Error("Failed to save");
      }
    },
    [currentUser?.id, fetchProjects, includeTemplates]
  );
  const handleTimelineSaved = useCallback(async () => {
    if (currentUser?.id) {
      await fetchProjects(currentUser.id, { includeTemplates });
    }
  }, [currentUser?.id, fetchProjects, includeTemplates]);
  if (!currentUser || !currentUser.role.includes("creator")) {
    return null;
  }
  if (!project) {
    return /* @__PURE__ */ jsx("div", { className: "container max-w-6xl mx-auto py-8 px-4", children: /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-foreground mb-2", children: isTemplateView ? "Template Not Found" : "Project Not Found" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: isTemplateView ? "The template you're looking for doesn't exist." : "The project you're looking for doesn't exist." }),
      /* @__PURE__ */ jsx(Button, { onClick: () => navigate({ to: isTemplateView ? "/creator/library" : "/creator" }), children: isTemplateView ? "Back to Library" : "Back to Dashboard" })
    ] }) });
  }
  const status = getProjectTimeStatus(
    project.startDate,
    project.endDate
  );
  const progress = getProjectProgress(project.startDate, project.endDate);
  const timeInfo = getProjectTimeInfo(project.startDate, project.endDate);
  const isEditable = isTemplateView || status === "scheduled";
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
  const difficultyColors = {
    easy: "bg-green-500/10 text-green-400 border-green-500/20",
    medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    hard: "bg-red-500/10 text-red-400 border-red-500/20"
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-[calc(100vh-4rem)] bg-background", children: [
    /* @__PURE__ */ jsxs("div", { className: "container max-w-5xl mx-auto py-8 px-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "ghost",
            onClick: () => navigate({ to: isTemplateView ? "/creator/library" : "/creator" }),
            className: "mb-4 text-muted-foreground hover:text-foreground",
            children: [
              /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
              isTemplateView ? "Back to Library" : "Back to Dashboard"
            ]
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "flex items-start justify-between", children: /* @__PURE__ */ jsx("div", { className: "flex-1 min-w-0", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
          isTemplateView ? /* @__PURE__ */ jsx(Library, { className: "w-8 h-8 text-cyan-500 shrink-0" }) : /* @__PURE__ */ jsx(Settings, { className: "w-8 h-8 text-cyan-500 shrink-0" }),
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-foreground flex items-center gap-3", children: /* @__PURE__ */ jsx(
            InlineText,
            {
              value: project.name,
              onSave: async (val) => {
                await saveProjectField({ title: val });
              },
              editable: isEditable,
              className: "text-3xl font-bold text-foreground",
              inputClassName: "text-2xl font-bold",
              placeholder: "Project name"
            }
          ) }),
          isTemplateView ? /* @__PURE__ */ jsx(
            Badge,
            {
              variant: "outline",
              className: "text-xs uppercase font-bold shrink-0 bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
              children: "Template"
            }
          ) : /* @__PURE__ */ jsx(
            Badge,
            {
              variant: "outline",
              className: `text-xs uppercase font-bold shrink-0 ${statusColors[status]}`,
              children: statusLabels[status]
            }
          )
        ] }) }) })
      ] }),
      !isTemplateView && /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-4 mb-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm text-muted-foreground mb-2", children: [
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
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-5", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3", children: "Description" }),
            isEditable ? /* @__PURE__ */ jsx(
              InlineText,
              {
                value: project.description,
                onSave: async (val) => {
                  await saveProjectField({ description: val });
                },
                editable: true,
                multiline: true,
                className: "text-foreground whitespace-pre-wrap",
                placeholder: "Add a project description..."
              }
            ) : /* @__PURE__ */ jsx("p", { className: "text-foreground whitespace-pre-wrap", children: project.description || /* @__PURE__ */ jsx("span", { className: "text-muted-foreground italic", children: "No description" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-5", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3", children: "Driving Question" }),
            isEditable ? /* @__PURE__ */ jsx(
              InlineText,
              {
                value: project.drivingQuestion,
                onSave: async (val) => {
                  await saveProjectField({ drivingQuestion: val });
                },
                editable: true,
                multiline: true,
                className: "text-foreground",
                placeholder: "Add a driving question..."
              }
            ) : /* @__PURE__ */ jsx("p", { className: "text-foreground", children: project.drivingQuestion || /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "No driving question" }) })
          ] }),
          !isTemplateView && /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-5", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4", children: "Timeline" }),
            isEditable && project.sessions.length > 0 ? /* @__PURE__ */ jsx(
              TimelineEditor,
              {
                projectId: project.id,
                startDate: project.startDate,
                endDate: project.endDate,
                sessions: project.sessions,
                onSaved: handleTimelineSaved
              }
            ) : /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-3 py-2 bg-muted/30 rounded-lg border border-border text-sm", children: [
              /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4 text-muted-foreground shrink-0" }),
              /* @__PURE__ */ jsxs("span", { className: "text-foreground", children: [
                safeFormatDate(
                  project.startDate,
                  "MMM d, yyyy HH:mm",
                  "-"
                ),
                " - ",
                safeFormatDate(
                  project.endDate,
                  "MMM d, yyyy HH:mm",
                  "-"
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-sm font-medium text-muted-foreground uppercase tracking-wider", children: [
                "Sessions (",
                project.sessions.length,
                ")"
              ] }),
              isEditable && /* @__PURE__ */ jsxs(
                Button,
                {
                  size: "sm",
                  variant: "ghost",
                  onClick: async () => {
                    try {
                      const defaultDuration = DIFFICULTY_DURATIONS.medium;
                      const lastSession = project.sessions[project.sessions.length - 1];
                      const newStart = isTemplateView ? void 0 : lastSession?.endDate || project.startDate;
                      const newEnd = isTemplateView ? void 0 : newStart ? addMinutes(new Date(newStart), defaultDuration).toISOString() : project.endDate;
                      const result = await createSession({
                        data: {
                          projectId: project.id,
                          title: `Session ${project.sessions.length + 1}`,
                          difficulty: "medium",
                          deliverableType: "none",
                          weight: 100,
                          durationMinutes: defaultDuration,
                          startDate: newStart,
                          endDate: newEnd
                        }
                      });
                      if (result.success) {
                        toast.success("Session added");
                        await fetchProjects(currentUser.id, {
                          includeTemplates
                        });
                      } else {
                        toast.error("Failed to add session");
                      }
                    } catch {
                      toast.error("Failed to add session");
                    }
                  },
                  className: "h-7 px-2 text-xs text-muted-foreground hover:text-foreground",
                  children: [
                    /* @__PURE__ */ jsx(Plus, { className: "w-3.5 h-3.5 mr-1" }),
                    "Add"
                  ]
                }
              )
            ] }),
            project.sessions.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: "No sessions configured." }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: project.sessions.map((session, idx) => /* @__PURE__ */ jsx(Collapsible, { children: /* @__PURE__ */ jsxs(
              "div",
              {
                className: cn(
                  "rounded-lg bg-muted/30 border border-border transition-colors",
                  dragOverIdx === idx && dragIdx !== idx && "border-cyan-500 bg-cyan-500/5",
                  dragIdx === idx && "opacity-50"
                ),
                onDragOver: (e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDragOverIdx(idx);
                },
                onDragLeave: () => {
                  setDragOverIdx(null);
                },
                onDrop: async (e) => {
                  e.preventDefault();
                  const fromIdx = dragIdx;
                  if (fromIdx === null || fromIdx === idx) {
                    setDragIdx(null);
                    setDragOverIdx(null);
                    return;
                  }
                  const ids = project.sessions.map((s) => s.id);
                  const [moved] = ids.splice(fromIdx, 1);
                  ids.splice(idx, 0, moved);
                  setDragIdx(null);
                  setDragOverIdx(null);
                  try {
                    const result = await reorderSessions({
                      data: { sessionIds: ids }
                    });
                    if (result.success) {
                      await fetchProjects(currentUser.id, {
                        includeTemplates
                      });
                    } else {
                      toast.error("Failed to reorder");
                    }
                  } catch {
                    toast.error("Failed to reorder");
                  }
                },
                onDragEnd: () => {
                  setDragIdx(null);
                  setDragOverIdx(null);
                },
                children: [
                  /* @__PURE__ */ jsxs(
                    "div",
                    {
                      className: "flex items-center gap-3 p-3",
                      draggable: isEditable,
                      onDragStart: (e) => {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData(
                          "text/plain",
                          idx.toString()
                        );
                        setDragIdx(idx);
                      },
                      children: [
                        isEditable && /* @__PURE__ */ jsx("div", { className: "text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing shrink-0", children: /* @__PURE__ */ jsx(GripVertical, { className: "w-4 h-4" }) }),
                        /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-cyan-400", children: idx + 1 }) }),
                        /* @__PURE__ */ jsxs(CollapsibleTrigger, { className: "flex-1 min-w-0 flex items-center gap-2 cursor-pointer [&[data-state=open]_.chevron-icon]:rotate-180", children: [
                          /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground text-sm truncate", children: session.title?.replace(
                            /^Session\s+\d+:\s*/,
                            ""
                          ) || "Untitled" }),
                          /* @__PURE__ */ jsx(
                            Badge,
                            {
                              variant: "outline",
                              className: `text-[10px] shrink-0 ${difficultyColors[session.difficulty] || ""}`,
                              children: session.difficulty
                            }
                          ),
                          session.deliverableType !== "none" && /* @__PURE__ */ jsx(FileText, { className: "w-3 h-3 text-muted-foreground shrink-0" }),
                          /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-muted-foreground shrink-0 ml-auto mr-1", children: [
                            session.durationMinutes > 0 ? formatDuration(session.durationMinutes) : "-",
                            " | ",
                            safeFormatDate(
                              session.startDate,
                              "MMM d HH:mm",
                              "-"
                            ),
                            " - ",
                            safeFormatDate(
                              session.endDate,
                              "MMM d HH:mm",
                              "-"
                            )
                          ] }),
                          /* @__PURE__ */ jsx(ChevronDown, { className: "chevron-icon w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200" })
                        ] }),
                        isEditable && /* @__PURE__ */ jsx(
                          Button,
                          {
                            size: "icon",
                            variant: "ghost",
                            onClick: () => setDeleteSessionId(session.id),
                            className: "h-6 w-6 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 shrink-0",
                            children: /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5" })
                          }
                        )
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsx(CollapsibleContent, { children: /* @__PURE__ */ jsxs("div", { className: "px-3 pb-3 pt-0 pl-14 space-y-2", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                      /* @__PURE__ */ jsx(
                        InlineText,
                        {
                          value: session.title,
                          onSave: async (val) => {
                            await saveSessionField(session.id, {
                              title: val
                            });
                          },
                          editable: isEditable,
                          className: "font-medium text-foreground text-sm",
                          placeholder: "Session title"
                        }
                      ),
                      isEditable ? /* @__PURE__ */ jsxs(
                        Select,
                        {
                          value: session.difficulty,
                          onValueChange: async (val) => {
                            try {
                              const diff = val;
                              await saveSessionField(session.id, {
                                difficulty: diff,
                                weight: DIFFICULTY_WEIGHTS[diff],
                                durationMinutes: DIFFICULTY_DURATIONS[diff]
                              });
                            } catch {
                              toast.error("Failed to save difficulty");
                            }
                          },
                          children: [
                            /* @__PURE__ */ jsx(
                              SelectTrigger,
                              {
                                size: "sm",
                                className: "h-5 text-[10px] w-auto px-2 py-0 border-border",
                                children: /* @__PURE__ */ jsx(SelectValue, {})
                              }
                            ),
                            /* @__PURE__ */ jsxs(SelectContent, { children: [
                              /* @__PURE__ */ jsx(SelectItem, { value: "easy", children: "easy" }),
                              /* @__PURE__ */ jsx(SelectItem, { value: "medium", children: "medium" }),
                              /* @__PURE__ */ jsx(SelectItem, { value: "hard", children: "hard" })
                            ] })
                          ]
                        }
                      ) : null,
                      isEditable ? /* @__PURE__ */ jsxs(
                        Select,
                        {
                          value: session.deliverableType,
                          onValueChange: async (val) => {
                            try {
                              await saveSessionField(session.id, {
                                deliverableType: val
                              });
                            } catch {
                              toast.error(
                                "Failed to save deliverable type"
                              );
                            }
                          },
                          children: [
                            /* @__PURE__ */ jsx(
                              SelectTrigger,
                              {
                                size: "sm",
                                className: "h-5 text-[10px] w-auto px-2 py-0 border-border",
                                children: /* @__PURE__ */ jsx(SelectValue, {})
                              }
                            ),
                            /* @__PURE__ */ jsxs(SelectContent, { children: [
                              /* @__PURE__ */ jsx(SelectItem, { value: "none", children: "No deliverable" }),
                              /* @__PURE__ */ jsx(SelectItem, { value: "document", children: "Document" })
                            ] })
                          ]
                        }
                      ) : null
                    ] }),
                    (session.topic || isEditable) && /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
                      InlineText,
                      {
                        value: session.topic,
                        onSave: async (val) => {
                          await saveSessionField(session.id, {
                            topic: val
                          });
                        },
                        editable: isEditable,
                        className: "text-xs text-muted-foreground",
                        placeholder: "Add session topic..."
                      }
                    ) }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-xs text-muted-foreground", children: [
                      /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3 shrink-0" }),
                      isEditable ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "Duration:" }),
                        /* @__PURE__ */ jsx(
                          DurationEditor,
                          {
                            value: session.durationMinutes || 0,
                            onSave: async (minutes) => {
                              await saveSessionField(session.id, {
                                durationMinutes: minutes
                              });
                            }
                          }
                        )
                      ] }) : /* @__PURE__ */ jsx("span", { children: session.durationMinutes > 0 ? formatDuration(session.durationMinutes) : "-" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-xs text-muted-foreground", children: [
                      /* @__PURE__ */ jsx(Calendar, { className: "w-3 h-3 shrink-0" }),
                      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                        safeFormatDate(
                          session.startDate,
                          "MMM d HH:mm",
                          "-"
                        ),
                        " - ",
                        safeFormatDate(
                          session.endDate,
                          "MMM d HH:mm",
                          "-"
                        )
                      ] })
                    ] }),
                    session.deliverableType !== "none" && /* @__PURE__ */ jsx(
                      RubricEditor,
                      {
                        sessionId: session.id,
                        rubric: session.rubric,
                        editable: isEditable,
                        onChanged: handleTimelineSaved
                      }
                    )
                  ] }) })
                ]
              }
            ) }, session.id)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          !isTemplateView && /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-5", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3", children: "Join Code" }),
            /* @__PURE__ */ jsx(
              JoinCode,
              {
                joinCode: project.joinCode,
                projectId: project.id,
                creatorId: project.creatorId,
                projectName: project.name,
                size: "lg"
              }
            )
          ] }),
          !isTemplateView && /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-5", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3", children: "Participants" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-sm", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-muted-foreground", children: [
                  /* @__PURE__ */ jsx(Users, { className: "w-4 h-4" }),
                  "Joined"
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-foreground", children: project.totalParticipants })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-muted-foreground", children: [
                  /* @__PURE__ */ jsx(Users, { className: "w-4 h-4" }),
                  "Teams"
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-foreground", children: project.teams.length })
              ] }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "outline",
                  size: "sm",
                  className: "w-full mt-1 border-border text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  onClick: () => navigate({
                    to: "/creator/project/$projectId/participant",
                    params: { projectId: project.id }
                  }),
                  children: "View All"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-5", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3", children: "Details" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-sm", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-muted-foreground", children: [
                  project.teamSize === 1 ? /* @__PURE__ */ jsx(User, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(Users, { className: "w-4 h-4" }),
                  "Type"
                ] }),
                isEditable ? /* @__PURE__ */ jsxs(
                  Select,
                  {
                    value: project.teamSize === 1 ? "individual" : "group",
                    onValueChange: async (val) => {
                      try {
                        await saveProjectField({
                          teamSize: val === "individual" ? 1 : 2
                        });
                      } catch {
                        toast.error("Failed to save type");
                      }
                    },
                    children: [
                      /* @__PURE__ */ jsx(SelectTrigger, { className: "h-7 w-auto text-xs px-2 border-border", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                      /* @__PURE__ */ jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsx(SelectItem, { value: "individual", children: "Individual" }),
                        /* @__PURE__ */ jsx(SelectItem, { value: "group", children: "Group" })
                      ] })
                    ]
                  }
                ) : /* @__PURE__ */ jsx("span", { className: "text-foreground", children: project.teamSize === 1 ? "Individual" : "Group" })
              ] }),
              project.teamSize > 1 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-muted-foreground", children: [
                  /* @__PURE__ */ jsx(Users, { className: "w-4 h-4" }),
                  "Team Size"
                ] }),
                isEditable ? /* @__PURE__ */ jsx(
                  TeamSizeEditor,
                  {
                    value: project.teamSize,
                    onSave: async (val) => {
                      await saveProjectField({ teamSize: val });
                    }
                  }
                ) : /* @__PURE__ */ jsxs("span", { className: "text-foreground", children: [
                  project.teamSize,
                  " members"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-muted-foreground", children: [
                  /* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4" }),
                  "Sessions"
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-foreground", children: project.sessions.length })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-muted-foreground shrink-0", children: [
                  /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4" }),
                  "Total Duration"
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-foreground", children: (() => {
                  const total = project.sessions.reduce(
                    (sum, s) => sum + (s.durationMinutes || 0),
                    0
                  );
                  return total > 0 ? formatDuration(total) : "-";
                })() })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-muted-foreground shrink-0", children: [
                  /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4" }),
                  "Start"
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-foreground", children: safeFormatDate(
                  project.startDate,
                  "MMM d, yyyy HH:mm",
                  "-"
                ) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-muted-foreground shrink-0", children: [
                  /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4" }),
                  "End"
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-foreground", children: safeFormatDate(
                  project.endDate,
                  "MMM d, yyyy HH:mm",
                  "-"
                ) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-lg p-5", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3", children: "Created" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-foreground", children: safeFormatDate(
              project.createdAt,
              "MMM d, yyyy HH:mm",
              "Unknown"
            ) })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      AlertDialog,
      {
        open: !!deleteSessionId,
        onOpenChange: (open) => !open && setDeleteSessionId(null),
        children: /* @__PURE__ */ jsxs(AlertDialogContent, { className: "bg-card border-border", children: [
          /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
            /* @__PURE__ */ jsx(AlertDialogTitle, { className: "text-foreground", children: "Delete Session" }),
            /* @__PURE__ */ jsx(AlertDialogDescription, { className: "text-muted-foreground", children: "Are you sure you want to delete this session? This action cannot be undone." })
          ] }),
          /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
            /* @__PURE__ */ jsx(AlertDialogCancel, { className: "border-border text-muted-foreground hover:bg-muted", children: "Cancel" }),
            /* @__PURE__ */ jsx(
              AlertDialogAction,
              {
                className: "bg-destructive text-white hover:bg-destructive/90 dark:bg-destructive/60",
                disabled: deleteLoading,
                onClick: async () => {
                  if (!deleteSessionId) return;
                  setDeleteLoading(true);
                  try {
                    const result = await deleteSession({
                      data: { sessionId: deleteSessionId }
                    });
                    if (result.success) {
                      toast.success("Session deleted");
                      await fetchProjects(currentUser.id, {
                        includeTemplates
                      });
                    } else {
                      toast.error("Failed to delete session");
                    }
                  } catch {
                    toast.error("Failed to delete session");
                  } finally {
                    setDeleteLoading(false);
                    setDeleteSessionId(null);
                  }
                },
                children: deleteLoading ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
                  "Deleting..."
                ] }) : "Delete"
              }
            )
          ] })
        ] })
      }
    )
  ] });
}
const $$splitComponentImporter$5 = () => import("./index-DcRg3r6R.js");
const Route$5 = createFileRoute("/creator/library/$id/")({
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./start.ssr.spa-mode-BKyMIZJN.js");
const Route$4 = createFileRoute("/demo/start/ssr/spa-mode")({
  ssr: false,
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const getPunkSongs = createServerFn({
  method: "GET"
}).handler(createSsrRpc("f74da881407a186b78a7af058df21dafb0126eb11e5a4d54fd322e8feb5038f1"));
const $$splitComponentImporter$3 = () => import("./start.ssr.full-ssr-M8Q5mPDY.js");
const Route$3 = createFileRoute("/demo/start/ssr/full-ssr")({
  component: lazyRouteComponent($$splitComponentImporter$3, "component"),
  loader: async () => await getPunkSongs()
});
const $$splitComponentImporter$2 = () => import("./start.ssr.data-only-DtZy2rWy.js");
const Route$2 = createFileRoute("/demo/start/ssr/data-only")({
  ssr: "data-only",
  component: lazyRouteComponent($$splitComponentImporter$2, "component"),
  loader: async () => await getPunkSongs()
});
const $$splitComponentImporter$1 = () => import("./index-Bok7R2C_.js");
const Route$1 = createFileRoute("/creator/project/$projectId/participant/")({
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./index-D9qrQXk5.js");
const Route = createFileRoute("/creator/project/$projectId/monitor/")({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const ExplorerRouteRoute = Route$u.update({
  id: "/explorer",
  path: "/explorer",
  getParentRoute: () => Route$v
});
const CreatorRouteRoute = Route$t.update({
  id: "/creator",
  path: "/creator",
  getParentRoute: () => Route$v
});
const AdminRouteRoute = Route$s.update({
  id: "/admin",
  path: "/admin",
  getParentRoute: () => Route$v
});
const IndexRoute = Route$r.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$v
});
const SignupIndexRoute = Route$q.update({
  id: "/signup/",
  path: "/signup/",
  getParentRoute: () => Route$v
});
const SigninIndexRoute = Route$p.update({
  id: "/signin/",
  path: "/signin/",
  getParentRoute: () => Route$v
});
const ExplorerIndexRoute = Route$o.update({
  id: "/",
  path: "/",
  getParentRoute: () => ExplorerRouteRoute
});
const CreatorIndexRoute = Route$n.update({
  id: "/",
  path: "/",
  getParentRoute: () => CreatorRouteRoute
});
const AdminIndexRoute = Route$m.update({
  id: "/",
  path: "/",
  getParentRoute: () => AdminRouteRoute
});
const ExplorerPortfolioIndexRoute = Route$l.update({
  id: "/portfolio/",
  path: "/portfolio/",
  getParentRoute: () => ExplorerRouteRoute
});
const ExplorerCalendarIndexRoute = Route$k.update({
  id: "/calendar/",
  path: "/calendar/",
  getParentRoute: () => ExplorerRouteRoute
});
const CreatorStoreIndexRoute = Route$j.update({
  id: "/store/",
  path: "/store/",
  getParentRoute: () => CreatorRouteRoute
});
const CreatorLibraryIndexRoute = Route$i.update({
  id: "/library/",
  path: "/library/",
  getParentRoute: () => CreatorRouteRoute
});
const CreatorCalendarIndexRoute = Route$h.update({
  id: "/calendar/",
  path: "/calendar/",
  getParentRoute: () => CreatorRouteRoute
});
const AdminUsersIndexRoute = Route$g.update({
  id: "/users/",
  path: "/users/",
  getParentRoute: () => AdminRouteRoute
});
const AdminSettingsIndexRoute = Route$f.update({
  id: "/settings/",
  path: "/settings/",
  getParentRoute: () => AdminRouteRoute
});
const DemoStartServerFuncsRoute = Route$e.update({
  id: "/demo/start/server-funcs",
  path: "/demo/start/server-funcs",
  getParentRoute: () => Route$v
});
const DemoStartApiRequestRoute = Route$d.update({
  id: "/demo/start/api-request",
  path: "/demo/start/api-request",
  getParentRoute: () => Route$v
});
const DemoApiNamesRoute = Route$c.update({
  id: "/demo/api/names",
  path: "/demo/api/names",
  getParentRoute: () => Route$v
});
const CreatorProjectProjectIdRouteRoute = Route$b.update({
  id: "/project/$projectId",
  path: "/project/$projectId",
  getParentRoute: () => CreatorRouteRoute
});
const ExplorerProjectProjectIdIndexRoute = Route$a.update({
  id: "/project/$projectId/",
  path: "/project/$projectId/",
  getParentRoute: () => ExplorerRouteRoute
});
const DemoStartSsrIndexRoute = Route$9.update({
  id: "/demo/start/ssr/",
  path: "/demo/start/ssr/",
  getParentRoute: () => Route$v
});
const CreatorStoreIdIndexRoute = Route$8.update({
  id: "/store/$id/",
  path: "/store/$id/",
  getParentRoute: () => CreatorRouteRoute
});
const CreatorProjectNewIndexRoute = Route$7.update({
  id: "/project/new/",
  path: "/project/new/",
  getParentRoute: () => CreatorRouteRoute
});
const CreatorProjectProjectIdIndexRoute = Route$6.update({
  id: "/",
  path: "/",
  getParentRoute: () => CreatorProjectProjectIdRouteRoute
});
const CreatorLibraryIdIndexRoute = Route$5.update({
  id: "/library/$id/",
  path: "/library/$id/",
  getParentRoute: () => CreatorRouteRoute
});
const DemoStartSsrSpaModeRoute = Route$4.update({
  id: "/demo/start/ssr/spa-mode",
  path: "/demo/start/ssr/spa-mode",
  getParentRoute: () => Route$v
});
const DemoStartSsrFullSsrRoute = Route$3.update({
  id: "/demo/start/ssr/full-ssr",
  path: "/demo/start/ssr/full-ssr",
  getParentRoute: () => Route$v
});
const DemoStartSsrDataOnlyRoute = Route$2.update({
  id: "/demo/start/ssr/data-only",
  path: "/demo/start/ssr/data-only",
  getParentRoute: () => Route$v
});
const CreatorProjectProjectIdParticipantIndexRoute = Route$1.update({
  id: "/participant/",
  path: "/participant/",
  getParentRoute: () => CreatorProjectProjectIdRouteRoute
});
const CreatorProjectProjectIdMonitorIndexRoute = Route.update({
  id: "/monitor/",
  path: "/monitor/",
  getParentRoute: () => CreatorProjectProjectIdRouteRoute
});
const AdminRouteRouteChildren = {
  AdminIndexRoute,
  AdminSettingsIndexRoute,
  AdminUsersIndexRoute
};
const AdminRouteRouteWithChildren = AdminRouteRoute._addFileChildren(
  AdminRouteRouteChildren
);
const CreatorProjectProjectIdRouteRouteChildren = {
  CreatorProjectProjectIdIndexRoute,
  CreatorProjectProjectIdMonitorIndexRoute,
  CreatorProjectProjectIdParticipantIndexRoute
};
const CreatorProjectProjectIdRouteRouteWithChildren = CreatorProjectProjectIdRouteRoute._addFileChildren(
  CreatorProjectProjectIdRouteRouteChildren
);
const CreatorRouteRouteChildren = {
  CreatorIndexRoute,
  CreatorProjectProjectIdRouteRoute: CreatorProjectProjectIdRouteRouteWithChildren,
  CreatorCalendarIndexRoute,
  CreatorLibraryIndexRoute,
  CreatorStoreIndexRoute,
  CreatorLibraryIdIndexRoute,
  CreatorProjectNewIndexRoute,
  CreatorStoreIdIndexRoute
};
const CreatorRouteRouteWithChildren = CreatorRouteRoute._addFileChildren(
  CreatorRouteRouteChildren
);
const ExplorerRouteRouteChildren = {
  ExplorerIndexRoute,
  ExplorerCalendarIndexRoute,
  ExplorerPortfolioIndexRoute,
  ExplorerProjectProjectIdIndexRoute
};
const ExplorerRouteRouteWithChildren = ExplorerRouteRoute._addFileChildren(
  ExplorerRouteRouteChildren
);
const rootRouteChildren = {
  IndexRoute,
  AdminRouteRoute: AdminRouteRouteWithChildren,
  CreatorRouteRoute: CreatorRouteRouteWithChildren,
  ExplorerRouteRoute: ExplorerRouteRouteWithChildren,
  SigninIndexRoute,
  SignupIndexRoute,
  DemoApiNamesRoute,
  DemoStartApiRequestRoute,
  DemoStartServerFuncsRoute,
  DemoStartSsrDataOnlyRoute,
  DemoStartSsrFullSsrRoute,
  DemoStartSsrSpaModeRoute,
  DemoStartSsrIndexRoute
};
const routeTree = Route$v._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const router2 = createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  publishTemplate as $,
  Avatar as A,
  Button as B,
  searchDelegateUsers as C,
  Dialog as D,
  DialogDescription as E,
  DialogFooter as F,
  cloneProjectAsTemplate as G,
  updateProject as H,
  Input as I,
  JoinCode as J,
  updateSession as K,
  delegateProject as L,
  getAdminStats as M,
  Collapsible as N,
  CollapsibleTrigger as O,
  Popover as P,
  CollapsibleContent as Q,
  DropdownMenu as R,
  ScrollArea as S,
  TooltipProvider as T,
  DropdownMenuTrigger as U,
  DropdownMenuContent as V,
  DropdownMenuItem as W,
  getStoreTemplates as X,
  cloneStoreTemplate as Y,
  getLibraryTemplates as Z,
  unpublishTemplate as _,
  Badge as a,
  deleteProject as a0,
  deployTemplate as a1,
  createUser as a2,
  updateUserRole as a3,
  listUsers as a4,
  Select as a5,
  SelectTrigger as a6,
  SelectValue as a7,
  SelectContent as a8,
  SelectItem as a9,
  getStoreTemplate as aA,
  Textarea as aB,
  updateUser as aC,
  ProjectDetailPage as aD,
  getPunkSongs as aE,
  Route$3 as aF,
  Route$2 as aG,
  Route$1 as aH,
  unremoveParticipant as aI,
  getProjectSubmissions as aJ,
  gradeSubmission as aK,
  regradeSubmission as aL,
  Route as aM,
  admin as aN,
  router as aO,
  DropdownMenuSeparator as aa,
  AlertDialog as ab,
  AlertDialogContent as ac,
  AlertDialogHeader as ad,
  AlertDialogTitle as ae,
  AlertDialogDescription as af,
  AlertDialogFooter as ag,
  AlertDialogCancel as ah,
  AlertDialogAction as ai,
  deleteUser as aj,
  getSystemSettings as ak,
  aiListModels as al,
  updateSystemSetting as am,
  Route$e as an,
  DialogClose as ao,
  isValidDate as ap,
  sendFloatingBotMessage as aq,
  getTeamPersonas as ar,
  sendMessage as as,
  getFloatingBotMessages as at,
  getMessages as au,
  getOrCreateRoom as av,
  aiChatCompletion as aw,
  Route$a as ax,
  allocateTeams as ay,
  getProject as az,
  getStoredRedirectPath as b,
  clearStoredRedirectPath as c,
  cn as d,
  getUserInvitations as e,
  getProjectTimeStatus as f,
  getRoleBasedHomePath as g,
  getProjectProgress as h,
  getProjectTimeInfo as i,
  joinProject as j,
  PopoverTrigger as k,
  PopoverContent as l,
  Progress as m,
  DialogContent as n,
  DialogHeader as o,
  DialogTitle as p,
  AvatarImage as q,
  respondToInvitation as r,
  safeFormatDate as s,
  AvatarFallback as t,
  useAuthStore as u,
  Tooltip as v,
  TooltipTrigger as w,
  TooltipContent as x,
  getUserProjects as y,
  useCreatorStore as z
};
