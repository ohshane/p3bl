import { jsx } from "react/jsx-runtime";
import { useNavigate, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { u as useAuthStore } from "./router-Bhor0jGk.js";
import "next-themes";
import "lucide-react";
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
function CreatorLayout() {
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
  return /* @__PURE__ */ jsx("div", { className: "min-h-[calc(100vh-4rem)] bg-background", children: /* @__PURE__ */ jsx(Outlet, {}) });
}
export {
  CreatorLayout as component
};
