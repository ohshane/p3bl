import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from "react";
import { D as Dialog, n as DialogContent, o as DialogHeader, p as DialogTitle, E as DialogDescription, I as Input, F as DialogFooter, B as Button, a2 as createUser, a3 as updateUserRole, a4 as listUsers, a5 as Select, a6 as SelectTrigger, a7 as SelectValue, a8 as SelectContent, a9 as SelectItem, a as Badge, R as DropdownMenu, U as DropdownMenuTrigger, V as DropdownMenuContent, W as DropdownMenuItem, aa as DropdownMenuSeparator, ab as AlertDialog, ac as AlertDialogContent, ad as AlertDialogHeader, ae as AlertDialogTitle, af as AlertDialogDescription, ag as AlertDialogFooter, ah as AlertDialogCancel, ai as AlertDialogAction, aj as deleteUser } from "./router-Bhor0jGk.js";
import { L as Label } from "./label-BGuIo3xV.js";
import { A as Alert, a as AlertDescription } from "./alert-EcntnRnU.js";
import { AlertCircle, EyeOff, Eye, Shield, PenTool, Compass, Loader2, Users, UserPlus, Search, MoreVertical, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import "@tanstack/react-router";
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
const ROLE_CONFIG$1 = [
  {
    value: "admin",
    label: "Admin",
    description: "Full system access including user management",
    icon: Shield,
    colorClass: "text-amber-400"
  },
  {
    value: "creator",
    label: "Creator",
    description: "Can create projects, sessions, and manage explorers",
    icon: PenTool,
    colorClass: "text-purple-400"
  },
  {
    value: "explorer",
    label: "Explorer",
    description: "Can join projects and complete learning activities",
    icon: Compass,
    colorClass: "text-cyan-400"
  }
];
function CreateUserDialog({ open, onOpenChange, onUserCreated }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoles, setSelectedRoles] = useState(["explorer"]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const resetForm = () => {
    setName("");
    setUsername("");
    setEmail("");
    setPassword("");
    setSelectedRoles(["explorer"]);
    setShowPassword(false);
    setError(null);
  };
  const toggleRole = (role) => {
    setSelectedRoles((prev) => {
      if (prev.includes(role)) {
        if (prev.length <= 1) return prev;
        return prev.filter((r) => r !== role);
      }
      return [...prev, role];
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await createUser({
        data: {
          name: name.trim(),
          username: username.trim(),
          email: email.trim(),
          password,
          role: selectedRoles
        }
      });
      if (result.success) {
        resetForm();
        onOpenChange(false);
        onUserCreated();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to create user");
    } finally {
      setLoading(false);
    }
  };
  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: handleOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "bg-card border-border sm:max-w-md", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: "Create New User" }),
      /* @__PURE__ */ jsx(DialogDescription, { className: "text-muted-foreground", children: "Add a new user to the system. They will receive login credentials." })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
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
            value: name,
            onChange: (e) => setName(e.target.value),
            placeholder: "John Doe",
            className: "bg-background border-border",
            required: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "username", children: "Username" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "username",
            value: username,
            onChange: (e) => setUsername(e.target.value),
            placeholder: "johndoe",
            className: "bg-background border-border",
            required: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: "Email" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "email",
            type: "email",
            value: email,
            onChange: (e) => setEmail(e.target.value),
            placeholder: "user@example.com",
            className: "bg-background border-border",
            required: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "password", children: "Password" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "password",
              type: showPassword ? "text" : "password",
              value: password,
              onChange: (e) => setPassword(e.target.value),
              placeholder: "Minimum 8 characters",
              className: "bg-background border-border pr-10",
              minLength: 8,
              required: true
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
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "Roles" }),
        /* @__PURE__ */ jsx("div", { className: "space-y-2", children: ROLE_CONFIG$1.map((config) => {
          const Icon = config.icon;
          const isSelected = selectedRoles.includes(config.value);
          const isLastRole = isSelected && selectedRoles.length <= 1;
          return /* @__PURE__ */ jsxs(
            "label",
            {
              className: `flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? "border-cyan-500/50 bg-cyan-500/5" : "border-border bg-background hover:bg-muted/50"} ${isLastRole ? "opacity-60 cursor-not-allowed" : ""}`,
              children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "checkbox",
                    checked: isSelected,
                    onChange: () => toggleRole(config.value),
                    disabled: isLastRole,
                    className: "mt-1 rounded border-border"
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(Icon, { className: `w-4 h-4 ${config.colorClass}` }),
                    /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground text-sm", children: config.label })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: config.description })
                ] })
              ]
            },
            config.value
          );
        }) }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "At least one role must be selected." })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "ghost",
            onClick: () => handleOpenChange(false),
            disabled: loading,
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "submit",
            className: "bg-cyan-600 hover:bg-cyan-700",
            disabled: loading,
            children: loading ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
              "Creating..."
            ] }) : "Create User"
          }
        )
      ] })
    ] })
  ] }) });
}
const ROLE_CONFIG = [
  {
    value: "admin",
    label: "Admin",
    description: "Full system access including user management",
    icon: Shield,
    colorClass: "text-amber-400"
  },
  {
    value: "creator",
    label: "Creator",
    description: "Can create projects, sessions, and manage explorers",
    icon: PenTool,
    colorClass: "text-purple-400"
  },
  {
    value: "explorer",
    label: "Explorer",
    description: "Can join projects and complete learning activities",
    icon: Compass,
    colorClass: "text-cyan-400"
  }
];
function EditRoleDialog({
  open,
  onOpenChange,
  user,
  onRoleUpdated
}) {
  const [selectedRoles, setSelectedRoles] = useState(
    user?.role ?? ["explorer"]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  useState(() => {
    if (user) {
      setSelectedRoles([...user.role]);
    }
  });
  const toggleRole = (role) => {
    setSelectedRoles((prev) => {
      if (prev.includes(role)) {
        if (prev.length <= 1) return prev;
        return prev.filter((r) => r !== role);
      }
      return [...prev, role];
    });
  };
  const rolesChanged = () => {
    if (!user) return false;
    if (selectedRoles.length !== user.role.length) return true;
    return !selectedRoles.every((r) => user.role.includes(r));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const result = await updateUserRole({
        data: {
          userId: user.id,
          role: selectedRoles
        }
      });
      if (result.success) {
        onOpenChange(false);
        onRoleUpdated();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to update roles");
    } finally {
      setLoading(false);
    }
  };
  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      setError(null);
    } else if (user) {
      setSelectedRoles([...user.role]);
    }
    onOpenChange(newOpen);
  };
  if (!user) return null;
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: handleOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "bg-card border-border sm:max-w-md", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: "Change User Roles" }),
      /* @__PURE__ */ jsxs(DialogDescription, { className: "text-muted-foreground", children: [
        "Update the roles for ",
        user.name
      ] })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
      error && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsx(AlertDescription, { children: error })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-4 bg-muted rounded-lg", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium text-foreground", children: user.name }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: user.email }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 mt-2 flex-wrap", children: user.role.map((r) => {
          const config = ROLE_CONFIG.find((c) => c.value === r);
          if (!config) return null;
          const Icon = config.icon;
          return /* @__PURE__ */ jsxs(
            "span",
            {
              className: "inline-flex items-center gap-1 text-sm text-muted-foreground",
              children: [
                /* @__PURE__ */ jsx(Icon, { className: `w-3.5 h-3.5 ${config.colorClass}` }),
                config.label
              ]
            },
            r
          );
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "Roles" }),
        /* @__PURE__ */ jsx("div", { className: "space-y-2", children: ROLE_CONFIG.map((config) => {
          const Icon = config.icon;
          const isSelected = selectedRoles.includes(config.value);
          const isLastRole = isSelected && selectedRoles.length <= 1;
          return /* @__PURE__ */ jsxs(
            "label",
            {
              className: `flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? "border-cyan-500/50 bg-cyan-500/5" : "border-border bg-background hover:bg-muted/50"} ${isLastRole ? "opacity-60 cursor-not-allowed" : ""}`,
              children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "checkbox",
                    checked: isSelected,
                    onChange: () => toggleRole(config.value),
                    disabled: isLastRole,
                    className: "mt-1 rounded border-border"
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(
                      Icon,
                      {
                        className: `w-4 h-4 ${config.colorClass}`
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground text-sm", children: config.label })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: config.description })
                ] })
              ]
            },
            config.value
          );
        }) }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "At least one role must be selected." })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "ghost",
            onClick: () => handleOpenChange(false),
            disabled: loading,
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "submit",
            className: "bg-cyan-600 hover:bg-cyan-700",
            disabled: loading || !rolesChanged(),
            children: loading ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
              "Updating..."
            ] }) : "Update Roles"
          }
        )
      ] })
    ] })
  ] }) });
}
function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editRoleUser, setEditRoleUser] = useState(null);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listUsers({
        data: {
          page,
          limit,
          search: search || void 0,
          role: roleFilter === "all" ? void 0 : roleFilter,
          sortBy,
          sortOrder
        }
      });
      if (result.success) {
        setUsers(result.users);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, roleFilter, sortBy, sortOrder]);
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, sortBy, sortOrder]);
  const handleDelete = async () => {
    if (!deleteUserId) return;
    setDeleteLoading(true);
    try {
      const result = await deleteUser({
        data: {
          userId: deleteUserId
        }
      });
      if (result.success) {
        loadUsers();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to delete user");
    } finally {
      setDeleteLoading(false);
      setDeleteUserId(null);
    }
  };
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
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-foreground flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Users, { className: "w-8 h-8 text-cyan-500" }),
          "User Management"
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground mt-1", children: [
          total,
          " ",
          total === 1 ? "user" : "users",
          " total"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Button, { className: "bg-cyan-600 hover:bg-cyan-700 text-white", onClick: () => setCreateDialogOpen(true), children: [
        /* @__PURE__ */ jsx(UserPlus, { className: "w-4 h-4 mr-2" }),
        "Add User"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-4 bg-card border border-border rounded-xl p-4", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-1 min-w-[200px]", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx(Input, { placeholder: "Search by name or email...", value: search, onChange: (e) => setSearch(e.target.value), className: "pl-10 bg-background border-border" })
      ] }) }),
      /* @__PURE__ */ jsxs(Select, { value: roleFilter, onValueChange: setRoleFilter, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[150px] bg-background border-border", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "All Roles" }) }),
        /* @__PURE__ */ jsxs(SelectContent, { className: "bg-popover border-border", children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All Roles" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "explorer", children: "Explorer" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "creator", children: "Creator" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "admin", children: "Admin" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: sortBy, onValueChange: (v) => setSortBy(v), children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[140px] bg-background border-border", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsxs(SelectContent, { className: "bg-popover border-border", children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "createdAt", children: "Date Joined" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "name", children: "Name" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "email", children: "Email" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "role", children: "Role" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "outline", size: "icon", className: "border-border", onClick: () => setSortOrder(sortOrder === "asc" ? "desc" : "asc"), children: sortOrder === "asc" ? "↑" : "↓" })
    ] }),
    error && /* @__PURE__ */ jsx("div", { className: "bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-destructive", children: error }),
    /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-xl overflow-hidden", children: [
      loading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-cyan-500 mx-auto mb-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Loading users..." })
      ] }) }) : users.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-12 text-muted-foreground", children: "No users found" }) : /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-muted border-b border-border", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "User" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Role" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Level" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Joined" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border", children: users.map((user) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/50 transition-colors", children: [
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: "text-foreground font-medium", children: user.name.charAt(0).toUpperCase() }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "font-medium text-foreground", children: user.name }),
              /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
                "@",
                user.username
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1", children: user.role.map((r) => /* @__PURE__ */ jsxs(Badge, { className: `${getRoleBadgeColor(r)} gap-1`, children: [
            getRoleIcon(r),
            r
          ] }, r)) }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-foreground font-medium", children: user.level }),
            /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground", children: [
              "(",
              user.xp,
              " XP)"
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-muted-foreground", children: new Date(user.createdAt).toLocaleDateString() }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsxs(DropdownMenu, { children: [
            /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", children: /* @__PURE__ */ jsx(MoreVertical, { className: "w-4 h-4" }) }) }),
            /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", className: "bg-popover border-border", children: [
              /* @__PURE__ */ jsxs(DropdownMenuItem, { className: "text-popover-foreground focus:text-foreground focus:bg-muted", onClick: () => setEditRoleUser(user), children: [
                /* @__PURE__ */ jsx(Pencil, { className: "w-4 h-4 mr-2" }),
                "Change Role"
              ] }),
              /* @__PURE__ */ jsx(DropdownMenuSeparator, { className: "bg-border" }),
              /* @__PURE__ */ jsxs(DropdownMenuItem, { className: "text-destructive focus:text-destructive focus:bg-destructive/10", onClick: () => setDeleteUserId(user.id), children: [
                /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4 mr-2" }),
                "Delete User"
              ] })
            ] })
          ] }) })
        ] }, user.id)) })
      ] }),
      totalPages > 1 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-6 py-4 border-t border-border", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
          "Showing ",
          (page - 1) * limit + 1,
          " to ",
          Math.min(page * limit, total),
          " of ",
          total,
          " users"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", className: "border-border", onClick: () => setPage(page - 1), disabled: page === 1, children: /* @__PURE__ */ jsx(ChevronLeft, { className: "w-4 h-4" }) }),
          /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground px-2", children: [
            "Page ",
            page,
            " of ",
            totalPages
          ] }),
          /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", className: "border-border", onClick: () => setPage(page + 1), disabled: page === totalPages, children: /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4" }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(CreateUserDialog, { open: createDialogOpen, onOpenChange: setCreateDialogOpen, onUserCreated: loadUsers }),
    /* @__PURE__ */ jsx(EditRoleDialog, { open: !!editRoleUser, onOpenChange: (open) => !open && setEditRoleUser(null), user: editRoleUser, onRoleUpdated: loadUsers }),
    /* @__PURE__ */ jsx(AlertDialog, { open: !!deleteUserId, onOpenChange: (open) => !open && setDeleteUserId(null), children: /* @__PURE__ */ jsxs(AlertDialogContent, { className: "bg-card border-border", children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { className: "text-foreground", children: "Delete User" }),
        /* @__PURE__ */ jsx(AlertDialogDescription, { className: "text-muted-foreground", children: "Are you sure you want to delete this user? This action cannot be undone. All user data including projects, artifacts, and progress will be permanently deleted." })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { className: "border-border text-muted-foreground hover:bg-muted", children: "Cancel" }),
        /* @__PURE__ */ jsx(AlertDialogAction, { className: "bg-red-600 hover:bg-red-700", onClick: handleDelete, disabled: deleteLoading, children: deleteLoading ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
          "Deleting..."
        ] }) : "Delete User" })
      ] })
    ] }) })
  ] });
}
export {
  UsersPage as component
};
