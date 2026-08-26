/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FBF6EC",
        foreground: "#161209",
        // Warm kente-gold accent — single source of truth for the brand colour.
        // Rebranching = editing these values only.
        brand: {
          50:  "#FFF9E8",
          100: "#FCEFC2",
          200: "#FBDF87",
          300: "#F9CC3F",
          400: "#F7B923",
          500: "#F2A311",
          600: "#DD8A00",
          700: "#B06E04",
          800: "#8F5606",
          900: "#714509",
          950: "#462902",
          DEFAULT: "#F2A311",
          // ── Accent TEXT on light surfaces ──────────────────────────────────
          // brand-500/600 are FILL colours. As text on paper/white they measure
          // 1.95:1 and 2.53:1 — below the 4.5:1 WCAG AA floor, and below even
          // the 3:1 large-text floor. `brand-ink` is the same gold darkened to
          // the first ramp step that clears AA (identical to brand-800):
          //   5.57:1 on paper (#FBF6EC) · 6.00:1 on white
          // Use text-brand-ink for eyebrows, active states and accent copy in
          // light mode; keep dark:text-brand-400 (10.60:1 on ink) for dark.
          ink: "#8F5606",
        },
        // Warm surfaces — "paper" (light) and "ink" (dark) carry the Ghanaian
        // identity that the cool gray/slate ramps used before. Cards stay on
        // white / slate-900 so surfaces keep their hierarchy.
        paper: "#FBF6EC",
        ink: "#161209",
        // Ghana flag tricolour — used ONLY in the signature "star rule".
        star: {
          red: "#C0392B",
          gold: "#F2A311",
          green: "#0F7B4F",
        },

        // ── Semantic status colours ──────────────────────────────────────────
        // Every value below was chosen by measuring contrast, not by eye:
        //   DEFAULT        text on LIGHT  — >=4.5:1 on BOTH paper and white
        //   *-dark         text on DARK   — >=4.5:1 on BOTH ink and slate-900
        //   *-surface      tinted fill for light mode
        //   *-surface-dark tinted fill for dark mode
        // `warning` is deliberately orange (hue 17deg), not amber (26deg): amber
        // sits only 9deg from the brand gold and would read as brand, not alarm.
        success: {
          DEFAULT: "#047857",          // 5.09 paper · 5.48 white
          dark: "#34D399",             // 9.71 ink   · 9.29 slate-900
          surface: "#ECFDF5",
          "surface-dark": "#052E24",
        },
        warning: {
          DEFAULT: "#C2410C",          // 4.81 paper · 5.18 white
          dark: "#FB923C",             // 8.25 ink   · 7.89 slate-900
          surface: "#FFF7ED",
          "surface-dark": "#3A1A08",
        },
        error: {
          DEFAULT: "#B91C1C",          // 6.01 paper · 6.47 white
          dark: "#F87171",             // 6.75 ink   · 6.45 slate-900
          surface: "#FEF2F2",
          "surface-dark": "#3B1212",
        },
        info: {
          DEFAULT: "#1D4ED8",          // 6.22 paper · 6.70 white
          dark: "#60A5FA",             // 7.34 ink   · 7.02 slate-900
          surface: "#EFF6FF",
          "surface-dark": "#111E3A",
        },
      },
      fontFamily: {
        // Space Grotesk: confident, technical, modern — the display voice.
        display: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
        // DM Sans stays as the body workhorse.
        sans: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
        // Space Mono: the data/technical voice — eyebrows, stats, SKUs.
        mono: ["var(--font-space-mono)", "Space Mono", "monospace"],
      },

      // ── Named type scale ───────────────────────────────────────────────────
      // Additive: the default Tailwind sizes still work. These name the tiers
      // the codebase was missing, and replace 173 arbitrary `text-[Npx]` values.
      // The gap this closes: `text-xs`+`text-sm` were 78% of all type while
      // `text-base` was 0.9% — small text everywhere, then a jump to display.
      fontSize: {
        // 11px mono eyebrow — the section-label voice. Replaces text-[11px].
        eyebrow: ["0.6875rem", { lineHeight: "1", letterSpacing: "0.2em" }],
        // 12px — metadata, timestamps, table micro-copy. NOT for prose.
        caption: ["0.75rem", { lineHeight: "1.45" }],
        // 14px — dense UI copy: dashboard, POS, table cells, form help.
        "body-sm": ["0.875rem", { lineHeight: "1.6" }],
        // 16px — the missing tier. Real prose on public pages lives here.
        body: ["1rem", { lineHeight: "1.7" }],
        // 18px — lead paragraph under a heading.
        lead: ["1.125rem", { lineHeight: "1.65" }],
      },

      // ── Motion ─────────────────────────────────────────────────────────────
      // Small, purposeful set used by the ui/ primitives. Every one of these is
      // disabled wholesale by the prefers-reduced-motion block in globals.css.
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        // Dropdowns/popovers: a short rise, not a bounce.
        "pop-in": {
          from: { opacity: "0", transform: "translateY(-4px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        // Dialogs: settle downward so the eye tracks to the content.
        "dialog-in": {
          from: { opacity: "0", transform: "translateY(8px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        // Skeleton shimmer — calmer than animate-pulse's full opacity swing.
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 150ms ease-out",
        "pop-in": "pop-in 160ms cubic-bezier(0.16, 1, 0.3, 1)",
        "dialog-in": "dialog-in 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};
module.exports = config;
