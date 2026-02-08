import { createFileRoute, useNavigate, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'

export const Route = createFileRoute('/creator')({
  component: CreatorLayout,
})

function CreatorLayout() {
  const navigate = useNavigate()
  const { isAuthenticated, currentUser } = useAuthStore()
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/signin' })
    }
  }, [isAuthenticated, navigate])

  // Redirect explorers to /explorer (admins, creators, and pioneers can access)
  useEffect(() => {
    if (currentUser && currentUser.role === 'explorer') {
      navigate({ to: '/explorer' })
    }
  }, [currentUser, navigate])

  if (!currentUser || currentUser.role === 'explorer') {
    return null
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <Outlet />
    </div>
  )
}
