# Skill: Write a Test

## Stack (not yet installed — see CLAUDE.md Testing plan)
Vitest + React Testing Library + MSW

Setup file: `src/test/setup.ts`

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

## Integration test — MSW
```tsx
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminCategoriesPage from "@/pages/AdminCategoriesPage";
import { API_BASE_URL } from "@/api/api";

const server = setupServer(
  http.get(`${API_BASE_URL}/admin/products/categories`, () => {
    return HttpResponse.json({
      content: [{ categoryId: 1, name: "Rings", products: 5, unitsSold: 10, revenue: 500, averagePrice: 100, stock: 20, imageUrl: null, mediumThumbnailUrl: null, smallThumbnailUrl: null, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" }],
      page: 0, size: 10, totalElements: 1, totalPages: 1, last: true,
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Key things to know
- `UserProvider` reads from `localStorage["loginData"]` on mount. Set it in `beforeEach` via `localStorage.setItem("loginData", JSON.stringify({ token: "test-token", role: "ADMIN", ... }))`.
- `useApiErrorHandler` calls `useQueryClient()` — always wrap components under `<QueryClientProvider>`.
- The app is Spanish-only; `t("categories")` returns `"Categorías"` in tests.
- `throwOnError` from `useApiErrorHandler` returns `false` — no need to set up ErrorBoundaries in tests.

## Before you commit
- [ ] Test file is next to the source file, not in a separate `__tests__/` directory?
- [ ] MSW handlers cleaned up in `afterEach(() => server.resetHandlers())`?
- [ ] Component tests wrapped in `QueryClientProvider` if they use any hook that calls `useQueryClient`?
- [ ] Any discovery about test setup behavior that's non-obvious? → add to `.claude/memory/gotchas.md`.
