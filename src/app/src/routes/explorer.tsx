import { createFileRoute, useNavigate, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'

export const Route = createFileRoute('/explorer')({
  component: ExplorerLayout,
})

function ExplorerLayout() {
  const navigate = useNavigate()
  const { isAuthenticated, currentUser } = useAuthStore()
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/signin' })
    }
  }, [isAuthenticated, navigate])

  // Redirect creators to /creator, admins to /admin
  // Note: Pioneers can access both explorer and creator views
  useEffect(() => {
    if (currentUser && currentUser.role === 'creator') {
      navigate({ to: '/creator' })
    } else if (currentUser && currentUser.role === 'admin') {
      navigate({ to: '/admin' })
    }
  }, [currentUser, navigate])

  if (!currentUser) {
    return null
  }

  // If creator or admin, don't render - redirect is happening
  if (currentUser.role === 'creator' || currentUser.role === 'admin') {
    return null
  }

  return <Outlet />
}
