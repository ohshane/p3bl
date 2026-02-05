import { useState } from 'react'
import { ProjectCard } from './ProjectCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FolderOpen, CheckCircle, Calendar, Layers } from 'lucide-react'
import type { ProjectTab } from '@/types'
import type { UserProject } from '@/stores/projectStore'

interface ProjectListProps {
  allProjects: UserProject[]
  scheduledProjects: UserProject[]
  openedProjects: UserProject[]
  closedProjects: UserProject[]
}

export function ProjectList({ allProjects, scheduledProjects, openedProjects, closedProjects }: ProjectListProps) {
  const [activeTab, setActiveTab] = useState<ProjectTab>('all')

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">My Projects</h2>
      
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProjectTab)}>
        <TabsList className="mb-6">
          <TabsTrigger value="all" className="gap-2">
            <Layers className="w-4 h-4" />
            All
            {allProjects.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-slate-500/20 text-slate-400 rounded-full">
                {allProjects.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="gap-2">
            <Calendar className="w-4 h-4" />
            Scheduled
            {scheduledProjects.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full">
                {scheduledProjects.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="opened" className="gap-2">
            <FolderOpen className="w-4 h-4" />
            Opened
            {openedProjects.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-full">
                {openedProjects.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="closed" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            Closed
            {closedProjects.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">
                {closedProjects.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {allProjects.length === 0 ? (
            <EmptyState type="all" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isCurrent={false}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="opened">
          {openedProjects.length === 0 ? (
            <EmptyState type="opened" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {openedProjects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isCurrent={index === 0}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="scheduled">
          {scheduledProjects.length === 0 ? (
            <EmptyState type="scheduled" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scheduledProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isCurrent={false}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="closed">
          {closedProjects.length === 0 ? (
            <EmptyState type="closed" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {closedProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isCurrent={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyState({ type }: { type: 'all' | 'scheduled' | 'opened' | 'closed' }) {
  const getIcon = () => {
    switch (type) {
      case 'all':
        return <Layers className="w-6 h-6 text-muted-foreground" />
      case 'scheduled':
        return <Calendar className="w-6 h-6 text-muted-foreground" />
      case 'opened':
        return <FolderOpen className="w-6 h-6 text-muted-foreground" />
      case 'closed':
        return <CheckCircle className="w-6 h-6 text-muted-foreground" />
    }
  }

  const getMessage = () => {
    switch (type) {
      case 'all':
        return 'No projects yet. Join a project using a code from your instructor.'
      case 'scheduled':
        return 'You have no scheduled projects. Projects will appear here when they are scheduled to start.'
      case 'opened':
        return 'Join a project using a code from your instructor.'
      case 'closed':
        return 'Your closed projects will appear here.'
    }
  }

  return (
    <div className="text-center py-12 px-6 bg-muted/30 rounded-xl border border-dashed border-muted">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        {getIcon()}
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">
        No {type} projects
      </h3>
      <p className="text-sm text-muted-foreground">
        {getMessage()}
      </p>
    </div>
  )
}
