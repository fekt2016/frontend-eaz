"use client";

import { MotionConfig } from "framer-motion";

/*
 * Makes framer-motion honour prefers-reduced-motion app-wide.
 *
 * The global CSS block in globals.css only reaches CSS-driven animation;
 * framer-motion drives transforms from JS, so it needs telling separately.
 * `reducedMotion="user"` keeps opacity fades (which don't trigger vestibular
 * symptoms) but drops transform and layout animation when the OS asks for it —
 * so the hero, cart drawer, portfolio timeline and resource modals all settle
 * instantly instead of sliding.
 *
 * One provider beats editing each of the five motion components, and it covers
 * any future ones automatically.
 */
export default function MotionProvider({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
