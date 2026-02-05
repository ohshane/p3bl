import { useState, useRef, useEffect } from 'react'
import { Send, Bot } from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'
import { useProjectStore } from '@/stores/projectStore'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface GroupChatProps {
  projectId: string
}

export function GroupChat({ projectId }: GroupChatProps) {
  const [message, setMessage] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const { currentUser } = useAuthStore()
  const { userProjects } = useProjectStore()
  const { getTeamMessages, sendMessage } = useChatStore()

  // Find the project in user's projects to get team info
  const project = userProjects.find(p => p.id === projectId)
  const teamId = project?.teamId
  const teamName = project?.teamName
  
  const messages = teamId ? getTeamMessages(teamId) : []

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    if (!message.trim() || !teamId || !currentUser) return

    sendMessage(teamId, {
      teamId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
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

  if (!teamId || !teamName) return null

  return (
    <Card className="flex flex-col h-[400px]">
      <CardHeader className="py-3 px-4 border-b shrink-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <span>Team Chat</span>
          <span className="text-xs font-normal text-muted-foreground">
            - {teamName}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden min-h-0">
        {/* Messages */}
        <ScrollArea className="flex-1 min-h-0" viewportRef={scrollRef}>
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
                      'max-w-[75%]',
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
                        {msg.artifactCard.snippet && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {msg.artifactCard.snippet}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t shrink-0">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!message.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
