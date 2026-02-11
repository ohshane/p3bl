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
function ExplorerLayout() {
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
    if (currentUser && !currentUser.role.includes("explorer")) {
      if (currentUser.role.includes("creator")) {
        navigate({
          to: "/creator"
        });
      }
    }
  }, [currentUser, navigate]);
  if (!currentUser) {
    return null;
  }
  if (!currentUser.role.includes("explorer")) {
    return null;
  }
  return /* @__PURE__ */ jsx(Outlet, {});
}
export {
  ExplorerLayout as component
};
