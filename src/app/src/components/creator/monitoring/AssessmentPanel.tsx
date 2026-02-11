import { useState, useEffect, useCallback } from 'react'
import { ClipboardCheck, Search, Loader2, CheckCheck, Sparkles } from 'lucide-react'
import { useCreatorStore } from '@/stores/creatorStore'
import { getProjectSubmissions, gradeSubmission, regradeSubmission } from '@/server/api'
import { getTeamSessionArtifact } from '@/server/api/artifacts'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface AssessmentPanelProps {
  projectId: string
}

interface Submission {
  id: string
  teamId: string
  teamName: string
  studentId: string
  studentName: string
  sessionId: string
  sessionIndex: number
  sessionTitle: string
  aiScore: number
  gradedScore: number | null
  status: 'pending' | 'graded'
  submittedAt: string
  precheckPassed: boolean | null
  rubricBreakdown: Array<{
    criterion: string
    weight: number
    score: number | null
  }>
}

interface SubmissionStats {
  total: number
  pending: number
  graded: number
  avgScore: number
}

export function AssessmentPanel({ projectId }: AssessmentPanelProps) {
  const { getProject } = useCreatorStore()
  const project = getProject(projectId)

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [stats, setStats] = useState<SubmissionStats>({ total: 0, pending: 0, graded: 0, avgScore: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSession, setSelectedSession] = useState<string>('all')
  const [selectedTeam, setSelectedTeam] = useState<string>('all')
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [reviewContent, setReviewContent] = useState('')
  const [isLoadingReview, setIsLoadingReview] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [gradingIds, setGradingIds] = useState<Set<string>>(new Set())
  const [regradingIds, setRegradingIds] = useState<Set<string>>(new Set())


  // Fetch submissions on mount
  useEffect(() => {
    async function fetchSubmissions() {
      setIsLoading(true)
      try {
        const result = await getProjectSubmissions({ data: { projectId } })
        if (result.success) {
          setSubmissions(result.submissions || [])
          setStats(result.stats || { total: 0, pending: 0, graded: 0, avgScore: 0 })
        }
      } catch (error) {
        console.error('Failed to fetch submissions:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSubmissions()
  }, [projectId])

  if (!project) return null

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch = sub.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sub.teamName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSession = selectedSession === 'all' || sub.sessionIndex === parseInt(selectedSession)
    const matchesTeam = selectedTeam === 'all' || sub.teamId === selectedTeam
    return matchesSearch && matchesSession && matchesTeam
  })

  const getSessionNumber = (submission: Submission) => {
    const sessionIdx = project.sessions.findIndex((s) => s.id === submission.sessionId)
    if (sessionIdx >= 0) return sessionIdx + 1
    return submission.sessionIndex + 1
  }

  const handleReview = async (submission: Submission) => {
    setSelectedSubmission(submission)
    setIsReviewOpen(true)
    setIsLoadingReview(true)
    setReviewError(null)
    setReviewContent('')

    try {
      const result = await getTeamSessionArtifact({
        data: { teamId: submission.teamId, sessionId: submission.sessionId },
      })

      if (!result.success) {
        setReviewError(result.error || 'Failed to load submitted content')
        return
      }

      const content = result.artifact?.content || ''
      if (!content.trim()) {
        setReviewError('No submitted content found for this team/session.')
        return
      }

      setReviewContent(content)
    } catch (error) {
      setReviewError('Failed to load submitted content')
    } finally {
      setIsLoadingReview(false)
    }
  }

  // Re-grade: re-run AI scoring only, no status change
  const handleRegrade = async (submission: Submission) => {
    setRegradingIds((prev) => new Set(prev).add(submission.id))
    try {
      const result = await regradeSubmission({ data: { artifactIds: submission.id } })
      if (result.success && result.updatedScores) {
        const scoreMap = new Map(result.updatedScores.map((s: { artifactId: string; aiScore: number; rubricBreakdown: Array<{ criterion: string; weight: number; score: number | null }> }) => [s.artifactId, s]))
        setSubmissions((prev) =>
          prev.map((s) => {
            const updated = scoreMap.get(s.id)
            return updated ? { ...s, aiScore: updated.aiScore, rubricBreakdown: updated.rubricBreakdown } : s
          })
        )
        // Keep the review dialog in sync if it's showing this submission
        const updatedScore = result.updatedScores.find((s: { artifactId: string }) => s.artifactId === submission.id)
        if (updatedScore && selectedSubmission?.id === submission.id) {
          setSelectedSubmission((prev) => prev ? { ...prev, aiScore: updatedScore.aiScore, rubricBreakdown: updatedScore.rubricBreakdown } : prev)
        }
        toast.success('AI score refreshed', {
          description: `${submission.studentName} scored ${updatedScore ? updatedScore.aiScore : submission.aiScore}%`,
        })
      } else {
        toast.error('Failed to re-score submission')
      }
    } catch {
      toast.error('Failed to re-score submission')
    } finally {
      setRegradingIds((prev) => {
        const next = new Set(prev)
        next.delete(submission.id)
        return next
      })
    }
  }

  // Save an edited graded score
  const handleSaveGradedScore = useCallback(async (submissionId: string, newScore: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(newScore)))
    try {
      const result = await gradeSubmission({ data: { artifactId: submissionId, score: clamped } })
      if (result.success) {
        setSubmissions((prev) =>
          prev.map((s) => s.id === submissionId ? { ...s, gradedScore: clamped, status: 'graded' as const } : s)
        )
        if (selectedSubmission?.id === submissionId) {
          setSelectedSubmission((prev) => prev ? { ...prev, gradedScore: clamped, status: 'graded' as const } : prev)
        }
        toast.success('Graded score updated', { description: `Score set to ${clamped}%` })
      } else {
        toast.error('Failed to update graded score')
      }
    } catch {
      toast.error('Failed to update graded score')
    }
  }, [selectedSubmission])

  // Confirm grade: human action, sets status to graded and persists the AI score as the graded score
  const handleGrade = async (submission: Submission) => {
    setGradingIds((prev) => new Set(prev).add(submission.id))
    const wasPending = submission.status === 'pending'
    try {
      const score = submission.aiScore
      const result = await gradeSubmission({ data: { artifactId: submission.id, score } })
      if (result.success) {
        setSubmissions((prev) =>
          prev.map((s) => s.id === submission.id ? { ...s, status: 'graded' as const, gradedScore: score } : s)
        )
        if (selectedSubmission?.id === submission.id) {
          setSelectedSubmission((prev) => prev ? { ...prev, status: 'graded' as const, gradedScore: score } : prev)
        }
        if (wasPending) {
          setStats((prev) => ({
            ...prev,
            pending: Math.max(0, prev.pending - 1),
            graded: prev.graded + 1,
          }))
        }
        toast.success(wasPending ? 'Submission graded' : 'Graded score updated', {
          description: `${submission.studentName} confirmed at ${score}%`,
        })
      } else {
        toast.error('Failed to grade submission')
      }
    } catch {
      toast.error('Failed to grade submission')
    } finally {
      setGradingIds((prev) => {
        const next = new Set(prev)
        next.delete(submission.id)
        return next
      })
    }
  }



  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-500 mr-2" />
        <span className="text-muted-foreground">Loading submissions...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">AI Assessment & Grading</h2>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search students or teams..."
              className="pl-10 bg-background border-border"
            />
          </div>
        </div>
        <Select value={selectedSession} onValueChange={setSelectedSession}>
          <SelectTrigger className="w-[180px] bg-background border-border">
            <SelectValue placeholder="All Sessions" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">All Sessions</SelectItem>
            {project.sessions.map((session, idx) => (
              <SelectItem key={session.id || idx} value={idx.toString()}>
                {session.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
          <SelectTrigger className="w-[180px] bg-background border-border">
            <SelectValue placeholder="All Teams" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">All Teams</SelectItem>
            {project.teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Submissions</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
          <div className="text-sm text-muted-foreground">Pending Review</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-500">{stats.graded}</div>
          <div className="text-sm text-muted-foreground">Graded</div>
        </div>
      </div>

      {/* Empty state */}
      {submissions.length === 0 ? (
        <div className="text-center py-12 bg-muted/40 rounded-lg border border-border">
          <ClipboardCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No submissions yet.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Submissions will appear here once explorers start submitting their work.
          </p>
        </div>
      ) : (
        <>
          {/* Submissions Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-3 text-muted-foreground text-sm font-medium border-b border-border">
                    Student
                  </th>
                  <th className="text-left p-3 text-muted-foreground text-sm font-medium border-b border-border">
                    Team
                  </th>
                  <th className="text-center p-3 text-muted-foreground text-sm font-medium border-b border-border">
                    Session #
                  </th>
                  <th className="text-left p-3 text-muted-foreground text-sm font-medium border-b border-border">
                    Session
                  </th>
                  <th className="text-center p-3 text-muted-foreground text-sm font-medium border-b border-border">
                    AI Score
                  </th>
                  <th className="text-center p-3 text-muted-foreground text-sm font-medium border-b border-border">
                    Graded Score
                  </th>
                  <th className="text-center p-3 text-muted-foreground text-sm font-medium border-b border-border">
                    Status
                  </th>
                  <th className="text-right p-3 text-muted-foreground text-sm font-medium border-b border-border">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.slice(0, 10).map((submission) => (
                  <tr key={submission.id} className="border-b border-border/70 hover:bg-muted/60">
                    <td className="p-3">
                      <span className="text-foreground">{submission.studentName}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-muted-foreground">{submission.teamName}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-muted-foreground">{getSessionNumber(submission)}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-muted-foreground">{submission.sessionTitle}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={cn(
                        'font-semibold',
                        submission.aiScore >= 80 ? 'text-green-500' :
                        submission.aiScore >= 60 ? 'text-yellow-500' : 'text-red-500'
                      )}>
                        {submission.aiScore}%
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {submission.gradedScore !== null ? (
                        <div className="inline-flex items-center gap-0.5">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            defaultValue={submission.gradedScore}
                            key={`${submission.id}-${submission.gradedScore}`}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value, 10)
                              if (!isNaN(val) && val !== submission.gradedScore) {
                                handleSaveGradedScore(submission.id, val)
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur()
                              }
                            }}
                            className={cn(
                              'w-12 text-center font-semibold bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                              submission.gradedScore >= 80 ? 'text-green-500' :
                              submission.gradedScore >= 60 ? 'text-yellow-500' : 'text-red-500'
                            )}
                          />
                          <span className={cn(
                            'font-semibold',
                            submission.gradedScore >= 80 ? 'text-green-500' :
                            submission.gradedScore >= 60 ? 'text-yellow-500' : 'text-red-500'
                          )}>%</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          submission.status === 'graded'
                            ? 'border-green-500/50 text-green-500'
                            : 'border-yellow-500/50 text-yellow-500'
                        )}
                      >
                        {submission.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-border"
                          onClick={() => handleReview(submission)}
                        >
                          <ClipboardCheck className="w-3 h-3 mr-1" />
                          Review
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleRegrade(submission)}
                          disabled={regradingIds.has(submission.id)}
                          className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white"
                        >
                          {regradingIds.has(submission.id) ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <Sparkles className="w-3 h-3 mr-1" />
                          )}
                          {regradingIds.has(submission.id) ? 'Re-scoring...' : 'Re-score'}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleGrade(submission)}
                          disabled={gradingIds.has(submission.id)}
                          className={cn(
                            submission.status === 'pending'
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "border border-green-600 text-green-600 hover:bg-green-600/10 bg-transparent"
                          )}
                        >
                          {gradingIds.has(submission.id) ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <CheckCheck className="w-3 h-3 mr-1" />
                          )}
                          {submission.status === 'pending' ? 'Grade' : 'Re-grade'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSubmissions.length > 10 && (
            <div className="text-center">
              <Button variant="outline" className="border-border">
                Load More ({filteredSubmissions.length - 10} remaining)
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Submitted Team Content</DialogTitle>
            <DialogDescription>
              {selectedSubmission
                ? `${selectedSubmission.teamName} · Session ${getSessionNumber(selectedSubmission)} (${selectedSubmission.sessionTitle})`
                : 'Review submitted content'}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-[320px] max-h-[60vh] overflow-auto rounded-lg border border-border bg-muted/20 p-4 flex-1">
            {selectedSubmission && selectedSubmission.rubricBreakdown.length > 0 && (
              <div className="mb-4 rounded-lg border border-border bg-background p-3">
                <h4 className="text-sm font-medium text-foreground mb-2">Rubric Criteria Scores</h4>
                <div className="space-y-2">
                  {selectedSubmission.rubricBreakdown.map((item, idx) => (
                    <div key={`${item.criterion}-${idx}`} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.criterion} <span className="text-xs">({item.weight}%)</span>
                      </span>
                      <div className="inline-flex items-center gap-0.5">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          defaultValue={item.score ?? ''}
                          key={`${selectedSubmission.id}-${item.criterion}-${item.score}`}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value, 10)
                            if (!isNaN(val) && val !== item.score) {
                              const clamped = Math.max(0, Math.min(100, Math.round(val)))
                              const updated = selectedSubmission.rubricBreakdown.map((r, i) =>
                                i === idx ? { ...r, score: clamped } : r
                              )
                              // Compute new weighted AI score
                              let weightedSum = 0
                              let totalWeight = 0
                              for (const r of updated) {
                                if (r.score !== null) {
                                  weightedSum += r.score * r.weight
                                  totalWeight += r.weight
                                }
                              }
                              const newAiScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : selectedSubmission.aiScore
                              setSelectedSubmission((prev) => prev ? { ...prev, rubricBreakdown: updated, aiScore: newAiScore } : prev)
                              setSubmissions((prev) =>
                                prev.map((s) => s.id === selectedSubmission.id ? { ...s, rubricBreakdown: updated, aiScore: newAiScore } : s)
                              )
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                          }}
                          className="w-12 text-right font-medium bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {/* AI Score summary */}
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">AI Score</span>
                  <span className={cn(
                    'font-semibold',
                    selectedSubmission.aiScore >= 80 ? 'text-green-500' :
                    selectedSubmission.aiScore >= 60 ? 'text-yellow-500' : 'text-red-500'
                  )}>
                    {selectedSubmission.aiScore}%
                  </span>
                </div>
                {selectedSubmission.gradedScore !== null && (
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">Graded Score</span>
                    <span className={cn(
                      'font-semibold',
                      selectedSubmission.gradedScore >= 80 ? 'text-green-500' :
                      selectedSubmission.gradedScore >= 60 ? 'text-yellow-500' : 'text-red-500'
                    )}>
                      {selectedSubmission.gradedScore}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {isLoadingReview ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading submitted content...
              </div>
            ) : reviewError ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                {reviewError}
              </div>
            ) : (
              <div className="h-full flex flex-col border rounded-lg overflow-hidden bg-background">
                <div className="flex-1 min-h-0 overflow-auto">
                  <div
                    className="tiptap focus:outline-none h-full p-4"
                    dangerouslySetInnerHTML={{ __html: reviewContent }}
                  />
                </div>
              </div>
            )}
          </div>

          {selectedSubmission && (
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                size="sm"
                onClick={() => handleRegrade(selectedSubmission)}
                disabled={regradingIds.has(selectedSubmission.id)}
                className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white"
              >
                {regradingIds.has(selectedSubmission.id) ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                )}
                {regradingIds.has(selectedSubmission.id) ? 'Re-scoring...' : 'Re-score'}
              </Button>
              <Button
                size="sm"
                onClick={() => handleGrade(selectedSubmission)}
                disabled={gradingIds.has(selectedSubmission.id)}
                className={cn(
                  selectedSubmission.status === 'pending'
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "border border-green-600 text-green-600 hover:bg-green-600/10 bg-transparent"
                )}
              >
                {gradingIds.has(selectedSubmission.id) ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
                )}
                {selectedSubmission.status === 'pending' ? 'Grade' : 'Re-grade'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
