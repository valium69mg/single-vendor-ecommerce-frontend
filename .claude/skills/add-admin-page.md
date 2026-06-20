# Skill: Add an Admin Page

## Overview
Admin pages follow a consistent structure: route registration → page component → columns hook → form components → API functions.

## Steps

### 1. Register the route in `src/App.tsx`
Add a nested `<Route>` under the `/admin` layout route:
```tsx
<Route path="resources" element={<AdminResourcesPage />} />
```
Import the page at the top of `App.tsx`.

### 2. Add navigation to `AdminSideBar`
Open `src/components/admin/AdminSideBar.tsx` and add a `<SideBarItem>` or entry in `<SideBarAccordion>` pointing to `/admin/resources`.

### 3. Create the page component
File: `src/pages/AdminResourcesPage.tsx`

Minimal structure:
```tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/common/DataTable";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/hooks/useToast";
import { useApiErrorHandler } from "@/hooks/useApiErrorHandler";
import SearchBar from "@/components/common/SearchBar";
import Modal from "@/components/common/Modal";
import { getAdminResources, deleteResource } from "@/api/api";
import type { AdminResource } from "@/api/api";
import { useResourceColumns } from "@/hooks/useResourceColumns";

const SIZE = 10;

export default function AdminResourcesPage() {
  const { t } = useTranslation();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { success } = useToast();
  const [page, setPage] = useState(0);
  const [term, setTerm] = useState("");
  const { handleError, throwOnError } = useApiErrorHandler();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "resources", page, term],
    queryFn: () => getAdminResources(page, SIZE, term, user!.token),
    enabled: !!user?.token,
    throwOnError,
  });

  const { mutate: handleDelete } = useMutation({
    mutationFn: (resource: AdminResource) =>
      deleteResource(resource.resourceId, user!.token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "resources"] });
      success(t("resourceDeletedSuccessfully"));
    },
    onError: (err: Error) => handleError(err, t("resourceNotDeletedSuccessfully")),
  });

  const columns = useResourceColumns(handleDelete);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-store-heading text-3xl font-semibold text-stone-900">
          {t("resources")}
        </h1>
        <Modal
          buttonName={`+ ${t("createResource")}`}
          content={(onClose) => <CreateResourceForm onClose={onClose} />}
          triggerClassName="bg-stone-900 hover:bg-stone-800 text-white hover:text-white border-stone-900 font-store-body text-sm tracking-wide h-9 px-4"
        />
      </div>

      <div className="w-1/2 sm:w-1/2 lg:w-1/4">
        <SearchBar
          placeholder={t("searchFor") + " " + t("resources").toLowerCase() + "..."}
          query={term}
          setQuery={(val) => { setTerm(val); setPage(0); }}
        />
      </div>

      <div className="overflow-x-auto">
        <DataTable
          columns={columns}
          data={data?.content ?? []}
          page={page}
          setPage={setPage}
          loading={isLoading}
          hasNextPage={data ? !data.last : false}
          labels={{
            previous: t("previous"),
            next: t("next"),
            page: t("page"),
            noResults: t("noResults"),
          }}
        />
      </div>
    </div>
  );
}
```

### 4. Create the columns hook
File: `src/hooks/useResourceColumns.tsx`

See `src/hooks/useCategoryColumns.tsx` as the reference (it's the gold standard — see `.claude/patterns/admin-page-example.md`).

Key patterns:
- Return `ColumnDef<AdminResource>[]`
- Include image column with `ImageModal` if the resource has an image
- Actions column: `Modal` for edit, `DestructiveActionButton` for delete
- Use `cn()` for conditional classes (stock warning colors, etc.)

### 5. Create form components
Files: `src/components/<resource>/Create<Resource>Form.tsx`, `Edit<Resource>Form.tsx`

Reference: `src/components/categories/EditCategoryForm.tsx`

Required pattern:
- `useForm` + `zodResolver` + schema from `src/components/auth/<action>-<resource>.schema.ts`
- `useMutation` with `onSuccess` → invalidate + `success(data.message)` + `onClose()`
- `onError` → `handleError(err, t("resourceNotMutatedSuccessfully"))`
- Render via `<Form title= description= content= footerContent= isLoading= />`
- Submit button: `<GenericButton label={t("action")} type="submit" isLoading={...} />`

### 6. Add Zod schema
File: `src/components/auth/create-resource.schema.ts`

```ts
import { z } from "zod";

export const createResourceSchema = z.object({
  name: z.string().min(3, "validation.minLength3").max(60, "validation.maxLength60"),
});

export type CreateResourceFormValues = z.infer<typeof createResourceSchema>;
```

### 7. Add i18n keys
Add to `es.translation` in `src/i18n/index.ts`:
```ts
resources: "Recursos",
createResource: "Crear recurso",
resourceDeletedSuccessfully: "...",
resourceNotDeletedSuccessfully: "...",
```

## Before you commit
- [ ] Route registered in `App.tsx`?
- [ ] Sidebar navigation added?
- [ ] Query key follows `["admin", "resources", page, term]`?
- [ ] Delete mutation invalidates `["admin", "resources"]`?
- [ ] Error handling uses `handleError` from `useApiErrorHandler`, not inline try/catch?
- [ ] All text goes through `t()`?
- [ ] New i18n keys added to `src/i18n/index.ts`?
- [ ] Schema in `src/components/auth/`?
- [ ] `rounded-none` used throughout?
- [ ] Update `.claude/CODEBASE.md` — routes and API table if new endpoints were added.
