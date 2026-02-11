import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { getStoredRedirectPath, getRoleBasedHomePath } from '@/lib/authRedirect'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/signup/')({
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const { isAuthenticated, currentUser } = useAuthStore()
  const redirectParam = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('redirect_uri')
    : null
  const storedRedirect = getStoredRedirectPath()
  const redirectTo = redirectParam && redirectParam.startsWith('/')
    ? redirectParam
    : storedRedirect ?? undefined
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (redirectTo) {
        navigate({ to: redirectTo })
        return
      }

      navigate({ to: getRoleBasedHomePath(currentUser.role) })
    }
  }, [isAuthenticated, currentUser, navigate, redirectTo])
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img 
              src="/android-chrome-192x192.png" 
              alt="Peabee" 
              className="w-16 h-16 rounded-2xl shadow-lg shadow-cyan-500/25 mx-auto mb-4"
            />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="text-muted-foreground mt-2">Start your learning journey today</p>
        </div>
        
        {/* Register Form */}
        <div className="bg-card border border-border shadow-sm rounded-xl p-6">
          <RegisterForm redirectTo={redirectTo} />
        </div>
        
        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Peabee
        </p>
      </div>
    </div>
  )
}
