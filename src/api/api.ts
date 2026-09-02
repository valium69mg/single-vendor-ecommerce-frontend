import { apiFetch, apiFetchFile, ApiError, ApiMovedError } from "./apiFetch";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";

export const API_FILE_URL =
  import.meta.env.VITE_API_FILE_URL || "http://localhost:8080/api/v1/file?key=";

const FALLBACK_IMAGE = "/images/landscape-placeholder.svg";

export function getFileUrl(key: string | null | undefined): string {
  if (!key) return FALLBACK_IMAGE;
  return API_FILE_URL + key;
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

  return res.json();
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

// Storefront — public categories, no auth required
export interface PublicCategory {
  categoryId: number;
  name: string;
  products: number;
  imageUrl: string | null;
  mediumThumbnailUrl: string | null;
  smallThumbnailUrl: string | null;
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
  );
}

// ─── Materials (admin) ────────────────────────────────────────────────────────

export interface AdminMaterial {
  materialId: number;
  name: string;
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
  const list = await apiFetch<AdminAttribute[]>(
    `${API_BASE_URL}/admin/products/attributes?page=${page}&size=${size}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
  // The backend returns a bare array, not a PageResponse, so exact totals and a
  // reliable `last` for an exactly-full page are not knowable frontend-only.
  // Derive honest lower bounds and keep the array-length `last` heuristic; the
  // residual (an exactly-full non-final page still reports last:false, costing
  // one wasted page+1 request) is tracked in ticket T7 / F3-backend.
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
