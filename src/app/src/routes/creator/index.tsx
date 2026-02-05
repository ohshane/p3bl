import { createFileRoute } from '@tanstack/react-router'
import { CreatorDashboard } from '@/components/creator/CreatorDashboard'

export const Route = createFileRoute('/creator/')({
  component: CreatorIndexPage,
})

function CreatorIndexPage() {
  return <CreatorDashboard />
}
