import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { u as useAuthStore, I as Input, B as Button, c as clearStoredRedirectPath, g as getRoleBasedHomePath, b as getStoredRedirectPath } from "./router-Bhor0jGk.js";
import { L as Label } from "./label-BGuIo3xV.js";
import { A as Alert, a as AlertDescription } from "./alert-EcntnRnU.js";
import { AlertCircle, EyeOff, Eye, Loader2 } from "lucide-react";
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
function LoginForm({ redirectTo }) {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const validateForm = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = "Email or username is required";
    }
    if (!password) {
      errors.password = "Password is required";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (!validateForm()) {
      return;
    }
    const result = await login(email.trim(), password);
    if (result.success) {
      clearStoredRedirectPath();
      const user = useAuthStore.getState().currentUser;
      if (redirectTo) {
        navigate({ to: redirectTo });
      } else {
        navigate({ to: getRoleBasedHomePath(user?.role ?? []) });
      }
    }
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
    error && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
      /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx(AlertDescription, { children: error })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: "Email or Username" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          id: "email",
          type: "text",
          placeholder: "you@example.com",
          value: email,
          onChange: (e) => {
            setEmail(e.target.value);
            if (validationErrors.email) {
              setValidationErrors((prev) => ({ ...prev, email: void 0 }));
            }
          },
          className: "bg-background border-border placeholder:text-muted-foreground",
          autoComplete: "email",
          autoFocus: true
        }
      ),
      validationErrors.email && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: validationErrors.email })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "password", children: "Password" }),
        /* @__PURE__ */ jsx(
          "span",
          {
            className: "text-sm text-cyan-600 hover:text-cyan-700 transition-colors cursor-pointer",
            children: "Forgot password?"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "password",
            type: showPassword ? "text" : "password",
            placeholder: "Enter your password",
            value: password,
            onChange: (e) => {
              setPassword(e.target.value);
              if (validationErrors.password) {
                setValidationErrors((prev) => ({ ...prev, password: void 0 }));
              }
            },
            className: "bg-background border-border placeholder:text-muted-foreground pr-10",
            autoComplete: "current-password"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setShowPassword(!showPassword),
            className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
            children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4" })
          }
        )
      ] }),
      validationErrors.password && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: validationErrors.password })
    ] }),
    /* @__PURE__ */ jsx(
      Button,
      {
        type: "submit",
        className: "w-full bg-cyan-600 hover:bg-cyan-700",
        disabled: isLoading,
        children: isLoading ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
          "Signing in..."
        ] }) : "Sign in"
      }
    ),
    /* @__PURE__ */ jsxs("p", { className: "text-center text-sm text-muted-foreground", children: [
      "Don't have an account?",
      " ",
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/signup",
          className: "text-cyan-600 hover:text-cyan-700 transition-colors",
          children: "Sign up"
        }
      )
    ] })
  ] });
}
function LoginPage() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    currentUser
  } = useAuthStore();
  const redirectParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("redirect_uri") : null;
  const storedRedirect = getStoredRedirectPath();
  const redirectTo = redirectParam && redirectParam.startsWith("/") ? redirectParam : storedRedirect ?? void 0;
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (redirectTo) {
        navigate({
          to: redirectTo
        });
        return;
      }
      navigate({
        to: getRoleBasedHomePath(currentUser.role)
      });
    }
  }, [isAuthenticated, currentUser, navigate, redirectTo]);
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background flex items-center justify-center px-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
      /* @__PURE__ */ jsx(Link, { to: "/", className: "inline-block", children: /* @__PURE__ */ jsx("img", { src: "/android-chrome-192x192.png", alt: "Peabee", className: "w-16 h-16 rounded-2xl shadow-lg shadow-cyan-500/25 mx-auto mb-4" }) }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-foreground", children: "Welcome back" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-2", children: "Sign in to your account" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-card border border-border shadow-sm rounded-xl p-6", children: /* @__PURE__ */ jsx(LoginForm, { redirectTo }) }),
    /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-muted-foreground mt-8", children: "Peabee" })
  ] }) });
}
export {
  LoginPage as component
};
