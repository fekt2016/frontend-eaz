"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Palette, Search, Megaphone, Star, Hash,
  Mail, Smartphone, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import StarRule from "@/components/common/StarRule";

const slides = [
  {
    icon: Palette,
    service: "Web Design",
    headline: "Websites That Win Clients",
    description: "We design fast, modern websites that make your business look credible and convert visitors into customers.",
    cta: "See Web Design",
    href: "/services/web-design",
    accent: "#F5A623",
    bg: "#fffbf5",
  },
  {
    icon: Search,
    service: "SEO",
    headline: "Get Found on Google",
    description: "Rank higher, attract the right traffic, and grow organic revenue — with SEO built specifically for Ghanaian businesses.",
    cta: "Explore SEO",
    href: "/services/seo",
    accent: "#10b981",
    bg: "#f0fdf4",
  },
  {
    icon: Megaphone,
    service: "Paid Advertising",
    headline: "Ads That Actually Convert",
    description: "Google and Meta campaigns targeted precisely to your audience — every cedi of your budget working hard.",
    cta: "Run Better Ads",
    href: "/services/paid-ads",
    accent: "#3b82f6",
    bg: "#eff6ff",
  },
  {
    icon: Star,
    service: "Branding",
    headline: "A Brand Worth Remembering",
    description: "Logo, identity, and brand strategy that tells your story clearly and sets you apart from the competition.",
    cta: "Build Your Brand",
    href: "/services/branding",
    accent: "#8b5cf6",
    bg: "#f5f3ff",
  },
  {
    icon: Hash,
    service: "Social Media",
    headline: "Grow Your Audience Daily",
    description: "Consistent, creative social media management that builds community, trust, and engagement around your brand.",
    cta: "Grow Social",
    href: "/services/social-media",
    accent: "#ec4899",
    bg: "#fdf2f8",
  },
  {
    icon: Mail,
    service: "Email Marketing",
    headline: "Turn Subscribers Into Buyers",
    description: "Strategic email campaigns that nurture leads, re-engage customers, and drive repeat revenue on autopilot.",
    cta: "Start Email",
    href: "/services/email",
    accent: "#f59e0b",
    bg: "#fffbeb",
  },
  {
    icon: Smartphone,
    service: "Phone Repair",
    headline: "Your Phone Fixed Today",
    description: "Fast, reliable phone repair in Accra. All major brands, 30-day warranty, honest pricing. Walk-ins welcome.",
    cta: "Get a Repair",
    href: "/services/phone-repair",
    accent: "#06b6d4",
    bg: "#ecfeff",
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    setReady(true);
  }, []);

  const prefersReducedMotion = useReducedMotion();

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), []);

  // WCAG 2.2.2: content that moves on its own for more than five seconds needs
  // a way to stop it. Honouring the OS setting is that stop for anyone who has
  // asked for reduced motion — they get a static first slide and the arrows.
  useEffect(() => {
    if (paused || prefersReducedMotion) return;
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [paused, prefersReducedMotion, next]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const slide = slides[current];
  const Icon = slide.icon;

  // In dark mode use a deep dark bg with a subtle tint of the accent colour.
  // Applied only after mount so first paint uses the paper/ink classes below.
  const heroBg = ready && isDark
    ? `linear-gradient(135deg, #161209 0%, ${slide.accent}0d 100%)`
    : ready ? slide.bg : undefined;

  return (
    <section
      className="relative overflow-hidden bg-paper dark:bg-ink"
      style={{ minHeight: "85vh", transition: "background 0.8s ease", ...(heroBg ? { background: heroBg } : {}) }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Hero carousel"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 flex items-center"
        >
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center w-full">
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-left"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: `${slide.accent}20` }}
              >
                <Icon size={28} style={{ color: slide.accent }} />
              </div>

              <p className="font-mono text-eyebrow font-bold uppercase mb-3" style={{ color: slide.accent }}>
                {slide.service}
              </p>

              <StarRule className="mb-6" />

              <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl text-gray-900 dark:text-white mb-6 leading-tight">
                {slide.headline}
              </h1>

              <p className="text-gray-500 dark:text-slate-400 text-lg max-w-lg mb-10 leading-relaxed">
                {slide.description}
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href={slide.href}
                  className="px-8 py-4 rounded-full text-white text-sm font-bold transition hover:scale-105 active:scale-95 shadow-lg"
                  style={{ background: slide.accent }}
                >
                  {slide.cta}
                </Link>
                <Link
                  href="/book-consultation"
                  className="px-8 py-4 rounded-full border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-sm font-semibold hover:bg-white/10 dark:hover:bg-white/10 hover:border-gray-400 dark:hover:border-slate-500 transition"
                >
                  Free Consultation
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ x: 30, opacity: 0, scale: 0.95 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="relative hidden md:block"
            >
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-8 border-white/30 dark:border-white/10 backdrop-blur-sm">
                <Image
                  src={slide.image || "/images/hero/web-design.png"}
                  alt={slide.headline}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
              {/* Floating decorative element */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-6 -left-6 w-32 h-32 rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-xl p-4 flex flex-col justify-center border border-gray-100 dark:border-slate-700"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-2">
                  <Star className="text-emerald-600 dark:text-emerald-400" size={16} />
                </div>
                <p className="font-mono text-[10px] font-bold text-gray-600 dark:text-slate-500 uppercase">Success Rate</p>
                <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">99.9%</p>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Arrows */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 z-10 pointer-events-none">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous slide"
          className="w-12 h-12 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-gray-200 dark:border-slate-700 shadow-lg flex items-center justify-center text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:scale-110 transition pointer-events-auto"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next slide"
          className="w-12 h-12 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-gray-200 dark:border-slate-700 shadow-lg flex items-center justify-center text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:scale-110 transition pointer-events-auto"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setCurrent(i)}
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: i === current ? "32px" : "8px",
              background: i === current ? slide.accent : ready && isDark ? "#475569" : "#d1d5db",
            }}
          />
        ))}
      </div>
    </section>
  );
}
