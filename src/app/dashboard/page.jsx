import DashboardHosting from "./DashboardHosting";

export default function Dashboard() {
  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 pt-28 pb-24">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Account</p>
        <h1 className="font-display font-bold text-3xl text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-500 mb-10">Your recent orders and submissions appear here.</p>
        <DashboardHosting />
      </div>
    </div>
  );
}
