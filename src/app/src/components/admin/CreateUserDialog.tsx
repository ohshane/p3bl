import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createUser } from '@/server/api/admin'
import { Loader2, AlertCircle, Eye, EyeOff, Shield, PenTool, Compass } from 'lucide-react'
import type { UserRole } from '@/db/schema/users'

const ROLE_CONFIG: {
  value: UserRole
  label: string
  description: string
  icon: typeof Shield
  colorClass: string
}[] = [
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full system access including user management',
    icon: Shield,
    colorClass: 'text-amber-400',
  },
  {
    value: 'creator',
    label: 'Creator',
    description: 'Can create projects, sessions, and manage explorers',
    icon: PenTool,
    colorClass: 'text-purple-400',
  },
  {
    value: 'explorer',
    label: 'Explorer',
    description: 'Can join projects and complete learning activities',
    icon: Compass,
    colorClass: 'text-cyan-400',
  },
]

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserCreated: () => void
}

export function CreateUserDialog({ open, onOpenChange, onUserCreated }: CreateUserDialogProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(['explorer'])
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setName('')
    setEmail('')
    setPassword('')
    setSelectedRoles(['explorer'])
    setShowPassword(false)
    setError(null)
  }

  const toggleRole = (role: UserRole) => {
    setSelectedRoles((prev) => {
      if (prev.includes(role)) {
        // Don't allow removing the last role
        if (prev.length <= 1) return prev
        return prev.filter((r) => r !== role)
      }
      return [...prev, role]
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await createUser({
        data: {
          name: name.trim(),
          email: email.trim(),
          password,
          role: selectedRoles,
        }
      })

      if (result.success) {
        resetForm()
        onOpenChange(false)
        onUserCreated()
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add a new user to the system. They will receive login credentials.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="bg-background border-border"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="bg-background border-border"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="bg-background border-border pr-10"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Roles</Label>
            <div className="space-y-2">
              {ROLE_CONFIG.map((config) => {
                const Icon = config.icon
                const isSelected = selectedRoles.includes(config.value)
                const isLastRole = isSelected && selectedRoles.length <= 1

                return (
                  <label
                    key={config.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-cyan-500/50 bg-cyan-500/5'
                        : 'border-border bg-background hover:bg-muted/50'
                    } ${isLastRole ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRole(config.value)}
                      disabled={isLastRole}
                      className="mt-1 rounded border-border"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${config.colorClass}`} />
                        <span className="font-medium text-foreground text-sm">
                          {config.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {config.description}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              At least one role must be selected.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
