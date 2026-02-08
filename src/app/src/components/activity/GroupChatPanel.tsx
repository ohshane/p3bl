import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Maximize2, X, Loader2 } from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface GroupChatPanelProps {
  projectId: string
  teamName?: string
}

export function GroupChatPanel({ projectId, teamName }: GroupChatPanelProps) {
  const [message, setMessage] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const expandedScrollRef = useRef<HTMLDivElement>(null)
  
  const { currentUser } = useAuthStore()
  const {
    getOrCreateRoom,
    getRoomForProject,
    getRoomMessages,
    fetchRoomMessages,
    sendMessage: sendChatMessage,
    isLoadingRoom,
    isLoadingMessages,
  } = useChatStore()

  const room = getRoomForProject(projectId)
  const messages = room ? getRoomMessages(room.id) : []

  const prevMessageCountRef = useRef(0)

  // Initialize room and load messages on mount
  useEffect(() => {
    if (!currentUser || !projectId) return

    async function initRoom() {
      const resolvedRoom = await getOrCreateRoom(projectId, currentUser!.id, teamName ? `${teamName} Chat` : undefined)
      if (resolvedRoom) {
        await fetchRoomMessages(resolvedRoom.id)
      }
    }

    initRoom()
  }, [projectId, currentUser])

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!room) return

    const interval = setInterval(() => {
      fetchRoomMessages(room.id)
    }, 3000)

    return () => clearInterval(interval)
  }, [room, fetchRoomMessages])

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
    if (isExpanded && expandedScrollRef.current) {
      expandedScrollRef.current.scrollTop = expandedScrollRef.current.scrollHeight
    }
  }, [isExpanded])

  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      scrollToBottom()
    }
    prevMessageCountRef.current = messages.length
  }, [messages.length, scrollToBottom])

  // Scroll expanded view to bottom on open
  useEffect(() => {
    if (isExpanded) {
      // Small delay to let the dialog render
      setTimeout(() => {
        if (expandedScrollRef.current) {
          expandedScrollRef.current.scrollTop = expandedScrollRef.current.scrollHeight
        }
      }, 50)
    }
  }, [isExpanded])

  const handleSend = () => {
    if (!message.trim() || !room || !currentUser) return

    sendChatMessage(room.id, {
      roomId: room.id,
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

  const renderMessages = (scrollAreaRef: React.RefObject<HTMLDivElement | null>, inModal = false) => (
    <ScrollArea className={cn("flex-1 min-h-0", inModal && "h-[50vh]")} viewportRef={scrollAreaRef}>
      <div className="space-y-4 p-4">
        {isLoadingMessages && messages.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={cn(
                'flex flex-col',
                msg.senderId === currentUser?.id ? 'items-end' : 'items-start'
              )}
            >
              {msg.senderId !== currentUser?.id && (
                <span
                  className={cn(
                    'text-[11px] font-medium mb-0.5 ml-1',
                    msg.senderType === 'ai' ? 'text-purple-400' : 'text-muted-foreground'
                  )}
                >
                  {msg.senderName}
                </span>
              )}

              <div
                className={cn(
                  'rounded-2xl px-3 py-1.5 text-sm w-fit max-w-[80%]',
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
                <div className={cn(
                  "mt-1 p-3 bg-muted/50 rounded-lg border text-left max-w-[80%]",
                  msg.senderId === currentUser?.id && 'ml-auto'
                )}>
                  <p className="text-sm font-medium truncate">
                    {msg.artifactCard.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    From {msg.artifactCard.sessionName}
                  </p>
                </div>
              )}
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
          disabled={!room}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || !room}
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

  if (isLoadingRoom && !room) {
    return (
      <Card className="h-[500px] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </Card>
    )
  }

  const chatTitle = `Group Chat${teamName ? ` (${teamName})` : ''}`

  return (
    <>
      <Card className="h-[500px] flex flex-col pb-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">
            {chatTitle}
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
            <DialogTitle>{chatTitle}</DialogTitle>
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
