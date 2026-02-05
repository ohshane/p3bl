import { useState, useEffect, useCallback } from 'react'
import { FileText, Save, Send, Sparkles, AlertTriangle, CheckCircle, Loader2, FileStack, Network, Ban } from 'lucide-react'
import { useActivityStore, getGhostSuggestion } from '@/stores/activityStore'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import type { Project, Session, DeliverableType, PreCheckResult } from '@/types'

import {
  getUserSessionArtifacts,
  createArtifact as apiCreateArtifact,
  updateArtifact as apiUpdateArtifact,
  submitArtifact as apiSubmitArtifact,
} from '@/server/api/artifacts'

// Editor components (simplified for now)
import { RichTextEditor } from './editors/RichTextEditor'
import { MindmapEditor } from './editors/MindmapEditor'

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

export function SmartOutputBuilder({ project, session, teamId }: SmartOutputBuilderProps) {
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [showPreCheckWarning, setShowPreCheckWarning] = useState(false)
  const [artifact, setArtifact] = useState<SessionArtifact | null>(null)
  const [isLoadingArtifact, setIsLoadingArtifact] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { currentUser, addXP } = useAuthStore()
  const {
    editorContent,
    setEditorContent,
    isDirty,
    markSaved,
    lastSaved,
    isRunningPreCheck,
    preCheckResult,
    runPreCheck,
    clearPreCheck,
    ghostSuggestion,
    setGhostSuggestion,
    isGhostTypingEnabled,
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

  // Ghost typing effect
  useEffect(() => {
    if (!isGhostTypingEnabled || !editorContent) return

    const timeout = setTimeout(async () => {
      if (editorContent.length > 50) {
        const suggestion = await getGhostSuggestion(editorContent, session.title)
        if (suggestion) {
          setGhostSuggestion(suggestion)
        }
      }
    }, 2000)

    return () => clearTimeout(timeout)
  }, [editorContent, isGhostTypingEnabled, setGhostSuggestion])

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
    
    setIsSaving(true)
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
        const contentType = session.deliverableType === 'mindmap' ? 'mindmap' 
          : 'document'
          
        const result = await apiCreateArtifact({
          data: {
            userId: currentUser.id,
            sessionId: session.id,
            teamId,
            title: `${session.title} - Draft`,
            content: editorContent,
            contentType,
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
    } finally {
      setIsSaving(false)
    }
  }, [artifact, editorContent, currentUser, session, teamId, markSaved])

  const handleRunPreCheck = async () => {
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
  }

  const handleSubmit = () => {
    if (preCheckResult?.overallStatus === 'critical_issues') {
      setShowPreCheckWarning(true)
    } else {
      setShowSubmitDialog(true)
    }
  }

  const confirmSubmit = async () => {
    if (!currentUser) return
    
    setIsSubmitting(true)
    try {
      // Save first if needed
      if (!artifact || isDirty) {
        await handleSave()
      }
      
      // Get the artifact ID (might have been created by handleSave)
      const artifactId = artifact?.id
      if (!artifactId) {
        toast.error('Please save your work first')
        return
      }
      
      const result = await apiSubmitArtifact({
        data: { artifactId, userId: currentUser.id }
      })
      
      if (result.success) {
        addXP(20) // XP for submission
        toast.success('Artifact submitted!', {
          description: `Version ${result.version} submitted for review.`,
        })
        
        // Update local state
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
      setShowSubmitDialog(false)
      setShowPreCheckWarning(false)
    }
  }

  const handleTemplateInsert = (template: string) => {
    setEditorContent(editorContent + '\n\n' + template)
    toast.success('Template inserted')
  }

  const getEditorIcon = (type: DeliverableType) => {
    switch (type) {
      case 'mindmap':
        return <Network className="w-4 h-4" />
      case 'none':
        return <Ban className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getEditorLabel = (type: DeliverableType) => {
    switch (type) {
      case 'mindmap':
        return 'Mindmap Editor'
      case 'none':
        return 'No Deliverable'
      default:
        return 'Rich Text Editor'
    }
  }

  if (isLoadingArtifact) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              {getEditorIcon(session.deliverableType)}
              Smart Output Builder
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {getEditorLabel(session.deliverableType)}
            </Badge>
            {artifact?.latestVersion && (
              <Badge variant="secondary" className="text-xs">
                {artifact.latestVersion}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Save Status */}
            {lastSaved && (
              <span className="text-xs text-muted-foreground">
                Saved {formatDistanceToNow(new Date(lastSaved), { addSuffix: true })}
              </span>
            )}
            {isDirty && (
              <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/30">
                Unsaved
              </Badge>
            )}

            {/* Template Button */}
            {session.templates.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileStack className="w-4 h-4" />
                    Templates
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {session.templates.map(template => (
                    <DropdownMenuItem
                      key={template.id}
                      onClick={() => handleTemplateInsert(template.content)}
                    >
                      {template.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Save Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={!isDirty || isSaving || !teamId}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="flex-1 overflow-hidden p-2">
          {session.deliverableType === 'mindmap' ? (
            <MindmapEditor
              value={editorContent}
              onChange={setEditorContent}
            />
          ) : session.deliverableType === 'none' ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No deliverable required for this session.</p>
            </div>
          ) : (
            <RichTextEditor
              value={editorContent}
              onChange={setEditorContent}
              ghostSuggestion={ghostSuggestion}
            />
          )}
        </div>

        {/* Pre-check Results */}
        {preCheckResult && (
          <div className="px-2 py-2 border-t shrink-0">
            <PreCheckResults result={preCheckResult} />
          </div>
        )}

        {/* Action Bar */}
        <div className="px-2 py-2 border-t bg-muted/30 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunPreCheck}
                disabled={isRunningPreCheck || !editorContent.trim()}
                className="gap-2"
              >
                {isRunningPreCheck ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Run Pre-check
              </Button>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!editorContent.trim() || isSubmitting || !teamId}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit your work?</DialogTitle>
            <DialogDescription>
              This will create a new version of your submission. You can still make changes and resubmit later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pre-check Warning Dialog */}
      <Dialog open={showPreCheckWarning} onOpenChange={setShowPreCheckWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="w-5 h-5" />
              Critical issues found
            </DialogTitle>
            <DialogDescription>
              AI pre-check found critical issues in your work. Are you sure you want to submit anyway?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreCheckWarning(false)}>
              Review Issues
            </Button>
            <Button variant="destructive" onClick={confirmSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Anyway'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function PreCheckResults({ result }: { result: PreCheckResult }) {
  const getStatusColor = (status: PreCheckResult['overallStatus']) => {
    switch (status) {
      case 'ready':
        return 'text-green-500 border-green-500/30 bg-green-500/10'
      case 'needs_work':
        return 'text-amber-500 border-amber-500/30 bg-amber-500/10'
      case 'critical_issues':
        return 'text-red-500 border-red-500/30 bg-red-500/10'
    }
  }

  const getStatusIcon = (status: PreCheckResult['overallStatus']) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-4 h-4" />
      case 'needs_work':
        return <AlertTriangle className="w-4 h-4" />
      case 'critical_issues':
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getStatusLabel = (status: PreCheckResult['overallStatus']) => {
    switch (status) {
      case 'ready':
        return 'Ready to Submit'
      case 'needs_work':
        return 'Needs Work'
      case 'critical_issues':
        return 'Critical Issues'
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={cn('gap-1', getStatusColor(result.overallStatus))}>
            {getStatusIcon(result.overallStatus)}
            {getStatusLabel(result.overallStatus)}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Score: {result.score}/100
          </span>
        </div>
      </div>

      {result.items.length > 0 && (
        <div className="space-y-2">
          {result.items.map(item => (
            <Alert
              key={item.id}
              variant={item.severity === 'critical' ? 'destructive' : 'default'}
              className="py-2"
            >
              <AlertTitle className="text-sm flex items-center gap-2">
                {item.severity === 'critical' && <AlertTriangle className="w-4 h-4" />}
                {item.message}
              </AlertTitle>
              <AlertDescription className="text-xs mt-1">
                {item.suggestion}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  )
}
