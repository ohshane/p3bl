import { useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'
import { clearStoredRedirectPath } from '@/lib/authRedirect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'

interface LoginFormProps {
  redirectTo?: string
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuthStore()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({})
  
  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {}
    
    if (!email.trim()) {
      errors.email = 'Email or username is required'
    }
    
    if (!password) {
      errors.password = 'Password is required'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    
    if (!validateForm()) {
      return
    }
    
    const result = await login(email.trim(), password)
    
    if (result.success) {
      clearStoredRedirectPath()
      // Get the user's role to determine redirect
      const user = useAuthStore.getState().currentUser
      
      if (redirectTo) {
        navigate({ to: redirectTo })
      } else if (user?.role?.includes('admin')) {
        navigate({ to: '/admin' })
      } else if (user?.role?.includes('creator')) {
        navigate({ to: '/creator' })
      } else {
        navigate({ to: '/explorer' })
      }
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">
          Email or Username
        </Label>
        <Input
          id="email"
          type="text"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (validationErrors.email) {
              setValidationErrors((prev) => ({ ...prev, email: undefined }))
            }
          }}
          className="bg-background border-border placeholder:text-muted-foreground"
          autoComplete="email"
          autoFocus
        />
        {validationErrors.email && (
          <p className="text-sm text-destructive">{validationErrors.email}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">
            Password
          </Label>
          <span
            className="text-sm text-cyan-600 hover:text-cyan-700 transition-colors cursor-pointer"
          >
            Forgot password?
          </span>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (validationErrors.password) {
                setValidationErrors((prev) => ({ ...prev, password: undefined }))
              }
            }}
            className="bg-background border-border placeholder:text-muted-foreground pr-10"
            autoComplete="current-password"
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
        {validationErrors.password && (
          <p className="text-sm text-destructive">{validationErrors.password}</p>
        )}
      </div>
      
      <Button
        type="submit"
        className="w-full bg-cyan-600 hover:bg-cyan-700"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign in'
        )}
      </Button>
      
      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link
          to="/signup"
          className="text-cyan-600 hover:text-cyan-700 transition-colors"
        >
          Sign up
        </Link>
      </p>
    </form>
  )
}
