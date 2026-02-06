import { useState, useRef, useEffect } from 'react'
import { Send, Bot, Maximize2, X } from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface GroupChatPanelProps {
  projectId: string
  teamId?: string
  teamName?: string
}

export function GroupChatPanel({ teamId, teamName }: GroupChatPanelProps) {
  const [message, setMessage] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const expandedScrollRef = useRef<HTMLDivElement>(null)
  
  const { currentUser } = useAuthStore()
  const { getTeamMessages, sendMessage } = useChatStore()

  const messages = teamId ? getTeamMessages(teamId) : []

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Scroll expanded view to bottom
  useEffect(() => {
    if (isExpanded && expandedScrollRef.current) {
      expandedScrollRef.current.scrollTop = expandedScrollRef.current.scrollHeight
    }
  }, [messages, isExpanded])

  const handleSend = () => {
    if (!message.trim() || !teamId || !currentUser) return

    sendMessage(teamId, {
      teamId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatarUrl,
      senderType: 'user',
      content: message.trim(),
    })
    setMessage('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const renderMessages = (scrollAreaRef: React.RefObject<HTMLDivElement | null>, inModal = false) => (
    <ScrollArea className={cn("flex-1 min-h-0", inModal && "h-[50vh]")} viewportRef={scrollAreaRef}>
      <div className="space-y-4 p-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-3',
                msg.senderId === currentUser?.id && 'flex-row-reverse'
              )}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={msg.senderAvatar || undefined} />
                <AvatarFallback
                  className={cn(
                    'text-xs',
                    msg.senderType === 'ai'
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                      : 'bg-muted'
                  )}
                >
                  {msg.senderType === 'ai' ? (
                    <Bot className="h-4 w-4" />
                  ) : (
                    getInitials(msg.senderName)
                  )}
                </AvatarFallback>
              </Avatar>

              <div
                className={cn(
                  'max-w-[80%]',
                  msg.senderId === currentUser?.id && 'text-right'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      'text-xs font-medium',
                      msg.senderType === 'ai' ? 'text-purple-400' : 'text-muted-foreground'
                    )}
                  >
                    {msg.senderName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                  </span>
                </div>

                <div
                  className={cn(
                    'rounded-2xl px-4 py-2 text-sm',
                    msg.senderId === currentUser?.id
                      ? 'bg-cyan-600 text-white'
                      : msg.senderType === 'ai'
                      ? 'bg-purple-500/10 text-foreground border border-purple-500/20'
                      : 'bg-muted text-foreground'
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* Artifact Card */}
                {msg.artifactCard && (
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg border text-left">
                    <p className="text-sm font-medium truncate">
                      {msg.artifactCard.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      From {msg.artifactCard.sessionName}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  )

  const renderInput = () => (
    <div className="p-3 shrink-0 mt-auto">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-2">
        <Input
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
        />
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
            "bg-primary hover:bg-primary/90 text-primary-foreground",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )

  if (!teamId) {
    return (
      <Card className="h-[500px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No team assigned yet</p>
      </Card>
    )
  }

  return (
    <>
      <Card className="h-[500px] flex flex-col pb-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">
            Group Chat{teamName ? ` (${teamName})` : ''}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsExpanded(true)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 pb-0 overflow-hidden min-h-0">
          {renderMessages(scrollRef, false)}
          {renderInput()}
        </CardContent>
      </Card>

      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent
          className="max-w-5xl h-[80vh] flex flex-col"
          overlayClassName="backdrop-blur-sm"
          showCloseButton={false}
        >
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>Group Chat{teamName ? ` (${teamName})` : ''}</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogHeader>
          <div className="flex-1 flex flex-col overflow-hidden -mx-6">
            {renderMessages(expandedScrollRef, true)}
            {renderInput()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
