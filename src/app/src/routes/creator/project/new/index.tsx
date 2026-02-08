import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { ProjectWizard } from '@/components/creator/wizard/ProjectWizard'

export const Route = createFileRoute('/creator/project/new/')({
  component: NewProjectPage,
})

function NewProjectPage() {
  const navigate = useNavigate()
  const { isAuthenticated, currentUser } = useAuthStore()
  
  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/' })
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
      <ProjectWizard />
    </div>
  )
}
