import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { ArrowLeft, Eye, AlertTriangle, Activity, ClipboardCheck } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useCreatorStore } from '@/stores/creatorStore'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LiveMatrix } from '@/components/creator/monitoring/LiveMatrix'
import { DipChart } from '@/components/creator/DipChart'
import { SignalRiskCenter } from '@/components/creator/monitoring/SignalRiskCenter'
import { AssessmentPanel } from '@/components/creator/monitoring/AssessmentPanel'

export const Route = createFileRoute('/creator/project/$projectId/monitor')({
  component: MonitoringPage,
})

function MonitoringPage() {
  const navigate = useNavigate()
  const { projectId } = Route.useParams()
  const { isAuthenticated, currentUser } = useAuthStore()
  const { getProject } = useCreatorStore()

  const project = getProject(projectId)

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

  const teamsAtRisk = project.teams.filter(t => t.riskLevel === 'red' || t.riskLevel === 'yellow')

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4">
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
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Eye className="w-8 h-8 text-cyan-500" />
                {project.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                Monitoring & Assessment
              </p>
            </div>
            <div className="flex items-center gap-4">
              {teamsAtRisk.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-500">
                    {teamsAtRisk.length} team(s) at risk
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-foreground">{project.teams.length}</div>
            <div className="text-sm text-muted-foreground">Active Teams</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-foreground">
              {project.teams.reduce((sum, t) => sum + t.memberIds.length, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Learners</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-foreground">
              {project.sessions.findIndex(s => !s.endDate || new Date(s.endDate) > new Date()) + 1} / {project.sessions.length}
            </div>
            <div className="text-sm text-muted-foreground">Current Session</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className={`text-2xl font-bold ${
              project.riskLevel === 'green' ? 'text-green-500' :
              project.riskLevel === 'yellow' ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {project.riskLevel === 'green' ? 'Healthy' :
               project.riskLevel === 'yellow' ? 'Attention' : 'At Risk'}
            </div>
            <div className="text-sm text-muted-foreground">Project Health</div>
          </div>
        </div>

        {/* Dip Chart */}
        <div className="mb-8">
          <DipChart projectId={project.id} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="matrix">
          <TabsList className="bg-muted border border-border mb-6">
            <TabsTrigger value="matrix" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
              <Activity className="w-4 h-4 mr-2" />
              Live Matrix
            </TabsTrigger>
            <TabsTrigger value="risk" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Signal & Risk
            </TabsTrigger>
            <TabsTrigger value="assessment" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Assessment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matrix">
            <LiveMatrix projectId={project.id} />
          </TabsContent>

          <TabsContent value="risk">
            <SignalRiskCenter projectId={project.id} />
          </TabsContent>

          <TabsContent value="assessment">
            <AssessmentPanel projectId={project.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
