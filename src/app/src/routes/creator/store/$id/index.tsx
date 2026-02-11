import { createFileRoute } from '@tanstack/react-router'
import { StoreTemplateDetail } from '@/components/creator/StoreTemplateDetail'

export const Route = createFileRoute('/creator/store/$id/')({
  component: StoreTemplateDetailPage,
})

function StoreTemplateDetailPage() {
  return <StoreTemplateDetail />
}
