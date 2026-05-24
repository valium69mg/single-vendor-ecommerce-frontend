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

### Admin table pattern

Admin list pages follow a consistent pattern:
1. A `use<Resource>Columns` hook returns `ColumnDef[]` for TanStack Table, including inline `Modal` and `DestructiveActionButton` cells for edit and delete actions.
2. The page component manages pagination (`page`, `size`) and search (`term`) state and passes them to the query.
3. `DataTable` (`src/components/common/DataTable.tsx`) is the shared paginated table component — it receives `columns`, `data`, `page`, `setPage`, `hasNextPage`, `loading`, and translated `labels`.

### Modal / Form pattern

- `Modal` (`src/components/common/Modal.tsx`) wraps Radix `Dialog` and receives a `content` render prop: `(onClose: () => void) => ReactNode`. This lets forms close the dialog on success.
- `Form` (`src/components/common/Form.tsx`) is a card-styled shell used inside modals, accepting `title`, `description`, `content`, `footerContent`, and `isLoading`.
- Form schemas (Zod) are colocated in `src/components/auth/` (e.g., `edit-category.schema.ts`, `login.schema.ts`).

### Internationalization

Translations are inlined in `src/i18n/index.ts` (no separate JSON files). Default and fallback language is `"es"` (Spanish). When adding new UI strings, add keys to both the `en` and `es` translation objects in that file, then use `useTranslation()` / `t("key")`.

### Routing

```
/login            → LoginPage (public)
/                 → HomePage (USER, ADMIN)
/admin            → AdminHomePage (ADMIN) — layout route with AdminSideBar
  /admin/products → AdminProductsPage
  /admin/categories → AdminCategoriesPage
```

### UI components

`src/components/ui/` contains shadcn/ui generated components — do not edit them manually; regenerate via the shadcn CLI if needed. Custom shared components live in `src/components/common/`.

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
- `Modal` — opens on button click, passes `onClose` correctly, closes the dialog

#### 3. Integration tests — MSW intercepting API calls
- **Login flow:** fill form → submit → MSW returns `LoginResponse` → `localStorage` updated → user context set
- **Category list:** MSW returns paginated data → table renders → next/prev page works → search debounces and refetches
- **Create category:** open modal → fill form → submit → MSW 200 → list invalidated → modal closes → toast shown
- **Edit category:** open modal → data pre-populated from query → submit → detail page refreshes
- **Delete category:** confirm dialog → MSW 200 → list invalidated → toast shown (+ navigate back on detail page)

#### 4. E2E tests — Playwright
- Full login → admin panel → create category → edit it → upload image → delete it → back to list
- Role guard: log in as `USER`, attempt `/admin` → redirected to `/`
- Session expiry: MSW returns 401 mid-session → user logged out → redirected to `/login`

### Deployment

The Dockerfile is a two-stage build: Node 20 Alpine builder → Nginx 1.25 Alpine runtime. `entrypoint.sh` runs `envsubst` on `nginx.conf.template` to inject `BACKEND_ADDRESS` before starting Nginx. CI/CD is managed by `Jenkinsfile`.
