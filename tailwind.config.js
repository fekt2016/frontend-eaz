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
      },
      fontFamily: {
        // Space Grotesk: confident, technical, modern — the display voice.
        display: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
        // DM Sans stays as the body workhorse.
        sans: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
        // Space Mono: the data/technical voice — eyebrows, stats, SKUs.
        mono: ["var(--font-space-mono)", "Space Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
module.exports = config;
