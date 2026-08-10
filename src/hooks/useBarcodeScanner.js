"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * useBarcodeScanner
 *
 * Captures keyboard-wedge barcode scanner input globally.
 * A scanner fires characters very fast (< 50ms between chars) then sends Enter.
 * A human types slowly (> 50ms between chars).
 *
 * @param {function} onScan  - called with the scanned string
 * @param {object}   options
 *   minLength    {number}  - minimum valid scan length (default 4)
 *   maxLength    {number}  - maximum valid scan length (default 50)
 *   debounceMs   {number}  - ms to wait after last char before firing (default 80)
 *   active       {boolean} - enable/disable the listener (default true)
 *   ignoreTarget {string}  - CSS selector — suppress scan if this element is focused
 */
export function useBarcodeScanner(onScan, {
  minLength  = 4,
  maxLength  = 50,
  debounceMs = 80,
  active     = true,
} = {}) {
  const bufferRef  = useRef("");
  const lastKeyRef = useRef(0);
  const timerRef   = useRef(null);

  const flush = useCallback((buf) => {
    const code = buf.trim();
    if (code.length >= minLength && code.length <= maxLength) {
      onScan(code);
    }
    bufferRef.current = "";
  }, [onScan, minLength, maxLength]);

  useEffect(() => {
    if (!active) return;

    const handleKeydown = (e) => {
      // Ignore if a textarea or input[type=text/password] is focused
      const tag  = document.activeElement?.tagName?.toLowerCase();
      const type = document.activeElement?.type?.toLowerCase();
      if (tag === 'textarea') return;
      if (tag === 'input' && type !== 'text' && type !== 'search') return;

      const now  = Date.now();
      const gap  = now - lastKeyRef.current;
      lastKeyRef.current = now;

      // Scanner fires chars with < 50ms gap; human > 100ms
      // If gap is too large, reset buffer (likely a new scan attempt)
      if (gap > 300 && bufferRef.current.length > 0) {
        bufferRef.current = "";
      }

      if (e.key === "Enter") {
        clearTimeout(timerRef.current);
        const buf = bufferRef.current;
        bufferRef.current = "";
        flush(buf);
        return;
      }

      // Only accumulate printable characters
      if (e.key.length === 1) {
        bufferRef.current += e.key;

        // Auto-flush after debounce (handles scanners that don't send Enter)
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          const buf = bufferRef.current;
          bufferRef.current = "";
          flush(buf);
        }, debounceMs);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
      clearTimeout(timerRef.current);
    };
  }, [active, flush, debounceMs]);
}
