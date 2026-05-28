# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commits

Do not include any reference to Claude, Sonnet, Anthropic, or AI in commit messages — no `Co-Authored-By` lines, no attribution of any kind.

## Commands

```bash
npm run dev        # Start dev server (Vite HMR)
npm run build      # Type-check + production build (tsc -b && vite build)
npm run lint       # ESLint
npm run preview    # Preview production build locally
```

No test suite is configured yet. See **Testing plan** below for the intended setup.

## Environment variables

Copy `.env.example` to `.env` and fill in:

```
VITE_API_URL=http://<host>:8080/api/v1
VITE_API_FILE_URL=http://<host>:8080/api/v1/file?key=
```

Both vars are also required as Docker build args (`ARG VITE_API_URL`, `ARG VITE_API_FILE_URL`). At runtime the container uses `BACKEND_ADDRESS` (default `http://backend:8080`) injected by `entrypoint.sh` into `nginx.conf.template` via `envsubst`.

## Path alias

`@/` maps to `src/` (configured in `vite.config.ts`). Use it for all intra-project imports.

## Architecture

**Stack:** React 19, TypeScript, Vite, Tailwind CSS v3, shadcn/ui (Radix UI primitives), TanStack Query v5, TanStack Table v8, React Hook Form + Zod, react-i18next, React Router v7, Sonner (toasts).

### Design system

The project is a luxury jewelry store. Two visual contexts share the same codebase:

- **Store** (HomePage, Navbar) — warm stone + amber palette, serif headings, sharp corners (`rounded-none`).
- **Admin** (all `/admin/*` pages) — neutral stone palette, same sharp corners.

**Typography** (defined in `tailwind.config.ts`):
- `font-store-heading` → Cormorant, Georgia, serif — use for all `<h1>`–`<h3>` and display text.
- `font-store-body` → Montserrat, system-ui, sans-serif — use for body copy, labels, and UI text. Applied globally to `body`.

**Button conventions:**
- Store primary CTA: `bg-amber-700 hover:bg-amber-600 text-white rounded-none` (warm amber).
- Store secondary / outline: `border border-stone-600 text-stone-200 hover:bg-stone-800/50 rounded-none`.
- Admin / form actions: `bg-stone-900 hover:bg-stone-800 text-white rounded-none` — use `GenericButton` for form submissions.

**Shape:** `rounded-none` throughout all store and admin components — never use the default Tailwind `rounded` or shadcn rounded variants.

### Auth & user state

- `UserProvider` (`src/providers/UserProvider.tsx`) wraps the entire app and stores the logged-in user (`LoginResponse`) in state, initialized from and persisted to `localStorage` under the key `"loginData"`.
- `useUser()` (`src/hooks/useUser.tsx`) is the hook to access user state anywhere.
- `ProtectedRoute` (`src/components/auth/ProtectedRoute.tsx`) guards routes by checking `user` existence and `user.role` against an allowed `roles` array. Unauthenticated users are redirected to `/login`; unauthorized roles to `/`.
- Roles are `USER` and `ADMIN` (see `src/constants/roles.ts`).

### API layer

- All API functions live in `src/api/api.ts`. Every function accepts a `token` string and passes it as a Bearer header.
- `apiFetch` and `apiFetchFile` (`src/api/apiFetch.ts`) are the two low-level wrappers. They throw `API_ERRORS.UNAUTHORIZED` on 401, `API_ERRORS.FORBIDDEN` on 403, and return `undefined` on 204.
- `useApiErrorHandler()` (`src/hooks/useApiErrorHandler.tsx`) centralizes error handling: 401 triggers logout (via `handleUnauthorized` to avoid re-entrant logouts), 403 shows a toast, other errors use a fallback message.
- When adding a new API endpoint, add the function to `src/api/api.ts` and its types inline there.

### Data fetching pattern

Pages use TanStack Query (`useQuery`/`useMutation`) directly. The standard shape:

```ts
const { data, isLoading } = useQuery({
  queryKey: ["resource", ...params],
  queryFn: () => apiFunction(params, user!.token),
  enabled: !!user?.token,
  throwOnError,   // from useApiErrorHandler()
});
```

Mutations call `queryClient.invalidateQueries` on success and `handleError` on error.

### Toast pattern

Use `useToast()` (`src/hooks/useToast.tsx`) — a thin wrapper around Sonner that exposes `success`, `error`, `info`, `warning`, and `promise`. Do not import `toast` from Sonner directly.

### Admin table pattern

Admin list pages follow a consistent pattern:
1. A `use<Resource>Columns` hook returns `ColumnDef[]` for TanStack Table, including inline `Modal` and `DestructiveActionButton` cells for edit and delete actions.
2. The page component manages pagination (`page`, `size`) and search (`term`) state and passes them to the query.
3. `DataTable` (`src/components/common/DataTable.tsx`) is the shared paginated table component — it receives `columns`, `data`, `page`, `setPage`, `hasNextPage`, `loading`, and translated `labels`.

### Modal / Form pattern

- `Modal` (`src/components/common/Modal.tsx`) wraps Radix `Dialog` and receives a `content` render prop: `(onClose: () => void) => ReactNode`. This lets forms close the dialog on success.
- `ImageModal` (`src/components/common/ImageModal.tsx`) is the same pattern but triggered by clicking an image rather than a button. The trigger renders via `imageWithFallback` and the same `content` render prop handles the dialog body.
- `Form` (`src/components/common/Form.tsx`) is a card-styled shell used inside modals, accepting `title`, `description`, `content`, `footerContent`, and `isLoading`.
- `GenericButton` (`src/components/common/GenericButton.tsx`) is the standard form submit button — black (`bg-stone-900`), full-width, shows a spinner when `isLoading` is true.
- Form schemas (Zod) are colocated in `src/components/auth/` (e.g., `edit-category.schema.ts`, `login.schema.ts`).

### Common components

`src/components/common/` contains shared UI primitives:

| Component | Purpose |
|---|---|
| `DataTable` | Paginated TanStack Table with prev/next controls |
| `DestructiveActionButton` | Confirm-before-delete button |
| `Form` | Card shell for modal forms |
| `FormField` | Labeled input wrapper for React Hook Form |
| `GenericButton` | Standard submit button with loading spinner |
| `IconWrapper` | Consistent icon sizing and color wrapper |
| `ImageModal` | Dialog triggered by clicking an image |
| `ImageWithFallback` | `<img>` that swaps to `/images/landscape-placeholder.svg` on error |
| `Loader` | Centered full-area spinner (use for page-level loading states) |
| `Modal` | Button-triggered Radix dialog with `content` render prop |
| `SearchBar` | Debounced search input |

### Home page layout

`HomePage` (`src/pages/HomePage.tsx`) renders the public storefront. It composes components from `src/components/home/` and `src/components/navbar/`:

```
<Navbar />           ← src/components/navbar/
  NavbarLogo
  NavbarCategories
  NavbarSearch
  NavbarProfile  (with NavbarDropdownMenu)
<main>
  <HeroBanner />
  <TrustBar />
  <FeaturedCategories />   ← renders MOCK_CATEGORIES
  <ProductSection />       ← reused 3× with MOCK_FEATURED_PRODUCTS, MOCK_NEW_ARRIVALS, MOCK_BESTSELLERS
  <BenefitsSection />
</main>
<HomeFooter />
```

Mock data lives in `src/mocks/home.ts` (`MOCK_CATEGORIES`, `MOCK_FEATURED_PRODUCTS`, `MOCK_NEW_ARRIVALS`, `MOCK_BESTSELLERS`) and is used until the real products API is integrated.

### Internationalization

Translations are inlined in `src/i18n/index.ts` (no separate JSON files). The app is **Spanish-only**: there is a single `es` translation object, and both `lng` and `fallbackLng` are `"es"`. When adding new UI strings, add the key to the `es` object only, then use `useTranslation()` / `t("key")`. Do not reintroduce an `en` block.

The backend catalog is likewise Spanish-only: categories, materials, and attributes expose a single `name` field (no `englishName`/`spanishName`). Category create/edit forms and the `Create/EditCategoryMutationVariables` in `src/api/api.ts` send `{ name }`.

### Routing

```
/login                          → LoginPage (public)
/                               → HomePage (USER, ADMIN)
/admin                          → AdminHomePage (ADMIN) — layout route with AdminSideBar
  /admin/products               → AdminProductsPage
  /admin/categories             → AdminCategoriesPage
  /admin/categories/:categoryId → AdminCategoryDetailPage
```

`AdminCategoryDetailPage` shows category stats (products, units sold, revenue, average price, stock), a low-stock warning when stock ≤ 10, and two tables with mock product data (top products, low-stock products). It also provides edit (via `Modal`) and delete (via `DestructiveActionButton`) actions that navigate back to `/admin/categories` on success.

### UI components

`src/components/ui/` contains shadcn/ui generated components — do not edit them manually; regenerate via the shadcn CLI if needed. Custom shared components live in `src/components/common/`.

`src/components/sidebar/` contains accordion and dropdown helpers (`SideBarAccordion`, `SidebarDropdownMenu`, `SidebarDropdownMenuItem`, `SideBarItem`) used by the admin sidebar — edit these directly if needed.

### Testing plan

**Stack to install:** Vitest + React Testing Library + MSW (Mock Service Worker).

#### 1. Unit tests — pure logic, no rendering
- Zod schemas (`loginSchema`, `editCategorySchema`, `createCategorySchema`) — valid/invalid inputs, boundary values (min 3, max 60)
- `useDebounce` — verify the value is debounced by the correct delay
- `apiFetch` / `apiFetchFile` — mock `fetch`, verify 401 throws `UNAUTHORIZED`, 403 throws `FORBIDDEN`, 204 returns `undefined`, happy path parses JSON

#### 2. Hook / component tests — React Testing Library
- `useApiErrorHandler` — 401 triggers logout + query clear, 403 shows forbidden toast, fallback message shown for other errors
- `ProtectedRoute` — unauthenticated redirects to `/login`, wrong role redirects to `/`, correct role renders children
- `SearchBar` — typing debounces before calling `setQuery`
- `DataTable` — renders loading state, no-results row, prev/next buttons disabled when appropriate
- `Modal` / `ImageModal` — opens on trigger, passes `onClose` correctly, closes the dialog
- `GenericButton` — shows spinner when `isLoading`, disabled during loading
- `ImageWithFallback` — renders fallback on image error

#### 3. Integration tests — MSW intercepting API calls
- **Login flow:** fill form → submit → MSW returns `LoginResponse` → `localStorage` updated → user context set
- **Category list:** MSW returns paginated data → table renders → next/prev page works → search debounces and refetches
- **Create category:** open modal → fill form → submit → MSW 200 → list invalidated → modal closes → toast shown
- **Edit category:** open modal → data pre-populated from query → submit → detail page refreshes
- **Delete category:** confirm dialog → MSW 200 → list invalidated → toast shown (+ navigate back on detail page)
- **Category detail:** MSW returns category → stats render → low-stock warning shows when stock ≤ 10

#### 4. E2E tests — Playwright
- Full login → admin panel → create category → edit it → upload image → delete it → back to list
- Role guard: log in as `USER`, attempt `/admin` → redirected to `/`
- Session expiry: MSW returns 401 mid-session → user logged out → redirected to `/login`

### Deployment

The Dockerfile is a two-stage build: Node 20 Alpine builder → Nginx 1.25 Alpine runtime. `entrypoint.sh` runs `envsubst` on `nginx.conf.template` to inject `BACKEND_ADDRESS` before starting Nginx. CI/CD is managed by `Jenkinsfile`.
