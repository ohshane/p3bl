import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useProjectStore } from '@/stores/projectStore'
import { ProjectList } from './ProjectList'
import { ProfileCard } from './ProfileCard'
import { HallOfFame } from './HallOfFame'
import { ManualCodeInput } from './ManualCodeInput'
import { ClockWidget } from './ClockWidget'
import { MiniCalendar } from './MiniCalendar'
import { Loader2 } from 'lucide-react'

export function ActiveMode() {
  const { currentUser } = useAuthStore()
  const { 
    isLoadingProjects, 
    projectsError,
    fetchUserProjects,
    getAllUserProjects,
    getScheduledProjects,
    getOpenedProjects,
    getClosedProjects,
  } = useProjectStore()

  // Fetch user's projects on mount
  useEffect(() => {
    if (currentUser?.id) {
      fetchUserProjects(currentUser.id)
    }
  }, [currentUser?.id, fetchUserProjects])

  if (!currentUser) return null

  // Get projects by time-based status
  const allProjects = getAllUserProjects()
  const scheduledProjects = getScheduledProjects()
  const openedProjects = getOpenedProjects()
  const closedProjects = getClosedProjects()

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Main Content */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Project List */}
          {isLoadingProjects ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading projects...</span>
            </div>
          ) : projectsError ? (
            <div className="text-center py-12 text-destructive">
              <p>{projectsError}</p>
              <button 
                onClick={() => fetchUserProjects(currentUser.id)}
                className="mt-2 text-sm underline"
              >
                Try again
              </button>
            </div>
          ) : (
            <ProjectList
              allProjects={allProjects}
              scheduledProjects={scheduledProjects}
              openedProjects={openedProjects}
              closedProjects={closedProjects}
            />
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Profile Card */}
          <ProfileCard />

          {/* Clock Widget */}
          <ClockWidget />

          {/* Mini Calendar */}
          <MiniCalendar />

          {/* Join Another Project */}
          <ManualCodeInput />

          {/* Hall of Fame */}
          <HallOfFame />
        </div>
      </div>
    </div>
  )
}
