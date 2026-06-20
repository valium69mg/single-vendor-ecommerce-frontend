# Skill: Add an API Endpoint

## Where everything goes
All changes happen in a single file: `src/api/api.ts`.

## Steps

### 1. Add the TypeScript interfaces
Add request/response types directly in `api.ts`, near the other types for the same resource. Follow existing naming:
- Response types: `AdminResource`, `PublicResource`
- Mutation variable bundles: `CreateResourceMutationVariables`, `EditResourceMutationVariables`
- Use `PageResponse<T>` for paginated responses, `StandardResponse` for mutating endpoints that return `{ status, message }`

### 2. Add the API function
```ts
export async function getAdminResource(
  page: number,
  size: number,
  term: string,
  token: string,
): Promise<PageResponse<AdminResource>> {
  return apiFetch<PageResponse<AdminResource>>(
    `${API_BASE_URL}/admin/products/resources?page=${page}&size=${size}&term=${term}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
}
```

Rules:
- Public endpoints: use `apiFetch` without Authorization header.
- Admin endpoints: always include `Authorization: Bearer ${token}`. Token comes from the caller, never from a global.
- File uploads: use `apiFetchFile` instead of `apiFetch`. Do not set `Content-Type` manually — `FormData` sets the boundary automatically.
- DELETE endpoints that return 204: use `apiFetch<void>` with `await`, don't try to parse the response.

### 3. Use the function in a page or hook
```ts
import { getAdminResource } from "@/api/api";

const { data, isLoading } = useQuery({
  queryKey: ["admin", "resources", page, term],
  queryFn: () => getAdminResource(page, SIZE, term, user!.token),
  enabled: !!user?.token,
  throwOnError,   // from useApiErrorHandler()
});
```

### 4. Add i18n keys if the endpoint introduces new UI strings
Open `src/i18n/index.ts` and add keys under the `es.translation` object.

## Before you commit
- [ ] Are the new interfaces in `api.ts`, not in the component file?
- [ ] Does the function accept `token` as a parameter (not read from a global)?
- [ ] If the response is paginated, does it return `PageResponse<T>`?
- [ ] If the mutation returns a message, is it `StandardResponse`?
- [ ] Did you add the query key following `["admin", "resource", ...params]`?
- [ ] If anything unexpected happened, add it to `.claude/memory/gotchas.md`.
- [ ] If the endpoint shape differs from the `PageResponse` contract (like attributes), document it in gotchas.
