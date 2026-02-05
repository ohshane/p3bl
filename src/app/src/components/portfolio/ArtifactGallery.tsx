import { useState } from 'react'
import { Grid, List, FileText, Code, FileCode, ExternalLink, Share2, Download, CheckCircle, Clock, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, format } from 'date-fns'
import { toast } from 'sonner'
import type { ShowcaseLinkExpiration } from '@/types'

// Artifact type from API
interface UserArtifact {
  id: string
  title: string
  contentType: string
  status: string
  projectId: string
  projectTitle: string
  sessionId: string
  sessionTitle: string
  latestVersion: string | null
  createdAt: string
  updatedAt: string
}

interface ArtifactGalleryProps {
  artifacts: UserArtifact[]
}

export function ArtifactGallery({ artifacts }: ArtifactGalleryProps) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [selectedArtifact, setSelectedArtifact] = useState<UserArtifact | null>(null)
  
  // Get unique projects from artifacts
  const projects = Array.from(new Set(artifacts.map(a => a.projectId))).map(projectId => {
    const artifact = artifacts.find(a => a.projectId === projectId)!
    return {
      id: projectId,
      title: artifact.projectTitle,
    }
  })
  
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set(projects.map(p => p.id)))

  // Group artifacts by project
  const artifactsByProject = artifacts.reduce((acc, artifact) => {
    if (!acc[artifact.projectId]) {
      acc[artifact.projectId] = []
    }
    acc[artifact.projectId].push(artifact)
    return acc
  }, {} as Record<string, UserArtifact[]>)

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId)
    } else {
      newExpanded.add(projectId)
    }
    setExpandedProjects(newExpanded)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        )
      case 'submitted':
      case 'under_review':
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Under Review
          </Badge>
        )
      case 'needs_revision':
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Needs Revision
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            Draft
          </Badge>
        )
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'code':
        return <Code className="w-5 h-5 text-cyan-400" />
      case 'markdown':
        return <FileCode className="w-5 h-5 text-purple-400" />
      default:
        return <FileText className="w-5 h-5 text-blue-400" />
    }
  }

  const handleShareShowcase = (artifact: UserArtifact) => {
    setSelectedArtifact(artifact)
    setShowShareDialog(true)
  }

  const generateShowcaseLink = (expiration: ShowcaseLinkExpiration) => {
    // Mock link generation
    const link = `https://p3bl.app/showcase/${selectedArtifact?.id}?exp=${expiration}`
    navigator.clipboard.writeText(link)
    toast.success('Link copied to clipboard!', {
      description: `Expires: ${expiration === 'never' ? 'Never' : expiration}`,
    })
    setShowShareDialog(false)
  }

  if (artifacts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No artifacts yet</h3>
        <p className="text-muted-foreground mb-4">
          Complete your first deliverable to see it here
        </p>
        <Button variant="outline" asChild>
          <a href="/workspace">Go to Workspace</a>
        </Button>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          {artifacts.length} artifact{artifacts.length !== 1 ? 's' : ''} across {projects.length} project{projects.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Artifacts by Project */}
      <div className="space-y-6">
        {projects
          .filter(project => artifactsByProject[project.id]?.length > 0)
          .map(project => (
            <Collapsible
              key={project.id}
              open={expandedProjects.has(project.id)}
              onOpenChange={() => toggleProject(project.id)}
            >
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center gap-3 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                  {expandedProjects.has(project.id) ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div className="text-left">
                    <h3 className="font-semibold">{project.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {artifactsByProject[project.id].length} artifact{artifactsByProject[project.id].length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </button>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className={cn(
                  'mt-4',
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
                    : 'space-y-3'
                )}>
                  {artifactsByProject[project.id]
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                    .map(artifact => (
                      <ArtifactCard
                        key={artifact.id}
                        artifact={artifact}
                        viewMode={viewMode}
                        onShare={() => handleShareShowcase(artifact)}
                        getStatusBadge={getStatusBadge}
                        getTypeIcon={getTypeIcon}
                      />
                    ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Showcase Link</DialogTitle>
            <DialogDescription>
              Generate a public link to share this artifact. Choose an expiration time.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            <Button variant="outline" onClick={() => generateShowcaseLink('7days')}>
              7 Days
            </Button>
            <Button variant="outline" onClick={() => generateShowcaseLink('30days')}>
              30 Days
            </Button>
            <Button variant="outline" onClick={() => generateShowcaseLink('90days')}>
              90 Days
            </Button>
            <Button variant="outline" onClick={() => generateShowcaseLink('never')}>
              Never Expires
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowShareDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface ArtifactCardProps {
  artifact: UserArtifact
  viewMode: 'list' | 'grid'
  onShare: () => void
  getStatusBadge: (status: string) => React.ReactNode
  getTypeIcon: (type: string) => React.ReactNode
}

function ArtifactCard({ artifact, viewMode, onShare, getStatusBadge, getTypeIcon }: ArtifactCardProps) {
  if (viewMode === 'grid') {
    return (
      <Card className="hover:border-cyan-500/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              {getTypeIcon(artifact.contentType)}
            </div>
            <div className="min-w-0">
              <h4 className="font-medium truncate">{artifact.title}</h4>
              <p className="text-xs text-muted-foreground">
                {artifact.sessionTitle}
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            {getStatusBadge(artifact.status)}
            <span className="text-xs text-muted-foreground">
              {artifact.latestVersion 
                ? formatDistanceToNow(new Date(artifact.updatedAt), { addSuffix: true })
                : 'Draft'}
            </span>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="ghost" size="sm" className="flex-1 gap-1">
              <ExternalLink className="w-3 h-3" />
              View
            </Button>
            <Button variant="ghost" size="sm" onClick={onShare}>
              <Share2 className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:border-cyan-500/50 transition-colors">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
          {getTypeIcon(artifact.contentType)}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{artifact.title}</h4>
          <p className="text-sm text-muted-foreground truncate">
            {artifact.sessionTitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {getStatusBadge(artifact.status)}
          <span className="text-sm text-muted-foreground">
            {artifact.latestVersion 
              ? format(new Date(artifact.updatedAt), 'MMM d, yyyy HH:mm')
              : 'Draft'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1">
            <ExternalLink className="w-4 h-4" />
            View
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Share2 className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onShare}>
                Create Showcase Link
              </DropdownMenuItem>
              <DropdownMenuItem>
                Share to Team Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="sm">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
