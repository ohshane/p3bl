import { Card, CardContent } from '@/components/ui/card'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
} from 'date-fns'

export function MiniCalendar() {
  const today = new Date()

  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-xs font-medium text-muted-foreground py-1"
            >
              {day}
            </div>
          ))}

          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, today)
            const isToday = isSameDay(day, today)

            return (
              <div
                key={day.toISOString()}
                className={`
                  text-xs py-1 rounded
                  ${!isCurrentMonth && 'text-muted-foreground/40'}
                  ${isToday && 'bg-primary text-primary-foreground font-bold'}
                `}
              >
                {format(day, 'd')}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
