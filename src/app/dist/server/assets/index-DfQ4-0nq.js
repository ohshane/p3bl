import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { u as useAuthStore, I as Input, B as Button, c as clearStoredRedirectPath, g as getRoleBasedHomePath, b as getStoredRedirectPath } from "./router-Bhor0jGk.js";
import { L as Label } from "./label-BGuIo3xV.js";
import { A as Alert, a as AlertDescription } from "./alert-EcntnRnU.js";
import { AlertCircle, EyeOff, Eye, Check, X, Loader2 } from "lucide-react";
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
function RegisterForm({ redirectTo }) {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const passwordRequirements = [
    { label: "At least 8 characters", test: (p) => p.length >= 8 },
    { label: "Contains lowercase letter", test: (p) => /[a-z]/.test(p) },
    { label: "Contains uppercase letter", test: (p) => /[A-Z]/.test(p) },
    { label: "Contains a number", test: (p) => /\d/.test(p) }
  ];
  const validateForm = () => {
    const errors = {};
    if (!name.trim()) {
      errors.name = "Name is required";
    } else if (name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }
    if (!username.trim()) {
      errors.username = "Username is required";
    } else if (username.trim().length < 3) {
      errors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
      errors.username = "Only letters, numbers, underscores, and hyphens";
    }
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!password) {
      errors.password = "Password is required";
    } else {
      const failedRequirements = passwordRequirements.filter((req) => !req.test(password));
      if (failedRequirements.length > 0) {
        errors.password = "Password does not meet requirements";
      }
    }
    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
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
    const result = await register({
      name: name.trim(),
      username: username.trim(),
      email: email.trim(),
      password
    });
    if (result.success) {
      clearStoredRedirectPath();
      const user = useAuthStore.getState().currentUser;
      navigate({ to: redirectTo || getRoleBasedHomePath(user?.role ?? []) });
    }
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [
    error && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
      /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx(AlertDescription, { children: error })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "name", children: "Full Name" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          id: "name",
          type: "text",
          placeholder: "John Doe",
          value: name,
          onChange: (e) => {
            setName(e.target.value);
            if (validationErrors.name) {
              setValidationErrors((prev) => ({ ...prev, name: void 0 }));
            }
          },
          className: "bg-background border-border placeholder:text-muted-foreground",
          autoComplete: "name",
          autoFocus: true
        }
      ),
      validationErrors.name && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: validationErrors.name })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "username", children: "Username" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          id: "username",
          type: "text",
          placeholder: "johndoe",
          value: username,
          onChange: (e) => {
            setUsername(e.target.value);
            if (validationErrors.username) {
              setValidationErrors((prev) => ({ ...prev, username: void 0 }));
            }
          },
          className: "bg-background border-border placeholder:text-muted-foreground",
          autoComplete: "username"
        }
      ),
      validationErrors.username && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: validationErrors.username })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: "Email" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          id: "email",
          type: "email",
          placeholder: "you@example.com",
          value: email,
          onChange: (e) => {
            setEmail(e.target.value);
            if (validationErrors.email) {
              setValidationErrors((prev) => ({ ...prev, email: void 0 }));
            }
          },
          className: "bg-background border-border placeholder:text-muted-foreground",
          autoComplete: "email"
        }
      ),
      validationErrors.email && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: validationErrors.email })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "password", children: "Password" }),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "password",
            type: showPassword ? "text" : "password",
            placeholder: "Create a strong password",
            value: password,
            onChange: (e) => {
              setPassword(e.target.value);
              if (validationErrors.password) {
                setValidationErrors((prev) => ({ ...prev, password: void 0 }));
              }
            },
            className: "bg-background border-border placeholder:text-muted-foreground pr-10",
            autoComplete: "new-password"
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
      validationErrors.password && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: validationErrors.password }),
      password && /* @__PURE__ */ jsx("div", { className: "mt-2 space-y-1", children: passwordRequirements.map((req, index) => {
        const passed = req.test(password);
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: `flex items-center gap-2 text-xs ${passed ? "text-green-600" : "text-muted-foreground"}`,
            children: [
              passed ? /* @__PURE__ */ jsx(Check, { className: "h-3 w-3" }) : /* @__PURE__ */ jsx(X, { className: "h-3 w-3" }),
              req.label
            ]
          },
          index
        );
      }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "confirmPassword", children: "Confirm Password" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          id: "confirmPassword",
          type: showPassword ? "text" : "password",
          placeholder: "Confirm your password",
          value: confirmPassword,
          onChange: (e) => {
            setConfirmPassword(e.target.value);
            if (validationErrors.confirmPassword) {
              setValidationErrors((prev) => ({ ...prev, confirmPassword: void 0 }));
            }
          },
          className: "bg-background border-border placeholder:text-muted-foreground",
          autoComplete: "new-password"
        }
      ),
      validationErrors.confirmPassword && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: validationErrors.confirmPassword })
    ] }),
    /* @__PURE__ */ jsx(
      Button,
      {
        type: "submit",
        className: "w-full bg-cyan-600 hover:bg-cyan-700",
        disabled: isLoading,
        children: isLoading ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
          "Creating account..."
        ] }) : "Create account"
      }
    ),
    /* @__PURE__ */ jsxs("p", { className: "text-center text-sm text-muted-foreground", children: [
      "Already have an account?",
      " ",
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/signin",
          className: "text-cyan-600 hover:text-cyan-700 transition-colors",
          children: "Sign in"
        }
      )
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-muted-foreground", children: "By creating an account, you agree to our Terms of Service and Privacy Policy." })
  ] });
}
function RegisterPage() {
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
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background flex items-center justify-center px-4 py-12", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
      /* @__PURE__ */ jsx(Link, { to: "/", className: "inline-block", children: /* @__PURE__ */ jsx("img", { src: "/android-chrome-192x192.png", alt: "Peabee", className: "w-16 h-16 rounded-2xl shadow-lg shadow-cyan-500/25 mx-auto mb-4" }) }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-foreground", children: "Create your account" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-2", children: "Start your learning journey today" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-card border border-border shadow-sm rounded-xl p-6", children: /* @__PURE__ */ jsx(RegisterForm, { redirectTo }) }),
    /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-muted-foreground mt-8", children: "Peabee" })
  ] }) });
}
export {
  RegisterPage as component
};
