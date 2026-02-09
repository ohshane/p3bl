import { useState, useEffect, useCallback, useRef } from 'react'
import { Send, Sparkles, AlertTriangle, CheckCircle, Loader2, X, Save } from 'lucide-react'
import { useActivityStore } from '@/stores/activityStore'
import { useAuthStore } from '@/stores/authStore'
import { cn, isValidDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { Project, Session, PreCheckResult } from '@/types'
import { isPast } from 'date-fns'

import {
  getUserSessionArtifacts,
  createArtifact as apiCreateArtifact,
  updateArtifact as apiUpdateArtifact,
  submitArtifact as apiSubmitArtifact,
} from '@/server/api/artifacts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

// Editor components (simplified for now)
import { RichTextEditor } from './editors/RichTextEditor'

interface SmartOutputBuilderProps {
  project: Project
  session: Session
  teamId?: string
  userName?: string
}

interface SessionArtifact {
  id: string
  title: string
  content: string | null
  status: string
  versionCount: number
  latestVersion: string | null
}

export function SmartOutputBuilder({ project: _project, session, teamId, userName }: SmartOutputBuilderProps) {
  const [artifact, setArtifact] = useState<SessionArtifact | null>(null)
  const [, setIsLoadingArtifact] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubmitted, setShowSubmitted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showAutoSaved, setShowAutoSaved] = useState(false)
  const [showLateSubmitDialog, setShowLateSubmitDialog] = useState(false)
  
  const { currentUser, addXP } = useAuthStore()
  const {
    editorContent,
    setEditorContent,
    isDirty,
    markSaved,
    isRunningPreCheck,
    preCheckResult,
    runPreCheck,
    clearPreCheck,
    setActionHandlers,
  } = useActivityStore()

  // Keep a ref to the latest handleSave so auto-save always calls the current version
  const handleSaveRef = useRef<(options?: { silent?: boolean }) => Promise<void>>(() => Promise.resolve())

  // Load artifact for this session
  useEffect(() => {
    async function loadArtifact() {
      if (!currentUser) return
      
      setIsLoadingArtifact(true)
      try {
        const result = await getUserSessionArtifacts({
          data: { userId: currentUser.id, sessionId: session.id }
        })
        
        if (result.success && result.artifacts && result.artifacts.length > 0) {
          const a = result.artifacts[0]
          setArtifact({
            id: a.id,
            title: a.title,
            content: a.content ?? null,
            status: a.status,
            versionCount: a.versionCount,
            latestVersion: a.latestVersion,
          })
          setEditorContent(a.content || '')
          // Content was just loaded from DB, not a user edit — clear dirty flag
          markSaved()
        } else {
          setArtifact(null)
          setEditorContent('')
          markSaved()
        }
      } catch (error) {
        console.error('Failed to load artifact:', error)
        setArtifact(null)
        setEditorContent('')
      } finally {
        setIsLoadingArtifact(false)
        clearPreCheck()
      }
    }
    
    loadArtifact()
  }, [session.id, currentUser, setEditorContent, clearPreCheck, markSaved])

  const handleSave = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false

    if (!currentUser || !teamId) {
      if (!silent) toast.error('Unable to save', { description: 'Missing user or team context.' })
      return
    }
    
    const contentToSave = editorContent

    setIsSaving(true)
    
    try {
      if (artifact) {
        // Update existing artifact
        const result = await apiUpdateArtifact({
          data: { artifactId: artifact.id, content: contentToSave }
        })
        
        if (result.success) {
          markSaved()
          if (!silent) toast.success('Saved')
        } else {
          toast.error('Failed to save', { description: result.error })
        }
      } else {
        // Create new artifact
        const result = await apiCreateArtifact({
          data: {
            userId: currentUser.id,
            sessionId: session.id,
            teamId,
            title: `${session.title} - Draft`,
            content: contentToSave,
            contentType: 'document',
          }
        })
        
        if (result.success && result.artifactId) {
          setArtifact({
            id: result.artifactId,
            title: `${session.title} - Draft`,
            content: contentToSave,
            status: 'draft',
            versionCount: 0,
            latestVersion: null,
          })
          markSaved()
          if (!silent) toast.success('Saved')
        } else {
          toast.error('Failed to save', { description: result.error })
        }
      }
    } catch (error) {
      toast.error('Failed to save')
    } finally {
      setIsSaving(false)
    }
  }, [artifact, editorContent, currentUser, session, teamId, markSaved])

  // Keep ref up to date so auto-save timer always calls the latest version
  handleSaveRef.current = handleSave

  // Auto-save: debounce 3s after user stops typing
  useEffect(() => {
    if (!isDirty || !currentUser) return

    const timeout = setTimeout(async () => {
      await handleSaveRef.current({ silent: true })
      setShowAutoSaved(true)
    }, 3000)

    return () => clearTimeout(timeout)
  }, [editorContent, isDirty, currentUser])

  // Clear "Auto saved" indicator after 1 second
  useEffect(() => {
    if (showAutoSaved) {
      const timeout = setTimeout(() => setShowAutoSaved(false), 2000)
      return () => clearTimeout(timeout)
    }
  }, [showAutoSaved])

  const handleRunPreCheck = useCallback(async () => {
    // Build rubric context string from session rubric criteria
    const rubricContext = session.rubric.length > 0
      ? session.rubric.map(r => `- ${r.criterion} (${r.weight}%): ${r.description}`).join('\n')
      : undefined

    const result = await runPreCheck(artifact?.id, rubricContext)
    
    if (result.overallStatus === 'critical_issues') {
      toast.warning('Pre-check found critical issues', {
        description: 'Please review the feedback before submitting.',
      })
    } else if (result.overallStatus === 'needs_work') {
      toast.info('Pre-check complete', {
        description: 'Review the suggestions to improve your work.',
      })
    } else {
      toast.success('Looking good!', {
        description: 'Your work is ready for submission.',
      })
    }
  }, [runPreCheck, session.rubric, artifact?.id])

  const submitArtifact = useCallback(async () => {
    if (!currentUser) return
    
    setIsSubmitting(true)
    try {
      await handleSave({ silent: true })
      
      const artifactId = artifact?.id
      if (!artifactId) {
        toast.error('Please save your work first')
        return
      }
      
      const result = await apiSubmitArtifact({
        data: { artifactId, userId: currentUser.id }
      })
      
      if (result.success) {
        addXP(20)
        setShowSubmitted(true)
        setTimeout(() => setShowSubmitted(false), 2000)
        
        setArtifact(prev => prev ? {
          ...prev,
          status: 'submitted',
          latestVersion: result.version || null,
          versionCount: (prev.versionCount || 0) + 1,
        } : null)
      } else {
        toast.error('Failed to submit', { description: result.error })
      }
    } catch (error) {
      toast.error('Failed to submit')
    } finally {
      setIsSubmitting(false)
    }
  }, [currentUser, artifact, handleSave, addXP])

  const isDeliverableNone = session.deliverableType === 'none'
  const isLateSubmission =
    isValidDate(session.endDate) && isPast(new Date(session.endDate))

  const handleSubmit = useCallback(async () => {
    if (isDeliverableNone) return
    if (isLateSubmission) {
      setShowLateSubmitDialog(true)
      return
    }

    await submitArtifact()
  }, [isDeliverableNone, isLateSubmission, submitArtifact])

  useEffect(() => {
    setActionHandlers({
      runPreCheck: handleRunPreCheck,
      submit: handleSubmit,
    })

    return () => {
      setActionHandlers({
        runPreCheck: undefined,
        submit: undefined,
      })
    }
  }, [handleRunPreCheck, handleSubmit, setActionHandlers])

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex flex-col p-0 min-h-0">
        {/* Action Bar - Modern Card Design (Top) */}
        <div className="shrink-0 pb-6">
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Pre-check Button - Generate Style */}
                <button
                  onClick={handleRunPreCheck}
                  disabled={isDeliverableNone || isRunningPreCheck}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    "bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white",
                    "disabled:opacity-40 disabled:cursor-not-allowed"
                  )}
                >
                  {isRunningPreCheck ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>{isRunningPreCheck ? 'Checking...' : 'Pre-check'}</span>
                </button>

                {/* Save Button */}
                <button
                  onClick={() => handleSave()}
                  disabled={isDeliverableNone || isSaving}
                  className={cn(
                    "flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    "border border-border/50 hover:bg-accent",
                    "disabled:opacity-40 disabled:cursor-not-allowed"
                  )}
                >
                  <Save className="w-4 h-4" />
                </button>

                {/* Auto saved indicator */}
                {showAutoSaved && (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-500">
                    <CheckCircle className="w-3 h-3" />
                    Auto saved
                  </span>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isDeliverableNone || isSubmitting}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out",
                  "border border-border/50 bg-foreground text-background hover:opacity-90 active:scale-[0.97]",
                  showSubmitted && "bg-emerald-500 border-emerald-500 text-white",
                  "disabled:cursor-not-allowed",
                  !showSubmitted && !isSubmitting && "disabled:opacity-40"
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{showSubmitted ? 'Submitted' : 'Submit'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pre-check Results - Modern Card */}
        {preCheckResult && (
          <div className="shrink-0 pb-6">
            <PreCheckResults result={preCheckResult} onClear={clearPreCheck} />
          </div>
        )}

        <div className="flex-1 min-h-0 rounded-xl">
          {session.deliverableType === 'none' ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No deliverable required for this session.</p>
            </div>
          ) : (
            <RichTextEditor
              roomName={teamId ? `team_${teamId}_session_${session.id}` : undefined}
              user={userName ? { name: userName } : undefined}
              initialContent={editorContent}
              onChange={setEditorContent}
            />
          )}
        </div>
      </div>

      <Dialog open={showLateSubmitDialog} onOpenChange={setShowLateSubmitDialog}>
        <DialogContent className="sm:max-w-md border-amber-500/40">
          <DialogHeader>
            <DialogTitle className="text-amber-500">Late submission</DialogTitle>
            <DialogDescription>
              This session has passed its end time. Submitting now will be marked
              as late.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLateSubmitDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-amber-500 text-white hover:bg-amber-600"
              onClick={async () => {
                setShowLateSubmitDialog(false)
                await submitArtifact()
              }}
            >
              Submit Late
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PreCheckResults({ result, onClear }: { result: PreCheckResult; onClear: () => void }) {
  const statusConfig = {
    ready: {
      accent: 'text-emerald-600 dark:text-emerald-400',
      icon: <CheckCircle className="w-4 h-4" />,
      label: 'Ready',
    },
    needs_work: {
      accent: 'text-amber-600 dark:text-amber-400',
      icon: <AlertTriangle className="w-4 h-4" />,
      label: 'Needs Work',
    },
    critical_issues: {
      accent: 'text-red-600 dark:text-red-400',
      icon: <AlertTriangle className="w-4 h-4" />,
      label: 'Critical',
    },
  }

  const config = statusConfig[result.overallStatus]

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("flex items-center gap-2", config.accent)}>
            {config.icon}
            <span className="text-sm font-medium">{config.label}</span>
          </div>
          <div className="h-4 w-px bg-border/50" />
          <span className="text-sm text-muted-foreground">
            Score <span className="font-semibold text-foreground">{result.score}</span>/100
          </span>
        </div>
        <button
          onClick={onClear}
          className="w-6 h-6 rounded-full hover:bg-background/60 flex items-center justify-center transition-colors"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Feedback Items */}
      {result.items.length > 0 && (
        <div className="space-y-2">
          {result.items.map(item => (
            <div
              key={item.id}
              className={cn(
                "rounded-lg px-3 py-2.5 bg-background border border-border/50",
                item.severity === 'critical' && "border-red-500/30"
              )}
            >
              <div className="flex items-start gap-2">
                {item.severity === 'critical' && (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                )}
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-snug">
                    {item.message}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.suggestion}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
