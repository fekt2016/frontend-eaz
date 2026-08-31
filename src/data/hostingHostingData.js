import { Globe, Lock, HardDrive, Cog, MessageSquare, Zap, RefreshCw, Wrench } from "lucide-react";

// Static storefront copy only.
//
// SHARED_PLANS and WORDPRESS_PLANS used to live here too — a second copy of the
// catalogue that config/hostingPlans.js already owned. It drifted: T66/T67
// repriced the backend on 2026-08-26 and this file was not updated, so the page
// advertised GH₵9/mo where checkout charged GH₵62/mo, about a sevenfold gap on
// every shared tier. Plans now come from GET /hosting/plans via
// hooks/queries/useHosting + lib/hostingPlans — the same source the server
// prices orders from. Do not reintroduce a local price list here.


export const HOSTING_FEATURES = [
  { icon: Globe, title: "Free Domain (1yr)", description: "Get a free domain name for the first year with any annual plan." },
  { icon: Lock, title: "Free SSL Certificate", description: "Let's Encrypt SSL auto-installed on all websites at no extra cost." },
  { icon: HardDrive, title: "Daily Backups", description: "Automatic daily backups stored for 30 days — restore in one click." },
  { icon: Cog, title: "cPanel Control Panel", description: "Industry-standard cPanel for easy website and email management." },
  { icon: MessageSquare, title: "24/7 Expert Support", description: "Real humans available around the clock via live chat and email." },
  { icon: Zap, title: "99.9% Uptime Guarantee", description: "SLA-backed uptime guarantee — we credit you if we fall short." },
  { icon: RefreshCw, title: "Free Website Migration", description: "We migrate your existing website to EazWorld free of charge." },
  { icon: Wrench, title: "One-click WordPress", description: "Install WordPress, Joomla, Drupal and 50+ apps in one click." },
];
