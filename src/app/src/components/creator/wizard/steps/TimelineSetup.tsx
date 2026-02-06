import { useState, useMemo, useEffect } from 'react'
import { Calendar, Clock } from 'lucide-react'
import { format, addMinutes, addWeeks, differenceInMinutes } from 'date-fns'
import { useCreatorStore } from '@/stores/creatorStore'
import { Input } from '@/components/ui/input'
import { cn, safeFormatDate, isValidDate } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'

// Duration presets with labels and minutes
const DURATION_PRESETS = [
  { label: '5min', minutes: 5 },
  { label: '10min', minutes: 10 },
  { label: '15min', minutes: 15 },
  { label: '30min', minutes: 30 },
  { label: '1hour', minutes: 60 },
  { label: '2hours', minutes: 120 },
  { label: '4hours', minutes: 240 },
  { label: '8hours', minutes: 480 },
  { label: '1day', minutes: 1440 },
  { label: '2days', minutes: 2880 },
  { label: '1week', minutes: 10080 },
  { label: '2weeks', minutes: 20160 },
  { label: '4weeks', minutes: 40320 },
  { label: '8weeks', minutes: 80640 },
  { label: '16weeks', minutes: 161280 },
]

// Find the closest preset index for a given duration in minutes
function findClosestPresetIndex(minutes: number): number {
  let closestIndex = 0
  let closestDiff = Math.abs(DURATION_PRESETS[0].minutes - minutes)
  
  for (let i = 1; i < DURATION_PRESETS.length; i++) {
    const diff = Math.abs(DURATION_PRESETS[i].minutes - minutes)
    if (diff < closestDiff) {
      closestDiff = diff
      closestIndex = i
    }
  }
  
  return closestIndex
}

// Format duration for display
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`
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

export function TimelineSetup() {
  const { wizardState, setTimeline } = useCreatorStore()
  const { timeline, validationErrors } = wizardState

  // Initialize timeline if not set
  useEffect(() => {
    if (!isValidDate(timeline.startDate) || !isValidDate(timeline.endDate)) {
      const now = new Date()
      now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0)
      const start = now
      const end = addMinutes(start, 5)
      setTimeline({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      })
    }
  }, [timeline.startDate, timeline.endDate, setTimeline])

  // Parse existing dates or use defaults
  const startDateTime = useMemo(() => {
    if (isValidDate(timeline.startDate)) {
      return new Date(timeline.startDate)
    }
    // Default to now, rounded to nearest 15 minutes
    const now = new Date()
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0)
    return now
  }, [timeline.startDate])

  const endDateTime = useMemo(() => {
    if (isValidDate(timeline.endDate)) {
      return new Date(timeline.endDate)
    }
    // Default to 5 minutes from start
    return addMinutes(startDateTime, 5)
  }, [timeline.endDate, startDateTime])

  // Calculate duration in minutes
  const durationMinutes = useMemo(() => {
    return differenceInMinutes(endDateTime, startDateTime)
  }, [startDateTime, endDateTime])

  // Find current slider position
  const [sliderValue, setSliderValue] = useState(() => findClosestPresetIndex(durationMinutes))

  // Update timeline when slider changes
  const handleSliderChange = (value: number[]) => {
    const presetIndex = value[0]
    setSliderValue(presetIndex)
    
    const preset = DURATION_PRESETS[presetIndex]
    const newEndDate = addMinutes(startDateTime, preset.minutes)
    
    setTimeline({
      startDate: startDateTime.toISOString(),
      endDate: newEndDate.toISOString(),
    })
  }

  // Handle start date change
  const handleStartDateChange = (dateStr: string) => {
    if (!dateStr) return
    
    const [date, time] = [
      dateStr,
      format(startDateTime, 'HH:mm')
    ]
    const newStart = new Date(`${date}T${time}`)
    
    // Keep the same duration
    const newEnd = addMinutes(newStart, durationMinutes)
    
    setTimeline({
      startDate: newStart.toISOString(),
      endDate: newEnd.toISOString(),
    })
  }

  // Handle start time change
  const handleStartTimeChange = (timeStr: string) => {
    if (!timeStr) return
    
    const dateStr = format(startDateTime, 'yyyy-MM-dd')
    const newStart = new Date(`${dateStr}T${timeStr}`)
    
    // Keep the same duration
    const newEnd = addMinutes(newStart, durationMinutes)
    
    setTimeline({
      startDate: newStart.toISOString(),
      endDate: newEnd.toISOString(),
    })
  }

  // Handle end date change
  const handleEndDateChange = (dateStr: string) => {
    if (!dateStr) return
    
    const timeStr = format(endDateTime, 'HH:mm')
    const newEnd = new Date(`${dateStr}T${timeStr}`)
    
    setTimeline({
      startDate: startDateTime.toISOString(),
      endDate: newEnd.toISOString(),
    })
    
    // Update slider to match new duration
    const newDuration = differenceInMinutes(newEnd, startDateTime)
    setSliderValue(findClosestPresetIndex(newDuration))
  }

  // Handle end time change
  const handleEndTimeChange = (timeStr: string) => {
    if (!timeStr) return
    
    const dateStr = format(endDateTime, 'yyyy-MM-dd')
    const newEnd = new Date(`${dateStr}T${timeStr}`)
    
    setTimeline({
      startDate: startDateTime.toISOString(),
      endDate: newEnd.toISOString(),
    })
    
    // Update slider to match new duration
    const newDuration = differenceInMinutes(newEnd, startDateTime)
    setSliderValue(findClosestPresetIndex(newDuration))
  }

  // Apply preset directly
  const applyPreset = (presetIndex: number) => {
    setSliderValue(presetIndex)
    const preset = DURATION_PRESETS[presetIndex]
    const newEndDate = addMinutes(startDateTime, preset.minutes)
    
    setTimeline({
      startDate: startDateTime.toISOString(),
      endDate: newEndDate.toISOString(),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Project Duration</h2>
        <p className="text-muted-foreground">
          Set the start and end dates with times for your project
        </p>
      </div>

      {/* Duration Slider */}
      <div className="p-4 bg-card rounded-xl border border-border">
        <label className="text-sm font-medium text-foreground mb-3 block">
          Quick Duration Selector
        </label>
        
        {/* Compact Preset Buttons - Equal Width Single Row */}
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${DURATION_PRESETS.length}, 1fr)` }}
        >
          {DURATION_PRESETS.map((preset, index) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(index)}
              className={cn(
                'py-1.5 rounded text-xs font-medium text-center transition-all',
                sliderValue === index
                  ? 'bg-cyan-500 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
        
        {/* Slider */}
        <div className="mt-3 px-1">
          <Slider
            value={[sliderValue]}
            onValueChange={handleSliderChange}
            max={DURATION_PRESETS.length - 1}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      {/* Date & Time Inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Start Date & Time */}
        <div className="p-4 bg-muted/40 rounded-xl border border-border">
          <label className="text-sm font-medium text-foreground mb-3 block">
            <Calendar className="w-4 h-4 inline mr-2" />
            Start Date & Time <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Date</label>
              <Input
                type="date"
                value={format(startDateTime, 'yyyy-MM-dd')}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className={cn(
                  'bg-background border-border',
                  validationErrors.startDate && 'border-red-500'
                )}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Time</label>
              <Input
                type="time"
                value={format(startDateTime, 'HH:mm')}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="bg-background border-border"
              />
            </div>
          </div>
          {validationErrors.startDate && (
            <p className="text-xs text-red-400 mt-2">{validationErrors.startDate}</p>
          )}
        </div>

        {/* End Date & Time */}
        <div className="p-4 bg-muted/40 rounded-xl border border-border">
          <label className="text-sm font-medium text-foreground mb-3 block">
            <Calendar className="w-4 h-4 inline mr-2" />
            End Date & Time <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Date</label>
              <Input
                type="date"
                value={format(endDateTime, 'yyyy-MM-dd')}
                min={format(startDateTime, 'yyyy-MM-dd')}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className={cn(
                  'bg-background border-border',
                  validationErrors.endDate && 'border-red-500'
                )}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Time</label>
              <Input
                type="time"
                value={format(endDateTime, 'HH:mm')}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                className="bg-background border-border"
              />
            </div>
          </div>
          {validationErrors.endDate && (
            <p className="text-xs text-red-400 mt-2">{validationErrors.endDate}</p>
          )}
        </div>
      </div>

      {/* Duration Display */}
      {durationMinutes > 0 && (
        <div className="p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-500/30">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Clock className="w-7 h-7 text-cyan-500" />
            </div>
            <div className="flex-1">
              <div className="text-3xl font-bold text-foreground">
                {formatDuration(durationMinutes)}
              </div>
              <div className="text-muted-foreground">Total project duration</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-foreground">
                {safeFormatDate(startDateTime.toISOString(), 'MMM d, yyyy HH:mm', 'Not set')}
              </div>
              <div className="text-xs text-muted-foreground my-1">to</div>
              <div className="text-sm text-foreground">
                {safeFormatDate(endDateTime.toISOString(), 'MMM d, yyyy HH:mm', 'Not set')}
              </div>
            </div>
          </div>

          {/* Timeline visualization */}
          <div className="mt-6 pt-4 border-t border-border/50">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-green-500 shadow-lg shadow-green-500/30" />
              <div className="flex-1 h-2 bg-gradient-to-r from-green-500 via-cyan-500 to-blue-500 rounded-full mx-2" />
              <div className="w-4 h-4 rounded-full bg-blue-500 shadow-lg shadow-blue-500/30" />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Project Start</span>
              <span>Project End</span>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="p-4 bg-muted/40 rounded-lg border border-border">
        <h4 className="text-sm font-medium text-foreground mb-2">Timeline Tips</h4>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Use the slider for quick duration selection</li>
          <li>Short durations (15min-8hours) are great for workshops or class sessions</li>
          <li>Longer durations (weeks) are better for semester-long projects</li>
          <li>You can fine-tune individual session durations in the next steps</li>
        </ul>
      </div>
    </div>
  )
}
