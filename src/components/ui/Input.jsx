"use client";

import { forwardRef } from "react";
import Field from "./Field";
import cx from "./cx";
import { controlBase, controlSizes, controlBorder } from "./controlStyles";

/*
 * Input renders its own Field wrapper when given a `label`, so migrating a
 * placeholder-only form is a one-line change:
 *
 *   <input className={inputCls} placeholder="Your name" />
 *   → <Input label="Your name" placeholder="Kwame Mensah" />
 *
 * Pass `bare` to get just the control (for custom layouts that already own a
 * label, e.g. an input group with a leading icon).
 */
const Input = forwardRef(function Input(
  { label, error, hint, required, size = "md", className = "", bare = false, id, hideLabel, ...props },
  ref
) {
  const control = (controlProps = {}) => (
    <input
      ref={ref}
      className={cx(controlBase, controlSizes[size] || controlSizes.md, controlBorder(!!error), className)}
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

export default Input;
