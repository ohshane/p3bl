import { jsxs, jsx } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { u as useAuthStore, g as getRoleBasedHomePath, B as Button, a as Badge } from "./router-Bhor0jGk.js";
import { C as Card, a as CardContent } from "./card-CuhZmkUZ.js";
import { ArrowRight, Sparkles, Target, MessageSquare, Trophy, GraduationCap } from "lucide-react";
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
function LandingPage() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    currentUser
  } = useAuthStore();
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      navigate({
        to: getRoleBasedHomePath(currentUser.role)
      });
    }
  }, [isAuthenticated, currentUser, navigate]);
  const features = [{
    icon: /* @__PURE__ */ jsx(Sparkles, { className: "w-5 h-5" }),
    title: "AI Creator Wizard",
    description: "Design comprehensive project-based learning experiences in minutes with our AI-powered design assistant."
  }, {
    icon: /* @__PURE__ */ jsx(Target, { className: "w-5 h-5" }),
    title: "Smart Output Builder",
    description: "Construct complex outputs with real-time, rubric-aligned feedback from AI to ensure high-quality submissions."
  }, {
    icon: /* @__PURE__ */ jsx(MessageSquare, { className: "w-5 h-5" }),
    title: "Collaborative Group Chat",
    description: "Work with peers and interactive AI personas that guide discussions and provide specialized support."
  }, {
    icon: /* @__PURE__ */ jsx(Trophy, { className: "w-5 h-5" }),
    title: "Competency Portfolio",
    description: "Track progress across specific skills and earn digital badges that showcase your real-world achievements."
  }];
  const steps = [{
    number: "1",
    icon: /* @__PURE__ */ jsx(Target, { className: "w-5 h-5" }),
    title: "Join a Project",
    description: "Browse and enroll in projects that match your learning goals."
  }, {
    number: "2",
    icon: /* @__PURE__ */ jsx(MessageSquare, { className: "w-5 h-5" }),
    title: "Complete Sessions",
    description: "Work through structured sessions with your team and AI guidance."
  }, {
    number: "3",
    icon: /* @__PURE__ */ jsx(GraduationCap, { className: "w-5 h-5" }),
    title: "Demonstrate Skills",
    description: "Submit work, receive feedback, and earn recognition for competencies."
  }];
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsx("section", { className: "py-16 px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-8", children: /* @__PURE__ */ jsx("img", { src: "/android-chrome-192x192.png", alt: "Peabee", className: "w-20 h-20 rounded-2xl shadow-sm" }) }),
      /* @__PURE__ */ jsx("h1", { className: "text-4xl sm:text-5xl font-bold text-foreground mb-4", children: "Peabee" }),
      /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground mb-8 max-w-2xl mx-auto", children: "The next generation of Project-Based Learning. Collaborative projects with AI-powered guidance, real-time feedback, and competency-based tracking." }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-center gap-3", children: [
        /* @__PURE__ */ jsx(Link, { to: "/signup", children: /* @__PURE__ */ jsxs(Button, { size: "lg", className: "bg-cyan-600 hover:bg-cyan-700", children: [
          "Get Started",
          /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
        ] }) }),
        /* @__PURE__ */ jsx(Link, { to: "/signin", children: /* @__PURE__ */ jsx(Button, { size: "lg", variant: "outline", children: "Sign In" }) })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-6", children: "Free for Explorers. Creators and admins are invited." })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-12 px-4 sm:px-6 lg:px-8 border-t border-border", children: /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-10", children: [
        /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "mb-3", children: "Features" }),
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold text-foreground", children: "What you get" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: features.map((feature, index) => /* @__PURE__ */ jsx(Card, { className: "bg-card border-border", children: /* @__PURE__ */ jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500 shrink-0", children: feature.icon }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground mb-1", children: feature.title }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: feature.description })
        ] })
      ] }) }) }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-12 px-4 sm:px-6 lg:px-8 border-t border-border", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-10", children: [
        /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "mb-3", children: "How It Works" }),
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold text-foreground", children: "Three steps to get started" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: steps.map((step, index) => /* @__PURE__ */ jsx(Card, { className: "bg-card border-border text-center", children: /* @__PURE__ */ jsxs(CardContent, { className: "pt-6", children: [
        /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-foreground mx-auto mb-4", children: step.number }),
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500 mx-auto mb-4", children: step.icon }),
        /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground mb-2", children: step.title }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: step.description })
      ] }) }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-12 px-4 sm:px-6 lg:px-8 border-t border-border", children: /* @__PURE__ */ jsx("div", { className: "max-w-2xl mx-auto", children: /* @__PURE__ */ jsx(Card, { className: "bg-card border-border", children: /* @__PURE__ */ jsxs(CardContent, { className: "pt-6 text-center", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mb-2", children: "Ready to get started?" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-6", children: "Create an account and join your first project." }),
      /* @__PURE__ */ jsx(Link, { to: "/signup", children: /* @__PURE__ */ jsx(Button, { className: "bg-cyan-600 hover:bg-cyan-700", children: "Create Account" }) })
    ] }) }) }) }),
    /* @__PURE__ */ jsx("footer", { className: "py-8 px-4 sm:px-6 lg:px-8 border-t border-border", children: /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("img", { src: "/android-chrome-192x192.png", alt: "Peabee", className: "w-6 h-6 rounded" }),
        /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "Peabee" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 text-sm", children: [
        /* @__PURE__ */ jsx(Link, { to: "/signin", className: "text-muted-foreground hover:text-foreground", children: "Sign In" }),
        /* @__PURE__ */ jsx(Link, { to: "/signup", className: "text-muted-foreground hover:text-foreground", children: "Get Started" })
      ] })
    ] }) })
  ] });
}
export {
  LandingPage as component
};
