import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { format } from 'date-fns'

export function ClockWidget() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardContent className="p-5 text-center">
        <div className="text-3xl font-bold font-mono text-foreground">
          {format(now, 'HH:mm:ss')}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {format(now, 'EEEE, MMMM d, yyyy')}
        </div>
      </CardContent>
    </Card>
  )
}
