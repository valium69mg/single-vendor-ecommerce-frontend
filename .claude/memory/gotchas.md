# Gotchas

## Attributes endpoint returns array, not PageResponse
**What happened:** `GET /admin/products/attributes` returns `AdminAttribute[]`, not `PageResponse<AdminAttribute>`. Treating it as a standard paged response breaks the `last` check.
**Root cause:** The backend API doesn't follow the `PageResponse` contract for attributes.
**How to avoid:** `getAdminAttributesPage` in `api.ts` wraps the raw array response into a fake `PageResponse` with `last: list.length < size`. Don't refactor this to use the standard `apiFetch<PageResponse<AdminAttribute>>` pattern.

## 409 Conflict on category create/edit is a restore signal, not a plain error
**What happened:** Creating or editing a category with the name of a previously deleted category returns 409 Conflict with `{ error, categoryId }`. Treating it as a generic error skips the restore dialog.
**Root cause:** Backend uses 409 to signal "this name existed before" rather than a plain validation error.
**How to avoid:** `apiFetch` throws `ApiConflictError` (not a plain `Error`) on 409. Category forms catch `ApiConflictError` specifically and show `RestoreCategoryDialog`. Never use a generic `.catch` that swallows the type.

## Product image upload requires fetching the new product ID
**What happened:** `createProduct` doesn't return the new product's ID. To upload an image after create, the form fetches `getAdminProducts({ page: 0, size: 1, sortBy: "createdAt", sortDirection: "DESC" })` to get the most-recently-created product.
**Root cause:** Backend returns `StandardResponse { status, message }` instead of the new entity.
**How to avoid:** Image upload after create is always a best-effort secondary step — wrap it in its own try/catch and show a specific toast on failure (`productImageUploadFailed`), not a generic error.

## Attribute value tags live outside react-hook-form
**What happened:** `useFieldArray` manages variant rows, but each variant's selected attribute values are stored in `attrTagsMap: Record<fieldId, AttrValueTag[]>` in component state, not in the form. The `attributeValueIds` field in the schema is populated at submit time.
**Root cause:** RHF's `useFieldArray` doesn't handle deeply nested dynamic objects well with portaled dropdowns.
**How to avoid:** When adding attribute logic, always sync `attrTagsMap` → `attributeValueIds` at `onSubmit` time, not on every tag change.

## AttributeValueAdder dropdown uses createPortal to escape modal z-index
**What happened:** The attribute dropdown inside a modal got clipped by the modal's overflow or stacking context.
**Root cause:** The `CreateProductForm` is rendered inside a Dialog (which has its own stacking context). Dropdown menus inside modals need portal rendering to appear above the dialog.
**How to avoid:** The `AttributeValueAdder` uses `createPortal(dropdown, document.body)` with `position: fixed` coordinates derived from `getBoundingClientRect()`. Don't move this to a non-portal approach.

## throwOnError in useQuery must come from useApiErrorHandler
**What happened:** Passing `throwOnError: true` (boolean) to `useQuery` throws errors to the nearest ErrorBoundary, bypassing the logout logic. Passing the function from `useApiErrorHandler` handles 401 inline and returns `false` so TanStack Query doesn't re-throw.
**Root cause:** The hook's `throwOnError` function calls `handleError` then returns `false`, which suppresses re-throw.
**How to avoid:** Always destructure `{ throwOnError }` from `useApiErrorHandler()` and pass that function, never the literal `true`.

## Backend 301 (superseded slug) is followed transparently by `fetch` — reconcile the URL from the DTO
**What happened:** The by-slug endpoints (`/products/by-slug/{slug}` etc.) return a real HTTP 301 + `Location` when a slug moved to history. `apiFetch` calls `fetch` with no `redirect` option, so it defaults to `redirect: "follow"`: in the browser and under undici/jsdom the GET 301 is followed transparently and `apiFetch` only sees the final 200 + canonical DTO. A `fetch` redirect does NOT update the browser address bar, so a stale `/product/<old-slug>` stays in the URL.
**Root cause:** `fetch` redirect-follow is invisible to the caller; only navigations change the address bar.
**How to avoid:** Primary path (works whether or not the redirect is followed): every by-slug DTO carries the canonical `slug`; the page compares `data.slug !== slugParam` and calls `navigate('/<route>/' + data.slug, { replace: true })`. Secondary/defensive path: `apiFetch` has an early `if (res.status === 301 || res.status === 308)` branch that reads `body.canonicalSlug` and throws `ApiMovedError`; the by-slug wrappers catch it and re-fetch the canonical URL. Spike test: `src/api/apiFetch.spike.test.ts` — a stubbed 301 is surfaced to `apiFetch`, never unwrapped as success, so the defensive branch is reachable and ships regardless.

## shadcn/ui components must not be edited manually
**What happened:** Manually editing files in `src/components/ui/` breaks on the next `npx shadcn add` or regeneration.
**Root cause:** shadcn CLI overwrites these files.
**How to avoid:** Regenerate via the shadcn CLI. Custom shared components go in `src/components/common/`, not `src/components/ui/`.
