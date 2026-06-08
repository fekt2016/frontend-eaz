export const CATEGORIES = [
  "All",
  "E-commerce",
  "Entertainment",
  "Logistics",
  "Real Estate",
];

export const PROJECTS = [
  {
    id: 1,
    slug: "saiisai-platform",
    title: "SaiSai E-commerce Platform",
    client: "SaiSai",
    category: "E-commerce",
    tags: ["Next.js", "React", "Paystack", "MongoDB", "Tailwind CSS"],
    shortDesc:
      "Full-stack e-commerce platform built and managed by EazWorld — live at saiisai.com.",
    thumbnail: "/images/saiisai-placeholder.svg",
    heroImage: "/images/saiisai-placeholder.svg",
    images: [
      "/images/saiisai-placeholder.svg",
      "/images/saiisai-placeholder.svg",
      "/images/saiisai-placeholder.svg",
    ],
    year: "2024",
    duration: "Ongoing",
    featured: true,
    liveUrl: "https://saiisai.com",
    testimonial: {
      quote: "EazWorld built our entire platform from scratch. The result speaks for itself.",
      author: "SaiSai Team",
      role: "saiisai.com",
      avatar: "SS",
    },
    results: [
      { metric: "Live", value: "Live", label: "Production site" },
      { metric: "Full", value: "Full-stack", label: "Built by EazWorld" },
      { metric: "Fast", value: "Fast", label: "Optimised UX" },
    ],
    caseStudy: {
      overview: "SaiSai is a full-stack e-commerce platform designed and developed entirely by EazWorld.",
      challenge: "Building a performant, scalable shopping experience for the Ghanaian market with local payment integration.",
      solution: "We designed and built the entire platform using Next.js, MongoDB, and Paystack, with a mobile-first UX tailored for local customers.",
      process: ["Product Strategy", "UI/UX Design", "Full-stack Development", "Launch & Maintenance"],
      outcome: "SaiSai is live and serving customers at saiisai.com with a seamless buying experience.",
    },
  },
  {
    id: 2,
    slug: "worldstargh-portal",
    title: "WorldStar GH Entertainment Portal",
    client: "WorldStar GH",
    category: "Entertainment",
    tags: ["Next.js", "CMS", "SEO", "Entertainment", "Media", "Performance"],
    shortDesc:
      "High-traffic Ghanaian entertainment website built and maintained by EazWorld — live at worldstargh.com.",
    thumbnail: "https://api.microlink.io/?url=https://worldstargh.com&screenshot=true&meta=false&embed=screenshot.url",
    heroImage: "https://api.microlink.io/?url=https://worldstargh.com&screenshot=true&meta=false&embed=screenshot.url",
    images: [
      "https://api.microlink.io/?url=https://worldstargh.com&screenshot=true&meta=false&embed=screenshot.url",
      "https://api.microlink.io/?url=https://worldstargh.com&screenshot=true&meta=false&embed=screenshot.url",
      "https://api.microlink.io/?url=https://worldstargh.com&screenshot=true&meta=false&embed=screenshot.url",
    ],
    year: "2024",
    duration: "Ongoing",
    featured: true,
    liveUrl: "https://worldstargh.com",
    testimonial: {
      quote: "Our platform handles high traffic with zero issues. EazWorld delivered a professional media site.",
      author: "WorldStar GH Team",
      role: "worldstargh.com",
      avatar: "WG",
    },
    results: [
      { metric: "Live", value: "Live", label: "Production site" },
      { metric: "SEO", value: "Optimised", label: "Content-ready" },
      { metric: "Fast", value: "Fast", label: "Page load speed" },
    ],
    caseStudy: {
      overview: "WorldStar GH is a Ghanaian media and entertainment portal built end-to-end by EazWorld.",
      challenge: "Creating a media-heavy site that loads fast, ranks on Google, and handles a large volume of content updates.",
      solution: "We designed a content-led architecture with CMS integration, strong SEO foundations, and performance-optimised media delivery.",
      process: ["Content Architecture", "UI Design", "CMS Integration", "SEO & Launch"],
      outcome: "WorldStar GH is live at worldstargh.com serving thousands of monthly visitors.",
    },
  },
  {
    id: 3,
    slug: "jmlogistics-website",
    title: "JM Logistics GH",
    client: "JM Logistics Ghana",
    category: "Logistics",
    tags: ["Next.js", "Tailwind CSS", "Logistics", "Lead Generation", "Corporate"],
    shortDesc:
      "Corporate website for a Ghanaian logistics company — built to generate leads and establish brand credibility.",
    thumbnail: "https://picsum.photos/seed/jmlogistics-thumb/800/600",
    heroImage: "https://picsum.photos/seed/jmlogistics-hero/1200/700",
    images: [
      "https://picsum.photos/seed/jmlogistics-1/900/600",
      "https://picsum.photos/seed/jmlogistics-2/900/600",
      "https://picsum.photos/seed/jmlogistics-3/900/600",
    ],
    year: "2024",
    duration: "Ongoing",
    featured: true,
    liveUrl: "https://jmlogisticsgh.com",
    testimonial: {
      quote: "Our new site positions us as a serious logistics provider. Enquiries increased immediately after launch.",
      author: "JM Logistics Team",
      role: "jmlogisticsgh.com",
      avatar: "JM",
    },
    results: [
      { metric: "Live", value: "Live", label: "Production site" },
      { metric: "Leads", value: "Increased", label: "Lead generation" },
      { metric: "Pro", value: "Professional", label: "Brand image" },
    ],
    caseStudy: {
      overview: "JM Logistics Ghana needed a credible corporate presence to win larger contracts and attract corporate clients.",
      challenge: "Building trust and visibility in a competitive logistics market with no prior web presence.",
      solution: "We designed a clean, conversion-focused corporate site that clearly communicates services, coverage, and reliability.",
      process: ["Brand Positioning", "UI/UX Design", "Development", "Launch & SEO"],
      outcome: "JM Logistics Ghana is live at jmlogisticsgh.com with a professional site driving qualified enquiries.",
    },
  },
  {
    id: 4,
    slug: "giwa-investment-site",
    title: "Giwa Investment Platform",
    client: "Giwa Investment",
    category: "Real Estate",
    tags: ["Next.js", "Real Estate", "Trust Design", "Lead Generation"],
    shortDesc:
      "Professional investment firm website built to establish trust, communicate offerings, and convert leads.",
    thumbnail: "https://picsum.photos/seed/giwa-thumb/800/600",
    heroImage: "https://picsum.photos/seed/giwa-hero/1200/700",
    images: [
      "https://picsum.photos/seed/giwa-1/900/600",
      "https://picsum.photos/seed/giwa-2/900/600",
      "https://picsum.photos/seed/giwa-3/900/600",
    ],
    year: "2025",
    duration: "Ongoing",
    featured: true,
    liveUrl: "https://giwainvestment.com",
    testimonial: {
      quote: "Our website now reflects the level of professionalism our investors expect from us.",
      author: "Giwa Investment Team",
      role: "giwainvestment.com",
      avatar: "GI",
    },
    results: [
      { metric: "Live", value: "Live", label: "Production site" },
      { metric: "Trust", value: "High Trust", label: "Design standard" },
      { metric: "Leads", value: "Qualified", label: "Investor leads" },
    ],
    caseStudy: {
      overview: "Giwa Investment required a website that establishes credibility and trust with high-value investors.",
      challenge: "Finance and investment sites must balance professionalism with clear communication of offerings and risk.",
      solution: "We designed a trust-led layout with clear service breakdowns, strong calls to action, and a premium visual style.",
      process: ["Discovery & Strategy", "Trust-led UI Design", "Development", "Launch & Optimisation"],
      outcome: "Giwa Investment is live at giwainvestment.com with a site that confidently represents their brand.",
    },
  },
];

export const CASE_STUDIES = PROJECTS.reduce((acc, project) => {
  acc[project.slug] = project;
  return acc;
}, {});
