import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { getUserProjects, joinProject } from '@/server/api/projects'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// Workspace components
import { OnboardingMode } from '@/components/workspace/OnboardingMode'
import { ActiveMode } from '@/components/workspace/ActiveMode'

export const Route = createFileRoute('/explorer/')({
  component: ExplorerPage,
})

function ExplorerPage() {
  const navigate = useNavigate()
  const { isAuthenticated, currentUser, addJoinedProject } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [hasProjects, setHasProjects] = useState(false)
  const [joinCode] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null

    const params = new URLSearchParams(window.location.search)
    const code = params.get('joinCode')

    if (!code) return null

    const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    return normalized || null
  })
  const autoJoinAttempted = useRef(false)
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      if (joinCode) {
        const redirectUri = encodeURIComponent(`/explorer?joinCode=${joinCode}`)
        navigate({ to: `/signin?redirect_uri=${redirectUri}` })
      } else {
        navigate({ to: '/signin' })
      }
    }
  }, [isAuthenticated, joinCode, navigate])

  useEffect(() => {
    if (!isAuthenticated || !currentUser || !joinCode || autoJoinAttempted.current) return

    autoJoinAttempted.current = true

    const attemptJoin = async () => {
      try {
        const result = await joinProject({
          data: {
            userId: currentUser.id,
            code: joinCode,
          },
        })

        if (!result.success) {
          const message = result.error || 'Invalid join code. Please check and try again.'
          toast.error(message)
          return
        }

        addJoinedProject(result.projectId)

        const alreadyMember = 'message' in result && result.message === 'Already a member of this project'
        if (!alreadyMember) {
          toast.success(`Welcome to ${result.projectTitle || 'the project'}!`, {
            description: 'You have successfully joined.',
          })
        }

        navigate({ to: `/explorer/project/${result.projectId}` })
      } catch (err) {
        console.error('Join project error:', err)
        toast.error('Failed to join project. Please try again.')
      }
    }

    attemptJoin()
  }, [addJoinedProject, currentUser, isAuthenticated, joinCode, navigate])

  // Fetch user projects to determine workspace mode
  useEffect(() => {
    async function checkProjects() {
      if (!currentUser) return

      try {
        const result = await getUserProjects({
          data: { userId: currentUser.id }
        })

        if (result.success && result.projects) {
          setHasProjects(result.projects.length > 0)
        } else {
          // Fall back to local state if API fails
          setHasProjects(currentUser.joinedProjectIds?.length > 0)
        }
      } catch (err) {
        console.error('Failed to fetch user projects:', err)
        // Fall back to local state
        setHasProjects(currentUser.joinedProjectIds?.length > 0)
      } finally {
        setIsLoading(false)
      }
    }

    checkProjects()
  }, [currentUser])

  if (!currentUser) {
    return null
  }

  // Show loading while checking projects
  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Determine workspace mode based on projects
  const isOnboarding = !hasProjects

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      {isOnboarding ? (
        <OnboardingMode />
      ) : (
        <ActiveMode />
      )}
    </div>
  )
}
