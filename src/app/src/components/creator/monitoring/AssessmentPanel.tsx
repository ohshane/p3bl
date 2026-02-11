import { useState, useEffect } from 'react'
import { ClipboardCheck, Search, Loader2, CheckCheck, RotateCw } from 'lucide-react'
import { useCreatorStore } from '@/stores/creatorStore'
import { getProjectSubmissions, gradeSubmission } from '@/server/api'
import { getTeamSessionArtifact } from '@/server/api/artifacts'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  const [isGradingAll, setIsGradingAll] = useState(false)

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

  const applyGradedState = (
    ids: string[],
    updatedScores?: Array<{
      artifactId: string
      aiScore: number
      rubricBreakdown: Array<{ criterion: string; weight: number; score: number | null }>
    }>
  ) => {
    const idSet = new Set(ids)
    const scoreMap = new Map(updatedScores?.map(s => [s.artifactId, s]) || [])
    setSubmissions((prev) =>
      prev.map((s) => {
        if (!idSet.has(s.id)) return s
        const updated = scoreMap.get(s.id)
        return {
          ...s,
          status: 'graded' as const,
          ...(updated ? { aiScore: updated.aiScore, rubricBreakdown: updated.rubricBreakdown } : {}),
        }
      })
    )
    setStats((prev) => {
      // Count how many were actually pending (not already graded) for stat adjustment
      const wasAlreadyGraded = ids.filter(id => {
        const sub = submissions.find(s => s.id === id)
        return sub?.status === 'graded'
      }).length
      const newlyGraded = ids.length - wasAlreadyGraded
      // Recompute avg score from updated submissions
      const updatedSubmissions = submissions.map(s => {
        if (!idSet.has(s.id)) return s
        const updated = scoreMap.get(s.id)
        return updated ? { ...s, aiScore: updated.aiScore } : s
      })
      const avgScore = updatedSubmissions.length > 0
        ? Math.round(updatedSubmissions.reduce((sum, s) => sum + s.aiScore, 0) / updatedSubmissions.length)
        : prev.avgScore
      return {
        ...prev,
        pending: Math.max(0, prev.pending - newlyGraded),
        graded: prev.graded + newlyGraded,
        avgScore,
      }
    })
  }

  const handleGrade = async (submission: Submission) => {
    setGradingIds((prev) => new Set(prev).add(submission.id))
    const isRegrade = submission.status === 'graded'
    try {
      const result = await gradeSubmission({ data: { artifactIds: submission.id } })
      if (result.success) {
        applyGradedState([submission.id], result.updatedScores)
        const updatedScore = result.updatedScores?.find(s => s.artifactId === submission.id)
        const scoreText = updatedScore ? `${updatedScore.aiScore}%` : `${submission.aiScore}%`
        toast.success(isRegrade ? 'Submission re-graded' : 'Submission graded', {
          description: `${submission.studentName} scored ${scoreText}`,
        })
      } else {
        toast.error(`Failed to ${isRegrade ? 're-grade' : 'grade'} submission`)
      }
    } catch {
      toast.error(`Failed to ${isRegrade ? 're-grade' : 'grade'} submission`)
    } finally {
      setGradingIds((prev) => {
        const next = new Set(prev)
        next.delete(submission.id)
        return next
      })
    }
  }

  const pendingSubmissions = submissions.filter((s) => s.status === 'pending')
  const ungradedCount = pendingSubmissions.length

  const handleGradeAll = async () => {
    const targets = ungradedCount > 0 ? pendingSubmissions : submissions
    if (targets.length === 0) return
    setIsGradingAll(true)
    try {
      const ids = targets.map((s) => s.id)
      const result = await gradeSubmission({ data: { artifactIds: ids } })
      if (result.success) {
        applyGradedState(ids, result.updatedScores)
        toast.success(ungradedCount > 0
          ? `Graded ${ids.length} submissions`
          : `Re-graded ${ids.length} submissions`)
      } else {
        toast.error('Failed to grade submissions')
      }
    } catch {
      toast.error('Failed to grade submissions')
    } finally {
      setIsGradingAll(false)
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
        {submissions.length > 0 && (
          <Button
            size="sm"
            onClick={handleGradeAll}
            disabled={isGradingAll}
            className={cn(
              ungradedCount > 0
                ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                : "border border-border bg-background hover:bg-accent text-foreground"
            )}
          >
            {isGradingAll ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : ungradedCount > 0 ? (
              <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
            ) : (
              <RotateCw className="w-3.5 h-3.5 mr-1.5" />
            )}
            {ungradedCount > 0
              ? `Grade All (${ungradedCount})`
              : `Re-grade All (${submissions.length})`}
          </Button>
        )}
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
                          onClick={() => handleGrade(submission)}
                          disabled={gradingIds.has(submission.id) || isGradingAll}
                          className={cn(
                            submission.status === 'pending'
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "border border-border bg-background hover:bg-accent text-foreground"
                          )}
                        >
                          {gradingIds.has(submission.id) ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : submission.status === 'pending' ? (
                            <CheckCheck className="w-3 h-3 mr-1" />
                          ) : (
                            <RotateCw className="w-3 h-3 mr-1" />
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
        <DialogContent className="sm:max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Submitted Team Content</DialogTitle>
            <DialogDescription>
              {selectedSubmission
                ? `${selectedSubmission.teamName} · Session ${getSessionNumber(selectedSubmission)} (${selectedSubmission.sessionTitle})`
                : 'Review submitted content'}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-[320px] max-h-[60vh] overflow-auto rounded-lg border border-border bg-muted/20 p-4">
            {selectedSubmission && selectedSubmission.rubricBreakdown.length > 0 && (
              <div className="mb-4 rounded-lg border border-border bg-background p-3">
                <h4 className="text-sm font-medium text-foreground mb-2">Rubric Criteria Scores</h4>
                <div className="space-y-2">
                  {selectedSubmission.rubricBreakdown.map((item, idx) => (
                    <div key={`${item.criterion}-${idx}`} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.criterion} <span className="text-xs">({item.weight}%)</span>
                      </span>
                      <span className="font-medium text-foreground">
                        {item.score !== null ? `${item.score}` : '-'}
                      </span>
                    </div>
                  ))}
                </div>
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
        </DialogContent>
      </Dialog>
    </div>
  )
}
