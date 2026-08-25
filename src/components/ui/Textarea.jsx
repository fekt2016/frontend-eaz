"use client";

import { forwardRef } from "react";
import Field from "./Field";
import cx from "./cx";
import { controlBase, controlSizes, controlBorder } from "./controlStyles";

const Textarea = forwardRef(function Textarea(
  { label, error, hint, required, size = "md", rows = 5, className = "", bare = false, id, hideLabel, ...props },
  ref
) {
  const control = (controlProps = {}) => (
    <textarea
      ref={ref}
      rows={rows}
      className={cx(
        controlBase,
        controlSizes[size] || controlSizes.md,
        controlBorder(!!error),
        "resize-y",
        className
      )}
      {...controlProps}
      {...props}
    />
  );

  if (bare || (!label && !error && !hint)) return control({ id });

  return (
    <Field label={label} error={error} hint={hint} required={required} id={id} hideLabel={hideLabel}>
      {control}
    </Field>
  );
});

export default Textarea;
