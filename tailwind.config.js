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
        background: "#ffffff",
        foreground: "#111827",
        gold: {
          DEFAULT: "#F5A623",
          light: "#FEF3C7",
          dark: "#C4811A",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Playfair Display", "serif"],
        sans: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
module.exports = config;
