"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, X, Check, Star, Rocket, Link2, Link as LinkIcon, Atom, BarChart3, Bell, Cog, CreditCard, Flame, Globe, Hexagon, Leaf, Lock, Map, MapPin, Monitor, Palette, PenLine, Pencil, Printer, Shield, ShoppingBag, ShoppingCart, Smartphone, SmartphoneNfc, Target, TrendingUp, Triangle, Wrench, Zap } from "lucide-react";
import { PROJECTS } from "@/data/portfolioData";
import CountUpNumber from "@/components/caseStudy/CountUpNumber";

const CATEGORY_COLORS = {
  "Web Design": "bg-violet-50 text-violet-700",
  "Mobile Apps": "bg-blue-50 text-blue-700",
  "Brand Identity": "bg-purple-50 text-purple-700",
  "E-commerce": "bg-brand-50 text-brand-700",
  "SEO Projects": "bg-emerald-50 text-emerald-700",
  "Domain & Hosting": "bg-cyan-50 text-cyan-700",
};

function getTechIcon(tag) {
  const map = {
    WooCommerce: ShoppingCart, WordPress: Globe, React: Atom, "React.js": Atom,
    "React Native": Smartphone, Node: Hexagon, "Node.js": Hexagon,
    MongoDB: Leaf, Paystack: CreditCard, Firebase: Flame, Shopify: ShoppingBag,
    "Next.js": Triangle, Next: Triangle, "Framer Motion": Palette, SEO: TrendingUp,
    "Technical SEO": TrendingUp, cPanel: Cog, SSL: Lock, "Google Analytics": BarChart3,
    "Local SEO": MapPin, "Content Marketing": PenLine, "Content Strategy": PenLine,
    "Brand Strategy": Target, "Brand Guidelines": Target, "Logo Design": Pencil,
    Print: Printer, "Google Maps API": Map, "MTN MoMo": SmartphoneNfc,
    "Mobile Money": SmartphoneNfc, "Push Notifications": Bell, "Real-time Orders": Zap,
    "VPS Hosting": Monitor, "DNS Management": Globe, "Security Audit": Shield,
    "Bulk Domains": LinkIcon,
  };
  if (tag === "Flutter") return "🦋"; // exception — no butterfly icon in lucide
  return map[tag] || Wrench;
}

function getChallengeBullets(category) {
  const map = {
    "Web Design": ["Outdated website failing to convert visitors", "Poor mobile experience losing customers", "No clear call-to-action or user journey"],
    "E-commerce": ["Customers unable to complete purchases easily", "No online payment options for Ghanaian users", "Manual order management was unsustainable"],
    "Mobile Apps": ["No mobile presence in an increasingly mobile market", "Customers couldn't access services on the go", "Competitors gaining advantage with native apps"],
    "Brand Identity": ["Inconsistent branding across all touchpoints", "Brand failed to communicate premium positioning", "No clear visual identity to build trust"],
    "SEO Projects": ["Website invisible on Google search results", "Competitors capturing all organic traffic", "Paying too much for ads with poor ROI"],
    "Domain & Hosting": ["Slow, unreliable hosting causing downtime", "Disorganised domain portfolio hard to manage", "Old host lacked support for African markets"],
  };
  return map[category] || ["Current digital experience was limiting growth", "Customers struggled to understand the offer", "Internal team lacked tools to move faster"];
}

function getSolutionBullets(category) {
  const map = {
    "Web Design": ["Redesigned with conversion-focused UX and clear CTAs", "Built fully responsive, mobile-first experience", "Implemented analytics to track and improve performance"],
    "E-commerce": ["Streamlined checkout optimised for local payment methods", "Introduced secure online payments and order tracking", "Automated order workflows to reduce manual work"],
    "Mobile Apps": ["Designed and built a native-feeling mobile experience", "Enabled customers to access services anywhere, anytime", "Integrated push notifications to drive engagement"],
    "Brand Identity": ["Created a cohesive visual identity and logo system", "Defined brand guidelines for all touchpoints", "Aligned design with premium, trustworthy positioning"],
    "SEO Projects": ["Fixed technical SEO issues holding rankings back", "Optimised content around high-intent local keywords", "Set up analytics and reporting to measure ROI"],
    "Domain & Hosting": ["Migrated sites to fast, reliable modern hosting", "Centralised domain management with clear ownership", "Improved security, backups, and performance monitoring"],
  };
  return map[category] || ["Designed a solution tailored to the business goals", "Focused on user experience for the right audience", "Delivered a scalable foundation for future growth"];
}

function describeProcessStep(step) {
  const map = {
    "Discovery & Research": "We start by understanding your business, goals, and audience through stakeholder interviews and competitive analysis.",
    "UX Design & Wireframes": "We design the user experience before writing code — wireframes validate the journey before visual design begins.",
    "Development & Integration": "Clean, scalable code with all integrations — payments, APIs, third-party services — tested thoroughly before launch.",
    "Launch & Training": "We go live with full QA testing, then train your team to manage the platform confidently going forward.",
  };
  return map[step] || "We execute this phase with precision, keeping you informed at every milestone until completion.";
}

export default function PortfolioDetail({ slug }) {
  const router = useRouter();
  const project = useMemo(() => PROJECTS.find((p) => p.slug === slug), [slug]);

  const [readProgress, setReadProgress] = useState(0);
  const [showNavTitle, setShowNavTitle] = useState(false);
  const [copied, setCopied] = useState(false);
  const [parallaxY, setParallaxY] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const timelineRef = useRef(null);
  const timelineInView = useInView(timelineRef, { once: true, margin: "-100px" });
  const copiedResetRef = useRef(null);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, []);

  useEffect(() => {
    if (!project) {
      const t = setTimeout(() => router.push("/portfolio"), 3000);
      return () => clearTimeout(t);
    }
    document.title = `${project.title} — Case Study | EazWorld`;
  }, [project, router]);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setReadProgress(total > 0 ? (scrollY / total) * 100 : 0);
      setShowNavTitle(scrollY > 500);
      setParallaxY(scrollY * 0.25);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const images = useMemo(() => {
    if (!project) return [];
    const base = project.images?.length ? project.images : [1, 2, 3].map((i) => `https://picsum.photos/seed/${project.slug}-${i}/900/600`);
    return [project.heroImage || project.thumbnail, ...base.slice(0, 3)];
  }, [project]);

  const openLightbox = useCallback((i) => { setLightboxIndex(i); setLightboxOpen(true); }, []);
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);
  const showPrev = useCallback(() => setLightboxIndex((p) => (p === 0 ? images.length - 1 : p - 1)), [images.length]);
  const showNext = useCallback(() => setLightboxIndex((p) => (p === images.length - 1 ? 0 : p + 1)), [images.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, closeLightbox, showPrev, showNext]);

  if (!project) {
    return (
      <div className="min-h-screen bg-paper dark:bg-ink flex flex-col items-center justify-center pt-20 text-center px-4">
        <p className="text-7xl font-bold text-gray-100 dark:text-slate-800 mb-4">404</p>
        <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-2">Project not found</h1>
        <p className="text-gray-500 dark:text-slate-400 mb-6 max-w-sm">The project you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link href="/portfolio" className="px-5 py-2.5 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition">
          ← Back to Portfolio
        </Link>
      </div>
    );
  }

  const currentIndex = PROJECTS.findIndex((p) => p.slug === project.slug);
  const prevProject = currentIndex > 0 ? PROJECTS[currentIndex - 1] : null;
  const nextProject = currentIndex < PROJECTS.length - 1 ? PROJECTS[currentIndex + 1] : null;

  return (
    <div className="bg-paper dark:bg-ink text-gray-900 dark:text-white">

      {/* READ PROGRESS BAR */}
      <div
        className="fixed top-0 left-0 h-0.5 bg-brand-500 z-[999] transition-all duration-100"
        style={{ width: `${readProgress}%` }}
      />

      {/* STICKY NAV */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto h-16 px-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push("/portfolio")}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition flex-shrink-0"
          >
            <ArrowLeft size={12} /> All Projects
          </button>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: showNavTitle ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="font-semibold text-sm text-gray-900 dark:text-white truncate hidden sm:block"
          >
            {project.title}
          </motion.p>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setCopied(true);
                navigator.clipboard?.writeText(window.location.href).catch(() => {});
                if (copiedResetRef.current) clearTimeout(copiedResetRef.current);
                copiedResetRef.current = setTimeout(() => setCopied(false), 2000);
              }}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${copied ? "border-emerald-400 text-emerald-600" : "border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-gray-400 dark:hover:border-slate-500 hover:text-gray-700 dark:hover:text-slate-300"}`}
            >
              {copied ? (
                <span className="inline-flex items-center gap-1">Copied <Check size={10} /></span>
              ) : (
                <span className="inline-flex items-center gap-1"><Link2 size={10} /> Copy Link</span>
              )}
            </button>
            <span className={`hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[project.category] || "bg-gray-100 text-gray-600"}`}>
              {project.category}
            </span>
          </div>
        </div>
      </header>

      {/* HERO — image with gradient overlay, white text on dark */}
      <section className="relative min-h-[70vh] flex items-end overflow-hidden pt-16">
        <div
          className="absolute inset-0 transition-transform duration-75"
          style={{ transform: `translateY(${parallaxY}px)`, willChange: "transform" }}
        >
          <Image
            src={project.heroImage || project.thumbnail}
            alt={project.title}
            fill
            className="object-cover"
            style={{ minHeight: "80vh" }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 pb-12">
          <nav className="flex items-center gap-2 text-xs text-white/60 mb-6">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <span>›</span>
            <Link href="/portfolio" className="hover:text-white transition">Portfolio</Link>
            <span>›</span>
            <span className="text-white">{project.title}</span>
          </nav>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_COLORS[project.category] || "bg-white/20 text-white"}`}>
              {project.category}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs bg-white/20 text-white">{project.year}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs bg-white/20 text-white">{project.duration}</span>
          </div>
          <h1 className="font-display font-bold text-3xl md:text-5xl text-white mb-3 leading-tight max-w-3xl">
            {project.title}
          </h1>
          <p className="text-white/70 text-sm mb-2">For {project.client}</p>
          <p className="text-white/60 max-w-xl mb-7">{project.shortDesc}</p>
          <div className="flex flex-wrap gap-3">
            {project.liveUrl && project.liveUrl !== "#" && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-full bg-brand-500 text-gray-900 font-semibold text-sm hover:bg-brand-400 transition"
              >
                View Live Site ↗
              </a>
            )}
            <button
              type="button"
              onClick={() => router.push("/contact")}
              className="px-5 py-2.5 rounded-full border border-white/50 text-white text-sm font-medium hover:bg-white/10 transition"
            >
              Start Similar Project
            </button>
          </div>
        </div>
      </section>

      {/* OVERVIEW BAND */}
      <div className="bg-paper dark:bg-ink border-y border-gray-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-4 grid grid-cols-2 sm:grid-cols-5 divide-x divide-gray-200 dark:divide-slate-700">
          {[
            ["Client", project.client],
            ["Category", project.category],
            ["Timeline", project.duration],
            ["Year", project.year],
            ["Live", project.liveUrl && project.liveUrl !== "#" ? <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline">Visit ↗</a> : "Coming soon"],
          ].map(([label, value]) => (
            <div key={label} className="px-4 py-2 first:pl-0 last:pr-0">
              <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* IMPACT METRICS */}
      <section className="py-16 px-4 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto text-center mb-10">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-2">Project Impact</p>
          <h2 className="font-display font-bold text-2xl md:text-3xl text-gray-900 dark:text-white">Measurable Results That Matter</h2>
        </div>
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-5">
          {(project.results || []).slice(0, 3).map((r, idx) => (
            <div key={idx} className="text-center p-6 rounded-2xl border border-gray-100 dark:border-slate-800 bg-paper dark:bg-slate-800">
              <p className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-1">
                <CountUpNumber value={r.value} duration={2000} />
              </p>
              <p className="text-gray-500 dark:text-slate-400 text-sm">{r.label}</p>
              <div className="w-8 h-0.5 bg-brand-400 mx-auto mt-3 rounded-full" />
            </div>
          ))}
        </div>
        <div className="max-w-3xl mx-auto mt-6 flex flex-wrap justify-center gap-2">
          {(project.tags || []).map((tag) => (
            <span key={tag} className="px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 text-xs font-medium">
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* STORY + SIDEBAR */}
      <section className="py-16 px-4 bg-paper dark:bg-ink border-y border-gray-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_300px] gap-12 items-start">

          {/* Main content */}
          <div className="space-y-12">
            {/* Overview */}
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-2">01 — Overview</p>
              <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-4">About This Project</h2>
              <p className="text-gray-600 dark:text-slate-400 leading-relaxed">{project.caseStudy?.overview}</p>
            </div>

            {/* Challenge */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-2">02 — The Challenge</p>
              <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-4">The Problem We Solved</h2>
              <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-4">{project.caseStudy?.challenge}</p>
              <ul className="space-y-2">
                {getChallengeBullets(project.category).map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* Solution */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-2">03 — Our Solution</p>
              <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-4">How We Approached It</h2>
              <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-4">{project.caseStudy?.solution}</p>
              <ul className="space-y-2">
                {getSolutionBullets(project.category).map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-slate-400">
                    <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* Process timeline */}
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-2">04 — Our Process</p>
              <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-6">Step by Step</h2>
              <div ref={timelineRef} className="space-y-4">
                {(project.caseStudy?.process || []).slice(0, 4).map((step, i) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: -20 }}
                    animate={timelineInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: i * 0.12, ease: "easeOut" }}
                    className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800"
                  >
                    <div className="w-10 h-10 rounded-full border-2 border-brand-100 bg-brand-50 flex items-center justify-center font-display font-bold text-brand-500 text-sm flex-shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">Step {i + 1}</p>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{step}</h4>
                      <p className="text-gray-400 dark:text-slate-500 text-xs leading-relaxed">{describeProcessStep(step)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Outcome */}
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-2">05 — The Outcome</p>
              <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-4">What We Achieved Together</h2>
              <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-5">{project.caseStudy?.outcome}</p>
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
                <p className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Project Highlights</p>
                <ul className="space-y-2">
                  {(project.results || []).slice(0, 3).map((r) => (
                    <li key={r.label} className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-slate-300">
                      <Check size={14} className="text-emerald-500 flex-shrink-0" />
                      {r.value} {r.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5 lg:sticky lg:top-24">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
              <p className="font-semibold text-gray-900 dark:text-white text-sm mb-4">Project Details</p>
              {[["Client", project.client], ["Category", project.category], ["Year", project.year], ["Duration", project.duration]].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm py-2 border-b border-gray-50 dark:border-slate-800 last:border-0">
                  <span className="text-gray-400 dark:text-slate-500">{l}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{v}</span>
                </div>
              ))}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(project.tags || []).map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 text-xs">{tag}</span>
                ))}
              </div>
              {project.liveUrl && project.liveUrl !== "#" && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-4 text-center py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-xs font-medium hover:border-gray-400 dark:hover:border-slate-500 hover:text-gray-900 dark:hover:text-white transition"
                >
                  Visit Live Site ↗
                </a>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
              <p className="font-semibold text-gray-900 dark:text-white text-sm mb-3">At a Glance</p>
              {(project.results || []).slice(0, 3).map((r) => (
                <div key={r.label} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-slate-800 last:border-0">
                  <span className="font-display font-bold text-gray-900 dark:text-white">{r.value}</span>
                  <span className="text-gray-400 dark:text-slate-500 text-xs">{r.label}</span>
                </div>
              ))}
            </div>

            <div className="p-5 rounded-2xl bg-brand-50 border border-brand-100 text-center">
              <Rocket size={24} className="mb-2 mx-auto text-brand-500" />
              <h4 className="font-semibold text-gray-900 text-sm mb-1">Like What You See?</h4>
              <p className="text-gray-500 dark:text-gray-500 text-xs leading-relaxed mb-4">We can build something this impactful for your business.</p>
              <button
                type="button"
                onClick={() => router.push("/contact")}
                className="block w-full py-2.5 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 transition"
              >
                Start Your Project →
              </button>
              <p className="text-gray-400 text-xs mt-2">Free consultation · No obligation</p>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-2">Project Gallery</p>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-gray-900 dark:text-white">Behind the Screens</h2>
            <p className="text-gray-400 dark:text-slate-500 text-sm mt-2 max-w-md mx-auto">A closer look at how the experience comes together across key screens.</p>
          </div>
          <div
            className="relative rounded-2xl overflow-hidden cursor-pointer aspect-[16/8] mb-4 group"
            onClick={() => openLightbox(0)}
          >
            <Image src={images[0]} alt={`${project.title} hero`} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition duration-500" />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition" />
            <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full">Click to expand</div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {images.slice(1, 4).map((img, idx) => (
              <div
                key={img}
                className="relative rounded-2xl overflow-hidden cursor-pointer aspect-[4/3] group"
                onClick={() => openLightbox(idx + 1)}
              >
                <Image src={img} alt={`${project.title} screen ${idx + 1}`} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition duration-500" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIGHTBOX */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={closeLightbox}
          >
            <motion.img
              key={lightboxIndex}
              src={images[lightboxIndex]}
              alt={`${project.title} view ${lightboxIndex + 1}`}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="max-w-[90vw] max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            />
            <button onClick={closeLightbox} className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition">
              <X size={14} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); showPrev(); }} className="absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition">
              <ChevronLeft size={14} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); showNext(); }} className="absolute right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition">
              <ChevronRight size={14} />
            </button>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
              {lightboxIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TESTIMONIAL */}
      <section className="py-16 px-4 bg-paper dark:bg-ink border-y border-gray-100 dark:border-slate-800">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-4xl text-brand-300 font-serif mb-4">&ldquo;</p>
          <blockquote className="font-display font-bold text-xl md:text-2xl text-gray-900 dark:text-white leading-relaxed mb-8">
            {project.testimonial?.quote}
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-brand-500 text-sm">
              {project.testimonial?.avatar}
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{project.testimonial?.author}</p>
              <p className="text-gray-400 dark:text-slate-500 text-xs">{project.testimonial?.role}</p>
              <div className="flex items-center gap-0.5 text-brand-400 mt-0.5">
                {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={14} />)}
              </div>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 mt-5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-emerald-600 text-xs font-medium">Verified EazWorld Client</span>
          </div>
        </div>
      </section>

      {/* TECH STACK */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-2">Technologies Used</p>
            <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Built With</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
{(project.tags || []).map((tag) => {
              const tech = getTechIcon(tag);
              return (
                <div key={tag} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-100 dark:border-slate-800 bg-paper dark:bg-slate-800 text-sm text-gray-700 dark:text-slate-300">
                  {typeof tech === "string" ? <span>{tech}</span> : <tech size={15} />}
                  {tag}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PREV / NEXT NAV */}
      {(prevProject || nextProject) && (
        <section className="py-16 px-4 bg-paper dark:bg-ink border-y border-gray-100 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-2">More Work</p>
              <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Continue Exploring</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {prevProject && (
                <button type="button" onClick={() => router.push(`/portfolio/${prevProject.slug}`)} className="group text-left p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-sm transition">
                  <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">← Previous Project</p>
                  <div className="flex gap-3">
                    <Image src={prevProject.thumbnail} alt={prevProject.title} width={64} height={64} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                    <div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mb-1 ${CATEGORY_COLORS[prevProject.category] || "bg-gray-100 text-gray-600"}`}>{prevProject.category}</span>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-brand-500 transition">{prevProject.title}</p>
                      <p className="text-gray-400 dark:text-slate-500 text-xs">{prevProject.client}</p>
                    </div>
                  </div>
                </button>
              )}
              {nextProject && (
                <button type="button" onClick={() => router.push(`/portfolio/${nextProject.slug}`)} className="group text-left p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-sm transition">
                  <p className="text-xs text-gray-400 dark:text-slate-500 mb-2 text-right">Next Project →</p>
                  <div className="flex gap-3">
                    <Image src={nextProject.thumbnail} alt={nextProject.title} width={64} height={64} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                    <div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mb-1 ${CATEGORY_COLORS[nextProject.category] || "bg-gray-100 text-gray-600"}`}>{nextProject.category}</span>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-brand-500 transition">{nextProject.title}</p>
                      <p className="text-gray-400 dark:text-slate-500 text-xs">{nextProject.client}</p>
                    </div>
                  </div>
                </button>
              )}
            </div>
            <div className="text-center mt-6">
              <button type="button" onClick={() => router.push("/portfolio")} className="text-sm text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition">
                ← View All Portfolio
              </button>
            </div>
          </div>
        </section>
      )}

      {/* BOTTOM CTA */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-2xl mx-auto text-center">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-4">Let&apos;s Work Together</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-4 leading-tight">
            Ready to Build<br />Something Like This?
          </h2>
          <p className="text-gray-400 mb-8">
            Every great project starts with a conversation. Tell us about your vision and we&apos;ll make it real.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <button
              type="button"
              onClick={() => router.push("/contact")}
              className="px-7 py-3.5 rounded-full bg-brand-500 text-gray-900 font-semibold hover:bg-brand-400 transition"
            >
              Start Your Project →
            </button>
            <button
              type="button"
              onClick={() => router.push("/portfolio")}
              className="px-7 py-3.5 rounded-full border border-white/30 text-white font-medium hover:bg-white/10 transition"
            >
              View More Work
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-5 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1"><Check size={10} className="text-emerald-500" /> Free Consultation</span>
            <span className="inline-flex items-center gap-1"><Check size={10} className="text-emerald-500" /> No Long-term Contracts</span>
            <span className="inline-flex items-center gap-1"><Check size={10} className="text-emerald-500" /> Results Guaranteed</span>
          </div>
        </div>
      </section>

    </div>
  );
}
