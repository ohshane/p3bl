import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { joinProject } from '@/server/api/projects'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { toast } from 'sonner'

const COOLDOWN_MINUTES = 5

export function ManualCodeInput() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cooldownEnd, setCooldownEnd] = useState<Date | null>(null)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)

  const { currentUser, addJoinedProject } = useAuthStore()

  // Handle cooldown timer - triggered when server returns rate limit
  const startCooldown = (serverCooldownEnd?: Date | null) => {
    const cooldown = serverCooldownEnd || new Date(Date.now() + COOLDOWN_MINUTES * 60 * 1000)
    setCooldownEnd(cooldown)
    setCooldownRemaining(Math.ceil(Math.max(0, cooldown.getTime() - Date.now()) / 1000 / 60))
    
    const interval = setInterval(() => {
      const remaining = Math.max(0, cooldown.getTime() - Date.now())
      setCooldownRemaining(Math.ceil(remaining / 1000 / 60))
      
      if (remaining <= 0) {
        setCooldownEnd(null)
        setError('')
        clearInterval(interval)
      }
    }, 1000)
  }

  const handleCodeChange = (value: string) => {
    setCode(value.toUpperCase())
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentUser || !code.trim() || cooldownEnd) return

    // Format validation
    if (code.length !== 6) {
      setError('Code must be 6 characters (letters and numbers only)')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const result = await joinProject({
        data: {
          userId: currentUser.id,
          code: code.toUpperCase(),
        }
      })

      if (!result.success) {
        // Check if rate limited
        if ('rateLimited' in result && result.rateLimited) {
          const serverCooldownEnd = 'cooldownEnd' in result && result.cooldownEnd 
            ? new Date(result.cooldownEnd as string) 
            : null
          startCooldown(serverCooldownEnd)
          setError(result.error || 'Too many attempts. Please try again later.')
        } else {
          setError(result.error || 'Invalid code. Please check and try again.')
          toast.error(result.error || 'Invalid code')
        }
        return
      }

      // Success (both new join and already-a-member)
      const projectId = result.projectId
      addJoinedProject(projectId)

      const alreadyMember = 'message' in result && result.message === 'Already a member of this project'
      if (!alreadyMember) {
        toast.success(`Welcome to ${result.projectTitle || 'the project'}!`, {
          description: 'You have successfully joined.',
        })
      }

      // Navigate to the project page
      navigate({ to: `/explorer/project/${projectId}` })
    } catch (err) {
      console.error('Join project error:', err)
      setError('Failed to join project. Please try again.')
      toast.error('Failed to join project')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isDisabled = cooldownEnd !== null || isSubmitting

  return (
    <Card>
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex justify-center items-center gap-2">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={handleCodeChange}
              disabled={isDisabled}
              inputMode="text"
              pattern="^[A-Za-z0-9]+$"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="uppercase font-mono" />
                <InputOTPSlot index={1} className="uppercase font-mono" />
                <InputOTPSlot index={2} className="uppercase font-mono" />
                <InputOTPSlot index={3} className="uppercase font-mono" />
                <InputOTPSlot index={4} className="uppercase font-mono" />
                <InputOTPSlot index={5} className="uppercase font-mono" />
              </InputOTPGroup>
            </InputOTP>
            <Button
              type="submit"
              disabled={isDisabled || code.length !== 6}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Error Message */}
          {error && !cooldownEnd && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Cooldown Message */}
          {cooldownEnd && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Too many attempts. Please try again in {cooldownRemaining} minute{cooldownRemaining !== 1 ? 's' : ''}.
              </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
