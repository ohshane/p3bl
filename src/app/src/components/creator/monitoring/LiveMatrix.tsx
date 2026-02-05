import { useEffect } from 'react'
import { CheckCircle, Clock, AlertCircle, X, Loader2 } from 'lucide-react'
import { useCreatorStore } from '@/stores/creatorStore'
import { cn } from '@/lib/utils'

interface LiveMatrixProps {
  projectId: string
}

export function LiveMatrix({ projectId }: LiveMatrixProps) {
  const { 
    getProject, 
    getLiveMatrix, 
    fetchLiveMatrix,
    isLoadingMatrix,
  } = useCreatorStore()
  
  const project = getProject(projectId)
  const matrix = getLiveMatrix(projectId)

  // Fetch live matrix data on mount
  useEffect(() => {
    fetchLiveMatrix(projectId)
  }, [projectId, fetchLiveMatrix])

  if (!project) return null

  const statusIcons = {
    not_started: <X className="w-3 h-3" />,
    in_progress: <Clock className="w-3 h-3" />,
    submitted: <Clock className="w-3 h-3" />,
    approved: <CheckCircle className="w-3 h-3" />,
    needs_revision: <AlertCircle className="w-3 h-3" />,
  }

  const statusColors = {
    not_started: 'bg-muted text-muted-foreground',
    in_progress: 'bg-yellow-500/20 text-yellow-500',
    submitted: 'bg-blue-500/20 text-blue-500',
    approved: 'bg-green-500/20 text-green-500',
    needs_revision: 'bg-red-500/20 text-red-500',
  }

  const riskColors = {
    green: 'border-green-500/50 bg-green-500/5',
    yellow: 'border-yellow-500/50 bg-yellow-500/5',
    red: 'border-red-500/50 bg-red-500/5',
  }

  // Show loading state
  if (isLoadingMatrix && matrix.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-500 mr-2" />
        <span className="text-muted-foreground">Loading team progress...</span>
      </div>
    )
  }

  // Show empty state
  if (matrix.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/40 rounded-lg border border-border">
        <p className="text-muted-foreground">No teams have joined this project yet.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Share the join code <span className="font-mono text-cyan-500">{project.joinCode}</span> with participants.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Team Progress Matrix</h2>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500/20" />
            <span>Approved</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500/20" />
            <span>Submitted</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-500/20" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-muted" />
            <span>Not Started</span>
          </div>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-3 text-muted-foreground text-sm font-medium border-b border-border">
                Team
              </th>
              {project.sessions.map((session, idx) => (
                <th
                  key={session.id || idx}
                  className="p-3 text-center text-muted-foreground text-sm font-medium border-b border-border min-w-[100px]"
                >
                  S{idx + 1}
                </th>
              ))}
              <th className="p-3 text-center text-muted-foreground text-sm font-medium border-b border-border">
                Progress
              </th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((entry) => {
              const completedCount = entry.sessionProgress.filter(
                s => s.status === 'approved' || s.status === 'submitted'
              ).length
              const progressPercent = project.sessions.length > 0
                ? Math.round((completedCount / project.sessions.length) * 100)
                : 0

              return (
                <tr
                  key={entry.teamId}
                  className={cn(
                    'border-b border-border/70 hover:bg-muted/60',
                    riskColors[entry.riskLevel]
                  )}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-2 h-8 rounded-full',
                          entry.riskLevel === 'green' && 'bg-green-500',
                          entry.riskLevel === 'yellow' && 'bg-yellow-500',
                          entry.riskLevel === 'red' && 'bg-red-500'
                        )}
                      />
                      <div>
                        <div className="font-medium text-foreground">{entry.teamName}</div>
                        <div className="text-xs text-muted-foreground">
                          {entry.members.length} members
                        </div>
                      </div>
                    </div>
                  </td>
                  {entry.sessionProgress.map((progress, idx) => (
                    <td key={idx} className="p-3 text-center">
                      <div
                        className={cn(
                          'inline-flex items-center justify-center w-8 h-8 rounded-lg',
                          statusColors[progress.status]
                        )}
                      >
                        {statusIcons[progress.status]}
                      </div>
                    </td>
                  ))}
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {progressPercent}%
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Team Details Expansion (placeholder) */}
      <div className="p-4 bg-muted/40 rounded-lg border border-border">
        <p className="text-sm text-muted-foreground">
          Click on a team row to view individual member progress and details.
        </p>
      </div>
    </div>
  )
}
