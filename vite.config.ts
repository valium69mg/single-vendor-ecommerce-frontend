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
      // Count the whole source tree, not just files imported by a test, so the
      // reported percentages are representative of real coverage. Vitest 4
      // removed `coverage.all` (the intent of this change); `coverage.include`
      // is what now pulls untested files into the report.
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.integration.test.{ts,tsx}",
        "src/test/**",
        "src/mocks/**",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/**/*.d.ts",
      ],
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
      // Measured 2026-09-01 (frontend-api-unit-tests) — order
      // lines/statements/functions/branches, `all: true` + src/** include in
      // effect: api.ts 98.73/97.72/100/86.84. Whole-file floor added below at
      // measured actual minus 2, floored to an integer.
      // Measured 2026-09-02 (frontend-api-followups, T7) — order
      // lines/statements/functions/branches: api.ts 99.09/98.37/100/90.38.
      // Branch coverage rose (>= 86 with >= 2 pts headroom) and every metric
      // stays above its current floor, so all four api.ts floors are held.
      // Measured 2026-09-03 (frontend-admin-api-integration, T6) — order
      // lines/statements/functions/branches: api.ts 99.13/98.43/100/90.38.
      // Floors raised to measured actual minus 2, floored to an integer.
      // Measured 2026-09-04 (FE4a register API + schema slice) — order
      // lines/statements/functions/branches: api.ts (registerRequest added)
      // 99.18/98.51/100/91.07; register.schema.ts 100/100/100/100. api.ts
      // branches floor raised; register.schema.ts floor added, both at
      // measured actual minus 2, floored to an integer.
      // Measured 2026-09-04 (FE4b register form/page slice) — order
      // lines/statements/functions/branches: RegisterForm.tsx 100/100/100/100,
      // RegisterPage.tsx 100/100/100/100. Floors added, mirroring
      // LoginForm.tsx/LoginPage.tsx.
      // Measured 2026-09-04 (FE5b-1 verify form slice) — order
      // lines/statements/functions/branches: VerifyEmailForm.tsx
      // 100/100/100/75 (the `user` guards are defensive — the component is
      // only ever mounted once a session exists — so the null branch is
      // intentionally unexercised). Floor added at measured actual minus 2,
      // floored to an integer.
      // Measured 2026-09-04 (FE5b-2 register flow wiring slice) — order
      // lines/statements/functions/branches: useRegisterFlow.ts
      // 100/100/100/100. Floor added, mirroring useCart.tsx. RegisterForm.tsx
      // and RegisterPage.tsx re-measured at 100/100/100/100 after the
      // onRegistered/step-machine rewrite; existing floors held unchanged.
      // Measured 2026-09-05 (admin-form-unit-tests, slice 1 - brand) - order
      // lines/statements/functions/branches: CreateBrandForm.tsx
      // 80/74.07/60/81.25, EditBrandForm.tsx 83.87/78.78/66.66/81.25,
      // RestoreBrandDialog.tsx 100/100/100/83.33, create-brand.schema.ts
      // 100/100/100/100, edit-brand.schema.ts 100/100/100/100. Floors added at
      // measured actual minus 2, floored to an integer.
      // Measured 2026-09-05 (admin-form-unit-tests, slice 5 - final
      // reconciliation: categories + materials + products + hooks) - order
      // lines/statements/functions/branches: CreateCategoryForm.tsx
      // 80/74.07/60/78.57, EditCategoryForm.tsx 83.87/78.78/66.66/78.57,
      // RestoreCategoryDialog.tsx 100/100/100/83.33, create-category.schema.ts
      // 100/100/100/100, edit-category.schema.ts 100/100/100/100,
      // CreateMaterialForm.tsx 80/74.07/60/81.25, EditMaterialForm.tsx
      // 83.87/78.78/66.66/81.25, RestoreMaterialDialog.tsx 100/100/100/83.33,
      // create-material.schema.ts 100/100/100/100, edit-material.schema.ts
      // 100/100/100/100, CreateProductForm.tsx 54.81/53.03/32.35/56.05,
      // ProductStatusBadge.tsx 100/100/100/100, create-product.schema.ts
      // 100/100/100/100, useDebounce.tsx 100/100/100/100, use-mobile.tsx
      // 100/100/100/100. Floors added at measured actual minus 2, floored to an
      // integer. No pre-existing floor lowered.
      thresholds: {
        "src/api/api.ts": {
          lines: 97,
          statements: 96,
          functions: 98,
          branches: 89,
        },
        "src/components/auth/register.schema.ts": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 98,
        },
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
        "src/components/auth/RegisterForm.tsx": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 98,
        },
        "src/pages/RegisterPage.tsx": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 98,
        },
        "src/components/auth/VerifyEmailForm.tsx": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 73,
        },
        "src/hooks/useRegisterFlow.ts": {
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
        "src/components/brands/CreateBrandForm.tsx": {
          lines: 78,
          statements: 72,
          functions: 58,
          branches: 79,
        },
        "src/components/brands/EditBrandForm.tsx": {
          lines: 81,
          statements: 76,
          functions: 64,
          branches: 79,
        },
        "src/components/brands/RestoreBrandDialog.tsx": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 81,
        },
        "src/components/auth/create-brand.schema.ts": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 98,
        },
        "src/components/auth/edit-brand.schema.ts": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 98,
        },
        "src/components/categories/CreateCategoryForm.tsx": {
          lines: 78,
          statements: 72,
          functions: 58,
          branches: 76,
        },
        "src/components/categories/EditCategoryForm.tsx": {
          lines: 81,
          statements: 76,
          functions: 64,
          branches: 76,
        },
        "src/components/categories/RestoreCategoryDialog.tsx": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 81,
        },
        "src/components/auth/create-category.schema.ts": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 98,
        },
        "src/components/auth/edit-category.schema.ts": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 98,
        },
        "src/components/materials/CreateMaterialForm.tsx": {
          lines: 78,
          statements: 72,
          functions: 58,
          branches: 79,
        },
        "src/components/materials/EditMaterialForm.tsx": {
          lines: 81,
          statements: 76,
          functions: 64,
          branches: 79,
        },
        "src/components/materials/RestoreMaterialDialog.tsx": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 81,
        },
        "src/components/auth/create-material.schema.ts": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 98,
        },
        "src/components/auth/edit-material.schema.ts": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 98,
        },
        "src/components/products/CreateProductForm.tsx": {
          lines: 52,
          statements: 51,
          functions: 30,
          branches: 54,
        },
        "src/components/products/ProductStatusBadge.tsx": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 98,
        },
        "src/components/auth/create-product.schema.ts": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 98,
        },
        "src/hooks/useDebounce.tsx": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 98,
        },
        "src/hooks/use-mobile.tsx": {
          lines: 98,
          statements: 98,
          functions: 98,
          branches: 98,
        },
      },
    },
  },
})
