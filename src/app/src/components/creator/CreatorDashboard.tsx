import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Plus, LayoutDashboard, Calendar, PlayCircle, CheckCircle2, Loader2, List } from 'lucide-react'
import { useCreatorStore } from '@/stores/creatorStore'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreatorProjectCard } from './CreatorProjectCard'
import { EmptyDashboard } from './EmptyDashboard'

type DashboardTab = 'all' | 'scheduled' | 'opened' | 'closed'

export function CreatorDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<DashboardTab>('all')
  const { currentUser } = useAuthStore()
  
  const {
    getAllProjects,
    getScheduledProjects,
    getOpenedProjects,
    getClosedProjects,
    fetchProjects,
    isLoading,
    error,
    clearError,
  } = useCreatorStore()

  // Fetch projects on mount
  useEffect(() => {
    if (currentUser?.id) {
      fetchProjects(currentUser.id)
    }
  }, [currentUser?.id, fetchProjects])

  const allProjects = getAllProjects()
  const scheduledProjects = getScheduledProjects()
  const openedProjects = getOpenedProjects()
  const closedProjects = getClosedProjects()
  
  const hasProjects = allProjects.length > 0

  const handleCreateProject = () => {
    navigate({ to: '/creator/project/new' })
  }

  const getCurrentTabProjects = () => {
    switch (activeTab) {
      case 'all':
        return allProjects
      case 'scheduled':
        return scheduledProjects
      case 'opened':
        return openedProjects
      case 'closed':
        return closedProjects
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your projects...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => { clearError(); currentUser?.id && fetchProjects(currentUser.id) }}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!hasProjects) {
    return <EmptyDashboard onCreateProject={handleCreateProject} />
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-cyan-500" />
            Project Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your projects, monitor progress, and assess learners
          </p>
        </div>
        <Button
          onClick={handleCreateProject}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{allProjects.length}</div>
          <div className="text-sm text-muted-foreground">Total Projects</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{scheduledProjects.length}</div>
          <div className="text-sm text-muted-foreground">Scheduled</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{openedProjects.length}</div>
          <div className="text-sm text-muted-foreground">Opened</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{closedProjects.length}</div>
          <div className="text-sm text-muted-foreground">Closed</div>
        </div>
      </div>

      {/* Project Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DashboardTab)}>
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="all" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
            <List className="w-4 h-4 mr-2" />
            All ({allProjects.length})
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
            <Calendar className="w-4 h-4 mr-2" />
            Scheduled ({scheduledProjects.length})
          </TabsTrigger>
          <TabsTrigger value="opened" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
            <PlayCircle className="w-4 h-4 mr-2" />
            Opened ({openedProjects.length})
          </TabsTrigger>
          <TabsTrigger value="closed" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Closed ({closedProjects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {getCurrentTabProjects().length === 0 ? (
            <div className="text-center py-12 bg-muted/40 rounded-lg border border-border">
              <p className="text-muted-foreground">
                {activeTab === 'all' && 'No projects yet. Create a new project to get started.'}
                {activeTab === 'scheduled' && 'No scheduled projects. Projects with future start dates will appear here.'}
                {activeTab === 'opened' && 'No opened projects. Projects that have started will appear here.'}
                {activeTab === 'closed' && 'No closed projects yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getCurrentTabProjects().map((project) => (
                <CreatorProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
