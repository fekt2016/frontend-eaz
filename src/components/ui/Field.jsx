"use client";

import { useId } from "react";
import cx from "./cx";

/*
 * Field wires up the accessibility the codebase was missing.
 *
 * Audit baseline: 211 <input>, 42 <select>, 24 <textarea> — and exactly 4
 * `htmlFor` attributes in the whole app. Several forms (ContactForm among them)
 * used placeholders as labels, which vanish the moment the user types. Errors
 * rendered as plain <p className="text-red-500"> with no role="alert", so a
 * screen-reader user got no announcement that submission had failed.
 *
 * Field takes children as a function so it can hand the control the generated
 * id and the aria-* wiring:
 *
 *   <Field label="Email" error={errors.email}>
 *     {(p) => <input type="email" {...p} />}
 *   </Field>
 *
 * `hideLabel` keeps the label in the accessibility tree but out of the layout —
 * for search boxes and toolbar controls where a visible label would be noise.
 */
export default function Field({
  label,
  error,
  hint,
  required = false,
  id: idProp,
  hideLabel = false,
  className = "",
  children,
}) {
  const reactId = useId();
  const id = idProp || `f-${reactId}`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const describedBy = cx(hint && hintId, error && errorId) || undefined;

  const controlProps = {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    "aria-required": required || undefined,
  };

  return (
    <div className={cx("w-full", className)}>
      {label && (
        <label
          htmlFor={id}
          className={cx(
            "block text-body-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5",
            hideLabel && "sr-only-text"
          )}
        >
          {label}
          {required && (
            <>
              <span aria-hidden="true" className="text-error dark:text-error-dark ml-0.5">
                *
              </span>
              <span className="sr-only-text"> (required)</span>
            </>
          )}
        </label>
      )}

      {typeof children === "function" ? children(controlProps) : children}

      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-caption text-gray-600 dark:text-slate-400">
          {hint}
        </p>
      )}

      {error && (
        // role="alert" so the message is announced when it appears, not only
        // when focus happens to land on the field.
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 text-caption font-medium text-error dark:text-error-dark"
        >
          {error}
        </p>
      )}
    </div>
  );
}
