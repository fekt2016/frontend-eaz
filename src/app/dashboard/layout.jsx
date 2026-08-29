import DashboardGuard from "./DashboardGuard";
import AppShellDecision from "./AppShellDecision";
import ChatWidget from "@/components/ChatWidget";

export const metadata = {
  title: "Dashboard | EazWorld",
  description: "Manage your orders, hosting, and account.",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }) {
  return (
    <DashboardGuard>
      <AppShellDecision>{children}</AppShellDecision>
      <ChatWidget />
    </DashboardGuard>
  );
}
