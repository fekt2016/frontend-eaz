export default function Loading() {
  return (
    <div className="min-h-screen bg-paper dark:bg-ink flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-slate-700 border-t-brand-500 animate-spin" />
        <p className="text-sm text-gray-600 dark:text-slate-500 font-medium">Loading…</p>
      </div>
    </div>
  );
}
