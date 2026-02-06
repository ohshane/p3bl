import { useState, useEffect, useCallback } from 'react'
import { Send, Sparkles, AlertTriangle, CheckCircle, Loader2, X } from 'lucide-react'
import { useActivityStore } from '@/stores/activityStore'
import { useAuthStore } from '@/stores/authStore'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Project, Session, PreCheckResult } from '@/types'

import {
  getUserSessionArtifacts,
  createArtifact as apiCreateArtifact,
  updateArtifact as apiUpdateArtifact,
  submitArtifact as apiSubmitArtifact,
} from '@/server/api/artifacts'

// Editor components (simplified for now)
import { RichTextEditor } from './editors/RichTextEditor'

interface SmartOutputBuilderProps {
  project: Project
  session: Session
  teamId?: string
}

interface SessionArtifact {
  id: string
  title: string
  content: string | null
  status: string
  versionCount: number
  latestVersion: string | null
}

export function SmartOutputBuilder({ project: _project, session, teamId }: SmartOutputBuilderProps) {
  const [showPreCheckWarning, setShowPreCheckWarning] = useState(false)
  const [artifact, setArtifact] = useState<SessionArtifact | null>(null)
  const [isLoadingArtifact, setIsLoadingArtifact] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubmitted, setShowSubmitted] = useState(false)
  
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
        } else {
          setArtifact(null)
          setEditorContent('')
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
  }, [session.id, currentUser, setEditorContent, clearPreCheck])

  // Auto-save
  useEffect(() => {
    if (!isDirty || !currentUser) return

    const timeout = setTimeout(() => {
      handleSave()
    }, 5000)

    return () => clearTimeout(timeout)
  }, [editorContent, isDirty])

  const handleSave = useCallback(async () => {
    if (!currentUser || !teamId) return
    
    try {
      if (artifact) {
        // Update existing artifact
        const result = await apiUpdateArtifact({
          data: { artifactId: artifact.id, content: editorContent }
        })
        
        if (result.success) {
          markSaved()
          toast.success('Draft saved')
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
            content: editorContent,
            contentType: 'document',
          }
        })
        
        if (result.success && result.artifactId) {
          setArtifact({
            id: result.artifactId,
            title: `${session.title} - Draft`,
            content: editorContent,
            status: 'draft',
            versionCount: 0,
            latestVersion: null,
          })
          markSaved()
          toast.success('Draft saved')
        } else {
          toast.error('Failed to save', { description: result.error })
        }
      }
    } catch (error) {
      toast.error('Failed to save')
    }
  }, [artifact, editorContent, currentUser, session, teamId, markSaved])

  const handleRunPreCheck = useCallback(async () => {
    const result = await runPreCheck()
    
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
  }, [runPreCheck])

  const handleSubmit = useCallback(async () => {
    if (preCheckResult?.overallStatus === 'critical_issues') {
      setShowPreCheckWarning(true)
      return
    }
    
    // Direct submit without modal
    if (!currentUser) return
    
    setIsSubmitting(true)
    try {
      if (!artifact || isDirty) {
        await handleSave()
      }
      
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
  }, [preCheckResult, currentUser, artifact, isDirty, handleSave, addXP])

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

  const confirmSubmitFromWarning = async () => {
    if (!currentUser) return
    
    setIsSubmitting(true)
    try {
      if (!artifact || isDirty) {
        await handleSave()
      }
      
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
      setShowPreCheckWarning(false)
    }
  }

  if (isLoadingArtifact) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex flex-col p-0 min-h-0">
        {/* Action Bar - Modern Card Design (Top) */}
        <div className="shrink-0 pb-6">
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              {/* Pre-check Button - Generate Style */}
              <button
                onClick={handleRunPreCheck}
                disabled={isRunningPreCheck || !editorContent.trim()}
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

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!editorContent.trim() || isSubmitting || !teamId || showSubmitted}
                className={cn(
                  "group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  "border border-border/50 bg-foreground text-background hover:bg-foreground/90",
                  showSubmitted && "bg-emerald-500 border-emerald-500 text-white",
                  "disabled:cursor-not-allowed",
                  !showSubmitted && !isSubmitting && "disabled:opacity-40"
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : showSubmitted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>
                  {isSubmitting ? 'Submitting...' : showSubmitted ? 'Submitted!' : 'Submit'}
                </span>
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

        <div className="flex-1 rounded-xl pb-6">
          {session.deliverableType === 'none' ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No deliverable required for this session.</p>
            </div>
          ) : (
            <RichTextEditor
              value={editorContent}
              onChange={setEditorContent}
            />
          )}
        </div>
      </div>

      {/* Pre-check Warning Dialog - Simple */}
      <Dialog open={showPreCheckWarning} onOpenChange={setShowPreCheckWarning}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-amber-500">Issues detected</DialogTitle>
            <DialogDescription className="text-sm">
              Review the issues before submitting.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              onClick={() => setShowPreCheckWarning(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-accent transition-colors"
            >
              Review
            </button>
            <button
              onClick={confirmSubmitFromWarning}
              disabled={isSubmitting}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                "bg-amber-500 text-white hover:bg-amber-600",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Anyway'}
            </button>
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
