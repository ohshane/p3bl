import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  User,
  Users,
  Calendar,
  Clock,
  Trash2,
  Eye,
  Pencil,
  Play,
} from 'lucide-react'
import { toast } from 'sonner'

import type { CreatorProject, CreatorProjectStatus } from '@/types'
import { useCreatorStore } from '@/stores/creatorStore'
import { updateProject } from '@/server/api/projects'
import { updateSession } from '@/server/api/sessions'
import { safeFormatDate, getProjectTimeStatus, getProjectProgress, getProjectTimeInfo } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { JoinCode } from '@/components/creator/JoinCode'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CreatorProjectCardProps {
  project: CreatorProject
}

export function CreatorProjectCard({ project }: CreatorProjectCardProps) {
  const navigate = useNavigate()
  const { deleteProject, fetchProjects } = useCreatorStore()
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [, setTick] = useState(0)

  // Force re-render every second to update progress and time info
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Calculate status from dates (recalculated every second)
  const status: CreatorProjectStatus = getProjectTimeStatus(project.startDate, project.endDate)
  const progress = getProjectProgress(project.startDate, project.endDate)
  const timeInfo = getProjectTimeInfo(project.startDate, project.endDate)

  const statusColors: Record<CreatorProjectStatus, string> = {
    scheduled: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    opened: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30',
    closed: 'bg-green-500/10 text-green-500 border-green-500/30',
  }

  const statusLabels: Record<CreatorProjectStatus, string> = {
    scheduled: 'Scheduled',
    opened: 'Opened',
    closed: 'Closed',
  }

  const handleDelete = async () => {
    const success = await deleteProject(project.id)
    setShowDeleteDialog(false)
    if (success) {
      toast.success('Project deleted')
    } else {
      toast.error('Failed to delete project')
    }
  }

  const handleMonitor = () => {
    navigate({ to: '/creator/project/$projectId/monitor', params: { projectId: project.id } })
  }

  const handleStartNow = async () => {
    setIsStarting(true)
    try {
      const now = new Date()
      const updates: { startDate: string; endDate?: string } = {
        startDate: now.toISOString(),
      }
      
      // Calculate time shift amount
      let timeShift = 0
      if (project.startDate) {
        const originalStart = new Date(project.startDate)
        timeShift = now.getTime() - originalStart.getTime()
        
        // If there's an original endDate, shift it by the same amount
        if (project.endDate) {
          const originalEnd = new Date(project.endDate)
          const newEndDate = new Date(originalEnd.getTime() + timeShift)
          updates.endDate = newEndDate.toISOString()
        }
      }
      
      const result = await updateProject({
        data: {
          projectId: project.id,
          updates,
        },
      })
      
      if (result.success) {
        // Shift all session times by the same amount
        if (timeShift !== 0 && project.sessions.length > 0) {
          await Promise.all(
            project.sessions.map(async (session) => {
              const sessionUpdates: { startDate?: string; endDate?: string } = {}
              
              if (session.startDate) {
                const newStartDate = new Date(new Date(session.startDate).getTime() + timeShift)
                sessionUpdates.startDate = newStartDate.toISOString()
              }
              
              if (session.endDate) {
                const newEndDate = new Date(new Date(session.endDate).getTime() + timeShift)
                sessionUpdates.endDate = newEndDate.toISOString()
              }
              
              if (Object.keys(sessionUpdates).length > 0) {
                await updateSession({
                  data: {
                    sessionId: session.id,
                    updates: sessionUpdates,
                  },
                })
              }
            })
          )
        }
        
        toast.success('Project started!')
        await fetchProjects(project.creatorId)
      } else {
        toast.error('Failed to start project')
      }
    } catch (error) {
      toast.error('Failed to start project')
    } finally {
      setIsStarting(false)
    }
  }

  const handleViewDetails = () => {
    navigate({ to: '/creator/project/$projectId', params: { projectId: project.id } })
  }

  const teamsWithRisk = project.teams.filter(t => t.riskLevel === 'red' || t.riskLevel === 'yellow')

  return (
    <>
      <Card className="bg-card border-border transition-all">
        <CardHeader className="pb-3">
          {/* Top row: Status badge and action icons */}
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className={`text-[10px] uppercase font-bold py-0 h-5 px-2 ${statusColors[status]}`}>
              {statusLabels[status]}
            </Badge>
            
            {/* Right: Edit and Delete icons */}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleViewDetails}
                className="h-8 w-8 text-muted-foreground hover:text-cyan-500 hover:bg-cyan-500/10"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
                className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Title and description - full width */}
          <h3 
            className="text-lg font-semibold text-foreground line-clamp-1 hover:text-cyan-500 transition-colors cursor-pointer w-full"
            onClick={handleViewDetails}
          >
            {project.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1 w-full">
            {project.description}
          </p>
        </CardHeader>

        <CardContent>
          {/* Join Code Section */}
          <div className="mb-4">
            <JoinCode
              joinCode={project.joinCode}
              projectId={project.id}
              creatorId={project.creatorId}
              projectName={project.name}
              size="sm"
            />
          </div>

          {/* Project Info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-2">
                {project.teamSize === 1 ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Users className="w-4 h-4" />
                )}
                Type
              </span>
              <span className="text-foreground">
                {project.teamSize === 1 ? 'Individual' : 'Group'}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Sessions
              </span>
              <span className="text-foreground">{project.sessions.length} sessions</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Duration
              </span>
              <span className="text-foreground">
                {safeFormatDate(project.startDate, 'MMM d HH:mm', 'TBD')} - {safeFormatDate(project.endDate, 'MMM d HH:mm', 'TBD')}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>{timeInfo.elapsed} elapsed</span>
              <span>{timeInfo.remaining} left</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Risk Warning */}
          {status === 'opened' && teamsWithRisk.length > 0 && (
            <div className="mt-4 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400">
              {teamsWithRisk.length} team(s) need attention
            </div>
          )}

          {/* Action Buttons */}
          {status === 'scheduled' && (
            <Button
              onClick={handleStartNow}
              disabled={isStarting}
              className="w-full mt-4 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/50"
            >
              <Play className="w-4 h-4 mr-2" />
              {isStarting ? 'Starting...' : 'Start Now'}
            </Button>
          )}
          {status === 'opened' && (
            <Button
              onClick={handleMonitor}
              className="w-full mt-4 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-600/50"
            >
              <Eye className="w-4 h-4 mr-2" />
              Monitor Progress
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{project.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  )
}
