import { ChevronLeft, ChevronRight, CheckCircle, Circle, Clock, Play } from 'lucide-react'
import { useActivityStore } from '@/stores/activityStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn, safeFormatDate, isValidDate } from '@/lib/utils'
import { isPast } from 'date-fns'
import type { Project, Session, VoyagePanel } from '@/types'

interface VoyageNavigatorProps {
  project: Project
}

export function VoyageNavigator({ project }: VoyageNavigatorProps) {
  const { currentSessionIndex, setCurrentSession, expandedPanel, setExpandedPanel } = useActivityStore()

  const sessions = project.sessions
  const currentSession = sessions[currentSessionIndex]
  const previousSession = sessions[currentSessionIndex - 1]
  const nextSession = sessions[currentSessionIndex + 1]

  const canGoPrevious = currentSessionIndex > 0
  const canGoNext = currentSessionIndex < sessions.length - 1

  const getSessionStatus = (session: Session) => {
    if (session.completedAt) return 'completed'
    if (!isValidDate(session.dueDate)) return 'active'
    const dueDate = new Date(session.dueDate)
    if (isPast(dueDate)) return 'overdue'
    return 'active'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'overdue':
        return <Clock className="w-4 h-4 text-red-500" />
      case 'active':
        return <Play className="w-4 h-4 text-cyan-500" />
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Voyage Navigator</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={!canGoPrevious}
              onClick={() => setCurrentSession(currentSessionIndex - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              {currentSessionIndex + 1} / {sessions.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={!canGoNext}
              onClick={() => setCurrentSession(currentSessionIndex + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Three Panel View */}
        <div className="space-y-2">
          {/* Reflection (Previous) */}
          <SessionPanel
            label="Reflection"
            session={previousSession}
            isExpanded={expandedPanel === 'reflection'}
            onClick={() => setExpandedPanel(expandedPanel === 'reflection' ? 'cockpit' : 'reflection')}
            placeholder={!previousSession ? 'Project Start' : undefined}
            type="reflection"
          />

          {/* Cockpit (Current) */}
          <SessionPanel
            label="Current"
            session={currentSession}
            isExpanded={expandedPanel === 'cockpit'}
            onClick={() => setExpandedPanel('cockpit')}
            isCurrent
            type="cockpit"
          />

          {/* Preview (Next) */}
          <SessionPanel
            label="Preview"
            session={nextSession}
            isExpanded={expandedPanel === 'preview'}
            onClick={() => setExpandedPanel(expandedPanel === 'preview' ? 'cockpit' : 'preview')}
            placeholder={!nextSession ? 'Project Completion' : undefined}
            type="preview"
          />
        </div>

        {/* Session List */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">All Sessions</p>
          <ScrollArea className="h-[200px]">
            <div className="space-y-1">
              {sessions.map((session, index) => {
                const status = getSessionStatus(session)
                const isCurrent = index === currentSessionIndex

                return (
                  <button
                    key={session.id}
                    onClick={() => setCurrentSession(index)}
                    className={cn(
                      'w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors',
                      'hover:bg-muted/50',
                      isCurrent && 'bg-cyan-500/10 border border-cyan-500/30'
                    )}
                  >
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-medium truncate',
                        isCurrent && 'text-cyan-400'
                      )}>
                        {session.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {safeFormatDate(session.dueDate, 'MMM d HH:mm')}
                      </p>
                    </div>
                    {getStatusIcon(status)}
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}

interface SessionPanelProps {
  label: string
  session?: Session
  isExpanded: boolean
  onClick: () => void
  isCurrent?: boolean
  placeholder?: string
  type: VoyagePanel
}

function SessionPanel({
  label,
  session,
  isExpanded,
  onClick,
  isCurrent,
  placeholder,
  type,
}: SessionPanelProps) {
  const bgColor = type === 'reflection'
    ? 'bg-purple-500/5 border-purple-500/20'
    : type === 'preview'
    ? 'bg-blue-500/5 border-blue-500/20'
    : 'bg-cyan-500/10 border-cyan-500/30'

  const textColor = type === 'reflection'
    ? 'text-purple-400'
    : type === 'preview'
    ? 'text-blue-400'
    : 'text-cyan-400'

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 rounded-lg border text-left transition-all',
        bgColor,
        isExpanded && 'ring-2 ring-cyan-500/50'
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={cn('text-xs font-medium uppercase tracking-wider', textColor)}>
          {label}
        </span>
        {isCurrent && (
          <span className="text-xs bg-cyan-500 text-white px-2 py-0.5 rounded-full">
            Active
          </span>
        )}
      </div>
      
      {session ? (
        <div>
          <p className="font-medium text-sm truncate">{session.title}</p>
          {isExpanded && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {session.topic}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">{placeholder}</p>
      )}
    </button>
  )
}
