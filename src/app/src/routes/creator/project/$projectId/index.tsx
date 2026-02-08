import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import {
  ArrowLeft,
  Settings,
  Users,
  User,
  Calendar,
  Clock,
  FileText,
  BookOpen,
  Check,
  X,
  Save,
  Loader2,
  Plus,
  Trash2,
  Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import { differenceInMinutes, addMinutes, format } from 'date-fns'
import { useAuthStore } from '@/stores/authStore'
import { useCreatorStore } from '@/stores/creatorStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { JoinCode } from '@/components/creator/JoinCode'
import { updateProject } from '@/server/api/projects'
import { updateSession as apiUpdateSession, addRubric, deleteRubric, updateRubric } from '@/server/api/sessions'
import {
  cn,
  safeFormatDate,
  isValidDate,
  getProjectTimeStatus,
  getProjectProgress,
  getProjectTimeInfo,
} from '@/lib/utils'
import type { CreatorProjectStatus, CreatorSession, SessionDifficulty, DeliverableType, RubricItem } from '@/types'

export const Route = createFileRoute('/creator/project/$projectId/')({
  component: ProjectDetailPage,
})

// ─── Constants ─────────────────────────────────────────────────────────────

const DIFFICULTY_WEIGHTS: Record<SessionDifficulty, number> = {
  easy: 60,
  medium: 100,
  hard: 140,
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`
  } else if (minutes < 10080) {
    const days = Math.floor(minutes / 1440)
    const hours = Math.floor((minutes % 1440) / 60)
    return hours > 0 ? `${days}d ${hours}h` : `${days} day${days > 1 ? 's' : ''}`
  } else {
    const weeks = Math.floor(minutes / 10080)
    const days = Math.floor((minutes % 10080) / 1440)
    return days > 0 ? `${weeks}w ${days}d` : `${weeks} week${weeks > 1 ? 's' : ''}`
  }
}

function formatSessionDuration(sessionMinutes: number, totalMinutes: number): string {
  if (totalMinutes < 1440) {
    if (sessionMinutes < 60) return `${sessionMinutes} min`
    const hours = Math.round((sessionMinutes / 60) * 10) / 10
    return `${hours}h`
  } else if (totalMinutes < 10080) {
    if (sessionMinutes < 1440) {
      const hours = Math.round(sessionMinutes / 60)
      return `${hours}h`
    }
    const days = Math.round((sessionMinutes / 1440) * 10) / 10
    return `${days}d`
  } else {
    const days = Math.round(sessionMinutes / 1440)
    return `${days} day${days > 1 ? 's' : ''}`
  }
}

function formatTimelineDateForScale(dateStr: string, totalMinutes: number) {
  if (totalMinutes < 1440) {
    return safeFormatDate(dateStr, 'MMM d HH:mm', '?')
  }
  return safeFormatDate(dateStr, 'MMM d', '?')
}

// ─── Inline Editable Components ────────────────────────────────────────────

interface InlineTextProps {
  value: string
  onSave: (value: string) => Promise<void>
  editable: boolean
  className?: string
  inputClassName?: string
  placeholder?: string
  multiline?: boolean
}

function InlineText({
  value,
  onSave,
  editable,
  className = '',
  inputClassName = '',
  placeholder = 'Click to edit...',
  multiline = false,
}: InlineTextProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const handleSave = async () => {
    const trimmed = draft.trim()
    if (trimmed === value) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      await onSave(trimmed)
      setEditing(false)
    } catch {
      toast.error('Failed to save')
      setDraft(value)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setDraft(value)
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Enter' && multiline && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (!editable) {
    return <span className={className}>{value || <span className="text-muted-foreground italic">Not set</span>}</span>
  }

  if (editing) {
    return (
      <div className="flex items-start gap-2 w-full">
        {multiline ? (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`flex-1 min-h-[60px] ${inputClassName}`}
            placeholder={placeholder}
            disabled={saving}
          />
        ) : (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`flex-1 ${inputClassName}`}
            placeholder={placeholder}
            disabled={saving}
          />
        )}
        <Button
          size="icon"
          variant="ghost"
          onClick={handleSave}
          disabled={saving}
          className="h-8 w-8 text-green-500 hover:text-green-400 hover:bg-green-500/10 shrink-0"
        >
          <Check className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleCancel}
          disabled={saving}
          className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <span
      className={`group/edit cursor-pointer inline-flex items-center gap-2 ${className}`}
      onClick={() => setEditing(true)}
    >
      {value || <span className="text-muted-foreground italic">{placeholder}</span>}
      <Pencil className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
    </span>
  )
}

// ─── Rubric Editor ─────────────────────────────────────────────────────────

interface RubricEditorProps {
  sessionId: string
  rubric: RubricItem[]
  editable: boolean
  onChanged: () => Promise<void>
}

function RubricEditor({ sessionId, rubric, editable, onChanged }: RubricEditorProps) {
  const [saving, setSaving] = useState<string | null>(null)

  const handleAdd = async () => {
    const usedWeight = rubric.reduce((sum, r) => sum + r.weight, 0)
    const remainingWeight = Math.max(0, 100 - usedWeight)
    setSaving('add')
    try {
      const result = await addRubric({
        data: {
          sessionId,
          criteria: 'New criterion',
          description: '',
          weight: remainingWeight,
        },
      })
      if (result.success) {
        await onChanged()
      } else {
        toast.error('Failed to add rubric')
      }
    } catch {
      toast.error('Failed to add rubric')
    } finally {
      setSaving(null)
    }
  }

  const handleDelete = async (rubricId: string) => {
    setSaving(rubricId)
    try {
      const result = await deleteRubric({
        data: { rubricId },
      })
      if (result.success) {
        await onChanged()
      } else {
        toast.error('Failed to delete rubric')
      }
    } catch {
      toast.error('Failed to delete rubric')
    } finally {
      setSaving(null)
    }
  }

  if (!editable) {
    if (rubric.length === 0) return null
    return (
      <div className="mt-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5">
          <BookOpen className="w-3 h-3" />
          {rubric.length} rubric {rubric.length === 1 ? 'criterion' : 'criteria'}
        </div>
        <div className="space-y-1">
          {rubric.map((r) => (
            <div key={r.id} className="flex items-center gap-2 text-xs text-muted-foreground pl-4">
              <span className="text-foreground">{r.criterion}</span>
              <span className="text-[10px]">({r.weight}%)</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <BookOpen className="w-3 h-3" />
          Rubric
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleAdd}
          disabled={saving === 'add'}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          {saving === 'add' ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Plus className="w-3 h-3" />
          )}
        </Button>
      </div>
      {rubric.length > 0 && (
        <>
          <div className="space-y-2">
            {rubric.map((r) => (
              <RubricItemEditor
                key={r.id}
                item={r}
                saving={saving === r.id}
                onDelete={() => handleDelete(r.id)}
                onChanged={onChanged}
              />
            ))}
          </div>
          {(() => {
            const total = rubric.reduce((sum, r) => sum + r.weight, 0)
            if (total !== 100) {
              return (
                <Badge
                  variant="outline"
                  className="mt-2 text-[10px] bg-red-500/10 text-red-400 border-red-500/20"
                >
                  Total: {total}% (must equal 100%)
                </Badge>
              )
            }
            return null
          })()}
        </>
      )}
    </div>
  )
}

// ─── Rubric Item Editor ────────────────────────────────────────────────────

interface RubricItemEditorProps {
  item: RubricItem
  saving: boolean
  onDelete: () => Promise<void>
  onChanged: () => Promise<void>
}

function RubricItemEditor({ item, saving, onDelete, onChanged }: RubricItemEditorProps) {
  const [weightSaving, setWeightSaving] = useState(false)
  const [weightDraft, setWeightDraft] = useState(String(item.weight))
  const weightInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (document.activeElement !== weightInputRef.current) {
      setWeightDraft(String(item.weight))
    }
  }, [item.weight])

  const saveRubricField = async (updates: { criteria?: string; description?: string; weight?: number }) => {
    const result = await updateRubric({ data: { rubricId: item.id, updates } })
    if (result.success) {
      toast.success('Saved')
      await onChanged()
    } else {
      throw new Error('Failed to save')
    }
  }

  const handleWeightChange = async (delta: number) => {
    const newWeight = Math.max(0, Math.min(100, item.weight + delta))
    if (newWeight === item.weight) return
    setWeightSaving(true)
    try {
      await saveRubricField({ weight: newWeight })
    } finally {
      setWeightSaving(false)
    }
  }

  const commitWeight = async () => {
    const num = parseInt(weightDraft, 10)
    if (isNaN(num) || num < 0 || num > 100) {
      setWeightDraft(String(item.weight))
      return
    }
    if (num === item.weight) return
    setWeightSaving(true)
    try {
      await saveRubricField({ weight: num })
    } catch {
      setWeightDraft(String(item.weight))
    } finally {
      setWeightSaving(false)
    }
  }

  return (
    <div className={cn(
      'p-2 rounded bg-background border border-border/50 space-y-1',
      saving && 'opacity-60',
    )}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <InlineText
            value={item.criterion}
            onSave={async (val) => saveRubricField({ criteria: val })}
            editable
            className="text-xs text-foreground"
            placeholder="Criterion name..."
          />
        </div>
        <div className="flex items-center gap-0.5 shrink-0 pt-0.5">
          <div className="flex items-center h-6 rounded border border-border bg-muted/30">
            <button
              type="button"
              onClick={() => handleWeightChange(-1)}
              disabled={weightSaving || item.weight <= 0}
              className="px-1.5 h-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed rounded-l text-xs font-medium"
            >
              -
            </button>
            <input
              ref={weightInputRef}
              type="number"
              min={0}
              max={100}
              value={weightDraft}
              onChange={(e) => setWeightDraft(e.target.value)}
              onBlur={commitWeight}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commitWeight()
                }
                if (e.key === 'Escape') {
                  setWeightDraft(String(item.weight))
                  weightInputRef.current?.blur()
                }
              }}
              disabled={weightSaving}
              className={cn(
                'w-8 text-center text-xs font-medium tabular-nums bg-transparent border-none outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]',
                weightSaving && 'opacity-50',
              )}
            />
            <span className="text-xs text-muted-foreground pr-1">%</span>
            <button
              type="button"
              onClick={() => handleWeightChange(1)}
              disabled={weightSaving || item.weight >= 100}
              className="px-1.5 h-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed rounded-r text-xs font-medium"
            >
              +
            </button>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDelete}
            disabled={saving}
            className="h-6 w-6 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      <div className="pl-0">
        <InlineText
          value={item.description || ''}
          onSave={async (val) => saveRubricField({ description: val })}
          editable
          className="text-[11px] text-muted-foreground"
          placeholder="Add description..."
        />
      </div>
    </div>
  )
}

// ─── Types ─────────────────────────────────────────────────────────────────

interface SessionWithDates {
  session: CreatorSession
  index: number
  calculatedStartDate: string
  calculatedEndDate: string
  isoStartDate: string
  isoEndDate: string
  sessionMinutes: number
  percentage: number
  weight: number
}

// ─── Expanded Session Info ──────────────────────────────────────────────────

interface ExpandedSessionInfoProps {
  session: SessionWithDates
  durationMinutes: number
  onSessionDateChange: (startIso: string, endIso: string) => void
}

function ExpandedSessionInfo({ session, durationMinutes, onSessionDateChange }: ExpandedSessionInfoProps) {
  const toLocal = (iso: string) => {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  }

  const startLocal = toLocal(session.isoStartDate)
  const endLocal = toLocal(session.isoEndDate)

  return (
    <div className="mt-2 p-3 bg-muted/30 rounded-lg border border-border text-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-xs font-bold text-cyan-400">
          {session.index + 1}
        </span>
        <span className="font-medium text-foreground">
          {session.session.title}
        </span>
        <span className="text-xs text-muted-foreground ml-auto">
          {formatSessionDuration(session.sessionMinutes, durationMinutes)} ({session.percentage}%)
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
            Start
          </label>
          <Input
            type="datetime-local"
            value={startLocal}
            onChange={(e) => {
              if (!e.target.value) return
              const newStart = new Date(e.target.value).toISOString()
              onSessionDateChange(newStart, session.isoEndDate)
            }}
            className="bg-background border-border text-xs h-8"
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
            End
          </label>
          <Input
            type="datetime-local"
            value={endLocal}
            min={startLocal}
            onChange={(e) => {
              if (!e.target.value) return
              const newEnd = new Date(e.target.value).toISOString()
              onSessionDateChange(session.isoStartDate, newEnd)
            }}
            className="bg-background border-border text-xs h-8"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Timeline Editor Component ─────────────────────────────────────────────

interface TimelineEditorProps {
  projectId: string
  startDate: string
  endDate: string
  sessions: CreatorSession[]
  onSaved: () => Promise<void>
}

function TimelineEditor({ projectId, startDate, endDate, sessions, onSaved }: TimelineEditorProps) {
  // Local draft state for the timeline
  const [draftStartDate, setDraftStartDate] = useState(startDate)
  const [draftEndDate, setDraftEndDate] = useState(endDate)
  const [draftWeights, setDraftWeights] = useState<number[]>(() =>
    sessions.map(s => s.weight || DIFFICULTY_WEIGHTS[s.difficulty as SessionDifficulty] || 100),
  )
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  // Timeline drag state
  const [draggingHandle, setDraggingHandle] = useState<number | null>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const [expandedSession, setExpandedSession] = useState<number | null>(0)

  // Sync from props when they change externally
  useEffect(() => {
    setDraftStartDate(startDate)
    setDraftEndDate(endDate)
    setDraftWeights(sessions.map(s => s.weight || DIFFICULTY_WEIGHTS[s.difficulty as SessionDifficulty] || 100))
    setDirty(false)
  }, [startDate, endDate, sessions])

  // Parse dates
  const startDateTime = useMemo(() => {
    if (isValidDate(draftStartDate)) return new Date(draftStartDate)
    return new Date()
  }, [draftStartDate])

  const endDateTime = useMemo(() => {
    if (isValidDate(draftEndDate)) return new Date(draftEndDate)
    return addMinutes(startDateTime, 5)
  }, [draftEndDate, startDateTime])

  const durationMinutes = useMemo(() => {
    return Math.max(0, differenceInMinutes(endDateTime, startDateTime))
  }, [startDateTime, endDateTime])

  // Convert ISO to datetime-local format for inputs
  const startDateLocal = useMemo(() => {
    const d = startDateTime
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  }, [startDateTime])

  const endDateLocal = useMemo(() => {
    const d = endDateTime
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  }, [endDateTime])

  // Calculate session distribution
  const totalWeight = draftWeights.reduce((sum, w) => sum + w, 0)

  const sessionsWithDates: SessionWithDates[] = useMemo(() => {
    if (!isValidDate(draftStartDate) || sessions.length === 0) {
      return sessions.map((session, index) => ({
        session,
        index,
        calculatedStartDate: '',
        calculatedEndDate: '',
        isoStartDate: '',
        isoEndDate: '',
        sessionMinutes: 0,
        percentage: sessions.length > 0 ? Math.round(100 / sessions.length) : 0,
        weight: draftWeights[index] || 100,
      }))
    }

    let currentDate = new Date(draftStartDate)
    return sessions.map((session, index) => {
      const weight = draftWeights[index] || 100
      const proportion = totalWeight > 0 ? weight / totalWeight : 0
      const sessionMinutes = Math.max(1, Math.round(durationMinutes * proportion))
      const sStart = currentDate
      const sEnd = addMinutes(currentDate, sessionMinutes)
      currentDate = sEnd

      return {
        session,
        index,
        calculatedStartDate: format(sStart, 'yyyy-MM-dd HH:mm'),
        calculatedEndDate: format(sEnd, 'yyyy-MM-dd HH:mm'),
        isoStartDate: sStart.toISOString(),
        isoEndDate: sEnd.toISOString(),
        sessionMinutes,
        percentage: Math.round(proportion * 100),
        weight,
      }
    })
  }, [sessions, draftStartDate, durationMinutes, totalWeight, draftWeights])

  // ─── Event Handlers ────────────────────────────────────────────────────

  const handleStartChange = (localValue: string) => {
    if (!localValue) return
    const newStart = new Date(localValue)
    // Keep same duration
    const newEnd = addMinutes(newStart, durationMinutes)
    setDraftStartDate(newStart.toISOString())
    setDraftEndDate(newEnd.toISOString())
    setDirty(true)
  }

  const handleEndChange = (localValue: string) => {
    if (!localValue) return
    const newEnd = new Date(localValue)
    setDraftEndDate(newEnd.toISOString())
    setDirty(true)
  }

  // Timeline drag
  const handleTimelineDrag = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (draggingHandle === null || !timelineRef.current) return

      const rect = timelineRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const totalWidth = rect.width

      let cumulativePercent = 0
      for (let i = 0; i < draggingHandle; i++) {
        cumulativePercent += sessionsWithDates[i]?.percentage || 0
      }

      const newPercent = Math.max(5, Math.min(95, (mouseX / totalWidth) * 100))

      const leftWeight = draftWeights[draggingHandle]
      const rightWeight = draftWeights[draggingHandle + 1]
      if (leftWeight === undefined || rightWeight === undefined) return

      const leftPercent = sessionsWithDates[draggingHandle]?.percentage || 0
      const rightPercent = sessionsWithDates[draggingHandle + 1]?.percentage || 0
      const combinedPercent = leftPercent + rightPercent

      const newLeftPercent = Math.max(5, Math.min(combinedPercent - 5, newPercent - cumulativePercent))

      const totalWeightForBoth = leftWeight + rightWeight
      const newLeftWeight = Math.max(1, Math.round((newLeftPercent / combinedPercent) * totalWeightForBoth))
      const newRightWeight = Math.max(1, totalWeightForBoth - newLeftWeight)

      setDraftWeights(prev => {
        const next = [...prev]
        next[draggingHandle] = newLeftWeight
        next[draggingHandle + 1] = newRightWeight
        return next
      })
      setDirty(true)
    },
    [draggingHandle, sessionsWithDates, draftWeights],
  )

  const handleMouseUp = useCallback(() => {
    setDraggingHandle(null)
  }, [])

  useEffect(() => {
    if (draggingHandle !== null) {
      const handleMove = (e: MouseEvent) => handleTimelineDrag(e)
      const handleUp = () => handleMouseUp()
      window.addEventListener('mousemove', handleMove)
      window.addEventListener('mouseup', handleUp)
      return () => {
        window.removeEventListener('mousemove', handleMove)
        window.removeEventListener('mouseup', handleUp)
      }
    }
  }, [draggingHandle, handleTimelineDrag, handleMouseUp])

  // ─── Save All ──────────────────────────────────────────────────────────

  const handleSaveTimeline = async () => {
    setSaving(true)
    try {
      // 1. Save project start/end dates
      const projResult = await updateProject({
        data: {
          projectId,
          updates: {
            startDate: draftStartDate,
            endDate: draftEndDate,
          },
        },
      })
      if (!projResult.success) {
        toast.error('Failed to save project dates')
        setSaving(false)
        return
      }

      // 2. Save all session dates and weights
      const sessionPromises = sessionsWithDates.map(async (s) => {
        return apiUpdateSession({
          data: {
            sessionId: s.session.id,
            updates: {
              startDate: s.isoStartDate,
              endDate: s.isoEndDate,
              weight: s.weight,
            },
          },
        })
      })

      const results = await Promise.all(sessionPromises)
      const allSuccess = results.every(r => r.success)

      if (allSuccess) {
        toast.success('Timeline saved')
        setDirty(false)
        await onSaved()
      } else {
        toast.error('Some session updates failed')
      }
    } catch {
      toast.error('Failed to save timeline')
    } finally {
      setSaving(false)
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Start / End Date Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Start
          </label>
          <Input
            type="datetime-local"
            value={startDateLocal}
            onChange={(e) => handleStartChange(e.target.value)}
            className="bg-background border-border text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            End
          </label>
          <Input
            type="datetime-local"
            value={endDateLocal}
            min={startDateLocal}
            onChange={(e) => handleEndChange(e.target.value)}
            className="bg-background border-border text-sm"
          />
        </div>
      </div>

      {/* Duration Display */}
      {durationMinutes > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/20">
          <Clock className="w-4 h-4 text-cyan-500 shrink-0" />
          <span className="text-sm font-medium text-foreground">
            {formatDuration(durationMinutes)}
          </span>
          <span className="text-xs text-muted-foreground">
            {safeFormatDate(draftStartDate, 'MMM d HH:mm', '?')} - {safeFormatDate(draftEndDate, 'MMM d HH:mm', '?')}
          </span>
        </div>
      )}

      {/* Session Timeline Distribution Bar */}
      {sessions.length > 0 && durationMinutes > 0 && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            Session Distribution
            <span className="text-[10px] font-normal ml-1">(drag handles to adjust)</span>
          </label>
           <div className="px-6">
            <div
              ref={timelineRef}
              className={cn(
                'flex h-8 rounded-md overflow-hidden border border-border bg-muted/30 relative',
                draggingHandle !== null && 'cursor-col-resize',
              )}
            >
              {sessionsWithDates.map((s, index) => (
                <div
                  key={index}
                  className="relative h-full"
                  style={{ width: `${s.percentage}%` }}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            'h-full flex items-center justify-center text-foreground bg-background border-y border-l border-border/70 transition-colors duration-200 ease-out hover:bg-cyan-500/35',
                            expandedSession === index && 'bg-cyan-500/35',
                            index === sessionsWithDates.length - 1 && 'border-r',
                          )}
                          onClick={() => setExpandedSession(expandedSession === index ? null : index)}
                        >
                          <span className="text-[11px] font-semibold">{index + 1}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{s.session.title || `Session ${index + 1}`}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatSessionDuration(s.sessionMinutes, durationMinutes)} ({s.percentage}%)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimelineDateForScale(s.isoStartDate, durationMinutes)} - {formatTimelineDateForScale(s.isoEndDate, durationMinutes)}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Draggable handle */}
                  {index < sessionsWithDates.length - 1 && (
                    <div
                      className={cn(
                        'absolute right-0 top-0 h-full w-3 cursor-col-resize z-10 flex items-center justify-center translate-x-1/2 group',
                        draggingHandle === index && 'bg-cyan-500/20',
                      )}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setDraggingHandle(index)
                      }}
                    >
                      <div
                        className={cn(
                          'w-1 h-5 rounded-full bg-border transition-colors',
                          'group-hover:bg-cyan-500 group-hover:w-1.5',
                          draggingHandle === index && 'bg-cyan-500 w-1.5',
                        )}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Time markers - only show first start and last end */}
            <div className="flex justify-between mt-1 mb-4 text-[10px] text-muted-foreground">
              {sessionsWithDates.length > 0 && (
                <>
                  <span>{formatTimelineDateForScale(sessionsWithDates[0].isoStartDate, durationMinutes)}</span>
                  <span>{formatTimelineDateForScale(sessionsWithDates[sessionsWithDates.length - 1].isoEndDate, durationMinutes)}</span>
                </>
              )}
            </div>
          </div>

          {/* Expanded session info */}
          {expandedSession !== null && sessionsWithDates[expandedSession] && (
            <ExpandedSessionInfo
              session={sessionsWithDates[expandedSession]}
              durationMinutes={durationMinutes}
              onSessionDateChange={(startIso, endIso) => {
                // Recalculate weight for this session based on new duration
                const newSessionMinutes = Math.max(1, differenceInMinutes(new Date(endIso), new Date(startIso)))
                const otherWeightsTotal = draftWeights.reduce((sum, w, i) => i === expandedSession ? sum : sum + w, 0)
                const otherMinutes = durationMinutes - newSessionMinutes
                // weight / otherWeightsTotal = newSessionMinutes / otherMinutes
                const newWeight = otherMinutes > 0 && otherWeightsTotal > 0
                  ? Math.max(1, Math.round((newSessionMinutes / otherMinutes) * otherWeightsTotal))
                  : draftWeights[expandedSession]
                setDraftWeights(prev => {
                  const next = [...prev]
                  next[expandedSession] = newWeight
                  return next
                })
                setDirty(true)
              }}
            />
          )}
        </div>
      )}

      {/* Save Button */}
      {dirty && (
        <Button
          onClick={handleSaveTimeline}
          disabled={saving}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Timeline
            </>
          )}
        </Button>
      )}
    </div>
  )
}

// ─── Team Size Editor ──────────────────────────────────────────────────────

interface TeamSizeEditorProps {
  value: number
  onSave: (value: number) => Promise<void>
}

function TeamSizeEditor({ value, onSave }: TeamSizeEditorProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const handleSave = async () => {
    const num = parseInt(draft, 10)
    if (isNaN(num) || num < 2 || num > 10) {
      toast.error('Team size must be between 2 and 10')
      setDraft(String(value))
      setEditing(false)
      return
    }
    if (num === value) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      await onSave(num)
      setEditing(false)
    } catch {
      toast.error('Failed to save')
      setDraft(String(value))
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          type="number"
          min={2}
          max={10}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') {
              setDraft(String(value))
              setEditing(false)
            }
          }}
          className="w-16 h-7 text-sm text-right"
          disabled={saving}
        />
        <Button
          size="icon"
          variant="ghost"
          onClick={handleSave}
          disabled={saving}
          className="h-6 w-6 text-green-500 hover:text-green-400 hover:bg-green-500/10"
        >
          <Check className="w-3 h-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            setDraft(String(value))
            setEditing(false)
          }}
          disabled={saving}
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    )
  }

  return (
    <span
      className="group/edit cursor-pointer inline-flex items-center gap-1 text-foreground"
      onClick={() => setEditing(true)}
    >
      {value} members
      <Pencil className="w-3 h-3 text-muted-foreground shrink-0" />
    </span>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────

function ProjectDetailPage() {
  const navigate = useNavigate()
  const { projectId } = Route.useParams()
  const { isAuthenticated, currentUser } = useAuthStore()
  const { getProject, fetchProjects } = useCreatorStore()

  const project = getProject(projectId)

  // Fetch projects if not loaded yet
  useEffect(() => {
    if (currentUser?.id && !project) {
      fetchProjects(currentUser.id)
    }
  }, [currentUser?.id, project, fetchProjects])

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/' })
    }
  }, [isAuthenticated, navigate])

  // Redirect explorers to /explorer
  useEffect(() => {
    if (currentUser && currentUser.role === 'explorer') {
      navigate({ to: '/explorer' })
    }
  }, [currentUser, navigate])

  // Helper to save project-level fields
  const saveProjectField = useCallback(
    async (updates: Record<string, unknown>) => {
      if (!project || !currentUser?.id) return
      const result = await updateProject({
        data: { projectId: project.id, updates },
      })
      if (result.success) {
        toast.success('Saved')
        await fetchProjects(currentUser.id)
      } else {
        throw new Error('Failed to save')
      }
    },
    [project, currentUser?.id, fetchProjects],
  )

  // Helper to save session-level fields
  const saveSessionField = useCallback(
    async (sessionId: string, updates: Record<string, unknown>) => {
      if (!currentUser?.id) return
      const result = await apiUpdateSession({
        data: { sessionId, updates },
      })
      if (result.success) {
        toast.success('Saved')
        await fetchProjects(currentUser.id)
      } else {
        throw new Error('Failed to save')
      }
    },
    [currentUser?.id, fetchProjects],
  )

  // Callback for timeline editor to refresh data
  const handleTimelineSaved = useCallback(async () => {
    if (currentUser?.id) {
      await fetchProjects(currentUser.id)
    }
  }, [currentUser?.id, fetchProjects])

  if (!currentUser || currentUser.role === 'explorer') {
    return null
  }

  if (!project) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Project Not Found
          </h2>
          <p className="text-muted-foreground mb-4">
            The project you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate({ to: '/creator' })}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const status: CreatorProjectStatus = getProjectTimeStatus(
    project.startDate,
    project.endDate,
  )
  const progress = getProjectProgress(project.startDate, project.endDate)
  const timeInfo = getProjectTimeInfo(project.startDate, project.endDate)
  const isEditable = status === 'scheduled'

  const statusColors: Record<CreatorProjectStatus, string> = {
    scheduled: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    opened: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30',
    closed: 'bg-green-500/10 text-green-500 border-green-500/30',
  }

  const statusLabels: Record<CreatorProjectStatus, string> = {
    scheduled: 'Scheduled',
    opened: 'Opened',
    closed: 'Closed',
  }

  const difficultyColors: Record<string, string> = {
    easy: 'bg-green-500/10 text-green-400 border-green-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    hard: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate({ to: '/creator' })}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <Settings className="w-8 h-8 text-cyan-500 shrink-0" />
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <InlineText
                    value={project.name}
                    onSave={async (val) => {
                      await saveProjectField({ title: val })
                    }}
                    editable={isEditable}
                    className="text-3xl font-bold text-foreground"
                    inputClassName="text-2xl font-bold"
                    placeholder="Project name"
                  />
                </h1>
                <Badge
                  variant="outline"
                  className={`text-xs uppercase font-bold shrink-0 ${statusColors[status]}`}
                >
                  {statusLabels[status]}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Project Details
                {isEditable && (
                  <span className="text-xs text-amber-500 ml-2">
                    (editable while scheduled)
                  </span>
                )}
              </p>
            </div>
            {status === 'opened' && (
              <Button
                onClick={() =>
                  navigate({
                    to: '/creator/project/$projectId/monitor',
                    params: { projectId: project.id },
                  })
                }
                className="bg-cyan-600 hover:bg-cyan-700 text-white shrink-0"
              >
                Monitor Progress
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>{timeInfo.elapsed} elapsed</span>
            <span>{timeInfo.remaining} left</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Project Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Description
              </h3>
              {isEditable ? (
                <InlineText
                  value={project.description}
                  onSave={async (val) => {
                    await saveProjectField({ description: val })
                  }}
                  editable
                  multiline
                  className="text-foreground whitespace-pre-wrap"
                  placeholder="Add a project description..."
                />
              ) : (
                <p className="text-foreground whitespace-pre-wrap">
                  {project.description || (
                    <span className="text-muted-foreground italic">No description</span>
                  )}
                </p>
              )}
            </div>

            {/* Driving Question */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Driving Question
              </h3>
              {isEditable ? (
                <InlineText
                  value={project.drivingQuestion}
                  onSave={async (val) => {
                    await saveProjectField({ drivingQuestion: val })
                  }}
                  editable
                  multiline
                  className="text-foreground italic"
                  placeholder="Add a driving question..."
                />
              ) : (
                <p className="text-foreground italic">
                  {project.drivingQuestion || (
                    <span className="text-muted-foreground">No driving question</span>
                  )}
                </p>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                Timeline
              </h3>
              {isEditable && project.sessions.length > 0 ? (
                <TimelineEditor
                  projectId={project.id}
                  startDate={project.startDate}
                  endDate={project.endDate}
                  sessions={project.sessions}
                  onSaved={handleTimelineSaved}
                />
              ) : (
                <div className="flex items-center gap-3 px-3 py-2 bg-muted/30 rounded-lg border border-border text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-foreground">
                    {safeFormatDate(project.startDate, 'MMM d, yyyy HH:mm', 'TBD')}
                    {' - '}
                    {safeFormatDate(project.endDate, 'MMM d, yyyy HH:mm', 'TBD')}
                  </span>
                </div>
              )}
            </div>

            {/* Sessions */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                Sessions ({project.sessions.length})
              </h3>
              {project.sessions.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No sessions configured.
                </p>
              ) : (
                <div className="space-y-3">
                  {project.sessions.map((session, idx) => (
                    <div
                      key={session.id}
                      className="flex items-start gap-4 p-3 rounded-lg bg-muted/30 border border-border"
                    >
                      <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-cyan-400">
                          {idx + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Session Title + Difficulty + Deliverable */}
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <InlineText
                            value={session.title}
                            onSave={async (val) => {
                              await saveSessionField(session.id, { title: val })
                            }}
                            editable={isEditable}
                            className="font-medium text-foreground text-sm"
                            placeholder="Session title"
                          />
                          {isEditable ? (
                            <Select
                              value={session.difficulty}
                              onValueChange={async (val: string) => {
                                try {
                                  await saveSessionField(session.id, {
                                    difficulty: val as SessionDifficulty,
                                  })
                                } catch {
                                  toast.error('Failed to save difficulty')
                                }
                              }}
                            >
                              <SelectTrigger size="sm" className="h-5 text-[10px] w-auto px-2 py-0 border-border">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="easy">easy</SelectItem>
                                <SelectItem value="medium">medium</SelectItem>
                                <SelectItem value="hard">hard</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${difficultyColors[session.difficulty] || ''}`}
                            >
                              {session.difficulty}
                            </Badge>
                          )}
                          {isEditable ? (
                            <Select
                              value={session.deliverableType}
                              onValueChange={async (val: string) => {
                                try {
                                  await saveSessionField(session.id, {
                                    deliverableType: val as DeliverableType,
                                  })
                                } catch {
                                  toast.error('Failed to save deliverable type')
                                }
                              }}
                            >
                              <SelectTrigger size="sm" className="h-5 text-[10px] w-auto px-2 py-0 border-border">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No deliverable</SelectItem>
                                <SelectItem value="document">Document</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            session.deliverableType !== 'none' && (
                              <FileText className="w-3 h-3 text-muted-foreground" />
                            )
                          )}
                        </div>
                        {/* Session Topic */}
                        {(session.topic || isEditable) && (
                          <div className="mb-1">
                            <InlineText
                              value={session.topic}
                              onSave={async (val) => {
                                await saveSessionField(session.id, { topic: val })
                              }}
                              editable={isEditable}
                              className="text-xs text-muted-foreground"
                              placeholder="Add session topic..."
                            />
                          </div>
                        )}
                        {/* Session Dates (read-only, managed by timeline) */}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            {safeFormatDate(session.startDate, 'MMM d HH:mm', 'TBD')}
                            {' - '}
                            {safeFormatDate(session.endDate, 'MMM d HH:mm', 'TBD')}
                          </span>
                        </div>
                        <RubricEditor
                          sessionId={session.id}
                          rubric={session.rubric}
                          editable={isEditable}
                          onChanged={handleTimelineSaved}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <div className="space-y-6">
            {/* Join Code */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Join Code
              </h3>
              <JoinCode
                joinCode={project.joinCode}
                projectId={project.id}
                creatorId={project.creatorId}
                projectName={project.name}
                size="lg"
              />
            </div>

            {/* Quick Info */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Details
              </h3>
              <div className="space-y-3 text-sm">
                {/* Type (Individual/Group) */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    {project.teamSize === 1 ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Users className="w-4 h-4" />
                    )}
                    Type
                  </span>
                  <span className="text-foreground">
                    {project.teamSize === 1 ? 'Individual' : 'Group'}
                  </span>
                </div>
                {/* Team Size */}
                {project.teamSize > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      Team Size
                    </span>
                    {isEditable ? (
                      <TeamSizeEditor
                        value={project.teamSize}
                        onSave={async (val) => {
                          await saveProjectField({ teamSize: val })
                        }}
                      />
                    ) : (
                      <span className="text-foreground">
                        {project.teamSize} members
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Sessions
                  </span>
                  <span className="text-foreground">
                    {project.sessions.length}
                  </span>
                </div>
                {/* Start Date (read-only in sidebar, edited via timeline) */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground shrink-0">
                    <Clock className="w-4 h-4" />
                    Start
                  </span>
                  <span className="text-foreground">
                    {safeFormatDate(project.startDate, 'MMM d, yyyy HH:mm', 'TBD')}
                  </span>
                </div>
                {/* End Date */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground shrink-0">
                    <Clock className="w-4 h-4" />
                    End
                  </span>
                  <span className="text-foreground">
                    {safeFormatDate(project.endDate, 'MMM d, yyyy HH:mm', 'TBD')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    Teams
                  </span>
                  <span className="text-foreground">
                    {project.teams.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Created */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Created
              </h3>
              <p className="text-sm text-foreground">
                {safeFormatDate(
                  project.createdAt,
                  'MMM d, yyyy HH:mm',
                  'Unknown',
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
