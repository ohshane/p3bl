import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { getUserArtifacts } from '@/server/api/artifacts'
import { Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FolderOpen, BarChart3, Trophy } from 'lucide-react'
import { ArtifactGallery } from '@/components/portfolio/ArtifactGallery'
import { CompetencyDashboard } from '@/components/portfolio/CompetencyDashboard'
import { AchievementArchive } from '@/components/portfolio/AchievementArchive'
import type { PortfolioTab } from '@/types'

export const Route = createFileRoute('/explorer/portfolio')({
  component: PortfolioPage,
})

interface UserArtifact {
  id: string
  title: string
  contentType: string
  status: string
  projectId: string
  projectTitle: string
  sessionId: string
  sessionTitle: string
  latestVersion: string | null
  createdAt: string
  updatedAt: string
}

function PortfolioPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<PortfolioTab>('artifacts')
  const [isHydrated, setIsHydrated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [artifacts, setArtifacts] = useState<UserArtifact[]>([])
  const { isAuthenticated, currentUser } = useAuthStore()

  // Wait for client-side hydration before checking auth
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Redirect to login if not authenticated (only after hydration)
  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      navigate({ to: '/signin' })
    }
  }, [isHydrated, isAuthenticated, navigate])

  // Fetch user's artifacts
  useEffect(() => {
    async function loadArtifacts() {
      if (!currentUser) return
      
      setIsLoading(true)
      try {
        const result = await getUserArtifacts({ data: { userId: currentUser.id } })
        if (result.success && result.artifacts) {
          setArtifacts(result.artifacts)
        }
      } catch (error) {
        console.error('Failed to load artifacts:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (isHydrated && currentUser) {
      loadArtifacts()
    }
  }, [isHydrated, currentUser])

  // Show loading during SSR/hydration
  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!currentUser) return null

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Growth Portfolio
          </h1>
          <p className="text-muted-foreground">
            Track your learning journey, competencies, and achievements
          </p>
        </div>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PortfolioTab)}>
          <TabsList className="mb-8">
            <TabsTrigger value="artifacts" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              Artifact Gallery
            </TabsTrigger>
            <TabsTrigger value="competencies" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Competency Dashboard
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2">
              <Trophy className="w-4 h-4" />
              Achievement Archive
            </TabsTrigger>
          </TabsList>

          <TabsContent value="artifacts">
            <ArtifactGallery artifacts={artifacts} />
          </TabsContent>

          <TabsContent value="competencies">
            {currentUser.competencies ? (
              <CompetencyDashboard competencies={currentUser.competencies} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No competency data available yet.</p>
                <p className="text-sm mt-2">Complete some project sessions to see your competency scores.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="achievements">
            <AchievementArchive 
              earnedBadgeIds={currentUser.earnedBadgeIds ?? []}
              level={currentUser.level}
              xp={currentUser.xp}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
