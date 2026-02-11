import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useRef } from "react";
import { Loader2, Calendar, ChevronLeft, ChevronRight, Clock, FolderPlus, ListChecks, ExternalLink } from "lucide-react";
import { startOfWeek, addDays, startOfMonth, endOfWeek, endOfMonth, eachDayOfInterval, format, differenceInMinutes, isSameDay, isSameMonth, isToday, startOfDay, subMonths, addMonths } from "date-fns";
import { u as useProjectStore } from "./projectStore-kRCMiHLx.js";
import { u as useAuthStore, d as cn, B as Button, a as Badge } from "./router-Bhor0jGk.js";
import { useNavigate } from "@tanstack/react-router";
import "zustand";
import "./artifacts-V6YAL9mY.js";
import "../server.js";
import "node:async_hooks";
import "@tanstack/react-router/ssr/server";
import "zod";
import "next-themes";
import "sonner";
import "zustand/middleware";
import "./auth-B6e831Uo.js";
import "class-variance-authority";
import "radix-ui";
import "clsx";
import "tailwind-merge";
import "qrcode";
function ExplorerCalendarPage() {
  const navigate = useNavigate();
  const {
    currentUser
  } = useAuthStore();
  const {
    userProjects,
    fetchUserProjects,
    isLoadingProjects
  } = useProjectStore();
  const [viewMode, setViewMode] = useState("month");
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 1, 1));
  const [selectedDate, setSelectedDate] = useState(() => new Date(2026, 1, 1));
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    const today = /* @__PURE__ */ new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  }, []);
  useEffect(() => {
    if (currentUser?.id && userProjects.length === 0) {
      fetchUserProjects(currentUser.id);
    }
  }, [currentUser?.id, fetchUserProjects, userProjects.length]);
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    return Array.from({
      length: 7
    }).map((_, i) => addDays(start, i));
  }, [currentDate]);
  const days = useMemo(() => {
    if (viewMode === "month") {
      const start = startOfWeek(startOfMonth(currentDate));
      const end = endOfWeek(endOfMonth(currentDate));
      return eachDayOfInterval({
        start,
        end
      });
    } else {
      return weekDays;
    }
  }, [currentDate, viewMode, weekDays]);
  const projectsByDate = useMemo(() => {
    const map = {};
    userProjects.forEach((project) => {
      if (project.startDate && project.endDate) {
        try {
          const start = new Date(project.startDate);
          const end = new Date(project.endDate);
          if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
          const intervalStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
          const intervalEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
          const daysInRange = eachDayOfInterval({
            start: intervalStart,
            end: intervalEnd
          });
          daysInRange.forEach((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            if (!map[dateKey]) map[dateKey] = [];
            if (!map[dateKey].find((p) => p.id === project.id)) {
              map[dateKey].push(project);
            }
          });
        } catch (e) {
          const dateKey = format(new Date(project.startDate), "yyyy-MM-dd");
          if (!map[dateKey]) map[dateKey] = [];
          if (!map[dateKey].find((p) => p.id === project.id)) {
            map[dateKey].push(project);
          }
        }
      }
    });
    return map;
  }, [userProjects]);
  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 7));
    }
  };
  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, -7));
    }
  };
  const goToToday = () => {
    const today = /* @__PURE__ */ new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };
  const selectedDateProjects = useMemo(() => {
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const projects = projectsByDate[dateKey] || [];
    return [...projects].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [selectedDate, projectsByDate]);
  const [now, setNow] = useState(/* @__PURE__ */ new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(/* @__PURE__ */ new Date()), 6e4);
    return () => clearInterval(interval);
  }, []);
  const currentTimeTop = useMemo(() => {
    const minutes = now.getHours() * 60 + now.getMinutes();
    return minutes / 1440 * 100;
  }, [now]);
  const hours = useMemo(() => Array.from({
    length: 24
  }).map((_, i) => i), []);
  const scrollRef = useRef(null);
  const weekProjects = useMemo(() => {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    const allDay = [];
    const timed = [];
    userProjects.forEach((p) => {
      if (!p.startDate || !p.endDate) return;
      const pStart = new Date(p.startDate);
      const pEnd = new Date(p.endDate);
      if (pStart < end && pEnd > start) {
        if (differenceInMinutes(pEnd, pStart) >= 1440 || !isSameDay(pStart, pEnd)) {
          allDay.push(p);
        } else {
          timed.push(p);
        }
      }
    });
    return {
      allDay,
      timed
    };
  }, [userProjects, currentDate]);
  if (!isMounted || isLoadingProjects && userProjects.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center min-h-[400px]", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-cyan-500 mx-auto mb-4" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Loading your schedule..." })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "container max-w-7xl mx-auto py-8 px-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-foreground flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Calendar, { className: "w-8 h-8 text-cyan-500" }),
          "My Calendar"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-1", children: "View your project timelines and upcoming session deadlines" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center bg-muted rounded-lg p-1 mr-2", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => setViewMode("month"), className: cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", viewMode === "month" ? "bg-background shadow-sm text-cyan-600" : "text-muted-foreground hover:text-foreground"), children: "Month" }),
          /* @__PURE__ */ jsx("button", { onClick: () => setViewMode("week"), className: cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", viewMode === "week" ? "bg-background shadow-sm text-cyan-600" : "text-muted-foreground hover:text-foreground"), children: "Week" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 bg-card border border-border p-1 rounded-lg", children: [
          /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: goToToday, className: "text-xs font-semibold", children: "Today" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center border-l border-border pl-2", children: [
            /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: handlePrev, className: "h-8 w-8", children: /* @__PURE__ */ jsx(ChevronLeft, { className: "w-4 h-4" }) }),
            /* @__PURE__ */ jsx("span", { className: "min-w-[140px] text-center font-bold text-sm", children: viewMode === "month" ? format(currentDate, "MMMM yyyy") : `Week of ${format(startOfWeek(currentDate), "MMM d")}` }),
            /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: handleNext, className: "h-8 w-8", children: /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4" }) })
          ] })
        ] })
      ] })
    ] }),
    viewMode === "month" && /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-xl overflow-hidden shadow-sm", children: [
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-7 border-b border-border bg-muted/30", children: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => /* @__PURE__ */ jsx("div", { className: "py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest", children: day }, day)) }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-7 divide-x divide-y divide-border border-l border-t border-transparent", children: days.map((day) => {
        const dateKey = format(day, "yyyy-MM-dd");
        const dayProjects = projectsByDate[dateKey] || [];
        const isSelectedMonth = isSameMonth(day, currentDate);
        const isSelected = isSameDay(day, selectedDate);
        return /* @__PURE__ */ jsxs("div", { onClick: () => setSelectedDate(day), className: cn("min-h-[140px] p-2 transition-colors cursor-pointer relative hover:bg-muted/5", !isSelectedMonth ? "bg-muted/10 text-muted-foreground/50" : "bg-card", isSelected && "bg-cyan-500/5 ring-2 ring-inset ring-cyan-500"), children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-2", children: [
            /* @__PURE__ */ jsx("span", { className: cn("text-sm font-semibold rounded-full w-7 h-7 flex items-center justify-center", isToday(day) ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20" : !isSelectedMonth ? "text-muted-foreground/30" : "text-muted-foreground"), children: format(day, "d") }),
            dayProjects.length > 0 && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "h-5 px-1.5 text-[10px] font-bold bg-muted/50 text-muted-foreground", children: dayProjects.length })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-1 overflow-y-auto max-h-[100px] scrollbar-none", children: dayProjects.map((project) => /* @__PURE__ */ jsx("button", { onClick: (e) => {
            e.stopPropagation();
            navigate({
              to: `/explorer/project/${project.id}`
            });
          }, className: "w-full text-left p-1.5 rounded bg-purple-500/10 border border-purple-500/20 hover:bg-purple-400 hover:text-white transition-all group cursor-pointer", children: /* @__PURE__ */ jsx("div", { className: "text-[10px] font-bold text-purple-600 group-hover:text-white truncate uppercase tracking-tighter", children: project.title }) }, `proj-indicator-${day.toISOString()}-${project.id}`)) })
        ] }, `cell-${day.toISOString()}`);
      }) })
    ] }),
    viewMode === "week" && /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-350px)] min-h-[500px]", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex border-b border-border bg-muted/30", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 flex-shrink-0 border-r border-border" }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 grid grid-cols-7", children: weekDays.map((day, idx) => {
          const isSelected = isSameDay(day, selectedDate);
          return /* @__PURE__ */ jsxs("div", { onClick: () => setSelectedDate(day), className: cn("text-center py-3 transition-colors cursor-pointer relative hover:bg-muted/5", isSelected ? "bg-cyan-500/5 ring-2 ring-inset ring-cyan-500" : "", idx < 6 && !isSelected && "border-r border-border"), children: [
            /* @__PURE__ */ jsx("div", { className: cn("text-[10px] uppercase font-bold tracking-widest", isSelected ? "text-cyan-600" : "text-muted-foreground"), children: format(day, "EEE") }),
            /* @__PURE__ */ jsx("div", { className: cn("inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mt-1", isToday(day) ? "bg-cyan-600 text-white shadow-md" : isSelected ? "text-cyan-600" : "text-foreground"), children: format(day, "d") })
          ] }, day.toISOString());
        }) })
      ] }),
      weekProjects.allDay.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex border-b border-border", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 flex-shrink-0 border-r border-border bg-muted/5 flex items-center justify-center text-[10px] text-muted-foreground font-medium p-2", children: "All-day" }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 p-0 grid grid-cols-7 bg-muted/5", children: weekDays.map((day, idx) => {
          const dayAllDayProjects = weekProjects.allDay.filter((p) => {
            const start = new Date(p.startDate);
            const end = new Date(p.endDate);
            return day >= startOfDay(start) && day <= startOfDay(end);
          });
          return /* @__PURE__ */ jsx("div", { onClick: () => setSelectedDate(day), className: cn("p-0.5 min-h-[32px] gap-0.5 cursor-pointer transition-colors relative hover:bg-muted/5 flex flex-col", idx < 6 && "border-r border-border/50"), children: dayAllDayProjects.map((p) => /* @__PURE__ */ jsx("button", { onClick: (e) => {
            e.stopPropagation();
            navigate({
              to: `/explorer/project/${p.id}`
            });
          }, className: "w-full bg-purple-500/10 text-purple-600 text-[9px] px-1.5 py-1 truncate shadow-sm hover:bg-purple-400 hover:text-white border border-purple-500/20 transition-all text-left rounded-sm cursor-pointer group", children: /* @__PURE__ */ jsx("span", { className: "font-bold uppercase tracking-tighter", children: p.title }) }, p.id)) }, `allday-${day.toISOString()}`);
        }) })
      ] }),
      /* @__PURE__ */ jsx("div", { ref: scrollRef, className: "flex-1 overflow-hidden relative", children: /* @__PURE__ */ jsxs("div", { className: "flex h-full relative", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 flex-shrink-0 border-r border-border bg-muted/5 text-[10px] text-muted-foreground select-none relative z-20 h-full flex flex-col", children: hours.map((h) => /* @__PURE__ */ jsx("div", { className: "flex-1 border-b border-border/50 text-right pr-2 relative", children: /* @__PURE__ */ jsx("span", { className: "-top-2 absolute right-2", children: format((/* @__PURE__ */ new Date()).setHours(h, 0, 0, 0), "ha") }) }, h)) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 grid grid-cols-7 relative h-full", children: [
          /* @__PURE__ */ jsxs("div", { className: "absolute left-0 right-0 z-40 pointer-events-none flex items-center", style: {
            top: `${currentTimeTop}%`
          }, children: [
            /* @__PURE__ */ jsx("div", { className: "absolute -left-1 w-2 h-2 rounded-full bg-red-500 z-50" }),
            /* @__PURE__ */ jsx("div", { className: "w-full h-0.5 bg-red-500" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex flex-col pointer-events-none", children: hours.map((h) => /* @__PURE__ */ jsx("div", { className: "flex-1 border-b border-border/50 w-full" }, h)) }),
          weekDays.map((day, idx) => {
            return /* @__PURE__ */ jsx("div", { className: cn("relative h-full transition-colors cursor-pointer hover:bg-muted/5", idx < 6 && "border-r border-border"), onClick: () => setSelectedDate(day), children: weekProjects.timed.filter((p) => {
              const pStart = new Date(p.startDate);
              const pEnd = new Date(p.endDate);
              const dayStart = startOfDay(day);
              const dayEnd = addDays(dayStart, 1);
              return pStart < dayEnd && pEnd > dayStart;
            }).map((project) => {
              const pStart = new Date(project.startDate);
              const pEnd = new Date(project.endDate);
              const dayStart = startOfDay(day);
              const dayEnd = addDays(dayStart, 1);
              const visibleStart = pStart < dayStart ? dayStart : pStart;
              const visibleEnd = pEnd > dayEnd ? dayEnd : pEnd;
              const startMin = visibleStart.getHours() * 60 + visibleStart.getMinutes();
              const duration = differenceInMinutes(visibleEnd, visibleStart);
              const isStartDay = isSameDay(pStart, day);
              const isEndDay = isSameDay(pEnd, day);
              return /* @__PURE__ */ jsxs("div", { style: {
                top: `${startMin / 1440 * 100}%`,
                height: `${Math.max(duration / 1440 * 100, 2)}%`,
                minHeight: "32px"
              }, className: cn("absolute inset-x-1 bg-purple-500/10 text-purple-600 text-[10px] p-1.5 overflow-hidden shadow-sm border border-purple-500/20 z-10 cursor-pointer hover:bg-purple-500 hover:text-white transition-all group", isStartDay && isEndDay && "rounded", isStartDay && !isEndDay && "rounded-t", !isStartDay && isEndDay && "rounded-b", !isStartDay && !isEndDay && "rounded-none"), onClick: (e) => {
                e.stopPropagation();
                navigate({
                  to: `/explorer/project/${project.id}`
                });
              }, children: [
                /* @__PURE__ */ jsx("div", { className: "font-bold truncate uppercase tracking-tighter group-hover:text-white", children: project.title }),
                /* @__PURE__ */ jsxs("div", { className: "text-[9px] opacity-90 truncate group-hover:text-white", children: [
                  project.sessionCount,
                  " sessions"
                ] })
              ] }, `project-${project.id}-${day.toISOString()}`);
            }) }, day.toISOString());
          })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-8", children: /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-xl p-6 shadow-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
        /* @__PURE__ */ jsxs("h3", { className: "font-bold text-xl text-foreground flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Clock, { className: "w-6 h-6 text-cyan-500" }),
          "Active Projects on ",
          format(selectedDate, "MMMM d, yyyy")
        ] }),
        isToday(selectedDate) && /* @__PURE__ */ jsx(Badge, { className: "bg-cyan-500 hover:bg-cyan-600", children: "Today" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-4", children: selectedDateProjects.length > 0 ? selectedDateProjects.map((project) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-all group", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(FolderPlus, { className: "w-6 h-6 text-purple-500" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-lg font-bold text-foreground", children: project.title }),
            /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground flex items-center gap-4", children: [
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(Calendar, { className: "w-3.5 h-3.5" }),
                project.startDate ? format(new Date(project.startDate), "MMM d, HH:mm") : "N/A",
                " - ",
                project.endDate ? format(new Date(project.endDate), "MMM d, HH:mm") : "N/A",
                project.startDate && project.endDate && (() => {
                  const mins = differenceInMinutes(new Date(project.endDate), new Date(project.startDate));
                  if (mins < 60) return /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground/70", children: [
                    "(",
                    mins,
                    "m)"
                  ] });
                  const h = Math.floor(mins / 60);
                  const m = mins % 60;
                  if (h < 24) return /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground/70", children: [
                    "(",
                    m > 0 ? `${h}h ${m}m` : `${h}h`,
                    ")"
                  ] });
                  const d = Math.floor(h / 24);
                  const rh = h % 24;
                  return /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground/70", children: [
                    "(",
                    rh > 0 ? `${d}d ${rh}h` : `${d}d`,
                    ")"
                  ] });
                })()
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(ListChecks, { className: "w-3.5 h-3.5" }),
                project.sessionCount,
                " sessions"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsxs(Button, { onClick: () => navigate({
          to: `/explorer/project/${project.id}`
        }), className: "bg-cyan-600 hover:bg-cyan-700 text-white gap-2", children: [
          "Enter Project",
          /* @__PURE__ */ jsx(ExternalLink, { className: "w-4 h-4" })
        ] }) })
      ] }, `selected-proj-${project.id}`)) : /* @__PURE__ */ jsxs("div", { className: "text-center py-12 border-2 border-dashed border-border rounded-xl", children: [
        /* @__PURE__ */ jsx(Calendar, { className: "w-12 h-12 text-muted-foreground/20 mx-auto mb-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground font-medium", children: "No projects scheduled for this date." })
      ] }) })
    ] }) })
  ] });
}
export {
  ExplorerCalendarPage as component
};
