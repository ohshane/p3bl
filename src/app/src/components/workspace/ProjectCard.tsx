import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { Bell, Clock, Users, User, Calendar } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn, getProjectTimeStatus, safeFormatDate, getProjectProgress, getProjectTimeInfo } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { formatDistanceToNow } from 'date-fns'
import type { UserProject } from '@/stores/projectStore'
import type { ProjectStatus } from '@/types'

interface ProjectCardProps {
  project: UserProject
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [, setTick] = useState(0)
  const { notifications, markNotificationRead } = useAuthStore()

  // Force re-render every second to update progress and time info
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Get notifications for this project
  const projectNotifications = notifications.filter(
    n => n.projectId === project.id && !n.read
  )
  const notificationCount = projectNotifications.length

  // Calculate time-based status (recalculated every second)
  const status: ProjectStatus = getProjectTimeStatus(project.startDate, project.endDate)
  const progress = getProjectProgress(project.startDate, project.endDate)
  const timeInfo = getProjectTimeInfo(project.startDate, project.endDate)
  const isIndividual = project.teamSize === 1

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all hover:border-cyan-500/50',
        status === 'closed' && 'opacity-75'
      )}
    >
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
        <CardContent className="pt-3 px-5 pb-5">
          {/* Status Badge */}
          <div className="flex items-center gap-2 mb-3">
            {status === 'scheduled' && (
              <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 h-5 px-2 bg-amber-500/10 text-amber-500 border-amber-500/30">
                Scheduled
              </Badge>
            )}
            {status === 'opened' && (
              <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 h-5 px-2 bg-cyan-500/10 text-cyan-500 border-cyan-500/30">
                Opened
              </Badge>
            )}
            {status === 'closed' && (
              <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 h-5 px-2 bg-green-500/10 text-green-500 border-green-500/30">
                Closed
              </Badge>
            )}
          </div>

          {/* Project Name */}
          <h3 className="font-semibold text-lg text-foreground mb-1 pr-8 truncate">
            {project.title}
          </h3>
          
          {/* Creator */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-1">
            By {project.creatorName}
          </p>

          {/* Project Info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-2">
                {isIndividual ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Users className="w-4 h-4" />
                )}
                Type
              </span>
              <span className="text-foreground">
                {isIndividual ? 'Individual' : 'Group'}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Sessions
              </span>
              <span className="text-foreground">{project.sessionCount} sessions</span>
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
        </CardContent>
      </Link>
    </Card>
  )
}
