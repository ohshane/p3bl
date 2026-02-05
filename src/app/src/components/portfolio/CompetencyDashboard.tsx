import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CompetencyScores, CompetencyType } from '@/types'
import { COMPETENCY_LABELS } from '@/types'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface CompetencyDashboardProps {
  competencies: CompetencyScores
}

export function CompetencyDashboard({ competencies }: CompetencyDashboardProps) {
  // Transform data for radar chart
  const chartData = (Object.entries(competencies) as [CompetencyType, CompetencyScores[CompetencyType]][]).map(
    ([key, value]) => ({
      competency: COMPETENCY_LABELS[key],
      current: value.current,
      baseline: value.baseline || 0,
    })
  )

  // Check if user has baseline (has submitted at least one artifact)
  const hasBaseline = Object.values(competencies).some(c => c.baseline !== null)

  return (
    <div className="space-y-8">
      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Competency Overview</span>
            {!hasBaseline && (
              <Badge variant="outline" className="font-normal">
                No baseline yet
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="competency"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                {hasBaseline && (
                  <Radar
                    name="Baseline"
                    dataKey="baseline"
                    stroke="hsl(var(--muted-foreground))"
                    fill="hsl(var(--muted-foreground))"
                    fillOpacity={0.1}
                    strokeDasharray="5 5"
                  />
                )}
                <Radar
                  name="Current"
                  dataKey="current"
                  stroke="hsl(var(--chart-1))"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.3}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Competency Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(Object.entries(competencies) as [CompetencyType, CompetencyScores[CompetencyType]][]).map(
          ([key, value]) => (
            <CompetencyCard
              key={key}
              name={COMPETENCY_LABELS[key]}
              current={value.current}
              baseline={value.baseline}
              insight={value.insight}
            />
          )
        )}
      </div>
    </div>
  )
}

interface CompetencyCardProps {
  name: string
  current: number
  baseline: number | null
  insight: string
}

function CompetencyCard({ name, current, baseline, insight }: CompetencyCardProps) {
  const delta = baseline !== null ? current - baseline : null
  
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-500'
    if (score >= 50) return 'text-amber-500'
    return 'text-red-500'
  }

  const getDeltaIcon = () => {
    if (delta === null) return null
    if (delta > 0) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (delta < 0) return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-muted-foreground" />
  }

  const getDeltaColor = () => {
    if (delta === null) return ''
    if (delta > 0) return 'text-green-500'
    if (delta < 0) return 'text-red-500'
    return 'text-muted-foreground'
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-medium">{name}</h4>
          <div className="flex items-center gap-2">
            <span className={cn('text-2xl font-bold', getScoreColor(current))}>
              {current}
            </span>
            {delta !== null && (
              <div className={cn('flex items-center gap-1 text-sm', getDeltaColor())}>
                {getDeltaIcon()}
                <span>{delta > 0 ? '+' : ''}{delta}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full mb-3 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              current >= 70 ? 'bg-green-500' : current >= 50 ? 'bg-amber-500' : 'bg-red-500'
            )}
            style={{ width: `${current}%` }}
          />
        </div>

        {/* Insight */}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {insight}
        </p>
      </CardContent>
    </Card>
  )
}
