import { useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'
import { clearStoredRedirectPath } from '@/lib/authRedirect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, AlertCircle, Check, X } from 'lucide-react'

interface RegisterFormProps {
  redirectTo?: string
}

export function RegisterForm({ redirectTo }: RegisterFormProps) {
  const navigate = useNavigate()
  const { register, isLoading, error, clearError } = useAuthStore()
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{
    name?: string
    email?: string
    password?: string
    confirmPassword?: string
  }>({})
  
  // Password requirements
  const passwordRequirements = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { label: 'Contains lowercase letter', test: (p: string) => /[a-z]/.test(p) },
    { label: 'Contains uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'Contains a number', test: (p: string) => /\d/.test(p) },
  ]
  
  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {}
    
    if (!name.trim()) {
      errors.name = 'Name is required'
    } else if (name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters'
    }
    
    if (!email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!password) {
      errors.password = 'Password is required'
    } else {
      const failedRequirements = passwordRequirements.filter((req) => !req.test(password))
      if (failedRequirements.length > 0) {
        errors.password = 'Password does not meet requirements'
      }
    }
    
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
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
    
    const result = await register({
      name: name.trim(),
      email: email.trim(),
      password,
    })
    
    if (result.success) {
      clearStoredRedirectPath()
      navigate({ to: redirectTo || '/explorer' })
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="name">
          Full Name
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (validationErrors.name) {
              setValidationErrors((prev) => ({ ...prev, name: undefined }))
            }
          }}
          className="bg-background border-border placeholder:text-muted-foreground"
          autoComplete="name"
          autoFocus
        />
        {validationErrors.name && (
          <p className="text-sm text-destructive">{validationErrors.name}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">
          Email
        </Label>
        <Input
          id="email"
          type="email"
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
        />
        {validationErrors.email && (
          <p className="text-sm text-destructive">{validationErrors.email}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (validationErrors.password) {
                setValidationErrors((prev) => ({ ...prev, password: undefined }))
              }
            }}
            className="bg-background border-border placeholder:text-muted-foreground pr-10"
            autoComplete="new-password"
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
        
        {/* Password requirements checklist */}
        {password && (
          <div className="mt-2 space-y-1">
            {passwordRequirements.map((req, index) => {
              const passed = req.test(password)
              return (
                <div
                  key={index}
                  className={`flex items-center gap-2 text-xs ${
                    passed ? 'text-green-600' : 'text-muted-foreground'
                  }`}
                >
                  {passed ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                  {req.label}
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">
          Confirm Password
        </Label>
        <Input
          id="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value)
            if (validationErrors.confirmPassword) {
              setValidationErrors((prev) => ({ ...prev, confirmPassword: undefined }))
            }
          }}
          className="bg-background border-border placeholder:text-muted-foreground"
          autoComplete="new-password"
        />
        {validationErrors.confirmPassword && (
          <p className="text-sm text-destructive">{validationErrors.confirmPassword}</p>
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
            Creating account...
          </>
        ) : (
          'Create account'
        )}
      </Button>
      
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          to="/signin"
          className="text-cyan-600 hover:text-cyan-700 transition-colors"
        >
          Sign in
        </Link>
      </p>
      
      <p className="text-center text-xs text-muted-foreground">
        By creating an account, you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  )
}
