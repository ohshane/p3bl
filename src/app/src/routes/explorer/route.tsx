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

  // Redirect users without explorer role to /creator (if they have creator role)
  useEffect(() => {
    if (currentUser && !currentUser.role.includes('explorer')) {
      if (currentUser.role.includes('creator')) {
        navigate({ to: '/creator' })
      }
    }
  }, [currentUser, navigate])

  if (!currentUser) {
    return null
  }

  // If user doesn't have explorer role, don't render - redirect is happening
  if (!currentUser.role.includes('explorer')) {
    return null
  }

  return <Outlet />
}
