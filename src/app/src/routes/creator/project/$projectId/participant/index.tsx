import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft,
  Users,
  User,
  UserMinus,
  X,
  Clock,
  Loader2,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useAuthStore } from "@/stores/authStore";
import { useCreatorStore } from "@/stores/creatorStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { unremoveParticipant } from "@/server/api/projects";

export const Route = createFileRoute(
  "/creator/project/$projectId/participant/",
)({
  component: ParticipantPage,
});

const POLL_INTERVAL = 10_000; // 10 seconds

// ─── Participant Card ───────────────────────────────────────────────────────

interface ParticipantCardProps {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  joinedAt: string;
  onRemove: (id: string, name: string) => void;
}

function ParticipantCard({
  id,
  name,
  email,
  avatar,
  joinedAt,
  onRemove,
}: ParticipantCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3 bg-card border border-border rounded-lg p-3 group hover:border-muted-foreground/30 transition-colors">
      <Avatar>
        {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate">{email}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground hidden sm:inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(joinedAt), { addSuffix: true })}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Joined {new Date(joinedAt).toLocaleString()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <button
          type="button"
          onClick={() => onRemove(id, name)}
          className="p-1.5 rounded-md text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <UserMinus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

function ParticipantPage() {
  const navigate = useNavigate();
  const { projectId } = Route.useParams();
  const { isAuthenticated, currentUser } = useAuthStore();
  const {
    getProject,
    fetchProjects,
    getParticipants,
    fetchParticipants,
    removeParticipant,
  } = useCreatorStore();

  const project = getProject(projectId);
  const participants = getParticipants(projectId);

  const [isLoading, setIsLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Auth guards
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (currentUser && !currentUser.role.includes("creator")) {
      navigate({ to: "/explorer" });
    }
  }, [currentUser, navigate]);

  // Fetch projects if not loaded (e.g. hard refresh)
  useEffect(() => {
    if (currentUser?.id && !project) {
      fetchProjects(currentUser.id);
    }
  }, [currentUser?.id, project, fetchProjects]);

  // Initial fetch
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchParticipants(projectId);
      setIsLoading(false);
      setLastRefresh(new Date());
    };
    load();
  }, [projectId, fetchParticipants]);

  // Poll for live updates
  useEffect(() => {
    const interval = setInterval(async () => {
      await fetchParticipants(projectId);
      setLastRefresh(new Date());
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [projectId, fetchParticipants]);

  // Manual refresh
  const handleManualRefresh = useCallback(async () => {
    await fetchParticipants(projectId);
    setLastRefresh(new Date());
  }, [projectId, fetchParticipants]);

  // Remove participant
  const handleRemove = useCallback(
    async (userId: string) => {
      setRemoveLoading(true);
      try {
        const success = await removeParticipant(projectId, userId);
        if (success) {
          toast.success("Participant removed");
        } else {
          toast.error("Failed to remove participant");
        }
      } catch {
        toast.error("Failed to remove participant");
      } finally {
        setRemoveLoading(false);
        setRemoveTarget(null);
      }
    },
    [projectId, removeParticipant],
  );

  // Unremove participant
  const handleUnremove = useCallback(
    async (userId: string) => {
      try {
        const result = await unremoveParticipant({
          data: { projectId, userId },
        });
        if (result.success) {
          toast.success("Participant unremoved");
          await fetchParticipants(projectId);
        } else {
          toast.error("Failed to unremove participant");
        }
      } catch {
        toast.error("Failed to unremove participant");
      }
    },
    [projectId, fetchParticipants],
  );

  if (!currentUser || !currentUser.role.includes("creator")) {
    return null;
  }

  if (!project) {
    return (
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Project Not Found
          </h2>
          <p className="text-muted-foreground mb-4">
            The project you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button onClick={() => navigate({ to: "/creator" })}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Group assigned participants by team
  const teamGroups = new Map<
    string,
    {
      teamName: string;
      members: NonNullable<typeof participants>["assigned"];
    }
  >();

  if (participants) {
    for (const p of participants.assigned) {
      const key = p.teamId!;
      if (!teamGroups.has(key)) {
        teamGroups.set(key, { teamName: p.teamName!, members: [] });
      }
      teamGroups.get(key)!.members.push(p);
    }
  }

  const waitingCount = participants?.waiting.length ?? 0;
  const assignedCount = participants?.assigned.length ?? 0;
  const removedCount = participants?.removed?.length ?? 0;
  const teamCount = teamGroups.size;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() =>
              navigate({
                to: "/creator/project/$projectId",
                params: { projectId },
              })
            }
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Project
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Users className="w-8 h-8 text-cyan-500" />
                Participants
              </h1>
              <p className="text-muted-foreground mt-1">{project.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                Updates every 10s
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleManualRefresh}
                      className="border-border"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Refresh now (last:{" "}
                      {lastRefresh.toLocaleTimeString()})
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className={cn("grid gap-4 mb-8", removedCount > 0 ? "grid-cols-4" : "grid-cols-3")}>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-foreground">
              {participants?.total ?? 0}
            </div>
            <div className="text-sm text-muted-foreground">
              Total Participants
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-foreground">
              {teamCount}
            </div>
            <div className="text-sm text-muted-foreground">Teams</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-amber-500">
              {waitingCount}
            </div>
            <div className="text-sm text-muted-foreground">
              Waiting for Team
            </div>
          </div>
          {removedCount > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-2xl font-bold text-destructive/70">
                {removedCount}
              </div>
              <div className="text-sm text-muted-foreground">Removed</div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && !participants && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">
              Loading participants...
            </span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && participants && participants.total === 0 && (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">
              No participants yet
            </h3>
            <p className="text-sm text-muted-foreground">
              Share the join code{" "}
              <span className="font-mono font-bold text-foreground">
                {project.joinCode}
              </span>{" "}
              to invite explorers.
            </p>
          </div>
        )}

        {/* Waiting for Team Assignment */}
        {participants && waitingCount > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Waiting for Team Assignment
              </h2>
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-xs"
              >
                {waitingCount}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {participants.waiting.map((p) => (
                <ParticipantCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  email={p.email}
                  avatar={p.avatar}
                  joinedAt={p.joinedAt}
                  onRemove={(id, name) => setRemoveTarget({ id, name })}
                />
              ))}
            </div>
          </div>
        )}

        {/* Teams */}
        {participants && teamCount > 0 && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Teams ({teamCount})
            </h2>
            <div className="space-y-4">
              {Array.from(teamGroups.entries()).map(
                ([teamId, { teamName, members }]) => (
                  <Collapsible key={teamId} defaultOpen>
                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                      <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <Users className="w-4 h-4 text-cyan-500" />
                          <span className="text-sm font-medium text-foreground">
                            {teamName}
                          </span>
                          <Badge
                            variant="outline"
                            className="bg-cyan-500/10 text-cyan-500 border-cyan-500/30 text-xs"
                          >
                            {members.length}{" "}
                            {members.length === 1 ? "member" : "members"}
                          </Badge>
                        </div>
                        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t border-border px-4 pb-4 pt-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {members.map((p) => (
                              <ParticipantCard
                                key={p.id}
                                id={p.id}
                                name={p.name}
                                email={p.email}
                                avatar={p.avatar}
                                joinedAt={p.joinedAt}
                                onRemove={(id, name) =>
                                  setRemoveTarget({ id, name })
                                }
                              />
                            ))}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ),
              )}
            </div>
          </div>
        )}

        {/* Removed */}
        {participants && removedCount > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Removed
              </h2>
              <Badge
                variant="outline"
                className="bg-destructive/10 text-destructive border-destructive/30 text-xs"
              >
                {removedCount}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {participants.removed.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 bg-card border border-border rounded-lg p-3"
                >
                  <Avatar>
                    {p.avatar ? (
                      <AvatarImage src={p.avatar} alt={p.name} />
                    ) : null}
                    <AvatarFallback>
                      {p.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {p.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnremove(p.id)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Remove Confirmation Dialog */}
      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      >
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Remove Participant
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to remove{" "}
              <span className="font-medium text-foreground">
                {removeTarget?.name}
              </span>{" "}
              from this project? They will be removed from their team and their
              invitation will be revoked. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-muted-foreground hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90 dark:bg-destructive/60"
              disabled={removeLoading}
              onClick={async () => {
                if (removeTarget) {
                  await handleRemove(removeTarget.id);
                }
              }}
            >
              {removeLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
