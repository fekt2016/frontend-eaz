"use client";

import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import Field from "./Field";
import cx from "./cx";
import { controlBase, controlSizes, controlBorder } from "./controlStyles";

/*
 * A native <select> with the house surface. Native is deliberate: it gets
 * keyboard behaviour, mobile pickers and screen-reader support for free, which
 * a hand-rolled listbox in this codebase would not.
 */
const Select = forwardRef(function Select(
  { label, error, hint, required, size = "md", className = "", children, bare = false, id, hideLabel, ...props },
  ref
) {
  const control = (controlProps = {}) => (
    <div className="relative">
      <select
        ref={ref}
        className={cx(
          controlBase,
          controlSizes[size] || controlSizes.md,
          controlBorder(!!error),
          "appearance-none pr-10 cursor-pointer",
          className
        )}
        {...controlProps}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 dark:text-slate-400"
      />
    </div>
  );

  if (bare || (!label && !error && !hint)) return control({ id });

  return (
    <Field label={label} error={error} hint={hint} required={required} id={id} hideLabel={hideLabel}>
      {control}
    </Field>
  );
});

export default Select;
