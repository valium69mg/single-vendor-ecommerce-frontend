# Frontend Standard

The enforceable UI/UX contract for `single-vendor-ecommerce-frontend`. Every view and
component MUST conform. Deviations require a note in the PR and an entry in the relevant
ticket.

- **Audience:** anyone writing or reviewing frontend code, human or agent.
- **Scope:** web only (desktop + mobile breakpoints). No native app concerns.
- **Authority:** this file supersedes the ad-hoc "Design system" block in `CLAUDE.md`.
  `CLAUDE.md` now points here.
- **Baseline:** WCAG 2.2 Level AA.
- **Source dataset:** rule IDs in `[brackets]` map to `ui-ux-pro-max` guideline slugs.

---

## 0. Two visual contexts, one codebase

| Context | Where | Ground | Accent | Surface | Heading |
|---|---|---|---|---|---|
| **Store** | everything under the storefront + `/mi-cuenta`, `/carrito`, `/checkout`, `/pedidos` | `stone-50` | `amber-700` | `white` + `border-stone-200` | Cormorant |
| **Admin** | `/admin/*` | `stone-50` | `stone-900` (neutral) | `white` + `border-stone-200` | Cormorant |

The contexts differ **only** in accent color and CTA fill. Everything else in this
document is shared.

---

## 1. Design tokens (non-negotiable)

**Problem today:** `index.css` still ships the default shadcn neutral-gray palette and
`--radius: 0.5rem`. The real design (stone + amber, zero radius) exists only as utility
classes sprinkled across ~24 files. There is no single source of truth.

**Target:** every color, radius, spacing step, font, shadow, and z-index is a token.
Components consume tokens, never raw scale values.

### 1.1 Color

Define semantic tokens in `index.css` `@layer base :root` and map them in
`tailwind.config.ts`. Components use the Tailwind utility, never a raw scale value.
`[color-semantic]`

| CSS var | Tailwind utility | Store value | Admin value | Use |
|---|---|---|---|---|
| `--surface-page` | `bg-surface-page` | `stone-50` | `stone-50` | page background (set on `body`, not per-page) |
| `--surface-raised` | `bg-surface-raised` | `white` | `white` | cards, tables, asides, sheets |
| `--surface-inverse` | `bg-surface-inverse` | `stone-950` | `stone-950` | hero, footer, auth backdrop |
| `--border-default` | `border-line` | `stone-200` | `stone-200` | card / table / divider borders |
| `--border-strong` | `border-line-strong` | `stone-600` | `stone-600` | input borders, outline buttons |
| `--text-primary` | `text-fg` | `stone-900` | `stone-900` | headings, body |
| `--text-secondary` | `text-fg-muted` | `stone-600` | `stone-600` | supporting copy (**minimum for meaningful text**) |
| `--text-tertiary` | `text-fg-subtle` | `stone-500` | `stone-500` | timestamps, captions — decorative / non-critical only |
| `--brand` | `bg-brand` / `text-brand` | `amber-700` | `stone-900` | primary CTA fill, active nav, links |
| `--brand-hover` | `hover:bg-brand-hover` | `amber-600` | `stone-800` | CTA hover |
| `--danger` | `text-danger` / `bg-danger` | `red-700` | `red-700` | destructive actions, errors (text on white) |
| `--success` | `text-success` | `green-700` | `green-700` | confirmations |
| `--warning` | `text-warning` | `amber-700` on `amber-50` | same | soft warnings (CP fallback, low stock) |

The CSS vars keep their semantic names; the Tailwind keys are short (`fg`, `line`,
`surface-page`, `brand`) to avoid double-prefixed utilities like `text-text-secondary`.

**Banned:** `text-stone-400` (and lighter) for any text a user needs to read — it fails
4.5:1 on both `white` and `stone-50`. `[color-contrast]` Use `text-fg-subtle`
(`stone-500`) as the floor, `text-fg-muted` for anything meaningful.

**Banned:** `text-red-500` / `text-green-500` for message text — fails AA on white.
Use `--danger` / `--success` (700). `[contrast-feedback]`

**Banned:** `gray-*` anywhere. The palette is `stone`. (Current offenders:
`EditImageForm`, `FormField` password toggle, `useCategoryColumns`.)

**Naming:** the brand-accent token is `--brand`, **not** `--accent` — shadcn already
owns `--accent` for its neutral hover-surface role (ghost/outline button hover,
dropdown item hover). Leave shadcn's `--accent` alone; primitives get re-themed in
the `ui-foundation-primitives-theme` slice.

**Dark mode:** not in scope. The `.dark` block in `index.css` is dead code (no
`ThemeProvider`, no toggle) and is being deleted in `ui-foundation-tokens`. If dark
mode is ever wanted it gets its own ticket. Do not add `dark:` variants piecemeal.

### 1.2 Shape

`--radius: 0` — globally. Rounded corners are **off** for this brand.
`[effects-match-style]`

- shadcn `Button`, `Input`, `Card`, `Dialog`, `DropdownMenu`, `Sheet`, `Table`,
  `AlertDialog` MUST be re-themed to `rounded-none` at the primitive level, not patched
  per call site.
- `rounded-full` is allowed **only** for genuinely circular decorative elements
  (avatar, notification dot, ambient blur). Never on product imagery, cards, thumbnails,
  or inputs. (Current offenders: `PublicProductCard` / `ProductCard` / `CategoryCard`
  image wrappers use `rounded-sm`; `useCategoryColumns` thumbnail `rounded`;
  `EditImageForm` `rounded-lg`.)

### 1.3 Spacing scale `[spacing-scale]`

4px base. Use only: `1 (4) · 2 (8) · 3 (12) · 4 (16) · 6 (24) · 8 (32) · 10 (40) ·
12 (48) · 16 (64) · 20 (80) · 24 (96)`. No `5`, `7`, `9`, `11`, `14`, arbitrary
`p-[13px]`, etc.

**Vertical rhythm tiers** `[section-spacing-hierarchy]`:

| Tier | Value | Use |
|---|---|---|
| inline | `gap-2` / `gap-3` | within a control group |
| block | `gap-4` / `space-y-4` | between fields, list rows |
| section | `gap-6` / `space-y-6` | between page sections (admin default) |
| page | `py-10` (mobile) → `py-12` (desktop) | main content top/bottom padding |
| marketing | `py-16` → `py-20` | home page section bands |

### 1.4 Container width `[container-width]`

Pick by content type, not by taste:

| Width | Use |
|---|---|
| `max-w-md` | single-column forms (profile, address) |
| `max-w-3xl` | reading / single-object detail (order detail, 404) |
| `max-w-4xl` | form + summary two-column (checkout), orders list |
| `max-w-5xl` | object + media two-column (product detail, cart), account shell |
| `max-w-6xl` | product grids (category, brand, list pages) |
| `max-w-7xl` | home marketing bands only |

Horizontal padding is always `px-4 sm:px-6 lg:px-8`.

### 1.5 Z-index scale `[z-index-management]`

`0` base · `10` sticky in-flow · `20` dropdown / popover · `40` sticky nav ·
`50` drawer / sheet · `100` modal / dialog · `1000` toast. Navbar currently uses
`z-50` and `CartDrawer`/`AdminSideBar` also `z-50` — collision. Fix to the scale.

---

## 2. Typography `[font-scale]` `[text-styles-system]`

Fonts (already correct): `font-store-heading` = Cormorant, `font-store-body` =
Montserrat (global on `body`).

**Apply `font-store-heading` to `h1`–`h3` via the base layer**, not per element.
`index.css` currently only sets `body`. `CLAUDE.md` claims h1–h3 get the serif — make it
true.

### 2.1 Type scale — one ramp, used everywhere

| Role | Class | Weight | Line-height |
|---|---|---|---|
| Display (hero only) | `text-5xl sm:text-6xl lg:text-7xl` | 600 | `leading-[0.95]` |
| Page title (`h1`) | `text-3xl` | 600 | `leading-tight` |
| Section (`h2`) | `text-xl` | 600 | `leading-snug` |
| Subsection (`h3`) | `text-lg` | 600 | `leading-snug` |
| Body | `text-sm` (`text-base` for long-form prose) | 400 | `leading-relaxed` (1.6) `[line-height]` |
| Supporting | `text-sm` | 400 | 1.5 |
| Caption / meta | `text-xs` | 400–500 | 1.5 |

**Current violations:** `h1` ranges from `text-2xl` (product detail, cart, orders,
account, order detail) to `text-3xl` (catalog lists, admin) to `text-4xl` (404).
Pick `text-3xl` for every page title. `SectionHeader` uses `text-4xl` for `h2` — drop to
`text-xl`… unless it's a marketing band (then `text-4xl sm:text-5xl` is a deliberate
display exception, documented here).

### 2.2 Rules

- Body copy line length 60–75ch desktop, 35–60ch mobile. `[line-length-control]`
  Add `max-w-prose` / `max-w-lg` to running paragraphs.
- Prices, quantities, totals, order numbers, dates in tables → `tabular-nums`.
  `[number-tabular]`
- Prefer wrapping over truncation; when truncating, provide the full value via
  `title` / tooltip. `[truncation-strategy]`
- One `h1` per view. Sequential levels, no skips. `[heading-hierarchy]`

---

## 3. Components

### 3.1 Buttons — use the variant, never re-type the class string `[primary-action]`

`ui/button.tsx` MUST carry these variants (re-themed, `rounded-none`, `h-11` default
for forms, `h-9` for toolbar):

| Variant | Store | Admin |
|---|---|---|
| `cta` (primary) | `bg-amber-700 hover:bg-amber-600 text-white` | `bg-stone-900 hover:bg-stone-800 text-white` |
| `outline` | `border border-stone-600 text-stone-800 hover:bg-stone-100` | same |
| `ghost` | text-only, `hover:bg-stone-100` | same |
| `danger` | `bg-red-700 hover:bg-red-800 text-white` | same |
| `link` | `text-brand underline-offset-4 hover:underline` | same |

- **One primary CTA per view.** Secondary actions are `outline` or `ghost`.
- `GenericButton` stays the form-submit wrapper (spinner + disabled). It MUST render
  `<Button variant="cta">`, not a hardcoded `bg-stone-900` string.
- Every hand-written `<button>` / `<a>` / `<Link>` styled as a button is a bug — replace
  with `<Button asChild>` or `buttonVariants()`. Current offenders: `NotFoundPage`,
  `CartPage`, `CheckoutPage`, `OrderDetailPage`, `ProductDetailPage`, `HeroBanner`,
  `AddressCard`, `CartDrawer`.

### 3.2 Focus & keyboard `[focus-states]` `[focus-appearance]` `[keyboard-nav]`

- **Every** interactive element has a visible focus indicator:
  `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand
  focus-visible:ring-offset-2`. Bake it into the primitives; never `outline-none`
  without a replacement (current offender: `NavbarCategories` trigger).
- Focus ring contrast ≥ 3:1 against adjacent colors. `[focus-appearance]`
- Tab order follows visual order. No positive `tabindex`.
- Sticky navbar must not obscure the focused element — add `scroll-margin-top` to
  focus targets or `scroll-padding-top` on `html`. `[focus-not-obscured]`
- Skip link: `<a href="#main">` as the first focusable element on every page shell,
  visually hidden until focused. `[skip-links]` Add `id="main"` to each `<main>`.

### 3.3 Touch targets `[web-target-size]`

Minimum **24×24 CSS px** hit area (WCAG 2.2 AA); aim for **44×44** for primary actions.
Current risks: icon-only `Trash2` in `CartItemRow` (h-4 w-4, no padding), password toggle
in `FormField`, `X` clear-filters in `AdminProductsPage`. Give them `p-2` / explicit
`h-9 w-9`.

### 3.4 Forms `[input-labels]` `[error-placement]` `[error-summary]` `[focus-management]`

`FormField` is the standard wrapper. It MUST:

1. Render a **visible `<label>`** tied by `htmlFor` (placeholder is never the label).
2. Set `aria-invalid` on the input when `error` is present.
3. Give the error `<p>` an `id` and link it: `aria-describedby={error ? errorId : helperId}`.
   `[aria-live-errors]` — error `<p>` gets `role="alert"`.
4. Render persistent **helper text** below complex inputs (not placeholder). `[input-helper-text]`
5. Show a **required indicator** (`*` with `aria-hidden` + "required" in the a11y name)
   for required fields. `[required-indicators]`
6. Accept and forward `autoComplete`, `inputMode`, `type` — see 3.5.
7. Use `--danger` (`text-red-700`) for error text, `text-xs`.

**Password fields:** show/hide toggle button needs `aria-label` + `aria-pressed`.
`[password-toggle]`

**On failed submit with >1 error:** render a focusable error summary at the top of the
form, each item linking to its field; move focus to it. `[error-summary]` `[focus-management]`
Single-error forms may just focus the invalid field.

**Validation timing:** validate on blur, not on every keystroke. `[inline-validation]`

**Read-only vs disabled:** visually and semantically distinct. Read-only fields
(`AddressForm` geo fields after CP lookup) get a muted background + `readOnly`, not
`disabled`. `[read-only-distinction]`

**Field grouping:** wrap related fields (`AddressForm`, `CheckoutPage` shipping) in
`<fieldset>` + `<legend>`. `[field-grouping]`

**Multi-step (register → verify):** show a step indicator; allow back nav.
`[multi-step-progress]`

### 3.5 Input semantics — mobile keyboards & autofill `[input-type-keyboard]` `[autofill-support]`

The whole app currently has **one** `autoComplete` attribute. Fix per field:

| Field | `type` | `inputMode` | `autoComplete` |
|---|---|---|---|
| email | `email` | `email` | `email` |
| password (login) | `password` | — | `current-password` |
| password (register) | `password` | — | `new-password` |
| recipient / full name | `text` | — | `name` |
| phone | `tel` | `tel` | `tel` |
| postal code | `text` | `numeric` | `postal-code` |
| street | `text` | — | `address-line1` |
| interior/apt | `text` | — | `address-line2` |
| city | `text` | — | `address-level2` |
| state | `text` | — | `address-level1` |
| verification code | `text` | `numeric` | `one-time-code` |

Do not block paste on any field. `[accessible-authentication]`

### 3.6 Data tables `[sortable-table]` `[data-table]`

`DataTable` MUST:

- Support column sort where the API allows it, with `aria-sort` reflecting state.
- Render a designed **empty state** (icon + message + optional CTA), not a bare centered
  `noResults` cell. `[empty-states]`
- Keep row height and column widths stable while `loading` — use a skeleton of N rows,
  not a single spinner cell that collapses the table. `[content-jumping]` `[loading-chart]`
- Show total count / result range near the pager when the API returns it.
- Wrap in `overflow-x-auto` (already done at call sites — move it into the component).
- Numeric columns right-aligned + `tabular-nums`.

### 3.7 Loading states `[progressive-loading]` `[loading-states]`

One pattern. Kill the current three (`Loader`, bare `<Spinner>`, nothing):

- **> 1s, known layout** (lists, detail pages, tables) → **skeleton** matching final
  layout. Reserve image space with `aspect-*`. `[content-jumping]` `[image-dimension]`
- **< 1s or unknown** → single centered `Spinner` (the `Loader` component).
- **Button-triggered async** → spinner *inside* the button, button `disabled`
  (`GenericButton` pattern). `[loading-buttons]`
- Never a full-page spinner for a partial update.

### 3.8 Empty states `[empty-states]`

Every list / collection view has a designed empty state: a Phosphor icon (`--text-tertiary`),
a one-line message (`--text-secondary`), and — where an action makes sense — a `cta`/`outline`
button. Applies to: cart, orders, addresses, category/brand product grids, catalog lists,
all admin tables, search-with-no-results.

### 3.9 Feedback: toasts, banners, confirms

- Toasts (Sonner) auto-dismiss 4s, `aria-live="polite"`, never steal focus.
  `[toast-dismiss]` `[toast-accessibility]`
- Destructive confirms (`DestructiveActionButton`) MUST name the object:
  "Delete category "Anillos"? This cannot be undone." — not the generic
  "¿Estás seguro?". `[confirmation-dialogs]`
- Offer **undo** for deletes where feasible (toast with Undo) instead of / in addition to
  the confirm dialog. `[undo-support]`
- Error messages state cause **and** recovery path. `[error-clarity]` `[error-recovery]`

### 3.10 Navigation `[nav-state-active]` `[breadcrumb-web]` `[destructive-nav-separation]`

- Active location is always visually marked (`AccountSidebar` / `AdminSideBar` do this;
  keep it).
- **Breadcrumbs** on every view ≥ 3 levels deep: product, category, brand detail;
  all admin detail pages. Build a shared `Breadcrumbs` component (closes appraisal
  FE-003). `[breadcrumb-web]`
- Destructive nav items (logout) are visually separated from normal nav — a divider +
  spacing above "Cerrar sesión" in both sidebars. `[destructive-nav-separation]`
- Back actions preserve scroll + filter + pager state. `[state-preservation]`
- Global search (`NavbarSearch`) is currently non-functional (local state, no results
  route). Either wire it to `/buscar?q=` with a results page or remove it — a dead search
  box is worse than none. `[search-accessible]`
- After route change, move focus to `#main`. `[focus-on-route-change]`

### 3.11 Icons `[icon-style-consistent]` `[no-emoji-icons]`

**One library: Phosphor (`@phosphor-icons/react`).** Today the app mixes
`lucide-react` **and** `react-icons/{fa,lu,rx,fi,bs,cg,tb,io5}` — at least six visual
families with different stroke weights and corner styles.

- Migrate all icons to Phosphor. Fall back to Heroicons only if Phosphor lacks a glyph,
  matched to the same weight.
- Size via Phosphor's `size` prop, from a shared `ICON` constant — the only allowed
  values: `sm` 16 · `md` 20 · `lg` 24 · `xl` 32 · `2xl` 48. `md` (20) is the default
  for inline/content icons, `sm` (16) for dense UI, `lg` (24) for touch controls,
  `xl`/`2xl` for decorative (empty states, 404, hero). No arbitrary `h-3.5 w-3.5` /
  `size={18}` mix. Snap existing `size={18}` to `md`.
- Consistent weight per layer (`regular` for nav/content, `bold` for emphasis).
- `IconWrapper` is retired — it only force-sized icons; use `<Icon size={ICON.md} />`.
- Decorative icon next to visible text → `aria-hidden="true"`. `[icon-context]`
- Icon-only control → `aria-label` (localized via `t()`, not a hardcoded string like
  `AdminHomePage`'s `"Abrir menú"`). `[aria-labels]`
- Meaningful icon + state (sort, expand) → announce the state.
- No emojis as structural icons (currently clean — keep it).

### 3.12 Images `[image-optimization]` `[image-dimension]` `[alt-text]`

- Every `<img>` declares `width`/`height` or sits in an `aspect-*` box. `[image-dimension]`
- `loading="lazy"` below the fold; hero / above-fold images eager. `[lazy-load-below-fold]`
- Meaningful images: descriptive `alt`. Decorative: `alt=""`. `ImageWithFallback` already
  defaults `alt=""` — callers must pass real alt for product/category imagery.
- Product grid images: `srcset` from the thumbnail sizes the API exposes
  (`smallThumbnailUrl` / `mediumThumbnailUrl`).

---

## 4. Motion `[duration-timing]` `[reduced-motion]` `[transform-performance]`

The app has **zero** `prefers-reduced-motion` handling and `HeroBanner` /
`PublicProductCard` run transform + blur animations.

- Add a global rule in `index.css`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: .01ms !important;
      transition-duration: .01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```
- Motion tokens: `--motion-fast: 150ms` (hover, color) · `--motion-base: 250ms`
  (enter, expand) · `--motion-slow: 400ms` (page/section). Exit ≈ 70% of enter.
  `[exit-faster-than-enter]`
- Easing: `ease-out` on enter, `ease-in` on exit, `linear` only for spinners.
  `[easing]`
- Animate `transform` / `opacity` only — never `width`/`height`/`top`/`left`.
  `[transform-performance]` `[layout-shift-avoid]`
- Animate 1–2 elements per view max. `[excessive-motion]`
- Hover scale on cards/buttons: `0.98`–`1.02`, restore on release. `[scale-feedback]`

---

## 5. Responsive `[mobile-first]` `[viewport-units]` `[horizontal-scroll]`

- Breakpoints: `sm 640 · md 768 · lg 1024 · xl 1280`. Design mobile-first.
- Full-height wrappers use `min-h-dvh`, not `min-h-screen` / `h-screen` (15 offenders).
  `[viewport-units]`
- Body text ≥ 16px on mobile inputs to avoid iOS auto-zoom (`Input` is `text-base` on
  mobile, `md:text-sm` — correct, keep). `[readable-font-size]`
- No horizontal scroll at 320px. Wide content (tables, filter rows) scrolls inside its
  own `overflow-x-auto`. `[horizontal-scroll]`
- Fixed/sticky bars reserve space for content underneath. `[fixed-element-offset]`
- Viewport meta stays `width=device-width, initial-scale=1` — never disable zoom.
  `[viewport-meta]`
- `AdminProductsPage` filter row: chips/selects wrap before shrinking; a `+n` overflow
  is an operable disclosure, not hidden. `[chip-collection-reflow]`

---

## 6. Copy & i18n

**The site ships in Spanish only** — no second locale is planned (`requerimientos`
§4.7 lists i18n as *future*). `react-i18next` is still the copy layer: the rule is
**no user-facing string literal in a component** — all copy via `t()` keyed in
`src/i18n/index.ts`. Rationale here is a single source of truth for wording and
consistency with the rest of the app (which already does this), not multi-language
support. `aria-label`s route through `t()` too.

Because it is not an i18n blocker, the hardcoded-Spanish files below are a
**consistency** fix, not a correctness one — batch them into the relevant view's
`-ux` ticket rather than a dedicated pass.

**Current violations (whole files):** `HeroBanner`, `HomeFooter`, `TrustBar`,
`BenefitsSection`, `PublicProductCard`, `ProductCard`, `CategoryCard`, `SectionHeader`
subtitle usage, `NavbarCategories` ("Categorías" / "Ver todas"). Every one of these ships
hardcoded Spanish.

`aria-label`s are user-facing → also `t()`.

---

## 7. Content & data formatting

- Currency: `formatMXN` (exists). Never `$${n.toFixed(2)}` (current offender:
  `AdminCategoryDetailPage` mock tables, in USD).
- Dates: `formatDate` (exists), locale-aware. `[number-formatting]`
- Numbers in tables: `n.toLocaleString('es-MX')`, `tabular-nums`.
- **No mock/placeholder data in shipped views.** `AdminCategoryDetailPage` renders
  `TOP_PRODUCTS_MOCK` / `LOW_STOCK_PRODUCTS_MOCK` (English, fabricated). Either wire real
  data or hide the panel behind a "coming soon" empty state. Tracked by T13/T14 —
  the UX ticket references them.

---

## 8. Per-view checklist (paste into every UI PR)

```
[ ] Tokens only — no raw stone-*/amber-* where a semantic token exists; no gray-*
[ ] rounded-none (no rounded-sm/md/lg on content); radius only via --radius
[ ] Spacing on the 4px scale; container width per §1.4
[ ] h1 = text-3xl, one per view, serif via base layer; type roles per §2.1
[ ] Buttons via <Button variant>; one primary CTA
[ ] focus-visible ring on every interactive element; skip link + #main present
[ ] Touch targets ≥ 24px (44 for primary)
[ ] Forms: visible labels, aria-invalid, aria-describedby, role=alert errors,
    autoComplete + inputMode, error summary on multi-error submit
[ ] Loading = skeleton (>1s) or in-button spinner; no layout shift
[ ] Designed empty state
[ ] Breadcrumbs if ≥ 3 levels deep
[ ] Icons: Phosphor only, tokenized size, aria-hidden / aria-label
[ ] Images: dimensions declared, lazy below fold, real alt
[ ] prefers-reduced-motion respected; transform/opacity only
[ ] min-h-dvh not min-h-screen; no horizontal scroll at 320px
[ ] Every string via t(); aria-labels via t()
[ ] Currency formatMXN, dates formatDate, tabular-nums in tables
[ ] No mock/placeholder data
```

---

## 9. Adoption order

The per-view tickets (`UI-*`) depend on two foundational tickets landing first:

1. **`UI-foundation-tokens`** — real semantic token layer in `index.css` +
   `tailwind.config.ts`; base-layer heading font; reduced-motion rule; `min-h-dvh`
   sweep.
2. **`UI-foundation-primitives`** — re-theme shadcn primitives to `rounded-none` +
   focus rings; `Button` variants (`cta`/`outline`/`ghost`/`danger`); consolidate icons
   to Phosphor; `Breadcrumbs` + `Skeleton` + `EmptyState` shared components; skip link
   in the page shells.

Then each view gets its `-style` ticket (conformance) and `-ux` ticket (behavior /
a11y fixes).
