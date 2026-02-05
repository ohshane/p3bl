import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { getUserInvitations } from '@/server/api/projects'
import { InvitationCard } from './InvitationCard'
import { ManualCodeInput } from './ManualCodeInput'
import { Compass, Loader2 } from 'lucide-react'
import type { ProjectInvitation } from '@/types'

export function OnboardingMode() {
  const { currentUser } = useAuthStore()
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch invitations from API on mount
  useEffect(() => {
    async function fetchInvitations() {
      if (!currentUser) return

      try {
        const result = await getUserInvitations({
          data: { userId: currentUser.id }
        })

        if (result.success && result.invitations) {
          // Map API response to ProjectInvitation type
          const mappedInvitations: ProjectInvitation[] = result.invitations.map(inv => ({
            id: inv.id,
            projectId: inv.projectId,
            projectName: inv.projectTitle,
            invitedAt: inv.createdAt,
            expiresAt: null, // API doesn't include this currently
          }))
          setInvitations(mappedInvitations)
        }
      } catch (err) {
        console.error('Failed to fetch invitations:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvitations()
  }, [currentUser])

  // Handle invitation dismissal - remove from local state
  const handleDismiss = (invitationId: string) => {
    setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
  }

  if (!currentUser) return null

  const hasPendingInvitations = invitations.length > 0

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Welcome Section */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-6">
          <Compass className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">
          Welcome, {currentUser.name}!
        </h1>
        <p className="text-muted-foreground text-lg">
          {isLoading
            ? "Checking for invitations..."
            : hasPendingInvitations
              ? "You have a project invitation waiting for you."
              : "Enter a join code from your instructor to get started."}
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center mb-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Invitation Cards */}
      {!isLoading && hasPendingInvitations && (
        <div className="mb-8 space-y-4">
          {invitations.map(invitation => (
            <InvitationCard
              key={invitation.id}
              invitation={invitation}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}

      {/* Manual Code Input */}
      <ManualCodeInput />

      {/* Help Text */}
      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          Don't have a join code?{' '}
          <button className="text-cyan-500 hover:text-cyan-400 underline">
            Contact your instructor
          </button>
        </p>
      </div>
    </div>
  )
}
