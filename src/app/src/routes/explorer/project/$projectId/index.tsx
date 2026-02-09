import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { ChevronLeft, Loader2, ArrowRight, Maximize2, X, UserMinus } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useActivityStore } from "@/stores/activityStore";
import { getProject, allocateTeams } from "@/server/api/projects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VoyageNavigator } from "@/components/activity/VoyageNavigator";
import { ResourcdHub } from "@/components/activity/resourcdhub";
import { SmartOutputBuilder } from "@/components/activity/SmartOutputBuilder";
import { GroupChatPanel } from "@/components/activity/GroupChatPanel";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { Project, Session } from "@/types";

interface UserTeam {
  id: string;
  name: string;
}

// Find the current active session index based on time
// Current session = first session whose endDate has not passed yet
// If all sessions' endDates have passed, return the last session
function findCurrentSessionIndex(sessions: Session[]): number {
  const now = new Date();
  
  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i];
    if (!session.endDate) continue;
    const endDate = new Date(session.endDate);
    if (endDate > now) {
      return i;
    }
  }
  
  // All endDates have passed, return the last session
  return Math.max(0, sessions.length - 1);
}

export const Route = createFileRoute("/explorer/project/$projectId/")({
  component: ExplorerProjectPage,
});

function useCountdown(targetDateStr: string | null) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!targetDateStr) {
      setTimeLeft(0);
      return;
    }

    const target = new Date(targetDateStr).getTime();

    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((target - now) / 1000));
      setTimeLeft(diff);
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [targetDateStr]);

  return timeLeft;
}

function ProjectCountdown({
  startDate,
  onComplete,
}: {
  startDate: string;
  onComplete: () => void;
}) {
  const timeLeft = useCountdown(startDate);

  // Track if we've completed
  useEffect(() => {
    if (timeLeft <= 0 && startDate) {
      // Check if it's actually past time (to avoid firing on mount if 0)
      if (new Date(startDate).getTime() <= Date.now()) {
        onComplete();
      }
    }
  }, [timeLeft, startDate, onComplete]);

  if (timeLeft <= 0) return null;

  const days = Math.floor(timeLeft / (3600 * 24));
  const hours = Math.floor((timeLeft % (3600 * 24)) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-purple-600">
          Project Starts In
        </h2>
      </div>

      <div className="flex gap-4 md:gap-8">
        {days > 0 && (
          <div className="flex flex-col items-center p-4 bg-card border border-border rounded-xl min-w-[100px] shadow-sm">
            <span className="text-4xl md:text-5xl font-bold font-mono">
              {days}
            </span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
              Days
            </span>
          </div>
        )}
        <div className="flex flex-col items-center p-4 bg-card border border-border rounded-xl min-w-[100px] shadow-sm">
          <span className="text-4xl md:text-5xl font-bold font-mono">
            {hours.toString().padStart(2, "0")}
          </span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
            Hours
          </span>
        </div>
        <div className="flex flex-col items-center p-4 bg-card border border-border rounded-xl min-w-[100px] shadow-sm">
          <span className="text-4xl md:text-5xl font-bold font-mono">
            {minutes.toString().padStart(2, "0")}
          </span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
            Minutes
          </span>
        </div>
        <div className="flex flex-col items-center p-4 bg-card border border-border rounded-xl min-w-[100px] shadow-sm">
          <span className="text-4xl md:text-5xl font-bold font-mono text-cyan-500">
            {seconds.toString().padStart(2, "0")}
          </span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
            Seconds
          </span>
        </div>
      </div>
    </div>
  );
}

function SessionCountdown({
  endDate,
  onSessionEnd,
}: {
  endDate: string;
  onSessionEnd?: () => void;
}) {
  const timeLeft = useCountdown(endDate);
  const prevTimeLeft = useRef<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Check if endDate is in the future
  const isFuture = new Date(endDate).getTime() > Date.now();

  // Call onSessionEnd only when timeLeft transitions from >0 to <=0
  // This prevents triggering on initial load of already-expired sessions
  useEffect(() => {
    if (
      prevTimeLeft.current !== null &&
      prevTimeLeft.current > 0 &&
      timeLeft <= 0 &&
      onSessionEnd
    ) {
      onSessionEnd();
    }
    prevTimeLeft.current = timeLeft;
  }, [timeLeft, onSessionEnd]);

  // Reset prevTimeLeft when endDate changes (switching to a new session)
  useEffect(() => {
    prevTimeLeft.current = null;
  }, [endDate]);

  const isExpired = timeLeft <= 0 && !isFuture;

  const days = Math.floor(timeLeft / (3600 * 24));
  const hours = Math.floor((timeLeft % (3600 * 24)) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const renderTimer = (inModal = false) => (
    <div className={`grid grid-cols-4 gap-4 text-center ${inModal ? 'py-8' : ''}`}>
      <div>
        <div className={`${inModal ? 'text-5xl' : 'text-xl'} font-bold font-mono ${isExpired ? "text-amber-500" : ""}`}>
          {isExpired ? "0" : days}
        </div>
        <div className={`${inModal ? 'text-sm' : 'text-[10px]'} uppercase text-muted-foreground`}>
          Days
        </div>
      </div>
      <div>
        <div className={`${inModal ? 'text-5xl' : 'text-xl'} font-bold font-mono ${isExpired ? "text-amber-500" : ""}`}>
          {isExpired ? "00" : hours.toString().padStart(2, "0")}
        </div>
        <div className={`${inModal ? 'text-sm' : 'text-[10px]'} uppercase text-muted-foreground`}>Hrs</div>
      </div>
      <div>
        <div className={`${inModal ? 'text-5xl' : 'text-xl'} font-bold font-mono ${isExpired ? "text-amber-500" : ""}`}>
          {isExpired ? "00" : minutes.toString().padStart(2, "0")}
        </div>
        <div className={`${inModal ? 'text-sm' : 'text-[10px]'} uppercase text-muted-foreground`}>Min</div>
      </div>
      <div>
        <div className={`${inModal ? 'text-5xl' : 'text-xl'} font-bold font-mono ${isExpired ? "text-amber-500" : "text-cyan-500"}`}>
          {isExpired ? "00" : seconds.toString().padStart(2, "0")}
        </div>
        <div className={`${inModal ? 'text-sm' : 'text-[10px]'} uppercase text-muted-foreground`}>Sec</div>
      </div>
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">
            {isExpired ? "Time's Up" : "Time Remaining"}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsExpanded(true)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {renderTimer(false)}
        </CardContent>
      </Card>

      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent
          className="max-w-xl"
          overlayClassName="backdrop-blur-sm"
          showCloseButton={false}
        >
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>
              {isExpired ? "Time's Up" : "Time Remaining"}
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogHeader>
          {renderTimer(true)}
        </DialogContent>
      </Dialog>
    </>
  );
}

function WaitingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Allocating Teams...</h2>
        <p className="text-muted-foreground">
          Please wait while we group participants randomly.
        </p>
      </div>
    </div>
  );
}

function ExplorerProjectPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuthStore();
  const {
    setCurrentProject,
    setCurrentSession,
    currentSessionIndex,
    runPreCheckAction: _runPreCheckAction,
    submitAction: _submitAction,
    isRunningPreCheck: _isRunningPreCheck,
  } = useActivityStore();

  const [project, setProject] = useState<Project | null>(null);
  const [userTeam, setUserTeam] = useState<UserTeam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAllocating, setIsAllocating] = useState(false);
  const [showNextSessionModal, setShowNextSessionModal] = useState(false);
  const [showProjectEndedModal, setShowProjectEndedModal] = useState(false);
  const [showRemovedModal, setShowRemovedModal] = useState(false);
  const [isSmartOutputOpen, setIsSmartOutputOpen] = useState(false);
  const hasLoadedOnce = useRef(false);
  const hadTeamRef = useRef(false);

  // Reset local state when projectId changes (SPA navigation between projects).
  // This ensures stale team/project data from a previous project doesn't leak
  // into the new project's render, which would cause GroupChatPanel to
  // initialize with the wrong teamId.
  // We detect the change synchronously during render so the very first render
  // after a navigation already uses clean state.
  const prevProjectIdRef = useRef(projectId);
  if (prevProjectIdRef.current !== projectId) {
    prevProjectIdRef.current = projectId;
    // These calls are safe during render (React "setState during render" pattern)
    // because React will immediately re-render with the reset values.
    setProject(null);
    setUserTeam(null);
    setIsLoading(true);
    setError(null);
    setRefreshKey(0);
    setIsAllocating(false);
    setShowNextSessionModal(false);
    setShowProjectEndedModal(false);
    setShowRemovedModal(false);
    setIsSmartOutputOpen(false);
    hasLoadedOnce.current = false;
    hadTeamRef.current = false;
  }

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/signin" });
    }
  }, [isAuthenticated, navigate]);

  // Set current project on mount
  useEffect(() => {
    setCurrentProject(projectId);
    return () => setCurrentProject(null);
  }, [projectId, setCurrentProject]);

  // Fetch project data from API
  useEffect(() => {
    async function fetchProject() {
      if (!currentUser) return;

      // Only show loading spinner on initial load, not on poll refreshes
      if (!hasLoadedOnce.current) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const result = await getProject({
          data: { projectId, userId: currentUser.id },
        });

        if (result.success && result.project) {
          // Transform API response to Project type
          const apiProject = result.project;

          const transformedProject: Project = {
            id: apiProject.id,
            name: apiProject.title,
            description: apiProject.description || "",
            creatorId: apiProject.creatorId,
            creatorName: apiProject.creator?.name || "Unknown",
            startDate: apiProject.startDate ?? null,
            endDate: apiProject.endDate ?? null,
            teamId: result.userTeam?.id || "",
            currentSessionIndex: 0,
            sessions: apiProject.sessions.map((s: any, idx: number) => ({
              id: s.id,
              index: s.order || idx,
              title: s.title,
              topic: s.topic || "",
              startDate: s.startDate || "",
              endDate: s.endDate || "",
              deliverableType: s.deliverableType || "document",
              guide: s.guide || "",
              resources:
                s.resources?.map((r: any) => ({
                  id: r.id,
                  title: r.title,
                  type: r.type,
                  url: r.url,
                })) || [],
              rubric:
                s.rubrics?.map((r: any) => ({
                  id: r.id,
                  criterion: r.criteria,
                  description: r.description,
                  weight: r.weight,
                })) || [],
              templates:
                s.templates?.map((t: any) => ({
                  id: t.id,
                  name: t.name,
                  content: t.content,
                })) || [],
              completedAt: null,
            })) as Session[],
            joinCode: apiProject.joinCode || "",
            createdAt: apiProject.createdAt,
            completedAt: null,
            isWaiting: result.isWaiting,
          };
          setProject(transformedProject);
          
          // Set the current session only on initial load, not on poll refreshes
          // (polling resets would wipe in-progress editor content)
          if (!hasLoadedOnce.current) {
            const initialSessionIndex = findCurrentSessionIndex(transformedProject.sessions);
            setCurrentSession(initialSessionIndex);
          }

          // Store user team info and detect removal
          if (result.userTeam) {
            hadTeamRef.current = true;
            setUserTeam(prev => {
              const incoming = { id: result.userTeam.id, name: result.userTeam.name };
              if (prev?.id === incoming.id && prev?.name === incoming.name) return prev;
              return incoming;
            });
          } else if (hadTeamRef.current && !result.isWaiting) {
            // User previously had a team but now doesn't and isn't waiting
            // → they were removed by the creator
            setShowRemovedModal(true);
          }
        } else if (result.error === "removed") {
          setShowRemovedModal(true);
        } else {
          setError(result.error || "Failed to load project");
        }
      } catch (err) {
        console.error("Failed to fetch project:", err);
        setError("Failed to load project");
      } finally {
        setIsLoading(false);
        hasLoadedOnce.current = true;
      }
    }

    fetchProject();
  }, [projectId, currentUser, refreshKey]);

  // Handle auto-allocation when project starts
  useEffect(() => {
    if (project?.isWaiting && !userTeam && !isAllocating) {
      const now = new Date();
      const start = project.startDate ? new Date(project.startDate) : null;

      // Only allocate if start time has passed
      if (start && start <= now) {
        setIsAllocating(true);
        allocateTeams({ data: { projectId } })
          .then(() => {
            setTimeout(() => {
              setRefreshKey((k) => k + 1);
              setIsAllocating(false);
            }, 2000);
          })
          .catch(() => setIsAllocating(false));
      }
    }
  }, [project, userTeam, isAllocating, projectId]);

  // Poll for project updates to detect status changes (start/end date edits, team allocation, etc.)
  useEffect(() => {
    if (!project || !currentUser) return;
    
    const isInWaitingState = project.startDate && new Date(project.startDate) > new Date();
    const isWaitingForTeam = project.isWaiting && !userTeam;

    // Poll frequently when waiting for status change, slower when active
    const interval = (isInWaitingState || isWaitingForTeam) ? 5000 : 30000;

    const pollInterval = setInterval(() => {
      setRefreshKey((k) => k + 1);
    }, interval);

    return () => clearInterval(pollInterval);
  }, [project, userTeam, currentUser]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !project) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            {error === "Project not found"
              ? "Project not found"
              : "Unable to load project"}
          </h2>
          <p className="text-muted-foreground mb-4">
            {error ||
              "The project you're looking for doesn't exist or you don't have access."}
          </p>
          <Button onClick={() => navigate({ to: "/explorer" })}>
            Back to Explorer
          </Button>
        </div>
      </div>
    );
  }

  // Show countdown if scheduled
  if (project.startDate && new Date(project.startDate) > new Date()) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background">
        <div className="border-b bg-card">
          <div className="max-w-[1600px] mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: "/explorer" })}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-lg font-semibold">{project.name}</h1>
                <p className="text-sm text-muted-foreground">
                  By {project.creatorName}
                </p>
              </div>
            </div>
          </div>
        </div>
        <ProjectCountdown
          startDate={project.startDate}
          onComplete={() => setRefreshKey((k) => k + 1)}
        />
      </div>
    );
  }

  // Show waiting screen if waiting for team
  if (project.isWaiting && !userTeam) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background">
        <div className="border-b bg-card">
          <div className="max-w-[1600px] mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: "/explorer" })}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-lg font-semibold">{project.name}</h1>
                <p className="text-sm text-muted-foreground">
                  By {project.creatorName}
                </p>
              </div>
            </div>
          </div>
        </div>
        <WaitingScreen />
      </div>
    );
  }

  const currentSession =
    project.sessions[currentSessionIndex] || project.sessions[0];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      {/* Project Header */}
      <div className="border-b bg-card">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: "/explorer" })}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-lg font-semibold">{project.name}</h1>
              <p className="text-sm text-muted-foreground">
                By {project.creatorName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Voyage Navigator & Guide */}
          <div className="col-span-12 xl:col-span-3 space-y-6">
            <VoyageNavigator project={project} />
            {currentSession && <ResourcdHub session={currentSession} />}
          </div>

          {/* Center Column - Smart Output Builder */}
          <div className="col-span-12 xl:col-span-6 h-[calc(100vh-14rem)]">
            {currentSession && (
              <SmartOutputBuilder
                project={project}
                session={currentSession}
                teamId={userTeam?.id}
                userName={currentUser?.name}
              />
            )}
          </div>

          {/* Right Column - Timer, Actions & Group Chat */}
          <div className="col-span-12 xl:col-span-3 space-y-6">
            {currentSession?.endDate && (
              <SessionCountdown
                endDate={currentSession.endDate}
                onSessionEnd={() => {
                  // Show appropriate modal based on whether there's a next session
                  if (currentSessionIndex < project.sessions.length - 1) {
                    setShowNextSessionModal(true);
                  } else {
                    // Last session ended - show project ended modal
                    setShowProjectEndedModal(true);
                  }
                }}
              />
            )}
            {userTeam && (
              <GroupChatPanel
                key={`${projectId}-${userTeam.id}`}
                projectId={projectId}
                teamId={userTeam.id}
                teamName={userTeam.name}
              />
            )}
          </div>
        </div>

        <Dialog open={isSmartOutputOpen} onOpenChange={setIsSmartOutputOpen}>
          {isSmartOutputOpen && (
            <DialogContent
              className="max-w-5xl h-[85vh] flex flex-col"
              overlayClassName="backdrop-blur-sm"
              showCloseButton={false}
            >
              <DialogHeader className="flex flex-row items-center justify-between">
                <DialogTitle className="text-sm">Smart Output Builder</DialogTitle>
                <DialogClose asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <X className="h-4 w-4" />
                  </Button>
                </DialogClose>
              </DialogHeader>
              <div className="flex-1 min-h-0">
                {currentSession && (
                  <SmartOutputBuilder
                    project={project}
                    session={currentSession}
                    teamId={userTeam?.id}
                    userName={currentUser?.name}
                  />
                )}
              </div>
            </DialogContent>
          )}
        </Dialog>
      </div>

      {/* Next Session Modal */}
      <Dialog open={showNextSessionModal} onOpenChange={setShowNextSessionModal}>
        <DialogContent 
          className="sm:max-w-md"
          overlayClassName="backdrop-blur-sm"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>Session Complete!</span>
            </DialogTitle>
            <DialogDescription>
              The current session "{currentSession?.title}" has ended.
              {currentSessionIndex < project.sessions.length - 1 && (
                <span className="block mt-2">
                  Ready to move on to the next session:{" "}
                  <span className="font-medium text-foreground">
                    "{project.sessions[currentSessionIndex + 1]?.title}"
                  </span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setShowNextSessionModal(false)}
            >
              Stay Here
            </Button>
            <Button
              onClick={() => {
                setCurrentSession(currentSessionIndex + 1);
                setShowNextSessionModal(false);
              }}
              className="gap-2"
            >
              Go to Next Session
              <ArrowRight className="w-4 h-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Ended Modal */}
      <Dialog open={showProjectEndedModal} onOpenChange={setShowProjectEndedModal}>
        <DialogContent 
          className="sm:max-w-md"
          overlayClassName="backdrop-blur-sm"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>Project Complete!</span>
            </DialogTitle>
            <DialogDescription>
              Congratulations! You have completed all sessions in "{project.name}".
              <span className="block mt-2 text-muted-foreground">
                You can still make late submissions or review your work.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setShowProjectEndedModal(false)}
            >
              Stay Here
            </Button>
            <Button
              onClick={() => {
                setShowProjectEndedModal(false);
                navigate({ to: "/explorer" });
              }}
              className="gap-2"
            >
              Back to Explorer
              <ArrowRight className="w-4 h-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Removed from Project Modal */}
      <Dialog open={showRemovedModal} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          overlayClassName="backdrop-blur-md"
          showCloseButton={false}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                <UserMinus className="w-7 h-7 text-destructive" />
              </div>
              <DialogTitle>Removed from Project</DialogTitle>
              <DialogDescription>
                You have been removed from "{project.name}" by the creator.
                You no longer have access to this project.
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              onClick={() => navigate({ to: "/explorer" })}
              className="gap-2"
            >
              Back to Explorer
              <ArrowRight className="w-4 h-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
