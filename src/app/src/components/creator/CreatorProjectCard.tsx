import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  User,
  Users,
  Calendar,
  Clock,
  Trash2,
  Eye,
  Pencil,
  Play,
  LogIn,
  Loader2,
  UserRoundCog,
  Search,
  Shield,
  PenTool,
  Rocket,
} from 'lucide-react'
import { toast } from 'sonner'

import type { CreatorProject, CreatorProjectStatus } from '@/types'
import { useCreatorStore } from '@/stores/creatorStore'
import { useAuthStore } from '@/stores/authStore'
import { joinProject, updateProject, searchDelegateUsers, delegateProject } from '@/server/api/projects'
import { updateSession } from '@/server/api/sessions'
import { safeFormatDate, getProjectTimeStatus, getProjectProgress, getProjectTimeInfo } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { JoinCode } from '@/components/creator/JoinCode'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CreatorProjectCardProps {
  project: CreatorProject
}

export function CreatorProjectCard({ project }: CreatorProjectCardProps) {
  const navigate = useNavigate()
  const { deleteProject, fetchProjects } = useCreatorStore()
  const { currentUser } = useAuthStore()
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDelegateDialog, setShowDelegateDialog] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [isDelegating, setIsDelegating] = useState(false)
  const [, setTick] = useState(0)

  // Delegate search state
  const [delegateSearch, setDelegateSearch] = useState('')
  const [delegateResults, setDelegateResults] = useState<Array<{
    id: string
    name: string
    email: string
    role: string
    avatarUrl: string | null
  }>>([])
  const [selectedDelegate, setSelectedDelegate] = useState<typeof delegateResults[number] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const userRole = currentUser?.role
  const showJoinButton = userRole === 'admin' || userRole === 'pioneer'

  // Force re-render every second to update progress and time info
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Calculate status from dates (recalculated every second)
  const status: CreatorProjectStatus = getProjectTimeStatus(project.startDate, project.endDate)
  const progress = getProjectProgress(project.startDate, project.endDate)
  const timeInfo = getProjectTimeInfo(project.startDate, project.endDate)

  const statusColors: Record<CreatorProjectStatus, string> = {
    scheduled: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    opened: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30',
    closed: 'bg-green-500/10 text-green-500 border-green-500/30',
  }

  const statusLabels: Record<CreatorProjectStatus, string> = {
    scheduled: 'Scheduled',
    opened: 'Opened',
    closed: 'Closed',
  }

  const handleDelete = async () => {
    const success = await deleteProject(project.id)
    setShowDeleteDialog(false)
    if (success) {
      toast.success('Project deleted')
    } else {
      toast.error('Failed to delete project')
    }
  }

  const handleMonitor = () => {
    navigate({ to: '/creator/project/$projectId/monitor', params: { projectId: project.id } })
  }

  const handleStartNow = async () => {
    setIsStarting(true)
    try {
      const now = new Date()
      const updates: { startDate: string; endDate?: string } = {
        startDate: now.toISOString(),
      }
      
      // Calculate time shift amount
      let timeShift = 0
      if (project.startDate) {
        const originalStart = new Date(project.startDate)
        timeShift = now.getTime() - originalStart.getTime()
        
        // If there's an original endDate, shift it by the same amount
        if (project.endDate) {
          const originalEnd = new Date(project.endDate)
          const newEndDate = new Date(originalEnd.getTime() + timeShift)
          updates.endDate = newEndDate.toISOString()
        }
      }
      
      const result = await updateProject({
        data: {
          projectId: project.id,
          updates,
        },
      })
      
      if (result.success) {
        // Shift all session times by the same amount
        if (timeShift !== 0 && project.sessions.length > 0) {
          await Promise.all(
            project.sessions.map(async (session) => {
              const sessionUpdates: { startDate?: string; endDate?: string } = {}
              
              if (session.startDate) {
                const newStartDate = new Date(new Date(session.startDate).getTime() + timeShift)
                sessionUpdates.startDate = newStartDate.toISOString()
              }
              
              if (session.endDate) {
                const newEndDate = new Date(new Date(session.endDate).getTime() + timeShift)
                sessionUpdates.endDate = newEndDate.toISOString()
              }
              
              if (Object.keys(sessionUpdates).length > 0) {
                await updateSession({
                  data: {
                    sessionId: session.id,
                    updates: sessionUpdates,
                  },
                })
              }
            })
          )
        }
        
        toast.success('Project started!')
        await fetchProjects(project.creatorId)
      } else {
        toast.error('Failed to start project')
      }
    } catch (error) {
      toast.error('Failed to start project')
    } finally {
      setIsStarting(false)
    }
  }

  const handleViewDetails = () => {
    navigate({ to: '/creator/project/$projectId', params: { projectId: project.id } })
  }

  const handleJoinAsExplorer = async () => {
    if (!currentUser?.id || !project.joinCode) return
    setIsJoining(true)
    try {
      const result = await joinProject({ data: { userId: currentUser.id, code: project.joinCode } })
      if (result.success) {
        const alreadyMember = 'message' in result && result.message === 'Already a member of this project'
        if (!alreadyMember) {
          toast.success('Joined project as explorer!')
        }
        navigate({ to: '/explorer/project/$projectId', params: { projectId: result.projectId || project.id } })
      } else {
        toast.error(result.error || 'Failed to join project')
      }
    } catch (error) {
      toast.error('Failed to join project')
    } finally {
      setIsJoining(false)
    }
  }

  // Delegate search with debounce
  const handleDelegateSearch = useCallback((value: string) => {
    setDelegateSearch(value)
    setSelectedDelegate(null)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (value.trim().length < 2) {
      setDelegateResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const result = await searchDelegateUsers({
          data: { search: value.trim(), excludeUserId: currentUser?.id },
        })
        if (result.success) {
          setDelegateResults(result.users)
        } else {
          setDelegateResults([])
        }
      } catch {
        setDelegateResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }, [currentUser?.id])

  const handleDelegate = async () => {
    if (!selectedDelegate || !currentUser?.id) return
    setIsDelegating(true)
    try {
      const result = await delegateProject({
        data: {
          projectId: project.id,
          currentCreatorId: currentUser.id,
          newCreatorId: selectedDelegate.id,
        },
      })
      if (result.success) {
        toast.success(result.message || 'Project delegated successfully')
        setShowDelegateDialog(false)
        setDelegateSearch('')
        setDelegateResults([])
        setSelectedDelegate(null)
        await fetchProjects(currentUser.id)
      } else {
        toast.error(result.error || 'Failed to delegate project')
      }
    } catch {
      toast.error('Failed to delegate project')
    } finally {
      setIsDelegating(false)
    }
  }

  const handleCloseDelegateDialog = (open: boolean) => {
    setShowDelegateDialog(open)
    if (!open) {
      setDelegateSearch('')
      setDelegateResults([])
      setSelectedDelegate(null)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-3 h-3" />
      case 'creator':
        return <PenTool className="w-3 h-3" />
      case 'pioneer':
        return <Rocket className="w-3 h-3" />
      default:
        return null
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'creator':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'pioneer':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      default:
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
    }
  }

  const teamsWithRisk = project.teams.filter(t => t.riskLevel === 'red' || t.riskLevel === 'yellow')

  return (
    <>
      <Card className="bg-card border-border transition-all">
        <CardHeader className="pb-3">
          {/* Top row: Status badge and action icons */}
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className={`text-[10px] uppercase font-bold py-0 h-5 px-2 ${statusColors[status]}`}>
              {statusLabels[status]}
            </Badge>
            
            {/* Right: Edit, Delegate, and Delete icons */}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleViewDetails}
                className="h-8 w-8 text-muted-foreground hover:text-cyan-500 hover:bg-cyan-500/10"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDelegateDialog(true)}
                className="h-8 w-8 text-muted-foreground hover:text-orange-400 hover:bg-orange-500/10"
                title="Delegate project"
              >
                <UserRoundCog className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
                className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Title and description - full width */}
          <h3 
            className="text-lg font-semibold text-foreground line-clamp-1 hover:text-cyan-500 transition-colors cursor-pointer w-full"
            onClick={handleViewDetails}
          >
            {project.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1 w-full">
            {project.description}
          </p>
        </CardHeader>

        <CardContent>
          {/* Join Code Section */}
          <div className="mb-4">
            <JoinCode
              joinCode={project.joinCode}
              projectId={project.id}
              creatorId={project.creatorId}
              projectName={project.name}
              size="sm"
            />
          </div>

          {/* Project Info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-2">
                {project.teamSize === 1 ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Users className="w-4 h-4" />
                )}
                Type
              </span>
              <span className="text-foreground">
                {project.teamSize === 1 ? 'Individual' : 'Group'}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Sessions
              </span>
              <span className="text-foreground">{project.sessions.length} sessions</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Duration
              </span>
              <span className="text-foreground">
                {safeFormatDate(project.startDate, 'MMM d HH:mm', 'TBD')} - {safeFormatDate(project.endDate, 'MMM d HH:mm', 'TBD')}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-5 mb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>{timeInfo.elapsed} elapsed</span>
              <span>{timeInfo.remaining} left</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Risk Warning */}
          {status === 'opened' && teamsWithRisk.length > 0 && (
            <div className="mt-4 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400">
              {teamsWithRisk.length} team(s) need attention
            </div>
          )}

          {/* Action Buttons */}
          {status === 'scheduled' && (
            <Button
              onClick={handleStartNow}
              disabled={isStarting}
              className="w-full mt-4 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/50"
            >
              <Play className="w-4 h-4 mr-2" />
              {isStarting ? 'Starting...' : 'Start Now'}
            </Button>
          )}
          {status === 'opened' && (
            <Button
              onClick={handleMonitor}
              className="w-full mt-4 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-600/50"
            >
              <Eye className="w-4 h-4 mr-2" />
              Monitor Progress
            </Button>
          )}
          {showJoinButton && status !== 'closed' && (
            <Button
              onClick={handleJoinAsExplorer}
              disabled={isJoining}
              className="w-full mt-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-600/50"
            >
              {isJoining ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4 mr-2" />
              )}
              {isJoining ? 'Joining...' : 'Join as Explorer'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{project.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delegate Project Dialog */}
      <Dialog open={showDelegateDialog} onOpenChange={handleCloseDelegateDialog}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delegate Project</DialogTitle>
            <DialogDescription>
              Transfer ownership of "{project.name}" to another user. This will remove the project from your dashboard.
            </DialogDescription>
          </DialogHeader>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={delegateSearch}
              onChange={(e) => handleDelegateSearch(e.target.value)}
              className="pl-10 bg-background border-border"
              autoFocus
            />
          </div>

          {/* Search Results */}
          <div className="min-h-[200px] max-h-[300px] overflow-y-auto">
            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isSearching && delegateSearch.trim().length < 2 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Type at least 2 characters to search
              </div>
            )}

            {!isSearching && delegateSearch.trim().length >= 2 && delegateResults.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No users found
              </div>
            )}

            {!isSearching && delegateResults.length > 0 && (
              <div className="space-y-1">
                {delegateResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedDelegate(user)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      selectedDelegate?.id === user.id
                        ? 'bg-cyan-500/10 border border-cyan-500/30'
                        : 'hover:bg-muted/50 border border-transparent'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <span className="text-foreground font-medium text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Badge className={`${getRoleBadgeColor(user.role)} gap-1 text-[10px] shrink-0`}>
                      {getRoleIcon(user.role)}
                      {user.role}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleCloseDelegateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDelegate}
              disabled={!selectedDelegate || isDelegating}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isDelegating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Delegating...
                </>
              ) : (
                'Delegate'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  )
}
