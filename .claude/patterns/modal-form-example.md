# Reference: Modal Form Pattern

## File
`src/components/categories/EditCategoryForm.tsx`

## Why this file
`EditCategoryForm` is the canonical example of a complete modal form:
- Fetches existing data with `useQuery` on mount and resets the form via `useEffect` + `reset()`
- Uses `zodResolver` + schema from `src/components/auth/edit-category.schema.ts`
- `useMutation` with the correct `onSuccess` / `onError` pattern
- Handles a non-standard error type (`ApiConflictError`) alongside generic errors
- Uses `<Form>` shell with separate `content` and `footerContent` render props
- `GenericButton` shows spinner during pending state
- Calls `onClose()` from `onSuccess` to dismiss the modal

## Key things to notice

**Data pre-population:**
```tsx
const { data } = useQuery({ queryKey: ["admin", "category", categoryId], ... });
useEffect(() => {
  if (data) reset({ name: data.name });
}, [data, reset]);
```
Use `key={data?.fieldValue}` on `FormField` to force re-render if the modal is reused for different items.

**Mutation error split:**
```tsx
onError: (err) => {
  if (err instanceof ApiConflictError) {
    setConflictCategoryId(err.categoryId);   // special case
  } else {
    handleError(err, t("categoryNotEditedSuccessfully"));  // generic case
  }
}
```

**Form structure:**
```tsx
<form onSubmit={handleSubmit(onSubmit)}>
  <Form
    title={...}
    description={...}
    isLoading={isLoading}      // shows Loader while fetching existing data
    content={<FormContent ... />}
    footerContent={<FooterContent mutation={mutation} isSubmitting={isSubmitting} />}
  />
</form>
```

**Footer with error display:**
```tsx
{mutation.isError && (
  <p className="text-sm text-red-500 text-center">
    {t((mutation.error as Error).message)}
  </p>
)}
<GenericButton label={t("edit")} type="submit" isLoading={isSubmitting || mutation.isPending} />
```
