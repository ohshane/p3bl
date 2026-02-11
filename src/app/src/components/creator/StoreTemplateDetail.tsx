import { useState, useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import {
  ArrowLeft,
  Store,
  User,
  Users,
  Calendar,
  Clock,
  FileText,
  Loader2,
  Library,
  ChevronDown,
  BookOpen,
  Link as LinkIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { getStoreTemplate, cloneStoreTemplate } from '@/server/api/projects'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'

// Format duration for display
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`
  } else if (minutes < 10080) {
    const days = Math.floor(minutes / 1440)
    const hours = Math.floor((minutes % 1440) / 60)
    return hours > 0 ? `${days}d ${hours}h` : `${days} day${days > 1 ? 's' : ''}`
  } else {
    const weeks = Math.floor(minutes / 10080)
    const days = Math.floor((minutes % 10080) / 1440)
    return days > 0 ? `${weeks}w ${days}d` : `${weeks} week${weeks > 1 ? 's' : ''}`
  }
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-500/10 text-green-400 border-green-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  hard: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export function StoreTemplateDetail() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const { currentUser } = useAuthStore()
  const [template, setTemplate] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCloning, setIsCloning] = useState(false)

  useEffect(() => {
    async function fetchTemplate() {
      if (!id) return
      setIsLoading(true)
      try {
        const result = await getStoreTemplate({ data: { templateId: id } })
        if (result.success) {
          setTemplate(result.template)
        }
      } catch (error) {
        console.error('Failed to fetch store template:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemplate()
  }, [id])

  const handleCloneToLibrary = async () => {
    if (!currentUser?.id || !template) return
    setIsCloning(true)
    try {
      const result = await cloneStoreTemplate({
        data: {
          templateId: template.id,
          creatorId: currentUser.id,
        },
      })
      if (result.success) {
        toast.success('Template added to your library!')
        navigate({ to: '/creator/library' })
      } else {
        toast.error(result.error || 'Failed to clone template')
      }
    } catch (error) {
      console.error('Clone store template error:', error)
      toast.error('Failed to clone template')
    } finally {
      setIsCloning(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-violet-500 mb-4" />
        <p className="text-muted-foreground">Loading template...</p>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">Template Not Found</h2>
          <p className="text-muted-foreground mb-4">
            This template may have been unpublished or doesn't exist.
          </p>
          <Button onClick={() => navigate({ to: '/creator/store' })}>
            Back to Store
          </Button>
        </div>
      </div>
    )
  }

  const isOwn = template.creatorId === currentUser?.id
  const totalDuration = template.sessions.reduce(
    (sum: number, s: any) => sum + (s.durationMinutes || 0),
    0
  )

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate({ to: '/creator/store' })}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Store
          </Button>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <Store className="w-8 h-8 text-violet-500 shrink-0" />
                <h1 className="text-3xl font-bold text-foreground">
                  {template.title}
                </h1>
                <Badge
                  variant="outline"
                  className="text-xs uppercase font-bold shrink-0 bg-violet-500/10 text-violet-500 border-violet-500/30"
                >
                  Shared Template
                </Badge>
                {isOwn && (
                  <Badge
                    variant="outline"
                    className="text-xs uppercase font-bold shrink-0 bg-cyan-500/10 text-cyan-500 border-cyan-500/30"
                  >
                    Yours
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 ml-11">
                <User className="w-4 h-4" />
                <span>by {template.creatorName}{isOwn ? ' (you)' : ''}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Description
              </h3>
              <p className="text-foreground whitespace-pre-wrap">
                {template.description || (
                  <span className="text-muted-foreground italic">No description</span>
                )}
              </p>
            </div>

            {/* Driving Question */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Driving Question
              </h3>
              <p className="text-foreground">
                {template.drivingQuestion || (
                  <span className="text-muted-foreground italic">No driving question</span>
                )}
              </p>
            </div>

            {/* Background */}
            {template.background && (
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Background
                </h3>
                <p className="text-foreground whitespace-pre-wrap">
                  {template.background}
                </p>
              </div>
            )}

            {/* Sessions */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                Sessions ({template.sessions.length})
              </h3>
              {template.sessions.length === 0 ? (
                <p className="text-muted-foreground text-sm">No sessions configured.</p>
              ) : (
                <div className="space-y-3">
                  {template.sessions.map((session: any, idx: number) => (
                    <Collapsible key={session.id}>
                      <div className="rounded-lg bg-muted/30 border border-border">
                        {/* Trigger row */}
                        <div className="flex items-center gap-3 p-3">
                          <div className="w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-violet-400">
                              {idx + 1}
                            </span>
                          </div>
                          <CollapsibleTrigger className="flex-1 min-w-0 flex items-center gap-2 cursor-pointer [&[data-state=open]_.chevron-icon]:rotate-180">
                            <span className="font-medium text-foreground text-sm truncate">
                              {session.title?.replace(/^Session\s+\d+:\s*/, '') || 'Untitled'}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] shrink-0 ${difficultyColors[session.difficulty] || ''}`}
                            >
                              {session.difficulty}
                            </Badge>
                            {session.deliverableType !== 'none' && (
                              <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                            )}
                            <span className="text-[10px] text-muted-foreground shrink-0 ml-auto mr-1">
                              {session.durationMinutes > 0
                                ? formatDuration(session.durationMinutes)
                                : '-'}
                            </span>
                            <ChevronDown className="chevron-icon w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200" />
                          </CollapsibleTrigger>
                        </div>
                        {/* Collapsible content */}
                        <CollapsibleContent>
                          <div className="px-3 pb-3 pt-0 pl-14 space-y-2">
                            {/* Topic */}
                            {session.topic && (
                              <p className="text-xs text-muted-foreground">{session.topic}</p>
                            )}
                            {/* Guide */}
                            {session.guide && (
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Guide:</span>
                                <p className="text-xs text-foreground mt-0.5 whitespace-pre-wrap">{session.guide}</p>
                              </div>
                            )}
                            {/* Duration */}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>
                                {session.durationMinutes > 0
                                  ? formatDuration(session.durationMinutes)
                                  : '-'}
                              </span>
                            </div>
                            {/* Deliverable */}
                            {session.deliverableType !== 'none' && (
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <FileText className="w-3 h-3 shrink-0" />
                                <span>
                                  Deliverable: {session.deliverableTitle || 'Document'}
                                  {session.deliverableDescription && ` - ${session.deliverableDescription}`}
                                </span>
                              </div>
                            )}
                            {/* Resources */}
                            {session.resources && session.resources.length > 0 && (
                              <div className="mt-1">
                                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                                  <LinkIcon className="w-3 h-3" />
                                  Resources ({session.resources.length})
                                </span>
                                <div className="space-y-1 pl-4">
                                  {session.resources.map((r: any) => (
                                    <div key={r.id} className="text-xs text-muted-foreground flex items-center gap-1.5">
                                      <span className="text-foreground">{r.title}</span>
                                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">{r.type}</Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Rubric */}
                            {session.rubrics && session.rubrics.length > 0 && (
                              <div className="mt-1">
                                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                                  <BookOpen className="w-3 h-3" />
                                  Rubric ({session.rubrics.length} criteria)
                                </span>
                                <div className="space-y-1 pl-4">
                                  {session.rubrics.map((r: any) => (
                                    <div key={r.id} className="text-xs">
                                      <span className="text-foreground font-medium">{r.criteria}</span>
                                      {r.description && (
                                        <span className="text-muted-foreground"> - {r.description}</span>
                                      )}
                                      <span className="text-muted-foreground ml-1">(weight: {r.weight})</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <div className="space-y-6">
            {/* Clone Action */}
            <div className="bg-card border border-border rounded-lg p-5">
              {isOwn ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate({ to: '/creator/library' })}
                >
                  <Library className="w-4 h-4 mr-2" />
                  View in Library
                </Button>
              ) : (
                <Button
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                  onClick={handleCloneToLibrary}
                  disabled={isCloning}
                >
                  {isCloning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cloning...
                    </>
                  ) : (
                    <>
                      <Library className="w-4 h-4 mr-2" />
                      Add to Library
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Details */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    {template.teamSize === 1 ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Users className="w-4 h-4" />
                    )}
                    Type
                  </span>
                  <span className="text-foreground">
                    {template.teamSize === 1 ? 'Individual' : 'Group'}
                  </span>
                </div>
                {template.teamSize > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      Team Size
                    </span>
                    <span className="text-foreground">
                      {template.teamSize} members
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Sessions
                  </span>
                  <span className="text-foreground">
                    {template.sessionCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground shrink-0">
                    <Clock className="w-4 h-4" />
                    Total Duration
                  </span>
                  <span className="text-foreground">
                    {totalDuration > 0 ? formatDuration(totalDuration) : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Creator */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Published By
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center shrink-0">
                  <span className="text-violet-400 font-medium text-sm">
                    {template.creatorName?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {template.creatorName}{isOwn ? ' (you)' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Created date */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Created
              </h3>
              <p className="text-sm text-foreground">
                {new Date(template.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
