"use client";

import { useTheme } from "@/context/ThemeContext";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ className = "" }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative inline-flex items-center justify-center w-9 h-9 rounded-full border transition-colors
        ${isDark
          ? "bg-slate-700 border-slate-600 text-brand-400 hover:bg-slate-600"
          : "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200"
        } ${className}`}
    >
      {isDark ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}
