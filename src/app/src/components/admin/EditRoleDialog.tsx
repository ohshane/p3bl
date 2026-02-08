import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateUserRole } from "@/server/api/admin";
import {
  Loader2,
  AlertCircle,
  Shield,
  Compass,
  PenTool,
} from "lucide-react";
import type { UserRole } from "@/db/schema/users";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole[];
}

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onRoleUpdated: () => void;
}

const ROLE_CONFIG: {
  value: UserRole;
  label: string;
  description: string;
  icon: typeof Shield;
  colorClass: string;
}[] = [
  {
    value: "admin",
    label: "Admin",
    description: "Full system access including user management",
    icon: Shield,
    colorClass: "text-amber-400",
  },
  {
    value: "creator",
    label: "Creator",
    description: "Can create projects, sessions, and manage explorers",
    icon: PenTool,
    colorClass: "text-purple-400",
  },
  {
    value: "explorer",
    label: "Explorer",
    description: "Can join projects and complete learning activities",
    icon: Compass,
    colorClass: "text-cyan-400",
  },
];

export function EditRoleDialog({
  open,
  onOpenChange,
  user,
  onRoleUpdated,
}: EditRoleDialogProps) {
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(
    user?.role ?? ["explorer"]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update roles when user changes
  useState(() => {
    if (user) {
      setSelectedRoles([...user.role]);
    }
  });

  const toggleRole = (role: UserRole) => {
    setSelectedRoles((prev) => {
      if (prev.includes(role)) {
        // Don't allow removing the last role
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const result = await updateUserRole({
        data: {
          userId: user.id,
          role: selectedRoles,
        },
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

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setError(null);
    } else if (user) {
      setSelectedRoles([...user.role]);
    }
    onOpenChange(newOpen);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change User Roles</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update the roles for {user.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {user.role.map((r) => {
                const config = ROLE_CONFIG.find((c) => c.value === r);
                if (!config) return null;
                const Icon = config.icon;
                return (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground"
                  >
                    <Icon className={`w-3.5 h-3.5 ${config.colorClass}`} />
                    {config.label}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Roles</Label>
            <div className="space-y-2">
              {ROLE_CONFIG.map((config) => {
                const Icon = config.icon;
                const isSelected = selectedRoles.includes(config.value);
                const isLastRole =
                  isSelected && selectedRoles.length <= 1;

                return (
                  <label
                    key={config.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? "border-cyan-500/50 bg-cyan-500/5"
                        : "border-border bg-background hover:bg-muted/50"
                    } ${isLastRole ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRole(config.value)}
                      disabled={isLastRole}
                      className="mt-1 rounded border-border"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon
                          className={`w-4 h-4 ${config.colorClass}`}
                        />
                        <span className="font-medium text-foreground text-sm">
                          {config.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {config.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              At least one role must be selected.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-700"
              disabled={loading || !rolesChanged()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Roles"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
