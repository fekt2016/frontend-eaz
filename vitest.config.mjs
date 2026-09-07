import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  // Use the automatic JSX runtime so source files that don't import React
  // (Next.js style) transform correctly under Vitest.
  esbuild: { jsx: "automatic" },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.js"],
    include: ["src/**/*.{test,spec}.{js,jsx}"],
    // Vitest defaults to one thread per core. All of them running jsdom at once
    // starves the very timers these tests wait on, and the failures that
    // produces do not look like starvation — they look like product bugs:
    //   · a `waitFor` on a modal closing expires at its 1s default, reading as
    //     "the modal never closed"
    //   · ChatWidget's 4s poll fires INSIDE a test that ran long, refetches a
    //     session mock that still shows no rating, and the prompt reappears —
    //     reading as "the widget asked for a rating twice"
    // Neither is true; both are the machine being oversubscribed. Capped for the
    // same reason and with the same measured result as the backend's
    // jest.config.js, where 4 workers were both greener and faster than 7.
    poolOptions: { threads: { maxThreads: 4, minThreads: 1 } },
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
