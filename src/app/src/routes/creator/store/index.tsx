import { createFileRoute } from '@tanstack/react-router'
import { CreatorStore } from '@/components/creator/CreatorStore'

export const Route = createFileRoute('/creator/store/')({
  component: CreatorStorePage,
})

function CreatorStorePage() {
  return <CreatorStore />
}
