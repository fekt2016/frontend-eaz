import cx from "./cx";

/*
 * The canonical public-page container.
 *
 * Two drifts this exists to end:
 *  1. The navbar is `fixed` and h-16, and <main> has no compensating padding,
 *     so every page invented its own offset — pt-28 (x32), pt-24 (x8),
 *     pt-32 (x5), pt-16 (x4), pt-20 (x1). Header-to-content distance visibly
 *     changed as you navigated.
 *  2. The navbar centres on max-w-6xl, but pages used max-w-5xl / 3xl / 4xl /
 *     2xl, so content edges did not line up with the logo between routes.
 *
 * `pt-28` is the offset the majority already used; `max-w-6xl` matches the
 * navbar. `width="narrow"` keeps a 3xl measure for long-form reading (blog,
 * legal) while still aligning its outer gutter.
 *
 * Existing pages are migrated incrementally — each one needs a look at its hero
 * before its bespoke offset is replaced, so this does not sweep them blind.
 */
const widths = {
  default: "max-w-6xl",
  narrow: "max-w-3xl",
  wide: "max-w-7xl",
};

export default function PageContainer({
  width = "default",
  offset = true,
  className = "",
  children,
  ...props
}) {
  return (
    <div
      className={cx(
        "mx-auto w-full px-4 sm:px-6",
        widths[width] || widths.default,
        offset && "pt-28 pb-20",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
