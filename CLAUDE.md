# CLAUDE.md

## Intelligence layer
See `.claude/` for the full project map, architecture decisions, conventions, skills, and patterns.
- `.claude/CODEBASE.md` — directory tree, data model, routes, API endpoints
- `.claude/memory/architecture.md` — key design decisions and WHY
- `.claude/memory/conventions.md` — naming rules, patterns, required practices
- `.claude/memory/gotchas.md` — things that have burned us
- `.claude/skills/` — how to add endpoints, admin pages, tests, and what to do after a pull
- `.claude/patterns/` — gold-standard reference files

## Commits

Use conventional commits. Never include references to AI tools, models, or companies in commit messages — no "Claude", "Anthropic", "Sonnet", "Opus", "Haiku", "GPT", "Co-Authored-By AI", or any equivalent. Commit messages describe the work, not the tool.

## Commands

```bash
npm run dev        # Start dev server (Vite HMR)
npm run build      # Type-check + production build (tsc -b && vite build)
npm run lint       # ESLint
npm run preview    # Preview production build locally
npm run test       # Vitest (watch mode)
npx vitest run     # Vitest, one-shot — use this for CI / pre-commit
```

**Testing:** Vitest 4 + React Testing Library + jsdom, wired via the `test` block in `vite.config.ts` (setup file `src/test/setup.ts`, which loads `@testing-library/jest-dom`, `@/i18n`, and the MSW node server). Unit and component tests mock modules/hooks with `vi.mock`. Integration tests (`*.integration.test.tsx`) use MSW (`src/mocks/`) to intercept HTTP instead of stubbing `fetch`. **No e2e.** Place test files next to the code they test. Full patterns in `.claude/skills/write-test.md`.

## Environment variables

Copy `.env.example` to `.env`:

```
VITE_API_URL=http://<host>:8080/api/v1
VITE_API_FILE_URL=http://<host>:8080/api/v1/file?key=
```

Both are also required as Docker build args. Runtime: `BACKEND_ADDRESS` injected into nginx via `envsubst` in `entrypoint.sh`.

## Path alias

`@/` maps to `src/` (configured in `vite.config.ts`). Use it for all intra-project imports.

## Stack

React 19, TypeScript, Vite, Tailwind CSS v3, shadcn/ui (Radix UI primitives), TanStack Query v5, TanStack Table v8, React Hook Form + Zod, react-i18next, React Router v7, Sonner (toasts).

## Design system — rules that apply to every file

> **Authoritative standard:** [`.claude/FRONTEND-STANDARD.md`](.claude/FRONTEND-STANDARD.md) — the
> enforceable UI/UX contract (tokens, shape, spacing scale, type ramp, buttons, focus & keyboard,
> forms/autofill, loading, empty states, breadcrumbs, icons, motion, responsive; WCAG 2.2 AA).
> Made binding by `requerimientos-ecommerce-joyeria.md` §3.13. Adoption is tracked by the
> `UI-*` ticket track (`tickets/README.md` § UI/UX Standard track). Paste the §8 per-view
> checklist into every UI PR. The quick rules below are the summary; the standard wins on any conflict.

This is a luxury jewelry store. Two visual contexts share one codebase: **Store** (warm stone + amber) and **Admin** (neutral stone).

**Shape:** `rounded-none` everywhere — never `rounded`, `rounded-md`, or any shadcn radius variant.

**Typography:**
- `font-store-heading` (Cormorant serif) → h1–h3 and display text
- `font-store-body` (Montserrat) → all other text; applied globally to `body`

**Buttons:**
- Store CTA: `bg-amber-700 hover:bg-amber-600 text-white rounded-none`
- Store outline: `border border-stone-600 text-stone-200 hover:bg-stone-800/50 rounded-none`
- Admin / form: `bg-stone-900 hover:bg-stone-800 text-white rounded-none` — use `GenericButton` for form submissions

## Common components

`src/components/common/` — use these, don't rebuild them:

| Component | Purpose |
|---|---|
| `DataTable` | Paginated TanStack Table with prev/next |
| `DestructiveActionButton` | Confirm-before-delete |
| `Form` | Card shell for modal forms |
| `FormField` | Labeled input wrapper for RHF |
| `GenericButton` | Submit button with loading spinner |
| `ImageModal` | Dialog triggered by clicking an image |
| `ImageWithFallback` | `<img>` with fallback to `/images/landscape-placeholder.svg` |
| `InfiniteScrollSelect` | Single-select with infinite-scroll and search |
| `InfiniteScrollMultiSelect` | Multi-select with infinite-scroll and search |
| `Loader` | Centered full-area spinner |
| `Modal` | Button-triggered Radix dialog with `content` render prop |
| `SearchBar` | Debounced search input |

`src/components/ui/` — shadcn/ui generated components. Do not edit manually; regenerate via shadcn CLI.

## Deployment

Two-stage Docker build: Node 20 Alpine builder → Nginx 1.25 Alpine runtime. CI/CD via `Jenkinsfile`.
