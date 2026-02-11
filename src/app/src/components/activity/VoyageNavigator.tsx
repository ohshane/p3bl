import { useState, useEffect } from 'react'
import { CheckCircle, Circle, Clock, Play, Lock, Maximize2, X } from 'lucide-react'
import { useActivityStore } from '@/stores/activityStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn, safeFormatDate, isValidDate } from '@/lib/utils'
import { isPast, isFuture } from 'date-fns'
import type { Project, Session } from '@/types'

interface VoyageNavigatorProps {
  project: Project
}

export function VoyageNavigator({ project }: VoyageNavigatorProps) {
  const { currentSessionIndex, setCurrentSession } = useActivityStore()
  const [, setTick] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)

  const sessions = project.sessions

  // Force re-render every second to check if sessions should be unlocked
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Find the current session based on time
  // Current session = first session whose endDate has not passed yet
  // If all sessions' endDates have passed, current = last session
  const findCurrentSessionByTime = (): number => {
    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i]
      if (!isValidDate(session.endDate)) continue
      const endDate = new Date(session.endDate)
      if (isFuture(endDate)) {
        return i
      }
    }
    // All endDates have passed, return last session
    return sessions.length - 1
  }

  const activeSessionIndex = findCurrentSessionByTime()

  const getSessionStatus = (session: Session, index: number) => {
    if (session.completedAt) return 'completed'
    if (!isValidDate(session.endDate)) return 'active'
    const endDate = new Date(session.endDate)
    // Future session (after current active session)
    if (index > activeSessionIndex) return 'locked'
    // Past session with endDate passed (late submission still allowed)
    if (isPast(endDate)) return 'expired'
    // Current active session
    if (index === activeSessionIndex) return 'active'
    return 'active'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'expired':
        return <Clock className="w-4 h-4 text-amber-500" />
      case 'active':
        return <Play className="w-4 h-4 text-cyan-500" />
      case 'locked':
        return <Lock className="w-4 h-4 text-muted-foreground" />
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />
    }
  }

  const renderSessionList = (inModal = false) => (
    <ScrollArea className={inModal ? "h-[60vh]" : "h-[200px]"}>
      <div className="space-y-1">
        {sessions.map((session, index) => {
          const status = getSessionStatus(session, index)
          const isCurrent = index === currentSessionIndex
          // Session is locked if it's after the active session (future session)
          const isLocked = index > activeSessionIndex

          return (
            <button
              key={session.id}
              onClick={() => !isLocked && setCurrentSession(index)}
              disabled={isLocked}
              className={cn(
                'w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors',
                isLocked 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-muted/50',
                isCurrent && 'bg-cyan-500/10 border border-cyan-500/30'
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                isLocked ? "bg-muted/50" : "bg-muted"
              )}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm font-medium truncate',
                  isCurrent && 'text-cyan-400',
                  isLocked && 'text-muted-foreground'
                )}>
                  {session.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {safeFormatDate(session.startDate, 'MMM d HH:mm')}
                </p>
              </div>
              {getStatusIcon(status)}
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Voyage Navigator</CardTitle>
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
          {renderSessionList(false)}
        </CardContent>
      </Card>

      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent
          className="max-w-4xl"
          overlayClassName="backdrop-blur-sm"
          showCloseButton={false}
        >
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>Voyage Navigator</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogHeader>
          {renderSessionList(true)}
        </DialogContent>
      </Dialog>
    </>
  )
}
