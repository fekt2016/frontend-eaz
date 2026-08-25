import Button from "@/components/ui/Button";
import StarRule from "@/components/common/StarRule";

export const metadata = {
  title: { absolute: "Page Not Found | EazWorld" },
  description: "This page could not be found.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-20 text-center bg-paper dark:bg-ink">
      <p className="font-mono text-eyebrow font-bold uppercase text-brand-ink dark:text-brand-400 mb-3">
        Error 404
      </p>
      <StarRule className="mb-6" />

      <h1 className="font-display font-bold text-4xl sm:text-5xl text-gray-900 dark:text-white mb-3">
        We can&apos;t find that page
      </h1>
      <p className="text-body text-gray-600 dark:text-slate-400 max-w-md mb-8">
        The link may be out of date, or the page may have moved. The shop, services and your account
        are all still where you left them.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button href="/">Back to home</Button>
        <Button href="/shop" variant="secondary">
          Browse the shop
        </Button>
      </div>
    </div>
  );
}
