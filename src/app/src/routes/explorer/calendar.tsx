import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo, useEffect, useRef } from 'react'
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  FolderPlus,
  ListChecks,
  Loader2,
  Clock,
  ExternalLink
} from 'lucide-react'
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isToday,
  startOfDay,
  differenceInMinutes
} from 'date-fns'
import { useProjectStore } from '@/stores/projectStore'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/explorer/calendar')({
  component: ExplorerCalendarPage,
})

function ExplorerCalendarPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()
  const { userProjects, fetchUserProjects, isLoadingProjects } = useProjectStore()
  
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 1, 1)) // Context date
  const [selectedDate, setSelectedDate] = useState(() => new Date(2026, 1, 1))
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }, [])

  // Fetch projects on mount
  useEffect(() => {
    if (currentUser?.id && userProjects.length === 0) {
      fetchUserProjects(currentUser.id)
    }
  }, [currentUser?.id, fetchUserProjects, userProjects.length])

  // Week View Data
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate)
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i))
  }, [currentDate])

  // Calendar logic
  const days = useMemo(() => {
    if (viewMode === 'month') {
      const start = startOfWeek(startOfMonth(currentDate))
      const end = endOfWeek(endOfMonth(currentDate))
      return eachDayOfInterval({ start, end })
    } else {
      return weekDays
    }
  }, [currentDate, viewMode, weekDays])

  // Map projects to dates (active period)
  const projectsByDate = useMemo(() => {
    const map: Record<string, any[]> = {}
    
    userProjects.forEach(project => {
      if (project.startDate && project.endDate) {
        try {
          const start = new Date(project.startDate)
          const end = new Date(project.endDate)
          
          if (isNaN(start.getTime()) || isNaN(end.getTime())) return

          const intervalStart = new Date(start.getFullYear(), start.getMonth(), start.getDate())
          const intervalEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate())
          
          const daysInRange = eachDayOfInterval({ start: intervalStart, end: intervalEnd })
          
          daysInRange.forEach(day => {
            const dateKey = format(day, 'yyyy-MM-dd')
            if (!map[dateKey]) map[dateKey] = []
            if (!map[dateKey].find(p => p.id === project.id)) {
              map[dateKey].push(project)
            }
          })
        } catch (e) {
          const dateKey = format(new Date(project.startDate), 'yyyy-MM-dd')
          if (!map[dateKey]) map[dateKey] = []
          if (!map[dateKey].find(p => p.id === project.id)) {
            map[dateKey].push(project)
          }
        }
      }
    })
    
    return map
  }, [userProjects])

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1))
    } else {
      setCurrentDate(addDays(currentDate, 7))
    }
  }

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1))
    } else {
      setCurrentDate(addDays(currentDate, -7))
    }
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  const selectedDateProjects = useMemo(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd')
    return projectsByDate[dateKey] || []
  }, [selectedDate, projectsByDate])

  // Current time line calculation
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const currentTimeTop = useMemo(() => {
    const minutes = now.getHours() * 60 + now.getMinutes()
    return (minutes / 1440) * 100
  }, [now])

  const hours = useMemo(() => Array.from({ length: 24 }).map((_, i) => i), [])

  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll to current time on mount/view change
  useEffect(() => {
    if (viewMode === 'week' && scrollRef.current && isMounted) {
      const totalHeight = 1536 // min-h-[1536px]
      const scrollPosition = (currentTimeTop / 100) * totalHeight
      const containerHeight = scrollRef.current.clientHeight
      
      scrollRef.current.scrollTop = scrollPosition - containerHeight / 2
    }
  }, [viewMode, isMounted, currentTimeTop])

  const weekProjects = useMemo(() => {
    const start = startOfWeek(currentDate)
    const end = endOfWeek(currentDate)
    
    const allDay: any[] = []
    const timed: any[] = []

    userProjects.forEach(p => {
      if (!p.startDate || !p.endDate) return
      const pStart = new Date(p.startDate)
      const pEnd = new Date(p.endDate)
      
      if (pStart < end && pEnd > start) {
        if (differenceInMinutes(pEnd, pStart) >= 1440 || !isSameDay(pStart, pEnd)) {
          allDay.push(p)
        } else {
          timed.push(p)
        }
      }
    })

    return { allDay, timed }
  }, [userProjects, currentDate])

  // Filter sessions for week view timed blocks
  const weekSessions = useMemo(() => {
    const start = startOfWeek(currentDate)
    const end = endOfWeek(currentDate)
    
    const timed: any[] = []

    userProjects.forEach(project => {
      project.sessions?.forEach(session => {
        if (!session.startDate || !session.endDate) return
        const sStart = new Date(session.startDate)
        const sEnd = new Date(session.endDate)
        
        if (sStart < end && sEnd > start) {
          timed.push({
            ...session,
            startDate: sStart.toISOString(),
            endDate: sEnd.toISOString(),
            projectTitle: project.title,
            projectId: project.id
          })
        }
      })
    })

    return timed
  }, [userProjects, currentDate])

  if (!isMounted || (isLoadingProjects && userProjects.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your schedule...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-cyan-500" />
            My Calendar
          </h1>
          <p className="text-muted-foreground mt-1">
            View your project timelines and upcoming session deadlines
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1 mr-2">
            <button
              onClick={() => setViewMode('month')}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                viewMode === 'month' ? "bg-background shadow-sm text-cyan-600" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                viewMode === 'week' ? "bg-background shadow-sm text-cyan-600" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Week
            </button>
          </div>

          <div className="flex items-center gap-3 bg-card border border-border p-1 rounded-lg">
            <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs font-semibold">
              Today
            </Button>
            <div className="flex items-center border-l border-border pl-2">
              <Button variant="ghost" size="icon" onClick={handlePrev} className="h-8 w-8">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="min-w-[140px] text-center font-bold text-sm">
                {viewMode === 'month' 
                  ? format(currentDate, 'MMMM yyyy')
                  : `Week of ${format(startOfWeek(currentDate), 'MMM d')}`
                }
              </span>
              <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-border bg-muted/30">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-border border-l border-t border-transparent">
            {days.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd')
              const dayProjects = projectsByDate[dateKey] || []
              const isSelectedMonth = isSameMonth(day, currentDate)
              const isSelected = isSameDay(day, selectedDate)
              
              return (
                <div 
                  key={`cell-${day.toISOString()}`} 
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "min-h-[140px] p-2 transition-colors cursor-pointer relative hover:bg-muted/5",
                    !isSelectedMonth ? "bg-muted/10 text-muted-foreground/50" : "bg-card",
                    isSelected && "bg-cyan-500/5 ring-2 ring-inset ring-cyan-500"
                  )}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={cn(
                      "text-sm font-semibold rounded-full w-7 h-7 flex items-center justify-center",
                      isToday(day) ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20" : 
                      !isSelectedMonth ? "text-muted-foreground/30" : "text-muted-foreground"
                    )}>
                      {format(day, 'd')}
                    </span>
                    {dayProjects.length > 0 && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold bg-muted/50 text-muted-foreground">
                        {dayProjects.length}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-[100px] scrollbar-none">
                    {dayProjects.map((project) => (
                      <button
                        key={`proj-indicator-${day.toISOString()}-${project.id}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate({ to: `/explorer/project/${project.id}` })
                        }}
                        className="w-full text-left p-1.5 rounded bg-purple-500/10 border border-purple-500/20 hover:bg-purple-400 hover:text-white transition-all group cursor-pointer"
                      >
                        <div className="text-[10px] font-bold text-purple-600 group-hover:text-white truncate uppercase tracking-tighter">
                          {project.title}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW (Vertical Hours) */}
      {viewMode === 'week' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-350px)] min-h-[500px]">
          {/* Header: Days */}
          <div className="flex border-b border-border bg-muted/30">
            <div className="w-16 flex-shrink-0 border-r border-border" />
            <div className="flex-1 grid grid-cols-7">
              {weekDays.map((day, idx) => {
                const isSelected = isSameDay(day, selectedDate)
                return (
                  <div 
                    key={day.toISOString()} 
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "text-center py-3 transition-colors cursor-pointer relative hover:bg-muted/5", 
                      isSelected ? "bg-cyan-500/5 ring-2 ring-inset ring-cyan-500" : "",
                      idx < 6 && !isSelected && "border-r border-border"
                    )}
                  >
                    <div className={cn("text-[10px] uppercase font-bold tracking-widest", isSelected ? "text-cyan-600" : "text-muted-foreground")}>{format(day, 'EEE')}</div>
                    <div className={cn(
                      "inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mt-1",
                      isToday(day) ? "bg-cyan-600 text-white shadow-md" : 
                      isSelected ? "text-cyan-600" : "text-foreground"
                    )}>
                      {format(day, 'd')}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* All Day Section */}
          {weekProjects.allDay.length > 0 && (
            <div className="flex border-b border-border">
              <div className="w-16 flex-shrink-0 border-r border-border bg-muted/5 flex items-center justify-center text-[10px] text-muted-foreground font-medium p-2">
                All-day
              </div>
              <div className="flex-1 p-0 grid grid-cols-7 bg-muted/5">
                {weekDays.map((day, idx) => {
                  const dayAllDayProjects = weekProjects.allDay.filter(p => {
                    const start = new Date(p.startDate)
                    const end = new Date(p.endDate)
                    return day >= startOfDay(start) && day <= startOfDay(end)
                  })
                  
                  return (
                    <div 
                      key={`allday-${day.toISOString()}`} 
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "p-0.5 min-h-[32px] gap-0.5 cursor-pointer transition-colors relative hover:bg-muted/5 flex flex-col", 
                        idx < 6 && "border-r border-border/50"
                      )}
                    >
                      {dayAllDayProjects.map(p => (
                        <button 
                          key={p.id} 
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate({ to: `/explorer/project/${p.id}` })
                          }}
                          className="w-full bg-purple-500/10 text-purple-600 text-[9px] px-1.5 py-1 truncate shadow-sm hover:bg-purple-400 hover:text-white border border-purple-500/20 transition-all text-left rounded-sm cursor-pointer group"
                        >
                          <span className="font-bold uppercase tracking-tighter">{p.title}</span>
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Scrollable Grid */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto relative scrollbar-none">
            <div className="flex min-h-[1536px] relative">
              {/* Time Axis */}
              <div className="w-16 flex-shrink-0 border-r border-border bg-muted/5 text-[10px] text-muted-foreground select-none relative z-20">
                {hours.map(h => (
                  <div key={h} className="h-16 border-b border-border/50 text-right pr-2 relative">
                    <span className="-top-2 absolute right-2">{format(new Date().setHours(h, 0, 0, 0), 'ha')}</span>
                  </div>
                ))}
              </div>

              {/* Columns */}
              <div className="flex-1 grid grid-cols-7 relative h-[1536px]">
                {/* Current Time Line */}
                <div 
                  className="absolute left-0 right-0 z-40 pointer-events-none flex items-center"
                  style={{ top: `${currentTimeTop}%` }}
                >
                  <div className="absolute -left-1 w-2 h-2 rounded-full bg-red-500 z-50" />
                  <div className="w-full h-0.5 bg-red-500" />
                </div>

                {/* Horizontal Background Lines */}
                <div className="absolute inset-0 flex flex-col pointer-events-none">
                  {hours.map(h => (
                    <div key={h} className="h-16 border-b border-border/50 w-full" />
                  ))}
                </div>

                {weekDays.map((day, idx) => {
                  return (
                    <div 
                      key={day.toISOString()} 
                      className={cn(
                        "relative h-[1536px] transition-colors cursor-pointer hover:bg-muted/5", 
                        idx < 6 && "border-r border-border"
                      )}
                      onClick={() => setSelectedDate(day)}
                    >
                      {/* Render Session Blocks */}
                      {weekSessions
                        .filter(s => {
                          // Show session on any day it spans
                          const sessionStart = new Date(s.startDate)
                          const sessionEnd = new Date(s.endDate)
                          const dayStart = startOfDay(day)
                          const dayEnd = addDays(dayStart, 1)
                          return sessionStart < dayEnd && sessionEnd > dayStart
                        })
                        .map(session => {
                          const sessionStart = new Date(session.startDate)
                          const sessionEnd = new Date(session.endDate)
                          const dayStart = startOfDay(day)
                          const dayEnd = addDays(dayStart, 1)
                          
                          // Calculate visible portion of session for this day
                          const visibleStart = sessionStart < dayStart ? dayStart : sessionStart
                          const visibleEnd = sessionEnd > dayEnd ? dayEnd : sessionEnd
                          
                          const startMin = visibleStart.getHours() * 60 + visibleStart.getMinutes()
                          const duration = differenceInMinutes(visibleEnd, visibleStart)
                          
                          // Determine if this is start/middle/end day for styling
                          const isStartDay = isSameDay(sessionStart, day)
                          const isEndDay = isSameDay(sessionEnd, day)
                          
                          return (
                            <div 
                              key={`session-${session.id}-${day.toISOString()}`}
                              style={{
                                top: `${(startMin / 1440) * 100}%`,
                                height: `${Math.max((duration / 1440) * 100, 2)}%`,
                                minHeight: '32px'
                              }}
                              className={cn(
                                "absolute inset-x-1 bg-cyan-500/10 text-cyan-600 text-[10px] p-1.5 overflow-hidden shadow-sm border border-cyan-500/20 z-10 cursor-pointer hover:bg-cyan-500 hover:text-white transition-all group",
                                isStartDay && isEndDay && "rounded",
                                isStartDay && !isEndDay && "rounded-t",
                                !isStartDay && isEndDay && "rounded-b",
                                !isStartDay && !isEndDay && "rounded-none"
                              )}
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate({ to: `/explorer/project/${session.projectId}` })
                              }}
                            >
                              <div className="font-bold truncate uppercase tracking-tighter group-hover:text-white">
                                {session.projectTitle}
                              </div>
                              <div className="text-[9px] opacity-90 truncate group-hover:text-white">
                                {session.title}
                              </div>
                            </div>
                          )
                        })
                      }
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Day Projects Section */}
      <div className="mt-8">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-xl text-foreground flex items-center gap-2">
              <Clock className="w-6 h-6 text-cyan-500" />
              Active Projects on {format(selectedDate, 'MMMM d, yyyy')}
            </h3>
            {isToday(selectedDate) && (
              <Badge className="bg-cyan-500 hover:bg-cyan-600">Today</Badge>
            )}
          </div>
          
          <div className="space-y-4">
            {selectedDateProjects.length > 0 ? (
              selectedDateProjects.map((project) => (
                <div key={`selected-proj-${project.id}`} className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                      <FolderPlus className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-foreground">{project.title}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          {project.startDate ? format(new Date(project.startDate), 'MMM d, HH:mm') : 'N/A'} - {project.endDate ? format(new Date(project.endDate), 'MMM d, HH:mm') : 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <ListChecks className="w-3.5 h-3.5" />
                          {project.sessionCount} sessions
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={() => navigate({ to: `/explorer/project/${project.id}` })}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2"
                    >
                      Enter Project
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                <CalendarIcon className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">
                  No projects scheduled for this date.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
