import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Library, Plus, Search, Loader2, BookOpen, Trash2, Calendar, Clock, Rocket } from 'lucide-react'
import { toast } from 'sonner'
import { format, addMinutes } from 'date-fns'
import { useAuthStore } from '@/stores/authStore'
import { getLibraryTemplates, deleteProject, deployTemplate } from '@/server/api/projects'
import { useCreatorStore } from '@/stores/creatorStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Format duration for display
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`
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

export function CreatorLibrary() {
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()
  const { fetchProjects } = useCreatorStore()
  const [templates, setTemplates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)

  // Deploy modal state
  const [deployTarget, setDeployTarget] = useState<any | null>(null)
  const [deployStartDate, setDeployStartDate] = useState('')
  const [deployEndDate, setDeployEndDate] = useState('')
  const [isDeploying, setIsDeploying] = useState(false)

  useEffect(() => {
    async function fetchTemplates() {
      if (!currentUser?.id) return
      setIsLoading(true)
      try {
        const result = await getLibraryTemplates({ data: { creatorId: currentUser.id } })
        if (result.success) {
          setTemplates(result.templates || [])
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemplates()
  }, [currentUser?.id])

  const filteredTemplates = templates.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Compute total duration from template sessions
  const templateTotalMinutes = useMemo(() => {
    if (!deployTarget?.sessions) return 0
    return deployTarget.sessions.reduce((sum: number, s: any) => sum + (s.durationMinutes || 0), 0)
  }, [deployTarget])

  const handleUseTemplate = (template: any) => {
    // Default start: now, rounded up to nearest 15 min
    const now = new Date()
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0)
    const startStr = format(now, "yyyy-MM-dd'T'HH:mm")

    // Compute end from session durations
    const totalMins = (template.sessions || []).reduce(
      (sum: number, s: any) => sum + (s.durationMinutes || 0), 0
    )
    const end = addMinutes(now, totalMins || 60)
    const endStr = format(end, "yyyy-MM-dd'T'HH:mm")

    setDeployStartDate(startStr)
    setDeployEndDate(endStr)
    setDeployTarget(template)
  }

  const handleStartDateChange = (value: string) => {
    setDeployStartDate(value)
    // Auto-recompute end date from start + total session durations
    if (value && templateTotalMinutes > 0) {
      const start = new Date(value)
      const end = addMinutes(start, templateTotalMinutes)
      setDeployEndDate(format(end, "yyyy-MM-dd'T'HH:mm"))
    }
  }

  const handleDeploy = async () => {
    if (!deployTarget || !currentUser?.id || !deployStartDate || !deployEndDate) return
    setIsDeploying(true)
    try {
      const result = await deployTemplate({
        data: {
          templateId: deployTarget.id,
          creatorId: currentUser.id,
          startDate: new Date(deployStartDate).toISOString(),
          endDate: new Date(deployEndDate).toISOString(),
        },
      })
      if (result.success && result.projectId) {
        toast.success('Project deployed from template!')
        setDeployTarget(null)
        // Refresh projects so the new one appears
        await fetchProjects(currentUser.id)
        navigate({ to: '/creator/project/$projectId', params: { projectId: result.projectId } })
      } else {
        toast.error(result.error || 'Failed to deploy template')
      }
    } catch (error) {
      console.error('Deploy template error:', error)
      toast.error('Failed to deploy template')
    } finally {
      setIsDeploying(false)
    }
  }

  const handleDeleteTemplate = async () => {
    if (!deleteTarget) return
    try {
      const result = await deleteProject({ data: { projectId: deleteTarget.id } })
      if (result.success) {
        setTemplates(prev => prev.filter(t => t.id !== deleteTarget.id))
        toast.success('Template removed from library')
      } else {
        toast.error('Failed to remove template')
      }
    } catch (error) {
      console.error('Failed to delete template:', error)
      toast.error('Failed to remove template')
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Library className="w-8 h-8 text-cyan-500" />
            Project Library
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your project templates and reuse proven structures
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 bg-card border-border"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-500 mb-4" />
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card className="border-dashed py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No templates found</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            {searchQuery 
              ? `No templates matching "${searchQuery}"`
              : "You haven't added any templates yet. Click the library icon on any project card to save it as a template."}
          </p>
          {!searchQuery && (
            <Button onClick={() => navigate({ to: '/creator' })} variant="outline">
              Go to Dashboard
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="bg-card border-border hover:border-cyan-500/50 transition-all group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-500 border-none">
                    Template
                  </Badge>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {template.sessionCount} sessions
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget({ id: template.id, title: template.title })}
                      className="h-7 w-7 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                      title="Remove template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <h3
                  className="text-lg font-semibold text-foreground line-clamp-1 group-hover:text-cyan-500 transition-colors cursor-pointer"
                  onClick={() => navigate({ to: '/creator/library/$id', params: { id: template.id } })}
                >
                  {template.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {template.description || template.drivingQuestion}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mt-4">
                  <Button 
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                    onClick={() => handleUseTemplate(template)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Use Template
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-none"
                    onClick={() => navigate({ to: '/creator/library/$id', params: { id: template.id } })}
                  >
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Remove Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove "{deleteTarget?.title}" from your library? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTemplate}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deploy Template Dialog */}
      <Dialog open={!!deployTarget} onOpenChange={(open) => { if (!open) setDeployTarget(null) }}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-cyan-500" />
              Deploy Project
            </DialogTitle>
            <DialogDescription>
              Set the start and end time to create a live project from this template.
            </DialogDescription>
          </DialogHeader>

          {deployTarget && (
            <div className="space-y-5 py-2">
              {/* Template summary */}
              <div className="p-3 bg-muted/40 rounded-lg border border-border">
                <p className="font-medium text-foreground text-sm">{deployTarget.title}</p>
                <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                  <span>{deployTarget.sessionCount} sessions</span>
                  {templateTotalMinutes > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(templateTotalMinutes)}
                    </span>
                  )}
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  Start Date & Time
                </label>
                <Input
                  type="datetime-local"
                  value={deployStartDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="bg-background border-border"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  End Date & Time
                </label>
                <Input
                  type="datetime-local"
                  value={deployEndDate}
                  min={deployStartDate}
                  onChange={(e) => setDeployEndDate(e.target.value)}
                  className="bg-background border-border"
                />
              </div>

              {/* Duration display */}
              {deployStartDate && deployEndDate && (
                <div className="flex items-center gap-3 px-3 py-2.5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/20">
                  <Clock className="w-4 h-4 text-cyan-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">
                      {formatDuration(
                        Math.max(0, Math.round(
                          (new Date(deployEndDate).getTime() - new Date(deployStartDate).getTime()) / 60000
                        ))
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      total project duration
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeployTarget(null)} disabled={isDeploying}>
              Cancel
            </Button>
            <Button
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
              onClick={handleDeploy}
              disabled={isDeploying || !deployStartDate || !deployEndDate}
            >
              {isDeploying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Deploy Project
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
