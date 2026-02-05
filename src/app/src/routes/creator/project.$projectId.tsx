import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  FileText,
  Calendar,
  Users,
  Copy,
  QrCode,
  Clock,
  BookOpen,
  Bot,
  UserCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { useCreatorStore } from '@/stores/creatorStore'
import { safeFormatDate, getProjectTimeStatus } from '@/lib/utils'
import type { CreatorProjectStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

export const Route = createFileRoute('/creator/project/$projectId')({
  component: ProjectDetailsPage,
})

function ProjectDetailsPage() {
  const navigate = useNavigate()
  const { projectId } = Route.useParams()
  const { isAuthenticated, currentUser } = useAuthStore()
  const { getProject } = useCreatorStore()
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())

  const project = getProject(projectId)

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

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/' })
    }
  }, [isAuthenticated, navigate])

  // Check if user is a creator
  useEffect(() => {
    if (currentUser && currentUser.role !== 'creator' && currentUser.role !== 'pioneer') {
      navigate({ to: '/explorer' })
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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(project.joinCode)
    toast.success('Join code copied to clipboard')
  }

  const totalLearners = project.teams.reduce((sum, t) => sum + t.memberIds.length, 0)
  const maxTeams = Math.ceil(project.totalParticipants / project.teamSize)

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate({ to: '/creator' })}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
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
          {/* Overview Card */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

          {/* Join Code & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Join Code Card */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-cyan-500" />
                  Join Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between border border-border">
                  <div className="font-mono text-2xl font-bold text-cyan-500">
                    {project.joinCode}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyCode}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-500" />
                  Participation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-3 border border-border">
                    <div className="text-2xl font-bold text-foreground">{totalLearners}</div>
                    <div className="text-sm text-muted-foreground">Total Learners</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 border border-border">
                    <div className="text-2xl font-bold text-foreground">{project.teams.length} / {maxTeams}</div>
                    <div className="text-sm text-muted-foreground">Teams</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 border border-border">
                    <div className="text-2xl font-bold text-foreground">{project.teamSize}</div>
                    <div className="text-sm text-muted-foreground">Team Size</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 border border-border">
                    <div className="text-2xl font-bold text-foreground capitalize">{project.teamFormationMode}</div>
                    <div className="text-sm text-muted-foreground">Formation</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
                          <div>
                            <span className="text-sm text-muted-foreground">Topic: </span>
                            <span>{session.topic || 'Not specified'}</span>
                          </div>
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

          {/* AI & Experts Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <UserCircle className="w-5 h-5 text-cyan-500" />
                  Experts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {project.expertIds.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No experts assigned</p>
                ) : (
                  <div className="text-foreground">
                    {project.expertIds.length} expert{project.expertIds.length !== 1 ? 's' : ''} assigned
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
