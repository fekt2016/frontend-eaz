"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPalette, FaSearch, FaBullhorn, FaStar, FaHashtag,
  FaEnvelope, FaMobileAlt, FaChevronLeft, FaChevronRight,
} from "react-icons/fa";

const slides = [
  {
    icon: FaPalette,
    service: "Web Design",
    headline: "Websites That Win Clients",
    description: "We design fast, modern websites that make your business look credible and convert visitors into customers.",
    cta: "See Web Design",
    href: "/services/web-design",
    accent: "#F5A623",
    bg: "#fffbf5",
  },
  {
    icon: FaSearch,
    service: "SEO",
    headline: "Get Found on Google",
    description: "Rank higher, attract the right traffic, and grow organic revenue — with SEO built specifically for Ghanaian businesses.",
    cta: "Explore SEO",
    href: "/services/seo",
    accent: "#10b981",
    bg: "#f0fdf4",
  },
  {
    icon: FaBullhorn,
    service: "Paid Advertising",
    headline: "Ads That Actually Convert",
    description: "Google and Meta campaigns targeted precisely to your audience — every cedi of your budget working hard.",
    cta: "Run Better Ads",
    href: "/services/web-marketing",
    accent: "#3b82f6",
    bg: "#eff6ff",
  },
  {
    icon: FaStar,
    service: "Branding",
    headline: "A Brand Worth Remembering",
    description: "Logo, identity, and brand strategy that tells your story clearly and sets you apart from the competition.",
    cta: "Build Your Brand",
    href: "/services/web-design",
    accent: "#8b5cf6",
    bg: "#f5f3ff",
  },
  {
    icon: FaHashtag,
    service: "Social Media",
    headline: "Grow Your Audience Daily",
    description: "Consistent, creative social media management that builds community, trust, and engagement around your brand.",
    cta: "Grow Social",
    href: "/services/web-marketing",
    accent: "#ec4899",
    bg: "#fdf2f8",
  },
  {
    icon: FaEnvelope,
    service: "Email Marketing",
    headline: "Turn Subscribers Into Buyers",
    description: "Strategic email campaigns that nurture leads, re-engage customers, and drive repeat revenue on autopilot.",
    cta: "Start Email",
    href: "/services/web-marketing",
    accent: "#f59e0b",
    bg: "#fffbeb",
  },
  {
    icon: FaMobileAlt,
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

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [paused, next]);

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

  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: "78vh", background: slide.bg, transition: "background 0.6s ease" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Hero carousel"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.55, ease: "easeInOut" }}
          className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center"
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: `${slide.accent}18` }}
          >
            <Icon size={36} style={{ color: slide.accent }} />
          </div>

          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: slide.accent }}>
            {slide.service}
          </p>

          <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-gray-900 mb-4 max-w-3xl leading-tight">
            {slide.headline}
          </h1>

          <p className="text-gray-500 text-lg max-w-xl mb-8 leading-relaxed">
            {slide.description}
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href={slide.href}
              className="px-6 py-3 rounded-full text-white text-sm font-semibold transition hover:opacity-90"
              style={{ background: slide.accent }}
            >
              {slide.cta}
            </Link>
            <Link
              href="/book-consultation"
              className="px-6 py-3 rounded-full border border-gray-300 text-gray-700 text-sm font-medium hover:bg-white transition"
            >
              Free Consultation
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Arrows */}
      <button
        type="button"
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-400 transition"
      >
        <FaChevronLeft size={14} />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-400 transition"
      >
        <FaChevronRight size={14} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setCurrent(i)}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === current ? "24px" : "8px",
              background: i === current ? slide.accent : "#d1d5db",
            }}
          />
        ))}
      </div>
    </section>
  );
}
