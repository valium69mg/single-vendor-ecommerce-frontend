import { apiFetch } from "./apiFetch";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";

export const API_FILE_URL =
  import.meta.env.VITE_API_FILE_URL || "http://localhost:8080/api/v1/file?key=";

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

export interface Category {
  categoryId: number;
  name: string;
  products: number;
  unitsSold: number;
  revenue: number;
  averagePrice: number;
  stock: number;
  imageUrl: string;
  mediumThumbnailUrl: string;
  smallThumbnailUrl: string;
}

export async function getCategories(
  page: number,
  size: number,
  token: string,
  term: string,
): Promise<PageResponse<Category>> {
  return apiFetch<PageResponse<Category>>(
    `${API_BASE_URL}/products/categories?page=${page}&size=${size}&term=${term}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
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

export interface CategoryById {
  categoryId: number;
  englishName: string;
  spanishName: string;
  products: number;
  unitsSold: number;
  revenue: number;
  averagePrice: number;
  stock: number;
  imageUrl: string;
  mediumThumbnailUrl: string;
  smallThumbnailUrl: string;
}


export async function getCategory(
  categoryId: number,
  token: string,
): Promise<CategoryById> {
  return await apiFetch<CategoryById>(
      `${API_BASE_URL}/products/categories/${categoryId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
  );
}

export interface EditCategoryMutationVariables {
  data: { englishName: string; spanishName: string };
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
    }
  );
}