import DashboardGuard from "./DashboardGuard";
import AppShellDecision from "./AppShellDecision";
import ChatWidget from "@/components/ChatWidget";

export const metadata = {
  // T104 — no brand here: the root layout's title.template appends "| EazWorld".
  title: "Dashboard",
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
