import { useMemo, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { TrendingDown, Zap, Info, Loader2 } from 'lucide-react'
import { useCreatorStore } from '@/stores/creatorStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface DipChartProps {
  projectId: string
}

export function DipChart({ projectId }: DipChartProps) {
  const { 
    getDipChartData, 
    getProjectInterventions, 
    fetchDipChartData,
    isLoadingMetrics,
  } = useCreatorStore()
  
  const chartData = getDipChartData(projectId)
  const interventions = getProjectInterventions(projectId)

  // Fetch metrics data on mount
  useEffect(() => {
    fetchDipChartData(projectId)
  }, [projectId, fetchDipChartData])

  // Find the lowest point (the "dip")
  const dipPoint = useMemo(() => {
    if (chartData.length === 0) return { date: '', confidence: 0 }
    let minConfidence = 100
    let dipDate = ''
    chartData.forEach(point => {
      if (point.confidence < minConfidence) {
        minConfidence = point.confidence
        dipDate = point.date
      }
    })
    return { date: dipDate, confidence: minConfidence }
  }, [chartData])

  // Calculate efficacy gap (difference between AI-supported and traditional)
  const efficacyGap = useMemo(() => {
    if (chartData.length === 0) return 0
    const latestPoint = chartData[chartData.length - 1]
    return latestPoint.aiSupportedCurve - latestPoint.traditionalCurve
  }, [chartData])

  // Show loading state
  if (isLoadingMetrics && chartData.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-500 mr-2" />
          <span className="text-muted-foreground">Loading metrics...</span>
        </CardContent>
      </Card>
    )
  }

  // Show empty state with explanation
  if (chartData.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <TrendingDown className="w-5 h-5 text-cyan-500" />
            The Dip Chart
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    The Dip Chart visualizes learner confidence and engagement over time.
                    It shows how AI support helps learners recover from the natural "dip"
                    that occurs when facing challenging material.
                  </p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 bg-muted/40 rounded-lg border border-border">
            <TrendingDown className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No learning metrics data yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Metrics will appear as learners engage with the project and AI support.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <TrendingDown className="w-5 h-5 text-cyan-500" />
            The Dip Chart
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    The Dip Chart visualizes learner confidence and engagement over time.
                    It shows how AI support helps learners recover from the natural "dip"
                    that occurs when facing challenging material.
                  </p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500" />
              <span className="text-muted-foreground">AI-Supported</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted-foreground" />
              <span className="text-muted-foreground">Traditional</span>
            </div>
            <div className="flex items-center gap-2 ml-4 px-3 py-1 bg-green-500/10 rounded border border-green-500/30">
              <Zap className="w-3 h-3 text-green-500" />
              <span className="text-green-500">+{efficacyGap}% Efficacy Gap</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                stroke="var(--muted-foreground)"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                tickFormatter={(value) => {
                  if (!value) return ''
                  const date = new Date(value)
                  if (isNaN(date.getTime())) return ''
                  return `${date.getMonth() + 1}/${date.getDate()}`
                }}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'var(--foreground)' }}
                itemStyle={{ color: 'var(--foreground)' }}
                formatter={(value) => [`${value}%`, '']}
              />
              <Legend />
              
              {/* Reference line for the dip */}
              {dipPoint.date && (
                <ReferenceLine
                  x={dipPoint.date}
                  stroke="#EF4444"
                  strokeDasharray="5 5"
                  label={{
                    value: 'The Dip',
                    fill: '#EF4444',
                    fontSize: 11,
                    position: 'top',
                  }}
                />
              )}

              {/* AI Intervention markers */}
              {interventions
                .filter(i => i.status === 'executed')
                .map((intervention, idx) => (
                  <ReferenceLine
                    key={idx}
                    x={intervention.timestamp.split('T')[0]}
                stroke="#22C55E"
                strokeDasharray="3 3"
              />
                ))}

              <Line
                type="monotone"
                dataKey="aiSupportedCurve"
                name="AI-Supported Learning"
                stroke="#06B6D4"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#06B6D4' }}
              />
              <Line
                type="monotone"
                dataKey="traditionalCurve"
                name="Traditional Learning"
                stroke="#6B7280"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 6, fill: '#6B7280' }}
              />
              <Line
                type="monotone"
                dataKey="confidence"
                name="Learner Confidence"
                stroke="#8B5CF6"
                strokeWidth={1}
                dot={false}
                activeDot={{ r: 4, fill: '#8B5CF6' }}
              />
              <Line
                type="monotone"
                dataKey="engagement"
                name="Engagement"
                stroke="#F59E0B"
                strokeWidth={1}
                dot={false}
                activeDot={{ r: 4, fill: '#F59E0B' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Affective Forecast Bars */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-muted/40 rounded-lg p-3 border border-border">
            <div className="text-xs text-muted-foreground mb-1">Confidence Forecast</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${chartData[chartData.length - 1]?.confidence || 0}%` }}
                />
              </div>
              <span className="text-sm text-foreground font-medium">
                {chartData[chartData.length - 1]?.confidence || 0}%
              </span>
            </div>
          </div>
          <div className="bg-muted/40 rounded-lg p-3 border border-border">
            <div className="text-xs text-muted-foreground mb-1">Engagement Forecast</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${chartData[chartData.length - 1]?.engagement || 0}%` }}
                />
              </div>
              <span className="text-sm text-foreground font-medium">
                {chartData[chartData.length - 1]?.engagement || 0}%
              </span>
            </div>
          </div>
          <div className="bg-muted/40 rounded-lg p-3 border border-border">
            <div className="text-xs text-muted-foreground mb-1">AI Recovery Score</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${Math.min(Math.max(efficacyGap + 50, 0), 100)}%` }}
                />
              </div>
              <span className="text-sm text-foreground font-medium">
                {Math.min(Math.max(efficacyGap + 50, 0), 100)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
