import { useEffect, useCallback, useMemo, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Collaboration from '@tiptap/extension-collaboration'
import { yCursorPlugin } from '@tiptap/y-tiptap'
import { Extension } from '@tiptap/react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Highlighter,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  SquareCode,
  Minus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// Cursor colors for collaborative users
const CURSOR_COLORS = [
  '#f87171', // red
  '#fb923c', // orange
  '#facc15', // yellow
  '#4ade80', // green
  '#22d3ee', // cyan
  '#818cf8', // indigo
  '#c084fc', // purple
  '#f472b6', // pink
]

function getCursorColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length]
}

export interface CollaborationUser {
  name: string
  color?: string
}

interface RichTextEditorProps {
  /** Room name for collaborative editing (e.g. "team_{id}_session_{id}") */
  roomName?: string
  /** Current user info for cursor awareness */
  user?: CollaborationUser
  /** Initial HTML content to seed the Yjs doc (only applied if doc is empty) */
  initialContent?: string
  /** Called when content changes (receives HTML) */
  onChange?: (value: string) => void
}

/** Shared base extensions (everything except collaboration) */
function getBaseExtensions(isCollaborative: boolean) {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      // Disable built-in undo/redo when collaborative — Yjs handles it
      ...(isCollaborative ? { undoRedo: false } : {}),
    }),
    Underline,
    Highlight,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-cyan-500 underline cursor-pointer',
      },
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Placeholder.configure({
      placeholder: 'Start writing your response...',
    }),
  ]
}

export function RichTextEditor({ roomName, user, initialContent, onChange }: RichTextEditorProps) {
  // If roomName is provided, render collaborative editor; otherwise, simple editor
  if (roomName) {
    return (
      <CollaborativeEditor
        roomName={roomName}
        user={user}
        initialContent={initialContent}
        onChange={onChange}
      />
    )
  }

  return <SimpleEditor initialContent={initialContent} onChange={onChange} />
}

// ─── Simple (non-collaborative) Editor ───────────────────────────────

function SimpleEditor({
  initialContent,
  onChange,
}: {
  initialContent?: string
  onChange?: (value: string) => void
}) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const editor = useEditor({
    extensions: getBaseExtensions(false),
    content: initialContent || '',
    editorProps: {
      attributes: {
        class: 'focus:outline-none h-full p-4',
      },
    },
    onUpdate: ({ editor }) => {
      onChangeRef.current?.(editor.getHTML())
    },
  })

  // Sync external value changes
  useEffect(() => {
    if (editor && initialContent !== undefined && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent, { emitUpdate: false })
    }
  }, [initialContent, editor])

  if (!editor) return null

  return <EditorShell editor={editor} />
}

// ─── Collaborative Editor ────────────────────────────────────────────

function CollaborativeEditor({
  roomName,
  user,
  initialContent,
  onChange,
}: {
  roomName: string
  user?: CollaborationUser
  initialContent?: string
  onChange?: (value: string) => void
}) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const initialContentRef = useRef(initialContent)
  initialContentRef.current = initialContent
  const hasSeededInitialContentRef = useRef(false)

  // Create a stable Yjs doc and WebSocket provider per roomName.
  // Disable auto-connect so the connection is paired with the cleanup
  // effect below -- this prevents "WebSocket is closed before the
  // connection is established" errors during rapid mount/unmount cycles.
  const { ydoc, provider } = useMemo(() => {
    const doc = new Y.Doc()

    // Build the WebSocket URL for the Yjs collaboration server.
    // In production this shares the same host/port as the app via /ws/yjs/.
    // VITE_YJS_WS_URL can override the full base URL if needed.
    let wsUrl: string
    if (import.meta.env.VITE_YJS_WS_URL) {
      wsUrl = import.meta.env.VITE_YJS_WS_URL
    } else if (typeof window !== 'undefined') {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      wsUrl = `${proto}//${window.location.host}/ws/yjs`
    } else {
      wsUrl = 'ws://localhost:3000/ws/yjs'
    }

    // y-websocket appends roomName as a path: ws://host/ws/yjs/<roomName>
    const prov = new WebsocketProvider(wsUrl, roomName, doc, { connect: false })

    return { ydoc: doc, provider: prov }
  }, [roomName])

  // Connect on mount, disconnect + destroy on unmount.
  // This pairs connect/disconnect in the same effect so React's cleanup
  // always runs before a stale connection lingers.
  useEffect(() => {
    hasSeededInitialContentRef.current = false
    provider.connect()

    // Seed initial content into the Yjs doc if it's empty after sync
    const handleSync = (isSynced: boolean) => {
      if (!isSynced) return
      const fragment = ydoc.getXmlFragment('default')
      const contentToSeed = initialContentRef.current
      if (!hasSeededInitialContentRef.current && fragment.length === 0 && contentToSeed) {
        seedYDocFromHTML(ydoc, contentToSeed)
        hasSeededInitialContentRef.current = true
      }
      provider.off('sync', handleSync)
    }

    if (provider.synced) {
      handleSync(true)
    } else {
      provider.on('sync', handleSync)
    }

    return () => {
      provider.off('sync', handleSync)
      provider.disconnect()
      provider.destroy()
      ydoc.destroy()
    }
  }, [ydoc, provider])

  const cursorUser = useMemo(() => ({
    name: user?.name || 'Anonymous',
    color: user?.color || getCursorColor(user?.name || 'Anonymous'),
  }), [user])

  // Set awareness user state
  useEffect(() => {
    provider.awareness.setLocalStateField('user', cursorUser)
  }, [provider, cursorUser])

  const editor = useEditor({
    extensions: [
      ...getBaseExtensions(true),
      Collaboration.configure({
        document: ydoc,
      }),
      Extension.create({
        name: 'collaborationCursor',
        addProseMirrorPlugins() {
          return [
            yCursorPlugin(
              provider.awareness,
              {
                cursorBuilder: (awarenessUser: { name?: string; color?: string }) => {
                  const cursor = document.createElement('span')
                  cursor.classList.add('collaboration-cursor__caret')
                  cursor.style.borderColor = awarenessUser.color || '#06b6d4'

                  const label = document.createElement('div')
                  label.classList.add('collaboration-cursor__label')
                  label.style.backgroundColor = awarenessUser.color || '#06b6d4'
                  label.textContent = awarenessUser.name || 'Anonymous'

                  cursor.appendChild(label)
                  return cursor
                },
                selectionBuilder: (awarenessUser: { name?: string; color?: string }) => {
                  const color = awarenessUser.color || '#06b6d4'
                  return {
                    class: 'collaboration-cursor__selection',
                    style: `background-color: ${color}`,
                  }
                },
              },
            ),
          ]
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: 'focus:outline-none h-full p-4',
      },
    },
    onUpdate: ({ editor }) => {
      onChangeRef.current?.(editor.getHTML())
    },
  }, [ydoc, provider])

  if (!editor) return null

  return <EditorShell editor={editor} />
}

// ─── Shared Toolbar + Editor Shell ───────────────────────────────────

function EditorShell({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const setLink = useCallback(() => {
    if (!editor) return

    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) return

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) return null

  return (
    <div className="h-full flex flex-col border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30 overflow-x-auto scrollbar-none">
        {/* Inline formatting */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn('h-8 w-8 p-0', editor.isActive('bold') && 'bg-muted')}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn('h-8 w-8 p-0', editor.isActive('italic') && 'bg-muted')}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn('h-8 w-8 p-0', editor.isActive('underline') && 'bg-muted')}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn('h-8 w-8 p-0', editor.isActive('strike') && 'bg-muted')}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={cn('h-8 w-8 p-0', editor.isActive('code') && 'bg-muted')}
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={cn('h-8 w-8 p-0', editor.isActive('highlight') && 'bg-muted')}
        >
          <Highlighter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={setLink}
          className={cn('h-8 w-8 p-0', editor.isActive('link') && 'bg-muted')}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Headings */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn('h-8 w-8 p-0', editor.isActive('heading', { level: 1 }) && 'bg-muted')}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn('h-8 w-8 p-0', editor.isActive('heading', { level: 2 }) && 'bg-muted')}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn('h-8 w-8 p-0', editor.isActive('heading', { level: 3 }) && 'bg-muted')}
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Lists & blocks */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn('h-8 w-8 p-0', editor.isActive('bulletList') && 'bg-muted')}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn('h-8 w-8 p-0', editor.isActive('orderedList') && 'bg-muted')}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={cn('h-8 w-8 p-0', editor.isActive('taskList') && 'bg-muted')}
        >
          <ListTodo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn('h-8 w-8 p-0', editor.isActive('blockquote') && 'bg-muted')}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={cn('h-8 w-8 p-0', editor.isActive('codeBlock') && 'bg-muted')}
        >
          <SquareCode className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="h-8 w-8 p-0"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  )
}

/**
 * Seed a Yjs document with HTML content.
 * Only called once when the collaborative doc is first created and empty.
 */
function seedYDocFromHTML(ydoc: Y.Doc, html: string) {
  const fragment = ydoc.getXmlFragment('default')
  if (fragment.length > 0) return

  const div = typeof document !== 'undefined' ? document.createElement('div') : null
  if (div) {
    div.innerHTML = html
    const text = div.textContent || div.innerText || ''
    if (text.trim()) {
      const yText = new Y.XmlText()
      yText.insert(0, text)
      const yElement = new Y.XmlElement('paragraph')
      yElement.insert(0, [yText])
      fragment.insert(0, [yElement])
    }
  }
}
