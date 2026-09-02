import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PublicShell } from "@/components/lv/PublicShell";

export const Route = createFileRoute("/public")({
  component: PublicLayout,
});

function PublicLayout() {
  return (
    <PublicShell>
      <Outlet />
    </PublicShell>
  );
}
