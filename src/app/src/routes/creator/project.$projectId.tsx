import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  FileText,
  Calendar,
  Users,
  QrCode,
  Clock,
  BookOpen,
  Bot,
  ChevronDown,
  ChevronRight,
  Trash2,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { useCreatorStore } from '@/stores/creatorStore'
import { safeFormatDate, getProjectTimeStatus } from '@/lib/utils'
import type { CreatorProjectStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { JoinCode } from '@/components/creator/JoinCode'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export const Route = createFileRoute('/creator/project/$projectId')({
  component: ProjectDetailsPage,
})

function ProjectDetailsPage() {
  const navigate = useNavigate()
  const { projectId } = Route.useParams()
  const { isAuthenticated, currentUser } = useAuthStore()
  const { getProject, deleteProject, fetchLiveMatrix, getLiveMatrix, fetchParticipants, getParticipants } = useCreatorStore()
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  const project = getProject(projectId)
  const matrixData = getLiveMatrix(projectId)
  const participants = getParticipants(projectId)

  // Fetch matrix data (teams and members) and participants on mount
  useEffect(() => {
    if (projectId) {
      fetchLiveMatrix(projectId)
      fetchParticipants(projectId)
    }
  }, [projectId, fetchLiveMatrix, fetchParticipants])

  const toggleSession = (sessionId: string) => {
    setExpandedSessions(prev => {
      const next = new Set(prev)
      if (next.has(sessionId)) {
        next.delete(sessionId)
      } else {
        next.add(sessionId)
      }
      return next
    })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const success = await deleteProject(projectId)
      if (success) {
        toast.success('Project deleted successfully')
        navigate({ to: '/creator' })
      } else {
        toast.error('Failed to delete project')
      }
    } catch (error) {
      toast.error('An error occurred while deleting the project')
    } finally {
      setIsDeleting(false)
    }
  }

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/' })
    }
  }, [isAuthenticated, navigate])

  // Check if user is a creator or pioneer (admins should use /admin)
  useEffect(() => {
    if (currentUser && currentUser.role !== 'creator' && currentUser.role !== 'pioneer') {
      if (currentUser.role === 'admin') {
        navigate({ to: '/admin' })
      } else {
        navigate({ to: '/explorer' })
      }
    }
  }, [currentUser, navigate])

  if (!currentUser || (currentUser.role !== 'creator' && currentUser.role !== 'pioneer')) {
    return null
  }

  if (!project) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">Project Not Found</h2>
          <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist.</p>
          <Button onClick={() => navigate({ to: '/creator' })}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // Calculate time-based status
  const status: CreatorProjectStatus = getProjectTimeStatus(project.startDate, project.endDate)

  const statusColors: Record<CreatorProjectStatus, string> = {
    scheduled: 'bg-muted text-muted-foreground',
    opened: 'bg-green-600 text-green-50',
    closed: 'bg-blue-600 text-blue-50',
  }

  const statusLabels: Record<CreatorProjectStatus, string> = {
    scheduled: 'Scheduled',
    opened: 'Opened',
    closed: 'Closed',
  }

  // Use participants data for accurate explorer counting (includes waiting explorers)
  const totalExplorers = participants?.total || matrixData.flatMap(t => t.members).length

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate({ to: '/creator' })}
              className="text-muted-foreground hover:text-foreground p-0 h-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive border-destructive/20 hover:border-destructive hover:bg-destructive/10 gap-2 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Project
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the project
                    "<strong>{project.name}</strong>" and all associated data including sessions, teams, and submissions.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-white hover:bg-destructive/90 border-none"
                    disabled={isDeleting}
                  >
                    Delete Project
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <FileText className="w-8 h-8 text-cyan-500" />
                  {project.name}
                </h1>
                <Badge className={statusColors[status]}>
                  {statusLabels[status]}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">Project Details</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Timeline Card */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-500" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-lg p-3 border border-border">
                  <div className="text-sm text-muted-foreground">Start Date</div>
                  <div className="text-lg font-semibold text-foreground">
                    {safeFormatDate(project.startDate, 'MMM d, yyyy HH:mm', 'Not set')}
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 border border-border">
                  <div className="text-sm text-muted-foreground">End Date</div>
                  <div className="text-lg font-semibold text-foreground">
                    {safeFormatDate(project.endDate, 'MMM d, yyyy HH:mm', 'Not set')}
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 border border-border">
                  <div className="text-sm text-muted-foreground">Created</div>
                  <div className="text-lg font-semibold text-foreground">
                    {safeFormatDate(project.createdAt, 'MMM d, yyyy HH:mm', 'Unknown')}
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 border border-border">
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="text-lg font-semibold text-foreground capitalize">
                    {statusLabels[status]}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overview Card */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-500" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Title</h4>
                <p className="text-foreground font-medium">{project.name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                <p className="text-foreground">{project.description || 'No description provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Driving Question</h4>
                <p className="text-foreground italic">"{project.drivingQuestion || 'No driving question set'}"</p>
              </div>
            </CardContent>
          </Card>

          {/* Sessions Card */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-500" />
                Sessions ({project.sessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.sessions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No sessions configured</p>
              ) : (
                <div className="space-y-2">
                  {project.sessions.map((session, index) => (
                    <Collapsible
                      key={session.id}
                      open={expandedSessions.has(session.id)}
                      onOpenChange={() => toggleSession(session.id)}
                    >
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer">
                          {expandedSessions.has(session.id) ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="flex items-center justify-center w-6 h-6 bg-cyan-600/20 text-cyan-500 text-sm font-semibold rounded">
                            {index + 1}
                          </span>
                          <span className="text-foreground font-medium">{session.title}</span>
                          <Badge variant="outline" className="ml-auto text-xs">
                            {session.weight}% weight
                          </Badge>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="space-y-3 pl-12 pr-3 py-3 text-muted-foreground">
                          {session.topic && (
                            <div>
                              <span className="text-sm text-muted-foreground">Objective: </span>
                              <span>{session.topic}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-sm text-muted-foreground">Guide: </span>
                            <span>{session.guide || 'No guide provided'}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {safeFormatDate(session.startDate, 'MMM d HH:mm', 'TBD')} - {safeFormatDate(session.endDate, 'MMM d HH:mm', 'TBD')}
                            </span>
                            <span className="text-muted-foreground">
                              Deliverable: <span className="text-foreground capitalize">{session.deliverableType}</span>
                            </span>
                          </div>
                          {session.rubric.length > 0 && (
                            <div>
                              <span className="text-sm text-muted-foreground">Rubric Items: </span>
                              <span>{session.rubric.length} criteria</span>
                            </div>
                          )}
                          {session.resources.length > 0 && (
                            <div>
                              <span className="text-sm text-muted-foreground">Resources: </span>
                              <span>{session.resources.length} attached</span>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Join Code & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Join Code Card */}
            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-cyan-500" />
                  Join Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <JoinCode
                  joinCode={project.joinCode}
                  projectId={project.id}
                  creatorId={project.creatorId}
                  projectName={project.name}
                  size="lg"
                />
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-500" />
                  Participation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-3 border border-border">
                    <div className="text-2xl font-bold text-foreground">{totalExplorers}</div>
                    <div className="text-sm text-muted-foreground">Total Explorers</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 border border-border">
                    <div className="text-2xl font-bold text-foreground">{matrixData.length}</div>
                    <div className="text-sm text-muted-foreground">Active Teams</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 border border-border">
                    <div className="text-2xl font-bold text-foreground">{project.teamSize}</div>
                    <div className="text-sm text-muted-foreground">Team Size</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 border border-border">
                    <div className="text-2xl font-bold text-foreground capitalize">Auto</div>
                    <div className="text-sm text-muted-foreground">Formation</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Explorer Directory Card */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-500" />
                Explorer Directory
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(!participants || participants.total === 0) && matrixData.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 bg-muted/20 rounded-lg border border-dashed border-border">
                  No explorers have joined yet.
                </p>
              ) : (
                <div className="space-y-6">
                  {/* Waiting Explorers (not assigned to teams yet - for scheduled projects) */}
                  {participants && participants.waiting.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold">
                          Waiting for Team Assignment
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {participants.waiting.length} {participants.waiting.length === 1 ? 'explorer' : 'explorers'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {participants.waiting.map((explorer) => (
                          <div key={explorer.id} className="flex items-center gap-3 p-2 rounded-lg border border-amber-500/20 bg-amber-500/5">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={explorer.avatar || undefined} />
                              <AvatarFallback className="bg-amber-600 text-white text-xs">
                                {getInitials(explorer.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{explorer.name}</div>
                              <div className="text-[10px] text-muted-foreground truncate">{explorer.email}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Team-assigned Explorers */}
                  {matrixData.map((team) => (
                    <div key={team.teamId} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-cyan-500/10 text-cyan-600 border-cyan-500/20 font-bold">
                          {team.teamName}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {team.members.length} members
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {team.members.map((member) => (
                          <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-muted/30">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.avatar || undefined} />
                              <AvatarFallback className="bg-cyan-600 text-white text-xs">
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{member.name}</div>
                              <div className="text-[10px] text-muted-foreground truncate">{member.email}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Teams Card */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-500" />
                Teams ({project.teams.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.teams.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No teams formed yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {project.teams.map((team) => (
                    <div
                      key={team.id}
                      className="bg-muted/40 rounded-lg p-4 border border-border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-foreground">{team.name}</h4>
                        <Badge
                          className={
                            team.riskLevel === 'green'
                              ? 'bg-green-600/20 text-green-500 border-green-600/50'
                              : team.riskLevel === 'yellow'
                              ? 'bg-yellow-600/20 text-yellow-500 border-yellow-600/50'
                              : 'bg-red-600/20 text-red-500 border-red-600/50'
                          }
                        >
                          {team.riskLevel}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {team.memberIds.length} member{team.memberIds.length !== 1 ? 's' : ''}
                      </div>
                      {team.riskReason && (
                        <p className="text-xs text-yellow-500 mt-2">{team.riskReason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Personas Card */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-500" />
                AI Personas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.aiPersonaIds.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No AI personas assigned</p>
              ) : (
                <div className="text-foreground">
                  {project.aiPersonaIds.length} persona{project.aiPersonaIds.length !== 1 ? 's' : ''} assigned
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
