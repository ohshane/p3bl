import { createFileRoute } from '@tanstack/react-router'
import { CreatorLibrary } from '@/components/creator/CreatorLibrary'

export const Route = createFileRoute('/creator/library/')({
  component: CreatorLibraryPage,
})

function CreatorLibraryPage() {
  return <CreatorLibrary />
}
