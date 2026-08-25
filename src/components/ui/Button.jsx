"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import cx from "./cx";

/*
 * The single button. Before this component the app carried 381 <button>
 * elements across 77 files, each with its own class string — including six
 * that set `dark:bg-brand-500 text-white`, which measures 2.10:1 and fails
 * WCAG AA. The primary variant here uses the codebase's own correct pairing,
 * `dark:bg-brand-500 dark:text-gray-900` (8.47:1).
 *
 * Renders <button> by default, <a>/<Link> when `href` is given, so a nav link
 * that looks like a button still gets link semantics.
 */

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-full " +
  "transition-colors duration-150 active:scale-[0.98] " +
  "disabled:opacity-50 disabled:pointer-events-none " +
  "whitespace-nowrap select-none";

const variants = {
  // Ink on light, gold on dark — the documented house style.
  primary:
    "bg-gray-900 text-white hover:bg-gray-700 " +
    "dark:bg-brand-500 dark:text-gray-900 dark:hover:bg-brand-400",
  // Gold fill in both themes, for moments that must read as brand.
  brand:
    "bg-brand-500 text-gray-900 hover:bg-brand-400 " +
    "dark:bg-brand-500 dark:text-gray-900 dark:hover:bg-brand-400",
  secondary:
    "border border-gray-200 text-gray-700 hover:border-gray-400 hover:text-gray-900 " +
    "dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white",
  ghost:
    "text-gray-600 hover:bg-gray-100 hover:text-gray-900 " +
    "dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
  danger:
    "bg-error text-white hover:bg-error/90 " +
    "dark:bg-error-dark dark:text-gray-900 dark:hover:bg-error-dark/90",
};

// Every size clears the 44px minimum touch target except `sm`, which is for
// dense table/toolbar rows where the target is the surrounding row.
const sizes = {
  sm: "text-body-sm px-3.5 py-2 min-h-[36px]",
  md: "text-body-sm px-5 py-2.5 min-h-[44px]",
  lg: "text-body px-6 py-3 min-h-[48px]",
};

const Button = forwardRef(function Button(
  {
    as,
    href,
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    className = "",
    children,
    disabled,
    type,
    ...props
  },
  ref
) {
  const classes = cx(
    base,
    variants[variant] || variants.primary,
    sizes[size] || sizes.md,
    fullWidth && "w-full",
    className
  );

  const content = (
    <>
      {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
      {children}
    </>
  );

  if (href && !disabled) {
    const External = as === "a" || /^(https?:|mailto:|tel:)/.test(href);
    if (External) {
      return (
        <a ref={ref} href={href} className={classes} {...props}>
          {content}
        </a>
      );
    }
    return (
      <Link ref={ref} href={href} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button
      ref={ref}
      type={type || "button"}
      className={classes}
      disabled={disabled || loading}
      // Tell assistive tech the control is working, not broken.
      aria-busy={loading || undefined}
      {...props}
    >
      {content}
    </button>
  );
});

export default Button;
