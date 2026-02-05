import { useState, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { joinProject } from '@/server/api/projects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

const COOLDOWN_MINUTES = 5

export function ManualCodeInput() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cooldownEnd, setCooldownEnd] = useState<Date | null>(null)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

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

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setCode(value)
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
          // Use server-provided cooldown end time if available
          const serverCooldownEnd = 'cooldownEnd' in result && result.cooldownEnd 
            ? new Date(result.cooldownEnd as string) 
            : null
          startCooldown(serverCooldownEnd)
          setError(result.error || 'Too many attempts. Please try again later.')
        } else {
          setError(result.error || 'Invalid code. Please check and try again.')
          toast.error(result.error || 'Invalid code')
        }
        setIsSubmitting(false)
        return
      }

      // Success! Update local state
      addJoinedProject(result.projectId)
      
      // Handle "already a member" case
      if ('message' in result && result.message === 'Already a member of this project') {
        toast.info('You are already a member of this project', {
          description: 'Navigating to your project...',
        })
      } else {
        toast.success(`Welcome to ${result.projectTitle || 'the project'}!`, {
          description: 'You have successfully joined.',
        })
      }

      // Navigate to activity zone
      navigate({ to: `/explorer/project/${result.projectId}` })
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
      <CardHeader>
        <CardTitle className="text-lg">Have a join code?</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              value={code}
              onChange={handleCodeChange}
              placeholder="ABC123"
              disabled={isDisabled}
              className="flex-1 text-center text-lg tracking-widest font-mono uppercase"
              maxLength={6}
              autoComplete="off"
            />
            <Button
              type="submit"
              disabled={isDisabled || code.length !== 6}
              className="px-8"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Join'
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
