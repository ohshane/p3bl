import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { LEVELS, BADGE_DEFINITIONS } from '@/types'
import {
  Footprints, Flag, Compass, Star, Sun, Calendar, MessageCircle,
  HandHelping, Heart, Brain, Megaphone, Users, Lightbulb, Puzzle
} from 'lucide-react'

// Map badge icons to components
const BADGE_ICONS: Record<string, React.ReactNode> = {
  'footprints': <Footprints className="w-4 h-4" />,
  'flag': <Flag className="w-4 h-4" />,
  'compass': <Compass className="w-4 h-4" />,
  'star': <Star className="w-4 h-4" />,
  'sun': <Sun className="w-4 h-4" />,
  'calendar': <Calendar className="w-4 h-4" />,
  'message-circle': <MessageCircle className="w-4 h-4" />,
  'hand-helping': <HandHelping className="w-4 h-4" />,
  'heart': <Heart className="w-4 h-4" />,
  'brain': <Brain className="w-4 h-4" />,
  'megaphone': <Megaphone className="w-4 h-4" />,
  'users': <Users className="w-4 h-4" />,
  'lightbulb': <Lightbulb className="w-4 h-4" />,
  'puzzle': <Puzzle className="w-4 h-4" />,
}

export function ProfileCard() {
  const { currentUser } = useAuthStore()

  if (!currentUser) return null

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Get current level info
  const currentLevelDef = LEVELS.find(l => l.level === currentUser.level)
  const nextLevelDef = LEVELS.find(l => l.level === currentUser.level + 1)
  
  // Calculate progress to next level
  const currentLevelXP = currentLevelDef?.xpRequired || 0
  const nextLevelXP = nextLevelDef?.xpRequired || currentUser.xp
  const xpInCurrentLevel = currentUser.xp - currentLevelXP
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP
  const progressPercent = nextLevelDef 
    ? (xpInCurrentLevel / xpNeededForNextLevel) * 100 
    : 100

  // Get recent badges (up to 3)
  const earnedBadgeIds = currentUser.earnedBadgeIds ?? []
  const recentBadges = earnedBadgeIds
    .slice(-3)
    .map(id => BADGE_DEFINITIONS.find(b => b.id === id))
    .filter(Boolean)

  const remainingBadges = Math.max(0, earnedBadgeIds.length - 3)

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-4 mb-4">
          {/* Avatar */}
          <Avatar className="h-14 w-14">
            <AvatarImage src={currentUser.avatarUrl || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-lg">
              {getInitials(currentUser.name)}
            </AvatarFallback>
          </Avatar>

          {/* Name & Level */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {currentUser.name}
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <p className="text-sm text-muted-foreground">
                      Level {currentUser.level} {currentLevelDef?.name}
                    </p>
                    <div className="mt-1">
                      <Progress value={progressPercent} className="h-1.5" />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">
                    {currentUser.xp} XP
                    {nextLevelDef && (
                      <> / {nextLevelXP} XP to Level {nextLevelDef.level}</>
                    )}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Recent Badges */}
        {recentBadges.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <TooltipProvider>
              {recentBadges.map(badge => badge && (
                <Tooltip key={badge.id}>
                  <TooltipTrigger asChild>
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                      {BADGE_ICONS[badge.icon] || <Star className="w-4 h-4" />}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{badge.name}</p>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
            {remainingBadges > 0 && (
              <span className="text-sm text-muted-foreground">
                +{remainingBadges} more
              </span>
            )}
          </div>
        )}

        {/* View Portfolio Link */}
        <Link
          to="/explorer/portfolio"
          className="flex items-center justify-between p-3 -mx-1 rounded-lg hover:bg-muted/50 transition-colors group"
        >
          <span className="text-sm font-medium text-cyan-500">
            View Full Portfolio
          </span>
          <ChevronRight className="w-4 h-4 text-cyan-500 group-hover:translate-x-1 transition-transform" />
        </Link>
      </CardContent>
    </Card>
  )
}
