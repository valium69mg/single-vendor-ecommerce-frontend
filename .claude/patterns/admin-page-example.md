# Reference: Admin List Page + Columns Hook

## Files
- Page: `src/pages/AdminCategoriesPage.tsx`
- Columns hook: `src/hooks/useCategoryColumns.tsx`

## Why these files
`AdminCategoriesPage` is the cleanest example of the full admin page pattern:
- Pagination + search state in the page
- `useQuery` with `throwOnError` from `useApiErrorHandler`
- `useMutation` with `invalidateQueries` on success and `handleError` on error
- Column logic delegated to a hook, delete handler passed in
- `DataTable` with all required props and translated labels
- `Modal` trigger with the correct `triggerClassName` for admin buttons

`useCategoryColumns` shows:
- `ImageModal` for image column (click image → edit image dialog)
- `Modal` with icon trigger for edit action
- `DestructiveActionButton` for delete
- `cn()` for conditional stock warning colors
- `Link` navigation from a column cell
- Date formatting with `toLocaleDateString("es-ES")`

## Key things to notice
- The page passes `handleDelete` into the columns hook — mutations live in the page, not the hook
- Query key: `["admin", "categories", page, term]` — the first two segments enable targeted invalidation
- `data ? !data.last : false` for `hasNextPage` — never pass undefined
- `setPage(page)` when term changes resets pagination (note the bug: should be `setPage(0)` — see the source)
- Column actions `id` field must be unique (`"image"`, `"actions"`) — not `accessorKey`
