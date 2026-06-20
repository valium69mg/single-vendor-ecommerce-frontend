# Conventions

## rounded-none everywhere
**Rule:** Never use default Tailwind `rounded` or shadcn rounded variants. Always `rounded-none`.
**Why:** Design system decision — the store has a sharp, luxury aesthetic. Any radius breaks the visual language.
**Example:** `<button className="rounded-none">` ✅ — `<button className="rounded-md">` ❌

## font-store-heading / font-store-body
**Rule:** Use `font-store-heading` (Cormorant serif) for h1–h3 and display text. Use `font-store-body` (Montserrat) for all other text. Never fall back to the browser default.
**Why:** Defined in `tailwind.config.ts`; body has `font-store-body` globally, but explicit classes prevent accidents.
**Example:** `<h1 className="font-store-heading text-3xl">` for page titles.

## i18n keys, never raw strings in JSX
**Rule:** All user-visible strings go through `t("key")`. Add the key to the `es` object in `src/i18n/index.ts` first.
**Why:** Enforces consistency and makes future locale additions tractable (even if only Spanish is planned).
**Example:** `<span>{t("categories")}</span>` — never `<span>Categorías</span>`.

## useToast, never import toast from sonner directly
**Rule:** Always `const { success, error } = useToast()`. Never `import { toast } from "sonner"`.
**Why:** `useToast` is a thin wrapper that may need global interception (e.g. for testing or to add context). Bypassing it creates inconsistency.

## API types colocated with functions in api.ts
**Rule:** All request/response interfaces live in `src/api/api.ts` next to the function that uses them.
**Why:** Keeps the surface area for API changes in one file. No hunting across multiple files.
**Example:** `EditCategoryMutationVariables` is defined in `api.ts`, not in `EditCategoryForm.tsx`.

## Zod schemas in src/components/auth/
**Rule:** Form schemas (Zod) live in `src/components/auth/` named `<action>-<resource>.schema.ts`.
**Why:** [Fill in — why auth/ and not a schemas/ directory?]
**Example:** `src/components/auth/create-product.schema.ts`, `src/components/auth/edit-category.schema.ts`.

## Validation error keys, not raw strings
**Rule:** Zod `.message()` values are i18n keys (e.g. `"validation.required"`), not Spanish strings.
**Why:** Zod errors bubble up to the form and get passed through `t()` before display.
**Example:** `z.string().min(1, "validation.required")` — not `z.string().min(1, "Campo requerido")`.

## Column hooks for admin tables
**Rule:** Each admin resource has a `use<Resource>Columns` hook in `src/hooks/` returning `ColumnDef[]`. The page component passes the delete handler in.
**Why:** Keeps action logic (mutations) in the page, table rendering in the hook. The hook doesn't own queries.
**Example:** `useCategoryColumns(handleDelete)` in `AdminCategoriesPage.tsx`.

## QueryKey convention: ["admin", "resource", ...params]
**Rule:** Admin queries use the prefix `["admin", "resource"]`. Include `page` and `term` as additional keys.
**Why:** Allows `invalidateQueries({ queryKey: ["admin", "categories"] })` to bust all pages/searches at once.
**Example:** `queryKey: ["admin", "categories", page, term]`

## Modal content as render prop
**Rule:** `Modal` and `ImageModal` receive `content: (onClose: () => void) => ReactNode`. The form calls `onClose()` on success.
**Why:** Lets the form close the dialog without the modal managing form state.
**Example:** `<Modal content={(onClose) => <CreateCategoryForm onClose={onClose} />} />`

## Admin buttons: bg-stone-900
**Rule:** Admin action buttons use `bg-stone-900 hover:bg-stone-800 text-white rounded-none`. Use `GenericButton` for form submissions.
**Why:** Consistent admin palette. Store CTAs use amber; admin uses neutral stone.

## Bearer token in every admin request
**Rule:** Every admin API function takes a `token: string` parameter and sets `Authorization: Bearer ${token}`. Get it from `user!.token` (asserting user is non-null after `enabled: !!user?.token`).
**Why:** Backend requires JWT auth on all `/admin/*` routes.
