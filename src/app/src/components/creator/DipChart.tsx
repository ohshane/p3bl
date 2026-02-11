import { useMemo, useEffect, useState } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  ZAxis,
} from 'recharts'
import { TrendingDown, Info, Loader2, CheckCircle2, Clock, CircleDot } from 'lucide-react'
import { useCreatorStore } from '@/stores/creatorStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { DipChartDataPoint, CreatorSession } from '@/types'
import { cn } from '@/lib/utils'

// Distinct colors for up to 12 teams, then cycles
const TEAM_COLORS = [
  '#06B6D4', // cyan
  '#8B5CF6', // purple
  '#F59E0B', // amber
  '#22C55E', // green
  '#EF4444', // red
  '#EC4899', // pink
  '#3B82F6', // blue
  '#F97316', // orange
  '#14B8A6', // teal
  '#A855F7', // violet
  '#64748B', // slate
  '#84CC16', // lime
]

// Alternating background fills for session bands
const SESSION_BAND_COLORS = [
  'rgba(6, 182, 212, 0.06)',   // cyan tint
  'rgba(139, 92, 246, 0.06)',  // purple tint
]

interface DipChartProps {
  projectId: string
  projectStartDate: string
  projectEndDate: string
  sessions: CreatorSession[]
}

type SessionStatus = 'completed' | 'active' | 'upcoming'

interface SessionInfo {
  id: string
  index: number
  title: string
  status: SessionStatus
  startTs: number
  endTs: number
  startDate: string
  endDate: string
}

/** Scatter data point for a single team */
interface ScatterPoint {
  ts: number
  score: number
  teamId: string
  teamName: string
  sessionId: string
  rubricScores: Record<string, number>
  overallScore: string
}

/** Format timestamp -> "M/D HH:mm" */
function formatTs(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

/** Format timestamp -> "M/D" for tick labels */
function formatTick(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/** Derive session status from dates */
function getSessionStatus(startDate: string, endDate: string): SessionStatus {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (isNaN(end.getTime()) || isNaN(start.getTime())) return 'upcoming'
  if (end < now) return 'completed'
  if (start <= now) return 'active'
  return 'upcoming'
}

/** Generate nice tick values across a time range */
function generateTimeTicks(startTs: number, endTs: number): number[] {
  const rangeMs = endTs - startTs
  if (rangeMs <= 0) return [startTs]

  const DAY = 86400000
  const rangeDays = rangeMs / DAY

  // Pick step: aim for 8-12 ticks
  let stepMs: number
  if (rangeDays <= 3) stepMs = DAY / 4        // 6h
  else if (rangeDays <= 7) stepMs = DAY / 2   // 12h
  else if (rangeDays <= 14) stepMs = DAY      // 1d
  else if (rangeDays <= 30) stepMs = 2 * DAY  // 2d
  else if (rangeDays <= 60) stepMs = 5 * DAY  // 5d
  else if (rangeDays <= 120) stepMs = 7 * DAY // 1w
  else stepMs = 14 * DAY                       // 2w

  const ticks: number[] = []
  // Start at midnight of the start day
  const first = new Date(startTs)
  first.setHours(0, 0, 0, 0)
  let cur = first.getTime()
  if (cur < startTs) cur += stepMs

  while (cur <= endTs) {
    ticks.push(cur)
    cur += stepMs
  }

  // Always include endpoints if not already present
  if (ticks.length === 0 || ticks[0] > startTs + stepMs / 2) {
    ticks.unshift(startTs)
  }

  return ticks
}

export function DipChart({ projectId, projectStartDate, projectEndDate, sessions }: DipChartProps) {
  const {
    getDipChartData,
    fetchDipChartData,
    isLoadingMetrics,
  } = useCreatorStore()

  const rawData = getDipChartData(projectId)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)

  useEffect(() => {
    fetchDipChartData(projectId)
  }, [projectId, fetchDipChartData])

  // Build session info with timestamps
  const sessionInfos: SessionInfo[] = useMemo(() => {
    return [...sessions]
      .sort((a, b) => a.index - b.index)
      .map((s) => ({
        id: s.id,
        index: s.index,
        title: s.title,
        status: getSessionStatus(s.startDate, s.endDate),
        startTs: new Date(s.startDate).getTime(),
        endTs: new Date(s.endDate).getTime(),
        startDate: s.startDate,
        endDate: s.endDate,
      }))
  }, [sessions])

  // Filter by selected session
  const filteredData = useMemo(() => {
    if (!selectedSessionId) return rawData
    return rawData.filter((pt) => pt.sessionId === selectedSessionId)
  }, [rawData, selectedSessionId])

  // Derive unique teams (stable order from all data, not just filtered)
  const teamList = useMemo(() => {
    const seen = new Map<string, string>()
    for (const pt of rawData) {
      if (!seen.has(pt.teamId)) {
        seen.set(pt.teamId, pt.teamName)
      }
    }
    return Array.from(seen.entries()).map(([id, name], idx) => ({
      id,
      name,
      color: TEAM_COLORS[idx % TEAM_COLORS.length],
    }))
  }, [rawData])

  // Convert filtered data to scatter points per team + find the dip
  const { teamScatterData, dipPoint, axisDomain } = useMemo(() => {
    const selectedSession = selectedSessionId
      ? sessionInfos.find((s) => s.id === selectedSessionId)
      : null

    const rangeStart = selectedSession
      ? selectedSession.startTs
      : new Date(projectStartDate).getTime()
    const rangeEndRaw = selectedSession
      ? selectedSession.endTs
      : new Date(projectEndDate).getTime()
    const now = Date.now()
    const rangeEnd = Math.min(rangeEndRaw, now)

    if (isNaN(rangeStart) || isNaN(rangeEnd) || rangeStart > rangeEnd) {
      return {
        teamScatterData: new Map<string, ScatterPoint[]>(),
        dipPoint: null as { ts: number; score: number } | null,
        axisDomain: [0, 1] as [number, number],
      }
    }

    const byTeam = new Map<string, ScatterPoint[]>()
    let minScore = 101
    let minTs = 0

    for (const pt of filteredData) {
      const ts = new Date(pt.date).getTime()
      if (isNaN(ts)) continue

      const point: ScatterPoint = {
        ts,
        score: pt.score,
        teamId: pt.teamId,
        teamName: pt.teamName,
        sessionId: pt.sessionId,
        rubricScores: pt.rubricScores,
        overallScore: pt.overallScore,
      }

      if (!byTeam.has(pt.teamId)) byTeam.set(pt.teamId, [])
      byTeam.get(pt.teamId)!.push(point)

      if (pt.score < minScore) {
        minScore = pt.score
        minTs = ts
      }
    }

    // Sort each team's points by time
    for (const points of byTeam.values()) {
      points.sort((a, b) => a.ts - b.ts)
    }

    return {
      teamScatterData: byTeam,
      dipPoint: minTs ? { ts: minTs, score: minScore } : null,
      axisDomain: [rangeStart, rangeEnd] as [number, number],
    }
  }, [filteredData, sessionInfos, selectedSessionId, projectStartDate, projectEndDate])

  // Ticks for the x-axis
  const xTicks = useMemo(
    () => generateTimeTicks(axisDomain[0], axisDomain[1]),
    [axisDomain]
  )

  // Per-team latest scores
  const teamSummaries = useMemo(() => {
    const latest = new Map<string, DipChartDataPoint>()
    for (const pt of filteredData) {
      const existing = latest.get(pt.teamId)
      if (!existing || pt.date > existing.date) {
        latest.set(pt.teamId, pt)
      }
    }
    return teamList.map((t) => {
      const pt = latest.get(t.id)
      return {
        ...t,
        latestScore: pt?.score ?? 0,
        overallScore: pt?.overallScore ?? 'needs_work',
      }
    })
  }, [filteredData, teamList])

  const avgScore = useMemo(() => {
    if (teamSummaries.length === 0) return 0
    return Math.round(
      teamSummaries.reduce((s, t) => s + t.latestScore, 0) / teamSummaries.length
    )
  }, [teamSummaries])

  // Custom tooltip for scatter
  const CustomTooltipContent = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null
    const point: ScatterPoint = payload[0]?.payload
    if (!point) return null

    const team = teamList.find((t) => t.id === point.teamId)
    const sessionForPoint = sessionInfos.find((s) => s.id === point.sessionId)

    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm max-w-xs">
        <div className="text-muted-foreground mb-1">{formatTs(point.ts)}</div>
        {sessionForPoint && (
          <div className="text-xs text-muted-foreground mb-2">
            Session {sessionForPoint.index + 1}: {sessionForPoint.title}
          </div>
        )}
        <div className="mb-1">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: team?.color }}
            />
            <span className="font-medium text-foreground">
              {point.teamName}
            </span>
            <span className="ml-auto font-bold text-foreground">
              {point.score}%
            </span>
          </div>
          {Object.keys(point.rubricScores).length > 0 && (
            <div className="ml-5 mt-1 space-y-0.5">
              {Object.entries(point.rubricScores).map(([criterion, score]) => (
                <div
                  key={criterion}
                  className="flex justify-between text-xs text-muted-foreground"
                >
                  <span>{criterion}</span>
                  <span>{score}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- Render ---

  if (isLoadingMetrics && rawData.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-500 mr-2" />
          <span className="text-muted-foreground">Loading precheck data...</span>
        </CardContent>
      </Card>
    )
  }

  const SessionStatusIcon = ({ status }: { status: SessionStatus }) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
      case 'active':
        return <CircleDot className="w-3.5 h-3.5 text-cyan-500" />
      case 'upcoming':
        return <Clock className="w-3.5 h-3.5 text-muted-foreground" />
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
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
                    Pre-check scores per team over time. Click a session to filter.
                    Colored bands show session boundaries. Hover data points for rubric breakdowns.
                  </p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </CardTitle>
          <div className="flex items-center gap-4 text-sm flex-wrap">
            {teamList.map((team) => (
              <div key={team.id} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: team.color }}
                />
                <span className="text-muted-foreground text-xs">{team.name}</span>
              </div>
            ))}
            {teamSummaries.length > 0 && (
              <div className="flex items-center gap-2 ml-2 px-2.5 py-1 bg-cyan-500/10 rounded border border-cyan-500/30">
                <span className="text-cyan-500 font-medium text-xs">Avg: {avgScore}%</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Session selector bar */}
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedSessionId(null)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap',
              selectedSessionId === null
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/60'
            )}
          >
            All Sessions
          </button>

          {sessionInfos.map((s) => (
            <button
              key={s.id}
              onClick={() =>
                setSelectedSessionId(selectedSessionId === s.id ? null : s.id)
              }
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap',
                selectedSessionId === s.id
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                  : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/60'
              )}
            >
              <SessionStatusIcon status={s.status} />
              <span>S{s.index + 1}</span>
              <span className="hidden sm:inline">- {s.title}</span>
            </button>
          ))}
        </div>

        {/* Chart */}
        {rawData.length === 0 ? (
          <div className="text-center py-8 bg-muted/40 rounded-lg border border-border">
            <TrendingDown className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No pre-check data yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Scores will appear here as explorers run pre-checks on their work.
            </p>
          </div>
        ) : (
          <>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="ts"
                    type="number"
                    domain={axisDomain}
                    ticks={xTicks}
                    tickFormatter={formatTick}
                    stroke="var(--muted-foreground)"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    scale="time"
                  />
                  <YAxis
                    dataKey="score"
                    type="number"
                    domain={[0, 100]}
                    stroke="var(--muted-foreground)"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  {/* Hide the default z-axis size variation */}
                  <ZAxis range={[50, 50]} />

                  <Tooltip
                    content={<CustomTooltipContent />}
                    cursor={{ strokeDasharray: '3 3', stroke: 'var(--muted-foreground)' }}
                  />
                  <Legend />

                  {/* Session boundary bands — shown when "All" is selected */}
                  {selectedSessionId === null &&
                    sessionInfos.map((s, idx) => {
                      if (isNaN(s.startTs) || isNaN(s.endTs)) return null
                      return (
                        <ReferenceArea
                          key={s.id}
                          x1={s.startTs}
                          x2={s.endTs}
                          fill={SESSION_BAND_COLORS[idx % SESSION_BAND_COLORS.length]}
                          fillOpacity={1}
                          label={{
                            value: `S${s.index + 1}`,
                            position: 'insideTopLeft',
                            fill: 'var(--muted-foreground)',
                            fontSize: 10,
                          }}
                        />
                      )
                    })}

                  {/* The Dip — vertical line at the lowest score */}
                  {dipPoint && (
                    <ReferenceLine
                      x={dipPoint.ts}
                      stroke="#EF4444"
                      strokeDasharray="5 5"
                      label={{
                        value: `The Dip (${dipPoint.score}%)`,
                        fill: '#EF4444',
                        fontSize: 11,
                        position: 'top',
                      }}
                    />
                  )}

                  {/* One scatter series per team — line mode */}
                  {teamList.map((team) => {
                    const points = teamScatterData.get(team.id) || []
                    if (points.length === 0) return null
                    return (
                      <Scatter
                        key={team.id}
                        name={team.name}
                        data={points}
                        fill={team.color}
                        stroke={team.color}
                        strokeWidth={2}
                        line={{ stroke: team.color, strokeWidth: 2 }}
                        shape={(props: any) => {
                          const { cx, cy } = props
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={4}
                              fill={team.color}
                              stroke="var(--card)"
                              strokeWidth={1.5}
                            />
                          )
                        }}
                      />
                    )
                  })}
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Per-team latest score summary */}
            {teamSummaries.length > 0 && (
              <div
                className="mt-6 grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(teamSummaries.length, 4)}, 1fr)`,
                }}
              >
                {teamSummaries.map((team) => {
                  const statusColor =
                    team.overallScore === 'ready'
                      ? 'bg-green-500'
                      : team.overallScore === 'needs_work'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  return (
                    <div
                      key={team.id}
                      className="bg-muted/40 rounded-lg p-3 border border-border"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                        <span className="text-xs text-muted-foreground truncate">
                          {team.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${statusColor} rounded-full`}
                            style={{ width: `${team.latestScore}%` }}
                          />
                        </div>
                        <span className="text-sm text-foreground font-medium">
                          {team.latestScore}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
