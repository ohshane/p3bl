import { useEffect, useRef, useState } from 'react'
import { Bot, X, Minimize2, Send } from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

export function FloatingBot() {
  const [message, setMessage] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const { currentUser } = useAuthStore()
  const {
    isFloatingBotOpen,
    floatingBotMessages,
    hasShownInitialGreeting,
    isBotTyping,
    toggleFloatingBot,
    closeFloatingBot,
    sendBotMessage,
    markInitialGreetingShown,
  } = useChatStore()

  // Auto-open bot after 3 seconds on first visit
  useEffect(() => {
    if (!hasShownInitialGreeting) {
      const timer = setTimeout(() => {
        markInitialGreetingShown()
        toggleFloatingBot()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [hasShownInitialGreeting, markInitialGreetingShown, toggleFloatingBot])

  // Scroll to bottom when messages change or typing starts
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [floatingBotMessages, isBotTyping])

  // Focus input when panel opens
  useEffect(() => {
    if (isFloatingBotOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isFloatingBotOpen])

  const handleSend = () => {
    if (!message.trim() || !currentUser) return
    sendBotMessage(message.trim(), currentUser.id, currentUser.name)
    setMessage('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === 'Escape') {
      closeFloatingBot()
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={toggleFloatingBot}
        className={cn(
          'fixed bottom-20 right-6 z-50 w-14 h-14 rounded-full',
          'bg-gradient-to-br from-cyan-500 to-blue-600',
          'shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40',
          'flex items-center justify-center',
          'transition-all duration-300 hover:scale-110',
          isFloatingBotOpen && 'scale-0 opacity-0'
        )}
        aria-label="Open chat assistant"
      >
        <Bot className="w-7 h-7 text-white" />
        {/* Notification pulse */}
        {!hasShownInitialGreeting && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={cn(
          'fixed bottom-20 right-6 z-50 w-[360px] h-[640px]',
          'bg-card border border-border rounded-2xl shadow-2xl',
          'flex flex-col overflow-hidden',
          'transition-all duration-300 origin-bottom-right',
          isFloatingBotOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Assistant</h3>
              <p className="text-xs text-muted-foreground">Here to help</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={closeFloatingBot}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={closeFloatingBot}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 min-h-0" viewportRef={scrollRef}>
          <div className="space-y-4 p-4">
            {floatingBotMessages.map(msg => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3',
                  msg.senderType === 'user' && 'flex-row-reverse'
                )}
              >
                {msg.senderType === 'ai' && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-xs">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'rounded-2xl px-4 py-2 max-w-[80%]',
                    msg.senderType === 'ai'
                      ? 'bg-muted text-foreground'
                      : 'bg-cyan-600 text-white'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={cn(
                      'text-xs mt-1',
                      msg.senderType === 'ai' ? 'text-muted-foreground' : 'text-cyan-200'
                    )}
                  >
                    {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
            {/* Typing indicator */}
            {isBotTyping && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-xs">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-2xl px-4 py-3 bg-muted">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t shrink-0">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isBotTyping ? "Waiting for response..." : "Ask me anything..."}
              className="flex-1"
              disabled={isBotTyping}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!message.trim() || isBotTyping}
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
