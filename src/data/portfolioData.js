export const CATEGORIES = [
  "All",
  "Web Design",
  "Mobile Apps",
  "Brand Identity",
  "E-commerce",
  "SEO Projects",
  "Domain & Hosting",
];

const makeImages = (slug, count) =>
  Array.from({ length: count }, (_, i) => `https://picsum.photos/seed/${slug}-${i + 1}/900/600`);

export const PROJECTS = [
  {
    id: 1,
    slug: "freshmart-ecommerce",
    title: "FreshMart Online Store",
    client: "FreshMart Ghana",
    category: "E-commerce",
    tags: ["WooCommerce", "WordPress", "Paystack", "SEO"],
    shortDesc:
      "Full e-commerce platform for Ghana's leading fresh produce delivery service with mobile-first checkout.",
    thumbnail: "https://picsum.photos/seed/freshmart-ecommerce/800/600",
    heroImage: "https://picsum.photos/seed/freshmart-ecommerce-hero/1200/700",
    images: makeImages("freshmart-ecommerce", 3),
    year: "2024",
    duration: "8 weeks",
    featured: true,
    liveUrl: "#",
    testimonial: {
      quote:
        "Our online sales tripled within 2 months of launch. EazWorld built exactly what our customers needed.",
      author: "Ama Kofi",
      role: "CEO, FreshMart Ghana",
      avatar: "AK",
    },
    results: [
      { metric: "3x", value: "3x", label: "Sales increase" },
      { metric: "98%", value: "98%", label: "Mobile satisfaction" },
      { metric: "6wk", value: "6 wks", label: "Launch timeline" },
    ],
    caseStudy: {
      overview:
        "FreshMart needed a modern e-commerce platform to replace their fragmented ordering process across WhatsApp, phone calls, and spreadsheets. The goal was to give customers a seamless grocery shopping experience optimised for mobile.",
      challenge:
        "Customers were ordering via WhatsApp and phone, leading to missed orders, manual tracking, and poor visibility into inventory. Checkout friction and lack of trust signals made it hard to scale beyond a small, loyal base.",
      solution:
        "We designed and built a WooCommerce store with Paystack integration, real-time inventory, and SMS order confirmations. The UX was focused on one-handed mobile use, fast product discovery, and a frictionless checkout flow for Ghanaian payment methods.",
      process: [
        "Discovery & Research",
        "UX Design & Wireframes",
        "Development & Integration",
        "Launch & Training",
      ],
      outcome:
        "Launched in just 6 weeks, the new FreshMart store increased online revenue by 3x and reduced order errors dramatically. Customers now complete repeat grocery orders in under two minutes with confidence.",
    },
  },
  {
    id: 2,
    slug: "techhub-accra-website",
    title: "TechHub Accra Platform",
    client: "TechHub Accra",
    category: "Web Design",
    tags: ["React", "Node.js", "MongoDB", "Framer Motion"],
    shortDesc:
      "Modern community platform for Accra's largest tech community with events, resources and member portal.",
    thumbnail: "https://picsum.photos/seed/techhub-accra-website/800/600",
    heroImage: "https://picsum.photos/seed/techhub-accra-website-hero/1200/700",
    images: makeImages("techhub-accra-website", 3),
    year: "2024",
    duration: "10 weeks",
    featured: true,
    liveUrl: "#",
    testimonial: {
      quote:
        "The platform completely transformed how our community connects. Membership grew 40% in the first month.",
      author: "Emmanuel Boateng",
      role: "Founder, TechHub Accra",
      avatar: "EB",
    },
    results: [
      { metric: "40%", value: "40%", label: "Member growth" },
      { metric: "2k+", value: "2,000+", label: "Active users" },
      { metric: "4.9", value: "4.9★", label: "User rating" },
    ],
    caseStudy: {
      overview:
        "TechHub Accra needed a digital home for events, resources, and member profiles that matched the energy of its in-person community.",
      challenge:
        "Information was scattered across WhatsApp groups, Google Docs, and Eventbrite pages. New members struggled to understand the value of the community at a glance.",
      solution:
        "We built a React-powered platform with event listings, recordings, curated resources, and a private member portal. Framer Motion micro-interactions made the experience feel alive without being distracting.",
      process: [
        "Stakeholder Workshops",
        "Information Architecture",
        "Component-driven UI Design",
        "Full-stack Implementation",
      ],
      outcome:
        "Within the first month of launch, membership grew by 40% and over 2,000 users actively used the platform to discover events, watch replays, and connect.",
    },
  },
  {
    id: 3,
    slug: "inkoom-law-brand",
    title: "Inkoom Law Brand Identity",
    client: "Inkoom Law",
    category: "Brand Identity",
    tags: ["Logo Design", "Brand Guidelines", "Print", "Digital Assets"],
    shortDesc:
      "Complete brand identity system for a leading Accra law firm — from logo to full brand guidelines.",
    thumbnail: "https://picsum.photos/seed/inkoom-law-brand/800/600",
    heroImage: "https://picsum.photos/seed/inkoom-law-brand-hero/1200/700",
    images: makeImages("inkoom-law-brand", 3),
    year: "2023",
    duration: "4 weeks",
    featured: false,
    liveUrl: "#",
    testimonial: {
      quote:
        "Our new brand positions us exactly where we want to be — premium, trustworthy, and distinctly Ghanaian.",
      author: "Serwaa Inkoom",
      role: "Director, Inkoom Law",
      avatar: "SI",
    },
    results: [
      { metric: "60%", value: "60%", label: "Enquiry increase" },
      { metric: "100%", value: "100%", label: "Client approval" },
      { metric: "4wk", value: "4 wks", label: "Turnaround" },
    ],
    caseStudy: {
      overview:
        "Inkoom Law needed a cohesive brand system that reflected its reputation as a modern, premium law firm in Accra.",
      challenge:
        "The firm had an outdated logo and inconsistent visuals across print and digital touchpoints, weakening client trust and recognition.",
      solution:
        "We crafted a new logo, typography system, colour palette, and full brand guidelines. Applications included stationery, presentation templates, and social media kits.",
      process: [
        "Brand Discovery",
        "Visual Direction & Moodboards",
        "Logo & Collateral Design",
        "Guidelines & Handover",
      ],
      outcome:
        "Within weeks of the rebrand, enquiries increased by 60% and clients consistently praised the firm's new professional appearance.",
    },
  },
  {
    id: 4,
    slug: "darkomart-mobile-app",
    title: "DarkoMart Shopping App",
    client: "DarkoMart Ghana",
    category: "Mobile Apps",
    tags: ["React Native", "Firebase", "Paystack", "Push Notifications"],
    shortDesc:
      "Cross-platform mobile shopping app for DarkoMart with real-time inventory and Mobile Money checkout.",
    thumbnail: "https://picsum.photos/seed/darkomart-mobile-app/800/600",
    heroImage: "https://picsum.photos/seed/darkomart-mobile-app-hero/1200/700",
    images: makeImages("darkomart-mobile-app", 3),
    year: "2024",
    duration: "12 weeks",
    featured: false,
    liveUrl: "#",
    testimonial: {
      quote:
        "The app handles our Black Friday traffic perfectly. Zero downtime, smooth checkout, happy customers.",
      author: "Kofi Darko",
      role: "CEO, DarkoMart Ghana",
      avatar: "KD",
    },
    results: [
      { metric: "10k+", value: "10k+", label: "App downloads" },
      { metric: "4.8", value: "4.8★", label: "App store rating" },
      { metric: "35%", value: "35%", label: "Cart conversion" },
    ],
    caseStudy: {
      overview:
        "DarkoMart wanted a mobile app that could handle large promotional spikes without compromising performance or checkout reliability.",
      challenge:
        "Their web store alone could not deliver the convenience and engagement needed for mobile-first shoppers, especially during peak campaigns.",
      solution:
        "We built a React Native app backed by Firebase for real-time inventory syncing, push notifications, and a Paystack-powered Mobile Money checkout.",
      process: [
        "User Journey Mapping",
        "Mobile-first UI Design",
        "React Native Development",
        "Performance Optimisation",
      ],
      outcome:
        "The app crossed 10,000 downloads with a 4.8★ rating and successfully handled Black Friday without downtime or failed transactions.",
    },
  },
  {
    id: 5,
    slug: "mensah-consulting-seo",
    title: "Mensah Consulting SEO",
    client: "Mensah Consulting",
    category: "SEO Projects",
    tags: ["Technical SEO", "Content Strategy", "Local SEO", "Google Analytics"],
    shortDesc:
      "Full SEO overhaul that took Mensah Consulting from page 4 to position 1 for 12 target keywords.",
    thumbnail: "https://picsum.photos/seed/mensah-consulting-seo/800/600",
    heroImage: "https://picsum.photos/seed/mensah-consulting-seo-hero/1200/700",
    images: makeImages("mensah-consulting-seo", 3),
    year: "2024",
    duration: "Ongoing",
    featured: false,
    liveUrl: "#",
    testimonial: {
      quote:
        "We went from invisible on Google to ranking #1 for our main keywords in just 4 months.",
      author: "Abena Mensah",
      role: "Founder, Mensah Consulting",
      avatar: "AM",
    },
    results: [
      { metric: "#1", value: "#1", label: "Google ranking" },
      { metric: "3x", value: "3x", label: "Organic traffic" },
      { metric: "4mo", value: "4 months", label: "To page one" },
    ],
    caseStudy: {
      overview:
        "Mensah Consulting needed to be discoverable by high-intent searchers looking for consulting support in Ghana and beyond.",
      challenge:
        "Their site had thin content, technical SEO issues, and no clear keyword strategy, leaving them buried on page 4 for critical terms.",
      solution:
        "We performed a technical audit, restructured the information architecture, and launched a content strategy focused on high-intent topics and local SEO.",
      process: [
        "SEO Audit & Benchmarking",
        "Keyword & Content Strategy",
        "On-page & Technical Fixes",
        "Measurement & Iteration",
      ],
      outcome:
        "Within four months, Mensah Consulting ranked #1 for 12 target keywords and tripled organic traffic while reducing reliance on paid ads.",
    },
  },
  {
    id: 6,
    slug: "afritech-domain-hosting",
    title: "AfriTech Domain & Hosting",
    client: "AfriTech Solutions",
    category: "Domain & Hosting",
    tags: ["Domain Registration", "VPS Hosting", "cPanel", "SSL", "Email Setup"],
    shortDesc:
      "Complete domain registration, VPS hosting setup, and business email configuration for 12-person tech firm.",
    thumbnail: "https://picsum.photos/seed/afritech-domain-hosting/800/600",
    heroImage: "https://picsum.photos/seed/afritech-domain-hosting-hero/1200/700",
    images: makeImages("afritech-domain-hosting", 3),
    year: "2023",
    duration: "2 weeks",
    featured: false,
    liveUrl: "#",
    testimonial: {
      quote:
        "The migration was completely seamless. Our site loads twice as fast and the email setup is flawless.",
      author: "Kwame Asante",
      role: "CTO, AfriTech Solutions",
      avatar: "KA",
    },
    results: [
      { metric: "2x", value: "2x", label: "Load speed" },
      { metric: "99.9%", value: "99.9%", label: "Uptime" },
      { metric: "12", value: "12", label: "Email accounts" },
    ],
    caseStudy: {
      overview:
        "AfriTech Solutions wanted a reliable hosting foundation for their client projects and internal tools.",
      challenge:
        "They were spread across multiple low-quality shared hosts with inconsistent performance and frequent email delivery issues.",
      solution:
        "We consolidated domains, provisioned a managed VPS, configured cPanel, SSL, and business email accounts for the entire team.",
      process: [
        "Infrastructure Assessment",
        "Migration Planning",
        "VPS Setup & Hardening",
        "Cutover & Monitoring",
      ],
      outcome:
        "AfriTech now enjoys 99.9% uptime, significantly faster load times, and reliable email for all 12 team members.",
    },
  },
  {
    id: 7,
    slug: "kente-fashion-ecommerce",
    title: "Kente Fashion Store",
    client: "Kente Collections",
    category: "E-commerce",
    tags: ["Shopify", "Product Photography", "Mobile Money", "International Shipping"],
    shortDesc:
      "Shopify store for a Ghanaian fashion brand selling authentic kente products globally.",
    thumbnail: "https://picsum.photos/seed/kente-fashion-ecommerce/800/600",
    heroImage: "https://picsum.photos/seed/kente-fashion-ecommerce-hero/1200/700",
    images: makeImages("kente-fashion-ecommerce", 3),
    year: "2024",
    duration: "6 weeks",
    featured: false,
    liveUrl: "#",
    testimonial: {
      quote:
        "We now ship kente to 15 countries. EazWorld gave our brand the global stage it deserved.",
      author: "Efua Mensah",
      role: "Creative Director, Kente Collections",
      avatar: "EM",
    },
    results: [
      { metric: "15", value: "15", label: "Countries reached" },
      { metric: "250%", value: "250%", label: "Revenue growth" },
      { metric: "4.7", value: "4.7★", label: "Customer rating" },
    ],
    caseStudy: {
      overview:
        "Kente Collections wanted an e-commerce experience that showcased the beauty and story behind each piece.",
      challenge:
        "Their previous site could not support international payments or properly display their product photography on mobile.",
      solution:
        "We designed and built a Shopify store with high-impact visuals, optimised product detail pages, and Mobile Money-friendly checkout for Ghanaian customers.",
      process: [
        "Brand & Visual Direction",
        "Product Photography Guidelines",
        "Shopify Theme Customisation",
        "Optimisation & Launch",
      ],
      outcome:
        "Within months, Kente Collections was shipping to 15 countries and saw a 250% increase in online revenue.",
    },
  },
  {
    id: 8,
    slug: "accra-eats-mobile-app",
    title: "Accra Eats Food App",
    client: "Accra Eats Ltd",
    category: "Mobile Apps",
    tags: ["Flutter", "Google Maps API", "Real-time Orders", "MTN MoMo"],
    shortDesc:
      "Food delivery app connecting Accra restaurants with customers — real-time tracking, MTN MoMo payments.",
    thumbnail: "https://picsum.photos/seed/accra-eats-mobile-app/800/600",
    heroImage: "https://picsum.photos/seed/accra-eats-mobile-app-hero/1200/700",
    images: makeImages("accra-eats-mobile-app", 3),
    year: "2023",
    duration: "16 weeks",
    featured: false,
    liveUrl: "#",
    testimonial: {
      quote:
        "From idea to launch in 4 months. Our riders and customers both love how smooth the app works.",
      author: "Nana Yaw",
      role: "Founder, Accra Eats",
      avatar: "NY",
    },
    results: [
      { metric: "50+", value: "50+", label: "Restaurants" },
      { metric: "500+", value: "500+", label: "Daily orders" },
      { metric: "4.6", value: "4.6★", label: "Play Store" },
    ],
    caseStudy: {
      overview:
        "Accra Eats wanted to build a food delivery experience optimised for the unique realities of Accra's roads, traffic, and payment preferences.",
      challenge:
        "Global food apps did not fully support local payment methods or the operational needs of smaller restaurants.",
      solution:
        "We designed and built a Flutter app with Google Maps integration, real-time order tracking, and MTN MoMo payments deeply integrated into the flow.",
      process: [
        "Product Definition",
        "Service Blueprint & UX Flows",
        "Flutter Development",
        "Pilot Launch & Iteration",
      ],
      outcome:
        "Accra Eats now partners with over 50 restaurants, processes 500+ daily orders, and maintains a 4.6★ Play Store rating.",
    },
  },
  {
    id: 9,
    slug: "ghana-realty-brand",
    title: "Ghana Realty Brand System",
    client: "Ghana Realty Group",
    category: "Brand Identity",
    tags: ["Brand Strategy", "Logo", "Website Design", "Marketing Materials"],
    shortDesc:
      "Premium brand identity and website for one of Accra's fastest growing real estate agencies.",
    thumbnail: "https://picsum.photos/seed/ghana-realty-brand/800/600",
    heroImage: "https://picsum.photos/seed/ghana-realty-brand-hero/1200/700",
    images: makeImages("ghana-realty-brand", 3),
    year: "2024",
    duration: "5 weeks",
    featured: false,
    liveUrl: "#",
    testimonial: {
      quote:
        "Our brand now matches the quality of properties we sell. Clients consistently comment on how professional we look.",
      author: "Nana Ama",
      role: "MD, Ghana Realty Group",
      avatar: "NA",
    },
    results: [
      { metric: "80%", value: "80%", label: "Brand recall up" },
      { metric: "45%", value: "45%", label: "Lead quality up" },
      { metric: "5wk", value: "5 wks", label: "Full delivery" },
    ],
    caseStudy: {
      overview:
        "Ghana Realty Group was scaling quickly and needed a brand system that could flex across property marketing, signage, and digital.",
      challenge:
        "Their existing visuals were generic and inconsistent, making it difficult to stand out in a crowded real estate market.",
      solution:
        "We delivered a full brand strategy, logo system, visual language, and responsive website that showcased premium listings with confidence.",
      process: [
        "Brand Strategy & Positioning",
        "Visual Identity Design",
        "Website & Collateral",
        "Launch Support",
      ],
      outcome:
        "Within one quarter, brand recall increased by 80% and higher-quality leads were coming through the new website and campaigns.",
    },
  },
  {
    id: 10,
    slug: "eductrust-seo",
    title: "EduTrust Academy SEO",
    client: "EduTrust Academy",
    category: "SEO Projects",
    tags: ["SEO", "Content Marketing", "Google Ads", "Conversion Optimisation"],
    shortDesc:
      "SEO and content strategy for an online education platform — 400% increase in organic enrolments.",
    thumbnail: "https://picsum.photos/seed/eductrust-seo/800/600",
    heroImage: "https://picsum.photos/seed/eductrust-seo-hero/1200/700",
    images: makeImages("eductrust-seo", 3),
    year: "2023",
    duration: "Ongoing",
    featured: false,
    liveUrl: "#",
    testimonial: {
      quote:
        "Our organic enrolments went up 400%. SEO with EazWorld is the best investment we have made.",
      author: "Dr. Kwesi Asante",
      role: "Director, EduTrust Academy",
      avatar: "DA",
    },
    results: [
      { metric: "400%", value: "400%", label: "Enrolment growth" },
      { metric: "1st", value: "Page 1", label: "8 keywords" },
      { metric: "60%", value: "60%", label: "Cost per lead down" },
    ],
    caseStudy: {
      overview:
        "EduTrust Academy wanted to reduce reliance on paid ads and grow enrolments through organic search.",
      challenge:
        "Their blog content lacked a clear strategy, and the site structure made it difficult for search engines to understand key programmes.",
      solution:
        "We defined a keyword map, created high-intent content, optimised core landing pages, and tuned paid campaigns to complement organic traffic.",
      process: [
        "Discovery & Analytics Audit",
        "Keyword & Topic Research",
        "Content Production",
        "Continuous Optimisation",
      ],
      outcome:
        "Organic enrolments grew by 400% while the cost per lead dropped by 60%, giving EduTrust a healthier, more sustainable growth engine.",
    },
  },
  {
    id: 11,
    slug: "starlinks-web-design",
    title: "StarLinks Corporate Site",
    client: "StarLinks Telecom",
    category: "Web Design",
    tags: ["Next.js", "Headless CMS", "Animations", "Performance"],
    shortDesc:
      "High-performance corporate website for a Ghanaian telecom company with 98 Lighthouse score.",
    thumbnail: "https://picsum.photos/seed/starlinks-web-design/800/600",
    heroImage: "https://picsum.photos/seed/starlinks-web-design-hero/1200/700",
    images: makeImages("starlinks-web-design", 3),
    year: "2024",
    duration: "8 weeks",
    featured: false,
    liveUrl: "#",
    testimonial: {
      quote:
        "The fastest website in our industry. Our sales team uses it as a selling tool in every pitch.",
      author: "Eric Tetteh",
      role: "CMO, StarLinks Telecom",
      avatar: "ET",
    },
    results: [
      { metric: "98", value: "98/100", label: "Lighthouse score" },
      { metric: "0.8s", value: "0.8s", label: "Load time" },
      { metric: "55%", value: "55%", label: "Bounce rate down" },
    ],
    caseStudy: {
      overview:
        "StarLinks Telecom wanted a corporate site that communicated reliability and innovation while performing exceptionally well on any device.",
      challenge:
        "Their previous site was slow, difficult to update, and failed to communicate the breadth of their services.",
      solution:
        "We built a Next.js site powered by a headless CMS, with carefully tuned performance, accessibility, and subtle animations.",
      process: [
        "Stakeholder & Customer Interviews",
        "UX & UI Design",
        "Headless CMS Integration",
        "Performance Tuning",
      ],
      outcome:
        "The new site achieved a 98/100 Lighthouse score, sub-second load times, and significantly improved engagement metrics.",
    },
  },
  {
    id: 12,
    slug: "multihost-domain-setup",
    title: "MultiHost Domain Portfolio",
    client: "MultiHost Africa",
    category: "Domain & Hosting",
    tags: ["Bulk Domains", "Cloud Hosting", "DNS Management", "Security Audit"],
    shortDesc:
      "Managed domain portfolio and cloud hosting migration for an African hosting reseller — 47 domains.",
    thumbnail: "https://picsum.photos/seed/multihost-domain-setup/800/600",
    heroImage: "https://picsum.photos/seed/multihost-domain-setup-hero/1200/700",
    images: makeImages("multihost-domain-setup", 3),
    year: "2023",
    duration: "3 weeks",
    featured: false,
    liveUrl: "#",
    testimonial: {
      quote:
        "Managing 47 domains used to be a nightmare. EazWorld organised everything and our uptime is now perfect.",
      author: "Samuel Ofori",
      role: "CEO, MultiHost Africa",
      avatar: "SO",
    },
    results: [
      { metric: "47", value: "47", label: "Domains managed" },
      { metric: "100%", value: "100%", label: "Migration success" },
      { metric: "40%", value: "40%", label: "Cost reduction" },
    ],
    caseStudy: {
      overview:
        "MultiHost Africa needed structure around a rapidly growing portfolio of client domains and hosting accounts.",
      challenge:
        "They were managing 47 domains across multiple registrars and hosts, making renewals, DNS changes, and security audits difficult.",
      solution:
        "We normalised DNS records, migrated critical workloads to a modern cloud host, and implemented monitoring and documentation for every domain.",
      process: [
        "Discovery & Inventory",
        "Migration Planning",
        "Execution & Validation",
        "Monitoring & Handover",
      ],
      outcome:
        "All 47 domains were successfully migrated with 100% uptime, and ongoing management time and costs were reduced by over 40%.",
    },
  },
];

export const CASE_STUDIES = PROJECTS.reduce((acc, project) => {
  acc[project.slug] = project;
  return acc;
}, {});

