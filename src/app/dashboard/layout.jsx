import DashboardGuard from "./DashboardGuard";

export const metadata = {
  title: "Dashboard | EazWorld",
  description: "Manage your hosting orders and account.",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }) {
  return <DashboardGuard>{children}</DashboardGuard>;
}
