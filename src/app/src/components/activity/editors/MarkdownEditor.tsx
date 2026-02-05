import { useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  ghostSuggestion?: string | null
}

export function MarkdownEditor({ value, onChange, ghostSuggestion }: MarkdownEditorProps) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && ghostSuggestion) {
      e.preventDefault()
      onChange(value + ghostSuggestion)
    }
  }, [ghostSuggestion, value, onChange])

  return (
    <div className="h-full flex border rounded-lg overflow-hidden">
      {/* Source Editor */}
      <div className="w-1/2 flex flex-col border-r">
        <div className="px-4 py-2 border-b bg-muted/30 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Markdown Source</span>
          {ghostSuggestion && (
            <span className="text-xs px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded">
              Tab to accept
            </span>
          )}
        </div>
        <div className="flex-1 p-4 relative">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write your markdown here..."
            className="h-full resize-none font-mono text-sm border-0 focus-visible:ring-0 p-0"
          />
          
          {/* Ghost Suggestion */}
          {ghostSuggestion && (
            <div className="absolute bottom-4 left-4 right-4 pointer-events-none text-muted-foreground/40 font-mono text-sm">
              {ghostSuggestion}
            </div>
          )}
        </div>
      </div>

      {/* Live Preview */}
      <div className="w-1/2 flex flex-col">
        <div className="px-4 py-2 border-b bg-muted/30">
          <span className="text-sm text-muted-foreground">Preview</span>
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="prose prose-sm prose-invert max-w-none">
            {value ? (
              <ReactMarkdown>{value}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground italic">
                Start writing to see a preview...
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
