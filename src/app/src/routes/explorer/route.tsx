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

  // Redirect creators to /creator
  // Note: Pioneers and admins can access explorer views
  useEffect(() => {
    if (currentUser && currentUser.role === 'creator') {
      navigate({ to: '/creator' })
    }
  }, [currentUser, navigate])

  if (!currentUser) {
    return null
  }

  // If creator, don't render - redirect is happening
  if (currentUser.role === 'creator') {
    return null
  }

  return <Outlet />
}
