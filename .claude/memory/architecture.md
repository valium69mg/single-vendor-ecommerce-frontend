# Architecture Decisions

## Single API file for all endpoints
**What:** All API functions and TypeScript interfaces live in `src/api/api.ts`. No per-resource files.
**Why:** [Fill in — was this a deliberate choice to keep things simple, or organic growth?]
**Consequence:** The file will grow; resist splitting unless it becomes unmaintainable. When adding a new endpoint, add the function AND its request/response types to `api.ts`.

## apiFetch wraps all HTTP calls
**What:** All authenticated requests go through `apiFetch` / `apiFetchFile` in `src/api/apiFetch.ts`. Direct `fetch` is only used in `loginRequest` (public, no auth).
**Why:** Centralizes 401/403/204/409 handling so no page-level code needs to check HTTP status codes.
**Consequence:** If a new error code needs special global treatment (e.g. 429 rate-limit), add it to `apiFetch.ts`, not at the call site.

## useApiErrorHandler for mutation error handling
**What:** All `useMutation` `onError` callbacks call `handleError(err, fallbackMessage)` from `useApiErrorHandler`. All `useQuery` instances pass `throwOnError` from the same hook.
**Why:** Ensures 401 always triggers logout (via `handleUnauthorized`) without risk of re-entrant logout calls. 403 always shows a consistent toast.
**Consequence:** Never handle auth errors inline. If you forget `throwOnError` in a query, 401 errors will silently fail and the user won't be logged out.

## UserProvider + localStorage persistence
**What:** `UserProvider` (`src/providers/UserProvider.tsx`) holds `LoginResponse` in React state, initialized from `localStorage["loginData"]` on mount.
**Why:** [Fill in — was this chosen over a proper token refresh flow intentionally? Is there a plan to add refresh tokens?]
**Consequence:** Logout = clear `localStorage["loginData"]` + set state to null. There is no token refresh — expired tokens produce 401s which trigger logout.

## TanStack Query for all server state
**What:** Pages use `useQuery`/`useMutation` directly; no custom hooks per resource beyond the columns hooks.
**Why:** [Fill in]
**Consequence:** Query keys must follow the `["admin", "resource", ...params]` pattern so that `invalidateQueries({ queryKey: ["admin", "resource"] })` correctly invalidates all pages/searches for that resource.

## Spanish-only i18n with inlined translations
**What:** A single `es` locale object in `src/i18n/index.ts`. No JSON files, no `en` block.
**Why:** The store serves a Spanish-speaking market only. Keeping translations inline avoids a build step and makes additions trivial.
**Consequence:** All UI strings must be added to the `es` object. Never add an `en` block — it creates maintenance burden for no benefit.

## Soft-delete on categories (restore flow)
**What:** Deleting a category doesn't permanently remove it. Creating a category with the same name as a deleted one returns a 409 Conflict with the old `categoryId`. The UI intercepts `ApiConflictError` and shows `RestoreCategoryDialog`.
**Why:** [Fill in — backend design decision? Legal/audit requirement?]
**Consequence:** Category create/edit must catch `ApiConflictError` specifically. The restore endpoint is `PATCH /admin/products/categories/:id/restore`.

## Product variants as the pricing unit
**What:** Products don't have a single price. Pricing lives in variants (`price`, `discountPrice`). Admin lists show `avgPrice` and `avgDiscountPrice` (computed by the backend).
**Why:** Jewelry products vary by size, material, or finish — a single product can have multiple SKUs at different prices.
**Consequence:** Never try to set a price on the product itself. When creating a product, at least one variant is required.
