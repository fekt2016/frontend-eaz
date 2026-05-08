import {
  FaGlobe,
  FaServer,
  FaPalette,
  FaSearch,
  FaMobileAlt,
  FaChartLine,
} from "react-icons/fa";

export const serviceDetails = [
  {
    slug: "web-design",
    icon: FaPalette,
    title: "Web Design & Development",
    tagline: "Websites that look great, load fast, and convert visitors into customers.",
    description:
      "We design and build modern, responsive websites tailored to your brand and business goals — from landing pages to full e-commerce platforms.",
    challenge:
      "Most businesses in Ghana have websites that look outdated, load slowly on mobile, or fail to communicate value clearly. In a world where your website is often the first impression, this costs you leads and customers every single day.",
    solution:
      "We build websites that are visually polished, lightning-fast, and optimised for conversion. Every project starts with your audience and goals — not just aesthetics. We use proven design patterns, mobile-first development, and performance best practices so your site works as hard as you do.",
    process: [
      { step: "Discovery", desc: "We learn your brand, goals, and audience before touching a pixel." },
      { step: "Wireframes", desc: "We map out layouts and user flows for approval before design begins." },
      { step: "Design", desc: "High-fidelity mockups in Figma — responsive for all screen sizes." },
      { step: "Development", desc: "Clean, fast code using React/Next.js or your preferred stack." },
      { step: "Launch", desc: "Testing, optimisation, and a smooth go-live with zero downtime." },
    ],
    deliverables: [
      "Custom responsive website (up to 10 pages)",
      "Mobile-first design",
      "Contact form & lead capture",
      "Google Analytics integration",
      "Basic SEO setup (meta tags, sitemap)",
      "30-day post-launch support",
      "Source code & design files",
    ],
    investment: "Starting from GHS 2,500",
    timeline: "2–4 weeks",
    faqs: [
      { q: "Do I need to provide content?", a: "We can work with content you supply, or offer copywriting as an add-on. We'll guide you on what's needed." },
      { q: "Can you redesign an existing site?", a: "Absolutely. We offer full redesigns and can migrate your existing content over." },
      { q: "Will the site work on mobile?", a: "Every site we build is mobile-first — designed for phones before scaling up to desktop." },
      { q: "What platform will my site be on?", a: "We typically build on Next.js for performance, but can work with WordPress or other CMS platforms depending on your needs." },
    ],
    saiisaiExample: "For Saiisai, we designed and built a full marketplace platform — including buyer and seller dashboards, product listings, payment flow, and mobile app.",
  },
  {
    slug: "web-hosting",
    icon: FaServer,
    title: "Web Hosting",
    tagline: "Enterprise-grade hosting from Accra, built for African businesses.",
    description:
      "Fast, secure, and reliable hosting with 99.9% uptime SLA — managed and supported locally.",
    challenge:
      "Unreliable hosting causes slow load times, downtime during traffic spikes, and poor SEO rankings. Many Ghanaian businesses use offshore providers with no local support and servers far from their audience.",
    solution:
      "Our hosting infrastructure is optimised for African traffic — with NVMe SSD storage, LiteSpeed servers, free SSL, and 24/7 local support. Plans from solo blogs to enterprise applications.",
    process: [
      { step: "Choose Plan", desc: "Pick the hosting tier that fits your traffic and storage needs." },
      { step: "Configure", desc: "We set up your domain, SSL, email accounts, and cPanel." },
      { step: "Migrate", desc: "Free migration of your existing site — zero downtime." },
      { step: "Monitor", desc: "24/7 uptime monitoring with instant alerts." },
    ],
    deliverables: [
      "NVMe SSD hosting",
      "Free SSL certificate",
      "cPanel control panel",
      "Free domain migration",
      "Daily/weekly backups",
      "DDoS protection",
      "24/7 support",
    ],
    investment: "From GHS 50/month",
    timeline: "Active within 24 hours",
    faqs: [
      { q: "Can I migrate my existing site?", a: "Yes — free migration is included on all plans. We handle the transfer with zero downtime." },
      { q: "What is the uptime guarantee?", a: "We guarantee 99.9% uptime backed by an SLA." },
      { q: "Do you offer email hosting?", a: "Yes, email accounts are included on all plans." },
      { q: "Can I upgrade my plan later?", a: "Absolutely — plan upgrades are instant and pro-rated." },
    ],
    saiisaiExample: "Saiisai is hosted on our enterprise infrastructure, handling hundreds of concurrent users and daily transactions reliably.",
  },
  {
    slug: "domain-registration",
    icon: FaGlobe,
    title: "Domain Registration",
    tagline: "Secure your brand's home on the internet.",
    description:
      "Register your perfect .com, .gh, or any extension — with DNS management, privacy protection, and auto-renewal.",
    challenge:
      "The right domain name is your brand's most important digital asset. Losing it to a competitor or squatter can be costly and damaging. Many businesses also struggle with DNS configuration and renewals.",
    solution:
      "We handle domain search, registration, DNS setup, and ongoing management so you never have to worry about your domain expiring or being misconfigured.",
    process: [
      { step: "Search", desc: "We find available domains that match your brand." },
      { step: "Register", desc: "Secure registration via Namecheap with privacy protection." },
      { step: "Configure DNS", desc: "Point to your hosting, email, and any third-party services." },
      { step: "Auto-renew", desc: "We monitor and renew before expiry — no gaps." },
    ],
    deliverables: [
      "Domain registration (1 year)",
      "WHOIS privacy protection",
      "DNS management",
      "Auto-renewal setup",
      "Transfer support",
    ],
    investment: "From GHS 80/year",
    timeline: "Active within minutes",
    faqs: [
      { q: "Can I transfer an existing domain?", a: "Yes — we manage transfers from any registrar." },
      { q: "What extensions do you support?", a: ".com, .net, .org, .gh, .africa, .store, .io, and many more." },
      { q: "Is WHOIS privacy free?", a: "Yes, WHOIS privacy protection is included at no extra cost." },
    ],
    saiisaiExample: "We secured and manage multiple domain assets for the Saiisai brand including primary and country-specific extensions.",
  },
  {
    slug: "seo",
    icon: FaSearch,
    title: "SEO & Content Marketing",
    tagline: "Get found by customers who are already searching for what you offer.",
    description:
      "We improve your Google rankings, organic traffic, and content strategy — turning search into a reliable growth channel.",
    challenge:
      "If your business doesn't appear on the first page of Google, you're invisible to thousands of potential customers every month. SEO is the highest-ROI marketing channel for most businesses — but only if done correctly.",
    solution:
      "We combine technical SEO, keyword research, on-page optimisation, and content strategy to grow your organic visibility over time. We focus on rankings that bring buyers — not just traffic.",
    process: [
      { step: "Audit", desc: "Full technical SEO and content audit of your current site." },
      { step: "Research", desc: "Keyword and competitor analysis to find the best opportunities." },
      { step: "On-Page", desc: "Optimise meta tags, headings, content, and internal links." },
      { step: "Content", desc: "Create SEO-optimised blog posts and landing pages." },
      { step: "Track", desc: "Monthly reporting on rankings, traffic, and leads." },
    ],
    deliverables: [
      "Full SEO audit",
      "Keyword research report",
      "On-page optimisation (up to 10 pages)",
      "2 blog posts per month",
      "Google Search Console setup",
      "Monthly ranking report",
    ],
    investment: "From GHS 1,200/month",
    timeline: "Results visible in 60–90 days",
    faqs: [
      { q: "How long before I see results?", a: "SEO is a long-term channel. Most clients see measurable ranking improvements within 60–90 days." },
      { q: "Do you guarantee #1 rankings?", a: "No agency can guarantee specific rankings. We focus on sustainable growth using white-hat techniques." },
      { q: "What's included in the monthly reports?", a: "Keyword rankings, organic traffic, top pages, and recommended next steps." },
    ],
    saiisaiExample: "Our SEO strategy for Saiisai helped the platform rank for key marketplace and product category terms in Ghana within 3 months of launch.",
  },
  {
    slug: "mobile-development",
    icon: FaMobileAlt,
    title: "Mobile Development",
    tagline: "Native and cross-platform apps that users love.",
    description:
      "We build fast, intuitive mobile apps for iOS and Android — from MVP to full-featured product.",
    challenge:
      "Mobile-first is no longer optional. Customers expect an app or a flawless mobile experience, and businesses without one lose ground to competitors who deliver it.",
    solution:
      "We build cross-platform apps using React Native — one codebase for both iOS and Android — without sacrificing performance or UX. From concept to App Store submission, we handle it all.",
    process: [
      { step: "Scoping", desc: "Define features, user flows, and technical architecture." },
      { step: "Design", desc: "Mobile-native UI/UX design optimised for touch." },
      { step: "Development", desc: "React Native development with API integration." },
      { step: "Testing", desc: "Device testing, performance profiling, and QA." },
      { step: "Submission", desc: "App Store and Google Play submission." },
    ],
    deliverables: [
      "Cross-platform mobile app (iOS + Android)",
      "Custom UI/UX design",
      "API integration",
      "Push notifications",
      "App Store & Play Store submission",
      "3 months post-launch support",
    ],
    investment: "Starting from GHS 8,000",
    timeline: "6–12 weeks",
    faqs: [
      { q: "Do you build for both iOS and Android?", a: "Yes — we use React Native to deliver a single codebase for both platforms." },
      { q: "Can you build an MVP first?", a: "Absolutely. We often recommend starting with an MVP to validate before building the full product." },
      { q: "Do you handle App Store submission?", a: "Yes — we manage the submission and approval process for both stores." },
    ],
    saiisaiExample: "The Saiisai mobile app was built alongside the web platform, offering buyers a native shopping experience with push notifications for order updates.",
  },
  {
    slug: "web-marketing",
    icon: FaChartLine,
    title: "Web Marketing",
    tagline: "Data-driven campaigns that generate leads and revenue.",
    description:
      "We run paid advertising, social media, and email campaigns that bring qualified traffic and measurable results.",
    challenge:
      "Most marketing budgets are wasted on campaigns that reach the wrong people or fail to convert. Without a data-driven strategy, you're guessing — and guessing is expensive.",
    solution:
      "We build integrated marketing strategies combining Google Ads, Meta Ads, social media content, and email automation — all tracked and optimised for ROI.",
    process: [
      { step: "Strategy", desc: "Define goals, audience, channels, and KPIs." },
      { step: "Creative", desc: "Ad copy, creatives, and landing pages built to convert." },
      { step: "Launch", desc: "Campaigns go live with precise targeting." },
      { step: "Optimise", desc: "Weekly data review and continuous improvements." },
      { step: "Report", desc: "Monthly performance reports with clear insights." },
    ],
    deliverables: [
      "Paid ads management (Google or Meta)",
      "Ad creative and copy",
      "Landing page design",
      "Audience research and targeting",
      "Weekly optimisation",
      "Monthly performance report",
    ],
    investment: "From GHS 1,500/month + ad spend",
    timeline: "Campaigns live within 1 week",
    faqs: [
      { q: "What ad spend budget do I need?", a: "We recommend a minimum of GHS 1,000/month in ad spend to generate meaningful results." },
      { q: "Which platforms do you advertise on?", a: "Google Ads, Facebook, Instagram, and TikTok depending on your audience." },
      { q: "How do you measure success?", a: "We track leads, conversions, cost per acquisition, and ROAS — not just clicks." },
    ],
    saiisaiExample: "Our paid campaigns for Saiisai's seller acquisition drove over 100 verified seller sign-ups in the first 90 days with a 4x return on ad spend.",
  },
];
