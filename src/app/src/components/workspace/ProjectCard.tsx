import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { Bell, Clock, Users, User, Calendar, Info, BookOpen, FileText } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getProjectTimeStatus, safeFormatDate, getProjectProgress, getProjectTimeInfo } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { formatDistanceToNow } from 'date-fns'
import type { UserProject } from '@/stores/projectStore'
import type { ProjectStatus } from '@/types'

interface ProjectCardProps {
  project: UserProject
}

const statusBadge: Record<ProjectStatus, { label: string; className: string }> = {
  scheduled: { label: 'Scheduled', className: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
  opened: { label: 'Opened', className: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30' },
  closed: { label: 'Closed', className: 'bg-green-500/10 text-green-500 border-green-500/30' },
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  const s = statusBadge[status]
  return (
    <Badge variant="outline" className={`text-[10px] uppercase font-bold py-0 h-5 px-2 ${s.className}`}>
      {s.label}
    </Badge>
  )
}

function formatSessionLength(startDate?: string | null, endDate?: string | null) {
  if (!startDate || !endDate) return null

  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()

  if (isNaN(start) || isNaN(end) || end <= start) return null

  const diffMs = end - start
  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    const remainingHours = hours % 24
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
  }

  if (hours > 0) {
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  if (minutes > 0) return `${minutes}m`

  return `${seconds}s`
}

function ProjectDetailModal({ project, open, onOpenChange }: { project: UserProject; open: boolean; onOpenChange: (open: boolean) => void }) {
  const status = getProjectTimeStatus(project.startDate, project.endDate)
  const progress = getProjectProgress(project.startDate, project.endDate)
  const timeInfo = getProjectTimeInfo(project.startDate, project.endDate)
  const isIndividual = project.teamSize === 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg max-h-[85vh] flex flex-col"
        overlayClassName="backdrop-blur-sm"
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
          </div>
          <DialogTitle className="text-xl">{project.title}</DialogTitle>
          <p className="text-sm text-muted-foreground">By {project.creatorName}</p>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-5 pb-2">
            {/* Description */}
            {project.description && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Description
                </h4>
                <p className="text-sm text-foreground">{project.description}</p>
              </div>
            )}

            {/* Timeline */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Timeline
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                  <div className="text-[10px] text-muted-foreground uppercase">Start</div>
                  <div className="text-sm font-medium text-foreground">
                    {safeFormatDate(project.startDate, 'MMM d, yyyy HH:mm', 'Not set')}
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                  <div className="text-[10px] text-muted-foreground uppercase">End</div>
                  <div className="text-sm font-medium text-foreground">
                    {safeFormatDate(project.endDate, 'MMM d, yyyy HH:mm', 'Not set')}
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>{timeInfo.elapsed} elapsed</span>
                  <span>{timeInfo.remaining} left</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            </div>

            {/* Info */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Details
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                  <div className="text-[10px] text-muted-foreground uppercase">Type</div>
                  <div className="text-sm font-medium text-foreground">{isIndividual ? 'Individual' : 'Group'}</div>
                </div>
                {!isIndividual && (
                  <>
                    <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                      <div className="text-[10px] text-muted-foreground uppercase">Team</div>
                      <div className="text-sm font-medium text-foreground truncate">{project.teamName || 'Unassigned'}</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                      <div className="text-[10px] text-muted-foreground uppercase">Team Size</div>
                      <div className="text-sm font-medium text-foreground">{project.teamSize}</div>
                    </div>
                  </>
                )}
                <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                  <div className="text-[10px] text-muted-foreground uppercase">Joined</div>
                  <div className="text-sm font-medium text-foreground">
                    {safeFormatDate(project.joinedAt, 'MMM d, yyyy', '?')}
                  </div>
                </div>
              </div>
            </div>

            {/* Sessions */}
            {project.sessions && project.sessions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Sessions ({project.sessions.length})
                </h4>
                <div className="space-y-1.5">
                  {project.sessions.map((session, index) => (
                    <div key={session.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 border border-border">
                      <span className="flex items-center justify-center w-6 h-6 bg-cyan-600/20 text-cyan-500 text-xs font-semibold rounded shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{session.title}</div>
                        {(session.startDate || session.endDate) && (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {safeFormatDate(session.startDate, 'MMM d HH:mm', 'TBD')} - {safeFormatDate(session.endDate, 'MMM d HH:mm', 'TBD')}{
                              (() => {
                                const length = formatSessionLength(session.startDate, session.endDate)
                                return length ? ` (${length})` : ''
                              })()
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
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
    <>
      <Card className="bg-card border-border transition-all">
        <CardHeader className="pb-3">
          {/* Top row: Status badge and action icons */}
          <div className="flex items-center justify-between mb-2">
            <StatusBadge status={status} />
            
            {/* Right: Info and Notification icons */}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDetailOpen(true)}
                className="h-8 w-8 text-muted-foreground hover:text-cyan-500 hover:bg-cyan-500/10"
              >
                <Info className="w-4 h-4" />
              </Button>
              {notificationCount > 0 && (
                <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted relative"
                    >
                      <Bell className="w-4 h-4" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>
                    </Button>
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
            </div>
          </div>
          
          {/* Title and description - full width */}
          <Link to="/explorer/project/$projectId" params={{ projectId: project.id }}>
            <h3 className="text-lg font-semibold text-foreground line-clamp-1 hover:text-cyan-500 transition-colors cursor-pointer w-full">
              {project.title}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground line-clamp-1 mt-1 w-full">
            By {project.creatorName}
          </p>
        </CardHeader>

        <CardContent>
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
          <div className="mt-5 mb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>{timeInfo.elapsed} elapsed</span>
              <span>{timeInfo.remaining} left</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <ProjectDetailModal
        project={project}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </>
  )
}
