// Shared dashboard navigation — used by the dashboard sidebar (DashboardShell)
// and reused (dark-styled) in the POS sidebar so admins can jump between the
// admin dashboard and POS from one place.
import {
  FaTachometerAlt, FaUserCircle, FaTools, FaStore, FaCalendarAlt, FaComments,
  FaStar, FaFileAlt, FaServer, FaGlobe, FaUsers, FaEnvelope,
} from "react-icons/fa";

// Shown to every logged-in dashboard user.
export const baseNav = [
  { href: "/dashboard", icon: FaTachometerAlt, label: "Overview" },
  { href: "/dashboard/settings", icon: FaUserCircle, label: "Settings" },
];

// Admin/superadmin only.
export const adminNav = [
  { href: "/dashboard/admin-overview", icon: FaTachometerAlt, label: "Admin Overview" },
  { href: "/pos", icon: FaTools, label: "Repair Shop POS" },
  { href: "/commerce", icon: FaStore, label: "Commerce" },
  { href: "/dashboard/consultations", icon: FaCalendarAlt, label: "Consultations" },
  { href: "/dashboard/chats", icon: FaComments, label: "Chat Sessions" },
  { href: "/dashboard/reviews", icon: FaStar, label: "Reviews" },
  { href: "/dashboard/blog", icon: FaFileAlt, label: "Blog Posts" },
  { href: "/dashboard/hosting-orders", icon: FaServer, label: "Hosting Orders" },
  { href: "/dashboard/domain-orders", icon: FaGlobe, label: "Domain Orders" },
  { href: "/dashboard/users", icon: FaUsers, label: "Users" },
  { href: "/dashboard/emails", icon: FaEnvelope, label: "Email Logs" },
];
