# Codebase Map

## Directory tree

```
src/
├── api/
│   ├── api.ts              # All API functions + TypeScript interfaces
│   └── apiFetch.ts         # Low-level fetch wrappers (apiFetch, apiFetchFile)
├── components/
│   ├── admin/              # AdminSideBar, AdminSideBarHeader, AdminSideBarFooter
│   ├── auth/               # ProtectedRoute, LoginForm, LoginButton + Zod schemas
│   ├── categories/         # CreateCategoryForm, EditCategoryForm, RestoreCategoryDialog
│   ├── common/             # Shared UI primitives (DataTable, Modal, Form, etc.)
│   ├── home/               # Store-facing components (HeroBanner, ProductSection, etc.)
│   ├── navbar/             # Navbar and its sub-components
│   ├── products/           # CreateProductForm, ProductStatusBadge
│   ├── sidebar/            # SideBarAccordion, SidebarDropdownMenu helpers
│   └── ui/                 # shadcn/ui generated components — do not edit manually
├── constants/
│   ├── apiErrors.ts        # API_ERRORS.UNAUTHORIZED / FORBIDDEN strings
│   └── roles.ts            # ROLES.USER / ROLES.ADMIN
├── context/
│   └── UserContext.tsx     # React context definition for user state
├── hooks/
│   ├── useApiErrorHandler.tsx   # Centralised error handling (401→logout, 403→toast)
│   ├── useCategoryColumns.tsx   # TanStack Table ColumnDef[] for categories
│   ├── useDebounce.tsx          # Generic debounce hook
│   ├── use-mobile.tsx           # Breakpoint hook (shadcn generated)
│   ├── useProductColumns.tsx    # TanStack Table ColumnDef[] for products
│   ├── useToast.tsx             # Thin Sonner wrapper (success/error/info/warning/promise)
│   └── useUser.tsx              # Access user context
├── i18n/index.ts           # All Spanish translations (single es locale, no JSON files)
├── lib/
│   ├── authHandler.ts      # handleUnauthorized (prevents re-entrant logouts)
│   └── utils.ts            # cn() (clsx + tailwind-merge)
├── mocks/home.ts           # MOCK_CATEGORIES, MOCK_FEATURED_PRODUCTS, MOCK_NEW_ARRIVALS, MOCK_BESTSELLERS
├── pages/
│   ├── AdminCategoriesPage.tsx
│   ├── AdminCategoryDetailPage.tsx
│   ├── AdminHomePage.tsx          # Layout route — renders AdminSideBar + <Outlet />
│   ├── AdminProductsPage.tsx
│   ├── HomePage.tsx
│   └── LoginPage.tsx
├── providers/
│   └── UserProvider.tsx    # Wraps app; stores LoginResponse in state + localStorage["loginData"]
├── test/setup.ts           # Vitest setup file (exists, suite not yet implemented)
└── App.tsx                 # Route tree root
```

## Data model

### Auth
- `LoginResponse` — `{ userId, email, name, token, role }` stored in `localStorage["loginData"]`
- Roles: `USER`, `ADMIN` (see `src/constants/roles.ts`)

### Categories
- `PublicCategory` — `{ categoryId, name, products, imageUrl, mediumThumbnailUrl, smallThumbnailUrl }`
- `Category` (admin) — adds `unitsSold`, `revenue`, `averagePrice`, `stock`, `createdAt`, `updatedAt`

### Products
- `PublicProduct` — public storefront; `minPrice`, `maxPrice`, `minDiscountPrice`, `totalStock`
- `AdminProduct` — admin panel; `avgPrice`, `avgDiscountPrice`, `variantCount`, etc.
- Products have variants (`CreateProductVariantInput`): `sku`, `price`, `discountPrice`, `stock`, `weightGrams`, `attributeValueIds`

### Supporting entities
- `AdminBrand` — `{ brandId, name }`
- `AdminMaterial` — `{ materialId, name }`
- `AdminAttribute` — `{ attributeId, name, attributeValues: AdminAttributeValue[] }`

### API response wrapper
- `PageResponse<T>` — `{ content, page, size, totalElements, totalPages, last }`
- `StandardResponse` — `{ status, message }`

## Routes

```
/login                          → LoginPage (public)
/                               → HomePage (public, no role guard)
/admin                          → AdminHomePage (ADMIN) — layout with AdminSideBar + <Outlet />
  /admin/products               → AdminProductsPage
  /admin/categories             → AdminCategoriesPage
  /admin/categories/:categoryId → AdminCategoryDetailPage
```

## API endpoints

Base URL: `VITE_API_URL` (default `http://localhost:8080/api/v1`)

| Method | Path | Auth | Function |
|---|---|---|---|
| POST | `/auth/login` | — | `loginRequest` |
| GET | `/products` | — | `getProducts` |
| GET | `/products/categories` | — | `getCategories` |
| GET | `/admin/products/categories` | ADMIN | `getAdminCategories` |
| GET | `/admin/products/categories/:id` | ADMIN | `getAdminCategory` |
| PATCH | `/admin/products/categories/:id` | ADMIN | `editCategory` |
| POST | `/admin/products/categories` | ADMIN | `createCategory` |
| DELETE | `/admin/products/categories/:id` | ADMIN | `deleteCategory` |
| PATCH | `/admin/products/categories/:id/restore` | ADMIN | `restoreCategory` |
| POST | `/admin/products/categories/:id/image` | ADMIN | `uploadCategoryImage` |
| GET | `/admin/products` | ADMIN | `getAdminProducts` |
| POST | `/admin/products` | ADMIN | `createProduct` |
| POST | `/admin/products/:id/image` | ADMIN | `uploadProductImage` |
| GET | `/admin/products/brands` | ADMIN | `getAdminBrands` |
| GET | `/admin/products/materials` | ADMIN | `getAdminMaterials` |
| GET | `/admin/products/attributes` | ADMIN | `getAdminAttributesPage` |

## External integrations

- **Backend REST API** — Spring Boot at `VITE_API_URL`; files served from `VITE_API_FILE_URL`
- **File service** — images uploaded via multipart POST; keys resolved via `getFileUrl(key)` → `API_FILE_URL + key`
- **Sonner** — toast notifications; always through `useToast()`, never import `toast` directly
- **TanStack Query** — all server state; query keys follow `["admin", "resource", ...params]` pattern

## Environment variables

```
VITE_API_URL=http://<host>:8080/api/v1
VITE_API_FILE_URL=http://<host>:8080/api/v1/file?key=
```

Also required as Docker build args. Runtime: `BACKEND_ADDRESS` injected into nginx via `envsubst`.
