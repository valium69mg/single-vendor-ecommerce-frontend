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
    unstubGlobals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Glob-scoped floors only (no global thresholds): each value is the
      // measured `vitest run --coverage` actual minus 2 points, floored.
      // Measured 2026-08-31 — apiFetch 100/97.22/85.71/96.29,
      // cartReducer 95.65/96/100/75, useCart 100/100/100/100, format 100/100/100/100.
      // Measured 2026-09-01 (auth slice, frontend-auth-unit-tests) — order
      // lines/statements/functions/branches: storage 100/100/100/100,
      // authHandler 100/100/100/100, UserProvider 100/100/100/100,
      // CartProvider 69.23/69.76/68.75/71.73, LoginForm 100/100/100/100,
      // i18n 100/100/100/100, LoginPage 100/100/100/100,
      // useApiErrorHandler 100/100/100/100, useUser 100/100/100/100,
      // ProtectedRoute 100/100/100/100, login.schema 100/100/100/100.
      // No whole-file floor for src/api/api.ts (large mostly-untested module;
      // only loginRequest is characterized here).
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
        "src/lib/storage.ts": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 98,
        },
        "src/lib/authHandler.ts": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 98,
        },
        "src/providers/UserProvider.tsx": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 98,
        },
        "src/providers/CartProvider.tsx": {
          lines: 67,
          statements: 67,
          functions: 66,
          branches: 69,
        },
        "src/components/auth/LoginForm.tsx": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 98,
        },
        "src/components/auth/ProtectedRoute.tsx": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 98,
        },
        "src/components/auth/login.schema.ts": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 98,
        },
        "src/i18n/index.ts": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 98,
        },
        "src/pages/LoginPage.tsx": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 98,
        },
        "src/hooks/useApiErrorHandler.tsx": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 98,
        },
        "src/hooks/useUser.tsx": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 98,
        },
      },
    },
  },
})
