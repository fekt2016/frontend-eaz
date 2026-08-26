import StarRule from "@/components/common/StarRule";
import cx from "./cx";

/*
 * The section eyebrow, and the app's signature gesture, as one component.
 *
 * The pattern was previously retyped inline as
 *   font-mono text-eyebrow font-bold uppercase text-brand-ink
 * followed by a separate <StarRule />. Two problems: `text-brand-ink` measures
 * 2.53:1 on paper — a fail at 11px bold — and the arbitrary size sat outside
 * the type scale. Both are fixed here in one place: `text-eyebrow` is the named
 * 11px tier (tracking baked in) and `text-brand-ink` is the same gold at
 * 5.57:1.
 */
export default function Eyebrow({ children, rule = true, className = "" }) {
  return (
    <div className={cx("mb-4", className)}>
      <p className="font-mono text-eyebrow font-bold uppercase text-brand-ink dark:text-brand-400">
        {children}
      </p>
      {rule && <StarRule className="mt-3" />}
    </div>
  );
}
