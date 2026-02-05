import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Star, Bell, Clock, Users, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn, getProjectTimeStatus } from '@/lib/utils'
import { formatDistanceToNow, differenceInDays } from 'date-fns'
import type { UserProject } from '@/stores/projectStore'
import type { ProjectStatus } from '@/types'

interface ProjectCardProps {
  project: UserProject
  isCurrent: boolean
}

export function ProjectCard({ project, isCurrent }: ProjectCardProps) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const { notifications, markNotificationRead } = useAuthStore()

  // Get notifications for this project
  const projectNotifications = notifications.filter(
    n => n.projectId === project.id && !n.read
  )
  const notificationCount = projectNotifications.length

  // Calculate progress based on sessions (if we have sessionCount)
  // For now, assume session 1 of N if we have a currentSessionId
  const currentSessionNum = project.currentSessionId ? 1 : 0 // We'd need more data to determine exact session number
  const progressPercent = project.sessionCount > 0 
    ? (currentSessionNum / project.sessionCount) * 100 
    : 0

  // Calculate time-based status
  const status: ProjectStatus = getProjectTimeStatus(project.startDate, project.endDate)

  // Due date calculations (if project has an end date)
  const dueDate = project.endDate ? new Date(project.endDate) : null
  const daysUntilDue = dueDate ? differenceInDays(dueDate, new Date()) : null

  const getDueDateText = () => {
    if (!dueDate || daysUntilDue === null) return null
    if (daysUntilDue < 0) return 'Overdue'
    if (daysUntilDue === 0) return 'Due today'
    if (daysUntilDue === 1) return 'Due tomorrow'
    if (daysUntilDue < 7) return `Due in ${daysUntilDue} days`
    return formatDistanceToNow(dueDate, { addSuffix: true })
  }

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all hover:border-cyan-500/50',
        isCurrent && 'border-cyan-500/50 bg-cyan-500/5',
        status === 'closed' && 'opacity-75'
      )}
    >
      {/* Current indicator */}
      {isCurrent && (
        <div className="absolute top-3 right-3">
          <Star className="w-5 h-5 text-cyan-400 fill-cyan-400" />
        </div>
      )}

      {/* Notification badge */}
      {notificationCount > 0 && (
        <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
          <PopoverTrigger asChild>
            <button
              className="absolute top-3 right-3 z-10"
              onClick={(e) => e.preventDefault()}
            >
              <div className="relative">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="end">
            <div className="flex items-center justify-between p-3 border-b">
              <span className="text-sm font-medium">Notifications ({notificationCount})</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-auto py-1"
                onClick={() => {
                  projectNotifications.forEach(n => markNotificationRead(n.id))
                  setIsNotificationOpen(false)
                }}
              >
                Clear
              </Button>
            </div>
            <ScrollArea className="max-h-[200px]">
              {projectNotifications.map(notification => (
                <div
                  key={notification.id}
                  className="p-3 border-b last:border-0 hover:bg-muted/50 cursor-pointer"
                  onClick={() => {
                    markNotificationRead(notification.id)
                  }}
                >
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      )}

      <Link to="/explorer/project/$projectId" params={{ projectId: project.id }}>
        <CardContent className="p-5">
          {/* Project Name */}
          <h3 className="font-semibold text-lg text-foreground mb-1 pr-8">
            {project.title}
          </h3>
          
          {/* Creator */}
          <p className="text-sm text-muted-foreground mb-3">
            By {project.creatorName}
          </p>

          {/* Session Progress */}
          <div className="flex items-center gap-2 mb-3">
            {status === 'closed' ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                <CheckCircle className="w-3 h-3 mr-1" />
                Closed
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">
                {project.sessionCount} session{project.sessionCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Footer Info */}
          <div className="flex items-center justify-between text-sm">
            {/* Due Date */}
            {status === 'opened' && dueDate && (
              <div
                className={cn(
                  'flex items-center gap-1',
                  daysUntilDue !== null && daysUntilDue < 0 ? 'text-red-500' : 'text-muted-foreground'
                )}
              >
                <Clock className="w-4 h-4" />
                <span>{getDueDateText()}</span>
              </div>
            )}

            {/* Team */}
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{project.teamName}</span>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
