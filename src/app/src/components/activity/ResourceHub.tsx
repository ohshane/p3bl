import { useState } from 'react'
import { ChevronDown, ChevronUp, FileText, Link as LinkIcon, Video, Image, File, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

import type { Session, Resource } from '@/types'

interface ResourceHubProps {
  session: Session
}

export function ResourceHub({ session }: ResourceHubProps) {
  const [isGuideExpanded, setIsGuideExpanded] = useState(true)

  const getResourceIcon = (type: Resource['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-400" />
      case 'link':
        return <LinkIcon className="w-4 h-4 text-blue-400" />
      case 'video':
        return <Video className="w-4 h-4 text-purple-400" />
      case 'image':
        return <Image className="w-4 h-4 text-green-400" />
      default:
        return <File className="w-4 h-4 text-gray-400" />
    }
  }

  const getResourceAction = (type: Resource['type']) => {
    switch (type) {
      case 'video':
        return 'Play'
      default:
        return 'Open'
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Resource & Guide Hub</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Session Guide */}
        <div>
          <button
            onClick={() => setIsGuideExpanded(!isGuideExpanded)}
            className="w-full flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium">Session Guide</span>
            </div>
            {isGuideExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {isGuideExpanded && (
            <div className="mt-2 p-3 bg-muted/20 rounded-lg">
              <ScrollArea className="h-[200px]">
                <div className="prose prose-sm prose-invert max-w-none">
                  {session.guide.split('\n').map((paragraph, index) => {
                    if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                      return (
                        <p key={index} className="font-semibold text-foreground">
                          {paragraph.replace(/\*\*/g, '')}
                        </p>
                      )
                    }
                    if (paragraph.startsWith('- ')) {
                      return (
                        <li key={index} className="text-muted-foreground text-sm">
                          {paragraph.substring(2)}
                        </li>
                      )
                    }
                    if (paragraph.trim()) {
                      return (
                        <p key={index} className="text-muted-foreground text-sm">
                          {paragraph}
                        </p>
                      )
                    }
                    return <br key={index} />
                  })}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Resources */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <File className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Resources</span>
            <span className="text-xs text-muted-foreground">
              ({session.resources.length})
            </span>
          </div>

          {session.resources.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              <p>No resources for this session</p>
              <p className="text-xs mt-1">Your instructor hasn't added any materials yet</p>
            </div>
          ) : (
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {session.resources.map(resource => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {getResourceIcon(resource.type)}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {resource.title}
                        </p>
                        <span className="text-xs text-muted-foreground uppercase">
                          {resource.type}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 gap-1"
                      onClick={() => window.open(resource.url, '_blank')}
                    >
                      {getResourceAction(resource.type)}
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
