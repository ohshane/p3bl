import { useCallback } from 'react'
import Editor from '@monaco-editor/react'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  ghostSuggestion?: string | null
  language?: string
}

export function CodeEditor({ value, onChange, ghostSuggestion, language = 'python' }: CodeEditorProps) {
  const handleEditorChange = useCallback((newValue: string | undefined) => {
    onChange(newValue || '')
  }, [onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && ghostSuggestion) {
      e.preventDefault()
      onChange(value + ghostSuggestion)
    }
  }, [ghostSuggestion, value, onChange])

  return (
    <div className="h-full flex flex-col border rounded-lg overflow-hidden" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <span className="text-sm text-muted-foreground">
          Language: {language}
        </span>
        {ghostSuggestion && (
          <span className="text-xs px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded">
            Press Tab to accept suggestion
          </span>
        )}
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={language}
          value={value}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            padding: { top: 16, bottom: 16 },
          }}
        />

        {/* Ghost Suggestion Overlay */}
        {ghostSuggestion && (
          <div className="absolute bottom-4 left-16 right-4 pointer-events-none">
            <div className="text-muted-foreground/40 font-mono text-sm whitespace-pre-wrap">
              {ghostSuggestion}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
