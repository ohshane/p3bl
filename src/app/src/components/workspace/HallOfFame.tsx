import { useState, useEffect } from 'react'
import { Trophy, Medal, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { getLeaderboard } from '@/server/api'
import type { LeaderboardEntry } from '@/types'

export function HallOfFame() {
  const [isOptInDialogOpen, setIsOptInDialogOpen] = useState(false)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { currentUser, toggleHallOfFameOptIn } = useAuthStore()

  // Fetch leaderboard from API
  useEffect(() => {
    async function fetchLeaderboard() {
      if (!currentUser) return
      
      setIsLoading(true)
      try {
        const result = await getLeaderboard({ limit: 10, currentUserId: currentUser.id })
        if (result.success && result.leaderboard) {
          setLeaderboard(result.leaderboard)
          if (result.currentUserRank) {
            setCurrentUserRank(result.currentUserRank)
          }
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchLeaderboard()
  }, [currentUser?.id, currentUser?.hallOfFameOptIn])

  if (!currentUser) return null

  const handleOptInToggle = () => {
    toggleHallOfFameOptIn()
    setIsOptInDialogOpen(false)
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />
      default:
        return <span className="w-5 text-center text-muted-foreground">{rank}</span>
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            Hall of Fame
          </CardTitle>
          <Dialog open={isOptInDialogOpen} onOpenChange={setIsOptInDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-xs">
                {currentUser.hallOfFameOptIn ? (
                  <>
                    <EyeOff className="w-3 h-3 mr-1" />
                    Opt Out
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3 mr-1" />
                    Opt In
                  </>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {currentUser.hallOfFameOptIn ? 'Opt Out of Hall of Fame' : 'Opt In to Hall of Fame'}
                </DialogTitle>
                <DialogDescription>
                  {currentUser.hallOfFameOptIn ? (
                    'Your anonymized username will no longer appear on the leaderboard. Your real name is never shown.'
                  ) : (
                    'Your anonymized username and ranking will be visible to other learners. Your real name is never shown.'
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOptInDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleOptInToggle}>
                  {currentUser.hallOfFameOptIn ? 'Opt Out' : 'Opt In'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground mb-3">
          Top Explorers This Month
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center h-[200px]">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
            No leaderboard entries yet
          </div>
        ) : (
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {leaderboard.map(entry => (
              <div
                key={entry.rank}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-lg',
                  entry.isCurrentUser && currentUser.hallOfFameOptIn && 'bg-cyan-500/10 border border-cyan-500/30',
                  entry.rank <= 3 && !entry.isCurrentUser && 'bg-muted/30'
                )}
              >
                {/* Rank */}
                <div className="w-6 flex justify-center">
                  {getRankIcon(entry.rank)}
                </div>

                {/* Name & Level */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium truncate',
                    entry.isCurrentUser && currentUser.hallOfFameOptIn && 'text-cyan-400'
                  )}>
                    {entry.isCurrentUser && currentUser.hallOfFameOptIn
                      ? `${entry.anonymizedName} (You)`
                      : entry.anonymizedName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Level {entry.level}
                  </p>
                </div>

                {/* XP */}
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">
                    {entry.xpThisMonth} XP
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        )}

        {/* User's rank (if opted in but not in top 10) */}
        {currentUser.hallOfFameOptIn && currentUserRank && !leaderboard.some(e => e.isCurrentUser) && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center gap-3 p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
              <div className="w-6 text-center text-muted-foreground text-sm">
                {currentUserRank.rank}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-cyan-400">
                  {currentUserRank.anonymizedName} (You)
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">
                  {currentUserRank.xpThisMonth} XP
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Opt-in prompt if not opted in */}
        {!currentUser.hallOfFameOptIn && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-center text-muted-foreground">
              Opt in to see your rank
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
