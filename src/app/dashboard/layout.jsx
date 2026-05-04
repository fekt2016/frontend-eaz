import DashboardGuard from "./DashboardGuard";

export const metadata = {
  title: "Dashboard | EazWorld",
  description: "Manage your hosting orders and account.",
};

export default function DashboardLayout({ children }) {
  return <DashboardGuard>{children}</DashboardGuard>;
}
