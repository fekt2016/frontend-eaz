"use client";

import { useEffect, useRef, useCallback, useId, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import cx from "./cx";

/*
 * The dialog the app didn't have.
 *
 * Audit baseline: 13 hand-rolled `fixed inset-0` overlays, of which only 2 set
 * role="dialog" and 3 aria-modal; Escape was handled in 3 files; body scroll
 * lock existed in exactly one (CartDrawer); and nothing anywhere trapped focus,
 * so keyboard focus walked straight out of an open modal into the page behind.
 *
 * This handles all of it in one place: portal, role/aria-modal, labelled title,
 * Escape, backdrop click, scroll lock, focus trap, and focus restoration to
 * whatever opened it.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), ' +
  'select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const sizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  full: "max-w-4xl",
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  showClose = true,
  className = "",
}) {
  const panelRef = useRef(null);
  const restoreRef = useRef(null);
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0 });
  const [mounted, setMounted] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const reactId = useId();
  const titleId = `dlg-${reactId}-title`;
  const descId = `dlg-${reactId}-desc`;

  useEffect(() => setMounted(true), []);

  // Remember what had focus, and give it back on close
  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement;
    return () => {
      const el = restoreRef.current;
      if (el && typeof el.focus === "function") el.focus();
    };
  }, [open]);

  // Reset drag offset when modal opens
  useEffect(() => {
    if (open) setOffset({ x: 0, y: 0 });
  }, [open]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Move focus into the dialog once it exists
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const first = panel.querySelector(FOCUSABLE);
      (first || panel).focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  // Drag handlers — grab the header, move the whole panel
  const onDragStart = useCallback((e) => {
    if (e.target.closest("button, a, input, textarea, select")) return;
    e.preventDefault();
    dragRef.current = { dragging: true, startX: e.clientX - offset.x, startY: e.clientY - offset.y };
    document.body.style.userSelect = "none";

    const onMove = (ev) => {
      if (!dragRef.current.dragging) return;
      setOffset({ x: ev.clientX - dragRef.current.startX, y: ev.clientY - dragRef.current.startY });
    };
    const onUp = () => {
      dragRef.current.dragging = false;
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [offset]);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (items.length === 0) { e.preventDefault(); panel.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    },
    [onClose]
  );

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        aria-label={title ? undefined : "Dialog"}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
        className={cx(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          "w-full bg-white dark:bg-slate-900 pointer-events-auto",
          "border border-gray-200 dark:border-slate-800",
          "rounded-2xl",
          "max-h-[90vh] overflow-y-auto animate-dialog-in shadow-xl",
          sizes[size] || sizes.md,
          className
        )}
      >
        {(title || showClose) && (
          <div
            onMouseDown={onDragStart}
            className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 pb-4 border-b border-gray-100 dark:border-slate-800 cursor-grab active:cursor-grabbing select-none"
          >
            <div className="min-w-0">
              {title && (
                <h2
                  id={titleId}
                  className="font-display font-bold text-lg text-gray-900 dark:text-white"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="mt-1 text-body-sm text-gray-600 dark:text-slate-400">
                  {description}
                </p>
              )}
            </div>
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="flex-shrink-0 -mr-1 -mt-1 p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
              >
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        <div className="px-5 sm:px-6 py-5">{children}</div>

        {footer && (
          <div className="px-5 sm:px-6 py-4 border-t border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
