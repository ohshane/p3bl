import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toDataURL } from 'qrcode'
import {
  Copy,
  QrCode,
  RefreshCw,
  Users,
  Calendar,
  MoreVertical,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle2,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'

import type { CreatorProject, CreatorProjectStatus } from '@/types'
import { useCreatorStore } from '@/stores/creatorStore'
import { safeFormatDate, getProjectTimeStatus } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  const { deleteProject, regenerateJoinCode } = useCreatorStore()
  
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)

  // Calculate status from dates (like Kaggle)
  const status: CreatorProjectStatus = getProjectTimeStatus(project.startDate, project.endDate)

  const statusColors: Record<CreatorProjectStatus, string> = {
    scheduled: 'bg-muted text-muted-foreground',
    opened: 'bg-emerald-600 text-emerald-50',
    closed: 'bg-blue-600 text-blue-50',
  }

  const statusLabels: Record<CreatorProjectStatus, string> = {
    scheduled: 'Scheduled',
    opened: 'Opened',
    closed: 'Closed',
  }

  const riskColors = {
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
  }

  const riskIcons = {
    green: <CheckCircle2 className="w-4 h-4" />,
    yellow: <AlertCircle className="w-4 h-4" />,
    red: <AlertCircle className="w-4 h-4" />,
  }

  const baseUrl = (import.meta.env.VITE_BASE_URL ?? (typeof window !== 'undefined' ? window.location.origin : ''))
    .replace(/\/$/, '')
  const joinPath = `/explorer?joinCode=${encodeURIComponent(project.joinCode)}`
  const joinUrl = baseUrl
    ? `${baseUrl}/signin?redirect_uri=${encodeURIComponent(joinPath)}`
    : ''

  const handleCopyCode = () => {
    navigator.clipboard.writeText(project.joinCode)
    toast.success('Join code copied to clipboard')
  }

  useEffect(() => {
    if (!showQRDialog) {
      setQrCodeUrl(null)
      return
    }

    if (!joinUrl) {
      setQrCodeUrl(null)
      return
    }

    let isActive = true

    toDataURL(joinUrl, {
      width: 512,
      margin: 1,
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (isActive) {
          setQrCodeUrl(url)
        }
      })
      .catch(() => {
        if (isActive) {
          setQrCodeUrl(null)
        }
      })

    return () => {
      isActive = false
    }
  }, [showQRDialog, joinUrl])

  const handleRegenerateCode = async () => {
    const newCode = await regenerateJoinCode(project.id, project.creatorId)
    if (newCode) {
      toast.success('Join code regenerated')
    } else {
      toast.error('Failed to regenerate join code')
    }
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

  const handleViewDetails = () => {
    navigate({ to: '/creator/project/$projectId', params: { projectId: project.id } })
  }

  const teamsWithRisk = project.teams.filter(t => t.riskLevel === 'red' || t.riskLevel === 'yellow')

  return (
    <>
      <Card className="bg-card border-border hover:border-border/70 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={statusColors[status]}>
                  {statusLabels[status]}
                </Badge>
                {status === 'opened' && (
                  <span className={`flex items-center gap-1 text-sm ${riskColors[project.riskLevel]}`}>
                    {riskIcons[project.riskLevel]}
                    {project.riskLevel === 'red' && 'At Risk'}
                    {project.riskLevel === 'yellow' && 'Attention'}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-foreground line-clamp-1">
                {project.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {project.description}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border">
                <DropdownMenuItem onClick={handleViewDetails} className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {status === 'opened' && (
                  <DropdownMenuItem onClick={handleMonitor} className="cursor-pointer">
                    <Eye className="w-4 h-4 mr-2" />
                    Monitor Project
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="cursor-pointer text-red-400 focus:text-red-400"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent>
          {/* Join Code Section */}
          <div className="bg-muted/50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">Join Code</span>
                <div className="font-mono text-lg font-bold text-cyan-400">
                  {project.joinCode}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyCode}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowQRDialog(true)}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <QrCode className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRegenerateCode}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Project Info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Teams
              </span>
              <span className="text-foreground">
                {project.teams.length} / {Math.ceil(project.totalParticipants / project.teamSize)}
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
              <span>Duration</span>
              <span className="text-foreground">
                {safeFormatDate(project.startDate, 'MMM d HH:mm', 'TBD')} - {safeFormatDate(project.endDate, 'MMM d HH:mm', 'TBD')}
              </span>
            </div>
          </div>

          {/* Risk Warning */}
          {status === 'opened' && teamsWithRisk.length > 0 && (
            <div className="mt-4 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400">
              {teamsWithRisk.length} team(s) need attention
            </div>
          )}

          {/* Action Button */}
          {status === 'opened' && (
            <Button
              onClick={handleMonitor}
              className="w-full mt-4 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-600/50"
            >
              <Eye className="w-4 h-4 mr-2" />
              Monitor Progress
            </Button>
          )}
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent
          className="bg-card border-border sm:max-w-2xl"
          overlayClassName="backdrop-blur-sm"
        >
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
            <DialogDescription>
              Share this QR code with learners to join the project
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-8">
            <div className="w-64 h-64 bg-background rounded-lg flex items-center justify-center border border-border">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt={`Join ${project.name}`}
                  className="w-full h-full object-contain p-3"
                />
              ) : (
                <QrCode className="w-44 h-44 text-muted-foreground" />
              )}
            </div>
            <p className="mt-5 font-mono text-3xl font-bold text-cyan-400">
              {project.joinCode}
            </p>
          </div>
          <DialogFooter />
        </DialogContent>
      </Dialog>

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

    </>
  )
}
