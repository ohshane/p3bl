import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { B as Button, a as Badge, M as getAdminStats } from "./router-Bhor0jGk.js";
import { C as Card, a as CardContent, b as CardHeader, c as CardTitle, d as CardDescription } from "./card-CuhZmkUZ.js";
import { Loader2, Users, Compass, PenTool, Shield, Settings, UserPlus, ArrowRight } from "lucide-react";
import "next-themes";
import "sonner";
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
function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    async function loadStats() {
      try {
        const result = await getAdminStats();
        if (result.success) {
          setStats(result.stats);
          setRecentUsers(result.recentUsers);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);
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
  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return /* @__PURE__ */ jsx(Shield, { className: "w-3 h-3" });
      case "creator":
        return /* @__PURE__ */ jsx(PenTool, { className: "w-3 h-3" });
      default:
        return /* @__PURE__ */ jsx(Compass, { className: "w-3 h-3" });
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64 text-muted-foreground", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-cyan-600" }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-destructive", children: error }) });
  }
  const statCards = [{
    label: "Total Users",
    value: stats?.totalUsers || 0,
    icon: Users,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10"
  }, {
    label: "Explorers",
    value: stats?.explorers || 0,
    icon: Compass,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10"
  }, {
    label: "Creators",
    value: stats?.creators || 0,
    icon: PenTool,
    color: "text-purple-400",
    bg: "bg-purple-500/10"
  }, {
    label: "Admins",
    value: stats?.admins || 0,
    icon: Shield,
    color: "text-amber-400",
    bg: "bg-amber-500/10"
  }];
  return /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-foreground flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Settings, { className: "w-8 h-8 text-cyan-500" }),
          "Admin Dashboard"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-1", children: "Manage users and system settings" })
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/admin/users", children: /* @__PURE__ */ jsxs(Button, { className: "bg-cyan-600 hover:bg-cyan-700 text-white", children: [
        /* @__PURE__ */ jsx(UserPlus, { className: "w-4 h-4 mr-2" }),
        "Add User"
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-4", children: statCards.map((stat) => /* @__PURE__ */ jsx(Card, { className: "bg-card border-border", children: /* @__PURE__ */ jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: stat.label }),
        /* @__PURE__ */ jsx("p", { className: `text-3xl font-bold mt-1 ${stat.color}`, children: stat.value })
      ] }),
      /* @__PURE__ */ jsx("div", { className: `w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`, children: /* @__PURE__ */ jsx(stat.icon, { className: `w-6 h-6 ${stat.color}` }) })
    ] }) }) }, stat.label)) }),
    /* @__PURE__ */ jsxs(Card, { className: "bg-card border-border", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-foreground", children: "Recent Users" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Users registered in the last 7 days" })
        ] }),
        /* @__PURE__ */ jsx(Link, { to: "/admin/users", children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", className: "text-cyan-400 hover:text-cyan-300", children: [
          "View All",
          /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
        ] }) })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { children: recentUsers.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-center py-8", children: "No new users in the last 7 days" }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: recentUsers.map((user) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 bg-muted rounded-lg", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: "text-foreground font-medium", children: user.name.charAt(0).toUpperCase() }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium text-foreground", children: user.name }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: user.email })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1", children: user.role.map((r) => /* @__PURE__ */ jsxs(Badge, { className: `${getRoleBadgeColor(r)} gap-1`, children: [
            getRoleIcon(r),
            r
          ] }, r)) }),
          /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: new Date(user.createdAt).toLocaleDateString() })
        ] })
      ] }, user.id)) }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxs(Card, { className: "bg-card border-border", children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "text-foreground flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(UserPlus, { className: "w-5 h-5 text-cyan-600" }),
            "Create New User"
          ] }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Add users and assign roles to the system" })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(Link, { to: "/admin/users", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "w-full border-border text-muted-foreground hover:bg-muted", children: [
          "Go to User Management",
          /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "bg-card border-border", children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "text-foreground flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Shield, { className: "w-5 h-5 text-amber-400" }),
            "Manage Roles"
          ] }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Promote users to different roles" })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(Link, { to: "/admin/users", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "w-full border-border text-muted-foreground hover:bg-muted", children: [
          "Manage User Roles",
          /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
        ] }) }) })
      ] })
    ] })
  ] });
}
export {
  AdminDashboard as component
};
