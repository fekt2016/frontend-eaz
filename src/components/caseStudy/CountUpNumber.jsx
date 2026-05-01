"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInView } from "framer-motion";

function parseMetricValue(rawValue) {
  const value = String(rawValue ?? "");
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();

  const skipCountUp =
    trimmed.startsWith("#") ||
    lower.includes("page") ||
    trimmed.includes("★") ||
    trimmed.includes("/") ||
    lower.includes("verified");

  const numberMatch = trimmed.match(/^(-?\d[\d,]*\.?\d*)(.*)$/);
  const numString = numberMatch?.[1] ?? "";
  const suffix = numberMatch?.[2] ?? "";
  const num = numString ? Number(numString.replace(/,/g, "")) : NaN;

  return { trimmed, skipCountUp, num, suffix };
}

export default function CountUpNumber({ value, duration = 2000 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  const { trimmed, skipCountUp, num, suffix } = useMemo(
    () => parseMetricValue(value),
    [value]
  );

  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;

    if (skipCountUp || Number.isNaN(num)) {
      setDisplay(trimmed);
      return;
    }

    let rafId = 0;
    const start = performance.now();

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = Math.round(eased * num);

      setDisplay(`${current}${suffix}`);

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        setDisplay(`${Math.round(num)}${suffix}`);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [duration, inView, num, skipCountUp, suffix, trimmed]);

  return (
    <span ref={ref} style={{ opacity: inView ? 1 : 0, transition: "opacity 0.4s ease" }}>
      {display}
    </span>
  );
}

