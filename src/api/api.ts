import {
  apiFetch,
  apiFetchFile,
  ApiError,
  ApiConflictError,
  ApiMovedError,
} from "./apiFetch";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";

export const API_FILE_URL =
  import.meta.env.VITE_API_FILE_URL || "http://localhost:8080/api/v1/file?key=";

const FALLBACK_IMAGE = "/images/landscape-placeholder.svg";

// Multipart field name for image uploads. Must match the backend
// `@RequestParam("file")` on the product/category image endpoints. Passed
// explicitly at each call site so the contract is pinned by assertion.
export const IMAGE_UPLOAD_FIELD = "file";

export function getFileUrl(key: string | null | undefined): string {
  if (!key) return FALLBACK_IMAGE;
  // API_FILE_URL ends in `?key=`; percent-encode so a key with reserved
  // characters (`&`, `#`, `=`, `+`, space) cannot corrupt the query string.
  return API_FILE_URL + encodeURIComponent(key);
}

export interface StandardResponse {
  status: number;
  message: string;
}

export interface LoginResponse {
  userId: string;
  email: string;
  name: string;
  token: string;
  role: string;
  isVerified: boolean;
}

export async function loginRequest(data: {
  email: string;
  password: string;
}): Promise<LoginResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error("auth.networkError");
  }

  if (!res.ok) {
    // Pre-auth endpoint: never surface API_ERRORS.UNAUTHORIZED (that drives a
    // global logout). Map to stable i18n keys the login form can localize.
    if (res.status === 401) throw new Error("auth.invalidCredentials");
    throw new Error("auth.loginFailed");
  }

  // Separate guard from the `fetch` try/catch above (which maps transport
  // failure to `auth.networkError`). A 200 whose body is not valid JSON must
  // surface as a localizable key, not a raw SyntaxError. `await` is required so
  // the rejected `res.json()` promise is caught here.
  try {
    return await res.json();
  } catch {
    throw new Error("auth.loginFailed");
  }
}

export async function registerRequest(data: {
  email: string;
  password: string;
}): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error("auth.networkError");
  }

  if (!res.ok) {
    // Pre-auth endpoint: bespoke fetch (not `apiFetch`) so a 4xx here never
    // drives the global logout path. Only duplicate email is a realistic
    // runtime 400 (client-side Zod validation already blocks policy
    // failures), so 400 maps to the specific i18n key and every other
    // non-ok status maps to the generic one.
    if (res.status === 400) throw new Error("auth.register.emailExists");
    throw new Error("auth.register.failed");
  }
}

// Backend keys from `GlobalExceptionHandler`'s `{status, error, ...metadata}`
// body (see `ApiServiceException(status, key)` in the design doc). Both
// "wrong code" and "attempts exhausted" share HTTP 400, so the body's
// `error` key — not the status alone — is the primary discriminator.
const VERIFY_ERROR_CODE_MAP: Record<string, string> = {
  verification_code_invalid: "auth.verify.codeRejected",
  verification_code_expired: "auth.verify.codeExpired",
  verification_code_attempts_exceeded: "auth.verify.attemptsExceeded",
  verification_code_rate_limited: "auth.verify.tooManyCodes",
  account_already_verified: "auth.verify.alreadyVerified",
};

// Status-only fallback, used when the body carries no recognized `error`
// key (e.g. malformed/empty body). Kept separate from the map above because
// HTTP 400 alone cannot distinguish invalid vs attempts-exceeded.
function verifyStatusFallback(status: number): string {
  if (status === 410) return "auth.verify.codeExpired";
  if (status === 429) return "auth.verify.tooManyCodes";
  if (status === 409) return "auth.verify.alreadyVerified";
  if (status === 400) return "auth.verify.codeRejected";
  return "auth.verify.failed";
}

function resendStatusFallback(status: number): string {
  if (status === 429) return "auth.verify.tooManyCodes";
  if (status === 409) return "auth.verify.alreadyVerified";
  return "auth.verify.resendFailed";
}

export async function verifyRequest(data: {
  email: string;
  code: string;
}): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/users/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error("auth.networkError");
  }

  if (!res.ok) {
    // Pre-auth-adjacent endpoint: bespoke fetch (not `apiFetch`) so a 401 or
    // 429 here never drives the global logout path.
    const body = await res.json().catch(() => null);
    const errorCode = body?.error as string | undefined;
    throw new Error(
      (errorCode && VERIFY_ERROR_CODE_MAP[errorCode]) ||
        verifyStatusFallback(res.status),
    );
  }
}

export async function resendCodeRequest(data: {
  email: string;
}): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/users/verify/resend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error("auth.networkError");
  }

  if (!res.ok) {
    // Same bespoke-fetch reasoning as verifyRequest above.
    const body = await res.json().catch(() => null);
    const errorCode = body?.error as string | undefined;
    throw new Error(
      (errorCode && VERIFY_ERROR_CODE_MAP[errorCode]) ||
        resendStatusFallback(res.status),
    );
  }
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// Storefront — public products, no auth required
export interface PublicProduct {
  productId: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  featured: boolean;
  status: string;
  category: { categoryId: number; name: string; slug: string } | null;
  brand: { brandId: number; name: string; slug: string } | null;
  imageUrl: string | null;
  mediumThumbnailUrl: string | null;
  smallThumbnailUrl: string | null;
  minPrice: number;
  maxPrice: number;
  minDiscountPrice: number;
  totalStock: number;
}

export async function getProducts(
  page: number,
  size: number,
  featured?: boolean,
  createdAtStart?: string,
  filters?: { categoryId?: number; brandId?: number },
): Promise<PageResponse<PublicProduct>> {
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("size", String(size));
  if (featured !== undefined) query.set("featured", String(featured));
  if (createdAtStart) query.set("createdAtStart", createdAtStart);
  if (filters?.categoryId !== undefined)
    query.set("categoryId", String(filters.categoryId));
  if (filters?.brandId !== undefined)
    query.set("brandId", String(filters.brandId));

  return apiFetch<PageResponse<PublicProduct>>(
    `${API_BASE_URL}/products?${query.toString()}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );
}

// Storefront — single public product with its variants, no auth required
export interface PublicVariantAttributeValue {
  attributeValueId: number;
  value: string;
}

export interface PublicProductVariant {
  productVariantId: number;
  price: number;
  discountPrice: number | null;
  stock: number;
  attributeValues: PublicVariantAttributeValue[];
}

export interface PublicProductById {
  productId: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  longDescription: string | null;
  featured: boolean;
  category: { categoryId: number; name: string; slug: string } | null;
  brand: { brandId: number; name: string; slug: string } | null;
  imageUrl: string | null;
  mediumThumbnailUrl: string | null;
  smallThumbnailUrl: string | null;
  minPrice: number;
  minDiscountPrice: number | null;
  createdAt: string;
  materials: { materialId: number; name: string }[];
  variants: PublicProductVariant[];
}

export async function getPublicProduct(
  productId: string,
): Promise<PublicProductById> {
  return apiFetch<PublicProductById>(
    `${API_BASE_URL}/products/${productId}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );
}

// Storefront — resolve a product by its slug. The backend answers 200 with the
// canonical DTO, a real HTTP 301 for a superseded slug, or 404. `fetch` follows
// the 301 transparently in the browser, but when the redirect status reaches the
// client (`ApiMovedError`) we re-fetch the canonical slug so the caller always
// ends on the current product. See `src/api/apiFetch.spike.test.ts`.
export async function getPublicProductBySlug(
  slug: string,
): Promise<PublicProductById> {
  const request = (target: string) =>
    apiFetch<PublicProductById>(`${API_BASE_URL}/products/by-slug/${target}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

  try {
    return await request(slug);
  } catch (err) {
    if (err instanceof ApiMovedError) {
      return request(err.canonicalSlug);
    }
    throw err;
  }
}

// Storefront — resolve a category by its slug. Mirrors `getPublicProductBySlug`:
// the backend answers 200 with the canonical DTO, a real HTTP 301 for a
// superseded slug, or 404. When the redirect status reaches the client
// (`ApiMovedError`) we re-fetch the canonical slug so the caller always ends on
// the current category.
export interface PublicCategoryBySlug {
  categoryId: number;
  name: string;
  slug: string;
  products: number;
  imageUrl: string | null;
  mediumThumbnailUrl: string | null;
  smallThumbnailUrl: string | null;
}

export async function getCategoryBySlug(
  slug: string,
): Promise<PublicCategoryBySlug> {
  const request = (target: string) =>
    apiFetch<PublicCategoryBySlug>(
      `${API_BASE_URL}/products/categories/by-slug/${target}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );

  try {
    return await request(slug);
  } catch (err) {
    if (err instanceof ApiMovedError) {
      return request(err.canonicalSlug);
    }
    throw err;
  }
}

// Storefront — resolve a brand by its slug, same 200 / 301 / 404 contract.
export interface PublicBrandBySlug {
  brandId: number;
  name: string;
  slug: string;
}

export async function getBrandBySlug(slug: string): Promise<PublicBrandBySlug> {
  const request = (target: string) =>
    apiFetch<PublicBrandBySlug>(
      `${API_BASE_URL}/products/brands/by-slug/${target}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );

  try {
    return await request(slug);
  } catch (err) {
    if (err instanceof ApiMovedError) {
      return request(err.canonicalSlug);
    }
    throw err;
  }
}

// Storefront — public categories, no auth required
export interface PublicCategory {
  categoryId: number;
  name: string;
  slug: string;
  products: number;
  imageUrl: string | null;
  mediumThumbnailUrl: string | null;
  smallThumbnailUrl: string | null;
}

// Storefront — public brands, no auth required. Mirrors the backend `BrandDTO`.
export interface PublicBrand {
  brandId: number;
  name: string;
  slug: string;
}

// Admin panel — requires ADMIN JWT
export interface Category {
  categoryId: number;
  name: string;
  products: number;
  unitsSold: number;
  revenue: number;
  averagePrice: number;
  stock: number;
  imageUrl: string | null;
  mediumThumbnailUrl: string | null;
  smallThumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getCategories(
  page: number,
  size: number,
  term: string,
): Promise<PageResponse<PublicCategory>> {
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("size", String(size));
  query.set("term", term);

  return apiFetch<PageResponse<PublicCategory>>(
    `${API_BASE_URL}/products/categories?${query.toString()}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );
}

export async function getBrands(
  page: number,
  size: number,
  term: string,
): Promise<PageResponse<PublicBrand>> {
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("size", String(size));
  query.set("term", term);

  return apiFetch<PageResponse<PublicBrand>>(
    `${API_BASE_URL}/products/brands?${query.toString()}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );
}

export async function getAdminCategories(
  page: number,
  size: number,
  term: string,
  token: string,
): Promise<PageResponse<Category>> {
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("size", String(size));
  query.set("term", term);

  return apiFetch<PageResponse<Category>>(
    `${API_BASE_URL}/admin/products/categories?${query.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export async function getAdminCategory(
  categoryId: number,
  token: string,
): Promise<Category> {
  return apiFetch<Category>(
    `${API_BASE_URL}/admin/products/categories/${categoryId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

/**
 * Delete an admin category.
 *
 * Contract is 204-only: the backend category DELETE endpoint returns HTTP 204
 * with no body, which `apiFetch` maps to `undefined`. This wrapper keeps the
 * `Promise<void>` signature.
 *
 * Backend dependency: a `200`-with-empty-body response would make `apiFetch`
 * attempt to parse an empty body and throw an unmapped `SyntaxError`. That is
 * intentional — it surfaces as a RED in the pinned test so a contract change is
 * noticed rather than silently swallowed.
 */
export async function deleteCategory(
  categoryId: number,
  token: string,
): Promise<void> {
  await apiFetch<void>(
    `${API_BASE_URL}/admin/products/categories/${categoryId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export interface EditCategoryMutationVariables {
  data: { name: string };
  categoryId: number;
  token: string;
}

export async function editCategory({
  data,
  categoryId,
  token,
}: EditCategoryMutationVariables): Promise<StandardResponse> {
  return await apiFetch<StandardResponse>(
    `${API_BASE_URL}/admin/products/categories/${categoryId}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export interface CreateCategoryMutationVariables {
  data: { name: string };
  token: string;
}

export async function createCategory({
  data,
  token,
}: CreateCategoryMutationVariables): Promise<StandardResponse> {
  return await apiFetch<StandardResponse>(
    `${API_BASE_URL}/admin/products/categories`,
    {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

// ─── Brands ─────────────────────────────────────────────────────────────────

export interface AdminBrand {
  brandId: number;
  name: string;
}

// `getAdminBrand` (by id) additionally returns the read-only `slug`. Kept as a
// separate type so `AdminBrand` (used by the list and the product-form select)
// stays minimal.
export interface AdminBrandById {
  brandId: number;
  name: string;
  slug: string;
}

export interface CreateBrandMutationVariables {
  data: { name: string };
  token: string;
}

export interface EditBrandMutationVariables {
  data: { name: string };
  brandId: number;
  token: string;
}

export interface RestoreBrandVariables {
  brandId: number;
  token: string;
}

export async function getAdminBrands(
  page: number,
  size: number,
  term: string,
  token: string,
): Promise<PageResponse<AdminBrand>> {
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("size", String(size));
  query.set("term", term);

  return apiFetch<PageResponse<AdminBrand>>(
    `${API_BASE_URL}/admin/products/brands?${query.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export async function getAdminBrand(
  brandId: number,
  token: string,
): Promise<AdminBrandById> {
  return apiFetch<AdminBrandById>(
    `${API_BASE_URL}/admin/products/brands/${brandId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export async function createBrand({
  data,
  token,
}: CreateBrandMutationVariables): Promise<StandardResponse> {
  return apiFetch<StandardResponse>(`${API_BASE_URL}/admin/products/brands`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function editBrand({
  data,
  brandId,
  token,
}: EditBrandMutationVariables): Promise<StandardResponse> {
  return apiFetch<StandardResponse>(
    `${API_BASE_URL}/admin/products/brands/${brandId}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export async function restoreBrand({
  brandId,
  token,
}: RestoreBrandVariables): Promise<StandardResponse> {
  return apiFetch<StandardResponse>(
    `${API_BASE_URL}/admin/products/brands/${brandId}/restore`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

/**
 * Delete an admin brand. 204-only contract, mirroring `deleteCategory`: the
 * backend returns HTTP 204 with no body, which `apiFetch` maps to `undefined`.
 */
export async function deleteBrand(
  brandId: number,
  token: string,
): Promise<void> {
  await apiFetch<void>(`${API_BASE_URL}/admin/products/brands/${brandId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}

// ─── Admin Products ───────────────────────────────────────────────────────────

export interface AdminProductCategory {
  categoryId: number;
  name: string;
}

export interface AdminProductBrand {
  brandId: number;
  name: string;
}

export interface AdminProduct {
  productId: string;
  name: string;
  shortDescription: string | null;
  featured: boolean;
  status: string;
  category: AdminProductCategory | null;
  brand: AdminProductBrand | null;
  imageUrl: string | null;
  mediumThumbnailUrl: string | null;
  smallThumbnailUrl: string | null;
  avgPrice: number;
  avgDiscountPrice: number;
  totalStock: number;
  variantCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductsParams {
  page: number;
  size: number;
  term?: string;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
  status?: string;
  featured?: boolean;
  categoryId?: number;
  brandId?: number;
}

export async function getAdminProducts(
  params: AdminProductsParams,
  token: string,
): Promise<PageResponse<AdminProduct>> {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("size", String(params.size));
  if (params.term) query.set("term", params.term);
  if (params.sortBy) {
    query.set("sortBy", params.sortBy);
    query.set("sortDirection", params.sortDirection ?? "ASC");
  }
  if (params.status) query.set("status", params.status);
  if (params.featured !== undefined) query.set("featured", String(params.featured));
  if (params.categoryId !== undefined) query.set("categoryId", String(params.categoryId));
  if (params.brandId !== undefined) query.set("brandId", String(params.brandId));

  return apiFetch<PageResponse<AdminProduct>>(
    `${API_BASE_URL}/admin/products?${query.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

// ─── Category mutations ───────────────────────────────────────────────────────

export interface RestoreCategoryVariables {
  categoryId: number;
  token: string;
}

export async function restoreCategory({
  categoryId,
  token,
}: RestoreCategoryVariables): Promise<StandardResponse> {
  return apiFetch<StandardResponse>(
    `${API_BASE_URL}/admin/products/categories/${categoryId}/restore`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export interface UploadCategoryImageVariables {
  categoryId: number;
  file: File;
  token: string;
}

export async function uploadCategoryImage({
  categoryId,
  file,
  token,
}: UploadCategoryImageVariables): Promise<StandardResponse> {
  return apiFetchFile<StandardResponse>(
    `${API_BASE_URL}/admin/products/categories/${categoryId}/image`,
    file,
    token,
    IMAGE_UPLOAD_FIELD, // backend @RequestParam("file")
  );
}

// ─── Materials (admin) ────────────────────────────────────────────────────────

export interface AdminMaterial {
  materialId: number;
  name: string;
}

export interface CreateMaterialMutationVariables {
  data: { name: string };
  token: string;
}

export interface EditMaterialMutationVariables {
  data: { name: string };
  materialId: number;
  token: string;
}

export interface RestoreMaterialVariables {
  materialId: number;
  token: string;
}

export async function getAdminMaterials(
  page: number,
  size: number,
  term: string,
  token: string,
): Promise<PageResponse<AdminMaterial>> {
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("size", String(size));
  query.set("term", term);

  return apiFetch<PageResponse<AdminMaterial>>(
    `${API_BASE_URL}/admin/products/materials?${query.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export async function getAdminMaterial(
  materialId: number,
  token: string,
): Promise<AdminMaterial> {
  return apiFetch<AdminMaterial>(
    `${API_BASE_URL}/admin/products/materials/${materialId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export async function createMaterial({
  data,
  token,
}: CreateMaterialMutationVariables): Promise<StandardResponse> {
  return apiFetch<StandardResponse>(
    `${API_BASE_URL}/admin/products/materials`,
    {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export async function editMaterial({
  data,
  materialId,
  token,
}: EditMaterialMutationVariables): Promise<StandardResponse> {
  return apiFetch<StandardResponse>(
    `${API_BASE_URL}/admin/products/materials/${materialId}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export async function restoreMaterial({
  materialId,
  token,
}: RestoreMaterialVariables): Promise<StandardResponse> {
  return apiFetch<StandardResponse>(
    `${API_BASE_URL}/admin/products/materials/${materialId}/restore`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

/**
 * Delete an admin material. 204-only contract, mirroring `deleteBrand`: the
 * backend returns HTTP 204 with no body, which `apiFetch` maps to `undefined`.
 */
export async function deleteMaterial(
  materialId: number,
  token: string,
): Promise<void> {
  await apiFetch<void>(
    `${API_BASE_URL}/admin/products/materials/${materialId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

// ─── Attributes (admin) ───────────────────────────────────────────────────────

export interface AdminAttributeValue {
  attributeValueId: number;
  value: string;
}

export interface AdminAttribute {
  attributeId: number;
  name: string;
  attributeValues: AdminAttributeValue[];
}

export async function getAdminAttributesPage(
  page: number,
  size: number,
  token: string,
): Promise<PageResponse<AdminAttribute>> {
  const body = (await apiFetch<unknown>(
    `${API_BASE_URL}/admin/products/attributes?page=${page}&size=${size}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  )) as AdminAttribute[] | { content?: AdminAttribute[] } | null | undefined;

  // The backend endpoint (AdminProductsController.getAttributes) returns a bare
  // `AdminAttribute[]` and ignores the `page`/`size` query params entirely, so
  // this wrapper synthesizes a PageResponse. Coerce any unexpected shape (null,
  // `{ content: [...] }`, or a non-array object) to an array so the synthetic
  // page below can never throw on `.length` nor infinite-page
  // (`undefined < size === false` => `last: false` forever).
  //
  // F3-backend residual (unchanged, doc-only): with a bare array an exactly-full
  // non-final page is indistinguishable from a full final page, so it reports
  // `last: false` and costs one wasted `page+1` request that returns `[]`.
  // `totalElements`/`totalPages` are cumulative lower bounds, not exact counts.
  // This adapter is removed when a real `PageResponse` endpoint ships.
  const raw = Array.isArray(body) ? body : body?.content;
  const list: AdminAttribute[] = Array.isArray(raw) ? raw : [];

  const last = list.length < size; // 0-indexed page param (initialPageParam: 0)
  return {
    content: list,
    page,
    size,
    totalElements: page * size + list.length, // cumulative lower bound
    totalPages: last ? page + 1 : page + 2, // exact when last, lower bound otherwise
    last,
  };
}

// ─── Create Product ───────────────────────────────────────────────────────────

export interface CreateProductVariantInput {
  sku: string;
  price: number;
  discountPrice?: number | null;
  stock: number;
  weightGrams?: number | null;
  attributeValueIds: number[];
}

export interface CreateProductInput {
  name: string;
  shortDescription?: string | null;
  longDescription?: string | null;
  status: string;
  featured: boolean;
  brandId?: number | null;
  categoryId?: number | null;
  materialIds: number[];
  variants: CreateProductVariantInput[];
}

export async function createProduct(
  data: CreateProductInput,
  token: string,
): Promise<StandardResponse> {
  return apiFetch<StandardResponse>(
    `${API_BASE_URL}/admin/products`,
    {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export async function uploadProductImage(
  productId: string,
  file: File,
  token: string,
): Promise<StandardResponse> {
  return apiFetchFile<StandardResponse>(
    `${API_BASE_URL}/admin/products/${productId}/image`,
    file,
    token,
    IMAGE_UPLOAD_FIELD, // backend @RequestParam("file")
  );
}

// ─── Cart (authenticated) ─────────────────────────────────────────────────────
// Backend contract (Slice 1): base path `/cart`, JWT required. Every endpoint
// returns a `CartResponse` with HTTP 200 — including DELETE (never 204). Line
// totals and the subtotal are computed server-side from the live variant price.

export interface CartItemResponse {
  cartItemId: number;
  productVariantId: number;
  productId: string;
  productName: string;
  sku: string;
  imageUrl: string | null;
  unitPrice: number;
  discountPrice: number | null;
  quantity: number;
  availableStock: number;
  lineTotal: number;
}

export interface CartResponse {
  cartId: number | null;
  items: CartItemResponse[];
  subtotal: number;
  totalItems: number;
}

export interface AddCartItemRequest {
  productVariantId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

/**
 * Raised when the backend rejects an add/update with HTTP 400 because the
 * requested quantity exceeds available stock. `availableStock` is spread onto
 * the error body root by the backend `GlobalExceptionHandler` (not nested under
 * `metadata`), so the UI can tell the shopper how many units are left.
 */
export class CartStockError extends Error {
  availableStock: number;
  constructor(message: string, availableStock: number) {
    super(message);
    this.name = "CartStockError";
    this.availableStock = availableStock;
  }
}

function mapCartStockError(error: unknown): unknown {
  if (
    error instanceof ApiError &&
    error.status === 400 &&
    error.body !== null &&
    typeof error.body === "object"
  ) {
    const stock = (error.body as Record<string, unknown>).availableStock;
    if (typeof stock === "number") {
      return new CartStockError(error.message, stock);
    }
  }
  return error;
}

function cartHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getCart(token: string): Promise<CartResponse> {
  return apiFetch<CartResponse>(`${API_BASE_URL}/cart`, {
    method: "GET",
    headers: cartHeaders(token),
  });
}

export async function addCartItem(
  body: AddCartItemRequest,
  token: string,
): Promise<CartResponse> {
  try {
    return await apiFetch<CartResponse>(`${API_BASE_URL}/cart/items`, {
      method: "POST",
      headers: cartHeaders(token),
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw mapCartStockError(error);
  }
}

export async function updateCartItem(
  cartItemId: number,
  body: UpdateCartItemRequest,
  token: string,
): Promise<CartResponse> {
  try {
    return await apiFetch<CartResponse>(
      `${API_BASE_URL}/cart/items/${cartItemId}`,
      {
        method: "PATCH",
        headers: cartHeaders(token),
        body: JSON.stringify(body),
      },
    );
  } catch (error) {
    throw mapCartStockError(error);
  }
}

export async function removeCartItem(
  cartItemId: number,
  token: string,
): Promise<CartResponse> {
  return apiFetch<CartResponse>(`${API_BASE_URL}/cart/items/${cartItemId}`, {
    method: "DELETE",
    headers: cartHeaders(token),
  });
}

// ─── Cart merge (guest → authenticated transition) ─────────────────────────
// Backend clamps quantities to stock and skips invalid variants server-side
// instead of rejecting, so `mergeCart` intentionally does NOT wrap errors with
// `mapCartStockError` — a thrown error here only means a genuine transport/
// auth/500 failure, which the caller treats as "merge failed, preserve
// localStorage".

export interface MergeCartLineRequest {
  productVariantId: number;
  quantity: number;
}

export interface MergeCartAdjustment {
  productVariantId: number;
  requestedQuantity: number;
  finalQuantity: number;
}

export interface MergeCartSkip {
  productVariantId: number;
  reason: string;
}

export interface MergeCartResponse {
  cart: CartResponse;
  adjustedLines: MergeCartAdjustment[];
  skippedLines: MergeCartSkip[];
}

export async function mergeCart(
  items: MergeCartLineRequest[],
  token: string,
): Promise<MergeCartResponse> {
  return apiFetch<MergeCartResponse>(`${API_BASE_URL}/cart/merge`, {
    method: "POST",
    headers: cartHeaders(token),
    body: JSON.stringify({ items }),
  });
}

// ─── Orders / checkout (authenticated) ─────────────────────────────────────
// Backend contract: base path `/orders`, JWT required. `POST /orders` creates
// an order from the caller's current cart (HTTP 201) or rejects with 400
// (`order_cart_empty`) or 409 (stock/availability conflicts, `conflicts[]`).
// `GET /orders` lists the caller's own orders, most recent first. `GET
// /orders/{orderNumber}` returns detail, 404 (`order_not_found`) if unknown
// or not owned by the caller.

export interface ShippingAddress {
  recipient: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface CreateOrderRequest {
  shippingAddress: ShippingAddress;
}

export interface OrderItemResponse {
  orderItemId: number;
  productVariantId: number;
  productName: string;
  variantLabel: string | null;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderResponse {
  orderId: number;
  orderNumber: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingAddress: ShippingAddress;
  items: OrderItemResponse[];
  createdAt: string;
}

export interface OrderSummaryResponse {
  orderNumber: string;
  status: string;
  total: number;
  totalItems: number;
  createdAt: string;
}

export type StockConflictType = "STOCK_INSUFFICIENT" | "PRODUCT_UNAVAILABLE";

export interface StockConflict {
  productVariantId: number;
  type: StockConflictType;
  requestedQuantity: number;
  availableStock: number;
}

/**
 * Raised when checkout is rejected with HTTP 409 because one or more lines
 * exceed available stock or reference a now-unavailable product. Unlike
 * `CartStockError` (a single `availableStock` scalar), checkout needs every
 * offending line in one round trip so `/checkout` can clamp all of them
 * inline without a redirect — hence the `conflicts` list.
 */
export class CheckoutStockConflictError extends Error {
  conflicts: StockConflict[];
  constructor(message: string, conflicts: StockConflict[]) {
    super(message);
    this.name = "CheckoutStockConflictError";
    this.conflicts = conflicts;
  }
}

function mapCheckoutConflictError(error: unknown): unknown {
  if (error instanceof ApiConflictError) {
    const body = error.body as Record<string, unknown> | null;
    const conflicts = body?.conflicts;
    if (Array.isArray(conflicts)) {
      return new CheckoutStockConflictError(
        error.message,
        conflicts as StockConflict[],
      );
    }
  }
  return error;
}

export async function createOrder(
  payload: CreateOrderRequest,
  token: string,
): Promise<OrderResponse> {
  try {
    return await apiFetch<OrderResponse>(`${API_BASE_URL}/orders`, {
      method: "POST",
      headers: cartHeaders(token),
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw mapCheckoutConflictError(error);
  }
}

export async function getMyOrders(
  token: string,
): Promise<OrderSummaryResponse[]> {
  return apiFetch<OrderSummaryResponse[]>(`${API_BASE_URL}/orders`, {
    method: "GET",
    headers: cartHeaders(token),
  });
}

export async function getOrder(
  orderNumber: string,
  token: string,
): Promise<OrderResponse> {
  return apiFetch<OrderResponse>(
    `${API_BASE_URL}/orders/${orderNumber}`,
    {
      method: "GET",
      headers: cartHeaders(token),
    },
  );
}

// ─── Account: profile (authenticated) ──────────────────────────────────────
// Backend contract: `GET /users/me` returns `UserProfile`; `PATCH /users/me`
// updates only the 3 name parts + phone and returns `StandardResponse`
// (email/username in the body are silently ignored); `POST
// /users/me/profile-image` is multipart and returns the updated `UserProfile`.

export interface UserProfile {
  firstName: string | null;
  paternalLastName: string | null;
  maternalLastName: string | null;
  phone: string | null;
  email: string;
  username: string;
  profileImageUrl: string | null;
  profileImageThumbnailUrl: string | null;
}

export interface UpdateProfilePayload {
  firstName?: string;
  paternalLastName?: string;
  maternalLastName?: string;
  phone?: string;
}

export async function getMe(token: string): Promise<UserProfile> {
  return apiFetch<UserProfile>(`${API_BASE_URL}/users/me`, {
    method: "GET",
    headers: cartHeaders(token),
  });
}

export async function updateMe(
  payload: UpdateProfilePayload,
  token: string,
): Promise<StandardResponse> {
  return apiFetch<StandardResponse>(`${API_BASE_URL}/users/me`, {
    method: "PATCH",
    headers: cartHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function uploadProfileImage(
  file: File,
  token: string,
): Promise<UserProfile> {
  return apiFetchFile<UserProfile>(
    `${API_BASE_URL}/users/me/profile-image`,
    file,
    token,
    IMAGE_UPLOAD_FIELD, // backend @RequestParam("file")
  );
}

// ─── Account: shipping addresses (authenticated) ───────────────────────────
// Backend contract: base path `/users/me/addresses`, JWT required. Mutations
// return `StandardResponse`; `DELETE` returns 204. The postal-code trust
// boundary is server-side — the client just sends its best guess for
// state/municipality/city and the server overrides them on a catalog hit.

export interface Address {
  addressId: number;
  recipientName: string;
  street: string;
  exteriorNumber: string;
  interiorNumber: string | null;
  neighborhood: string;
  postalCode: string;
  city: string | null;
  state: string;
  municipality: string;
  phone: string;
  referenceNotes: string | null;
  isDefault: boolean;
  cpVerified: boolean;
  coloniaVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddressInput {
  recipientName: string;
  street: string;
  exteriorNumber: string;
  interiorNumber?: string;
  neighborhood: string;
  postalCode: string;
  city?: string;
  state: string;
  municipality: string;
  phone: string;
  referenceNotes?: string;
  isDefault?: boolean;
}

export interface PostalCodeLookup {
  cp: string;
  state: string;
  municipality: string;
  city: string | null;
  colonias: string[];
}

export async function listAddresses(token: string): Promise<Address[]> {
  return apiFetch<Address[]>(`${API_BASE_URL}/users/me/addresses`, {
    method: "GET",
    headers: cartHeaders(token),
  });
}

export async function createAddress(
  input: AddressInput,
  token: string,
): Promise<StandardResponse> {
  return apiFetch<StandardResponse>(`${API_BASE_URL}/users/me/addresses`, {
    method: "POST",
    headers: cartHeaders(token),
    body: JSON.stringify(input),
  });
}

export async function updateAddress(
  id: number,
  input: AddressInput,
  token: string,
): Promise<StandardResponse> {
  return apiFetch<StandardResponse>(`${API_BASE_URL}/users/me/addresses/${id}`, {
    method: "PATCH",
    headers: cartHeaders(token),
    body: JSON.stringify(input),
  });
}

export async function deleteAddress(id: number, token: string): Promise<void> {
  await apiFetch<void>(`${API_BASE_URL}/users/me/addresses/${id}`, {
    method: "DELETE",
    headers: cartHeaders(token),
  });
}

export async function setDefaultAddress(
  id: number,
  token: string,
): Promise<StandardResponse> {
  return apiFetch<StandardResponse>(
    `${API_BASE_URL}/users/me/addresses/${id}/default`,
    {
      method: "PATCH",
      headers: cartHeaders(token),
    },
  );
}

/**
 * Public SEPOMEX lookup — NO Authorization header (the endpoint is whitelisted).
 * Callers treat `ApiError.status === 404` as the soft path (genuine catalog
 * miss), NOT `ApiConflictError`.
 */
export async function lookupPostalCode(cp: string): Promise<PostalCodeLookup> {
  return apiFetch<PostalCodeLookup>(
    `${API_BASE_URL}/catalog/postal-codes/${cp}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );
}
