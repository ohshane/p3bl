import { jsx, jsxs } from "react/jsx-runtime";
import { useNavigate, Link, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { u as useAuthStore } from "./router-Bhor0jGk.js";
import { LayoutDashboard, Users, Settings, ChevronRight } from "lucide-react";
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
function AdminLayout() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    currentUser
  } = useAuthStore();
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({
        to: "/signin"
      });
      return;
    }
    if (currentUser && !currentUser.role.includes("admin")) {
      if (currentUser.role.includes("creator")) {
        navigate({
          to: "/creator"
        });
      } else {
        navigate({
          to: "/explorer"
        });
      }
    }
  }, [isAuthenticated, currentUser, navigate]);
  if (!isAuthenticated || !currentUser || !currentUser.role.includes("admin")) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: "Loading..." }) });
  }
  const navItems = [{
    to: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true
  }, {
    to: "/admin/users",
    label: "Users",
    icon: Users,
    exact: true
  }, {
    to: "/admin/settings",
    label: "Settings",
    icon: Settings,
    exact: true
  }];
  return /* @__PURE__ */ jsx("div", { className: "min-h-[calc(100vh-4rem)] bg-background", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-8", children: [
    /* @__PURE__ */ jsx("nav", { className: "w-64 shrink-0", children: /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-xl p-4", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-3", children: "Administration" }),
      /* @__PURE__ */ jsx("ul", { className: "space-y-1", children: navItems.map((item) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link, { to: item.to, className: "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground", children: [
        /* @__PURE__ */ jsx(item.icon, { className: "w-5 h-5" }),
        /* @__PURE__ */ jsx("span", { children: item.label }),
        /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4 ml-auto opacity-50" })
      ] }) }, item.to)) })
    ] }) }),
    /* @__PURE__ */ jsx("main", { className: "flex-1 min-w-0", children: /* @__PURE__ */ jsx(Outlet, {}) })
  ] }) }) });
}
export {
  AdminLayout as component
};
