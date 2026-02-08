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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateUserRole } from "@/server/api/admin";
import {
  Loader2,
  AlertCircle,
  Shield,
  Compass,
  PenTool,
  Rocket,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "explorer" | "creator" | "pioneer" | "admin";
}

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onRoleUpdated: () => void;
}

export function EditRoleDialog({
  open,
  onOpenChange,
  user,
  onRoleUpdated,
}: EditRoleDialogProps) {
  const [role, setRole] = useState<
    "explorer" | "creator" | "pioneer" | "admin"
  >(user?.role || "explorer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update role when user changes
  useState(() => {
    if (user) {
      setRole(user.role);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const result = await updateUserRole({
        data: {
          userId: user.id,
          role,
        },
      });

      if (result.success) {
        onOpenChange(false);
        onRoleUpdated();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to update role");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setError(null);
    } else if (user) {
      setRole(user.role);
    }
    onOpenChange(newOpen);
  };

  const getRoleIcon = (r: string) => {
    switch (r) {
      case "admin":
        return <Shield className="w-4 h-4 text-amber-400" />;
      case "creator":
        return <PenTool className="w-4 h-4 text-purple-400" />;
      case "pioneer":
        return <Rocket className="w-4 h-4 text-green-400" />;
      default:
        return <Compass className="w-4 h-4 text-cyan-400" />;
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update the role for {user.name}
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
            <div className="flex items-center gap-2 mt-2">
              {getRoleIcon(user.role)}
              <span className="text-sm text-muted-foreground">
                Current role: {user.role}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">New Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as typeof role)}
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="explorer">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    Explorer
                  </div>
                </SelectItem>
                <SelectItem value="creator">
                  <div className="flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-purple-400" />
                    Creator
                  </div>
                </SelectItem>
                <SelectItem value="pioneer">
                  <div className="flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-green-400" />
                    Pioneer (Creator & Explorer)
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    Admin
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {role === "explorer" &&
                "Can join projects and complete learning activities"}
              {role === "creator" &&
                "Can create projects, sessions, and manage explorers"}
              {role === "pioneer" &&
                "Early adopter with special access privileges"}
              {role === "admin" &&
                "Full system access including user management"}
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
              disabled={loading || role === user.role}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Role"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
