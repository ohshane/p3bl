import { createFileRoute } from "@tanstack/react-router";
import { ProjectDetailPage } from "@/routes/creator/project/$projectId/index";

export const Route = createFileRoute("/creator/library/$id/")({
  component: LibraryTemplateDetailPage,
});

function LibraryTemplateDetailPage() {
  return <ProjectDetailPage />;
}
