import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    unstubAllGlobals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Glob-scoped floors only (no global thresholds): each value is the
      // measured `vitest run --coverage` actual minus 2 points, floored.
      // Measured 2026-08-31 — apiFetch 100/97.22/85.71/96.29,
      // cartReducer 95.65/96/100/75, useCart 100/100/100/100, format 100/100/100/100.
      thresholds: {
        "src/api/apiFetch.ts": {
          lines: 98,
          statements: 95,
          functions: 83,
          branches: 94,
        },
        "src/providers/cartReducer.ts": {
          lines: 93,
          statements: 94,
          functions: 98,
          branches: 73,
        },
        "src/hooks/useCart.tsx": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 98,
        },
        "src/lib/format.ts": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 98,
        },
      },
    },
  },
})
