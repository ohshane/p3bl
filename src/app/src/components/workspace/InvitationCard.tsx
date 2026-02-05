import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Mail, X, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { respondToInvitation } from '@/server/api/projects'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ProjectInvitation } from '@/types'
import { toast } from 'sonner'

interface InvitationCardProps {
  invitation: ProjectInvitation
  onDismiss?: (invitationId: string) => void
}

export function InvitationCard({ invitation, onDismiss }: InvitationCardProps) {
  const navigate = useNavigate()
  const [isJoining, setIsJoining] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)
  const { addJoinedProject } = useAuthStore()

  const handleJoin = async () => {
    setIsJoining(true)
    
    try {
      const result = await respondToInvitation({
        data: {
          invitationId: invitation.id,
          accept: true,
        }
      })

      if (!result.success) {
        toast.error(result.error || 'Failed to join project')
        setIsJoining(false)
        return
      }

      // Update local state
      addJoinedProject(result.projectId!)
      
      // Show success toast
      toast.success(`Welcome to ${invitation.projectName}!`, {
        description: 'You have successfully joined the project.',
      })
      
      // Navigate to activity zone
      navigate({ to: `/explorer/project/${result.projectId}` })
    } catch (err) {
      console.error('Join project error:', err)
      toast.error('Failed to join project. Please try again.')
      setIsJoining(false)
    }
  }

  const handleDismiss = async () => {
    setIsDismissing(true)
    
    try {
      const result = await respondToInvitation({
        data: {
          invitationId: invitation.id,
          accept: false,
        }
      })

      if (!result.success) {
        toast.error(result.error || 'Failed to dismiss invitation')
        setIsDismissing(false)
        return
      }

      toast.info('Invitation dismissed', {
        description: 'You can still join later with a code.',
      })
      
      // Notify parent to remove this invitation from the list
      onDismiss?.(invitation.id)
    } catch (err) {
      console.error('Dismiss invitation error:', err)
      toast.error('Failed to dismiss invitation. Please try again.')
    } finally {
      setIsDismissing(false)
    }
  }

  const isDisabled = isJoining || isDismissing

  return (
    <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center shrink-0">
            <Mail className="w-6 h-6 text-cyan-400" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-cyan-400 font-medium mb-1">
              You're invited!
            </p>
            <h3 className="text-lg font-semibold text-foreground truncate">
              {invitation.projectName}
            </h3>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleJoin}
            disabled={isDisabled}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700"
          >
            {isJoining ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              'Join'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleDismiss}
            disabled={isDisabled}
            className="border-muted-foreground/30"
          >
            {isDismissing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <X className="w-4 h-4 mr-2" />
                Dismiss
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
