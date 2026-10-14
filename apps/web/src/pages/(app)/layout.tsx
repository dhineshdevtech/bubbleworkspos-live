import { AppShell } from "@/components/app-shell";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
