import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { BADGE_DEFINITIONS, LEVELS, type BadgeCategory } from '@/types'
import {
  Footprints, Flag, Compass, Star, Sun, Calendar, MessageCircle,
  HandHelping, Heart, Brain, Megaphone, Users, Lightbulb, Puzzle,
  Copy, Lock
} from 'lucide-react'
import { toast } from 'sonner'

// Map badge icons to components
const BADGE_ICONS: Record<string, React.ElementType> = {
  'footprints': Footprints,
  'flag': Flag,
  'compass': Compass,
  'star': Star,
  'sun': Sun,
  'calendar': Calendar,
  'message-circle': MessageCircle,
  'hand-helping': HandHelping,
  'heart': Heart,
  'brain': Brain,
  'megaphone': Megaphone,
  'users': Users,
  'lightbulb': Lightbulb,
  'puzzle': Puzzle,
}

const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  milestone: 'Milestone',
  engagement: 'Engagement',
  collaboration: 'Collaboration',
  competency: 'Competency',
}

const CATEGORY_COLORS: Record<BadgeCategory, string> = {
  milestone: 'from-amber-500 to-orange-500',
  engagement: 'from-green-500 to-emerald-500',
  collaboration: 'from-blue-500 to-cyan-500',
  competency: 'from-purple-500 to-pink-500',
}

interface AchievementArchiveProps {
  earnedBadgeIds: string[]
  level: number
  xp: number
}

export function AchievementArchive({ earnedBadgeIds, level, xp }: AchievementArchiveProps) {
  // Group badges by category
  const badgesByCategory = BADGE_DEFINITIONS.reduce((acc, badge) => {
    if (!acc[badge.category]) {
      acc[badge.category] = []
    }
    acc[badge.category].push({
      ...badge,
      earned: earnedBadgeIds.includes(badge.id),
    })
    return acc
  }, {} as Record<BadgeCategory, (typeof BADGE_DEFINITIONS[0] & { earned: boolean })[]>)

  // Get current level info
  const currentLevelDef = LEVELS.find(l => l.level === level)
  const nextLevelDef = LEVELS.find(l => l.level === level + 1)
  const currentLevelXP = currentLevelDef?.xpRequired || 0
  const nextLevelXP = nextLevelDef?.xpRequired || xp
  const progressPercent = nextLevelDef 
    ? ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100 
    : 100

  // Generate experience synthesis
  const experienceSynthesis = generateExperienceSynthesis(earnedBadgeIds, level, xp)

  const copyExperience = () => {
    navigator.clipboard.writeText(experienceSynthesis)
    toast.success('Copied to clipboard!')
  }

  return (
    <div className="space-y-8">
      {/* Level Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Level Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">{level}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-lg">
                  {currentLevelDef?.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {xp} XP
                </span>
              </div>
              <Progress value={progressPercent} className="h-3 mb-2" />
              {nextLevelDef ? (
                <p className="text-sm text-muted-foreground">
                  {nextLevelXP - xp} XP to Level {nextLevelDef.level} ({nextLevelDef.name})
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Maximum level reached!
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badge Collection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Badge Collection</span>
            <span className="text-sm font-normal text-muted-foreground">
              {earnedBadgeIds.length} / {BADGE_DEFINITIONS.length} earned
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {(Object.entries(badgesByCategory) as [BadgeCategory, typeof badgesByCategory[BadgeCategory]][]).map(
              ([category, badges]) => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                    {CATEGORY_LABELS[category]}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {badges.map(badge => {
                      const IconComponent = BADGE_ICONS[badge.icon] || Star
                      return (
                        <TooltipProvider key={badge.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  'relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                                  badge.earned
                                    ? 'bg-card hover:border-cyan-500/50'
                                    : 'bg-muted/30 opacity-50'
                                )}
                              >
                                <div
                                  className={cn(
                                    'w-12 h-12 rounded-full flex items-center justify-center',
                                    badge.earned
                                      ? `bg-gradient-to-br ${CATEGORY_COLORS[category]} text-white`
                                      : 'bg-muted text-muted-foreground'
                                  )}
                                >
                                  {badge.earned ? (
                                    <IconComponent className="w-6 h-6" />
                                  ) : (
                                    <Lock className="w-5 h-5" />
                                  )}
                                </div>
                                <span className="text-xs font-medium text-center">
                                  {badge.name}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-medium">{badge.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {badge.description}
                              </p>
                              {!badge.earned && (
                                <p className="text-xs text-amber-400 mt-1">
                                  Not yet earned
                                </p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )
                    })}
                  </div>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Experience Synthesis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Experience Synthesis</span>
            <Button variant="outline" size="sm" onClick={copyExperience} className="gap-2">
              <Copy className="w-4 h-4" />
              Copy
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {experienceSynthesis}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            This AI-generated summary is updated as you complete projects. Use it for portfolios or applications.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function generateExperienceSynthesis(earnedBadgeIds: string[], level: number, xp: number): string {
  const levelDef = LEVELS.find(l => l.level === level)
  const badgeCount = earnedBadgeIds.length
  
  const earnedBadges = BADGE_DEFINITIONS.filter(b => earnedBadgeIds.includes(b.id))
  const competencyBadges = earnedBadges.filter(b => b.category === 'competency')
  const milestoneBadges = earnedBadges.filter(b => b.category === 'milestone')

  let synthesis = `As a Level ${level} ${levelDef?.name || 'Explorer'} with ${xp} experience points, `

  if (badgeCount === 0) {
    synthesis += `this learner is just beginning their journey. With dedication and consistent effort, they are well-positioned to develop key competencies and achieve meaningful milestones in their learning path.`
  } else {
    synthesis += `this learner has demonstrated commitment to growth by earning ${badgeCount} badge${badgeCount !== 1 ? 's' : ''}. `

    if (milestoneBadges.length > 0) {
      synthesis += `Key achievements include ${milestoneBadges.map(b => b.name).join(', ')}, showcasing dedication to completing meaningful learning objectives. `
    }

    if (competencyBadges.length > 0) {
      synthesis += `Demonstrated strengths in ${competencyBadges.map(b => b.name.replace(' Badge', '')).join(' and ')}, indicating well-developed skills in these areas. `
    }

    synthesis += `This track record reflects a learner who engages thoughtfully with challenges and consistently strives for improvement.`
  }

  return synthesis
}
