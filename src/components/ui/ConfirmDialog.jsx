"use client";

import Modal from "./Modal";
import Button from "./Button";

/*
 * Replaces window.confirm(), which the dashboard used in 13 places.
 *
 * Three reasons it had to go: the native dialog is unstyled and unbranded, it
 * blocks the whole tab, and — the one that actually costs — it gives the user
 * no room to explain the consequence. "Are you sure?" is not a decision aid;
 * "the cPanel account and all its data are deleted" is.
 *
 * `tone="danger"` is the default because every current caller is a destructive
 * action. Pass tone="primary" for a confirmation that merely needs a beat.
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
  children,
}) {
  if (!open) return null;

  return (
    <Modal
      open
      size="sm"
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children ?? (
        <p className="text-body-sm text-gray-600 dark:text-slate-400">
          This cannot be undone.
        </p>
      )}
    </Modal>
  );
}
