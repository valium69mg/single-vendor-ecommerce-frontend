# Skill: Write a Test

## Stack
Vitest 4 + React Testing Library + jsdom — configured and in use (see `vite.config.ts` `test` block; `src/api/*.test.ts`, `src/hooks/*.test.tsx`, `src/components/cart/*.test.tsx`, `src/pages/*.test.tsx` all exist).

**Unit and component tests only. No MSW, no e2e.** Mock the `@/api/api` module (or the specific hook) with `vi.mock` instead of intercepting network.

Setup file: `src/test/setup.ts` — loads `@testing-library/jest-dom` matchers and `@/i18n` (so `t()` returns real Spanish copy in assertions).

Run: `npm run test` (watch) or `npx vitest run` (one-shot).

## Test file locations
Place test files next to the code they test:
- `src/api/apiFetch.test.ts` — unit tests for `apiFetch` / `apiFetchFile`
- `src/api/api.test.ts` — unit tests for API functions
- `src/components/common/Modal.test.tsx` — component tests
- `src/hooks/useApiErrorHandler.test.tsx` — hook tests

## Unit test — pure function (e.g. Zod schema)
```ts
import { describe, it, expect } from "vitest";
import { createCategorySchema } from "@/components/auth/create-category.schema";

describe("createCategorySchema", () => {
  it("rejects names shorter than 3 chars", () => {
    const result = createCategorySchema.safeParse({ name: "ab" });
    expect(result.success).toBe(false);
  });

  it("accepts valid name", () => {
    const result = createCategorySchema.safeParse({ name: "Rings" });
    expect(result.success).toBe(true);
  });
});
```

## Unit test — apiFetch
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetch } from "@/api/apiFetch";
import { API_ERRORS } from "@/constants/apiErrors";

describe("apiFetch", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("throws UNAUTHORIZED on 401", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 401 }));
    await expect(apiFetch("/any", {})).rejects.toThrow(API_ERRORS.UNAUTHORIZED);
  });

  it("returns undefined on 204", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 204 }));
    const result = await apiFetch("/any", {});
    expect(result).toBeUndefined();
  });
});
```

## Component test — React Testing Library
```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import Modal from "@/components/common/Modal";

describe("Modal", () => {
  it("opens dialog on trigger click", async () => {
    render(
      <Modal
        buttonName="Open"
        content={() => <div>Modal content</div>}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });
});
```

## Page/hook test — mock the api module (no MSW)
```tsx
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi } from "vitest";
import AdminCategoriesPage from "@/pages/AdminCategoriesPage";

vi.mock("@/api/api", () => ({
  getAdminCategories: vi.fn().mockResolvedValue({
    content: [{ categoryId: 1, name: "Rings", products: 5, unitsSold: 10, revenue: 500, averagePrice: 100, stock: 20, imageUrl: null, mediumThumbnailUrl: null, smallThumbnailUrl: null, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" }],
    page: 0, size: 10, totalElements: 1, totalPages: 1, last: true,
  }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe("AdminCategoriesPage", () => {
  it("renders rows from the mocked api", async () => {
    render(<AdminCategoriesPage />, { wrapper });
    expect(await screen.findByText("Rings")).toBeInTheDocument();
  });
});
```

For hooks, `renderHook` from `@testing-library/react` with the same `wrapper`; mock `@/api/api` the same way.

## Key things to know
- `UserProvider` reads from `localStorage["loginData"]` on mount. Set it in `beforeEach` via `localStorage.setItem("loginData", JSON.stringify({ token: "test-token", role: "ADMIN", ... }))`.
- `useApiErrorHandler` calls `useQueryClient()` — always wrap components under `<QueryClientProvider>`.
- The app is Spanish-only; `t("categories")` returns `"Categorías"` in tests.
- `throwOnError` from `useApiErrorHandler` returns `false` — no need to set up ErrorBoundaries in tests.

## Before you commit
- [ ] `npx vitest run` passes; new tests are next to the source file, not in a separate `__tests__/` directory?
- [ ] `vi.mock` calls / spies reset — `vi.restoreAllMocks()` in `afterEach` (or `clearMocks` in config)?
- [ ] Component/hook tests wrapped in `QueryClientProvider` if they use any hook that calls `useQueryClient`?
- [ ] Any discovery about test setup behavior that's non-obvious? → add to `.claude/memory/gotchas.md`.
