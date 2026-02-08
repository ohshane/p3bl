import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/creator/project/$projectId")({
  component: ProjectLayout,
});

function ProjectLayout() {
  return <Outlet />;
}
