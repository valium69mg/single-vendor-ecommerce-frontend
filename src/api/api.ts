import { apiFetch, apiFetchFile } from "./apiFetch";

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
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error || "Login failed");
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
  name: string;
  shortDescription: string | null;
  featured: boolean;
  status: string;
  category: { categoryId: number; name: string } | null;
  brand: { brandId: number; name: string } | null;
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
): Promise<PageResponse<PublicProduct>> {
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("size", String(size));
  if (featured !== undefined) query.set("featured", String(featured));
  if (createdAtStart) query.set("createdAtStart", createdAtStart);

  return apiFetch<PageResponse<PublicProduct>>(
    `${API_BASE_URL}/products?${query.toString()}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );
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
  return apiFetch<PageResponse<PublicCategory>>(
    `${API_BASE_URL}/products/categories?page=${page}&size=${size}&term=${term}`,
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
  return apiFetch<PageResponse<Category>>(
    `${API_BASE_URL}/admin/products/categories?page=${page}&size=${size}&term=${term}`,
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
  return apiFetch<PageResponse<AdminBrand>>(
    `${API_BASE_URL}/admin/products/brands?page=${page}&size=${size}&term=${term}`,
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
  minPrice: number;
  maxPrice: number;
  minDiscountPrice: number;
  maxDiscountPrice: number;
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
