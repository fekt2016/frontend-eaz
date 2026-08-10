import DashboardGuard from "./DashboardGuard";
import DashboardShell from "./DashboardShell";

export const metadata = {
  title: "Dashboard | EazWorld",
  description: "Manage your orders, hosting, and account.",
};

export default function DashboardLayout({ children }) {
  return (
    <DashboardGuard>
      <DashboardShell>{children}</DashboardShell>
    </DashboardGuard>
  );
}
